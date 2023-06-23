import { JsonRpcProvider } from '@mysten/sui.js';
import { DynamicFieldPage } from '@mysten/sui.js/src/types/dynamic_fields';
import { Network } from '@/constants';

export type Address = string;
export type Amount = string | number;
export interface GetAllDynamicFieldsInternalArgs {
  cursor: null | string;
  data: DynamicFieldPage['data'];
  parentId: string;
  provider: JsonRpcProvider;
}

export type PricePotato = {
  [key: string]: Amount | string;
  switchboard_result: Amount,
  pyth_result: Amount,
  scalar: Amount,
  pyth_timestamp: Amount,
  switchboard_timestamp: Amount,
  average: Amount,
  coin_name: string
}