# MISMO Media Changes

Newest first. One line per change people would notice, plus anything that changes how data is saved.

## 2026-11-21: Jonna and Vanessa can approve and clear MISMO Matters LinkedIn posts

Approve, Don't Post and Bring It Back on the MISMO Matters LinkedIn posts work for Amy, Jonna and Vanessa (each under their own name). A new Mark Posted button and a Link to the Live Post field clear a post once it's up, approved first or not; saving a post with its live link marks it Posted. A live LinkedIn address typed into Link in the Post moves to Link to the Live Post, and the post keeps the link it points to. The card counts posted ones separately.

## 2026-11-21: website traffic shows today so far

The Web traffic workflow runs every 3 hours instead of once a night, and each run also brings today's numbers so far. Results shows today as a lighter bar with a Today So Far figure (as of the last pull); whole days still run midnight to midnight Eastern, and the daily average and busiest day count whole days only.

## 2026-11-21: sponsor benefits feed for the Sponsorship Portal

LinkedIn posts of kind Sponsor Highlight, the Summits sponsor thank-you post and Mic'd Up episodes have a Sponsor picker (the portal's approved summit sponsors) and a Counts For choice (one summit, or every summit of the sponsorship). MISMO Media works out data/feed-sponsor-benefits.json from them and saves it whenever it changes: benefit linkedin (posted once the post is marked Posted / Sent, with the date and the live link) and benefit micdup (invited, recorded, posted). The Sponsorship Portal reads it to tick those two benefits; contract in the Connections Map row MISMO Media to Sponsorship Portal. System Health has a Sponsor Benefits Feed row.

## 2026-11-21: Results cards fill their columns

The Results cards were held to 380px wide by a rule in the sign-in gate that happened to share their name, which left wide gaps on bigger screens. They now fill their columns with a 16px gap.

## 2026-11-21: Results as cards, the detail in the right-hand panel

