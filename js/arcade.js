"use strict";
const bloomWords =
  "fern moss rain mint leaf seed bloom cloud petal grove river clover pollen meadow forest sapling garden blossom firefly orchard sunflower butterfly".split(
    " ",
  );
const relayBanks = [
  ["sun", "map", "oak", "run", "sky", "dew", "bay", "log"],
  ["river", "green", "cloud", "bloom", "plant", "quiet", "trail", "water"],
  [
    "garden",
    "meadow",
    "forest",
    "branch",
    "sunset",
    "spring",
    "pollen",
    "flower",
  ],
  [
    "butterfly",
    "wildflower",
    "evergreen",
    "waterfall",
    "sunflower",
    "adventure",
    "happiness",
    "beautiful",
  ],
  [
    "replanting",
    "photosynthesis",
    "biodiversity",
    "conservation",
    "regeneration",
    "transformation",
    "ecosystem",
    "sustainability",
  ],
];
const arcadeInput = byId("arcInput"),
  arcadeStart = byId("arcStart"),
  arcadeDuration = byId("arcDuration"),
  arcadeReset = byId("arcReset");
let arcTick = 0,
  arcDeadline = 0,
  flowers = 0,
  wordIndex = 0,
  arcadeBest = 0,
  arcErrors = 0,
  arcCombo = 0,
  arcBestCombo = 0,
  arcPoints = 0,
  arcGame = "bloom",
  arcTarget = "",
  arcWrong = false,
  arcDirty = false,
  cleanWords = 0;
