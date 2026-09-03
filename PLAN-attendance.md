# Attendance budget — plan

Written 2026-09-03, against an empty `atten/`, `Boli laga bc/bob_the_builder_integrated.html`
as of the 2026-09-01 backup, and `new_timetable.json` (287 courses, 1068 meetings).

Method: the design tree was settled with you over seven rounds of questions on
2026-09-03. Every fact below was established by running against the real data —
`new_timetable.json` parsed for duration, day and term distributions; Bob grepped
for its export payload shape, storage keys and grid constants; the filesystem
searched for calendar sources and PDF tooling. Nothing here is inferred from
reading alone except where labelled unconfirmed.

**Status: implemented 2026-09-03.** B0–B10 are built and verified — 61 assertions
in the harness, all passing, driven by real clicks. The one thing still
outstanding is the one this plan already named: the real Monsoon 2026 term
dates. The shipped `CALENDAR` is a placeholder flagged `provisional: true`, and
the app refuses to be quiet about it.

---

## Phase 0 — shape

**Who opens this and when.** An Ashoka undergraduate, on a phone, between
classes, deciding whether skipping the next one costs them anything. Opened
often and briefly, so the answer must be on screen at load with no navigation.
You open it once a semester in a second mode, to author the calendar constant.

**The one thing it must never get wrong: it must never tell you that you have
leave you do not have.** Every rounding decision in this document breaks toward
under-reporting the budget. A student who skips a class on this app's say-so and
then fails the attendance bar has been actively harmed by the tool.

**Honest confidence of the central number.** The budget is exact arithmetic on
the semester calendar you hardcode — but that calendar is a snapshot, and a
holiday declared mid-term makes it wrong. The app shows the date its calendar
was authored, and the reconcile feature exists precisely because the official
record is the authority and this app is not.

**What it does when its data source dies.** There is no live source. The failure
mode is a stale hardcoded calendar: if today is past the semester end date in the
build, a persistent banner says so and names the term the calendar was written
for. A profile whose `semester` does not match the build is never silently mixed.

---

## Part A — findings, ranked

### A1 · MODEL GAP (high): Bob's plan export cannot describe a schedule

`exportActivePlan()` (line 4906) writes
`{version, kind:'bob-plan', semester, planName, addedCourses, showFreeTime}`, and
an `addedCourses` entry is created at line 5929 as
`{code, chosen:{LEC:'LEC1'}, backup:{}}` — a course code and section keys, no
times. The meetings live only in Bob's inlined `DATA` array (line 2294). An
attendance app fed a `bob-plan` file knows *which* courses you take and nothing
about when they meet or how long they run.

**Fix:** a new `exportForAttendance()` in Bob emitting `kind:'bob-attendance'`,
where each course carries its chosen sections resolved into meetings — the same
objects already in `DATA`, filtered to the chosen `sec` per `comp`, each keeping
`comp`, `sec`, `term`, `day`, `start`, `end`, `room`, `instr`. This is the
smallest fix because it adds a function and a button and changes no existing
code path: `exportActivePlan`, `importPlanFromFile` and the everything-backup are
untouched, so no existing export file becomes invalid.

### A2 · DESIGN RISK (high): a re-import must not silently drop logged absences

`filterValidAddedCourses()` (line 4634) silently drops courses whose section key
no longer resolves — a known trap in Bob, and it is worse here, because in this
app a dropped course takes months of logged absences with it. A student who
changes a section in Bob and re-imports would lose their record with no message.

**Fix:** import is a diff, never a replace. Before writing anything, show what
changes: courses added, courses removed and how many logged sessions they hold,
sections changed and how many logged sessions no longer match. Nothing is applied
until confirmed, and the pre-import state is kept under one undo key. Smallest
correct fix because it needs no schema change — it is a preview step in front of
the existing write.

### A3 · DESIGN RISK (medium): `file://` shares one localStorage origin

