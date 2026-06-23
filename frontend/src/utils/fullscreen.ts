// Fullscreen helpers for the presentation flow.
//
// Mobile WebKit (iPad Safari < 16.4, older Android WebViews) only exposes the
// webkit-prefixed Fullscreen API, so both helpers fall back to it.
type FullscreenDocument = Document & {
  webkitFullscreenElement?: Element | null;
  webkitExitFullscreen?: () => Promise<void> | void;
};

type FullscreenElement = HTMLElement & {
  webkitRequestFullscreen?: () => Promise<void> | void;
};

function getFullscreenElement(): Element | null {
  const doc = document as FullscreenDocument;
  return doc.fullscreenElement ?? doc.webkitFullscreenElement ?? null;
}

export function isFullscreen(): boolean {
  return getFullscreenElement() !== null;
}

// Opening a native OS dialog (e.g. a file picker) can transiently drop fullscreen.
// Callers wrap such actions with this guard so useFullscreenLandscape ignores that
// exit (and doesn't navigate away) until the dialog closes.
let exitSuppressed = false;
export function suppressFullscreenExit(): void {
  exitSuppressed = true;
}
export function releaseFullscreenExit(): void {
  exitSuppressed = false;
}
export function isFullscreenExitSuppressed(): boolean {
  return exitSuppressed;
}

/**
 * Enter fullscreen and lock the screen to landscape.
 *
 * Browsers only honor requestFullscreen while user activation is alive, so
 * call this from (or right after) a user gesture — see useFullscreenLandscape.
 * Failures (API unavailable, orientation lock unsupported) are silently ignored.
 */
export async function enterPresentationMode(): Promise<void> {
  try {
    if (!getFullscreenElement()) {
      const el = document.documentElement as FullscreenElement;
      if (el.requestFullscreen) {
        await el.requestFullscreen();
      } else {
        await el.webkitRequestFullscreen?.();
      }
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
}

/** Exit fullscreen and release the orientation lock (no-op when not active). */
export function exitPresentationMode(): void {
  try {
    window.screen?.orientation?.unlock?.();
  } catch {
    /* noop */
  }
  if (getFullscreenElement()) {
    const doc = document as FullscreenDocument;
    if (doc.exitFullscreen) {
      doc.exitFullscreen().catch(() => {});
    } else {
      doc.webkitExitFullscreen?.();
    }
  }
}
