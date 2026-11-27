
'use strict';
const passages = {
  easy: [
    'The sky is clear today. I will take a short walk after lunch and look for birds near the garden.',
    'My friend and I made tea after class. We sat by the window and watched the rain fall on the road.'
  ],
  medium: [
    'A good study session starts with one clear goal. Close the extra tabs, set a timer, and write a short summary when you finish.',
    'The library was quiet, so Mira found a window seat and opened her notebook. She reviewed her notes before writing a few practice questions.'
  ],
  hard: [
    'Debugging takes patience: read the error, check your assumptions, and change one thing at a time. If line 42 still fails, trace the input carefully.',
    'Before submitting the project, test three cases: an empty input, a typical value, and an unexpected symbol. Record what changed and why it mattered.'
  ]
};
const byId = id => document.getElementById(id);
const level = byId('level'), duration = byId('duration'), typing = byId('typing');
const start = byId('start'), reset = byId('reset'), passage = byId('passage');
const time = byId('time'), wpm = byId('wpm'), accuracy = byId('accuracy');
const status = byId('status'), bestBadge = byId('best');
const storageKey = 'keysprout-best-v1';
let best = 0;
try { best = Number(localStorage.getItem(storageKey)) || 0; } catch {}
let passageIndex = 0, target = '', startedAt = 0, deadline = 0, timer = 0;
let submittedText = '';
let mode = 'practice';
let rounds = [];
let achievements = { medium: false, hard: false };
try {
  const saved = JSON.parse(localStorage.getItem('keysprout-progress-v1'));
  if (Array.isArray(saved?.rounds)) rounds = saved.rounds;
  if (saved?.achievements) achievements = saved.achievements;
} catch {}
const practiceButton = byId('practice');
const dailyButton = byId('daily');

function today() {
  const date = new Date();
  return [date.getFullYear(), date.getMonth() + 1, date.getDate()].map(part => String(part).padStart(2, '0')).join('-');
}

function showProgress() {
  const completed = rounds.some(round => round.mode === 'daily' && round.date === today());
  byId('unlock').textContent = mode === 'daily'
    ? completed ? 'Daily challenge completed. Practise it again any time today.' : 'Same passage all day. Finish it to complete today’s challenge.'
    : achievements.hard ? 'All levels unlocked.' : 'Finish ' + (achievements.medium ? 'Medium' : 'Easy') + ' with 90% accuracy to unlock the next level.';
  level.options[1].disabled = !achievements.medium;
  level.options[2].disabled = !achievements.hard;
  byId('emptyHistory').hidden = rounds.length > 0;
  byId('history').replaceChildren(...rounds.slice(0, 10).map(round => {
    const row = document.createElement('li');
    const label = document.createElement('span');
    const score = document.createElement('strong');
    label.textContent = round.mode === 'daily' ? 'Daily · ' + round.date : round.level + ' · ' + round.date;
    score.textContent = round.score + ' WPM · ' + round.percent + '%';
    row.append(label, score);
    return row;
  }));
}

function switchMode(next) {
  mode = next;
  practiceButton.classList.toggle('selected', mode === 'practice');
  dailyButton.classList.toggle('selected', mode === 'daily');
  practiceButton.setAttribute('aria-pressed', mode === 'practice');
  dailyButton.setAttribute('aria-pressed', mode === 'daily');
  clearRound();
  showProgress();
}

function showBest() {
  bestBadge.textContent = best ? 'Best ' + best + ' WPM' : 'Best —';
}

function renderPassage() {
  const fragment = document.createDocumentFragment();
  for (let index = 0; index < target.length; index++) {
    const character = document.createElement('span');
    character.textContent = target[index];
    if (index < submittedText.length) {
      character.className = submittedText[index] === target[index] ? 'correct' : 'incorrect';
    } else if (timer && index === submittedText.length) {
      character.className = 'current';
    }
    fragment.append(character);
  }
  passage.replaceChildren(fragment);
  byId('progress').value = Math.min(submittedText.length / target.length, 1);
}

