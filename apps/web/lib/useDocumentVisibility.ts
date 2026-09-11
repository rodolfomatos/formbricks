import { useEffect } from "react";

/**
 * React hook that fires a callback each time the browser tab becomes visible.
 * Mount this in components that need to refresh stale data or re-establish
 * connections when the user returns to the tab.
 *
 * @param onVisible — function to invoke when the document becomes visible
 */
export const useDocumentVisibility = (onVisible: () => void) => {
  useEffect(() => {
    const listener = () => {
      if (document.visibilityState === "visible") {
        onVisible();
      }
    };

    document.addEventListener("visibilitychange", listener);

    return () => {
      document.removeEventListener("visibilitychange", listener);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
};
