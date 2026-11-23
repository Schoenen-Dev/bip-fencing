// Show every date box on the site as dd-mm-yyyy (23-11-2026),
// whatever language / region the phone or browser is set to.
// The real value stays yyyy-mm-dd, so nothing else in the app changes.
// Load once from main.jsx:  import "./utils/dateFormatFix";

const SEL = 'input[type="date"]';

const dmy = (v) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v || "");
  return m ? `${m[3]}-${m[2]}-${m[1]}` : "";
};

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;");

function paint(inp, force) {
  if (!force && document.activeElement === inp) return; // while typing: normal box
  const text = dmy(inp.value) || "dd-mm-yyyy";
  const key = `${text}|${inp.offsetHeight}`;
  if (inp.dataset.dmyKey === key) return;
  inp.dataset.dmyKey = key;
  const cs = getComputedStyle(inp);
  const color = inp.value ? cs.getPropertyValue("--dmy-color") || "#0f172a" : "#94a3b8";
  const size = parseFloat(cs.fontSize) || 14;
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="${Math.max(inp.offsetHeight, 20)}">` +
    `<text x="0" y="50%" dominant-baseline="central" font-family="${esc(cs.fontFamily).replace(/"/g, "'")}" ` +
    `font-size="${size}" fill="${color}">${esc(text)}</text></svg>`;
  inp.style.backgroundImage = `url("data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}")`;
  inp.style.backgroundRepeat = "no-repeat";
  inp.style.backgroundPosition = `${cs.paddingLeft} center`;
  inp.style.color = "transparent";
  inp.classList.add("dmy-on");
}

function unpaint(inp) {
  inp.style.backgroundImage = "";
  inp.style.color = "";
  inp.dataset.dmyKey = "";
  inp.classList.remove("dmy-on");
}

function sweep() {
  document.querySelectorAll(SEL).forEach(paint);
}

if (typeof window !== "undefined" && !window.__dmyFix) {
  window.__dmyFix = true;
  const style = document.createElement("style");
  style.textContent =
    "input[type=date].dmy-on::-webkit-datetime-edit{color:transparent}" +
    "input[type=date].dmy-on::-webkit-calendar-picker-indicator{opacity:.6}";
  document.head.appendChild(style);

  document.addEventListener("focusin", (e) => e.target.matches?.(SEL) && unpaint(e.target));
  document.addEventListener("focusout", (e) => e.target.matches?.(SEL) && setTimeout(() => paint(e.target), 0));
  // phone picker closed with a date → show it as dd-mm-yyyy straight away
  document.addEventListener("change", (e) => e.target.matches?.(SEL) && setTimeout(() => { e.target.dataset.dmyKey = ""; paint(e.target, true); }, 0), true);
  // new boxes (pages / modals opening) and values set by the app
  new MutationObserver(() => requestAnimationFrame(sweep)).observe(document.documentElement, { childList: true, subtree: true });
  setInterval(sweep, 700);
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", sweep);
  else sweep();
}
