/**
 * Background images bundled with the app and offered in the background picker.
 *
 * These are served statically from `public/`, so their URLs are stable across
 * rebuilds — important because a chosen background is persisted to localStorage
 * and reused across sessions/deploys.
 *
 * To add a background: drop the image into `public/assets/` (or a subfolder)
 * and add its public path below.
 */
export const BUNDLED_BACKGROUNDS: string[] = [
  "/assets/bg-1.jpg",
  "/assets/bg-2.jpg",
  "/assets/bg-3.jpg",
  "/assets/bg-4.jpg",
  "/assets/bg-5.jpg",
  "/assets/bg-6.jpg",
];
