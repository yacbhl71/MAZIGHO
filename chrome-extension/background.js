/**
 * MAZIGHO Fulfillment — Service worker (MV3).
 * Rôle : recevoir l'ordre depuis l'admin MAZIGHO, ouvrir l'onglet AliExpress
 * au premier plan (session de l'utilisateur), et transmettre les données de la
 * commande au content-script AliExpress.
 */

const jobsByTab = {}; // tabId -> payload (mémoire volatile)

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (!msg || !msg.type) return;

  // 1) Déclenché depuis la page admin MAZIGHO (via content-mazigho.js)
  if (msg.type === "MAZIGHO_START_FULFILLMENT") {
    const payload = msg.payload;
    const firstItem = payload && payload.items && payload.items.find((i) => i.aliexpressProductUrl);
    if (!firstItem) {
      sendResponse({ ok: false, error: "NO_SUPPLIER_URL" });
      return true;
    }
    chrome.tabs.create({ url: firstItem.aliexpressProductUrl, active: true }, (tab) => {
      if (tab && tab.id != null) {
        jobsByTab[tab.id] = payload;
        chrome.storage.session.set({ [`job_${tab.id}`]: payload, lastStatus: { ts: Date.now(), orderId: payload.orderId, step: "opened", message: "Onglet AliExpress ouvert" } });
      }
      sendResponse({ ok: true, tabId: tab && tab.id });
    });
    return true; // réponse asynchrone
  }

  // 2) Le content-script AliExpress réclame les données de sa commande
  if (msg.type === "AE_CONTENT_READY") {
    const tabId = sender.tab && sender.tab.id;
    const inMem = tabId != null ? jobsByTab[tabId] : null;
    if (inMem) {
      sendResponse({ ok: true, payload: inMem });
      return true;
    }
    if (tabId != null) {
      chrome.storage.session.get(`job_${tabId}`, (res) => sendResponse({ ok: true, payload: res[`job_${tabId}`] || null }));
      return true;
    }
    sendResponse({ ok: false, payload: null });
    return true;
  }

  // 3) Remontée de statut (pour le popup / journal)
  if (msg.type === "AE_STATUS") {
    chrome.storage.session.set({
      lastStatus: { ts: Date.now(), orderId: msg.orderId, step: msg.step, blocked: !!msg.blocked, message: msg.message || "" },
    });
    return;
  }
});

chrome.tabs.onRemoved.addListener((tabId) => {
  delete jobsByTab[tabId];
  chrome.storage.session.remove(`job_${tabId}`);
});
