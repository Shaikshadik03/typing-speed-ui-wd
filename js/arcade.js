const wordBank = 'fern moss rain mint leaf seed bloom cloud petal grove river clover pollen meadow forest sapling garden blossom firefly orchard sunflower butterfly'.split(' ');
const arcadeInput = byId('arcInput');
const arcadeStart = byId('arcStart');
const arcadeDuration = byId('arcDuration');
const arcadeReset = byId('arcReset');
let errors = 0, previousWrong = false;
const arcadeWord = byId('arcWord');
let arcTick = 0, arcDeadline = 0, flowers = 0, wordIndex = 0, arcadeBest = 0;
function arcadeBestKey() {
  return 'keysprout-arcade-best' + (arcadeDuration.value === '30' ? '' : '-' + arcadeDuration.value);
}
function readArcadeBest() {
  try { return Number(localStorage.getItem(arcadeBestKey())) || 0; } catch { return 0; }
}
arcadeBest = readArcadeBest();
byId('arcBest').textContent = 'Best: ' + arcadeBest;

function showWord(value = '') {
  const word = wordBank[wordIndex];
  let match = 0;
  while (match < value.length && match < word.length && value[match] === word[match]) match++;
  arcadeInput.setAttribute('aria-invalid', match < value.length);
  const prefix = document.createElement('span');
  prefix.className = 'grown';
  prefix.textContent = word.slice(0, match);
  arcadeWord.replaceChildren(prefix, word.slice(match));
}

function stopArcade(completed) {
  clearInterval(arcTick);
  arcTick = 0;
  arcadeInput.disabled = true;
  arcadeInput.value = '';
  arcadeStart.disabled = arcadeDuration.disabled = false;
  arcadeReset.disabled = true;
  arcadeInput.setAttribute('aria-invalid', 'false');
  arcadeStart.textContent = 'Play again';
  arcadeWord.textContent = completed ? 'Round complete' : 'Ready';
  if (completed && flowers > arcadeBest) {
    arcadeBest = flowers;
    try { localStorage.setItem(arcadeBestKey(), String(arcadeBest)); } catch {}
    byId('arcBest').textContent = 'Best: ' + arcadeBest;
  }
  byId('arcStatus').textContent = completed ? 'Round finished. Words completed: ' + flowers + '.' : 'Round ended. Start again when you’re ready.';
}

function updateArcadeAccuracy() {
  const total = flowers + errors;
  byId('arcAccuracy').textContent = 'Clean entries ' + (total ? Math.round(flowers / total * 100) + '%' : '—');
}

arcadeDuration.addEventListener('change', () => {
  byId('arcClock').max = byId('arcClock').value = Number(arcadeDuration.value);
  byId('arcTime').textContent = arcadeDuration.value + 's';
  arcadeBest = readArcadeBest();
  byId('arcBest').textContent = 'Best: ' + arcadeBest;
});
arcadeReset.addEventListener('click', () => {
  stopArcade(false);
  flowers = errors = 0;
  byId('arcScore').textContent = '0 words';
  byId('arcStatus').textContent = '';
  updateArcadeAccuracy();
  byId('arcClock').value = Number(arcadeDuration.value);
  byId('arcTime').textContent = arcadeDuration.value + 's';
  arcadeStart.focus();
});

function refreshArcadeClock() {
  const remaining = Math.max(0, (arcDeadline - performance.now()) / 1000);
  byId('arcTime').textContent = Math.ceil(remaining) + 's';
  byId('arcClock').value = remaining;
  if (!remaining) stopArcade(true);
}

arcadeStart.addEventListener('click', () => {
  flowers = errors = 0;
  previousWrong = false;
  updateArcadeAccuracy();
  wordIndex = Math.floor(Math.random() * 8);
  byId('arcScore').textContent = '0 words';
  byId('arcStatus').textContent = '';
  arcadeInput.value = '';
  arcadeInput.disabled = false;
  arcadeStart.disabled = arcadeDuration.disabled = true;
  arcadeReset.disabled = false;
  byId('arcClock').max = Number(arcadeDuration.value);
  arcDeadline = performance.now() + Number(arcadeDuration.value) * 1000;
  arcTick = setInterval(refreshArcadeClock, 100);
  refreshArcadeClock();
  showWord();
  arcadeInput.focus();
});
arcadeInput.addEventListener('paste', event => event.preventDefault());
arcadeInput.addEventListener('drop', event => event.preventDefault());
arcadeInput.addEventListener('input', event => {
  if (!arcTick || event.isComposing) return;
  if (performance.now() >= arcDeadline) {
    refreshArcadeClock();
    return;
  }
  const value = arcadeInput.value.toLowerCase();
  const wrong = !wordBank[wordIndex].startsWith(value);
  if (wrong && !previousWrong) errors++;
  previousWrong = wrong;
  updateArcadeAccuracy();
  if (value !== wordBank[wordIndex]) {
    showWord(value);
    return;
  }
  flowers++;
  updateArcadeAccuracy();
  byId('arcScore').textContent = flowers + (flowers === 1 ? ' word' : ' words');
  wordIndex = (wordIndex + 1) % wordBank.length;
  arcadeInput.value = '';
  const field = byId('arcField');
  field.classList.remove('bloom');
  requestAnimationFrame(() => {
    if (arcTick) field.classList.add('bloom');
  });
  showWord();
});

