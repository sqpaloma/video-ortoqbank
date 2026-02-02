"use client";

import { useState, useEffect, useCallback } from "react";

export type ProtectionReason =
  | "tab_hidden"
  | "window_blur"
  | "devtools_open"
  | null;

interface UseVideoProtectionOptions {
  /** Enable tab visibility detection (default: true) */
  detectTabVisibility?: boolean;
  /** Enable window blur detection (default: true) */
  detectWindowBlur?: boolean;
  /** Enable DevTools detection (default: true) */
  detectDevTools?: boolean;
  /** DevTools detection interval in ms (default: 500) */
  devToolsCheckInterval?: number;
  /** Auto-unhide delay in ms after returning to tab (default: 0 = instant) */
  autoUnhideDelay?: number;
}

interface UseVideoProtectionReturn {
  /** Whether the video should be hidden/covered */
  isHidden: boolean;
  /** The reason for hiding (null if not hidden) */
  reason: ProtectionReason;
  /** Manually show the video */
  show: () => void;
  /** Manually hide the video */
  hide: (reason: ProtectionReason) => void;
}

/**
 * Hook to protect video content from screen capture attempts.
 * Detects tab switching, window blur, and DevTools opening.
 *
 * Since we use an iframe for video playback (Bunny Stream),
 * we cannot directly pause the video - instead, we cover it with an overlay.
 */
export function useVideoProtection(
  options: UseVideoProtectionOptions = {},
): UseVideoProtectionReturn {
  const {
    detectTabVisibility = true,
    detectWindowBlur = true,
    detectDevTools = true,
    devToolsCheckInterval = 500,
    autoUnhideDelay = 0,
  } = options;

  const [isHidden, setIsHidden] = useState(false);
  const [reason, setReason] = useState<ProtectionReason>(null);

  const hide = useCallback((newReason: ProtectionReason) => {
    setIsHidden(true);
    setReason(newReason);
  }, []);

  const show = useCallback(() => {
    setIsHidden(false);
    setReason(null);
  }, []);

  // Tab visibility and window blur detection
  useEffect(() => {
    if (!detectTabVisibility && !detectWindowBlur) return;

    let unhideTimeout: NodeJS.Timeout | null = null;
    let blurCheckTimeout: NodeJS.Timeout | null = null;

    const handleVisibilityChange = () => {
      if (!detectTabVisibility) return;

      if (document.hidden) {
        if (unhideTimeout) clearTimeout(unhideTimeout);
        hide("tab_hidden");
      } else {
        // Tab is visible again
        if (autoUnhideDelay > 0) {
          unhideTimeout = setTimeout(show, autoUnhideDelay);
        } else {
          show();
        }
      }
    };

    const handleBlur = () => {
      if (!detectWindowBlur) return;
      if (unhideTimeout) clearTimeout(unhideTimeout);
      if (blurCheckTimeout) clearTimeout(blurCheckTimeout);

      // Wait a short moment and check if document still has focus
      // If focus went to an iframe within the page, document.hasFocus() is still true
      // If focus went to another window, document.hasFocus() will be false
      blurCheckTimeout = setTimeout(() => {
        if (!document.hasFocus()) {
          hide("window_blur");
        }
      }, 100);
    };

    const handleFocus = () => {
      if (!detectWindowBlur) return;
      if (blurCheckTimeout) clearTimeout(blurCheckTimeout);
      // Only show if not hidden for another reason
      if (reason === "window_blur") {
        if (autoUnhideDelay > 0) {
          unhideTimeout = setTimeout(show, autoUnhideDelay);
        } else {
          show();
        }
      }
    };

    if (detectTabVisibility) {
      document.addEventListener("visibilitychange", handleVisibilityChange);
    }

    if (detectWindowBlur) {
      window.addEventListener("blur", handleBlur);
      window.addEventListener("focus", handleFocus);
    }

    return () => {
      if (unhideTimeout) clearTimeout(unhideTimeout);
      if (blurCheckTimeout) clearTimeout(blurCheckTimeout);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleBlur);
      window.removeEventListener("focus", handleFocus);
    };
  }, [
    detectTabVisibility,
    detectWindowBlur,
    autoUnhideDelay,
    hide,
    show,
    reason,
  ]);

  // DevTools detection
  useEffect(() => {
    if (!detectDevTools) return;

    const checkDevTools = () => {
      // Check if window dimensions suggest DevTools is open
      // DevTools typically adds >160px to outer dimensions when docked
      const widthDiff = window.outerWidth - window.innerWidth;
      const heightDiff = window.outerHeight - window.innerHeight;

      const isDevToolsOpen = widthDiff > 160 || heightDiff > 160;

      if (isDevToolsOpen) {
        hide("devtools_open");
      } else if (reason === "devtools_open") {
        // DevTools was closed, show video again
        show();
      }
    };

    // Check immediately
    checkDevTools();

    // Set up interval for continuous checking
    const interval = setInterval(checkDevTools, devToolsCheckInterval);

    return () => clearInterval(interval);
  }, [detectDevTools, devToolsCheckInterval, hide, show, reason]);

  return { isHidden, reason, show, hide };
}

/**
 * Hook to block keyboard shortcuts commonly used for screen capture or inspection.
 * Should be used at the dashboard layout level.
 */
export function useDashboardProtection() {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const blocked =
        e.key === "PrintScreen" ||
        e.key === "F12" ||
        (e.ctrlKey && ["s", "u", "c"].includes(e.key.toLowerCase())) ||
        (e.metaKey && ["s", "u", "c"].includes(e.key.toLowerCase())); // Also handle Cmd on Mac

      if (blocked) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    window.addEventListener("keydown", handleKeyDown, { capture: true });

    return () => {
      window.removeEventListener("keydown", handleKeyDown, { capture: true });
    };
  }, []);
}

/**
 * Hook to block right-click context menu.
 * Can be applied to specific elements or the whole document.
 */
export function useBlockContextMenu(
  elementRef?: React.RefObject<HTMLElement | null>,
) {
  useEffect(() => {
    const block = (e: Event) => {
      e.preventDefault();
    };

    const target = elementRef?.current || document;
    target.addEventListener("contextmenu", block);

    return () => {
      target.removeEventListener("contextmenu", block);
    };
  }, [elementRef]);
}