function clearRound() {
  clearInterval(timer);
  timer = 0;
  const dailyPassages = Object.values(passages).flat();
  const dayIndex = Math.floor(Date.parse(today()) / 86400000);
  target = mode === 'daily' ? dailyPassages[dayIndex % dailyPassages.length] : passages[level.value][passageIndex];
  submittedText = '';
  typing.value = '';
  typing.disabled = true;
  typing.placeholder = 'Press Start to begin';
  level.disabled = duration.disabled = mode === 'daily';
  start.disabled = practiceButton.disabled = dailyButton.disabled = false;
  time.textContent = (mode === 'daily' ? 60 : duration.value) + 's';
  wpm.textContent = accuracy.textContent = '—';
  status.textContent = '';
  renderPassage();
}

function finish(now, message) {
  clearInterval(timer);
  timer = 0;
  let correct = 0;
  for (let index = 0; index < submittedText.length; index++) {
    if (submittedText[index] === target[index]) correct++;
  }
  const minutes = Math.max(1000, Math.min(now, deadline) - startedAt) / 60000;
  const score = Math.round(correct / 5 / minutes);
  const percent = submittedText.length ? Math.round(correct / submittedText.length * 100) : 0;
  wpm.textContent = score;
  accuracy.textContent = percent + '%';
  typing.disabled = true;
  start.disabled = practiceButton.disabled = dailyButton.disabled = false;
  level.disabled = duration.disabled = mode === 'daily';
  const completed = submittedText.length >= target.length;
  if (mode === 'practice' && completed && percent >= 90) {
    if (level.value === 'easy') achievements.medium = true;
    if (level.value === 'medium') achievements.hard = true;
  }
  if (submittedText.length && (mode === 'practice' || completed)) {
    rounds = [{ mode, date: today(), level: level.selectedOptions[0].textContent, score, percent }, ...rounds].slice(0, 100);
    try { localStorage.setItem('keysprout-progress-v1', JSON.stringify({ rounds, achievements })); } catch {}
  }
  showProgress();
  if (score > best) {
    best = score;
    try { localStorage.setItem(storageKey, String(best)); } catch {}
    showBest();
  }
  renderPassage();
  status.textContent = message + ' ' + score + ' WPM, ' + percent + '% accuracy.';
}

function tick() {
  const now = performance.now();
  const remaining = Math.max(0, Math.ceil((deadline - now) / 1000));
  time.textContent = remaining + 's';
  if (remaining === 0) finish(now, 'Time is up.');
}

start.addEventListener('click', () => {
  if (status.textContent) passageIndex = (passageIndex + 1) % passages[level.value].length;
  clearRound();
  startedAt = performance.now();
  deadline = startedAt + (mode === 'daily' ? 60 : Number(duration.value)) * 1000;
  practiceButton.disabled = dailyButton.disabled = true;
  level.disabled = duration.disabled = start.disabled = true;
  typing.disabled = false;
  timer = setInterval(tick, 100);
  renderPassage();
  typing.focus();
});

typing.addEventListener('paste', event => event.preventDefault());
typing.addEventListener('drop', event => event.preventDefault());
typing.addEventListener('input', event => {
  if (!timer || event.isComposing) return;
  const now = performance.now();
  if (now >= deadline) {
    typing.value = submittedText;
    tick();
    return;
  }
  submittedText = typing.value;
  renderPassage();
  if (submittedText.length >= target.length) {
    time.textContent = Math.ceil((deadline - now) / 1000) + 's';
    finish(now, 'Passage complete!');
  }
});

reset.addEventListener('click', clearRound);
level.addEventListener('change', () => { passageIndex = 0; clearRound(); });
duration.addEventListener('change', clearRound);
practiceButton.addEventListener('click', () => switchMode('practice'));
dailyButton.addEventListener('click', () => switchMode('daily'));
showBest();
clearRound();
showProgress();

