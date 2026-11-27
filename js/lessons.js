"use strict";
const records = KS.data.lessons;
let lessonIndex = 0,
  stage = 0,
  position = 0,
  attempts = 0,
  hits = 0,
  combo = 0,
  bestCombo = 0,
  lessonStart = 0;
let active = false,
  done = false,
  mistake = false,
  shiftOn = false;
let lessonMistakes = {},
  currentDrill = null,
  lessonLastResult = null;
const stars = (accuracy) => (accuracy >= 95 ? 3 : accuracy >= 85 ? 2 : 1);
const keys = new Map();
const drillButton = byId("activate");
const lessonInput = byId("lessonInput");
const currentLesson = () => currentDrill || lessons[lessonIndex];
const isUnlocked = (index) =>
  index === 0 ||
  !!records[lessons[index].id] ||
  !!records[lessons[index - 1].id];
const trickyKeys = (mistakes) =>
  Object.entries(mistakes)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([key]) => key);
const keyLabel = (char) => (char === " " ? "Space" : char);

function renderLessons() {
  const completed = lessons.filter((l) => records[l.id]).length;
  byId("lessonSummary").textContent =
    completed + " of " + lessons.length + " lessons complete";
  byId("xp").textContent =
    lessons.reduce(
      (sum, l) =>
        sum +
        (records[l.id]
          ? 20 * (records[l.id].stars || stars(records[l.id].bestAccuracy ?? 0))
          : 0),
      0,
    ) + " total XP";
  byId("lessonChoices").replaceChildren();
  for (const unit of ["Beginner", "Intermediate", "Advanced"]) {
    const heading = document.createElement("h3");
    heading.className = "unit-title";
    heading.textContent = unit;
    byId("lessonChoices").append(heading);
    lessons.forEach((lesson, index) => {
      if (lesson.unit !== unit) return;
      const record = records[lesson.id],
        available = isUnlocked(index);
      const button = document.createElement("button");
      button.textContent = lesson.title;
      button.setAttribute(
        "aria-current",
        String(index === lessonIndex && !currentDrill),
      );
      button.disabled = !available;
      const detail = document.createElement("small");
      detail.textContent = record
        ? "Completed · " +
          (record.stars || stars(record.bestAccuracy)) +
          " / 3 stars · Replay"
        : available
          ? "Available · " + lesson.keys
          : "Locked · Complete " + lessons[index - 1].title;
      button.append(detail);
      button.onclick = () => resetLesson(index);
      byId("lessonChoices").append(button);
    });
  }
}
function renderDrill() {
  const lesson = currentLesson(),
    phrase = lesson.drills[stage],
    next = done ? "" : phrase[position];
  const total = lesson.drills.reduce((n, text) => n + text.length, 0);
  const completed =
    lesson.drills.slice(0, stage).reduce((n, text) => n + text.length, 0) +
    position;
  byId("drillProgress").value = done ? 1 : completed / total;
  byId("combo").textContent = "Combo " + combo;
  byId("liveAccuracy").textContent =
    "Accuracy " + (attempts ? Math.round((hits / attempts) * 100) + "%" : "—");
  byId("drillTitle").textContent = lesson.title;
  byId("lessonIntro").textContent = lesson.intro;
  byId("drillStage").textContent = done
    ? "Practice complete"
    : (["Key drills", "Word practice", "Final round"][stage] ||
        "Targeted practice") +
      " · " +
      (stage + 1) +
      " of " +
      lesson.drills.length;
  byId("tiles").replaceChildren(
    ...Array.from(phrase, (char, index) => {
      const tile = document.createElement("span");
      tile.className =
        "tile" +
        (index < position
          ? " correct"
          : index === position && !done
            ? mistake
              ? " error next"
              : " next"
            : "");
      tile.textContent = char === " " ? "␣" : char;
      if (index === position && !done)
        tile.setAttribute("aria-current", "true");
      return tile;
    }),
  );
  const hint = keyHint(next);
  for (const [char, key] of keys) {
    if (char === "Left Shift" || char === "Right Shift")
      key.setAttribute("aria-pressed", String(shiftOn));
    key.classList.toggle(
      "next",
      !!next && (char === hint.base || (hint.shifted && char === hint.shift)),
    );
    if (char.length === 1 && char !== " ") {
      const shifted = Object.entries(shiftedKeys).find(
        ([, base]) => base === char,
      )?.[0];
      key.textContent = shiftOn
        ? shifted || char.toUpperCase()
        : char.toUpperCase();
    }
  }
  byId("finger").textContent = done
    ? "Good practice. Take a breath before your next session."
    : "Next: " +
      keyLabel(next) +
      " · " +
      hint.finger +
      (hint.shifted ? " + hold " + hint.shift : "");
  byId("finger").className = "finger-hint finger-" + hint.color;
  lessonInput.disabled = !active;
  byId(done ? "lessonEndControls" : "lessonStartControls").prepend(drillButton);
  byId("drill").classList.toggle("lesson-running", active);
  drillButton.disabled = active;
  drillButton.textContent = done
    ? "Retry lesson"
    : active
      ? "Lesson in progress"
      : "Start lesson";
  byId("redo").textContent = active ? "Restart lesson" : "Reset lesson";
  const result = byId("lessonResult");
  result.hidden = !done;
  byId("advance").hidden =
    !done || !!currentDrill || lessonIndex === lessons.length - 1;
  byId("mistakeDrill").hidden = !done || !trickyKeys(lessonMistakes).length;
  if (done) {
    result.replaceChildren();
    const title = document.createElement("strong");
    title.textContent = currentDrill
      ? "Targeted practice complete"
      : "Lesson complete · " + lessonLastResult.stars + " / 3 stars";
    const stats = document.createElement("p");
    stats.textContent =
      lessonLastResult.wpm +
      " WPM · " +
      lessonLastResult.accuracy +
      "% accuracy · " +
      lessonLastResult.xp +
      " XP earned";
    const best = document.createElement("p");
    best.textContent = currentDrill
      ? "Bring this rhythm into your next lesson."
      : "Best award: " +
        records[lesson.id].stars +
        " / 3 stars · Best combo: " +
        bestCombo;
    const weak = document.createElement("p");
    const chars = trickyKeys(lessonMistakes);
    weak.textContent = chars.length
      ? "Keys to revisit: " +
        chars.map(keyLabel).join(", ") +
        ". Try a short drill below."
      : "A clean round. No tricky keys this time.";
    result.append(title, stats, best, weak);
  }
}
function resetLesson(index, drill = null) {
  if (!drill && !isUnlocked(index)) return;
  lessonIndex = index;
  currentDrill = drill;
  stage = position = attempts = hits = combo = bestCombo = lessonStart = 0;
  active = done = mistake = shiftOn = false;
  lessonMistakes = {};
  lessonLastResult = null;
  lessonInput.value = "";
  byId("lessonFeedback").textContent = "";
  renderLessons();
  renderDrill();
}
let audioContext;
function playKeySound(correct) {
  if (!KS.data.settings.sound) return;
  try {
    audioContext ||= new (window.AudioContext || window.webkitAudioContext)();
    if (audioContext.state === "suspended") audioContext.resume();
    const oscillator = audioContext.createOscillator(),
      gain = audioContext.createGain();
    oscillator.frequency.value = correct ? 580 : 180;
    gain.gain.setValueAtTime(0.035, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(
      0.001,
      audioContext.currentTime + 0.06,
    );
    oscillator.connect(gain);
    gain.connect(audioContext.destination);
    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.07);
  } catch {}
}
function typeLetter(char) {
  if (!active) return;
  if (!attempts) lessonStart = performance.now();
  attempts++;
  const lesson = currentLesson(),
    expected = lesson.drills[stage][position];
  mistake = char !== expected;
  playKeySound(!mistake);
  combo = mistake ? 0 : combo + 1;
  bestCombo = Math.max(bestCombo, combo);
  if (mistake) {
    lessonMistakes[expected] = (lessonMistakes[expected] || 0) + 1;
    byId("lessonFeedback").textContent =
      "Try again: expected " +
      keyLabel(expected) +
      ", received " +
      keyLabel(char) +
      ".";
  } else {
    hits++;
    position++;
    byId("lessonFeedback").textContent = "Correct · " + combo + " in a row";
    if (position === lesson.drills[stage].length) {
      if (stage + 1 === lesson.drills.length) {
        active = false;
        done = true;
        const accuracy = Math.round((hits / attempts) * 100),
          award = stars(accuracy),
          wpm = Math.round(
            (hits * 12000) / Math.max(1000, performance.now() - lessonStart),
          );
        let xp = 0;
        if (!currentDrill) {
          const previous = records[lesson.id],
            oldAward =
              previous?.stars ||
              (previous
                ? stars(previous.bestAccuracy ?? previous.accuracy)
                : 0);
          const bestAward = Math.max(oldAward, award);
          xp = (bestAward - oldAward) * 20;
          records[lesson.id] = {
            ...previous,
            wpm,
            accuracy,
            bestAccuracy: Math.max(accuracy, previous?.bestAccuracy || 0),
            stars: bestAward,
            date: KS.date(),
          };
        }
        lessonLastResult = { wpm, accuracy, stars: award, xp };
        KS.addMistakes(lessonMistakes);
        KS.markDay();
        renderLessons();
      } else {
        stage++;
        position = 0;
        byId("lessonFeedback").textContent =
          "Stage complete. Keep going with " +
          ["key drills", "word practice", "the final round"][stage] +
          ".";
      }
    }
  }
  renderDrill();
  if (done) byId("lessonResult").scrollIntoView({ block: "nearest" });
}
function startMistakeDrill(chars = trickyKeys(lessonMistakes)) {
  if (!chars.length) return;
  const drill = {
    title: "Your tricky keys",
    intro:
      "A short practice for " +
      chars.map(keyLabel).join(", ") +
      ". Slow down, use the finger hints, and aim for clean keystrokes.",
    drills: [
      chars.map((k) => k.repeat(3)).join(" "),
      Array.from({ length: 4 }, () => chars.join("")).join(" "),
      chars.join(" ").repeat(3).trim() || "   ",
    ],
  };
  resetLesson(lessonIndex, drill);
  byId("learnTab").click();
  drillButton.focus();
}
for (const row of [
  "`1234567890-=",
  "qwertyuiop[]\\",
  "asdfghjkl;'",
  "zxcvbnm,./",
]) {
  const group = document.createElement("div");
  group.className = "keyrow";
  for (const char of row) {
    const key = document.createElement("button");
    key.className = "key finger-" + keyHint(char).color;
    key.textContent = char.toUpperCase();
    key.setAttribute("aria-label", char + " · " + keyHint(char).finger);
    key.onclick = () => {
      const upper = Object.entries(shiftedKeys).find(
        ([, base]) => base === char,
      )?.[0];
      typeLetter(shiftOn ? upper || char.toUpperCase() : char);
    };
    keys.set(char, key);
    group.append(key);
  }
  byId("keyboard").append(group);
}
const lastRow = document.createElement("div");
lastRow.className = "keyrow";
for (const char of ["Left Shift", " ", "Right Shift"]) {
  const key = document.createElement("button");
  key.className = "key " + (char === " " ? "space finger-thumb" : "shift");
  key.textContent = char === " " ? "Space" : char;
  key.setAttribute("aria-label", char === " " ? "Space · Either thumb" : char);
  if (char !== " ") key.setAttribute("aria-pressed", "false");
  key.onclick = () => {
    if (char === " ") typeLetter(" ");
    else {
      shiftOn = !shiftOn;
      for (const name of ["Left Shift", "Right Shift"])
        keys.get(name).setAttribute("aria-pressed", String(shiftOn));
      renderDrill();
    }
  };
  keys.set(char, key);
  lastRow.append(key);
}
byId("keyboard").append(lastRow);
for (const [name, description] of [
  ["pinky", "Pinky: outer keys"],
  ["ring", "Ring: second column"],
  ["middle", "Middle: third column"],
  ["index", "Index: two inner columns"],
  ["thumb", "Thumb: Space"],
]) {
  const item = document.createElement("span");
  item.className = "finger-" + name;
  item.textContent = description;
  byId("fingerLegend").append(item);
}
document.addEventListener("keydown", (event) => {
  if (
    !active ||
    event.ctrlKey ||
    event.metaKey ||
    event.altKey ||
    event.isComposing ||
    event.target === lessonInput ||
    event.target.closest("input,textarea,select") ||
    event.key.length !== 1
  )
    return;
  if (event.target.closest("button") && !event.target.classList.contains("key"))
    return;
  event.preventDefault();
  if (!event.repeat) typeLetter(event.key);
});
lessonInput.addEventListener("input", (event) => {
  if (event.isComposing) return;
  for (const char of lessonInput.value) typeLetter(char);
  lessonInput.value = "";
});
lessonInput.addEventListener("compositionend", () => {
  for (const char of lessonInput.value) typeLetter(char);
  lessonInput.value = "";
});
for (const event of ["paste", "drop"])
  lessonInput.addEventListener(event, (e) => e.preventDefault());
drillButton.onclick = () => {
  if (done) resetLesson(lessonIndex, currentDrill);
  active = true;
  renderDrill();
  lessonInput.focus();
};
byId("redo").onclick = () => resetLesson(lessonIndex, currentDrill);
byId("advance").onclick = () => {
  resetLesson(lessonIndex + 1);
  drillButton.focus();
};
byId("mistakeDrill").onclick = () => startMistakeDrill();
function renderSound() {
  byId("soundToggle").textContent = KS.data.settings.sound
    ? "Sound on"
    : "Sound off";
  byId("soundToggle").setAttribute(
    "aria-pressed",
    String(!!KS.data.settings.sound),
  );
}
byId("soundToggle").onclick = () => {
  KS.data.settings.sound = !KS.data.settings.sound;
  KS.save();
  renderSound();
};
renderSound();
resetLesson(0);
