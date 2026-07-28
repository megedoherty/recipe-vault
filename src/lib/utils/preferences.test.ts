import { PREFER_GRAMS_COOKIE } from '@/constants';

import { setPreferGramsCookie } from './preferences';

describe('setPreferGramsCookie', () => {
  afterEach(() => {
    // Clear the cookie between tests
    document.cookie = `${PREFER_GRAMS_COOKIE}=; path=/; max-age=0`;
  });

  test('sets the cookie to true', () => {
    setPreferGramsCookie(true);
    expect(document.cookie).toContain(`${PREFER_GRAMS_COOKIE}=true`);
  });

  test('sets the cookie to false', () => {
    setPreferGramsCookie(false);
    expect(document.cookie).toContain(`${PREFER_GRAMS_COOKIE}=false`);
  });
});
