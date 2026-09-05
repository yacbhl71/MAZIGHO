chrome.storage.session.get("lastStatus", (res) => {
  const last = res.lastStatus;
  const el = document.getElementById("last");
  if (last && el) {
    const when = new Date(last.ts).toLocaleTimeString("fr-CH", { hour: "2-digit", minute: "2-digit" });
    el.textContent = `#${last.orderId ?? "—"} · ${last.step ?? ""} · ${when}`;
  }
});
