# Maitrayana Avni: interactive demo

A practice copy of Maitrayana's Avni phone app, in one offline web page. On the left, a guide with 26 lessons; on the right, a phone that runs
Maitrayana's real forms, rules and Home cards (the bundle exported from the Maitrayana UAT org on 25 Nov 2026) on Avni's own model classes.

The lessons follow the demo video "Maitrayana Avni mobile app demo": a new site, a batch, its participants, the five programmes
(Nirman, Pragati, Akanksha, Vriddhi, Siddhi), every kind of session attendance, the common sessions, dashboards and sync.

All people in the demo are invented. Nothing on the page talks to a server.

Layout and guide follow https://siddharthr29.github.io/avni-mch-demo/ (Guided lessons, Free explore, What it does); the code started from
https://github.com/siddharthr29/desai-avni-interactive-demo.

## Build and open

Needs Python 3. The self-test and screenshot scripts also need Google Chrome.

```sh
python3 tools/build.py          # writes dist/index.html
open dist/index.html            # or double-click it
cp dist/index.html index.html   # the copy GitHub Pages serves
tools/selftest.sh               # plays every lesson; must print PASS
```

`dist/index.html` is one file with everything inside it. Share that file, or host it on any static site. The `index.html` at the top of this repository is that file, served by GitHub Pages.

## Update to a new bundle

1. Export the bundle zip from App Designer.
2. `python3 tools/make_bundle.py path/to/bundle.zip`, which writes `data/bundle.json`.
3. `python3 tools/build.py`, then `tools/selftest.sh`.

If the new bundle changes a form, rule or label that a lesson uses, update that lesson in `src/lessons.js` and the feature list in `data/features.json`.

## What is where

| File | Job |
|---|---|
| `data/bundle.json` | The Maitrayana bundle: forms, concepts, rules, programmes, cards, dashboards, user groups, privileges, labels, and the two locations (Karnataka > Banglore). |
| `data/features.json` | The "What it does" list. `open` says which screen a feature opens on the phone; `lesson` links its lesson. |
| `data/photos/` | Four sample session pictures for the photo picker. |
| `tools/vendor/rt.js`, `rules-config.js` | Avni's own code: openchs-models, moment, lodash, and rules-config (the bundle's rules call `RuleCondition`). |
| `src/core.js` | Practice data, dated around today: three sites and batches with their sessions, plus the video's own records (`addDemo`), added as far as each lesson needs. |
| `src/engine.js` | Turns practice data into Avni objects (Individual, ProgramEnrolment, ProgramEncounter…) and runs the bundle's rules: show and hide, checks, counted values, eligibility, privileges, card counts. |
| `src/ui.js` | The phone's screens: Home and Total, search, register, the batch page with Profile / Programs / Common Sessions, forms page by page, summary, save. |
| `src/lessons.js`, `src/guide.js` | The guide. Each step lights up one part of the phone; "Do it for me" taps it; "Back" replays the lesson to the previous step. |

## What comes from the bundle, and what does not

From the bundle, unchanged: every form and question, the show/hide rules (School or Community, allergies, earlier registration…), the 10 digit check,
the present / not present counts, which programmes a batch may join, which forms each programme has, who may register or record (user groups), the cards and their colours, and the app's own labels ("Add participant", "Session Attendance", "Common Sessions").

Made for the demo: all names and records, the session photos, and the three practice users. "Coach (demo login)" may do everything, like the login in the video; "City staff" and "Manager" use the bundle's own groups ("Staff in their own cities", "Managers") with exactly their UAT privileges.

Not in this copy: programme exit, editing an enrolment, sharing, the Date filter configured on the Total dashboard (the phone in the video shows only Subject Type), and the Help form and usage counting that the reference page sends to its own Google Sheet.

`?date=YYYY-MM-DD` moves "today"; `?lesson=<id>&steps=<n>` opens a lesson at a step; `tools/shot.sh name "query"` takes a screenshot.
