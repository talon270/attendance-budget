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
attendance** → Settings here → load the file. Then answer the one question
the Overview asks — how much of the past you actually have records for.

Deployment is GitHub Pages serving this repository's root — there is no build
step, no bundler and no generated directory, so what is in the repo is exactly
what is served. Any other static host works the same way: `npx wrangler pages
deploy .` puts it on Cloudflare with no changes.

## The tabs

| Tab | What it does |
|---|---|
| Overview | Opens on the next class, its course's percentage, and what skipping it costs. Under it, one compact row per course — attended with its bar, leave in classes then hours, missed so far, next class — each opening to that course's whole term. A rail carries term progress, the next seven days and the per-course bar |
| Log | **Check in**: the oldest unchecked week of held classes, one tap per class and "All attended" per day. **Fix one course**: every class of the term, newest first. **Paste the portal record**: the portal's attendance table, pasted as copied, overwrites logged marks, with cancelled and make-up classes proposed from its dates. With no timetable loaded the same paste box sits on the empty Overview and prints each class's percentage and leave, saving nothing. **Reconcile** against the official record as `84.4` or `27/32`. **Start counting from** |
| Leave | A live calendar from today to term end. Click class days to plan them off; every other day re-judges itself against the plan. Per-course leave before and after, **Breaks you can afford**, and one button that marks the plan as skipping |
| Week | The timetable as a grid. Click a class for Attended / Missed / Cancelled beside it. Add a make-up class from the form underneath |
| Settings | Import (as a diff), undo the last import, backup, restore, clear, download a profile that could not be read — and the semester calendar editor, folded away |

## Design

**Soft UI, with one rule for which way anything goes.** Every surface is the
colour of the ground it sits on, and depth comes from two shadows — a highlight
up-left, a shade down-right — rather than from borders. Raised means you act on
it: cards, buttons, the active tab, the chosen option in the segmented control.
Pressed means it holds a value: inputs, gauges, the tab track, the well the
hero's percentage sits in. A palette declares its ground and two shadow colours,
`--hi` and `--lo`, and all six shadow depths are derived from those, so a
palette cannot half-apply.

**Soft UI's known failure is contrast, so no edge that matters is only a
shadow.** A button whose one edge is a shadow the colour of the page is the
style's classic accessibility bug. Keyboard focus here is a solid 2px ring in
the text accent, never a glow. Every status keeps a coloured stripe, and banners
are tinted, bordered and striped on top of being sunk. Text contrast was measured
against the grounds, not assumed: body text runs **15.0–17.1:1**, the text
accent **8.1–15.7:1**, and the lowest pairing on any palette is **4.9:1** —
Porcelain's muted text, and the amber on both light palettes — above the 4.5:1
AA line.

**It costs height, and that is deliberate.** Rows sit 16px apart instead of 8,
because any closer and one row's shade lands on the next row's highlight and
both go muddy. The Courses tab with one course expanded runs 2028px at 1500
wide against 1966px before, and 3260px against 3076px on a phone.

**Four palettes, each a complete token set.** Two dark and two light, ported
from the Study Tracker's twenty-six. None is derived from another and none is a
filter over another — every one declares the same tokens, so switching reaches
every hairline, wash and shadow rather than the obvious parts.

| Palette | | Accent (fill) | Text accent | Safe | Ground |
|---|---|---|---|---|---|
| **Selene** | dark | `#CFD8DC` pale grey | `#DFE5E8` | `#DFE5E8` silver | near-black `#0D1317` |
| **Wraith** | dark | `#B2EBF2` pale spectral cyan | `#CCF2F6` | `#46C98F` green | near-black `#0D1317` |
| **Porcelain** | light | `#2563A8` blue | `#17457A` | `#2F6B45` green | cool grey `#E8EBEE` |
| **Ink** | light | `#3B3F8F` indigo | `#242766` | `#2F6B45` green | violet-white `#E9E9EE` |

**Two accents, split the way the Study Tracker splits them.** `--accent` is a
fill — the primary button, the hero's stripe. `--accent-ink` is the text accent —
links, the focus ring, card headings, the hero's kicker, today's column in the
Week grid. On a dark palette it is a step lighter than the fill and on a light
one a step darker, so it holds up as type on either: Porcelain's fill blue
`#2563A8` is 5.1:1 on its ground, its text blue `#17457A` is 8.1:1. What sits on
the fill is a third token, `--on-accent`.

**Selene and Wraith are the Study Tracker's, colour for colour — only the roles
move.** Nothing in either is invented. The Study Tracker's page ground,
`#050708`, leaves no room below it for a shade, and soft UI on it turns back
into flat. So its card surface, `#0D1317`, is the ground here; its page ground
becomes the recess that gauges and wells sink into; its `bg-deep`, `#020203`,
is the shade; and its raised surface, `#1E2022`, is the highlight. Text,
hairlines, both accents and all three status colours are its own. The two differ
in accent, muted text and the colour of safe, exactly as they do there.

