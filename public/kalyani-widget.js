/* Shared Apex landing-page entry point. No microphone or provider request on load. */
(() => {
  if (document.getElementById("apex-kalyani-entry")) return;
  const source = document.currentScript?.dataset.source || "leados";
  const allowed = ["apex", "shop", "autonoma", "business-os", "leados"];
  if (!allowed.includes(source)) return;
  const link = document.createElement("a");
  link.id = "apex-kalyani-entry";
  link.href = `https://apex-leados.lovable.app/call?source=${encodeURIComponent(source)}`;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  link.textContent = "Talk to Kalyani · AI";
  link.setAttribute(
    "aria-label",
    "Talk to Kalyani, Apex AI assistant. Opens a browser consultation.",
  );
  const style = document.createElement("style");
  style.textContent = `#apex-kalyani-entry{position:fixed;right:max(16px,env(safe-area-inset-right));bottom:calc(88px + env(safe-area-inset-bottom));z-index:90;display:inline-flex;align-items:center;justify-content:center;min-height:48px;max-width:calc(100vw - 32px);padding:12px 18px;border:1px solid #7df9db;border-radius:999px;background:#071d21;color:#a7ffe6;font:600 14px/1.4 system-ui,sans-serif;text-decoration:none;box-shadow:0 8px 32px #0005}#apex-kalyani-entry:focus-visible{outline:3px solid #fff;outline-offset:4px}#apex-kalyani-entry[hidden]{display:none}@media(max-width:400px){#apex-kalyani-entry{font-size:13px;padding:10px 14px}}`;
  document.head.appendChild(style);
  document.body.appendChild(link);
  const visibility = () => {
    link.hidden = !["/", "/about", "/about/"].includes(location.pathname);
  };
  visibility();
  window.addEventListener("popstate", visibility);
  // Covers router navigations without changing or intercepting app navigation.
  window.setInterval(visibility, 1000);
})();
