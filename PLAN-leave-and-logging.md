# Leave planner, honest logging, clearer numbers — plan

Written 2026-10-19, against `index.html` as it sits in the working tree
(102,469 bytes, 15 Sep 12:05, which is ahead of the last commit `b4a3730` —
the uncommitted palette/README work is the baseline here, not HEAD).

Method: full line-level read of `index.html`, `sw.js`, `README.md` and
`PLAN-attendance.md`. A five-course fixture was built from
`new_timetable.json` (ENG440, ECO4502, MAT230, ENG449, ECO373 — first section
per component, no clashes) in the shape of Bob's `attendancePayload()`, then
imported through the real Data-tab file input and driven by Playwright clicks
on 2026-10-19. Every tab was screenshotted at 1500px and 390px in Selene and
Porcelain. Every number in Part A came out of those runs unless it says
otherwise. The hairline skill (`~/.claude/skills/hairline-create`) was read in
full — `SKILL.md`, `rules.md`, `concepts.md`, the kernel index and its `css()`.

**Status: implemented 2026-10-19.** A0–A4 fixed and B0–B6 built. A Playwright
harness drives real clicks through 25 checks: all pass on the new file, and the
A0 and A2 checks also run against the pre-change copy and reproduce both
bugs there. Departures from the plan, all deliberate:

- The plan's day cells were to show course-coloured chips. They show a class
  count and hours instead: a per-course colour would put a hue on the page that
  is not green, amber or red, and those three are the only colours allowed to
  carry meaning here.
- Holidays are labelled "holiday", not by name. `CALENDAR` holds dates only,
  and the editor regenerates it, so a name map would drift.
- Concepts picked were **Seats** (no timetable) and **Keys** (no leave
  planned). Pigeonholes and the tear-off pad were not built.
- The page is 176KB, not the ~140KB estimated. The kernel is 24KB; the
  rest is the new views.
- Also fixed, found during verification: a `change` event firing during a
  re-render nested a second render and threw. Pre-existing in the old code's
  inputs, and it surfaced once Reconcile took text.
- `sw.js` no longer deletes other apps' caches on the shared
  `talon270.github.io` origin. That one was reported by claude-43 and verified
  here against a local server.

The original "nothing is implemented" line is kept below as written.

**Nothing below is implemented — this is the plan.**

---

## Phase 0 — shape

**Who opens this and when.** Unchanged for the Overview: a phone, between
classes, "can I skip the next one". Two new moments: once every few days to
check in on what was held, and before a trip or a festival to see which days
off you can afford.

**The one thing it must never get wrong.** Still: never tell you that you have
leave you do not have. A2 below shows the current entry flow breaking it with
one extra tap. The planner adds a second form of the same failure — offering a
combination of days that would put one course under the bar — and the guard
is the same exact-hours arithmetic `stats()` already uses, never the rounded
display strings.

