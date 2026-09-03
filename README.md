# Attendance budget

Answers one question, on screen at load: **how much class can I still miss?**
It reads the timetable you already built in Bob the Builder, expands it against
a hardcoded semester calendar into dated sessions, prices each one in contact
hours, and reports the hours of leave you have left per course. Everything is
stored in your browser under one key. No account, no server, no network call.

There is no course data in this file. Bob's `Export for attendance` button is
the only way a timetable gets in, which is why this app can never disagree with
Bob about when a class meets.

Live at **https://talon270.github.io/attendance-budget/** — or clone it and
open `index.html` from your filesystem. Both work identically; the hosted copy
just also installs as an app and caches itself for offline use.

## How to run it

```
# open it, that's the whole setup
xdg-open index.html
```

Then: Bob the Builder → the plan you are actually enrolled in → **Export for
attendance** → the Data tab here → load the file.

Deployment is GitHub Pages serving this repository's root — there is no build
step, no bundler and no generated directory, so what is in the repo is exactly
what is served. Any other static host works the same way: `npx wrangler pages
deploy .` puts it on Cloudflare with no changes.

## The tabs

| Tab | What it does |
|---|---|
| Courses | Opens on the next class and what skipping it costs. Then every course, its percentage and its remaining leave. A rail carries term progress, the per-course bar, and **Start counting from** |
| Week | The timetable as a grid. Click a class to cycle it attended → absent → cancelled. Add a make-up class from the form underneath |
| Reconcile | Type what the official record says; the app reports the gap and lists sessions you could flip. It never flips one itself |
| Calendar | Author the semester — term dates, holidays, and the days that run another day's timetable — and copy the constant back into this file |
| Data | Import (as a diff), undo the last import, backup, restore, clear |

## Design

**Dark first.** The dark palette is defined on `:root` and light is derived
from it, because dark is the one that gets read at 8am in a corridor. Both are
complete; neither is a filter over the other.

**One accent, and colour that means something.** A muted blue is the only
decorative colour, and it appears only on interactive things — focus rings, the
active tab, the progress bar. Green, amber and red are never decoration: they
mean safe, close to the bar, and under it. Nothing else is allowed to borrow
them, so a red edge in the corner of your eye always means the same thing.

**A serif carries the numbers.** The percentages and the course code in the hero
are set in a system serif with tabular figures. A 2.4rem percentage in a UI sans
reads like an error dialog; in a serif it reads like a figure worth trusting.
Nothing is downloaded — no webfont, no CDN, because the app has to open with the
network off.

**Adaptive by layout, not by squeezing.** On a phone it is one stacked column
and the percentage drops below the course code. From 1080px it becomes two
columns with a sticky settings rail, so the controls stop pushing the answer
below the fold. The rail carries three real modules rather than one and a canyon
of empty background.

## The things most attendance trackers get wrong

**A tracker must never tell you that you have leave you do not have.** That is
the one failure this app is designed around, and every rounding decision breaks
the same way. A budget of 9.75 hours prints as **9.7h**, never 9.8h. A
percentage of 74.99% prints as **74.9%**, never 75.0%. A shortfall of 0.41h
prints as **0.5h short**, never 0.4h. Each of those roundings costs you a tenth
of an hour you would not have missed anyway; the opposite rounding costs you the
course.

**The session count is floored against the longest class still to come, not the
average one.** ECO354 meets Mon/Wed/Fri for 55 minutes, 39 sessions survive the
calendar, so the semester total is 39.0h. At a 75% bar you must attend 29.25h,
leaving 9.75h of budget. That displays as **9 classes, not 10** — missing ten
1.0h classes leaves 29.0h attended, which is 74.4% and a fail. The hours figure
is exact; the class-equivalent is the conservative reading of it.

**An import is a diff, never a replace.** Change a section in Bob, re-export,
and a naive importer silently drops the sessions whose keys no longer resolve —
taking months of logged absences with them. Here, loading a file writes nothing.
It shows you the courses added, the courses removed *and how many logged
sessions each one holds*, and the sections that moved *and how many logged
sessions no longer match*. You confirm, and the previous profile is kept under
one undo. Logged sessions are never pruned to match a new timetable: a session
whose id stops generating just stops counting, and counts again if the section
moves back.

**The page opens on the question you actually came with.** Not a dashboard —
the next class that has not finished yet, when it is, and what missing it costs:
*"Skipping it costs 2.0h. You would still have 18.0h of leave in ECO354."* The
three buttons under it are deliberately equal and unfilled. A blue call-to-action
reading "mark absent" is an app nudging you to skip a class; these are three
statements of fact, and whichever is already true is the disabled one.

**A future class you have already marked absent costs the budget now, not on
the day it passes.** This was a bug: the budget assumed you would attend every
remaining class, so pre-marking one absent changed nothing until the date rolled
by, and the app quietly told you that you had an hour of leave you had already
spent. The hour stays in the semester total — the class is still scheduled — but
it stops counting toward what you will have attended.

**You can start counting from the day you actually started keeping records.**
Term began on 17 August; if you only opened this app in September, the app has
no idea what you did in those first weeks — and it defaults every past class to
attended, which would be a guess dressed up as a record. Set **Start counting
from** on the Courses tab and everything before that date stops feeding every
figure: not what was held, not what you attended, not the semester total, not
the budget.

