'use client';

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react';

const subscribe = () => () => {};
const getSnapshot = () => 'wakeLock' in navigator;
const getServerSnapshot = () => false;

/**
 * Keeps the screen awake via the Screen Wake Lock API while enabled.
 * Browsers release the lock when the tab is hidden, so it is re-acquired
 * when the tab becomes visible again.
 */
export default function useWakeLock() {
  const isSupported = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );
  const [isActive, setIsActive] = useState(false);
  const sentinelRef = useRef<WakeLockSentinel | null>(null);

  const acquire = useCallback(async () => {
    try {
      sentinelRef.current = await navigator.wakeLock.request('screen');
      return true;
    } catch (error) {
      // Can be rejected, e.g. in battery saver mode
      console.error(error);
      return false;
    }
  }, []);

  const release = useCallback(async () => {
    setIsActive(false);
    const sentinel = sentinelRef.current;
    sentinelRef.current = null;
    await sentinel?.release();
  }, []);

  const request = useCallback(async () => {
    if (!isSupported) {
      return;
    }
    setIsActive(await acquire());
  }, [isSupported, acquire]);

  useEffect(() => {
    if (!isActive) {
      return;
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        acquire().then((acquired) => {
          if (!acquired) {
            setIsActive(false);
          }
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () =>
      document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isActive, acquire]);

  useEffect(
    () => () => {
      sentinelRef.current?.release().catch(() => {});
      sentinelRef.current = null;
    },
    [],
  );

  return { isSupported, isActive, request, release };
}
