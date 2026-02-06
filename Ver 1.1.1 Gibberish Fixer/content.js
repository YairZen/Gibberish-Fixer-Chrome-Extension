const HE_TO_EN = {
  "ק":"e","ר":"r","א":"t","ט":"y","ו":"u","ן":"i","ם":"o","פ":"p",
  "ש":"a","ד":"s","ג":"d","כ":"f","ע":"g","י":"h","ח":"j","ל":"k","ך":"l","ף":";",
  "ז":"z","ס":"x","ב":"c","ה":"v","נ":"b","מ":"n","צ":"m","ת":",","ץ":"."
};

const EN_TO_HE = Object.fromEntries(
  Object.entries(HE_TO_EN).map(([k, v]) => [v, k])
);

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

chrome.runtime.onMessage.addListener((msg) => {
  if (msg.action !== "FIX") return;

  const el = document.activeElement;

  if (
    el &&
    (el.tagName === "TEXTAREA" ||
     el.tagName === "INPUT" ||
     el.isContentEditable)
  ) {
    const start = el.selectionStart ?? 0;
    const end = el.selectionEnd ?? 0;

    if (start === end) {
      showToast("Select text to fix", false);
      return;
    }

    const text = el.value !== undefined
      ? el.value.slice(start, end)
      : window.getSelection().toString();

    const fixed = convert(text);
    if (fixed === text) {
      showToast("Nothing to fix", false);
      return;
    }

    if (el.value !== undefined) {
      el.value =
        el.value.slice(0, start) +
        fixed +
        el.value.slice(end);
      el.selectionStart = el.selectionEnd = start + fixed.length;
    } else {
      document.execCommand("insertText", false, fixed);
    }

    showToast("Text fixed", true);
    return;
  }

  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0 || !sel.toString().trim()) {
    showToast("Select text to fix", false);
    return;
  }

  const range = sel.getRangeAt(0);
  const text = sel.toString();
  const fixed = convert(text);

  if (fixed === text) {
    showToast("Nothing to fix", false);
    return;
  }

  try {
    range.deleteContents();
    range.insertNode(document.createTextNode(fixed));
    sel.removeAllRanges();
    showToast("Text fixed", true);
  } catch {
    showToast("Cannot replace selection", false);
  }
});

function showToast(message, success) {
  const div = document.createElement("div");
  div.textContent = message;

  Object.assign(div.style, {
    position: "fixed",
    bottom: "24px",
    right: "24px",
    background: success ? "#1a73e8" : "#333",
    color: "#fff",
    padding: "8px 14px",
    borderRadius: "999px",
    fontSize: "13px",
    zIndex: 999999
  });

  document.body.appendChild(div);
  setTimeout(() => div.remove(), 2000);
}
