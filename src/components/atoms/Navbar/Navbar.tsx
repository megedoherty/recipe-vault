import Link from 'next/link';

import { getUser } from '@/lib/supabase/queries/user';

import styles from './Navbar.module.css';

interface LinkProps {
  label: string;
  href: string;
  loggedIn?: boolean;
}

const leftLinks: LinkProps[] = [
  {
    label: 'Home',
    href: '/',
  },
  {
    label: 'Add Recipe',
    href: '/recipes/add',
    loggedIn: true,
  },
];

const rightLinks: LinkProps[] = [
  {
    label: 'Manage',
    href: '/manage',
    loggedIn: true,
  },
];

const authLinks: LinkProps[] = [
  {
    label: 'Log In',
    href: '/auth/login',
    loggedIn: false,
  },
  {
    label: 'Sign Up',
    href: '/auth/signup',
    loggedIn: false,
  },
];

const NavbarLink = ({
  link,
  isLoggedIn,
}: {
  link: LinkProps;
  isLoggedIn: boolean;
}) => {
  if (link.loggedIn !== undefined && isLoggedIn !== link.loggedIn) {
    return null;
  }

  return (
    <li key={link.href} className={styles.item}>
      <Link href={link.href} className={styles.link}>
        {link.label}
      </Link>
    </li>
  );
};

export default async function Navbar() {
  const user = await getUser();
  const isLoggedIn = !!user;

  return (
    <nav className={styles.navbar}>
      <ul className={styles.links}>
        <li className={styles.left}>
          <ul className={styles.innerList}>
            {leftLinks.map((link) => (
              <NavbarLink key={link.href} link={link} isLoggedIn={isLoggedIn} />
            ))}
          </ul>
        </li>
        <li className={styles.right}>
          <ul className={styles.innerList}>
            {rightLinks.map((link) => (
              <NavbarLink key={link.href} link={link} isLoggedIn={isLoggedIn} />
            ))}
            {authLinks.map((link) => (
              <NavbarLink key={link.href} link={link} isLoggedIn={isLoggedIn} />
            ))}
          </ul>
        </li>
      </ul>
    </nav>
  );
}