const lessons = [
  { title: 'Index fingers', keys: 'F, J & Space', drills: ['fff jjj', 'fj fj jf', 'jff jfjf'] },
  { title: 'Home row', keys: 'A, S, D, K, L', drills: ['asd lkj', 'ask dad', 'fall salad'] },
  { title: 'Top row', keys: 'Q through P', drills: ['qwer uiop', 'type quiet', 'write tall'] },
  { title: 'Bottom row', keys: 'Z through M', drills: ['zxc vbnm', 'mix cab', 'zoom van'] },
  { title: 'Everyday words', keys: 'Mixed letters', drills: ['calm hands', 'find rhythm', 'type each day'] }
];
const fingerGroups = [
  ['qaz', 'Left pinky'], ['wsx', 'Left ring finger'], ['edc', 'Left middle finger'],
  ['rfvtgb', 'Left index finger'], ['yhnujm', 'Right index finger'],
  ['ik', 'Right middle finger'], ['ol', 'Right ring finger'], ['p', 'Right pinky']
];
const lessonStorage = 'keysprout-lessons-v1';
let records = {};
try { records = JSON.parse(localStorage.getItem(lessonStorage)) || {}; } catch {}
let lessonIndex = 0;
let stage = 0;
let position = 0;
let attempts = 0;
let hits = 0;
let combo = 0;
let bestCombo = 0;
const stars = accuracy => accuracy >= 95 ? 3 : accuracy >= 85 ? 2 : 1;
let lessonStart = 0;
let active = false;
let done = false;
let mistake = false;
const keys = new Map();
const choices = byId('lessonChoices');
const drillButton = byId('activate');

function renderLessons() {
  byId('lessonSummary').textContent = Object.keys(records).length + ' of ' + lessons.length + ' completed';
  byId('xp').textContent = Object.values(records).reduce((xp, record) => xp + 20 * stars(record.bestAccuracy ?? record.accuracy), 0) + ' XP';
  choices.replaceChildren(...lessons.map((lesson, index) => {
    const button = document.createElement('button');
    const record = records[index];
    button.textContent = lesson.title;
    const detail = document.createElement('small');
    detail.textContent = lesson.keys + (record ? ' · ' + stars(record.bestAccuracy ?? record.accuracy) + ' / 3 stars' : '');
    button.append(detail);
    button.setAttribute('aria-current', index === lessonIndex);
    button.addEventListener('click', () => resetLesson(index));
    return button;
  }));
}

function renderDrill() {
  const lesson = lessons[lessonIndex];
  const phrase = lesson.drills[stage];
  const next = done ? '' : phrase[position];
  byId('drillProgress').value = (stage + position / phrase.length) / lesson.drills.length;
  byId('combo').textContent = 'Combo ' + combo;
  byId('liveAccuracy').textContent = 'Accuracy ' + (attempts ? Math.round(hits / attempts * 100) + '%' : '—');
  const result = byId('lessonResult');
  result.hidden = !done;
  byId('advance').hidden = !done || lessonIndex === lessons.length - 1;
  if (done) {
    const score = records[lessonIndex];
    const title = document.createElement('strong');
    title.textContent = 'Lesson complete · ' + stars(score.accuracy) + ' / 3 stars';
    const stats = document.createElement('span');
    stats.textContent = score.wpm + ' WPM · ' + score.accuracy + '% accuracy · Best combo ' + bestCombo;
    result.replaceChildren(title, stats);
  }
  byId('drillTitle').textContent = lesson.title + ' — ' + lesson.keys;
  byId('drillStage').textContent = 'Drill ' + (stage + 1) + ' of ' + lesson.drills.length;
  byId('tiles').replaceChildren(...Array.from(phrase, (letter, index) => {
    const tile = document.createElement('span');
    tile.className = 'tile' + (index < position ? ' correct' : index === position ? mistake ? ' error' : ' next' : '');
    tile.textContent = letter === ' ' ? '␣' : letter;
    return tile;
  }));
  for (const [letter, key] of keys) key.classList.toggle('next', letter === next);
  const fingerName = next === ' ' ? 'Either thumb' : fingerGroups.find(([group]) => next && group.includes(next))?.[1];
  byId('finger').textContent = done
    ? ''
    : (mistake ? 'Try again. ' : '') + 'Next: ' + (next === ' ' ? 'Space' : next.toUpperCase()) + ' · ' + fingerName;
  drillButton.disabled = active;
  drillButton.textContent = done ? 'Practise again' : active ? 'Drill running' : 'Start drill';
}

