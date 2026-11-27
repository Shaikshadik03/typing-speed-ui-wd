
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

