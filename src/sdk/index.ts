import { BCS } from '@mysten/bcs';
import {
  isValidSuiAddress,
  JsonRpcProvider,
  SUI_TYPE_ARG,
  TransactionArgument,
  TransactionBlock,
} from '@mysten/sui.js';
import { SUI_CLOCK_OBJECT_ID } from '@mysten/sui.js';
import { PriceServiceConnection } from '@pythnetwork/price-service-client';
import { BigNumber } from 'bignumber.js';
import { propOr } from 'ramda';
import invariant from 'tiny-invariant';

import {
  marketBCS,
  MILLISECONDS_PER_YEAR,
  MONEY_MARKET_DECIMALS,
  MONEY_MARKET_KEYS,
  MONEY_MARKET_OBJECTS,
  Network,
  ORACLE_PRICE_COIN_NAMES,
  PYTH_PRICE_CONNECT_URL,
  PYTH_PRICE_FEED_ID_TO_PRICE_INFO_OBJECT,
  PYTH_PRICE_FEED_IDS,
  SUID_TYPE,
  SWITCHBOARD_AGGREGATOR_IDS,
  ZERO_ADDRESS,
} from '@/constants';
import { getReturnValuesFromInspectResults } from '@/utils';

import { Rebase } from './rebase';
import {
  BorrowArgs,
  DepositArgs,
  EnterMarketArgs,
  EntryFuncArgs,
  ExitMarketArgs,
  GetAllRewardsArgs,
  GetMarketsArgs,
  GetRewardsArgs,
  LiquidateArgs,
  MoneyMarketRecord,
  PromisedTransactionBlock,
  RepayArgs,
  WithdrawArgs,
} from './sdk.types';

export class SDK {
  protected constructor(
    public readonly provider: JsonRpcProvider,
    public readonly network: Network,
  ) {
    invariant(Object.values(Network).includes(network), 'Invalid network');
  }

  public static getDevNetSDK(provider: JsonRpcProvider): SDK {
    return new SDK(provider, Network.DEVNET);
  }

  public static getTestNetSDK(provider: JsonRpcProvider): SDK {
    return new SDK(provider, Network.TESTNET);
  }

  public static getMainNetSDK(provider: JsonRpcProvider): SDK {
    return new SDK(provider, Network.MAINNET);
  }

