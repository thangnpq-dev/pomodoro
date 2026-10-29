import { useEffect, useState, useCallback } from 'react';

export function useNotification() {
  const [permission, setPermission] = useState<NotificationPermission>(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  );

  const requestPermission = useCallback(async () => {
    if (typeof Notification === 'undefined') return 'denied';
    try {
      const res = await Notification.requestPermission();
      setPermission(res);
      return res;
    } catch {
      return 'denied';
    }
  }, []);

  const notify = useCallback((title: string, body: string) => {
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      try {
        new Notification(title, {
          body,
          Silent: false,
        } as NotificationOptions);
      } catch {
        // Ignore on unsupported mobile browsers
      }
    }
  }, []);

  return { permission, requestPermission, notify };
}

export function useWakeLock(isRunning: boolean) {
  useEffect(() => {
    let wakeLock: WakeLockSentinel | null = null;

    const acquireLock = async () => {
      if ('wakeLock' in navigator && isRunning) {
        try {
          wakeLock = await navigator.wakeLock.request('screen');
        } catch {
          // Ignore if blocked by battery saver or browser policy
        }
      }
    };

    if (isRunning) {
      acquireLock();
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isRunning) {
        acquireLock();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (wakeLock) {
        wakeLock.release().catch(() => {});
      }
    };
  }, [isRunning]);
}
