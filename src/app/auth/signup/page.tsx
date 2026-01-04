import Button from '@/components/atoms/Button/Button';
import TextInput from '@/components/atoms/TextInput/TextInput';
import { signUp } from '@/lib/actions/auth';

import styles from './page.module.css';

export default function LoginPage() {
  return (
    <div className={styles.page}>
      <h1>Sign Up</h1>
      <form action={signUp} className={styles.form}>
        <TextInput
          label="Email"
          id="email"
          type="email"
          name="email"
          required
          fullWidth
          placeholder="Email"
        />
        <TextInput
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
