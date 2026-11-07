# MISMO Media Changes

Newest first. One line per change people would notice, plus anything that changes how data is saved.

## 2026-11-07
- Saving: view-only people and out-of-date tabs can't save, and every save records who made it. (Field-by-field saving, with a question when two people change the same field, arrived Nov 5.)
- Out-of-date tabs are noticed within 3 minutes (was 10) and pause saving until refreshed.
- Delete now puts things aside; Help > System Health lists them with Bring Back.
- New Help > System Health: version, saving status, background jobs and their last errors, date lists running out, Download All Data.
- Home: Waiting on Approval lists everything waiting on someone's OK and for how long.
- Background jobs run in one tab per browser, at most once a minute, pausing longer after each failure.
- Newsletter: every build carries a version on its first line and in Preview, to check against Informz.
- Newsletter: Copy Link beside Back to Top in every section; Vieaux Point button reads Continue Reading and picks up where the newsletter stops.
- Accessibility: darker secondary gray (5.1:1), the side panel holds and returns focus and closes with Escape, clickable rows open with Enter, saved and error messages are announced.
- Spreadsheet imports load SheetJS 0.20.3 only when needed, integrity-checked (was 0.18.5 on every page load).
- Higher Logic bridge accepts only PNG, JPEG, GIF and WebP pictures.
- Typed-in links are checked to be http(s), mailto or tel before they become links.
- Build, source and tests are in this repo (dev/), with a check on every change.

## 2026-11-05
- Saving only what changed: each save carries the record as it was when the change began, so a teammate's newer changes are kept; if both changed the same field, the person saving chooses. An open panel says when someone else saves or deletes the same record.
- New member logos from Member 360 go into the Image Library, the right MISMO Matters welcome section and the month's LinkedIn request; requests show attached logos.
