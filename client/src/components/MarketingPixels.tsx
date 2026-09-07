import { useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useMarketingConsent } from "@/contexts/MarketingConsentContext";

type PixelWindow = Window & {
  fbq?: any;
  _fbq?: any;
  ttq?: any;
  TiktokAnalyticsObject?: string;
};

function ensureMetaPixel(pixelId: string) {
  const win = window as PixelWindow;
  if (!win.fbq) {
    const fbq: any = function (...args: unknown[]) {
      if (fbq.callMethod) fbq.callMethod.apply(fbq, args);
      else fbq.queue.push(args);
    };
    fbq.queue = [];
    fbq.loaded = true;
    fbq.version = "2.0";
    win.fbq = fbq;
    win._fbq = fbq;

    const script = document.createElement("script");
    script.async = true;
    script.src = "https://connect.facebook.net/en_US/fbevents.js";
    script.dataset.mazighoTracking = "meta";
    document.head.appendChild(script);
  }

  if (!(win.fbq as any)._mazighoPixelIds) (win.fbq as any)._mazighoPixelIds = new Set<string>();
  if (!(win.fbq as any)._mazighoPixelIds.has(pixelId)) {
    win.fbq("init", pixelId);
    (win.fbq as any)._mazighoPixelIds.add(pixelId);
  }
  win.fbq("track", "PageView");
}

function ensureTikTokPixel(pixelId: string) {
  const win = window as PixelWindow;
  let ttq = win.ttq;

  if (!ttq?.load) {
    ttq = [] as any;
    const methods = ["page", "track", "identify", "instances", "debug", "on", "off", "once", "ready", "alias", "group", "enableCookie", "disableCookie"];
    ttq.methods = methods;
    ttq.setAndDefer = (target: any, method: string) => {
      target[method] = (...args: unknown[]) => {
        target.push([method, ...args]);
      };
    };
    methods.forEach((method: string) => ttq.setAndDefer(ttq, method));
    ttq.instance = (id: string) => {
      const instance = ttq._i?.[id] || [];
      methods.forEach((method: string) => ttq.setAndDefer(instance, method));
      return instance;
    };
    ttq.load = (id: string) => {
      const source = "https://analytics.tiktok.com/i18n/pixel/events.js";
      ttq._i = ttq._i || {};
      ttq._i[id] = [];
      ttq._i[id]._u = source;
      ttq._t = ttq._t || {};
      ttq._t[id] = Date.now();
      ttq._o = ttq._o || {};
      ttq._o[id] = {};
      const script = document.createElement("script");
      script.type = "text/javascript";
      script.async = true;
      script.src = `${source}?sdkid=${encodeURIComponent(id)}&lib=ttq`;
      script.dataset.mazighoTracking = "tiktok";
      document.head.appendChild(script);
    };
    win.TiktokAnalyticsObject = "ttq";
    win.ttq = ttq;
  }

  ttq._mazighoPixelIds = ttq._mazighoPixelIds || new Set<string>();
  if (!ttq._mazighoPixelIds.has(pixelId)) {
    ttq.load(pixelId);
    ttq._mazighoPixelIds.add(pixelId);
  }
  ttq.page();
}

/**
 * The only component allowed to load advertising scripts. IDs are requested only
 * after consent and all scripts are dynamically appended after that decision.
 */
export function MarketingPixels() {
  const { consent } = useMarketingConsent();
  const [location] = useLocation();
  const loadedMetaId = useRef<string | null>(null);
  const loadedTikTokId = useRef<string | null>(null);
  const isAdminPath = location.split("?")[0].startsWith("/admin");
  const pixelsQuery = trpc.content.getTrackingPixels.useQuery(undefined, {
    enabled: consent === "granted" && !isAdminPath,
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (consent !== "granted") {
      const win = window as PixelWindow;
      win.fbq?.("consent", "revoke");
      win.ttq?.disableCookie?.();
      document.querySelectorAll("script[data-mazigho-tracking]").forEach(script => script.remove());
      return;
    }
    if (!pixelsQuery.data || isAdminPath) return;
    const { metaPixelId, tiktokPixelId } = pixelsQuery.data;

    if (metaPixelId) {
      ensureMetaPixel(metaPixelId);
      loadedMetaId.current = metaPixelId;
    }
    if (tiktokPixelId) {
      ensureTikTokPixel(tiktokPixelId);
      loadedTikTokId.current = tiktokPixelId;
    }
  }, [consent, location, pixelsQuery.data, isAdminPath]);

  return null;
}