Bob and this app both open from `file://`, which Chrome treats as one opaque
origin, so both read and write the same `localStorage`. Bob owns every key with
the `bob-` prefix plus two legacy names (line 4958). A collision would be silent
and would corrupt both apps. Unconfirmed in the specific case — I have not run
two `file://` pages against each other to observe the sharing — but the guard is
free and the failure is unrecoverable.

**Fix:** every key this app writes is prefixed `atten.`. One key,
`atten.v1`, holds the whole profile; `atten.archive.<semester>` holds a
displaced one. Nothing else is written.

### A4 · MODEL GAP (medium): Bob has no term dates, and neither does the filesystem

`SEMESTER` (line 2279) is `{id:'monsoon2026', label:'Monsoon 2026'}` — no start,
no end. A filesystem search across `Claude/` for calendar, academic and
attendance sources found nothing but Helth's unrelated `calendar.js`. There is no
academic calendar on this machine to parse, and no PDF tooling to parse it with:
no `pdf.js`, no `pdfplumber`, no PyMuPDF.

**Fix:** the calendar is a hardcoded constant authored through a built-in editor.
No PDF path is built.

### A5 · Fact (verified): contact hours round to the nearest half hour, cleanly

Every one of the 1068 meetings in `new_timetable.json` falls on nine durations,
and `round(minutes / 60 * 2) / 2` maps all of them to the institutional hour with
no ambiguity:

| Duration | Meetings | Contact hours |
|---|---|---|
| 55 min | 445 | 1.0 |
| 60 min | 12 | 1.0 |
| 85 min | 409 | 1.5 |
| 90 min | 4 | 1.5 |
| 115 min | 159 | 2.0 |
| 120 min | 12 | 2.0 |
| 175 min | 20 | 3.0 |
| 180 min | 4 | 3.0 |
| 240 min | 3 | 4.0 |

Ceiling-to-half-hour produces identical output on all nine, so the two rules are
indistinguishable on real data. Nearest is chosen because it stays sane on a
duration the catalog does not currently contain (a 65-minute class becomes 1.0h,
not 1.5h).

### A6 · Fact (verified): Saturday is a teaching day

28 meetings are scheduled on Saturdays. Day distribution: Mon 227, Tue 225, Fri
202, Wed 202, Thu 184, Sat 28. Sunday: none. The calendar therefore treats
Mon–Sat as teaching by default and you switch off the Saturdays that are not.

### A7 · MODEL GAP (low): half-semester courses are almost untestable from real data

Of 1068 meetings, 1066 are `Full semester` and 2 are `First half`. No meeting in
the catalog is tagged second-half. Half-semester support is in scope, so it will
be built — but it cannot be verified against a realistic enrolment, only against
a synthetic one.

**Fix:** build it, and verify with a hand-written import fixture that tags one
course first-half and one second-half. Label the second-half path explicitly as
verified only against synthetic data.

### A8 · NOISE (low, pre-existing, not in scope): Bob's importer uses `alert()` and `confirm()`

`importPlanFromFile` (line 4911) opens with `alert('Could not read that file…')`
and gates on `confirm(…)`, against your standing rule that those are defects on a
validation path. This is pre-existing and untouched by A1's fix. Flagged because
the new export sits beside it, not because this plan changes it. Say the word and
it becomes a separate change.

---

## Part B — the build

Each step is independently shippable and ends in something run, not read.

### B0 · Bob: the attendance export

Timestamped backup of `bob_the_builder_integrated.html` first, without asking.
Add `exportForAttendance()` and one button beside the existing exports. Payload:

```js
{
  kind: 'bob-attendance', version: 1,
  app: 'bob-the-builder', semester: 'monsoon2026',
  exportedAt: '<ISO>',
  courses: [{
    code: 'ECO354', title: '…', credits: <n>,
    sections: { LEC: 'LEC1', TUT: 'TUT2' },
    meetings: [{ comp, sec, term, day, start, end, room, instr }]
  }]
}
```

Meetings are resolved from `DATA` at export time, so the attendance app carries
no catalog and cannot disagree with Bob about when a class meets.

