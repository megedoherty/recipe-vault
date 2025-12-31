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
          <li key={link.href} className={styles.link}>
            <Link href={link.href}>{link.label}</Link>
          </li>
        ))}
        {!user && (
          <li className={styles.link}>
            <Link href="/auth/login">Login</Link>
          </li>
        )}
      </ul>
    </nav>
  );
}
