# Developing MISMO Media

MISMO Media is the Strategic Growth team's marketing hub at <https://resources.mismo.org/marketing-hq/>.
This page is for whoever changes its code. For how to *use* it, see Help inside MISMO Media.

## What is where

| Path | What it is |
| --- | --- |
| `index.html` | The live page. GitHub Pages publishes it as is. It is **built**, never hand-edited. |
| `dev/src/app*.js` | The code, in 23 files that are joined in a fixed order (see `ORDER` in `dev/build.py`). |
| `dev/src/head.html`, `dev/src/body.html` | Styles and page skeleton. |
| `dev/shim.html` | The door to the save relay: sign-in, loading, saving, conflict handling. |
| `dev/gate.html` | The shared resources.mismo.org sign-in gate (copied from Member 360). |
| `dev/logo.txt` | The MISMO logo symbol. |
| `dev/build.py` | Builds `dev/out/site.html` (the live page) and `dev/out/plain.html` (no sign-in, for tests). The live page carries a safety list (Content-Security-Policy, `CSP` in build.py) of the only sites it may load code from or send data to; add a new service there first. |
| `dev/tests/` | Browser tests and a stand-in for the save relay. They run on made-up records (`fixture.html`, made by `make-fixture.py`), or on MISMO's real sample (`marketing-hq-data/dev/sample-data.html` in the private repo) when that file is copied next to `run.sh`. |
| `hl-bridge/` | The script the Higher Logic website loads to upload pictures and read certified lists. |
| `mm-headers/` | Newsletter header images and icons. |

Records are **not** here. They live in the private repo `GitMISMO/marketing-hq-data`, reached only
through the relay after sign-in. Never put a token, a subscriber list or any record in this repo
(`.gitignore` and the checks block the usual mistakes).

## Making a change

1. Start from the latest `main`. Two people (or Claude sessions) may work on MISMO Media; always build on
   what is live now, never on an older copy.
2. Change `dev/src/` (and `dev/shim.html` if saving is involved).
3. `python3 dev/build.py` then `bash dev/tests/run.sh`. All five test sets must pass:
   every tab opens cleanly at desktop, dark and phone sizes; 24 interaction checks; the save checks;
   the Informz unsubscribe import; Remind Amy. The Check MISMO Media action runs the same tests on every push.
4. Copy `dev/out/site.html` over `index.html`, and commit **both** `dev/` and `index.html` together,
   with a line in `CHANGELOG.md`.
5. GitHub Pages publishes in about a minute. The **Check MISMO Media** action runs on every push; a red X
   means look before trusting that version. Its warning "index.html is not what dev/src builds" means
   someone edited the live page without the source; fix the source first.
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

- No secrets in this repo. The image flow's signed address is the one exception already here; it must
  be checked server-side (see the review) and rotated if it leaks further.
- Emails from MISMO Media go only to @mismo.org or @mba.org addresses.
- Teams chat text is never stored; only Drive folder links.
- Archive, never delete, for anything a person made.
