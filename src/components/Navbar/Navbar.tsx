import Link from 'next/link';

import { getUser } from '@/lib/supabase/user';

import styles from './Navbar.module.css';

const links = [
  {
    label: 'Home',
    href: '/',
  },
  {
    label: 'Add Recipe',
    href: '/recipes/add',
  },
];

export default async function Navbar() {
  const user = await getUser();

  return (
    <nav className={styles.navbar}>
      <ul className={styles.links}>
        {links.map((link) => (
          <li key={link.href} className={styles.item}>
            <Link href={link.href} className={styles.link}>
              {link.label}
            </Link>
          </li>
        ))}
        {!user && (
          <>
            <li className={styles.item}>
              <Link href="/auth/login" className={styles.link}>
                Log In
              </Link>
            </li>
            <li className={styles.item}>
              <Link href="/auth/signup" className={styles.link}>
                Sign Up
              </Link>
            </li>
          </>
        )}
      </ul>
    </nav>
  );
}
