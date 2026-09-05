/**
 * MAZIGHO Fulfillment — Automatisation AliExpress (Mode A : Extension Chrome).
 * ------------------------------------------------------------------
 * S'exécute dans l'onglet AliExpress ouvert par l'extension, en utilisant la
 * SESSION de l'utilisateur (cookies, compte connecté). L'onglet est au premier
 * plan : en cas de captcha/connexion, l'utilisateur le voit et le résout lui-même,
 * le script attend puis reprend automatiquement.
 *
 * ARRÊT SÉCURISÉ : le script NE CLIQUE JAMAIS sur « Payer ». Il s'arrête sur la
 * page de paiement et laisse l'utilisateur valider visuellement.
 *
 * Tous les sélecteurs proviennent de selectors.js (fichier unique à maintenir).
 * ------------------------------------------------------------------
 */
(function () {
  const S = globalThis.MAZIGHO_AE_SELECTORS || {};
  let payload = null;
  const overlay = createOverlay();

  chrome.runtime.sendMessage({ type: "AE_CONTENT_READY" }, (resp) => {
    if (resp && resp.ok && resp.payload) {
      payload = resp.payload;
      run().catch((err) => {
        setStatus("Erreur : " + err.message, "error");
        report("error", { message: err.message });
      });
    } else {
      setStatus("Aucune commande associée à cet onglet.", "idle");
    }
  });

  // ------------------------------- FLUX ---------------------------------
  async function run() {
    const item = (payload.items || []).find((i) => i.aliexpressProductUrl) || payload.items[0];
    setStatus(`Commande #${payload.orderId} — préparation de la variante…`, "running");
    report("start", { message: "Automatisation démarrée" });

    await ensureNotBlocked();
    await selectVariant(item);
    await setQuantity(item ? item.quantity : 1);

    await ensureNotBlocked();
    setStatus("Ajout au panier / achat…", "running");
    await addToCartOrBuyNow();

    await ensureNotBlocked();
    setStatus("Ouverture du tunnel de commande…", "running");
    await goToCheckout();

    await ensureNotBlocked();
    setStatus("Renseignement de l'adresse de livraison…", "running");
    await fillShippingAddress(payload.shippingAddress || {});

    await ensureNotBlocked();
    await selectStandardShipping();

    // ARRÊT SÉCURISÉ
    await waitForPaymentPage();
    setStatus("✅ Prêt. Vérifiez la commande et cliquez VOUS-MÊME sur « Payer ».", "done");
    report("ready_for_payment", { message: "Arrêt avant paiement" });
    highlightPaymentArea();
  }

  // --------------------------- ÉTAPES ----------------------------------
  async function selectVariant(item) {
    // Best-effort : si un mapping SKU/options fournisseur existe, on tente de
    // cliquer sur les valeurs correspondantes. Sinon on laisse l'utilisateur choisir.
    if (!item) return;
    const map = item.supplierVariantMap;
    let target = null;
    if (map && typeof map === "object") {
      const first = Object.values(map)[0];
      if (first && first.supplierOptions) target = String(first.supplierOptions);
    }
    if (!target) {
      setStatus("⚠️ Variante non mappée — sélectionnez couleur/taille manuellement si besoin.", "warn");
      return;
    }
    const wanted = target.split(/[|/,-]/).map((s) => s.trim().toLowerCase()).filter(Boolean);
    const values = document.querySelectorAll(S.product?.skuValue || "");
    for (const el of values) {
      const label = (el.getAttribute("title") || el.getAttribute("alt") || el.textContent || "").trim().toLowerCase();
      if (label && wanted.some((w) => label.includes(w))) {
        el.click();
        await sleep(400);
      }
    }
  }

  async function setQuantity(qty) {
    if (!qty || qty < 2) return;
    const input = q(S.product?.quantityInput);
    if (input) {
      input.focus();
      input.value = String(qty);
      input.dispatchEvent(new Event("input", { bubbles: true }));
      input.dispatchEvent(new Event("change", { bubbles: true }));
    }
  }

  async function addToCartOrBuyNow() {
    const buy = q(S.product?.buyNowBtn);
    if (buy) { buy.click(); return; }
    const cart = q(S.product?.addToCartBtn);
    if (cart) {
      cart.click();
      await sleep(1500);
      const checkout = await waitFor(S.cart?.checkoutBtn, 8000);
      if (checkout) checkout.click();
    } else {
      setStatus("⚠️ Bouton d'achat introuvable — mettez à jour selectors.js.", "warn");
    }
  }

  async function goToCheckout() {
    // Après « Buy now » / panier, AliExpress redirige vers le checkout.
    await sleep(1500);
  }

  async function fillShippingAddress(addr) {
    // Ouvre « Ajouter une nouvelle adresse » si présent.
    const addBtn = q(S.checkout?.addNewAddressBtn);
    if (addBtn && isVisible(addBtn)) { addBtn.click(); await sleep(800); }

    const fullName = addr.fullName || [addr.firstName, addr.lastName].filter(Boolean).join(" ");
    await fill(S.checkout?.inputContactName, fullName);
    await fill(S.checkout?.inputPhone, addr.phone);

    // Pays d'abord (AliExpress rafraîchit souvent le formulaire selon le pays).
    if (addr.countryCode) {
      const select = q(S.checkout?.selectCountry);
      if (select) { setSelectValue(select, addr.countryCode); await sleep(800); }
    }

    await fill(S.checkout?.inputAddressLine1, addr.address1);
    await fill(S.checkout?.inputAddressLine2, addr.address2);
    await fill(S.checkout?.inputZipCode, addr.zip);
    await fill(S.checkout?.inputCity, addr.city);
    await fill(S.checkout?.inputState, addr.state);

    if (!addr.address1 || !addr.zip || !addr.city) {
      setStatus("⚠️ Adresse incomplète côté MAZIGHO — complétez les champs manquants.", "warn");
    }

    const save = q(S.checkout?.saveAddressBtn);
    if (save && isVisible(save)) { save.click(); await sleep(1200); }
  }

  async function selectStandardShipping() {
    const standard = q(S.checkout?.shippingStandard) || q(S.checkout?.shippingOption);
    if (standard) { standard.click(); await sleep(500); }
  }

  async function waitForPaymentPage() {
    await waitFor(S.checkout?.placeOrderBtn, 12000);
  }

  function highlightPaymentArea() {
    const pay = q(S.checkout?.placeOrderBtn);
    if (pay) {
      pay.style.outline = "3px solid #f97316";
      pay.style.outlineOffset = "3px";
      pay.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }

  // ------------------- ANTI-BLOCAGE (captcha / login) -------------------
  function isBlocked() {
    const sel = [S.security?.captcha, S.security?.slider, S.security?.login].filter(Boolean).join(",");
    if (!sel) return false;
    const el = document.querySelector(sel);
    return !!(el && isVisible(el));
  }

  async function ensureNotBlocked() {
    let waited = 0;
    while (isBlocked()) {
      setStatus("⛔ Blocage AliExpress (captcha / connexion). Résolvez-le dans cet onglet, je reprends ensuite…", "blocked");
      report("blocked", { blocked: true, message: "Captcha ou connexion requis" });
      await sleep(2000);
      waited += 2000;
      if (waited > 5 * 60 * 1000) throw new Error("Blocage non résolu (timeout).");
    }
  }

  // ----------------------------- OUTILS --------------------------------
  function q(selector) { return selector ? document.querySelector(selector) : null; }
  function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }
  function isVisible(el) {
    if (!el) return false;
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0 && getComputedStyle(el).visibility !== "hidden";
  }
  async function waitFor(selector, timeout = 8000) {
    if (!selector) return null;
    const start = Date.now();
    while (Date.now() - start < timeout) {
      const el = document.querySelector(selector);
      if (el && isVisible(el)) return el;
      await sleep(300);
    }
    return null;
  }
  async function fill(selector, value) {
    if (!selector || value == null || value === "") return;
    const el = await waitFor(selector, 4000);
    if (!el) return;
    el.focus();
    el.value = value;
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
    await sleep(150);
  }
  function setSelectValue(select, value) {
    const opt = Array.from(select.options).find(
      (o) => o.value.toUpperCase() === value.toUpperCase() || o.text.toUpperCase().includes(value.toUpperCase())
    );
    if (opt) { select.value = opt.value; select.dispatchEvent(new Event("change", { bubbles: true })); }
  }
  function report(step, extra) {
    chrome.runtime.sendMessage({ type: "AE_STATUS", orderId: payload && payload.orderId, step, ...extra });
  }

  // ----------------------------- OVERLAY -------------------------------
  function createOverlay() {
    const box = document.createElement("div");
    box.id = "mazigho-fulfillment-overlay";
    box.style.cssText = [
      "position:fixed", "top:16px", "right:16px", "z-index:2147483647",
      "max-width:360px", "background:#0f172a", "color:#fff", "padding:14px 16px",
      "border-radius:12px", "box-shadow:0 10px 30px rgba(0,0,0,.35)",
      "font:13px/1.5 system-ui,Segoe UI,Roboto,sans-serif", "border:1px solid #1e293b",
    ].join(";");
    box.innerHTML =
      '<div style="display:flex;align-items:center;gap:8px;font-weight:700;margin-bottom:6px">' +
      '<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#f97316" id="mz-dot"></span>' +
      "MAZIGHO Fulfillment</div>" +
      '<div id="mz-status" style="color:#cbd5e1">Initialisation…</div>' +
      '<div style="margin-top:8px;font-size:11px;color:#f59e0b">🛑 Le script s\'arrête avant le paiement.</div>';
    (document.body || document.documentElement).appendChild(box);
    return box;
  }
  function setStatus(text, kind) {
    const s = document.getElementById("mz-status");
    const dot = document.getElementById("mz-dot");
    if (s) s.textContent = text;
    const colors = { running: "#38bdf8", done: "#22c55e", blocked: "#ef4444", warn: "#f59e0b", error: "#ef4444", idle: "#94a3b8" };
    if (dot) dot.style.background = colors[kind] || "#f97316";
  }
})();