  /**
   * @notice It returns all the markets listed in the Money Market Protocol
   * @param sender The address of the sender of the transaction.
   * @return Record of The Money Market. The key is the coin of the market
   */
  public async getMarkets({
    sender = ZERO_ADDRESS,
  }: GetMarketsArgs): Promise<MoneyMarketRecord> {
    invariant(isValidSuiAddress(sender), 'Invalid Sui address');

    const txb = new TransactionBlock();

    const objects = MONEY_MARKET_OBJECTS[this.network];
    const marketsKeys = MONEY_MARKET_KEYS[this.network];

    txb.moveCall({
      target: `${objects.DASHBOARD_PACKAGE_ID}::dashboard::get_markets`,
      arguments: [
        txb.object(objects.MONEY_MARKET_STORAGE),
        txb.object(objects.INTEREST_RATE_STORAGE),
        txb.object(SUI_CLOCK_OBJECT_ID),
        txb.pure(sender, BCS.ADDRESS),
      ],
    });

    const result = await this.provider.devInspectTransactionBlock({
      transactionBlock: txb,
      sender,
    });

    const values = getReturnValuesFromInspectResults(result);

    if (!values || !values.length) return {};

    const rawData = values.map(
      x =>
        marketBCS.de('vector<Market>', Uint8Array.from(x[0])) as Record<
          string,
          unknown
        >[],
    );

    if (!rawData.length || rawData[0].length !== marketsKeys.length)
      return {} as MoneyMarketRecord;

    return marketsKeys.reduce((acc, rawKey, currentIndex) => {
      const key = rawKey.replace(
        /\b0x0000000000000000000000000000000000000000000000000000000000000002::sui::SUI\b/g,
        SUI_TYPE_ARG,
      );

      const data = rawData[0][currentIndex];

      const accruedTimestamp = BigNumber(propOr(0, 'accrued_timestamp', data));

      const timeElapsed = new Date().getTime() - accruedTimestamp.toNumber();
      const supplyRatePerMS = BigNumber(propOr(0, 'supply_rate', data));
      const borrowRatePerMS = BigNumber(propOr(0, 'borrow_rate', data));

      const totalCollateralBase = BigNumber(
        propOr(0, 'total_collateral_base', data),
      );
      const totalCollateralElastic = BigNumber(
        propOr(0, 'total_collateral_elastic', data),
      ).plus(supplyRatePerMS.multipliedBy(timeElapsed));

      const totalLoanBase = BigNumber(propOr(0, 'total_loan_base', data));
      const totalLoanElastic = BigNumber(
        propOr(0, 'total_loan_elastic', data),
      ).plus(borrowRatePerMS.multipliedBy(timeElapsed));

      return {
        ...acc,
        [key]: {
          supplyRatePerYear: BigNumber(
            propOr(0, 'supply_rate', data),
          ).multipliedBy(MILLISECONDS_PER_YEAR),
          borrowRatePerYear: BigNumber(
            propOr(0, 'borrow_rate', data),
          ).multipliedBy(MILLISECONDS_PER_YEAR),
          cash: BigNumber(propOr(0, 'cash', data)),
          collateralEnabled: propOr(
            false,
            'collateral_enabled',
            data,
          ) as boolean,
          canBeCollateral: propOr(false, 'can_be_collateral', data) as boolean,
          allocationPoints: BigNumber(propOr(0, 'allocation_points', data)),
          userPrincipal: BigNumber(propOr(0, 'user_principal', data)),
          userShares: BigNumber(propOr(0, 'user_shares', data)),
          userLoanPendingRewards: BigNumber(
            propOr(0, 'user_loan_pending_rewards', data),
          ),
          userCollateralPendingRewards: BigNumber(
            propOr(0, 'user_collateral_pending_rewards', data),
          ),
          totalCollateralElastic,
          totalCollateralBase,
          totalLoanElastic,
          totalLoanBase,
          borrowCap: BigNumber(propOr(0, 'borrow_cap', data)),
          collateralCap: BigNumber(propOr(0, 'collateral_cap', data)),
          LTV: BigNumber(propOr(0, 'ltv', data)),
          accruedTimestamp,
          decimals: MONEY_MARKET_DECIMALS[this.network][key],
          totalLoanRebase: new Rebase(totalLoanBase, totalLoanElastic),
          totalCollateralRebase: new Rebase(
            totalCollateralBase,
            totalCollateralElastic,
          ),
        },
      };
    }, {} as MoneyMarketRecord);
  }

  public enterMarket({
    txb: _txb,
    assetType,
  }: EnterMarketArgs): TransactionBlock {
    invariant(
      MONEY_MARKET_KEYS[this.network].includes(assetType),
      `${assetType} is not supported`,
    );

    const objects = MONEY_MARKET_OBJECTS[this.network];
    const txb = _txb ? _txb : new TransactionBlock();

    txb.moveCall({
      target: `${objects.MONEY_MARKET_PACKAGE_ID}::ipx_money_market_sdk_interface::enter_market`,
      typeArguments: [assetType],
      arguments: [txb.object(objects.MONEY_MARKET_STORAGE)],
    });

    return txb;
  }