function arcadeBestKey() {
  return arcGame + "-" + arcadeDuration.value;
}
function readArcadeBest() {
  return Math.max(
    KS.number(KS.data.arcade[arcadeBestKey()]),
    arcGame === "bloom"
      ? KS.number(KS.data.legacy.bloom?.[arcadeDuration.value])
      : 0,
  );
}
function nextArcWord() {
  const round = Math.floor(flowers / 5),
    bank =
      arcGame === "bloom"
        ? bloomWords
        : relayBanks[Math.min(round, relayBanks.length - 1)];
  arcTarget = bank[wordIndex % bank.length];
  arcadeInput.value = "";
  arcWrong = arcDirty = false;
  showWord();
  byId("arcRound").textContent =
    "Round " + (round + 1) + " · " + ((flowers % 5) + 1) + "/5";
}
function showWord() {
  const value = arcadeInput.value;
  let match = 0;
  while (match < value.length && value[match] === arcTarget[match]) match++;
  const prefix = document.createElement("span");
  prefix.className = "grown";
  prefix.textContent = arcTarget.slice(0, match);
  byId("arcWord").replaceChildren(prefix, arcTarget.slice(match));
  arcadeInput.setAttribute("aria-invalid", String(match < value.length));
}
function renderArcStats() {
  byId("arcScore").textContent =
    arcGame === "bloom" ? flowers + " words" : arcPoints + " points";
  byId("arcCombo").textContent = "Combo " + arcCombo;
  byId("arcAccuracy").textContent =
    "Clean words " +
    (flowers ? Math.round((cleanWords / flowers) * 100) + "%" : "—");
  byId("arcBest").textContent =
    "Best: " + arcadeBest + (arcGame === "bloom" ? " words" : " pts");
}
function growGarden() {
  const garden = byId("garden");
  // Keep the garden small and fast; each mature patch represents another 24 words.
  if (garden.childElementCount >= 24) garden.replaceChildren();
  const plant = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  plant.setAttribute("viewBox", "0 0 40 64");
  plant.setAttribute("class", "plant");
  plant.setAttribute("aria-hidden", "true");
  const colors = ["#e2c88b", "#d9a7ae", "#b6cba1", "#a9c6d2"];
  plant.innerHTML =
    '<path d="M20 61V24" stroke="#669575" stroke-width="2.5"/><path d="M20 47C7 47 6 37 6 34c11 0 14 5 14 13ZM20 40C20 30 29 29 34 29c0 9-7 11-14 11Z" fill="#83a781"/><circle cx="20" cy="18" r="11" fill="' +
    colors[flowers % 4] +
    '"/><circle cx="20" cy="18" r="4" fill="#f4e7ba"/>';
  plant.style.height = 48 + ((flowers * 13) % 36) + "px";
  garden.append(plant);
  const mini = byId("miniGarden");
  if (mini.childElementCount >= 10) mini.firstChild.remove();
  mini.append(plant.cloneNode(true));
  byId("gardenNote").textContent =
    flowers +
    " " +
    (flowers === 1
      ? "word, one new beginning."
      : "words planted. Look at that growth.");
  garden.setAttribute("aria-label", flowers + " flowers grown");
}
function renderRelay() {
  byId("relayTrack").replaceChildren();
  for (let i = 0; i < 5; i++) {
    const step = document.createElement("div");
    step.className =
      "relay-step" +
      (i < flowers % 5 ? " cleared" : i === flowers % 5 ? " current-step" : "");
    step.textContent =
      i < flowers % 5 ? "Cleared" : i === flowers % 5 ? "Your turn" : "Up next";
    byId("relayTrack").append(step);
  }
  byId("gardenNote").textContent =
    "Round " +
    (Math.floor(flowers / 5) + 1) +
    " · " +
    flowers +
    " words cleared · Best combo " +
    arcBestCombo;
}
function configureGame() {
  const bloom = arcGame === "bloom";
  byId("gameTitle").textContent = bloom ? "Word Bloom" : "Word Relay";
  byId("gameInstructions").textContent = bloom
    ? "Type each word exactly as shown to plant a flower. Words clear automatically. Correct any mistakes with Backspace. Grow as much as you can before time runs out."
    : "Clear five words to reach the next round. Words get longer as you progress. Each word earns 10 points plus 2 per clean-word combo (up to 20 bonus points). Mistakes reset your combo.";
  byId("gardenTitle").textContent = bloom
    ? "Your growing garden"
    : "One word at a time";
  byId("gardenCaption").textContent = bloom
    ? "Every word plants something new."
    : "Five words per round. Find your flow.";
  byId("garden").hidden = !bloom;
  byId("miniGarden").hidden = !bloom;
  byId("relayTrack").hidden = bloom;
  byId("arcRound").hidden = bloom;
  for (const [id, game] of [
    ["bloomGame", "bloom"],
    ["relayGame", "relay"],
  ]) {
    byId(id).classList.toggle("selected", game === arcGame);
    byId(id).setAttribute("aria-pressed", String(game === arcGame));
  }
  arcadeBest = readArcadeBest();
  renderArcStats();
}
function stopArcade(completed) {
  clearInterval(arcTick);
  arcTick = 0;
  byId("arcade").classList.remove("playing");
  arcadeInput.disabled = true;
  arcadeStart.disabled = arcadeDuration.disabled = false;
  arcadeReset.disabled = true;
  arcadeStart.textContent = "Retry round";
  arcadeInput.setAttribute("aria-invalid", "false");
  byId("arcFeedback").textContent = "";
  if (completed) {
    const score = arcGame === "bloom" ? flowers : arcPoints;
    arcadeBest = Math.max(arcadeBest, score);
    KS.data.arcade[arcadeBestKey()] = arcadeBest;
    KS.save();
    byId("arcWord").textContent = "Round complete";
    byId("arcResult").hidden = false;
    byId("arcResult").textContent =
      (arcGame === "bloom"
        ? flowers + " flowers grown"
        : arcPoints + " points · " + flowers + " words cleared") +
      " · Best combo " +
      arcBestCombo +
      " · " +
      arcErrors +
      " mistyped entries. Personal best: " +
      arcadeBest +
      (arcGame === "bloom" ? " words." : " points.");
    byId("arcStatus").textContent =
      "Round finished. Your record is saved in this browser.";
  } else {
    byId("arcWord").textContent = "Round stopped";
    byId("arcStatus").textContent =
      "You left the round. The timer stopped and no record was changed.";
    byId("arcResult").hidden = true;
  }
  renderArcStats();
}
function refreshArcadeClock() {
  if (!arcTick) return;
  const remaining = Math.max(0, (arcDeadline - performance.now()) / 1000);
  byId("arcTime").textContent = Math.ceil(remaining) + "s";
  byId("arcClock").value = remaining;
  if (!remaining) stopArcade(true);
}
function startArcade() {
  byId("arcade").classList.add("playing");
  clearInterval(arcTick);
  flowers = arcErrors = arcCombo = arcBestCombo = arcPoints = cleanWords = 0;
  wordIndex = Math.floor(Math.random() * 5);
  arcadeBest = readArcadeBest();
  byId("garden").replaceChildren();
  byId("garden").setAttribute("aria-label", "No flowers yet");
  byId("miniGarden").replaceChildren();
  byId("gardenNote").textContent = "A small beginning. Room to grow.";
  byId("arcResult").hidden = true;
  byId("arcStatus").textContent = "";
  byId("arcFeedback").textContent = "";
  arcadeInput.disabled = false;
  arcadeStart.disabled = arcadeDuration.disabled = true;
  arcadeReset.disabled = false;
  byId("arcClock").max = Number(arcadeDuration.value);
  arcDeadline = performance.now() + Number(arcadeDuration.value) * 1000;
  arcTick = setInterval(refreshArcadeClock, 100);
  nextArcWord();
  renderArcStats();
  if (arcGame === "relay") renderRelay();
  refreshArcadeClock();
  arcadeInput.focus();
}
function acceptArcInput() {
  if (!arcTick) return;
  if (performance.now() >= arcDeadline) {
    refreshArcadeClock();
    return;
  }
  const value = arcadeInput.value,
    wrong = !arcTarget.startsWith(value);
  if (wrong) {
    if (!arcWrong) arcErrors++;
    arcCombo = 0;
    arcDirty = true;
    byId("arcFeedback").textContent =
      "Check the highlighted word. Backspace to correct your entry.";
  } else
    byId("arcFeedback").textContent = value
      ? "Keep going."
      : "Type the next word.";
  arcWrong = wrong;
  renderArcStats();
  if (value !== arcTarget) {
    showWord();
    return;
  }
  flowers++;
  if (!arcDirty) {
    cleanWords++;
    arcCombo++;
  }
  arcBestCombo = Math.max(arcBestCombo, arcCombo);
  arcPoints += 10 + Math.min(arcCombo, 10) * 2;
  if (arcGame === "bloom") growGarden();
  else renderRelay();
  wordIndex++;
  nextArcWord();
  renderArcStats();
  byId("arcFeedback").textContent =
    "Word cleared. " +
    (arcGame === "bloom" ? "A new flower planted." : "Keep the relay moving.");
}
arcadeInput.addEventListener("input", (e) => {
  if (!e.isComposing) acceptArcInput();
});
arcadeInput.addEventListener("compositionend", acceptArcInput);
for (const event of ["paste", "drop"])
  arcadeInput.addEventListener(event, (e) => e.preventDefault());
