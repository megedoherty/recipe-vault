import { render, screen } from '@testing-library/react';

import LoginPage from './page';

jest.mock('@/lib/actions/auth', () => ({ signIn: jest.fn() }));

describe('LoginPage', () => {
  it('renders the heading and a form with required email and password fields', () => {
    render(<LoginPage />);

    expect(screen.getByRole('heading', { name: 'Log In' })).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeRequired();
    expect(screen.getByLabelText('Email')).toHaveAttribute('type', 'email');
    expect(screen.getByLabelText('Password')).toBeRequired();
    expect(screen.getByLabelText('Password')).toHaveAttribute(
      'type',
      'password',
    );
    expect(screen.getByRole('button', { name: 'Submit' })).toHaveAttribute(
      'type',
      'submit',
    );
  });
});