function resetLesson(index) {
  lessonIndex = index;
  stage = position = attempts = hits = lessonStart = combo = bestCombo = 0;
  active = done = mistake = false;
  renderLessons();
  renderDrill();
}

function typeLetter(letter) {
  if (!active) return;
  if (!attempts) lessonStart = performance.now();
  attempts++;
  const drills = lessons[lessonIndex].drills;
  const phrase = drills[stage];
  mistake = letter !== phrase[position];
  combo = mistake ? 0 : combo + 1;
  bestCombo = Math.max(bestCombo, combo);
  if (!mistake) {
    hits++;
    position++;
    if (position === phrase.length) {
      if (stage + 1 === drills.length) {
        active = false;
        done = true;
        const elapsed = Math.max(1000, performance.now() - lessonStart);
        const accuracy = Math.round(hits / attempts * 100);
        const previous = records[lessonIndex];
        records[lessonIndex] = {
          wpm: Math.round(hits * 12000 / elapsed),
          accuracy,
          bestAccuracy: Math.max(accuracy, previous?.bestAccuracy ?? previous?.accuracy ?? 0)
        };
        try { localStorage.setItem(lessonStorage, JSON.stringify(records)); } catch {}
        renderLessons();
      } else {
        stage++;
        position = 0;
      }
    }
  }
  renderDrill();
}

for (const row of ['qwertyuiop', 'asdfghjkl', 'zxcvbnm', ' ']) {
  const group = document.createElement('div');
  group.className = 'keyrow';
  for (const letter of row) {
    const key = document.createElement('button');
    key.className = letter === ' ' ? 'key space' : 'key';
    key.textContent = letter === ' ' ? 'Space' : letter.toUpperCase();
    key.addEventListener('click', () => typeLetter(letter));
    keys.set(letter, key);
    group.append(key);
  }
  byId('keyboard').append(group);
}
document.addEventListener('keydown', event => {
  if (!active || event.ctrlKey || event.altKey || event.metaKey || event.isComposing) return;
  if (event.key === ' ' && event.target.closest?.('button:not(.key)')) return;
  const letter = event.key.toLowerCase();
  if (!keys.has(letter)) return;
  event.preventDefault();
  if (!event.repeat) typeLetter(letter);
});
drillButton.addEventListener('click', () => {
  if (done) resetLesson(lessonIndex);
  active = true;
  renderDrill();
  keys.get(lessons[lessonIndex].drills[stage][position]).focus();
});
byId('advance').addEventListener('click', () => {
  resetLesson(lessonIndex + 1);
  drillButton.focus();
});
byId('redo').addEventListener('click', () => resetLesson(lessonIndex));
for (const [id, panel] of [['homeTab', 'homePanel'], ['learnTab', 'learnPanel'], ['testTab', 'testPanel'], ['arcTab', 'arcade'], ['progressTab', 'dashboard']]) {
  byId(id).addEventListener('click', () => {

    if (panel !== 'learnPanel' && active) resetLesson(lessonIndex);
    if (panel !== 'testPanel' && timer) clearRound();
    if (panel !== 'arcade' && arcTick) stopArcade(false);
    if (panel === 'dashboard') renderDashboard();
    if (panel === 'homePanel') renderHome();
    for (const [tabId, panelId] of [['homeTab', 'homePanel'], ['learnTab', 'learnPanel'], ['testTab', 'testPanel'], ['arcTab', 'arcade'], ['progressTab', 'dashboard']]) {
      const selected = panel === panelId;
      byId(panelId).hidden = !selected;
      byId(tabId).classList.toggle('primary', selected);
      byId(tabId).setAttribute('aria-pressed', selected);
    }
  });
}
resetLesson(0);

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

const goalTarget = byId('goalTarget');
const roundFilter = byId('roundFilter');
const goalKey = 'keysprout-daily-test-goal';
try {
  const goal = localStorage.getItem(goalKey);
  if (['1', '3', '5', '10'].includes(goal)) goalTarget.value = goal;
} catch {}