  public async exitMarket({
    txb: _txb,
    assetType,
  }: ExitMarketArgs): PromisedTransactionBlock {
    invariant(
      MONEY_MARKET_KEYS[this.network].includes(assetType),
      `${assetType} is not supported`,
    );
    const objects = MONEY_MARKET_OBJECTS[this.network];

    const txb = _txb ? _txb : new TransactionBlock();

    txb.moveCall({
      target: `${objects.MONEY_MARKET_PACKAGE_ID}::ipx_money_market_sdk_interface::exit_market`,
      typeArguments: [assetType],
      arguments: [
        txb.object(objects.MONEY_MARKET_STORAGE),
        txb.object(objects.INTEREST_RATE_STORAGE),
        txb.makeMoveVec({
          type: `${objects.ORACLE_PACKAGE_ID}::ipx_oracle::Price`,
          objects: await this.getPricePotatoesVector({ txb }),
        }),
        txb.object(SUI_CLOCK_OBJECT_ID),
      ],
    });

    return txb;
  }

  /**
   * @notice It allows the sender to deposit coins in the Money Market Protocol
   * @dev The Money Market Protocol will return any additional value send via assetList in a new Coin to the sender
   * @param txb A TransactionBlock to add the deposit call
   * @param assetList A list of Coin objects to send to the Money Market
   * @param assetValue The total value to deposit in the Money market Protocol
   * @param assetType The Coin type
   */
  public deposit({
    txb: _txb,
    assetList,
    assetValue,
    assetType,
  }: DepositArgs): TransactionBlock {
    invariant(+assetValue > 0, 'assetValue must be greater than zero');
    invariant(
      MONEY_MARKET_KEYS[this.network].includes(assetType),
      `${assetType} is not supported`,
    );
    invariant(assetList.length > 0, 'You must deposit coins');

    const objects = MONEY_MARKET_OBJECTS[this.network];

    const txb = _txb ? _txb : new TransactionBlock();

    txb.moveCall({
      target: `${objects.MONEY_MARKET_PACKAGE_ID}::ipx_money_market_sdk_interface::deposit`,
      typeArguments: [assetType],
      arguments: [
        txb.object(objects.MONEY_MARKET_STORAGE),
        txb.object(objects.INTEREST_RATE_STORAGE),
        txb.object(SUI_CLOCK_OBJECT_ID),
        txb.makeMoveVec({
          objects: assetList,
        }),
        txb.pure(assetValue.toString(), BCS.U64),
      ],
    });

    return txb;
  }

  /**
   * @notice It allows the sender to withdraw his deposit. Please make sure that there is enough cash to withdraw.
   * @dev The Money Market Protocol will return any additional value send via assetList in a new Coin to the sender
   * @param txb A TransactionBlock to add the withdrawal call
   * @param assetType The Coin type
   * @param sharesToRemove The number of deposit shares to remove
   */
  public async withdraw({
    txb: _txb,
    assetType,
    sharesToRemove,
  }: WithdrawArgs): PromisedTransactionBlock {
    invariant(+sharesToRemove > 0, 'sharesToRemove must be greater than zero');
    invariant(
      MONEY_MARKET_KEYS[this.network].includes(assetType),
      `${assetType} is not supported`,
    );
    const objects = MONEY_MARKET_OBJECTS[this.network];

    const txb = _txb ? _txb : new TransactionBlock();

    txb.moveCall({
      target: `${objects.MONEY_MARKET_PACKAGE_ID}::ipx_money_market_sdk_interface::withdraw`,
      typeArguments: [assetType],
      arguments: [
        txb.object(objects.MONEY_MARKET_STORAGE),
        txb.object(objects.INTEREST_RATE_STORAGE),
        txb.makeMoveVec({
          type: `${objects.ORACLE_PACKAGE_ID}::ipx_oracle::Price`,
          objects: await this.getPricePotatoesVector({ txb }),
        }),
        txb.object(SUI_CLOCK_OBJECT_ID),
        txb.pure(sharesToRemove, BCS.U64),
      ],
    });

    return txb;
  }

