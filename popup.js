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
    if (c >= '\u0590' && c <= '\u05FF') he++;
    if (/[a-zA-Z]/.test(c)) en++;
  }
  return he > en ? HE_TO_EN : EN_TO_HE;
}

const input = document.getElementById("input");
const output = document.getElementById("output");
const copyBtn = document.getElementById("copyBtn");

// Auto-focus on open (Google-like: zero friction)
window.addEventListener("DOMContentLoaded", () => input.focus());

input.addEventListener("input", e => {
  const text = e.target.value;

  const map = guessMap(text);
  let out = "";
  for (const c of text) out += map[c] || c;

  output.value = out;
  output.style.direction = (map === HE_TO_EN) ? "ltr" : "rtl";
});

copyBtn.addEventListener("click", async () => {
  await navigator.clipboard.writeText(output.value);

  // tiny feedback
  const old = copyBtn.textContent;
  copyBtn.textContent = "Copied ✓";
  setTimeout(() => (copyBtn.textContent = old), 900);

  // Clear on copy (optional behavior; you asked for it)
  input.value = "";
  output.value = "";
  input.focus();
});
