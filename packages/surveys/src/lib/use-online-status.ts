/** Online status hook — tracks browser online/offline state via `navigator.onLine` and `online`/`offline` events for offline queue management. */
import { useEffect, useState } from "preact/hooks";

export function useOnlineStatus(): boolean {
  const [isOnline, setIsOnline] = useState(() => {
    return typeof navigator === "undefined" ? true : navigator.onLine;
  });

  useEffect(() => {
    if (globalThis.window === undefined) return;

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    globalThis.window.addEventListener("online", handleOnline);
    globalThis.window.addEventListener("offline", handleOffline);

    return () => {
      globalThis.window.removeEventListener("online", handleOnline);
      globalThis.window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return isOnline;
}