**Honest confidence of the central number.** New: classes held since your last
check-in are counted as attended but are *unchecked*, and the leave figure says
so in the same sentence ("13.0h of leave — 6 of the classes behind it are
unchecked"), tagged in `--warn` the way estimated numbers are elsewhere.

**When its data source dies.** No new source. A leave plan whose days have
passed drops those days and says so; it never silently turns them into
absences.

---

## Part A — findings, ranked

### A0 · BUG (high): an unreadable profile is destroyed by the next click that saves

Reported by a cross-app review session (claude-43), reproduced here. `load()`
does `catch(e){ S = blank(); S.__corrupt = true; }` and keeps no copy of the
raw string. Seeded `atten.v1` with truncated JSON and reloaded: the banner
appeared, two tab clicks left the blob intact (tabs do not save), and **one
click on a palette swatch replaced it** — `localStorage` then held only the
blank profile, no other `atten.*` key. Week navigation and any mark do the
same. The banner itself admits it: "the unreadable copy will be replaced the
next time you click".

**Fix:** inside that `catch`, copy the raw string to
`atten.v1.unreadable-<timestamp>` before anything can call `save()`, and point
the banner at that key with a Download button on Settings → Data. Two lines
plus the banner text; it is the pattern `vis/` and `Mandarin/` already use.
Lands in B0.

### A1 · BUG (high): a mid-term import credits every past class as attended, without asking

`applyImport()` writes courses and nothing else; `markOf()` defaults every
unlogged session to `'attended'`. Imported on 19 Oct, the fixture showed
**116 past sessions, 155.0h, all credited, 0 logged**, and every course read
**100.0%** with 13.0–13.6h of leave. Nothing on screen says those 155 hours
were assumed. `countFrom` exists to fix this, but it sits fourth in the rail
under Term progress and Next seven days, and nothing points you at it.

This is the main source of "wrongful entering": the record starts wrong and
you have to know to go and correct it.

**Fix:** a check-in model (B2). The import ends on a question — "classes have
been held since Mon 17 Aug; how do you want to start?" — with three explicit
answers: check them now, count from today, or "I attended all of them". The
smallest correct fix would be a banner pointing at `countFrom`, but that only
covers the import; the same silent default applies every day you don't open
the app, which is why B2 tracks a reviewed-through date instead.

### A2 · BUG (high): one extra tap erases an absence and adds leave you do not have

`cycle()` goes attended → absent → cancelled → attended. Run on a past ECO373
class on the Week grid:

| | ECO373 % | held | leave |
|---|---|---|---|
| fresh import | 100.00% | 32.0h | 13.375h |
| tap 1 (absent) | 96.88% | 32.0h | 12.375h |
| tap 2 (a double-tap, or "did that register?") | **100.00%** | 31.0h | **13.125h** |

The second tap marks it `cancelled`, which removes it from the denominator.
The absence vanishes and the budget grows 0.75h. On a phone, where a tap gives
no feedback until the whole view re-renders, this is the likely way an
absence gets lost. There is no undo for a mark.

**Fix:** stop cycling. Every place that logs a class — the Week grid, the
session lists, the new check-in — sets a state explicitly: two equal buttons,
Attended / Missed, and Cancelled as a smaller third. Pressing the current one
again does nothing. Every change raises an inline "Marked ECO373 Thu 15 Oct
missed · Undo" message (no `confirm()`), backed by a 20-deep in-memory undo
stack. This is smallest because the hero's segmented control already does
exactly this; it is the pattern to reuse, not a new one.

### A3 · INCONSISTENCY (medium): a past class can only be reached by paging the Week grid

An expanded course row shows "Still to come" — upcoming only. To log an
absence from week 1 you open Week and press Previous **9 times** (19 Oct back
to 17 Aug; arithmetic, not timed). On a phone the grid is six 116px-minimum
columns plus a 56px time column — 752px inside a 390px viewport — so each
week is also a horizontal scroll.

**Fix:** the expanded course row becomes that course's whole term: past
classes with their marks (newest first) above the upcoming ones, each with the
explicit controls from A2. Two taps from the Overview to any class in the term.

### A4 · DESIGN RISK (medium): Reconcile only takes a percentage

`reconcileView()` converts the typed percentage into hours with
`off/100 * st.held` — the *app's* held hours. Under a `countFrom` date those
differ from the registrar's, so the gap it reports is wrong by exactly the
excluded weeks. A record that says "27 of 32" also has to be divided by hand
first, and then rounds.

**Fix:** one field that accepts either `84.4` or `27/32`. A count form is
compared in classes, against the registrar's own denominator, and the reply
says which form it used. Reconcile moves into the Log tab (B3), since it is
the same job — correcting the past record. Unconfirmed: whether Ashoka's
portal shows counts, hours or a percentage. Accepting both makes it not matter.

### A5 · DESIGN RISK (medium): the Overview needs five tall cards to show five numbers

At 1500px each course card is ~187px tall and the five run to ~935px, so the
fifth course's percentage sits below the fold on a 950px screen. Each card
repeats the same four lines; "leave left" leads with hours ("13.0h of leave
left (8 classes of 1.5h)") although a student decides in classes.

**Fix:** B1 — a compact course table on top of the cards' content, leave led
by classes, the cards kept as the expanded detail.

### A6 · COSMETIC (low): pre-existing, not introduced here

- Course titles read "Room G304B · Vinayak Das Gupta" — Bob's catalog puts
  room and instructor in `title` (seen in `new_timetable.json`). Out of scope
  here; the fix belongs in `scrape_catalog.py`. This plan relabels it as the
  instructor line rather than a title so it stops reading as a bug.
- Full-page screenshots show the sticky header mid-page. That is a capture
  artefact of `full_page`, not a defect.

---

## Part B — the build

Each step is independently shippable and gets run before the next one starts.
A timestamped backup of `index.html` is taken first.

### B0 · Schema v6, migration in the same change

```
reviewedThrough: null | 'YYYY-MM-DD'   // every held class on or before it has been checked
leavePlan:       ['YYYY-MM-DD', …]     // what-if whole days off; never counted until committed
```

Migration from v5: both fields absent → `reviewedThrough = null`,
`leavePlan = []`. `null` means "never checked", so an existing profile gets the
same start-up question as a fresh import, with a fourth answer for someone who
has been logging as they go: "I've kept this up to date — mark everything
before today as checked." Nothing in `log` is touched. Tested by seeding a v5
profile with logs and reloading.

Same change: A0's fix — the raw unreadable string is copied to
`atten.v1.unreadable-<timestamp>` inside `load()`'s `catch`, before any
`save()` can run.

### B1 · Overview (the Courses tab, renamed)

- **Summary table** at the top, one row per course, worst first: course · %
  with its gauge · leave in **classes** then hours · missed so far · next
  class. On a phone it collapses to two lines per course. All five courses fit
  above the fold at 1500×950 and 390×844.
- **Leave leads with classes**: "8 classes left (13.0h)". The class count stays
  floored against the largest remaining class, as `stats()` does now.
- **Unchecked classes are counted and named** in the leave sentence, tagged
  in `--warn`, with a "Check in" link (A1, B2).
- The hero stays — it is already the right answer to "can I skip the next
  one" — but gets explicit buttons and the undo message (A2).
- Rail: Term progress, Next seven days, the bar disclosure. `countFrom` moves
  to Log, where the start-up question also sets it.

### B2 · Log tab: check-in, explicit marks, undo (A1, A2)

- **Check-in queue**: every held class after `reviewedThrough`, grouped by day,
  newest first. Each class shows Attended (pre-selected — still the default)
  and Missed, Cancelled smaller. Each day has "All attended". One "Save N days"
  button advances `reviewedThrough` and says how many classes it checked.
- **Start-up question** on import and on a v5 profile (B0).
- **Course history**: pick a course, see its whole term with explicit controls
  (the same list the expanded Overview row uses, A3).
- **Reconcile**, folded in, with the `84.4` / `27/32` field (A4).
- **Start counting from**, moved here.
- Undo stack (20 entries, memory only — it does not survive a reload, and the
  undo message says nothing that implies it does).

### B3 · Week grid

Clicking a class opens a small inline popover anchored to it — Attended /
Missed / Cancelled, current one pressed, Esc or an outside click closes. No
cycling. A future class marked Missed is labelled "planned". The Add-extra form
stays.

### B4 · Leave tab: the live planner

A month calendar from today to 1 Dec. Each day:

| Day kind | Shown as |
|---|---|
| University off (the `CALENDAR.off` red days), Sunday | flat, labelled ("Diwali", "Sun") |
| No classes **for your timetable** (e.g. every Saturday in the fixture) | flat, "free" |
| Teaching day | raised; its classes as course-coloured chips; the cost ("3 classes · 4.0h") |

**Live**: clicking a teaching day adds or removes it from the plan, and every
other day re-evaluates against the plan so far, using `stats()` with the
plan's sessions treated as missed. Each teaching day is then one of:

- **affordable** — skipping it too keeps every course at or above its bar;
- **tight** — affordable, but leaves some course with less than one class of leave;
- **not affordable** — names the course it breaks: "puts MAT230 0.5h under 75%".

Today is marked, and classes already over today count as held, not plannable.

**Per-course panel** beside it (below it on a phone): leave now → leave after
this plan, in classes and hours, with a second fill on the gauge for what the
plan spends. Two actions: **Mark these as missed** (writes the plan into `log`
as future absences, which `stats()` already handles, then clears the plan,
with undo) and **Clear plan**.

**Breaks you can afford** — the "possible combinations". Enumerate every
window of up to 9 consecutive days from today where each day is either free
or skipped, at most 3 skipped, and the window cannot grow by one more free
day at either end. Keep the ones affordable on top of the current plan. Rank by
days off per day skipped, then by hours spent. Show the top six; each one adds
its days to the plan in one click. On the fixture these come out as, for
example:

| Break | Skip | Costs |
|---|---|---|
| Thu 29 Oct – Sun 1 Nov, 4 days | Thu 29 | MAT230 1.5h, ECO373 1.5h, ENG449 1.0h |
| Thu 29 Oct – Mon 2 Nov, 5 days | Thu 29, Mon 2 | ECO373 2.5h, ENG449 2.5h, MAT230 1.5h |
| Fri 6 – Mon 9 Nov, 4 days | Fri 6 | ENG440 2.5h, ECO4502 1.5h, MAT230 1.0h |

(30–31 Oct and 9 Nov are university off days; Sat 7 Nov has no class in this
timetable.) The list is re-run on every plan change, so a combination that
stops fitting disappears rather than being offered. It is limited to
whole-day leave and a 9-day window: the ceiling is stated under the list, and
a skipped single class is still done from the Week grid.

`leavePlan` days that have passed are dropped on load, with a line saying how
many.

### B5 · Hairline figures (two, both empty/rest states)

Hairline figures are a picture that answers the pointer, not a chart, so they
go where the page has nothing to say yet — the place `concepts.md` names
directly. Never next to a number: rule 10 forbids text inside the figure, and
a decorative drawing beside a percentage competes with the one thing the page
is for.

Pick one concept for each slot, or say "your call":

**No timetable yet** (empty Overview / Log / Leave)

> **Bench.** A tier of lecture-hall seats, all folded up and empty. The pointer folds down the seat nearest it, its neighbours following less. Read-out: `row 2 · seat 4 · 0`.
>
> **Pigeonholes.** A wall rack of mail slots, none holding anything. The slot under the pointer slides forward, neighbours staggered. Read-out: `slot 3·2 · 0`.

**No leave planned yet** (Leave tab, before the first click)

> **Tear-off pad.** A desk pad of day sheets, top sheet lifted at one corner. The pointer lifts the sheet under it; neighbours part. Read-out: `sheet 12`.
>
> **Key rack.** A row of hooks with no keys taken. The hook under the pointer tips forward. Read-out: `hook 5 · 0`.

Embedding: `kernel.js` inlined **unchanged** (23.9KB) in its own `<script>`,
each figure its own block, mounted into a `[data-hairline]` box. The palette
reaches it by setting the kernel's own `--hl-*` variables from this app's
tokens on each `data-palette`, so all four palettes and both schemes drive it
and the figure sets no colour itself. Each figure is checked with the skill's
`look.mjs` and `validate.mjs` before it is embedded. The page grows from ~102KB
to ~140KB; still one file, no network.

### B6 · Tabs, README, service worker

- Tabs: **Overview · Log · Leave · Week · Settings** (Calendar authoring and
  Data under Settings — both are once-a-term). Five, as now.
- README: tabs table, the check-in model and the planner in "the things most
  attendance apps get wrong", solid-vs-assumed rows for the planner.
- `sw.js`: `CACHE` stays `atten-v2` — the page is network-first, so a new
  build reaches returning visitors without a bump.

### Verification (Gate 2)

A Playwright harness in the scratchpad, real clicks only, run against the
backup and the new file:

- A0: truncated JSON in `atten.v1`, then a palette click → the raw string
  survives under `atten.v1.unreadable-*`, byte-identical. The backup loses it.
- A1: fresh mid-term import → the start-up question appears; "count from
  today" leaves 0 past sessions counted; "check them now" lists 116.
- A2: tap Missed twice on one class → still missed, leave unchanged after the
  second tap; Undo restores the prior mark. The same script on the backup
  reproduces the 13.125h.
- A3: any past class reachable from the Overview in ≤ 2 clicks.
- A4: `27/32` and `84.4` both parse; count form compares classes.
- B4: on the fixture, the planner never marks a day affordable that, once
  committed, leaves a course with `budgetHours < 0` — checked over every
  teaching day and every suggested break.
- Schema: seeded v5 profile with logs survives reload, logs byte-identical.
- Zero console errors; all four palettes; 1920, 1500 and 390 wide; empty,
  one-course and five-course states; no `alert()` / `confirm()` anywhere.

---

## Out of scope

- **Per-class leave planning.** The planner is whole days. One skipped class
  is already a single action on the Week grid; combining both in the planner
  doubles its state for little gain.
- **Fixing Bob's titles.** The room/instructor-in-title quirk lives in
  `scrape_catalog.py` and Bob; this app only relabels it.
- **Notifications or reminders to check in.** No backend, and a permission
  prompt is its own project.
- **Medical leave / condonation rules.** Not in any document on disk; the bar
  stays per-course and editable.
- **The calendar constant.** Unchanged; the editor moves under Settings as-is.