  /**
   * @notice It allows a user to borrow a coin from the Money Market
   * @param txb A TransactionBlock to add the borrow call
   * @param assetType the Coin Type
   * @param borrowValue The number of Coins to borrow
   */
  public async borrow({
    txb: _txb,
    assetType,
    borrowValue,
  }: BorrowArgs): PromisedTransactionBlock {
    invariant(+borrowValue > 0, 'sharesToRemove must be greater than zero');
    invariant(
      MONEY_MARKET_KEYS[this.network].includes(assetType),
      `${assetType} is not supported`,
    );

    const txb = _txb ? _txb : new TransactionBlock();

    const objects = MONEY_MARKET_OBJECTS[this.network];

    const pricePotato = await this.getPricePotatoesVector({ txb });

    if (assetType === SUID_TYPE[this.network]) {
      txb.moveCall({
        target: `${objects.MONEY_MARKET_PACKAGE_ID}::ipx_money_market_sdk_interface::borrow_suid`,
        arguments: [
          txb.object(objects.MONEY_MARKET_STORAGE),
          txb.object(objects.INTEREST_RATE_STORAGE),
          txb.object(objects.SUID_STORAGE),
          txb.makeMoveVec({
            type: `${objects.ORACLE_PACKAGE_ID}::ipx_oracle::Price`,
            objects: pricePotato,
          }),
          txb.object(SUI_CLOCK_OBJECT_ID),
          txb.pure(borrowValue, BCS.U64),
        ],
      });
    } else {
      txb.moveCall({
        target: `${objects.MONEY_MARKET_PACKAGE_ID}::ipx_money_market_sdk_interface::borrow`,
        typeArguments: [assetType],
        arguments: [
          txb.object(objects.MONEY_MARKET_STORAGE),
          txb.object(objects.INTEREST_RATE_STORAGE),
          txb.makeMoveVec({
            type: `${objects.ORACLE_PACKAGE_ID}::ipx_oracle::Price`,
            objects: pricePotato,
          }),
          txb.object(SUI_CLOCK_OBJECT_ID),
          txb.pure(borrowValue, BCS.U64),
        ],
      });
    }

    return txb;
  }

  /**
   * @notice It allows a user to repay his loan. The loan is accrued every millisecond. So please send more value than the current loan. The contract will refund any extra.
   * @param txb A TransactionBlock to add the repay call
   * @param assetType The type of the Coin
   * @param principalToRepay The number of principal shares to repay.
   * @param assetValue The value of coins to send
   * @param assetList A list of coins to send
   */
  public repay({
    txb: _txb,
    assetType,
    principalToRepay,
    assetValue,
    assetList,
  }: RepayArgs): TransactionBlock {
    invariant(+assetValue > 0, 'assetValue must be greater than zero');
    invariant(
      +principalToRepay > 0,
      'principalToRepay must be greater than zero',
    );
    invariant(
      MONEY_MARKET_KEYS[this.network].includes(assetType),
      `${assetType} is not supported`,
    );
    invariant(assetList.length > 0, 'You must send coins to repay');

    const txb = _txb ? _txb : new TransactionBlock();

    const objects = MONEY_MARKET_OBJECTS[this.network];

    if (assetType === SUID_TYPE[this.network]) {
      txb.moveCall({
        target: `${objects.MONEY_MARKET_PACKAGE_ID}::ipx_money_market_sdk_interface::repay_suid`,
        arguments: [
          txb.object(objects.MONEY_MARKET_STORAGE),
          txb.object(objects.SUID_STORAGE),
          txb.object(SUI_CLOCK_OBJECT_ID),
          txb.makeMoveVec({
            objects: assetList,
          }),
          txb.pure(assetValue, BCS.U64),
          txb.pure(principalToRepay, BCS.U64),
        ],
      });
    } else {
      txb.moveCall({
        target: `${objects.MONEY_MARKET_PACKAGE_ID}::ipx_money_market_sdk_interface::repay`,
        typeArguments: [assetType],
        arguments: [
          txb.object(objects.MONEY_MARKET_STORAGE),
          txb.object(objects.INTEREST_RATE_STORAGE),
          txb.object(SUI_CLOCK_OBJECT_ID),
          txb.makeMoveVec({
            objects: assetList,
          }),
          txb.pure(assetValue, BCS.U64),
          txb.pure(principalToRepay, BCS.U64),
        ],
      });
    }

    return txb;
  }

