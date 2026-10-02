// SQL Server numeric-range errors: 8115 arithmetic overflow, 245 / 248 conversion failures or int overflow.
const NUMERIC_RANGE_ERRORS = new Set([8115, 245, 248]);

export const sqlErrorNumber = (error) => error.number ?? error.originalError?.info?.number ?? error.originalError?.number;
export const isNumericRangeError = (error) => NUMERIC_RANGE_ERRORS.has(sqlErrorNumber(error));