arcadeStart.onclick = startArcade;
arcadeReset.onclick = startArcade;
function resetArcade() {
  if (arcTick) stopArcade(false);
  flowers = arcErrors = arcCombo = arcBestCombo = arcPoints = cleanWords = 0;
  byId("arcClock").max = byId("arcClock").value = Number(arcadeDuration.value);
  byId("arcTime").textContent = arcadeDuration.value + "s";
  byId("arcResult").hidden = true;
  byId("arcStatus").textContent = "";
  byId("arcWord").textContent =
    arcGame === "bloom" ? "Ready to grow?" : "Ready to relay?";
  byId("garden").replaceChildren();
  byId("garden").setAttribute("aria-label", "No flowers yet");
  byId("miniGarden").replaceChildren();
  byId("gardenNote").textContent = "A small beginning. Room to grow.";
  arcadeStart.textContent = "Start round";
  configureGame();
  renderRelay();
  if (arcGame === "bloom")
    byId("gardenNote").textContent = "A small beginning. Room to grow.";
}
arcadeDuration.onchange = resetArcade;
byId("bloomGame").onclick = () => {
  if (arcTick) stopArcade(false);
  arcGame = "bloom";
  resetArcade();
};
byId("relayGame").onclick = () => {
  if (arcTick) stopArcade(false);
  arcGame = "relay";
  resetArcade();
};
resetArcade();
