import { signIn, signUp } from '@/lib/actions';

export default function LoginPage() {
  return (
    <div>
      <h1>Login</h1>
      <form action={signUp}>
        <input type="email" name="email" placeholder="Email" />
        <input type="password" name="password" placeholder="Password" />
        <button type="submit">Sign Up</button>
      </form>
      <form action={signIn}>
        <input type="email" name="email" placeholder="Email" />
        <input type="password" name="password" placeholder="Password" />
        <button type="submit">Sign In</button>
      </form>
    </div>
  );
}
