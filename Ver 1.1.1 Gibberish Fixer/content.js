// ===== Keyboard maps =====
const HE_TO_EN = {
  "ק":"e","ר":"r","א":"t","ט":"y","ו":"u","ן":"i","ם":"o","פ":"p",
  "ש":"a","ד":"s","ג":"d","כ":"f","ע":"g","י":"h","ח":"j","ל":"k","ך":"l","ף":";",
  "ז":"z","ס":"x","ב":"c","ה":"v","נ":"b","מ":"n","צ":"m","ת":",","ץ":"."
};

const EN_TO_HE = Object.fromEntries(
  Object.entries(HE_TO_EN).map(([k, v]) => [v, k])
);

// ===== Convert logic =====
function guessMap(text) {
  let he = 0, en = 0;
  for (const c of text) {
    if (c >= "\u0590" && c <= "\u05FF") he++;
    if (/[a-zA-Z]/.test(c)) en++;
  }
  return he > en ? HE_TO_EN : EN_TO_HE;
}

function convert(text) {
  const map = guessMap(text);
  if (map === HE_TO_EN) {
    return [...text].map(c => map[c] || c).join("").toLowerCase();
  }
  return [...text].map(c => map[c.toLowerCase()] || c).join("");
}

// ===== Message entry =====
chrome.runtime.onMessage.addListener((msg) => {
  if (msg.action === "FIX") runFix();
});

// ===== Core action =====
async function runFix() {
  const el = document.activeElement;

  // INPUT / TEXTAREA
  if (el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA")) {
    const start = el.selectionStart;
    const end = el.selectionEnd;
    if (start == null || end == null || start === end) return;

    const text = el.value.slice(start, end);
    const fixed = convert(text);
    if (fixed === text) return;

    try {
      if (typeof el.setRangeText === "function") {
        el.setRangeText(fixed, start, end, "end");
      } else {
        el.value = el.value.slice(0, start) + fixed + el.value.slice(end);
        el.selectionStart = el.selectionEnd = start + fixed.length;
      }

      el.dispatchEvent(new Event("input", { bubbles: true }));
      el.dispatchEvent(new Event("change", { bubbles: true }));

      showSnackbar("✓ Gibberish fixed");
      return;
    } catch {
      await copyFixed(fixed);
      showSnackbar("Copied");
      return;
    }
  }

  // CONTENTEDITABLE / PAGE SELECTION
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0 || !sel.toString().trim()) return;

  const range = sel.getRangeAt(0);
  const text = sel.toString();
  const fixed = convert(text);
  if (fixed === text) return;

  try {
    if (el && el.isContentEditable && document.queryCommandSupported?.("insertText")) {
      document.execCommand("insertText", false, fixed);
    } else {
      range.deleteContents();
      range.insertNode(document.createTextNode(fixed));
      sel.removeAllRanges();
    }
    showSnackbar("✓ Gibberish fixed");
  } catch {
    await copyFixed(fixed);
    showSnackbar("Copied");
  }
}

// ===== Clipboard fallback =====
async function copyFixed(text) {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return;
    }
  } catch {}

  const ta = document.createElement("textarea");
  ta.value = text;
  ta.setAttribute("readonly", "");
  ta.style.position = "fixed";
  ta.style.left = "-9999px";
  document.body.appendChild(ta);
  ta.select();
  try { document.execCommand("copy"); } catch {}
  ta.remove();
}

// ===== Snackbar (top-right, Google-like) =====
let snackbarEl = null;
let snackbarTimer = null;

function showSnackbar(message) {
  if (snackbarEl) {
    clearTimeout(snackbarTimer);
    snackbarEl.remove();
  }

  const div = document.createElement("div");
  div.textContent = message;

  Object.assign(div.style, {
    position: "fixed",
    top: "24px",
    right: "280px",
    bottom: "auto",
    background: "#E6F4EA",
    color: "#0D652D",
    padding: "10px 16px",
    borderRadius: "12px",
    fontSize: "14px",
    fontWeight: "500",
    zIndex: 2147483647,
    boxShadow: "0 1px 4px rgba(60,64,67,0.18)",
    pointerEvents: "none",
    whiteSpace: "nowrap",
    opacity: "0",
    transform: "translateY(-4px)",
    transition: "opacity 120ms ease, transform 120ms ease"
  });

  document.body.appendChild(div);
  requestAnimationFrame(() => {
    div.style.opacity = "1";
    div.style.transform = "translateY(0)";
  });

  snackbarEl = div;
  snackbarTimer = setTimeout(() => {
    div.style.opacity = "0";
    div.style.transform = "translateY(-4px)";
    setTimeout(() => div.remove(), 150);
    snackbarEl = null;
  }, 900);
}
