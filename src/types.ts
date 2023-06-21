import { JsonRpcProvider } from '@mysten/sui.js';
import { DynamicFieldPage } from '@mysten/sui.js/src/types/dynamic_fields';

export interface GetAllDynamicFieldsInternalArgs {
  cursor: null | string;
  data: DynamicFieldPage['data'];
  parentId: string;
  provider: JsonRpcProvider;
}