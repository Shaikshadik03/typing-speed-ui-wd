"use strict";
// IDs are permanent. Keep migration aliases in storage.js when expanding the curriculum.
const lessons = [
  {
    id: "index-fingers",
    unit: "Beginner",
    title: "Index fingers",
    keys: "F, J & Space",
    intro:
      "Find the raised marks on F and J. Rest your left and right index fingers here; use either thumb for Space. Build a steady rhythm before chasing speed.",
    drills: ["fff jjj fj fj", "fj jf ff jj", "jff jfjf fj jf"],
  },
  {
    id: "home-row",
    unit: "Beginner",
    title: "Home row",
    keys: "A, S, D, K, L",
    intro:
      "Rest your fingers on A S D F and J K L ;. Let each finger return home after every key.",
    drills: [
      "asd f j kl;",
      "ask dad fall salad",
      "a lad asks dad; dad adds a salad",
    ],
  },
  {
    id: "top-row",
    unit: "Beginner",
    title: "Top row",
    keys: "Q through P",
    intro:
      "Reach up gently from the home row. Your index fingers cover R T and Y U. Return to F and J between reaches.",
    drills: ["qwer ty uiop", "type quiet write tall", "we write quite well"],
  },
  {
    id: "bottom-row",
    unit: "Beginner",
    title: "Bottom row",
    keys: "Z through M",
    intro:
      "Curl your fingers down to the bottom row. Keep your hands relaxed and use your index fingers for V B and N M.",
    drills: ["zxc vb nm", "mix cab zoom van", "a calm fox can move"],
  },
  {
    id: "everyday-words",
    unit: "Intermediate",
    title: "Everyday words",
    keys: "Mixed letters",
    intro:
      "Connect familiar letters into words. Aim for an even pace with a gentle pause at each space.",
    drills: [
      "calm hands find rhythm",
      "garden forest quiet window",
      "type each day and find your rhythm",
    ],
  },
  {
    id: "flowing-sentences",
    unit: "Intermediate",
    title: "Flowing sentences",
    keys: "Word rhythm",
    intro:
      "Look a little ahead of the cursor. Keep your eyes on the passage and let the home row guide your hands.",
    drills: [
      "read and write with care",
      "a little practice goes a long way",
      "the quiet garden gives us room to think and grow",
    ],
  },
  {
    id: "capitals",
    unit: "Intermediate",
    title: "Capital letters",
    keys: "Shift & full stops",
    intro:
      "Hold Shift with the opposite pinky for capital letters. For example, hold right Shift while your left index finger types F.",
    drills: [
      "F J A L Q P",
      "Mira reads. Sam writes.",
      "Every day is a fresh start. Keep going.",
    ],
  },
  {
    id: "numbers",
    unit: "Advanced",
    title: "Numbers in motion",
    keys: "0 through 9",
    intro:
      "Reach to the number row with the matching finger. Start slowly and return your fingers to the home row.",
    drills: [
      "12345 67890 2468",
      "room 204 at 10:30",
      "We packed 12 books, 3 pens and 45 cards.",
    ],
  },
  {
    id: "punctuation",
    unit: "Advanced",
    title: "Symbols & punctuation",
    keys: "Shift combinations",
    intro:
      "Use the opposite Shift key for symbols on the upper half of a key. Accuracy matters more than speed.",
    drills: [
      "! @ # $ % ^ & * ( )",
      "Hello, world! Are you ready?",
      "Save 25% today; total: $48.50 (tax included).",
    ],
  },
  {
    id: "code-basics",
    unit: "Advanced",
    title: "A little code",
    keys: "Braces, brackets & quotes",
    intro:
      "Code rewards precision. Match every quote, space and bracket. These are short JavaScript snippets; type them exactly as shown.",
    drills: [
      "() [] {} <> = + / \\",
      "const total = 12;",
      'if (total > 0) { console.log("Ready!"); }',
    ],
  },
];
const fingerGroups = [
  ["`1qaz", "Left pinky", "pinky"],
  ["2wsx", "Left ring finger", "ring"],
  ["3edc", "Left middle finger", "middle"],
  ["45rfvtgb", "Left index finger", "index"],
  ["67yhnujm", "Right index finger", "index"],
  ["8ik,", "Right middle finger", "middle"],
  ["9ol.", "Right ring finger", "ring"],
  ["0p[]\\;'/=-", "Right pinky", "pinky"],
];
const shiftedKeys = Object.fromEntries(
  [...'~!@#$%^&*()_+{}|:"<>?'].map((char, index) => [
    char,
    "`1234567890-=[]\\;',./"[index],
  ]),
);
function keyHint(char) {
  const base = shiftedKeys[char] || char?.toLowerCase();
  const group = fingerGroups.find((g) => base && g[0].includes(base));
  const shifted = !!shiftedKeys[char] || /[A-Z]/.test(char || "");
  const finger = char === " " ? "Either thumb" : group?.[1] || "Right pinky";
  return {
    base,
    shifted,
    finger,
    color: char === " " ? "thumb" : group?.[2] || "pinky",
    shift: finger.startsWith("Left") ? "Right Shift" : "Left Shift",
  };
}