  public async getPricePotatoesVector({
    txb: _txb,
  }: EntryFuncArgs): Promise<TransactionArgument[]> {
    const pythPriceFeedIds = PYTH_PRICE_FEED_IDS[this.network];

    const pythConnection = new PriceServiceConnection(
      PYTH_PRICE_CONNECT_URL[this.network],
      {
        priceFeedRequestConfig: {
          binary: true,
        },
      },
    );

    const vaas = await pythConnection.getLatestVaas(pythPriceFeedIds);

    const txb = _txb ? _txb : new TransactionBlock();

    const pythPayments = txb.splitCoins(
      txb.gas,
      pythPriceFeedIds.map(() => txb.pure('1')),
    );

    const pricePotato = [] as TransactionArgument[];

    const objects = MONEY_MARKET_OBJECTS[this.network];

    vaas.forEach((vaa, index) => {
      const priceFeed = pythPriceFeedIds[index];

      const price = txb.moveCall({
        target: `${objects.ORACLE_PACKAGE_ID}::ipx_oracle::get_price`,
        arguments: [
          txb.object(objects.ORACLE_STORAGE),
          txb.object(objects.WORMHOLE_STATE),
          txb.object(objects.PYTH_STATE),
          txb.pure([...Buffer.from(vaa, 'base64')]),
          txb.object(
            PYTH_PRICE_FEED_ID_TO_PRICE_INFO_OBJECT[this.network][priceFeed],
          ),
          pythPayments[index],
          txb.object(SUI_CLOCK_OBJECT_ID),
          txb.object(SWITCHBOARD_AGGREGATOR_IDS[this.network][index]),
          txb.pure(ORACLE_PRICE_COIN_NAMES[this.network][index]),
        ],
      });

      pricePotato.push(price);
    });

    return pricePotato;
  }

  /**
   * @notice It allows a sender to collect the IPX rewards from a market
   * @param txb A TransactionBlock to add the getRewards call
   * @param assetType The Coin type
   */
  public getRewards({
    txb: _txb,
    assetType,
  }: GetRewardsArgs): TransactionBlock {
    invariant(
      MONEY_MARKET_KEYS[this.network].includes(assetType),
      `${assetType} is not supported`,
    );
    const objects = MONEY_MARKET_OBJECTS[this.network];

    const txb = _txb ? _txb : new TransactionBlock();

    txb.moveCall({
      target: `${objects.MONEY_MARKET_PACKAGE_ID}::ipx_money_market_sdk_interface::get_rewards`,
      typeArguments: [assetType],
      arguments: [
        txb.object(objects.MONEY_MARKET_STORAGE),
        txb.object(objects.INTEREST_RATE_STORAGE),
        txb.object(objects.IPX_STORAGE),
        txb.object(SUI_CLOCK_OBJECT_ID),
      ],
    });

    return txb;
  }

  /**
   * @notice It allows a sender to collect the IPX rewards from all markets
   * @param txb A TransactionBlock to add the get_all_Rewards call
   */
  public getAllRewards({ txb: _txb }: GetAllRewardsArgs): TransactionBlock {
    const objects = MONEY_MARKET_OBJECTS[this.network];

    const txb = _txb ? _txb : new TransactionBlock();

    txb.moveCall({
      target: `${objects.MONEY_MARKET_PACKAGE_ID}::ipx_money_market_sdk_interface::get_all_rewards`,
      arguments: [
        txb.object(objects.MONEY_MARKET_STORAGE),
        txb.object(objects.INTEREST_RATE_STORAGE),
        txb.object(objects.IPX_STORAGE),
        txb.object(SUI_CLOCK_OBJECT_ID),
      ],
    });

    return txb;
  }

