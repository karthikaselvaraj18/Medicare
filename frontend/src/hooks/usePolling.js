import { useEffect, useRef } from 'react';

export function usePolling(callback, interval = 5000, enabled = true) {
  const savedCallback = useRef(callback);
  const intervalRef = useRef(null);

  useEffect(() => { savedCallback.current = callback; }, [callback]);

  useEffect(() => {
    if (!enabled) return;
    savedCallback.current();
    intervalRef.current = setInterval(() => savedCallback.current(), interval);
    return () => clearInterval(intervalRef.current);
  }, [interval, enabled]);
}
