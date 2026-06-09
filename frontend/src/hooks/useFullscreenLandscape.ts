import { useEffect, useRef } from "react";

/**
 * On mount: request fullscreen on the document and lock orientation to landscape.
 * On unmount: unlock orientation and exit fullscreen.
 *
 * `onExitFullscreen` fires when the user leaves fullscreen *while mounted* — e.g.
 * by pressing Escape, which the browser intercepts to exit fullscreen instead of
 * dispatching a keydown to the page. This lets the caller restore "Escape goes
 * back" behaviour. It is NOT fired by the unmount cleanup.
 *
 * All fullscreen/orientation calls are best-effort (fullscreen may need a user
 * gesture and orientation lock is unsupported on most desktops), so failures are
 * ignored.
 */
export function useFullscreenLandscape(onExitFullscreen?: () => void): void {
  const onExitRef = useRef(onExitFullscreen);
  onExitRef.current = onExitFullscreen;

  useEffect(() => {
    let entered = false;

    const handleFullscreenChange = () => {
      if (document.fullscreenElement) {
        entered = true;
      } else if (entered) {
        entered = false;
        onExitRef.current?.();
      }
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);

    (async () => {
      try {
        if (!document.fullscreenElement) {
          await document.documentElement.requestFullscreen?.();
        }
      } catch {
        /* fullscreen blocked/unavailable */
      }
      try {
        const orientation = window.screen?.orientation as (ScreenOrientation & { lock?: (orientation: string) => Promise<void> }) | undefined;
        await orientation?.lock?.("landscape");
      } catch {
        /* orientation lock unsupported */
      }
    })();

    return () => {
      // Remove the listener before exiting so the cleanup's own exit doesn't
      // re-trigger onExitFullscreen.
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      try {
        window.screen?.orientation?.unlock?.();
      } catch {
        /* noop */
      }
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
    };
  }, []);
}
