import { Ratio } from "@/types/Live";

type Size = { width: number; height: number };

/**
 * Compute the best-fit window size inside the current screen for a target aspect ratio,
 * leaving safe margins so it never touches screen edges.
 *
 * Rules:
 * - LANDSCAPE (16:9): leave 150px vertical safe area (top & bottom), small horizontal padding
 * - PORTRAIT  (9:16): leave 50px  vertical safe area (top & bottom), small horizontal padding
 * - SQUARE    (1:1):  leave 150px vertical safe area (top & bottom), small horizontal padding
 *
 * Then fit the box maintaining aspect ratio into (screenWidth - 2*safeX, screenHeight - 2*safeY).
 */
export const getWindowSize = (ratio: Ratio): Size => {
  const screenWidth = window.innerWidth || 0;
  const screenHeight = window.innerHeight || 0;

  // Target aspect by ratio
  const aspect =
    ratio === Ratio.LANDSCAPE ? 16 / 9 : ratio === Ratio.PORTRAIT ? 9 / 16 : 1;

  // Safe margins per side (px)
  const verticalSafePerSide = ratio === Ratio.LANDSCAPE ? 120 : 40;
  // Keep a small horizontal breathing room universally
  const horizontalSafePerSide = 24;

  const availW = Math.max(0, screenWidth - horizontalSafePerSide * 2);
  const availH = Math.max(0, screenHeight - verticalSafePerSide * 2);

  if (availW === 0 || availH === 0) {
    return { width: 0, height: 0 };
  }

  // Fit to box preserving aspect
  const availAspect = availW / availH;
  let width: number;
  let height: number;
  if (availAspect > aspect) {
    // Limited by height
    height = availH;
    width = height * aspect;
  } else {
    // Limited by width
    width = availW;
    height = width / aspect;
  }

  // Round for pixel snapping
  return { width: Math.floor(width), height: Math.floor(height) };
};
export const getUserWindowSize = (ratio: Ratio): Size => {
  if (ratio === Ratio.LANDSCAPE) {
    return { width: 504, height: 280 };
  } else if (ratio === Ratio.PORTRAIT) {
    return {
      width: 208,
      height: 370,
    };
  } else {
    return {
      width: 322,
      height: 322,
    };
  }
};
