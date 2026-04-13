'use client';

import { useEffect, useRef, useCallback } from 'react';

/**
 * Custom hook that calls a fetch function on mount and then
 * sets up an auto-refresh interval. Cleans up on unmount.
 *
 * @param fetchFn - The async function to call
 * @param intervalMs - Refresh interval in milliseconds (default: 30000)
 * @param enabled - Whether polling is active (default: true)
 */
export function useAutoRefresh(
  fetchFn: () => void | Promise<void>,
  intervalMs: number = 30000,
  enabled: boolean = true
) {
  const savedCallback = useRef(fetchFn);

  // Keep callback ref fresh without restarting interval
  useEffect(() => {
    savedCallback.current = fetchFn;
  }, [fetchFn]);

  const stableFetch = useCallback(() => {
    savedCallback.current();
  }, []);

  useEffect(() => {
    if (!enabled) return;

    stableFetch();

    const id = setInterval(stableFetch, intervalMs);
    return () => clearInterval(id);
  }, [stableFetch, intervalMs, enabled]);
}
