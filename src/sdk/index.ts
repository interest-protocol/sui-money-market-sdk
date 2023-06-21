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


export class SDK {
  
  constructor(
    public readonly provider: JsonRpcProvider,
    public readonly network: Network,
  ) {
    invariant(Object.values(Network).includes(network), 'Invalid network');
  }
}
