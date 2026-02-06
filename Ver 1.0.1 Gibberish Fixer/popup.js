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
  let out = "";
  for (const c of text) out += map[c] || c;
  return { out, map };
}

document.addEventListener("DOMContentLoaded", () => {
  const input = document.getElementById("input");
  const output = document.getElementById("output");
  const pasteBtn = document.getElementById("pasteBtn");
  const copyBtn = document.getElementById("copyBtn");

  if (!input || !output || !pasteBtn || !copyBtn) return;

  const updateCopyState = () => {
    copyBtn.disabled = output.value.trim() === "";
  };

  input.focus();
  updateCopyState();

  input.addEventListener("input", () => {
    const { out, map } = convert(input.value);
    output.value = out;
    output.style.direction = map === HE_TO_EN ? "ltr" : "rtl";
    updateCopyState();
  });

  pasteBtn.addEventListener("click", async () => {
    const text = await navigator.clipboard.readText();
    if (!text) return;

    input.value = text;
    const { out, map } = convert(text);
    output.value = out;
    output.style.direction = map === HE_TO_EN ? "ltr" : "rtl";
    updateCopyState();
  });

  copyBtn.addEventListener("click", async () => {
    if (copyBtn.disabled) return;

    await navigator.clipboard.writeText(output.value);

    input.value = "";
    output.value = "";
    updateCopyState();
    input.focus();
  });
});
