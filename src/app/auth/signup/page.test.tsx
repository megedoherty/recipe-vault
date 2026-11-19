import { render, screen } from '@testing-library/react';

import SignupPage from './page';

jest.mock('@/lib/actions/auth', () => ({ signUp: jest.fn() }));

describe('SignupPage', () => {
  it('renders the heading and a form with required email and password fields', () => {
    render(<SignupPage />);

    expect(
      screen.getByRole('heading', { name: 'Sign Up' }),
    ).toBeInTheDocument();
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
