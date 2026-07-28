import { PREFER_GRAMS_COOKIE } from '@/constants';

const ONE_YEAR_IN_SECONDS = 60 * 60 * 24 * 365;

export function setPreferGramsCookie(preferGrams: boolean): void {
  document.cookie = `${PREFER_GRAMS_COOKIE}=${preferGrams}; path=/; max-age=${ONE_YEAR_IN_SECONDS}`;
}