Results is no longer one long scroll. Each channel (MISMO Matters, Mailchimp, the website, LinkedIn, Mic'd Up, what visitors told us, the lists, downloads, and bringing the numbers in) is a summary card; pressing one opens its full detail in the right-hand panel, with Previous and Next to move between channels. LinkedIn's export brings in single posts from its All Posts sheet again, and the page's daily totals (the export's other sheet) are kept as daily totals, shown as a chart, instead of being counted as posts. Who Is on Our Lists says where the website sign-ups come from (the old site's list, May 1 to Sept 8, and the new form since Nov 19) and goes straight to them on Subscribers.

## 2026-11-20: the monthly numbers line names its month; website days on Eastern time

The line at the top of Results now says which month's numbers it covers and when the next set is due ("October 2026 monthly numbers are all in ... November's are due Dec 1"), since in November it shows October's. Website visits and page views now count midnight to midnight Eastern time, the same days as everything else in MISMO Media.

## 2026-11-20: website traffic, AI answer feedback and website problems on Results

Results has a new Website section with www.mismo.org's visit counts from Cloudflare Web Analytics, pulled every night by the Web traffic workflow in marketing-hq-data: visits and page views each day, top pages, where visitors come from, devices and countries, with a 7, 30 or 90 day or since-Nov-20 choice. Counting started Nov 20, 2026; Higher Logic's Site Traffic report stays the source before that. Beside the downloads are two new cards: AI Answer Feedback ("Not helpful" comments on Mimi and Ask MISMO answers) and Website Problems (reports from a page or through Mimi, with the count of spam dropped). The band has a Website Visits tile, and System Health has a Cloudflare Web Analytics row that shows a failed or stale nightly pull and warns a month before the token ends on Nov 20, 2027. Test: dev/tests/webtraffic.js.

## 2026-11-20: picture thumbnails saved one at a time

Opening a big picture grid used to send dozens of thumbnail saves into the same SharePoint folder at once, and SharePoint refused most of them (45 failed runs of the Marketing HQ Images flow in one minute). Small copies are now saved one at a time, a moment apart, and if SharePoint refuses one, no more are tried for 15 minutes. Pictures still show full size until their small copy is made. Test: dev/tests/thumbs.js.

## 2026-11-20 (jump links in the website frame)
- In the website's frame, the "In This Issue" jump links now ask mismo.org to scroll to that section (message mm-matters-scroll). November's web edition has it too.

## 2026-11-20 (web editions in the website frame)
- MISMO Matters web editions now work inside the frame on mismo.org/about-mismo/mismo-matters: links open in a new tab, the jump links inside the newsletter stay on the page, and the page tells the website its height so it shows at full length. November's web edition was updated the same way.

## 2026-11-20 (Results rebuilt)
- Results leads with the numbers. The month's checklist folds to one line once everything is in, and Bring In the Numbers moves to the very bottom.
- MISMO Matters shows everything Higher Logic gives: open, click and click-to-open rates, delivered, unsubscribes (Higher Logic and MISMO's page), total opens, forwards, the send-to-click funnel, each wave side by side, who it reached (hard bounces, blocked, soft bounces), the most-clicked links, where people opened it, and every edition.
- Mailchimp shows every 2026 send: totals, a chart of each send's open rate (resends to non-openers marked), results by topic, the most-clicked links and a table of every send. 66 sends were brought in from Mailchimp's reports.
- The tile that said Subscribers is now Website Sign-Ups (people who joined through the form on mismo.org), and a Who Is on Our Lists card shows the MISMO Matters list beside it.
- Update Stats on MISMO Matters takes the extra numbers (waves, bounces, where people opened it, forwards); they're optional.

## 2026-11-20
- LinkedIn graphics from MISMO Matters now carry company logos: a post about one company (Sponsor Highlight, Member Highlight, Certifications, Implementation Success) shows that company's logo under the picture, and Thank You to Our Sponsors shows every sponsor's logo. Logos come from the Image Library.

## 2026-11-19 (later still)
- LinkedIn: post thumbnails stay square in a narrow window instead of shrinking to slivers.

## 2026-11-19 (late night)
- LinkedIn: the MISMO Matters as LinkedIn Posts card folds up. Click its title to close or open it; MISMO Media remembers your choice in your browser.
- The post panel now says why Approve and Don't Post are greyed out for anyone but Amy.

## 2026-11-19 (night)
- LinkedIn posts from MISMO Matters are now a compact list like the other pages: one row per section with its graphic, the start of the post and its status. Click a row to see the graphic and the post in the panel on the right, edit it, and Approve it.
- Amy can mark a post Don't Post (shows as Not Posting; Bring It Back undoes it).
- The edition list starts with November 2026, and Make the Missing Posts only shows when a section has no post.

## 2026-11-19 (evening)
- LinkedIn posts from MISMO Matters: a photo or square logo now sits beside the headline, and a wide logo sits centered under it, so the graphics have no empty corners. New Redraw Graphic button makes a fresh graphic and keeps the words.

## 2026-11-19 (late afternoon)
- LinkedIn: MISMO Matters as LinkedIn Posts opens on the newest edition that has gone out (November now), with a picker for other sent editions.

## 2026-11-19 (afternoon)
- LinkedIn: MISMO Matters as LinkedIn Posts. One press makes a post for every section of the edition, each with its own 1080 x 1080 graphic (the section's header banner, headline and picture or key line, MISMO logo). Claude writes each post from the section's own words and links only. Posts start as Ready for Review with no date; only Amy can approve them; nothing posts by itself. Graphics are saved in the Image Library under LinkedIn.

## 2026-11-19
- Requests: when a request is saved as Done, the requester gets an email saying it's done, with the Note to the Requester and an It's Not Done Yet button that emails Jonna, Amy, Kelly and Vanessa. It goes only when "email the requester" is ticked (it is by default) and only to @mismo.org and @mba.org addresses, and only once.
- Requests: a press release request shows whether it's for a MISMO work product (the request form now asks); Perry is copied on the new-request alert for those.

## 2026-11-18 (late evening)
- Press Releases: Brittney Prophete's address (bprophete@mba.org) is built in for the MBA newsroom copy and shows on each release. MBA Newsroom Contact can still change it.
- Help: Press Releases now covers the page, each button, who can do what, and that nothing follows up by itself. Who Does What adds Perry, and Amy's and Vanessa's press release parts.

## 2026-11-18 (evening)
- New Press Releases tab. Each MMS announcement (release, call for participation, comment period) starts a release with a first draft in Perry's house style, matched to the work-product catalog. Gaps are left in [BRACKETS]; nothing is made up.
- Every name and company is checked against the MMS leaders list (Brian Vieaux's spelling too), with American spelling checks.
- Perry picks who to quote from 2 or 3 suggestions; Amy approves the source by email reply; Perry sends the quote request as himself (pwilliams@mismo.org, Amy copied) through the "MISMO Media - Send As Perry" flow, which checks that the sign-in is Perry's. Follow-up reminder after 3 business days.
- A quote goes in only with the person's written approval, kept with the release. Perry gives final approval, then sends the MISMO Connect post to Vanessa, a copy to MBA, and offers it to MISMO Matters and LinkedIn. Nothing sends without a person clicking Send.
- System Health shows the MMS Announcements Feed. The page safety list now allows the www.mismo.org uploader frame.

## 2026-11-18 (afternoon)
- MISMO Matters: Copy Link is off at the foot of every section, in the email and the web version, for now. Back to Top stays. It comes back by setting MM_COPY_LINK to true.

## 2026-11-18
- MISMO Matters web version: each edition's web page (where Copy Link points) now tells search engines not to list it. Anyone with the link can still open it.

## 2026-11-17 (night)
- MISMO Matters email: links in the table of contents, Copy Link and Back to Top keep their color and no-underline setting on the link itself, so email apps that drop the head styles no longer underline them. The footer street address no longer turns into an underlined map link on phones.
- Pictures for Higher Logic: the uploader now uses the new website (www.mismo.org/mismo-media-uploader), where Higher Logic sign-ins live since the move on Nov 16. The certification list reader follows the new page addresses too.

## 2026-11-17 (evening)
- MISMO Matters: Copy HTML now gives the whole email as a full page, trimmed so Gmail does not clip it (the font and the most repeated styles become short class names in the head; it looks the same). Replace everything in the Informz HTML tab with it.

## 2026-11-17 (later)
- MISMO Matters: the footer logo links to www.mismo.org now that the new website is live. The November edition's links were moved to the new website's addresses.

## 2026-11-17
- Requests: the request form takes pictures and thumbnails by drag and drop (saved in Q Drive > MISMO > Active Documents > Marketing > MISMO Media Requests), and a Video or YouTube request asks for the Video Title, Description and Playlist (with Other for a new one). The request pane shows them, and Add to the Schedule carries them over.
- Requests: a new request emails Jonna, Amy, Kelly and Vanessa, and sends the requester a branded thank-you (MISMO and MBA addresses). The monthly New Member Announcement made from Member 360 is marked Automatic · Member 360 and starts in New.

## 2026-11-13 (night)
- MISMO Matters: every section's button now has its own Button Text (blank means Learn More) and a Show It As choice: A Button, A Text Link, or Nothing. The Vieaux Point and Workgroup Highlights website button can have its own words too, or be left out.
- Mic'd Up: MISMO's LinkedIn post is now Brian's own LinkedIn post retold from MISMO's side (same guest, same topics, third person); the transcript only fills in detail. It isn't written until his post's words are pasted in. The guest named in Brian's Drive folder always counts, even when the transcript misspells the name. Season 2 Episode 2's wording was redone from Brian's post with Rich Swerbinsky.

## 2026-11-13 (late)
- Mic'd Up: nothing goes to Amy by itself any more. Autopilot still writes the kit, but the LinkedIn Live wording is sent only when someone presses Send to Amy for Approval (Jonna's rule after an automatic send went out with wording nobody had checked). Amy's reply to wording that was taken back or re-sent since is ignored. Season 2 Episode 2's wording was taken back to draft.

## 2026-11-13 (evening)
- Mic'd Up Writer: the guest named in Brian's folder ("Season 2 Ep 2 Rich Swerbinsky") is used, and an episode is called solo only if the transcript clearly has Brian alone (an unmatched old plan no longer makes it "solo").
- Saving from an out-of-date tab: Brian's post and a corrected transcript no longer say "saved" when the save was refused; the "refresh to keep saving" message stays the last word.

## 2026-11-13 (late afternoon)
- MISMO Matters Certifications: the section's lead picture and quote now show in the email, after the highlighted company's text (they were left out). Replacing or removing a lead picture also replaces its Higher Logic link, so an old picture can't linger. New test for it.

## 2026-11-13 (afternoon)
- Mic'd Up YouTube Kit: Upload a Corrected Transcript (.txt, .srt or .vtt). It's saved with the Mic'd Up files and used from then on, even after Pull Again; the earlier one stays listed (txHistory). New test for it.
- Brian's LinkedIn post: pasting only the link now saves the link and says plainly that the words have to be pasted too (LinkedIn doesn't let other sites read a post), instead of a brief message that was easy to miss. lnkd.in links accepted.
- Season 2 thumbnails ("Episode Thumbnail.png") are picked up; a picture in a MISMO Matters section centers on the full column below a headshot.

## 2026-11-13
- Mic'd Up: Brian's Drive folder links from the Teams chat are pulled in again for Season 2. Folder names that start with the season ("S2 Ep 02 - …", "Season 2 Ep 1 …") were not recognized, so the links sat unused; now they match the right season and episode. A link that can't be pulled in (not shared, no episode number) shows on System Health with the reason instead of being skipped silently.

## 2026-11-10 (late afternoon)
- Left menu numbers show only what's wrong: a red count of past-due items on each page (or orders at risk). Nothing shows for work that's just coming up or waiting.

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
