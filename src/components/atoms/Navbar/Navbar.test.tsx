import { render, screen } from '@testing-library/react';

import { isUserLoggedIn } from '@/lib/supabase/queries/user';

import Navbar from './Navbar';

jest.mock('@/lib/supabase/queries/user', () => ({
  isUserLoggedIn: jest.fn(),
}));

const renderNavbar = async (loggedIn: boolean) => {
  jest.mocked(isUserLoggedIn).mockResolvedValue(loggedIn);
  render(await Navbar());
};

const getLinkHrefs = () =>
  screen.getAllByRole('link').map((link) => link.getAttribute('href'));

describe('Navbar', () => {
  it('shows app links and hides auth links when logged in', async () => {
    await renderNavbar(true);

    expect(getLinkHrefs()).toEqual([
      '/',
      '/recipes/add',
      '/shopping-list',
      '/manage',
    ]);
  });

  it('shows auth links and hides app links when logged out', async () => {
    await renderNavbar(false);

    expect(getLinkHrefs()).toEqual(['/', '/auth/login', '/auth/signup']);
  });

  it('uses the full label as the accessible name for links with a short label', async () => {
    await renderNavbar(true);

    expect(screen.getByRole('link', { name: 'Add Recipe' })).toHaveAttribute(
      'href',
      '/recipes/add',
    );
    expect(screen.getByRole('link', { name: 'Shopping List' })).toHaveAttribute(
      'href',
      '/shopping-list',
    );
  });
});