  /**
   * @notice It liquidates an underwater position. The contract will send any extra coins sent. Feel free to send more coins than the value to be liquidated
   * @param txb A Transaction Block to add the liquidate call
   * @param borrower The account that will be liquidated
   * @param collateralAssetType The collateral asset of the borrower that will be liquidated
   * @param loanAssetType The Coin Type of the loan that will be liquidated
   * @param loanAssetValue The value of Coin of the loan
   * @param loanAssetList A list of the coins to send
   */
  public async liquidate({
    txb: _txb,
    borrower,
    collateralAssetType,
    loanAssetType,
    loanAssetValue,
    loanAssetList,
  }: LiquidateArgs): PromisedTransactionBlock {
    invariant(+loanAssetValue > 0, 'loanAssetValue must be greater than zero');
    invariant(
      MONEY_MARKET_KEYS[this.network].includes(collateralAssetType),
      `${collateralAssetType} is not supported`,
    );
    invariant(
      MONEY_MARKET_KEYS[this.network].includes(loanAssetType),
      `${loanAssetType} is not supported`,
    );
    invariant(loanAssetList.length > 0, 'You must send coins to repay');
    invariant(isValidSuiAddress(borrower), 'Invalid borrower');

    const suidType = SUID_TYPE[this.network];

    invariant(collateralAssetType !== suidType, 'SUID cannot be collateral');

    const objects = MONEY_MARKET_OBJECTS[this.network];

    const txb = _txb ? _txb : new TransactionBlock();

    const pricePotato = await this.getPricePotatoesVector({ txb });

    if (loanAssetType === suidType) {
      txb.moveCall({
        target: `${objects.MONEY_MARKET_PACKAGE_ID}::ipx_money_market_sdk_interface::liquidate_suid`,
        typeArguments: [collateralAssetType],
        arguments: [
          txb.object(objects.MONEY_MARKET_STORAGE),
          txb.object(objects.INTEREST_RATE_STORAGE),
          txb.object(objects.SUID_STORAGE),
          txb.makeMoveVec({
            type: `${objects.ORACLE_PACKAGE_ID}::ipx_oracle::Price`,
            objects: pricePotato,
          }),
          txb.object(SUI_CLOCK_OBJECT_ID),
          txb.makeMoveVec({
            objects: loanAssetList,
          }),
          txb.pure(loanAssetValue, BCS.U64),
          txb.pure(borrower, BCS.ADDRESS),
        ],
      });
    } else {
      txb.moveCall({
        target: `${objects.MONEY_MARKET_PACKAGE_ID}::ipx_money_market_sdk_interface::liquidate`,
        typeArguments: [collateralAssetType, loanAssetType],
        arguments: [
          txb.object(objects.MONEY_MARKET_STORAGE),
          txb.object(objects.INTEREST_RATE_STORAGE),
          txb.makeMoveVec({
            type: `${objects.ORACLE_PACKAGE_ID}::ipx_oracle::Price`,
            objects: pricePotato,
          }),
          txb.object(SUI_CLOCK_OBJECT_ID),
          txb.makeMoveVec({
            objects: loanAssetList,
          }),
          txb.pure(loanAssetValue, BCS.U64),
          txb.pure(borrower, BCS.ADDRESS),
        ],
      });
    }
    return txb;
  }

  /**
   * @notice It returns the type of SUID "packageId::moduleName::OTW"
   */
  public getSUIDType(): string {
    return SUID_TYPE[this.network];
  }

  public getMoneyMarketConstants() {
    return MONEY_MARKET_OBJECTS[this.network];
  }

  public getMoneyMarketKeys() {
    return MONEY_MARKET_KEYS[this.network];
  }
}
