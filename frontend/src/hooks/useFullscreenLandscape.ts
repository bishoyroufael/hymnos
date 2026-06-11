import { useEffect, useRef } from "react";
import { enterPresentationMode, exitPresentationMode, isFullscreen } from "@/utils/fullscreen";

/**
 * Keeps the presentation screen in fullscreen + landscape for its lifetime.
 * Use once, in the presentation route component.
 *
 * Browsers only allow requestFullscreen during user activation, so the hook:
 * - enters on mount when the activation of the click that navigated here is
 *   still alive (this is more reliable than requesting fullscreen inside the
 *   click handler itself, where the request races the route transition);
 * - otherwise (deep link, refresh, expired activation) enters on the first
 *   gesture inside the presentation;
 * - calls `onExitFullscreen` when the user leaves fullscreen (e.g. Escape,
 *   which the browser consumes before any keydown handler sees it) — pass
 *   a navigate-back callback to keep "Escape leaves the presentation";
 * - exits fullscreen and releases the orientation lock on unmount, i.e. on
 *   any navigation to another page (without firing `onExitFullscreen`).
 */
export function useFullscreenLandscape(onExitFullscreen?: () => void): void {
  const onExitRef = useRef(onExitFullscreen);
  useEffect(() => {
    onExitRef.current = onExitFullscreen;
  });

  useEffect(() => {
    let entered = false;
    let userExited = false;
    let pending = false;

    const handleFullscreenChange = () => {
      if (isFullscreen()) {
        entered = true;
      } else if (entered) {
        // The user left fullscreen on purpose — don't force it back on via
        // the gesture listeners, and let the caller react (navigate back).
        userExited = true;
        onExitRef.current?.();
      }
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);

    const tryEnter = () => {
      if (pending || userExited || isFullscreen()) return;
      pending = true;
      enterPresentationMode().finally(() => {
        pending = false;
      });
    };

    // Eager attempt while the navigation click's activation is still alive.
    // Browsers without navigator.userActivation just attempt (failure is caught).
    const activation = navigator.userActivation;
    if (!activation || activation.isActive) tryEnter();

    // Gesture fallback. Capture phase so controls calling stopPropagation()
    // can't swallow the event; Escape means "leave", never "enter".
    const handleGesture = (e: Event) => {
      if ((e as KeyboardEvent).key === "Escape") return;
      tryEnter();
    };
    window.addEventListener("pointerdown", handleGesture, true);
    window.addEventListener("click", handleGesture, true);
    window.addEventListener("keydown", handleGesture, true);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("webkitfullscreenchange", handleFullscreenChange);
      window.removeEventListener("pointerdown", handleGesture, true);
      window.removeEventListener("click", handleGesture, true);
      window.removeEventListener("keydown", handleGesture, true);
      exitPresentationMode();
    };
  }, []);
}
