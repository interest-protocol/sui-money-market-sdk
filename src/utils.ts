import {
  DevInspectResults,
  JsonRpcProvider,
  SuiObjectResponse,
} from '@mysten/sui.js';
import {
  DynamicFieldInfo,
  DynamicFieldPage,
} from '@mysten/sui.js/src/types/dynamic_fields';
import { head, isEmpty, pathOr, propOr } from 'ramda';
import {
  GetAllDynamicFieldsInternalArgs,
} from './types';

export const getReturnValuesFromInspectResults = (
  x: DevInspectResults,
): Array<[number[], string]> | null => {
  const results = propOr([], 'results', x) as DevInspectResults['results'];

  if (!results?.length) return null;

  const firstElem = head(results);

  if (!firstElem) return null;

  const returnValues = firstElem?.returnValues;

  return returnValues ? returnValues : null;
};

const getAllDynamicFieldsInternal = async ({
  data,
  cursor,
  parentId,
  provider,
}: GetAllDynamicFieldsInternalArgs): Promise<DynamicFieldPage['data']> => {
  const newData = await provider.getDynamicFields({
    parentId,
    cursor: cursor,
  });

  const nextData = data.concat(newData.data);

  if (!newData.hasNextPage) return nextData;

  return getAllDynamicFieldsInternal({
    data: nextData,
    cursor: newData.nextCursor,
    parentId,
    provider,
  });
};

export const getAllDynamicFields = async (
  provider: JsonRpcProvider,
  parentId: string,
) => {
  const data = await provider.getDynamicFields({
    parentId,
  });

  return data.hasNextPage
    ? getAllDynamicFieldsInternal({
        data: data.data,
        cursor: data.nextCursor,
        parentId,
        provider,
      })
    : data.data;
};