for (const [id, panel] of [
  ["homeTab", "homePanel"],
  ["learnTab", "learnPanel"],
  ["testTab", "testPanel"],
  ["arcTab", "arcade"],
  ["progressTab", "dashboard"],
]) {
  byId(id).addEventListener("click", () => {
    if (panel !== "learnPanel" && active) resetLesson(lessonIndex);
    if (panel !== "testPanel" && timer) clearRound();
    if (panel !== "arcade" && arcTick) stopArcade(false);
    if (panel === "dashboard") renderDashboard();
    if (panel === "homePanel") renderHome();
    for (const [tabId, panelId] of [
      ["homeTab", "homePanel"],
      ["learnTab", "learnPanel"],
      ["testTab", "testPanel"],
      ["arcTab", "arcade"],
      ["progressTab", "dashboard"],
    ]) {
      const selected = panel === panelId;
      byId(panelId).hidden = !selected;
      byId(tabId).classList.toggle("primary", selected && tabId !== "homeTab");
      byId(tabId).setAttribute("aria-pressed", selected);
    }
  });
}

function renderHome() {
  const next = lessons.findIndex((lesson, index) => !records[lesson.id]);
  byId("continueLearning").textContent =
    next < 0 ? "Review your lessons" : "Continue learning";
  byId("nextLessonName").textContent =
    next < 0
      ? "All lessons complete. Keep building your rhythm."
      : "Up next: " + lessons[next].title;
  byId("homeBest").textContent = best || "—";
  byId("homeAccuracy").textContent = rounds.length
    ? Math.round(
        rounds.reduce((sum, r) => sum + r.percent, 0) / rounds.length,
      ) + "%"
    : "—";
  byId("homeGoal").textContent =
    rounds.filter((r) => r.date === today()).length + " / " + goalTarget.value;
  byId("homeEmpty").hidden =
    rounds.length > 0 || Object.keys(records).length > 0;
  const dates = new Set([...rounds.map((r) => r.date), ...KS.data.activeDays]);
  let streak = 0,
    d = new Date();
  if (!dates.has(today())) d.setDate(d.getDate() - 1);
  while (
    dates.has(
      [
        d.getFullYear(),
        String(d.getMonth() + 1).padStart(2, "0"),
        String(d.getDate()).padStart(2, "0"),
      ].join("-"),
    )
  ) {
    streak++;
    d.setDate(d.getDate() - 1);
  }
  byId("homeStreak").textContent = streak + (streak === 1 ? " day" : " days");
}
byId("continueLearning").onclick = () => {
  const next = lessons.findIndex((l, i) => !records[l.id]);
  resetLesson(next < 0 ? 0 : next);
  byId("learnTab").click();
};
byId("homeTest").onclick = () => {
  switchMode("practice");
  byId("testTab").click();
};
byId("homeDaily").onclick = () => {
  switchMode("daily");
  byId("testTab").click();
};
byId("homeArcade").onclick = () => byId("arcTab").click();
function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  byId("themeToggle").textContent =
    theme === "dark" ? "Light theme" : "Dark theme";
  byId("themeToggle").setAttribute(
    "aria-label",
    "Switch to " + (theme === "dark" ? "light" : "dark") + " theme",
  );
}
try {
  applyTheme(localStorage.getItem("keysprout-theme") || "light");
} catch {
  applyTheme("light");
}
function setTheme(theme) {
  applyTheme(theme);
  byId("settingTheme").value = theme;
  try {
    localStorage.setItem("keysprout-theme", theme);
  } catch {}
}
byId("themeToggle").onclick = () =>
  setTheme(
    document.documentElement.dataset.theme === "dark" ? "light" : "dark",
  );
renderHome();

window.addEventListener("pagehide", () => {
  if (timer) clearRound();
  if (arcTick) stopArcade(false);
  if (active) resetLesson(lessonIndex);
});