function renderDashboard() {
  const selected = rounds.filter(round => roundFilter.value === 'all' || round.mode === roundFilter.value);
  const count = selected.length;
  const average = key => Math.round(selected.reduce((sum, round) => sum + round[key], 0) / count);
  byId('dashCount').textContent = count;
  byId('dashSpeed').textContent = count ? average('score') : '—';
  byId('dashAccuracy').textContent = count ? average('percent') + '%' : '—';
  const completedToday = rounds.filter(round => round.date === today()).length;
  const goal = Number(goalTarget.value);
  byId('goalProgress').max = goal;
  byId('goalProgress').value = Math.min(completedToday, goal);
  byId('goalText').textContent = completedToday + ' of ' + goal + ' tests today' + (completedToday >= goal ? ' · Goal reached' : '');
  byId('dashEmpty').hidden = count > 0;
  byId('dashEmpty').textContent = rounds.length ? 'No saved tests for this filter.' : 'Finish a speed test to see your progress here.';
  byId('dashTable').hidden = !count;
  const recent = selected.slice(0, 7).reverse();
  const maximum = Math.max(1, ...recent.map(round => round.score));
  byId('speedTrend').replaceChildren(...recent.map(round => {
    const item = document.createElement('li');
    const date = document.createElement('span');
    date.textContent = round.date.slice(5);
    const bar = document.createElement('progress');
    bar.max = maximum;
    bar.value = round.score;
    bar.setAttribute('aria-label', 'Relative speed');
    const value = document.createElement('strong');
    value.textContent = round.score + ' WPM';
    item.append(date, bar, value);
    return item;
  }));
  byId('dashRows').replaceChildren(...selected.slice(0, 15).map(round => {
    const row = document.createElement('tr');
    for (const value of [round.date, round.mode === 'daily' ? 'Daily challenge' : round.level, round.score, round.percent + '%']) {
      const cell = document.createElement('td');
      cell.textContent = value;
      row.append(cell);
    }
    return row;
  }));
}
roundFilter.addEventListener('change', renderDashboard);
goalTarget.addEventListener('change', () => {
  try { localStorage.setItem(goalKey, goalTarget.value); } catch {}
  renderDashboard();
});

function renderHome() {
  const next = lessons.findIndex((lesson, index) => !records[index]);
  byId('nextLessonName').textContent = next < 0 ? 'All lessons complete. Keep building your rhythm.' : 'Up next: ' + lessons[next].title;
  byId('homeBest').textContent = best || '—';
  byId('homeAccuracy').textContent = rounds.length ? Math.round(rounds.reduce((sum, r) => sum + r.percent, 0) / rounds.length) + '%' : '—';
  byId('homeGoal').textContent = rounds.filter(r => r.date === today()).length + ' / ' + goalTarget.value;
  byId('homeEmpty').hidden = rounds.length > 0 || Object.keys(records).length > 0;
  const dates = new Set(rounds.map(r => r.date));
  let streak = 0, d = new Date();
  if (!dates.has(today())) d.setDate(d.getDate() - 1);
  while (dates.has([d.getFullYear(), String(d.getMonth()+1).padStart(2,'0'), String(d.getDate()).padStart(2,'0')].join('-'))) { streak++; d.setDate(d.getDate()-1); }
  byId('homeStreak').textContent = streak + (streak === 1 ? ' day' : ' days');
}
byId('continueLearning').onclick = () => { const next = lessons.findIndex((l,i) => !records[i]); resetLesson(next < 0 ? 0 : next); byId('learnTab').click(); };
byId('homeTest').onclick = () => { switchMode('practice'); byId('testTab').click(); };
byId('homeDaily').onclick = () => { switchMode('daily'); byId('testTab').click(); };
byId('homeArcade').onclick = () => byId('arcTab').click();
function applyTheme(theme) { document.documentElement.dataset.theme = theme; byId('themeToggle').textContent = theme === 'dark' ? 'Light theme' : 'Dark theme'; byId('themeToggle').setAttribute('aria-label','Switch to ' + (theme === 'dark' ? 'light' : 'dark') + ' theme'); }
try { applyTheme(localStorage.getItem('keysprout-theme') || 'light'); } catch { applyTheme('light'); }
byId('themeToggle').onclick = () => { const theme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'; applyTheme(theme); try { localStorage.setItem('keysprout-theme',theme); } catch {} };
renderHome();
