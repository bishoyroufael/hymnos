import { useEffect, useRef, useState } from "react";

/**
 * Auto-hide presentation controls after `delayMs` of inactivity. Any pointer
 * movement or tap shows them again (pointerdown covers touch screens, where
 * no mousemove fires). Pass `paused` to suspend hiding, e.g. while the cursor
 * is over the control itself.
 */
export function useAutoHide(delayMs = 3000, paused = false): boolean {
  const [isVisible, setIsVisible] = useState(true);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const resetTimer = () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (paused) return;
      timerRef.current = setTimeout(() => setIsVisible(false), delayMs);
    };

    const handleActivity = () => {
      setIsVisible(true);
      resetTimer();
    };

    window.addEventListener("pointermove", handleActivity);
    window.addEventListener("pointerdown", handleActivity);
    resetTimer();

    return () => {
      window.removeEventListener("pointermove", handleActivity);
      window.removeEventListener("pointerdown", handleActivity);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [delayMs, paused]);

  return isVisible;
}
