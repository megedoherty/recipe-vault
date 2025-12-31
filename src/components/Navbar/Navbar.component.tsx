import Link from 'next/link';

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

export default function Navbar() {
  return (
    <nav className={styles.navbar}>
      <ul className={styles.links}>
        {links.map((link) => (
          <li key={link.href} className={styles.link}>
            <Link href={link.href}>{link.label}</Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
