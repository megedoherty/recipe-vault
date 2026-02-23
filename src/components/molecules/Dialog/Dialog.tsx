'use client';

import {
  forwardRef,
  PropsWithChildren,
  useCallback,
  useImperativeHandle,
  useRef,
} from 'react';

import styles from './Dialog.module.css';

export interface DialogRef {
  showModal: () => void;
  close: () => void;
}

interface DialogProps extends PropsWithChildren {
  /** Dialog title (rendered in an h2) */
  title: string;
  /** Optional content between title and footer */
  children?: React.ReactNode;
  /** Optional footer content (e.g. action buttons) */
  footer?: React.ReactNode;
  /** Called when the dialog is closed (backdrop click, Escape, or programmatic) */
  onClose?: () => void;
  /** Optional class name for the dialog element */
  className?: string;
}

const Dialog = forwardRef<DialogRef, DialogProps>(function Dialog(
  { title, children, footer, onClose, className = '' },
  ref,
) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useImperativeHandle(ref, () => ({
    showModal: () => {
      dialogRef.current?.showModal();

      if (window.innerHeight < document.body.clientHeight) {
        document.body.style.overflow = 'hidden';
        document.documentElement.style.scrollbarGutter = 'stable';
      }
    },
    close: () => {
      dialogRef.current?.close();

      if (window.innerHeight < document.body.clientHeight) {
        document.body.style.overflow = '';
        document.documentElement.style.scrollbarGutter = '';
      }
    },
  }));

  const handleCancel = useCallback(() => {
    onClose?.();
  }, [onClose]);

  return (
    <dialog
      ref={dialogRef}
      className={`${styles.dialog} ${className}`.trim()}
      onCancel={handleCancel}
      onClose={onClose}
      closedby="any"
    >
      <div className={styles.content}>
        <h2>{title}</h2>
        {children}
        {footer != null && <div className={styles.footer}>{footer}</div>}
      </div>
    </dialog>
  );
});

export default Dialog;
