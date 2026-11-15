'use client';

import { X } from 'lucide-react';
import {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import Button from '@/components/atoms/Button/Button';

import styles from './Toast.module.css';

export const TOAST_DURATION_MS = 5000;
export const MAX_TOASTS = 3;

type ToastVariant = 'error' | 'info';

interface ToastItem {
  id: number;
  message: string;
  variant: ToastVariant;
}

interface ToastContextValue {
  showToast: (message: string, options?: { variant?: ToastVariant }) => void;
  dismissToast: (id: number) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

/**
 * Shows short, transient messages (e.g. a failed background action).
 * Must be used inside a ToastProvider.
 */
export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

export default function ToastProvider({ children }: PropsWithChildren) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timers = useRef(new Map<number, ReturnType<typeof setTimeout>>());
  const nextId = useRef(0);
  // Mirrors `toasts` so showToast can stay stable and read the latest list
  const toastsRef = useRef<ToastItem[]>([]);

  const updateToasts = useCallback((next: ToastItem[]) => {
    toastsRef.current = next;
    setToasts(next);
  }, []);

  const clearTimer = useCallback((id: number) => {
    const timer = timers.current.get(id);
    if (timer !== undefined) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const dismissToast = useCallback(
    (id: number) => {
      clearTimer(id);
      updateToasts(toastsRef.current.filter((toast) => toast.id !== id));
    },
    [clearTimer, updateToasts],
  );

  const startTimer = useCallback(
    (id: number) => {
      clearTimer(id);
      timers.current.set(
        id,
        setTimeout(() => dismissToast(id), TOAST_DURATION_MS),
      );
    },
    [clearTimer, dismissToast],
  );

  const showToast = useCallback<ToastContextValue['showToast']>(
    (message, { variant = 'error' } = {}) => {
      // The same message again just restarts its timer instead of stacking
      const existing = toastsRef.current.find(
        (toast) => toast.message === message && toast.variant === variant,
      );
      if (existing) {
        startTimer(existing.id);
        return;
      }

      const id = nextId.current++;
      const next = [...toastsRef.current, { id, message, variant }];
      const dropped = next.slice(0, Math.max(0, next.length - MAX_TOASTS));
      dropped.forEach((toast) => clearTimer(toast.id));
      updateToasts(next.slice(-MAX_TOASTS));
      startTimer(id);
    },
    [clearTimer, startTimer, updateToasts],
  );

  useEffect(() => {
    const activeTimers = timers.current;
    return () => {
      activeTimers.forEach(clearTimeout);
      activeTimers.clear();
    };
  }, []);

  const value = useMemo(
    () => ({ showToast, dismissToast }),
    [showToast, dismissToast],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      {/* Always rendered, even when empty, so screen readers pick up additions */}
      <div className={styles.region} aria-live="polite">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role={toast.variant === 'error' ? 'alert' : 'status'}
            className={`${styles.toast} ${styles[toast.variant]}`}
          >
            <p className={styles.message}>{toast.message}</p>
            <Button
              iconOnly
              size="small"
              variant="secondary"
              aria-label="Dismiss"
              onClick={() => dismissToast(toast.id)}
            >
              <X />
            </Button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
