import { useSyncExternalStore } from "react";

/**
 * Hook to check if the component is mounted
 * Useful for preventing hydration mismatches
 */
export function useMounted() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
}