**Verify:** load Bob headless, seed a plan with three courses including one with
a TUT and one with a PRAC, click the real button, parse the downloaded file,
assert every chosen section's meetings are present and no unchosen section's are.
Run the same script against the pre-change file to confirm zero new console
errors.

### B1 · Skeleton

`atten/index.html`: `"use strict"` + IIFE + `window.Atten`. Storage under
`atten.v1` with an integer `SCHEMA_VERSION`, light and dark tokens, view router,
empty state that explains the two-step Bob path and links to it. No features.

**Verify:** loads from `file://` with zero console errors, both themes render,
storage round-trips a dummy object.

### B2 · Import, as a diff

File input accepts `bob-attendance`. Rejects anything else with an inline message
naming what it got. Shows the diff described in A2 and applies only on confirm.

**Verify:** import a fixture; re-import a modified fixture with one course
removed and one section changed; assert the preview names both and that
cancelling writes nothing.

### B3 · The semester calendar

A named constant at the top of the file, with the reasoning attached:

```js
// Authored 2026-09-03 for Monsoon 2026. Mon-Sat teach by default; every date
// below is an exception. HALF_BOUNDARY splits First half from Second half.
const CALENDAR = {
  semester: 'monsoon2026', label: 'Monsoon 2026',
  start: 'YYYY-MM-DD', end: 'YYYY-MM-DD',
  halfBoundary: 'YYYY-MM-DD',
  off: ['YYYY-MM-DD', …],            // no classes at all
  swaps: { 'YYYY-MM-DD': 'Mon', … }  // this date runs another weekday's timetable
};
```

Plus the authoring editor: a month grid where a click cycles a day
teaching → off → runs-Monday → … → teaching, and a copy button emitting the
constant above. The editor writes to the clipboard, never to storage — a
calendar configured in your browser alone would leave every deployed user with an
empty one.

**Verify:** author a small calendar in the editor, paste it back in, assert the
generated session list matches a hand-counted expectation.

### B4 · Session generation — the core

Expand `CALENDAR × meetings` into dated sessions. Rules, in order:

1. Walk every date from `start` to `end`.
2. Skip dates in `off`. Sunday is never a teaching day.
3. The effective weekday is `swaps[date]` if present, else the real weekday.
4. Emit one session per meeting matching that weekday, subject to `term`:
   `First half` before `halfBoundary`, `Second half` on or after it,
   `Full semester` always.
5. Contact hours per session: `round((end - start) / 60 * 2) / 2`.

Session id: `code|comp|sec|date|start` — stable across re-imports, which is what
makes A2's diff possible.

**Verify:** a fixture semester with a known holiday and a known swap, hand-counted
against the generated list. Assert a `First half` course emits zero sessions after
the boundary.

### B5 · Week grid

Bob's grid, reused: Mon–Sat columns, hour rows, absolutely positioned blocks,
`PX_PER_MIN`. Week navigation. A tile click cycles attended → absent → cancelled
→ attended. Attended is the zero-click default; you attend most classes.

Cancelled removes the session's hours from both the attended side and the
semester total, and clears any absence logged on it — the three states are
mutually exclusive, so there is nothing to reconcile between them.

**Verify:** click real tiles, not `page.evaluate` — inline handlers resolve in a
different scope. Assert the totals after each click.

### B6 · The numbers

Per course: current attendance percentage, and hours of leave remaining
underneath.

- Hours held to date = sum of non-cancelled sessions with a date before today.
- Attended = held minus absent.
- Percentage = attended / held. Undefined before the first session, and shown as
  "no classes yet", not as 100%.
- Semester total = every non-cancelled session, past and future.
- Leave remaining = `attended + futureHours - threshold × total`, floored at 0.

**Rounding always breaks against the student.** Worked example: ECO354 meets
Mon/Wed/Fri for 55 minutes, 39 sessions survive the calendar, so the total is
39.0h. At a 75% threshold you must attend 29.25h, leaving 9.75h of budget. That
displays as **9 sessions, not 10** — missing ten 1.0h classes leaves 29.0h
attended, which is 74.4% and a fail. The hours figure is exact; the
session-equivalent is floored.

