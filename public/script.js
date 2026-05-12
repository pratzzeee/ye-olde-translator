/* ─────────────────────────────────────────
   Ye Olde Tongue — Frontend Logic
   Talks to /api/translate (our secure proxy)
   ───────────────────────────────────────── */

const inputEl   = document.getElementById('inputText');
const outputEl  = document.getElementById('outputArea');
const loadingEl = document.getElementById('loadingQuill');
const errorEl   = document.getElementById('errorMsg');
const btnEl     = document.getElementById('translateBtn');
const copyBtn   = document.getElementById('copyBtn');
const charCount = document.getElementById('charCount');

// ── Event wiring ──
inputEl.addEventListener('input', updateCharCount);
btnEl.addEventListener('click', doTranslate);
copyBtn.addEventListener('click', copyOutput);
inputEl.addEventListener('keydown', e => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') doTranslate();
});

function updateCharCount() {
  charCount.textContent = `${inputEl.value.length} / 2000`;
}

// ── Main translation ──
async function doTranslate() {
  const text = inputEl.value.trim();
  if (!text) { inputEl.focus(); return; }

  // Reset UI
  btnEl.disabled = true;
  outputEl.innerHTML = '';
  outputEl.classList.remove('revealed');
  errorEl.classList.remove('visible');
  errorEl.textContent = '';
  copyBtn.classList.remove('visible');
  loadingEl.classList.add('active');

  try {
    // Call OUR backend proxy — not Anthropic directly
    const response = await fetch('/api/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Unknown error');
    }

    loadingEl.classList.remove('active');
    outputEl.textContent = data.result;
    outputEl.classList.add('revealed');
    copyBtn.classList.add('visible');

  } catch (err) {
    loadingEl.classList.remove('active');
    errorEl.textContent = err.message || 'Alas! A grievous error hath occurred.';
    errorEl.classList.add('visible');
  }

  btnEl.disabled = false;
}

// ── Copy to clipboard ──
function copyOutput() {
  const text = outputEl.textContent;
  if (!text) return;

  navigator.clipboard.writeText(text).then(() => {
    copyBtn.textContent = '✓ Copied!';
    setTimeout(() => { copyBtn.textContent = '⊕ Copy Translation'; }, 2000);
  });
}
