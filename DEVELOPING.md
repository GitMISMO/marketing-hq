# Developing MISMO Media

MISMO Media is the Strategic Growth team's marketing hub at <https://resources.mismo.org/media/> (this repository,
GitMISMO/media; it was GitMISMO/marketing-hq at resources.mismo.org/marketing-hq/ until Nov 22, 2026). The old address
still works: GitMISMO.github.io/marketing-hq/ sends old bookmarks here and keeps copies of the pictures, the Higher
Logic bridge and the web versions that sent emails and mismo.org already point to. The save relay's project key and
the data repository keep the old name (`marketing-hq`, `GitMISMO/marketing-hq-data`); nobody sees those.
This page is for whoever changes its code. For how to *use* it, see Help inside MISMO Media.

## What is where

| Path | What it is |
| --- | --- |
| `index.html` | The live page. The **publish** job in `.github/workflows/check.yml` builds it from `dev/` and commits it; GitHub Pages serves it. Never upload or hand-edit it. |
| `dev/src/app*.js` | The code, in 36 files that are joined in a fixed order (see `ORDER` in `dev/build.py`). |
| `dev/src/head.html`, `dev/src/body.html` | Styles and page skeleton. |
| `dev/shim.html` | The door to the save relay: sign-in, loading, saving, conflict handling. |
| `dev/gate.html` | The shared resources.mismo.org sign-in gate (copied from Member 360). |
| `dev/logo.txt` | The MISMO logo symbol. |
| `dev/build.py` | Builds `dev/out/site.html` (the live page) and `dev/out/plain.html` (no sign-in, for tests). The live page carries a safety list (Content-Security-Policy, `CSP` in build.py) of the only sites it may load code from or send data to; add a new service there first. |
| `dev/src/app31.js` | Industry Events graphics: reads Team HQ's events (read only, relay project `team-hq`, through `__hqTeamEvents` and `__hqTeamFile` in `dev/shim.html`) and keeps a SharePoint copy of each graphic in the Image Library (campaign `events`, record ids `imte-…`). Contract: Connections Map row "Team HQ (Industry Events) → MISMO Media (Image Library)". |
| `dev/src/app34.js` | Push to MyMISMO (CN-049, Nov 26, 2026): the button on each MISMO Matters edition that has gone out (Stats › This Edition, from `statsView` in app2.js) and each Mic'd Up episode on YouTube (YouTube Kit, Post on YouTube, app11.js), the box (title 80, message 300, preview, wording rules), and the System Health row. Sends only when a person presses Send to MyMISMO: POST `/mymismo/push/news` on the save relay (relay request 16) with the person's own sign-in; alertSenders only. Never call it on publish, on a schedule or on a timer. The result is saved on the record as `mymismo` {at, by, n, title, body, again}. Its Back layer is registered in app34.js. Contract: Connections Map row "MISMO Media (Push to MyMISMO) → MyMISMO". `dev/tests/mypush.js` checks it. |
| `dev/src/app35.js` | Summit Photos from MyMISMO (CN-057, Nov 27, 2026). Amy's picks arrive in `marketing-hq-data` as `incoming/summit-photos/<summit>/<batch>.json` with the JPEGs beside it (written by the save relay's MyMISMO route, not by us). The relay can't list a folder, so the **Summit Photos** workflow there (`.github/summit-photos.mjs`, checked by `.github/summit-photos.test.mjs`) lists every batch in the read-only collection `summitphotos` (`data/summitphotos.json`; only photos with consent and a JPEG that is there). MISMO Media never writes that collection. The Summits tab shows the batches for the chosen summit, newest first; the background job "Summit Photos" reads each JPEG through `window.__hqIncoming` in `dev/shim.html` (the relay's file route, `incoming/summit-photos/` JPEGs only), keeps a SharePoint copy (images `imsp-…`, campaign summit) and makes one draft summit post per batch (pieces `psp-…`, status review, owner Amy). Never post, send or email from it; a draft that was deleted is not made again. Contract: Connections Map row "MyMISMO (Summit Photos: Amy's picks) → MISMO Media". `dev/tests/sumphotos.js` checks it. |
| `dev/src/app36.js` | Tour mode (CN-059, Nov 27, 2026), the half the MMS's Work Request Journey (resources.mismo.org/mms/journey/) drives: `window.__mmTour` with `ready()`, `load({mem, me, today, view, open})`, `go(view)`, `open(id)`, plus `views`, `state()`, `sent()`, `blocked()`, `mem()`. The safe half is the tour branch near the top of `dev/shim.html` (right after `window.__hqMerge`): only when the page is `?tour=1`, in a frame, opened by a resources.mismo.org page that offers `window.parent.__tourSeed`. Then the relay is never touched: records live only in the tab (`mem` is `{collection: {id: record}}`), `fetch`/XHR/sendBeacon refuse everything except `/assets/`, our own `spell/` and `mm-headers/`, and the sign-in's own `/version` and `/auth/me`; an email to a flow or `__hqImages.notify` is kept (`sent()`, `window.parent.__tourMail`, event `mmtour:email`) and answered as sent; `Date` reads `window.parent.__tourClock` ({base, at}); storage stays in the tab; `TOUR` (app1.js) stops the background jobs (`runJob`), the job lock, the YouTube feed sync, the update check and the MMS feed check (`prLoadFeed` uses the practice releases' own `ann`). Copied from the MMS's `src/tour.js` and the top of `src/mms-door.js`. `dev/tests/tour.js` checks it. |
| `dev/src/app37.js` | MyMISMO, the MISMO team's area (CN-061, Nov 27, 2026; moved from Team HQ, which removes its copy in CN-062). The **MyMISMO** page (left menu under Events & Brand, `data-hq="mymismo"`, hidden by default) has Summit Alerts and Slides (app38.js, below) and Attendee Reports (GET/POST `/mymismo/staff/reports`: Close needs a note of what was done, Reopen keeps it) and MISMO Trivia (GET/POST `/mymismo/staff/trivia`: monthly winners, top 10s, finalists and standings, the championship window form). Results gets a **MyMISMO** card (`RS_SEC.mymismo`, added to `RS_ORDER` only while the route answers 200) from GET `/mymismo/staff/stats` (relay request 17, counts only) plus Trivia players by month. Every call uses the person's own sign-in (`ResourcesSession.token()`); each part shows only while its route answers 200 (403 for anyone not in MyMISMO's alertSenders, 404 until the relay part is live), so the reports and trivia parts hide unless their routes answer 200 (the menu item itself shows for anyone Summit Alerts and Slides show for). An open report is something needing action: red number on the menu item (`nb-mymismo`) and a line on the Schedule's band (`mymSay`, called from `renderOverview`). Read on open and every 5 minutes, never in tour mode (and not in the tour's `views`); nothing is stored in MISMO Media's records and nothing is emailed. Contract: Connections Map row "MyMISMO (save relay, relay requests 15 and 17) → MISMO Media". `dev/tests/mymismo.js` checks it. |
| `dev/src/app38.js` | MyMISMO Summit Alerts and Slides (CN-063, Nov 27, 2026; moved from Summit HQ, which takes its copy out in CN-065). Two more parts of the MyMISMO page (`MYM.sub` `alerts` and `slides`), shown to anyone signed in who can save (`myaOn`), which also shows the menu item. Summits and sessions come from the public website agenda `/summit-agenda/agenda.json` (`summits.<id>.grid.sessions`; those ids are MyMISMO's). **Summit Alerts:** title 80, message 300, optional session (agenda id), phone preview; **Send to Phones** asks once, then POSTs `/mymismo/push/send` `{summit, title, body, session}` with the person's own sign-in. It shows only to alertSenders (`MYA_SENDERS`, a copy of the mymismo entry's alertSenders, plus anyone the staff routes answer 200 for; the relay checks again) and only while GET `/mymismo/push/ready` answers 200. Never send on a timer or on its own. What was sent is the collection `mymismoalerts` (one record a summit, `{summit, list:[{id, title, body, session, sessionTitle, at, by, sent, failed}]}`). **Slides:** Add Slides on each session (PDF or PowerPoint, up to 25 MB), stored through `window.__hqFile` (`dev/shim.html`, which takes `feed-…` and `slide-…` names) in Summit HQ's chunked format: parts `data/slide-<id>--<ver>-<i>.json` `{s}` (the file's `data:` URL in 800,000-character pieces), then the head `data/slide-<id>.json` `{chunked:{ver, n}}`. The list is the collection `mymismoslides` (`{summit, sessions:{<agenda id>:[{id, name, type, size, file, parts, at, by, gone?}]}}`; × sets `gone` and keeps the file). After every change (and once a session on opening) `myaPublish()` rewrites `data/feed-mymismo-slides.json` as is: `{updated, summits:{<summit id>:{sessions:{<agenda session id>:[{name, type, size, file, parts}]}}}}`, files taken off left out, retried on a 409. Only the save relay reads it (the mymismo entry's `slidesFeed`, CN-064). Add fields later, never rename. Contract: Connections Map row "MISMO Media (MyMISMO: Summit Alerts and Slides) → MyMISMO". `dev/tests/myslides.js` checks it. |
| `dev/src/app24.js` | Press Releases. Reads the MMS announcements feed; the draft-ahead fields (pressRelease, draftNow, readyToPost, readyAt, stage, inComment; CN-010) decide which entries get a release, which are held after final approval and when one moves to Distribution. A release for a comment period (type comment, or a feed entry marked pressRelease false) is erased outright on each feed check, archived ones included, and never shown or started again; a Final or Candidate Recommendation draft still headed "Seeks Public Comment" is rewritten (CN-013). Contract: Connections Map row "MMS → MISMO Media". |
| `dev/tests/` | Browser tests and a stand-in for the save relay. They run on made-up records (`fixture.html`, made by `make-fixture.py`), or on MISMO's real sample (`marketing-hq-data/dev/sample-data.html` in the private repo) when that file is copied next to `run.sh`. |
| `hl-bridge/` | The script the Higher Logic website loads to upload pictures and read certified lists. |
| `mm-headers/` | Newsletter header images and icons. |

Work-product downloads for Member 360 (CN-017, Nov 23, 2026): `marketing-hq-data` keeps a read-only copy of
`data/wpdl.json` at `data/member-360/downloads.json` (test entries left out), made by `.github/member360-downloads.mjs`
there after each download is filed (Website sign-ups workflow) and every morning (workflow Member 360 downloads).
Member 360 reads it and never writes. Its field names are a contract: add fields, never rename. Contract: Connections
Map row "MISMO Media → Member 360 (website downloads)".

Records are **not** here. They live in the private repo `GitMISMO/marketing-hq-data`, reached only
through the relay after sign-in. Never put a token, a subscriber list or any record in this repo
(`.gitignore` and the checks block the usual mistakes).

## Making a change

1. Start from the latest `main`. Two people (or Claude sessions) may work on MISMO Media; always build on
   what is live now, never on an older copy.
2. Change `dev/src/` (and `dev/shim.html` if saving is involved).
3. `python3 dev/build.py` then `bash dev/tests/run.sh`. Every test set must pass: every tab opens cleanly
   at desktop, dark and phone sizes; the interaction checks; the save checks; and one test file per feature
   (all listed in `run.sh`).
4. Commit `dev/` and a line in `CHANGELOG.md`. **Do not touch `index.html`.**
5. Publishing is automatic (since Nov 21, 2026). On every push to `main`, the **Check MISMO Media** action
   checks the code (valid scripts, no tokens, code check) and runs the browser tests. Only if all of that
   passes does its **publish** job build `index.html` from `dev/` and commit it ("Publish MISMO Media (built
   from …)"). GitHub Pages serves it a minute or two later. A red X means nothing was published; the reason
   is in the step that failed.
   - Only the newest change publishes: if `main` moved on while a run was checking, the newer run publishes.
   - If someone hand-edited `index.html` since it was last built, the publish job stops rather than undo
     that edit. Bring the edit into `dev/src`, then run the workflow again (Actions > Check MISMO Media >
     Run workflow).
   - To republish without a code change, use Run workflow; it publishes only if `index.html` is out of date.
6. Open tabs notice the new version within 3 minutes, show "MISMO Media has been updated", and stop saving
   until refreshed, so an old tab can't save over new data.

The version (build time and code fingerprint) shows on **Help > System Health**.

## How saving works (short)

- Each collection is one JSON file in the data repo; every save is a commit.
- Each save carries the record as it was when the change began (when its panel opened, or the newest
  copy). Only what differs from that is written onto the newest copy, again after any 409, so different
  fields never undo each other. If two people changed the same field, the person saving chooses.
- Out-of-date tabs and view-only people can't save; every save records who made it (`updatedBy`).
- Delete puts a record aside (`_deletedAt`); Help > System Health lists and restores them.
- Background jobs (episode files, sponsor logos, certified lists) run in one tab per browser, at most
  once a minute, with a growing pause after failures.

## Rules that are not optional

- Browser tab icon (CN-030, Nov 25, 2026): every page this repo serves or builds (the `top` in `dev/build.py`, `buildWebPage` in `dev/src/app2.js`, the web editions under `matters/`, `mm-headers/source.html`) has exactly one icon line, `<link rel="icon" type="image/png" sizes="48x48" href="https://resources.mismo.org/assets/favicon-48x48.png">`, and no other. Never a copy of the image here. `dev/tests/tabicon.js` checks it.
- Browser Back button (CN-033, Nov 25, 2026): `dev/gate.html` loads the shared `<script src="/assets/back.js"></script>` right after the `session.js` line; never copy back.js here and never add our own `history.pushState` or change the address for it. Each left-menu page (`nav button[data-hq]`, which `show()` marks with aria-current; Help is one of them) is a Back step. Every right-hand panel, pop-up or drawer is registered with `MismoBack.layer({isOpen, close})` at the start of `dev/src/app3.js`, bottom layer first (today: the panel, System Health, the monthly reminder; the Push to MyMISMO box registers its own in app34.js); add any new one there. back.js may call close() several times in a row, so a close must never do more than one press of Close would (the panel's close only warns about unsaved changes). `dev/tests/backbtn.js` checks it against the live back.js (`MISMO_BACK=<file>` tries a local copy).
- Masthead (CN-053, Nov 26, 2026): Certification Management's, to the pixel, as `standards/mismo-brand.md` in mismo-connections gives it: `--hq-h:68px` (bar padding 13px 22px), logo box padding 9px 13px with 5px corners, logo 24px tall, 1px x 42px divider, name 16px/500 #94c8e9, `body{margin:0}` so the logo box sits at 22px, 13px. Anything that sits below the bar (rail, panel, Help's side list, the top notice bar, scroll-margin) is placed from `var(--hq-h)`, never a fixed number. No December hat here: the shared `/assets/holiday.js` (loaded by session.js) finds the logo by `data-mismo-logo`; don't bring back `.santa`, `#mismo-hat` or `data-season`.
- Tour mode (CN-059, Nov 27, 2026): anything new that reads, saves, sends, posts or emails must go through `window.claude`, `window.__hq*` or `fetch`, which the tour branch in `dev/shim.html` replaces; if it uses something else (a new door, a WebSocket, a form post), give it a tour answer there too and add it to `dev/tests/tour.js`. A new background job goes through `runJob` (which never runs in a tour).
- No secrets in this repo. The image flow's signed address is the one exception already here; it must
  be checked server-side (see the review) and rotated if it leaks further.
- Emails from MISMO Media go only to @mismo.org or @mba.org addresses.
- Teams chat text is never stored; only Drive folder links.
- Archive, never delete, for anything a person made. The one exception: comment-period press releases are erased (Jonna, CN-013, Nov 23, 2026).