Threshold: `DEFAULT_THRESHOLD = 0.75`, editable per course, stored per course.

**Verify:** the worked example above as an assertion, plus the boundary case at
exactly 75.0%.

### B7 · Warning states

Three states, colour plus a sentence that names the shortfall and the remedy:

| State | Condition | Example line |
|---|---|---|
| Safe | budget > one session | ECO354 — 92%, 6.0h of leave left (6 classes) |
| Close | budget ≤ one session | ECO354 — 77%, 1.0h left. One more absence puts you under 75% |
| Over | below threshold | ECO354 — 73%, you are 0.5h short. 4.0h of classes remain |

A fourth line appears when the remaining hours can no longer bring the course
back above the line: it says so plainly rather than showing an unreachable
budget.

**Verify:** drive a fixture into each of the four states and assert the rendered
sentence, in both themes.

### B8 · Extra classes

A form: course, date, start time, end time. Contact hours derived by the same
rule. Extra sessions add to both held and total, and are visibly marked on the
grid as added rather than scheduled.

**Verify:** add one, assert both denominators moved by the same amount; cancel
it, assert both moved back.

### B9 · Reconcile

Per course, enter the percentage the official record shows. The app reports the
gap in hours and in approximate sessions, then lists candidate sessions to flip —
sessions marked attended, most recent first, since a missed log is far more
common than a false absence. Flipping is always your click. The app never adjusts
itself to match.

**Verify:** seed a known 3.0h discrepancy, assert the reported gap and that the
candidate list is ordered as specified.

### B10 · Backup, restore, ship

Backup/restore of the whole `atten.v1` blob as JSON. Service worker plus
manifest, lifted from `Helth/`. `deploy/public/index.html` as a byte-identical
copy, `wrangler.jsonc` mirroring Bob's.

**Verify:** restore a backup taken at `SCHEMA_VERSION` 1 into a fresh profile and
assert every logged session survives. Confirm the deployed copy is byte-identical
with `cmp`.

---

## The standing checklist, applied

- [x] Bob backed up before B0 — `bob_the_builder_integrated.backup-20260903-150319.html`
- [x] Zero console errors on a fresh profile and a seeded one
- [x] A profile missing later fields seeded and reloaded — data survives
- [x] Both themes, including the warning colours on an over-threshold course
- [x] Empty state, one course, and a four-course fixture with a Saturday lab
- [x] No `alert()` or `confirm()` — asserted against the source, not just the UI
- [x] Stale-calendar banner fires when the build's semester has ended
- [x] Backup restores round-trip, every logged session intact
- [x] Nothing personal in the deploy folder — it holds no timetable at all

---

## Out of scope

- **CSV export.** You chose reconcile instead, and reconcile answers the same
  question inside the app.
- **Separate LEC / TUT / PRAC thresholds.** Total hours are all that matters, so
  all components pool into one course-level figure. 353 of 1068 meetings are TUT
  or PRAC, so this is a real simplification, not a vacuous one — it becomes wrong
  the day a lab enforces its own bar.
- **Multi-semester history.** A profile from a previous term is archived under
  `atten.archive.<semester>` and never mixed, but there is no UI to browse it.
- **PDF parsing of the academic calendar.** No tooling on this machine, no sample
  to write a parser against, and it would need hand-correction anyway.
- **Manual course entry.** Bob is the only way a timetable gets in. If a user
  can't or won't use Bob, they can't use this.
- **Notifications and reminders.** Nothing here needs to interrupt you.
- **Fixing Bob's `alert()` / `confirm()` importer** (A8). Pre-existing, and
  yours to schedule.

---

## What I still don't have

Your Monsoon 2026 term start, term end, holiday list and half-semester boundary.
Nothing on disk holds them. B3's editor is how they get in, so this blocks
shipping, not building — the app will run against a fixture calendar until you
author the real one.
