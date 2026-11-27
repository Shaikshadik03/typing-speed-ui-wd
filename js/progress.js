"use strict";
const goalTarget = byId("goalTarget"),
  roundFilter = byId("roundFilter"),
  dateFilter = byId("dateFilter"),
  modeFilter = byId("modeFilter");
goalTarget.value = String(KS.data.settings.goal);
if (!goalTarget.value) goalTarget.value = "3";
function selectedRounds() {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - (Number(dateFilter.value) || 1) + 1);
  const from = KS.date(cutoff);
  return rounds.filter(
    (r) =>
      (roundFilter.value === "all" || r.mode === roundFilter.value) &&
      (modeFilter.value === "all" || r.textMode === modeFilter.value) &&
      (dateFilter.value === "all" || r.date >= from),
  );
}
function plotTrend(container, rows, field, label, color) {
  container.replaceChildren();
  if (!rows.length) {
    const p = document.createElement("p");
    p.className = "chart-empty";
    p.textContent = "Your next session starts the story.";
    container.append(p);
    return;
  }
  const ns = "http://www.w3.org/2000/svg",
    svg = document.createElementNS(ns, "svg");
  svg.setAttribute("viewBox", "0 0 440 165");
  svg.setAttribute("role", "img");
  svg.setAttribute(
    "aria-label",
    label + ": " + rows.map((r) => r[field]).join(", ") + ", oldest to newest.",
  );
  const maximum =
    field === "percent" ? 100 : Math.max(20, ...rows.map((r) => r[field]));
  function node(tag, attributes, text) {
    const el = document.createElementNS(ns, tag);
    for (const [k, v] of Object.entries(attributes)) el.setAttribute(k, v);
    if (text !== undefined) el.textContent = text;
    svg.append(el);
    return el;
  }
  for (let i = 0; i <= 2; i++) {
    const y = 20 + i * 55;
    node("line", {
      x1: 38,
      x2: 420,
      y1: y,
      y2: y,
      stroke: "var(--line)",
      "stroke-dasharray": "3 5",
    });
    node(
      "text",
      { x: 4, y: y + 4, fill: "var(--muted)", "font-size": 12 },
      Math.round(maximum * (1 - i / 2)),
    );
  }
  const points = rows.map((r, i) => [
    rows.length === 1 ? 230 : 40 + (i * 380) / (rows.length - 1),
    130 - (r[field] / maximum) * 110,
  ]);
  node("polyline", {
    points: points.map((p) => p.join(",")).join(" "),
    fill: "none",
    stroke: color,
    "stroke-width": 2.5,
    "stroke-linejoin": "round",
  });
  points.forEach(([x, y], i) => {
    const dot = node("circle", { cx: x, cy: y, r: 4, fill: color });
    const title = document.createElementNS(ns, "title");
    title.textContent = rows[i].date + ": " + rows[i][field] + " " + label;
    dot.append(title);
  });
  node(
    "text",
    { x: 38, y: 157, fill: "var(--muted)", "font-size": 12 },
    rows[0].date.slice(5),
  );
  node(
    "text",
    {
      x: 420,
      y: 157,
      fill: "var(--muted)",
      "font-size": 12,
      "text-anchor": "end",
    },
    rows.at(-1).date.slice(5),
  );
  container.append(svg);
}
function filteredMistakes(selected) {
  if (
    dateFilter.value === "all" &&
    modeFilter.value === "all" &&
    roundFilter.value === "all"
  )
    return KS.data.mistakes;
  const mistakes = {};
  for (const r of selected)
    for (const [k, n] of Object.entries(r.mistakes || {}))
      mistakes[k] = (mistakes[k] || 0) + KS.number(n);
  return mistakes;
}
function renderDashboard() {
  const selected = selectedRounds(),
    count = selected.length,
    average = (key) =>
      Math.round(selected.reduce((sum, r) => sum + r[key], 0) / count);
  byId("dashCount").textContent = count;
  byId("dashSpeed").textContent = count ? average("score") : "—";
  byId("dashAccuracy").textContent = count ? average("percent") + "%" : "—";
  byId("dashEmpty").hidden = !!count;
  byId("dashEmpty").textContent = rounds.length
    ? "No tests match these filters. Try a wider date range or another mode."
    : "Your first test creates your baseline. No scores to show yet.";
  const completedToday = rounds.filter((r) => r.date === today()).length,
    goal = Number(goalTarget.value);
  byId("goalProgress").max = goal;
  byId("goalProgress").value = Math.min(completedToday, goal);
  byId("goalText").textContent =
    completedToday +
    " of " +
    goal +
    " tests today" +
    (completedToday >= goal ? " · Goal reached" : "");
  const recent = selected.slice(0, 10).reverse();
  plotTrend(byId("speedTrend"), recent, "score", "WPM", "var(--green)");
  plotTrend(
    byId("accuracyTrend"),
    recent,
    "percent",
    "percent accuracy",
    "#aa8343",
  );
  const personal = new Map();
  for (const r of selected) {
    const label =
      (r.mode === "daily"
        ? "Daily challenge"
        : modeLabels[r.textMode] || "Everyday Text") +
      " · " +
      (r.duration ? r.duration + "s" : "Legacy duration unknown");
    if (!personal.has(label) || personal.get(label) < r.score)
      personal.set(label, r.score);
  }
  byId("personalRecords").replaceChildren();
  for (const [label, score] of personal) {
    const item = document.createElement("li"),
      name = document.createElement("span"),
      value = document.createElement("strong");
    name.textContent = label;
    value.textContent = score + " WPM";
    item.append(name, value);
    byId("personalRecords").append(item);
  }
  if (!personal.size) {
    const li = document.createElement("li");
    li.textContent = "Your personal records will appear after a saved test.";
    byId("personalRecords").append(li);
  }
  const completed = lessons.filter((l) => records[l.id]).length;
  byId("completionText").textContent =
    completed + " of " + lessons.length + " lessons completed";
  byId("completionProgress").value = completed;
  byId("completionProgress").max = lessons.length;
  byId("unitProgress").replaceChildren();
  for (const unit of ["Beginner", "Intermediate", "Advanced"]) {
    const list = lessons.filter((l) => l.unit === unit),
      p = document.createElement("p");
    p.textContent =
      unit +
      " · " +
      list.filter((l) => records[l.id]).length +
      " / " +
      list.length;
    byId("unitProgress").append(p);
  }
  const mistakes = Object.entries(filteredMistakes(selected)).sort(
    (a, b) => b[1] - a[1],
  );
  byId("mistakeBreakdown").replaceChildren();
  byId("mistakeContext").textContent =
    dateFilter.value === "all" &&
    modeFilter.value === "all" &&
    roundFilter.value === "all"
      ? "Keys missed in saved tests and lessons, including errors you corrected."
      : "Keys missed in the tests matching your filters. Legacy tests have no per-key data.";
  for (const [key, n] of mistakes.slice(0, 8)) {
    const chip = document.createElement("span");
    chip.className = "mistake-chip";
    chip.textContent = keyLabel(key) + " · " + n + " misses";
    byId("mistakeBreakdown").append(chip);
  }
  if (!mistakes.length) {
    const p = document.createElement("p");
    p.textContent = "No recorded mistakes here yet. Keep practising with care.";
    byId("mistakeBreakdown").append(p);
  }
  byId("progressDrill").hidden = !mistakes.length;
  byId("progressDrill").onclick = () =>
    startMistakeDrill(mistakes.slice(0, 3).map(([k]) => k));
  byId("dashTable").hidden = !count;
  byId("attemptCount").textContent = count
    ? "Showing " +
      Math.min(50, count) +
      " of " +
      count +
      " matching tests. CSV includes all matching tests."
    : "No attempts in this view.";
  byId("dashRows").replaceChildren(
    ...selected.slice(0, 50).map((r) => {
      const row = document.createElement("tr");
      for (const value of [
        r.date,
        (r.mode === "daily" ? "Daily · " : "") +
          (modeLabels[r.textMode] || r.level),
        r.duration ? r.duration + "s" : "Unknown",
        r.score,
        r.percent + "%",
        r.errors ?? "Unknown",
      ]) {
        const cell = document.createElement("td");
        cell.textContent = value;
        row.append(cell);
      }
      return row;
    }),
  );
  byId("settingTheme").value =
    document.documentElement.dataset.theme || "light";
  byId("settingSound").checked = !!KS.data.settings.sound;
  byId("exportCsv").disabled = !count;
}
for (const select of [roundFilter, dateFilter, modeFilter])
  select.onchange = renderDashboard;
