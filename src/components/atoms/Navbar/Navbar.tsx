import Link from 'next/link';

import { getUser, isAdmin } from '@/lib/supabase/queries/user';

import styles from './Navbar.module.css';

interface LinkProps {
  label: string;
  shortLabel?: string;
  href: string;
  loggedIn?: boolean;
  adminOnly?: boolean;
}

const leftLinks: LinkProps[] = [
  {
    label: 'Home',
    href: '/',
  },
  {
    label: 'Add Recipe',
    shortLabel: 'Add',
    href: '/recipes/add',
    loggedIn: true,
  },
  {
    label: 'Shopping List',
    shortLabel: 'List',
    href: '/shopping-list',
    loggedIn: true,
  },
];

const rightLinks: LinkProps[] = [
  {
    label: 'Manage',
    href: '/manage',
    loggedIn: true,
    adminOnly: true,
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
  isUserAdmin,
}: {
  link: LinkProps;
  isLoggedIn: boolean;
  isUserAdmin: boolean;
}) => {
  if (link.loggedIn !== undefined && isLoggedIn !== link.loggedIn) {
    return null;
  }

  if (link.adminOnly && !isUserAdmin) {
    return null;
  }

  return (
    <li key={link.href} className={styles.item}>
      <Link
        href={link.href}
        className={styles.link}
        aria-label={link.shortLabel ? link.label : undefined}
      >
        {link.shortLabel ? (
          <>
            <span className={styles.shortLabel}>{link.shortLabel}</span>
            <span className={styles.fullLabel}>{link.label}</span>
          </>
        ) : (
          link.label
        )}
      </Link>
    </li>
  );
};

export default async function Navbar() {
  const user = await getUser();
  const isLoggedIn = !!user;
  const isUserAdmin = isAdmin(user);

  return (
    <nav className={styles.navbar}>
      <ul className={styles.links}>
        <li className={styles.left}>
          <ul className={styles.innerList}>
            {leftLinks.map((link) => (
              <NavbarLink
                key={link.href}
                link={link}
                isLoggedIn={isLoggedIn}
                isUserAdmin={isUserAdmin}
              />
            ))}
          </ul>
        </li>
        <li className={styles.right}>
          <ul className={styles.innerList}>
            {rightLinks.map((link) => (
              <NavbarLink
                key={link.href}
                link={link}
                isLoggedIn={isLoggedIn}
                isUserAdmin={isUserAdmin}
              />
            ))}
            {authLinks.map((link) => (
              <NavbarLink
                key={link.href}
                link={link}
                isLoggedIn={isLoggedIn}
                isUserAdmin={isUserAdmin}
              />
            ))}
          </ul>
        </li>
      </ul>
    </nav>
  );
}
