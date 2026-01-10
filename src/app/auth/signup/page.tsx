import Button from '@/components/atoms/Button/Button';
import Input from '@/components/atoms/Input/Input';
import { signUp } from '@/lib/actions/auth';

import styles from './page.module.css';

export default function LoginPage() {
  return (
    <div className={styles.page}>
      <h1>Sign Up</h1>
      <form action={signUp} className={styles.form}>
        <Input
          label="Email"
          id="email"
          type="email"
          name="email"
          required
          fullWidth
          placeholder="Email"
        />
        <Input
          label="Password"
          id="password"
          type="password"
          required
          fullWidth
          name="password"
          placeholder="Password"
        />
        <Button type="submit">Submit</Button>
      </form>
    </div>
  );
}
