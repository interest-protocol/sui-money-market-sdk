import { toHEX } from '@mysten/bcs';
import {
  isValidSuiAddress,
  JsonRpcProvider,
  TransactionBlock,
} from '@mysten/sui.js';
import { bcs, SUI_CLOCK_OBJECT_ID } from '@mysten/sui.js';
import { pathOr, propOr } from 'ramda';
import invariant from 'tiny-invariant';

import {
  Network,
  OBJECT_RECORD,
  ZERO_ADDRESS,
} from '@/constants';
import {
  getAllDynamicFields,
  getReturnValuesFromInspectResults,
} from '@/utils';
import { DepositArgs, PromisedTransactionBlock } from './sdk.types';


export class SDK {
  constructor(
    public readonly provider: JsonRpcProvider,
    public readonly network: Network,
  ) {
    invariant(Object.values(Network).includes(network), 'Invalid network');
  }

  public deposit({
    txb,
    assetList,
    assetValue,
    assetType
  }: DepositArgs): TransactionBlock {
    invariant(+assetValue > 0, 'Cannot add assetValue');

    const objects = OBJECT_RECORD[this.network];

    txb.moveCall({
      target: `${objects.MONEY_MARKET_PACKAGE_ID}::ipx_money_market_sdk_interface::deposit`,
      typeArguments: [assetType],
      arguments: [
        txb.object(objects.MONEY_MARKET_STORAGE),
        txb.object(objects.MONEY_MARKET_INTEREST_RATE_STORAGE),
        txb.object(objects.IPX_STORAGE),
        txb.object(SUI_CLOCK_OBJECT_ID),
        txb.makeMoveVec({
          objects: assetList,
        }),
        txb.pure(assetValue)
      ],
    });

    return txb;
  }
}
