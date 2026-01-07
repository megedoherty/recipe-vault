import Link from 'next/link';
import {
  AnchorHTMLAttributes,
  ButtonHTMLAttributes,
  PropsWithChildren,
} from 'react';

import styles from './Button.module.css';

interface BaseButtonProps extends PropsWithChildren {
  variant?: 'primary' | 'secondary';
  className?: string;
  iconOnly?: boolean;
  size?: 'small' | 'medium';
}

type ButtonAsButton = ButtonHTMLAttributes<HTMLButtonElement> & {
  href?: never;
  onClick?: () => void;
};

type ButtonAsLink = AnchorHTMLAttributes<HTMLAnchorElement> & {
  href: string;
  onClick?: () => void;
};

type ButtonOrLink = ButtonAsButton | ButtonAsLink;
export type ButtonProps = BaseButtonProps & ButtonOrLink;

function isLink(obj: ButtonOrLink): obj is ButtonAsLink {
  return 'href' in obj;
}

export default function Button(props: ButtonProps) {
  const {
    children,
    variant = 'primary',
    size = 'medium',
    className,
    iconOnly = false,
    ...restProps
  } = props;

  const classes = [
    styles.button,
    styles[variant],
    className,
    iconOnly && styles.iconButton,
    size === 'small' && styles.small,
  ]
    .filter(Boolean)
    .join(' ');

  if (isLink(restProps)) {
    return (
      <Link className={classes} {...restProps}>
        {children}
      </Link>
    );
  }

  return (
    <button
      type="button"
      className={classes}
      {...(restProps as ButtonAsButton)}
    >
      {children}
    </button>
  );
}
