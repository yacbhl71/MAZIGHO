/**
 * MAZIGHO Fulfillment — Pont côté admin MAZIGHO.
 * S'exécute sur les pages MAZIGHO. Fait le lien entre la page (React) et
 * l'extension via window.postMessage, sans exposer aucun jeton.
 */
(function () {
  const VERSION = "0.1.0";

  // Signale la présence de l'extension à la page (DOM partagé entre "worlds").
  document.documentElement.setAttribute("data-mazigho-fulfillment-ext", VERSION);

  window.addEventListener("message", (event) => {
    if (event.source !== window) return;
    const data = event.data;
    if (!data || data.source !== "MAZIGHO_ADMIN") return;

    if (data.type === "MAZIGHO_PING") {
      window.postMessage({ source: "MAZIGHO_EXT", type: "MAZIGHO_PONG", version: VERSION }, window.location.origin);
      return;
    }

    if (data.type === "MAZIGHO_FULFILL_ORDER") {
      chrome.runtime.sendMessage({ type: "MAZIGHO_START_FULFILLMENT", payload: data.payload }, (resp) => {
        window.postMessage(
          {
            source: "MAZIGHO_EXT",
            type: resp && resp.ok ? "FULFILLMENT_STARTED" : "FULFILLMENT_ERROR",
            tabId: resp && resp.tabId,
            error: resp && resp.error,
            orderId: data.payload && data.payload.orderId,
          },
          window.location.origin
        );
      });
    }
  });

  // Annonce prête (au cas où la page écoute)
  window.postMessage({ source: "MAZIGHO_EXT", type: "EXT_READY", version: VERSION }, window.location.origin);
})();