goalTarget.onchange = () => {
  KS.data.settings.goal = Number(goalTarget.value);
  KS.save();
  renderDashboard();
};
byId("settingTheme").onchange = () => setTheme(byId("settingTheme").value);
byId("settingSound").onchange = () => {
  KS.data.settings.sound = byId("settingSound").checked;
  KS.save();
  renderSound();
};
byId("progressContinue").onclick = () => byId("continueLearning").click();
function csvCell(value) {
  let text = String(value ?? "");
  if (/^[=+@\-\t\r]/.test(text)) text = "'" + text;
  return '"' + text.replaceAll('"', '""') + '"';
}
function exportCsv() {
  const selected = selectedRounds(),
    rows = [
      [
        "Date",
        "Round type",
        "Text mode",
        "Duration seconds",
        "WPM",
        "Accuracy percent",
        "Errors",
        "Correct characters",
      ],
      ...selected.map((r) => [
        r.date,
        r.mode,
        modeLabels[r.textMode] || r.level,
        r.duration ?? "",
        r.score,
        r.percent,
        r.errors ?? "",
        r.correct ?? "",
      ]),
    ];
  const blob = new Blob(
      ["\uFEFF" + rows.map((row) => row.map(csvCell).join(",")).join("\r\n")],
      { type: "text/csv;charset=utf-8;" },
    ),
    url = URL.createObjectURL(blob),
    a = document.createElement("a");
  a.href = url;
  a.download = "keysprout-results-" + today() + ".csv";
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  byId("exportStatus").textContent =
    "Exported " + selected.length + " matching test results.";
}
byId("exportCsv").onclick = exportCsv;
