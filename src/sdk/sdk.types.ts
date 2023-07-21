import {
  MakeMoveVecTransaction,
  SuiAddress,
  TransactionBlock,
} from '@mysten/sui.js';
import { BigNumber } from 'bignumber.js';

import { Rebase } from './rebase';

type SuiObject = MakeMoveVecTransaction['objects'][number];
type Coin = SuiObject;
export type PromisedTransactionBlock = Promise<TransactionBlock>;

export interface EntryFuncArgs {
  txb?: TransactionBlock;
}

export type CoinType = string;
export type Amount = string;

export interface MoneyMarket {
  supplyRatePerYear: BigNumber; // 1e16 means 1% || 1e18 means 100%
  borrowRatePerYear: BigNumber; // 1e16 means 1% || 1e18 means 100%
  cash: BigNumber; // Coins available to be borrowed
  collateralEnabled: boolean;
  allocationPoints: BigNumber; // For IPX rewards
  userPrincipal: BigNumber;
  userShares: BigNumber;
  userLoanPendingRewards: BigNumber;
  userCollateralPendingRewards: BigNumber;
  totalCollateralElastic: BigNumber;
  totalCollateralBase: BigNumber;
  totalLoanElastic: BigNumber;
  totalLoanBase: BigNumber;
  borrowCap: BigNumber;
  LTV: BigNumber;
  accruedTimestamp: BigNumber;
  decimals: number;
  canBeCollateral: boolean;
  totalCollateralRebase: Rebase;
  totalLoanRebase: Rebase;
}

export type MoneyMarketRecord = Record<string, MoneyMarket>;

export interface GetMarketsArgs {
  sender?: SuiAddress | null;
}

export interface EnterMarketArgs extends EntryFuncArgs {
  assetType: CoinType;
}

export interface ExitMarketArgs extends EntryFuncArgs {
  assetType: CoinType;
}

export interface DepositArgs extends EntryFuncArgs {
  assetList: Coin[];
  assetValue: Amount;
  assetType: CoinType;
}

export interface WithdrawArgs extends EntryFuncArgs {
  sharesToRemove: Amount;
  assetType: CoinType;
}

export interface BorrowArgs extends EntryFuncArgs {
  borrowValue: Amount;
  assetType: CoinType;
}

export interface RepayArgs extends EntryFuncArgs {
  assetList: Coin[];
  assetValue: Amount;
  assetType: CoinType;
  principalToRepay: Amount;
}

export interface GetRewardsArgs extends EntryFuncArgs {
  assetType: CoinType;
}

export type GetAllRewardsArgs = EntryFuncArgs;

export interface LiquidateArgs extends EntryFuncArgs {
  loanAssetType: CoinType;
  collateralAssetType: CoinType;
  loanAssetList: Coin[];
  loanAssetValue: Amount;
  borrower: SuiAddress;
}
