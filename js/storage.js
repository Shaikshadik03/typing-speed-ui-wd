"use strict";
// Version 2 keeps a complete legacy snapshot and never removes version 1 keys.
const KS = (() => {
  const key = "keysprout-academy-v2";
  const read = (name, fallback) => {
    try {
      const value = JSON.parse(localStorage.getItem(name));
      return value ?? fallback;
    } catch {
      return fallback;
    }
  };
  const object = (value) =>
    value && typeof value === "object" && !Array.isArray(value) ? value : {};
  const number = (value, fallback = 0) =>
    Number.isFinite(Number(value)) && Number(value) >= 0
      ? Number(value)
      : fallback;
  const date = (d = new Date()) =>
    [
      d.getFullYear(),
      String(d.getMonth() + 1).padStart(2, "0"),
      String(d.getDate()).padStart(2, "0"),
    ].join("-");
  const oldLessons = object(read("keysprout-lessons-v1", {}));
  const legacyProgress = object(read("keysprout-progress-v1", {}));
  const saved = object(read(key, {}));
  const legacyIds = [
    "index-fingers",
    "home-row",
    "top-row",
    "bottom-row",
    "everyday-words",
  ];
  const lessonRecords = object(saved.lessons);
  if (saved.version !== 2) {
    for (const [index, record] of Object.entries(oldLessons)) {
      if (!legacyIds[index] || !record || typeof record !== "object") continue;
      const accuracy = Math.min(
        100,
        number(record.bestAccuracy ?? record.accuracy),
      );
      lessonRecords[legacyIds[index]] = {
        ...record,
        bestAccuracy: accuracy,
        stars: accuracy >= 95 ? 3 : accuracy >= 85 ? 2 : 1,
        migrated: true,
      };
    }
  }
  const rawRounds = Array.isArray(saved.rounds)
    ? saved.rounds
    : Array.isArray(legacyProgress.rounds)
      ? legacyProgress.rounds
      : [];
  const data = {
    ...saved,
    version: 2,
    lessons: lessonRecords,
    rounds: rawRounds
      .filter((r) => r && typeof r === "object")
      .map((r, i) => ({
        ...r,
        id: r.id || "legacy-" + i,
        score: number(r.score),
        percent: Math.min(100, number(r.percent)),
        date: typeof r.date === "string" ? r.date : "",
        textMode: r.textMode || "everyday",
        duration: number(r.duration) || null,
      })),
    best: Math.max(number(saved.best), number(read("keysprout-best-v1", 0))),
    activeDays: Array.isArray(saved.activeDays)
      ? saved.activeDays.filter((x) => typeof x === "string")
      : [],
    mistakes: object(saved.mistakes),
    arcade: object(saved.arcade),
    settings: {
      goal: number(read("keysprout-daily-test-goal", 3), 3) || 3,
      sound: false,
      ...object(saved.settings),
    },
    legacy: saved.legacy || {
      lessons: oldLessons,
      progress: legacyProgress,
      bloom: {
        15: number(read("keysprout-arcade-best-15", 0)),
        30: number(read("keysprout-arcade-best", 0)),
        60: number(read("keysprout-arcade-best-60", 0)),
      },
    },
  };
  data.best = Math.max(data.best, ...data.rounds.map((r) => r.score), 0);
  const save = () => {
    try {
      localStorage.setItem(key, JSON.stringify(data));
      return true;
    } catch {
      const node = document.getElementById("storageNotice");
      if (node) node.hidden = false;
      return false;
    }
  };
  const markDay = () => {
    const day = date();
    if (!data.activeDays.includes(day)) data.activeDays.push(day);
    save();
  };
  const addMistakes = (mistakes) => {
    for (const [char, count] of Object.entries(mistakes))
      data.mistakes[char] = number(data.mistakes[char]) + count;
    save();
  };
  save();
  return { data, save, read, number, date, markDay, addMistakes };
})();
