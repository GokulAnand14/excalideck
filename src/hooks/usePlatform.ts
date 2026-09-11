import { useState, useEffect } from "react";
import { getPlatformInfo, PlatformInfo } from "../lib/tauri";

export interface PlatformState {
  os: "ios" | "android" | "windows" | "macos" | "linux" | "unknown";
  isNativeMobile: boolean;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isTouch: boolean;
  defaultVaultPath: string | null;
  loading: boolean;
}

function detectClientPlatform(): {
  os: "ios" | "android" | "windows" | "macos" | "linux" | "unknown";
  isTouch: boolean;
} {
  const ua = typeof navigator !== "undefined" ? navigator.userAgent.toLowerCase() : "";
  const isTouch =
    typeof window !== "undefined" &&
    ("ontouchstart" in window || (navigator && navigator.maxTouchPoints > 0));

  let os: "ios" | "android" | "windows" | "macos" | "linux" | "unknown" = "unknown";
  if (/ipad|iphone|ipod/.test(ua)) {
    os = "ios";
  } else if (/android/.test(ua)) {
    os = "android";
  } else if (/macintosh|mac os x/.test(ua)) {
    // iPadOS Safari reports as Macintosh with maxTouchPoints > 1
    if (isTouch && navigator.maxTouchPoints > 1) {
      os = "ios";
    } else {
      os = "macos";
    }
  } else if (/windows/.test(ua)) {
    os = "windows";
  } else if (/linux/.test(ua)) {
    os = "linux";
  }

  return { os, isTouch };
}

export const usePlatform = () => {
  const [platformState, setPlatformState] = useState<PlatformState>(() => {
    const client = detectClientPlatform();
    const width = typeof window !== "undefined" ? window.innerWidth : 1200;
    const isSmall = width <= 768;
    const isMid = width > 768 && width <= 1180 && client.isTouch;
    const isMobileOS = client.os === "ios" || client.os === "android";

    return {
      os: client.os,
      isNativeMobile: isMobileOS,
      isMobile: isMobileOS || isSmall,
      isTablet: isMid || (client.os === "ios" && width > 768),
      isDesktop: !isMobileOS && !isSmall && !isMid,
      isTouch: client.isTouch,
      defaultVaultPath: null,
      loading: true,
    };
  });

  useEffect(() => {
    let mounted = true;

    const queryBackendPlatform = async () => {
      try {
        const info: PlatformInfo = await getPlatformInfo();
        if (!mounted) return;

        const width = window.innerWidth;
        const client = detectClientPlatform();
        const effectiveOS = info.os !== "unknown" ? info.os : client.os;
        const isNativeMobile = info.isMobile || effectiveOS === "ios" || effectiveOS === "android";
        const isTablet =
          (effectiveOS === "ios" && width >= 768) ||
          (effectiveOS === "android" && width >= 600 && width <= 1280) ||
          (client.isTouch && width > 768 && width <= 1180);
        const isMobile = isNativeMobile ? (width < 768 || !isTablet) : width <= 768;
        const isDesktop = !isNativeMobile && width > 1024;

        setPlatformState({
          os: effectiveOS,
          isNativeMobile,
          isMobile,
          isTablet,
          isDesktop,
          isTouch: client.isTouch,
          defaultVaultPath: info.defaultVaultPath ?? null,
          loading: false,
        });
      } catch (err) {
        // Fallback to client heuristics if Tauri backend command is not ready
        if (!mounted) return;
        const width = window.innerWidth;
        const client = detectClientPlatform();
        const isMobileOS = client.os === "ios" || client.os === "android";
        const isTablet = client.isTouch && width >= 768 && width <= 1280;
        const isMobile = isMobileOS && width < 768;

        setPlatformState((prev) => ({
          ...prev,
          os: client.os,
          isNativeMobile: isMobileOS,
          isMobile: isMobile || width <= 768,
          isTablet,
          isDesktop: !isMobileOS && width > 1024,
          isTouch: client.isTouch,
          loading: false,
        }));
      }
    };

    queryBackendPlatform();

    const handleResize = () => {
      const width = window.innerWidth;
      const client = detectClientPlatform();
      setPlatformState((prev) => {
        const isTablet =
          (prev.os === "ios" && width >= 768) ||
          (prev.os === "android" && width >= 600 && width <= 1280) ||
          (client.isTouch && width > 768 && width <= 1180);
        const isMobile = prev.isNativeMobile ? (width < 768 || !isTablet) : width <= 768;
        const isDesktop = !prev.isNativeMobile && width > 1024;

        return {
          ...prev,
          isMobile,
          isTablet,
          isDesktop,
        };
      });
    };

    window.addEventListener("resize", handleResize);
    return () => {
      mounted = false;
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return platformState;
};
