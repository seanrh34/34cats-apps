import { useEffect, useState } from "react";

/**
 * Hook to check if the component is mounted
 * Useful for preventing hydration mismatches
 */
export function useMounted() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return mounted;
}
