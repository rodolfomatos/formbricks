/** Promise-based delay for async wait operations. */
export const delay = (ms: number) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

/** Type guard for Promise.allSettled results — filters fulfilled promises. */
export const isFulfilled = <T>(val: PromiseSettledResult<T>): val is PromiseFulfilledResult<T> => {
  return val.status === "fulfilled";
};

/** Type guard for Promise.allSettled results — filters rejected promises. */
export const isRejected = <T>(val: PromiseSettledResult<T>): val is PromiseRejectedResult => {
  return val.status === "rejected";
};
