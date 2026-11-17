import { render } from '@testing-library/react';

import ImageErrorToast from './ImageErrorToast';

const showToast = jest.fn();
const replace = jest.fn();
let query = '';

jest.mock('next/navigation', () => ({
  usePathname: () => '/recipes/1',
  useRouter: () => ({ replace }),
  useSearchParams: () => new URLSearchParams(query),
}));
jest.mock('@/components/molecules/Toast/ToastProvider', () => ({
  useToast: () => ({ showToast }),
}));

describe('ImageErrorToast', () => {
  beforeEach(() => jest.clearAllMocks());

  it('shows a toast and clears the param when imageError is set', () => {
    query = 'imageError=1';
    render(<ImageErrorToast />);
    expect(showToast).toHaveBeenCalledTimes(1);
    expect(replace).toHaveBeenCalledWith('/recipes/1', { scroll: false });
  });

  it('does nothing without the param', () => {
    query = '';
    render(<ImageErrorToast />);
    expect(showToast).not.toHaveBeenCalled();
    expect(replace).not.toHaveBeenCalled();
  });
});
