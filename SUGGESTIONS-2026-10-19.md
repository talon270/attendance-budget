# Attendance budget — suggestions

Written 2026-10-19, against `index.html` as it sits in the working tree
(102,469 bytes, 15 Sep 12:05, ahead of commit `b4a3730`).
Method: headless Chromium on `file://`, light and dark, at 390, 1440 and
1920 px, with a click-through. An unreadable-data probe: seed `atten.v1` with
truncated JSON, open, click through every tab and button except
delete/import/restore/export, then check whether the original string
survives anywhere in `localStorage`.

**Status: both implemented 2026-10-19, inside `PLAN-leave-and-logging.md`.**
A1 landed in its B0: `load()` copies the raw string to
`atten.v1.unreadable-<timestamp>` before anything can save, and Settings → Data
offers it as a download. A2 landed in its B6 as the one-line prefix filter
below. Both were run, not read: the corrupt-profile probe keeps the blob
verbatim after a palette click, and on a local server `vis-shell-3` and
`docket-v4` survive while the old `atten-v1` is purged. The original line is
kept below as written.

**Nothing below is implemented.** `PLAN-leave-and-logging.md` (written today,
04:14, by another session, awaiting your approval) owns `index.html` and
rewrites most of it. So this pass changed no code. Both new findings were
sent to that session to fold in (A1 into B0, A2 into B6).

That plan's A1–A6 (mid-term import credits every past class, the triple-tap
cycle erasing an absence, Reconcile's percentage-only input, and the rest)
are not repeated here.

## Part A — findings, ranked

### A1 · BUG (high): unreadable saved data is overwritten by an ordinary click

`load()` (about line 800) does `catch(e){ S = blank(); S.__corrupt = true; }`.
The banner it raises is honest: "It was not overwritten … or the unreadable
copy will be replaced the next time you click." But nothing is kept, so the
next `save()` replaces it. Navigation alone is enough.

| Check | Result |
|---|---|
| Original kept after load | yes (`atten.v1`) |
| Warning shown | yes, the text quoted above |
| Original kept after 17 navigation clicks | **no, gone from storage** |

**Fix (proposed, not applied):** inside that catch, copy the raw string to
`'atten.v1.unreadable-' + Date.now()` before anything can save. Then point
the banner at that key instead of warning about the next click. That is two
lines plus the banner text. `vis`, `Mandarin` and now `Study` and `Ledger` do
exactly this. It belongs in the plan's B0 (schema v6 + migration), so it
lands in the same change.

### A2 · BUG (high): the service worker deletes every other app's offline cache

`sw.js:30` deletes every cache that isn't `atten-v2`. Every GitHub Pages app
here (`vis`, `study-tracker`, `docket`, `attendance-budget`, `epok`,
`inkstone`, `filin` and the rest) lives on `talon270.github.io`. They share
one origin, and so one CacheStorage. Each activation of this worker wipes
the others' offline copies.

Reproduced on one local origin with a `no-store` server, using Docket, whose
worker had the same filter. Open `vis` (cache `vis-shell-3`), then open the
other app. `vis-shell-3` is gone, and `vis` opened offline returns **504
"Offline, and this file was never cached."** With `inven` (which filters by
prefix) as the second app, `vis` still opens offline.

**Fix (proposed, not applied, sent to the plan's session for B6):**
`ks.filter(k => k.startsWith('atten-') && k !== CACHE)`. That is one line,
and it still purges atten's own old v1 caches. The same line was fixed in 10
other apps' workers in this pass.

## Out of scope

- Everything in `PLAN-leave-and-logging.md`: the review there is a day old
  and line-level. This pass did not duplicate it.
