/** Utilities for extracting the userId parameter from link survey URL search params. */
type TSearchParamValue = string | string[] | undefined;

type TSearchParamsWithEntries = Pick<URLSearchParams, "entries">;

type TSearchParamsRecord = Record<string, TSearchParamValue>;

type TUserIdSearchParams = TSearchParamsWithEntries | TSearchParamsRecord;

function* getSearchParamEntries(searchParams: TUserIdSearchParams): Generator<[string, string]> {
  if ("entries" in searchParams && typeof searchParams.entries === "function") {
    yield* searchParams.entries();
    return;
  }

  for (const [key, value] of Object.entries(searchParams)) {
    if (Array.isArray(value)) {
      for (const arrayValue of value) {
        yield [key, arrayValue];
      }
    } else if (value !== undefined) {
      yield [key, value];
    }
  }
}

/** Extracts the `userId` value (case-insensitive) from search params. Ignores empty strings. */
export const getUserIdFromSearchParams = (searchParams: TUserIdSearchParams): string | undefined => {
  for (const [key, value] of getSearchParamEntries(searchParams)) {
    if (key.toLowerCase() === "userid") {
      return value === "" ? undefined : value;
    }
  }

  return undefined;
};

/** Returns true when a non-empty userId value is present in the search params. */
export const hasUserIdSearchParam = (searchParams: TUserIdSearchParams): boolean => {
  return getUserIdFromSearchParams(searchParams) !== undefined;
};
