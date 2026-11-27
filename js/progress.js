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