Two design decisions hang off it, both in the same direction. **Excluding those
weeks can only shrink your budget, never grow it** — dropping an hour that
defaults to attended costs the budget `h − threshold × h`, which is positive, so
the number always moves against you. And **the excluded classes still draw on
the Week grid**, greyed out and marked "not counted", because a class that
silently vanished from the timetable would be indistinguishable from one the
calendar never knew about. They are disabled rather than clickable: a control
that does nothing is worse than one that is visibly off.

What it cannot fix is that **the registrar still counts those weeks.** Your
percentage here will read higher than the official one, permanently, and a
banner says so and does not go away. Reconcile is how you close that gap.

**Cancelled is a third state, not an absence you forgive.** A cancelled class
leaves both sides of the fraction — it is removed from what was held, from the
semester total, and from any absence logged against it. Marking it absent-but-
excused would quietly shrink your denominator and inflate every later
percentage.

**The percentage is undefined before the first class, and says so.** It shows
"No classes held yet", not 100%. The budget, though, is arithmetic on the
calendar alone, so it is shown from day one.

**When a course can no longer be saved, it says that instead of showing a
budget.** If attending every remaining hour still leaves you under the bar, a
budget figure is a fiction. The line says the course cannot be recovered by
attendance alone.

**Reconcile reports; it never adjusts.** The official record is the authority
and this app is not, so it computes the gap, lists candidate sessions most
recent first — a forgotten log is far more common than a false absence — and
waits for your click. An app that silently edited itself to match a number you
typed would launder a typo into a budget you then trust.

**No `alert()`, no `confirm()`, anywhere.** Every refusal is an inline message
naming what went wrong. Loading a plain `bob-plan` export tells you it got
`bob-plan` and needs `bob-attendance`, and why: a plan export carries section
keys but no meeting times.

## What is solid and what is assumed

| Solid | Assumed |
|---|---|
| Contact hours. Verified against all 1068 meetings in the timetable data: nine distinct durations, `round(min/60*2)/2` maps every one unambiguously | Half-semester courses. 1066 of 1068 meetings are `Full semester` and none are tagged second-half, so that path is verified against a synthetic fixture only |
| The semester calendar. Transcribed from the university's published PDF and checked against its own teaching-day table — all 30 per-weekday counts, both half-totals, all 79 days | The 75% bar. It is the usual figure, editable per course where a syllabus sets its own |
| Saturday teaches. 28 meetings are scheduled on Saturdays; Sunday has none | Which courses meet on the 1 October buffer day. See below |
| The arithmetic. 118 assertions, driven by real clicks | |

## The semester calendar

`academic_calendar_monsoon_2026.pdf` in this repository is the source. The
`CALENDAR` constant at the top of `index.html` is a transcription of it, and the
harness checks that transcription against the PDF's own arithmetic: the
teaching-day table prints a count for every weekday of every month, a total per
month, and a total per half. That is thirty independent counts made by the
registrar, and this file reproduces all thirty — 13 in August, 26 in September,
16 in October, 23 in November, 1 in December; 39 in the first half, 40 in the
second, 79 in total, with no day left over.

Two readings of that PDF took judgement, and both are written into the constant
next to the dates they affect:

**Only the red days are off.** The PDF colour-codes university holidays in red
and *restricted* holidays in orange, and classes run on the orange ones. Raksha
Bandhan, Milad-un-nabi, Janmashtami, Vinayaka Chaturthi, Maha Ashtami, Karaka
Chaturthi and Bhai Duj are all teaching days. Reading the text alone would have
closed the university on seven days it is open, which understates every
denominator in the app. The published weekday counts confirm the colours: August
has two teaching Fridays, and the 28th — Raksha Bandhan — is one of them.

**The half-semester boundary is 1 October, not the 12 October the PDF labels
"2nd half begins".** The PDF also publishes 39 first-half and 40 second-half
teaching days, and the only split that produces both numbers puts the 1 October
buffer day in the second half. A first-half course therefore last meets on 30
September, which is exactly what that date's own label — "First Half Finishes" —
says. What the buffer day is *for* is not stated anywhere in the document; this
is the reading that agrees with the registrar's counts, not a confident claim
about which classes actually run that Thursday.

The last two teaching days run someone else's timetable: **30 November runs
Tuesday's schedule and 1 December runs Friday's.** A Monday-only course finishes
on 23 November and meets neither; a Friday-only course gets one last meeting in
December.

If any of this changes mid-term — a holiday declared late, an extra buffer day —
the Calendar tab is where you re-author it. Click days to cycle them, copy the
constant, paste it over the `CALENDAR` block. The editor writes to your
clipboard and never to storage, on purpose: a calendar saved in one browser
would leave every other copy of the app with the old one.

## Data and privacy

One key, `atten.v1`, holds the whole profile — courses, every logged session,
extras, per-course bars, reconcile figures. `atten.undo` holds the profile from
before the last import. `atten.archive.<semester>` holds a displaced term, kept
and never mixed in. Nothing else is written, and the `atten.` prefix exists
because Bob and this app share one `file://` origin.

Backup and restore round-trip the whole profile as JSON. Nothing is transmitted
anywhere; `sw.js` caches only same-origin files, and there is no CDN to cache.
