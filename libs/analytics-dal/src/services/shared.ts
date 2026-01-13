import { InsertOptions } from './clickhouse.service';

const { NODE_ENV } = process.env;

export const getInsertOptions = (
  asyncInsertVariable: string | undefined,
  waitForAsyncInsertVariable: string | undefined
): InsertOptions => {
  return {
    asyncInsert: (() => {
      if (NODE_ENV === 'test') {
        return false;
      }
      if (asyncInsertVariable !== undefined) {
        return asyncInsertVariable === 'true';
      }

      return true;
    })(),
    waitForAsyncInsert: (() => {
      if (NODE_ENV === 'test') {
        return true;
      }
      if (waitForAsyncInsertVariable !== undefined) {
        return waitForAsyncInsertVariable === 'true';
      }

      return false;
    })(),
  };
};
