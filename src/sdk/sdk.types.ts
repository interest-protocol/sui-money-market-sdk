import { MakeMoveVecTransaction, TransactionBlock } from '@mysten/sui.js';
import { Address, Amount } from '@/types';

type SuiObject = MakeMoveVecTransaction['objects'][number];
type Coin = SuiObject;
export type PromisedTransactionBlock = Promise<TransactionBlock>;

export interface EntryFuncArgs { txb: TransactionBlock; }
export interface AccrueArgs extends EntryFuncArgs {}
export interface AccrueSuidArgs extends EntryFuncArgs {}

export interface DepositArgs extends EntryFuncArgs {
  assetList: Coin[];
  assetValue: Amount;
  assetType: Address;
}

export interface WithdrawArgs extends EntryFuncArgs {
  pricePotatoes: SuiObject[];
  sharesToRemove: Amount;
  assetType: Address;
}

export interface BorrowArgs extends EntryFuncArgs {
  pricePotatoes: SuiObject[];
  borrowValue: Amount;
  assetType: Address;
}

export interface RepayArgs extends EntryFuncArgs {
  assetList: Coin[];
  assetValue: Amount;
  assetType: Address;
  principalToRepay: Amount;
}

export interface ExitMarketArgs extends EntryFuncArgs {
  pricePotatoes: SuiObject[];
}
export interface BorrowSuidArgs extends BorrowArgs {}
export interface RepaySuidArgs extends RepayArgs {}
export interface GetRewardsArgs extends EntryFuncArgs {}
export interface GetAllRewardsArgs extends EntryFuncArgs {}

export interface LiquidateArgs extends EntryFuncArgs {
  pricePotatoes: SuiObject[];
  assetList: Coin[];
  assetValue: Amount;
  borrower: Address;
}

export interface LiquidateSuidArgs extends LiquidateArgs {}



