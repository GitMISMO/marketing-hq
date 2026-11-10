# MISMO Media Changes

Newest first. One line per change people would notice, plus anything that changes how data is saved.

## 2026-11-10 (afternoon)
- Mic'd Up LinkedIn: pasting the LinkedIn post or event link once its Monday has come counts it as done, so it leaves Past Due (episode pane and the kit's Save Event Link both tick it). Short lnkd.in links are accepted. New test for it.

## 2026-11-10
- Work Product Downloads: everyone who fills in the website's Before You Download form and accepts the licence is filed automatically (sign-up workflow, form = work-product-download, data/wpdl.json) and listed on Lists & Unsubscribes with what they downloaded, a search and Copy as CSV. They count as downloaders under Subscribers; downloading never signs anyone up for MISMO Matters. System Health shows when the last download arrived. New test for it.

## 2026-11-09
- MISMO Matters looks right in the Outlook desktop app: buttons are real buttons (color and padding on a table cell; the Subscribe button lost its stray border), a small picture beside the text keeps a gap, section header pictures, the masthead and the footer logo and icons are no longer clipped, and boxes (quotes, sponsor walls, certified lists) keep their space above and below. Bulleted lists indent inside the column. Slightly shorter font lists keep the email nearer Gmail's 102 KB clipping limit.

## 2026-11-07 (evening)
- Thank You to Our Sponsors: a custom Series package from the Sponsorship Portal (record.custom, one line per summit) is thanked only at the summits it lists, at that summit's tier; a Spring & Fall package no longer shows in Winter. New test for it.
- MISMO Matters: Copy HTML lists any running section Amy hasn't approved yet and asks before copying (fine for a test; the real send waits for her OK).
- Remind Amy: Home's On Your Plate shows how many items are waiting on Amy, with a Remind Amy button. One email lists them all (Mic'd Up wording keeps its Approve and Request Changes reply buttons; sections and posts link to MISMO Media), records who reminded her and when (settings/amy-remind), and asks before a second reminder within four hours.
- A safety list on the page (Content-Security-Policy): code and data may only go to the save relay, the image flow, Higher Logic's picture store, Google Fonts and the spreadsheet reader. Anything else is blocked and shows in System Health's error log.
- The full browser tests now run on every change, on made-up test records (dev/tests/fixture.html), with new tests for the Informz unsubscribe import and Remind Amy.

## 2026-11-07 (afternoon)
- Unsubscribes: Bring In Informz Unsubscribes loads Informz's unsubscribe report (Contacts › Reports › Unsubscribes) for people who used the Gmail or Outlook unsubscribe button, which only reaches Informz. They're filed with the same ids as the unsubscribe page, marked already out of Higher Logic, and come off the subscriber list. New Send Checklist step for it.
- Mic'd Up: Spotify left out of the page header, the episode kit's go-live line and the Results tiles while it's on hold.
- MISMO Matters footer: the Unsubscribe link is marked as Informz's unsubscribe link (External Link to MISMO's own page, per Higher Logic support), so Informz accepts the email for sending and people still land on resources.mismo.org/forms/unsubscribe/.

## 2026-11-07 (midday)
- System Health moved to the bottom of the left menu, above Dark Mode, as in Summit HQ.
- Image Library thumbnails: grids and pickers show a small copy (up to 640 px, WebP). The first editor to see a big picture makes it, saves it to SharePoint and notes it on the picture (spThumb), so everyone after gets the small one. Full-size pictures are still used for downloads, the newsletter and Higher Logic.

## 2026-11-07 (late morning)
- Results feed: YouTube views and likes come in every morning (marketing-hq-data workflow "Results feed", data/feeds.json), so the YouTube line of the monthly checklist ticks itself. Help now says plainly where every number comes from and what automatic MISMO Matters numbers would need (an Informz API user).
- The team error log moved to its own file (healthlog/log) so the results feed owns data/feeds.json.
- In the News searches Google News and Bing News for MISMO every morning (marketing-hq-data workflow "In the News web search", data/newsweb.json). New stories show marked Found on the Web and go into the In the News section of the edition their date falls in; Remove hides one for good.
- In the News is shown a month at a time; once a month's MISMO Matters has gone out, that month folds into the Archive.
- System Health shows when the web search last ran.
- System Health rebuilt the way Summit HQ's works: a System Health button with a status dot in the top bar, a panel of checks (saving, storage, background jobs, sign-ups, In the News, dates, errors, version), a red bar across the top when something needs attention, a team error log (feeds/health-log), Check Again, Copy Report, Recently Deleted and Download All Data.
- Holidays and Key Dates moved to Help & How-To; the Settings item left the left nav.

## 2026-11-07 (morning)
- Settings in the left nav (Dates and System Health).
- Image Library: Archive Selected (and Bring Back) for ticked pictures.
- New Settings > Dates: holidays, summits and the new website's go-live day are edited there instead of in the code, with a warning before a list runs out.
- Settings > System Health shows how full each data file is and warns at 70%, well before a save could fail.
- The Mic'd Up countdown counts to 8:30 AM Eastern wherever the viewer is, and saved times show on the right local day.
- Help pages no longer mention Spotify or clip steps that are on hold, or a fixed November date; unused code removed.
- The check on every change now also runs a code check for common mistakes.

## 2026-11-07
- Saving: view-only people and out-of-date tabs can't save, and every save records who made it. (Field-by-field saving, with a question when two people change the same field, arrived Nov 5.)
- Out-of-date tabs are noticed within 3 minutes (was 10) and pause saving until refreshed.
- Delete now puts things aside; Help > System Health lists them with Bring Back.
- New Help > System Health: version, saving status, background jobs and their last errors, date lists running out, Download All Data.
- Home: newsletter sections and posts waiting on Amy's OK appear in her On Your Plate list, alongside the Mic'd Up wording.
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