**The four were picked by a rule, not by taste.** Green, amber and red are never
decoration here: they mean safe, close to the bar, and under it. An accent that
lands inside that band puts a verdict on your attendance into the focus ring and
the active tab. That rules out every warm palette the Study Tracker carries —
paper's amber sits on `--warn`, linen's rust and akira's red on `--bad`, meadow's
and nostromo's green on `--ok`. All four here are cool, and that is a consequence
of the rule rather than a preference. A red edge in the corner of your eye always
means the same thing.

**On Selene, safe is silver, and the only colour on the page is a warning.**
Selene's own `--good` is `#DFE5E8`, and it is used as-is rather than swapped for
a green. The cost is real: a safe course's percentage is the same colour as the
text accent — links, the focus ring, card headings — and 1.16:1 from body text,
so "you have leave" no longer looks different from "this is text". What still
separates the three states is that close and under keep their amber and red,
every row keeps its stripe, and the gauge still draws the distance to the bar.
Pick Wraith for the same dark ground with a green safe.

The choice is stamped onto `<html>` by an inline script in `<head>` before the
body parses, so a returning visitor gets their palette as the first paint rather
than a flash of the default. The status washes (`--ok-soft` and the rest) are
derived with `color-mix()` from the status colour and the recessed surface, so a
palette declares a colour and never its tints.

**JetBrains Mono, everywhere, self-hosted.** `local()` comes first in every
`@font-face`, so a machine that already has the Nerd Font installed downloads
nothing at all and gets the real patched build — the same face as your terminal.
Everywhere else, a subset falls back: **5KB per weight**, cut from the 2.5MB
originals down to the glyphs this app actually draws, four weights for 20KB
total. Never a CDN; the fonts are cached with the app shell so it opens in its
own face offline.

The shipped subsets carry **no Nerd icon glyphs**, deliberately. Nothing here
draws one, and shipping the patched build would mean redistributing Font
Awesome, Devicons, Octicons, Powerline and the rest for characters the app never
uses. On your own machine that distinction is invisible — `local()` wins and you
get the full Nerd Font.

Every measure is set in `ch` and every size stepped down from the proportional
type it replaced, because mono runs perceptibly wider at the same pixel size.

**Adaptive by layout, not by squeezing.** On a phone it is one stacked column
and the percentage drops below the course code. From 720px the hero splits in
two — the sentence on the left, the figure it is about on the right — and from
1080px the page itself becomes two columns with a sticky rail, so the controls
stop pushing the answer below the fold. The rail carries four real modules
rather than one and a canyon of empty background.

**Every percentage is drawn against its own bar, and the distance between them
is the answer.** One gauge component does this on the hero, on every course row
and on term progress: the fill is the percentage, the tick is the threshold.
Before it, the bar a course is judged against rendered as `bar 70%` in 0.75rem
grey at the bottom edge of the row — the one number the loudest number on the
page is measured against, set as the smallest thing on it. 57.1% against a 70%
bar and 100.0% against a 75% bar are now different pictures, not two figures to
subtract in your head.

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
statements of fact in a segmented control, and whichever is already true is the
pressed one. It used to be the *disabled* one, which greyed the only accurate
button on the row down to 45% opacity and made the truth look unavailable.

Next to the sentence sits the figure the sentence is arguing about — the
course's current percentage, its gauge, and its remaining leave. That was
missing: the hero's largest type was the course code, and the percentage the
whole card reasons about existed only in the list below the fold, so the answer
to "can I skip this" required a scroll.

**A row that looks clickable does something.** Every course row carried a
pointer cursor and a hover nudge from the first build and had no handler at
all. Clicking one now opens that course's whole term — every class already
held, newest first, then the next ten — so an absence from week one is two
clicks from the Overview rather than nine Previous clicks on the Week grid.
The toggle is a real button on the course code, so it is reachable by
keyboard and announced as expanded or collapsed.

**A mark is set, never cycled.** A class used to step attended → absent →
cancelled on each click. A second tap on an absence — a double-tap, or "did
that register?" — cancelled the class: the absence vanished, the class left
the denominator, and on a real ECO373 profile the leave went from 12.375h to
**13.125h**. Every place that logs a class now offers three explicit buttons,
pressing the state a class is already in does nothing, and every change raises
a bar at the foot of the screen with **Undo**. The undo stack is twenty deep and
lives in memory only; it does not survive a reload, and nothing says it does.

**Every past class counts as attended until something says otherwise, so the
app asks.** Imported on 19 October, a five-course plan credited **116 classes,
155.0h** as attended without a word, and every course read 100.0%. Now the
first screen says how many classes have been held and asks which is true: you
missed some (check them week by week), you have no records (count from today),
or you attended them all. After that, `reviewedThrough` records the last day
you checked, the Log tab carries a count of what has happened since, and the
Overview says in the same sentence as the figures that those classes are
counted on trust. The check-in goes oldest week first, because it moves one
date forward: saving a recent week while an older one sat unread would declare
the older one checked too.

