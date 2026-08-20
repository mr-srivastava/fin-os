export const SCHEME_CODE_PATTERN = /^\d{4,7}$/;
export const ISIN_PATTERN = /^[A-Z]{3}[A-Z0-9]{8}\d$/;
export const SEARCH_QUERY_MIN_LENGTH = 2;
export const SEARCH_QUERY_MAX_LENGTH = 80;

export function isSchemeCode(value: string): boolean {
  return SCHEME_CODE_PATTERN.test(value);
}

export function isIsin(value: string): boolean {
  return ISIN_PATTERN.test(value);
}

export function isSearchQuery(value: string): boolean {
  return value.length >= SEARCH_QUERY_MIN_LENGTH && value.length <= SEARCH_QUERY_MAX_LENGTH;
}
