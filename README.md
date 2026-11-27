# KeySprout Typing Academy

A static HTML, CSS and JavaScript typing academy. The original college typing test remains at the center of the Tests section, with positional character scoring, a timer, accuracy and local history.

Live: https://shaikshadik03.github.io/typing-speed-ui-wd/

## Run locally

Requires Node.js for development tools only. The website itself has no runtime dependencies, API keys, backend or build step.

```sh
npm ci
npm run serve
```

Open http://127.0.0.1:4173. Alternatively, serve the repository with any static HTTP server. `index.html` is the entry point, and every asset uses a relative path for GitHub Pages subdirectory hosting.

## Features

- Home dashboard with next unfinished lesson, honest empty states, daily test goal and a local-calendar learning streak.
- Ten stable-ID lessons across Beginner, Intermediate and Advanced units, each with an introduction and three practice stages.
- Physical and on-screen keyboards, a mobile input, color and text finger hints, opposite-hand Shift guidance, combos, stars and XP.
- Everyday Text, Numbers and Symbols, and Code tests at 15, 30, 60 and 120 seconds. Daily Challenge uses a reproducible date-seeded Everyday passage for 60 seconds.
- Targeted drills for up to three missed keys. Mistake history includes corrected errors; test accuracy uses the final entry.
- Word Bloom plants an SVG garden. Word Relay advances every five words, with increasing word difficulty and clean-word combo bonuses. Both retain records by duration.
- Filterable progress, speed and accuracy charts, personal records, recent attempts and CSV export.
- Persistent light/dark themes, optional lesson sounds (off by default), reduced-motion support and keyboard focus styles.

## Scoring and behavior

Test WPM = matching final characters / 5 / elapsed minutes. Accuracy = matching final characters / final characters entered. Spaces and punctuation count. Backspace is allowed. Empty tests show zero and are not saved. Tests run for the selected time; long passages extend automatically. Comparisons require the same text mode, duration and practice/daily type.

Lessons require correcting each character before advancing. Stars use successful keystrokes / all attempts: 95% earns three stars, 85% earns two, otherwise one. A completed lesson unlocks the next one at any accuracy. Best awards never decrease. Total XP is 20 per best star; replays earn only the increase in best-award XP. Targeted drills award no XP. Leaving an active section cancels its unfinished round; completed results remain until an explicit reset or retry.

Word Bloom preserves the original words-completed score. Word Relay awards 10 points per word plus twice the clean-word combo, capped at 20 bonus points. Five words advance a round; word difficulty rises through five tiers. A mistyped word resets the combo. Arcade rounds do not count toward the learning streak or daily test goal.

## Storage and migration

`js/storage.js` creates `keysprout-academy-v2` and leaves all original localStorage keys untouched. It retains a legacy snapshot and migrates:

| Old key                               | Preserved data                                                                                                                       |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `keysprout-lessons-v1`                | Numeric lessons 0–4 map to `index-fingers`, `home-row`, `top-row`, `bottom-row`, `everyday-words`; best accuracy and awards retained |
| `keysprout-progress-v1`               | Test history and legacy difficulty achievements                                                                                      |
| `keysprout-best-v1`                   | Best WPM                                                                                                                             |
| `keysprout-arcade-best`, `-15`, `-60` | Original 30-, 15-, and 60-second Word Bloom records                                                                                  |
| `keysprout-daily-test-goal`           | Daily goal                                                                                                                           |

Old tests did not store duration, so migration leaves it unknown and excludes those tests from comparable-result deltas. Old lessons did not store completion dates, so migration does not invent streak days. Existing completed lessons remain replayable even if previous lessons are incomplete. Migration runs once. New data is stored only in v2; the old keys remain a recovery source.

Streak days use local calendar dates. Completing a lesson (including a targeted drill) or a nonempty saved test marks a day once. A streak is active if it includes today or yesterday. Progress is browser-local and does not sync across devices. If storage fails, an on-screen notice explains that progress may not persist. CSV contains all tests matching the current Progress filters, with unknown legacy fields blank.

## Source map

- `index.html`: semantic page structure.
- `assets/base.css`, `assets/style.css`: shared structure and academy design.
- `js/storage.js`, `js/curriculum.js`, `js/passages.js`: persistence, stable curriculum and original passage banks.
- `js/lessons.js`, `js/tests.js`, `js/arcade.js`: practice engines and rendering.
- `js/progress.js`, `js/app.js`: reporting, settings, navigation and dashboard.
- `ASSETS.md`: photo source and usage license.

## Validation

```sh
npm test
```

Playwright runs desktop (1440 × 1000) and phone (390 × 844) projects using installed Microsoft Edge by default. Set `PLAYWRIGHT_CHANNEL=chromium` after `npx playwright install chromium` to use bundled Chromium instead. The suite starts its own local server.

Tests cover fresh and migrated storage; lesson completion, unlocks, best awards, Shift hints and mistake drills; real keyboard events and input events; timers, empty results, comparisons and cancellation; deterministic challenges; arcade scoring and persistence; filters, settings, CSV contents, storage errors, 320px layout, reduced motion and automated WCAG checks. Phone tests emulate the viewport and touch input, not a physical Android keyboard or screen reader.

Deploy by pushing this repository's `main` branch to the existing GitHub Pages source. No custom domain or new hosting service is required.