**The leave planner prices whole days through the same arithmetic as
everything else, and never rounds in your favour.** A day you plan off marks
every class you would still have that day as missed in a what-if passed to
`stats()`, and every other day is re-judged against the plan: affordable,
tight (some course left with under one class of leave), or not — naming the
course it breaks and by how much. The yes/no reads the raw budget, not the
floored figure on screen. On the five-course fixture, skipping Thursday 29
October buys Thursday to Sunday off (30 and 31 October are university holidays)
for MAT230 1.5h, ECO373 1.5h and ENG449 1.0h. **Breaks you can afford** finds
those combinations itself: every window of up to 9 days in which each day is
either already off or a class day you would skip, at most 3 skipped, that
cannot be stretched by one more free day — kept only if it fits on top of the
plan so far, ranked by days off per day skipped. It is whole days only; one
skipped class is a mark on the Week grid. Nothing in a plan counts until you
mark it, and a planned day that passes is dropped with a banner, never turned
into an absence.

**An unreadable profile is set aside before anything can overwrite it.** It
used to be replaced by the first click that saved — a palette swatch was
enough — while the banner promised it "was not overwritten". The raw string
now goes to `atten.v1.unreadable-<timestamp>` the moment it fails to parse,
and Settings offers it as a download.

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
banner says so and does not go away. Log › Reconcile is how you close that gap.

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
typed would launder a typo into a budget you then trust. It takes the record
either as a percentage or as classes attended of held, `27/32`. The count form
is compared in classes against the registrar's own denominator; a percentage
can only be compared against this app's held hours, which leave out any weeks
before a count-from date, and the reply says so when one is set.

**The empty states are drawn, not decorated.** With no timetable, a lecture
hall of empty fold-up seats; with no leave planned, a key rack with every key
still on its hook. Both are [Hairline](https://lucasmarkes.com/lab/hairline)
figures — the package's kernel, inlined unchanged, with two figures drawn on
it that answer the pointer. They live only where the page has nothing else to
say: a drawing beside a percentage would compete with the one figure the page
is for. Their colours come from the active palette through the kernel's own
`--hairline-*` hooks, so all four palettes reach them.

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
| The arithmetic. 118 assertions, driven by real clicks | Unchecked classes. Counted as attended until checked, and the Overview says how many |
| The planner's verdicts. Every class day and every suggested break on a five-course fixture re-checked against `stats()`: none called affordable goes under a bar | Whole days. The planner never models skipping half a day |
| Explicit marks. A second tap on Missed leaves the leave unchanged; the old cycle gave back 0.75h | Ashoka's record format. Reconcile accepts both `84.4` and `27/32` because which one the portal shows is unconfirmed |

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
extras, per-course bars, reconcile figures. It carries an integer
`SCHEMA_VERSION`, migrated on read: **v6** added `reviewedThrough` and
`leavePlan`, both empty for an existing profile, so it gets the start-up
question once with "My log is up to date" as one answer; **v3** turned the old `theme` values into
palette ids, **v4** retired two of those ids and **v5** retired Cryotube for
Wraith. `PALETTE_WAS` maps every id the app has ever written straight onto what
currently replaces it — `dark` and `monolith` to Selene, `mariana` and
`cryotube` to Wraith, `light` to Porcelain — so a retired palette never silently
resets anyone to the default. `atten.undo` holds the profile from
before the last import. `atten.archive.<semester>` holds a displaced term, kept
and never mixed in. `atten.v1.unreadable-<timestamp>` holds a profile that
failed to parse, verbatim. Nothing else is written, and the `atten.` prefix exists
because Bob and this app share one `file://` origin.

Backup and restore round-trip the whole profile as JSON. Nothing is transmitted
anywhere; `sw.js` caches only same-origin files, and there is no CDN to cache.

**The service worker is network-first for the page and cache-first for the rest.**
That split is deliberate and was learned the hard way. The whole app is one HTML
file, so caching it first meant a returning visitor stayed pinned to whichever
version they happened to load first — deploying a fix changed nothing for the
people who already had the bug, and the only escape was clearing site data.
Bumping the cache name by hand on each deploy would have worked until the first
time it was forgotten. Now the page is fetched from the network with the cache
as the fallback, so it still opens on a plane, and the icon and manifest stay
cache-first because they are tiny and versionless.

**On activation it deletes only its own old caches.** Every app on
`talon270.github.io` shares one origin and so one CacheStorage. The first
version deleted every cache not named `atten-v2`, which wiped the other apps'
offline copies the first time this one updated; it now only touches names
starting `atten-`.
