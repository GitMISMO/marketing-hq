
/* ================= the daily stats feed (Power Automate writes data/feeds.json) ================= */
function feed(k){ return S.feeds[k] || null; }
function ytId(u){ const m=String(u||"").match(/(?:v=|youtu\.be\/|shorts\/)([\w-]{6,})/); return m?m[1]:""; }
function ytStat(e,k){ if(+e[k]) return +e[k]; const f=feed("youtube"); const v=f&&f.videos&&f.videos[ytId(e.youtubeUrl)]; return v? (+v[k]||0) : 0; }
function epViews(e){ return ytStat(e,"views"); }
function edStats(ed){
  if(ed.stats && +ed.stats.recipients) return ed.stats;
  const f=feed("matters"); const m=f && (f.mailings||[]).find(x=>x.month===ed.month);
  return m ? {recipients:m.sent, delivered:m.delivered||m.sent, opens:m.opens, clicks:m.clicks, unsubs:m.unsubs, bounces:m.bounces, topLinks:(m.topLinks||[]).join("\n"), fromFeed:true} : (ed.stats||{});
}
function feedCampaigns(){ const f=feed("mailchimp"); return (f&&f.campaigns)||[]; }
function feedAge(k){ const f=feed(k); if(!f||!f.updated) return ""; const d=new Date(f.updated); return isNaN(d)?"":(MON[d.getMonth()]+" "+d.getDate()+", "+d.toLocaleTimeString([], {hour:"numeric",minute:"2-digit"})); }

/* ================= Help ================= */
const HELP = [
 {id:"start", t:"Start Here", g:"Basics", b:`
  <p class="lead">MISMO Media is Strategic Growth's one place for marketing and communications. Every MISMO Matters edition, Mic'd Up episode, LinkedIn post, YouTube upload, Mailchimp send and summit push lives here, on one schedule, so nothing gets missed and everyone can see what's happening.</p>
  <h3>Finding Your Way</h3>
  <ul>
   <li><b>The menu on the left</b> has a page for each channel. <b>Schedule</b> is the overview. The small number beside a page is what needs attention there (red means past due).</li>
   <li><b>Search</b> at the top of the menu finds sections, episodes, posts, articles and help topics. Press <kbd>Ctrl</kbd>+<kbd>K</kbd> (<kbd>⌘</kbd>+<kbd>K</kbd> on a Mac) from anywhere.</li>
   <li><b>Narrow the menu</b> with the arrow at its top, or press <kbd>\\</kbd>. Your choice is remembered.</li>
   <li><b>Dark Mode</b> is at the foot of the menu. It carries across every MISMO tool.</li>
  </ul>
  <h3>How Editing Works</h3>
  <ul>
   <li><b>Click any row</b> to open it in the panel on the right. Change what you need and press <b>Save</b>. Nothing in the panel saves until you do.</li>
   <li><b>Tick boxes</b> (setup items, summit tasks, the send checklist, milestones) save the moment you tick them, and untick to undo.</li>
   <li><b>Close</b> without saving and the panel asks once before throwing your changes away. <kbd>Esc</kbd> also closes it.</li>
   <li><b>Delete</b> always asks you to press it twice.</li>
   <li><b>Dates</b> can be typed the way you'd write them (11/18/26, Nov 18) or picked from the calendar button beside the box.</li>
  </ul>`},
 {id:"home", t:"Home: the Studio", g:"Basics", b:`
  <p><b>Home</b> is the first page. It shows everything MISMO is putting out, live, as a studio of screens. Click any screen to go there.</p>
  <ul>
   <li><b>The top band</b> says good morning, what's coming (the next Mic'd Up episode, the next MISMO Matters send, the next summit) and how many items are past due. <b>On Your Plate</b> lists what's yours in the next seven days, from your name on the schedule.</li>
   <li><b>The week</b> runs across the top of the studio, one day per box, with a colored bar for each thing due (the channel colors). Click a day for the full schedule.</li>
   <li><b>The screens:</b> Mic'd Up (on air, with a live countdown to Friday 8:30 AM ET and the episode's steps), MISMO Matters (a picture of the newsletter, colored by where each section stands), Summits (the countdown ring fills as marketing tasks are done), YouTube (what's waiting to upload), LinkedIn (the next post), Mailchimp (the next send), Requests, In the News, and <b>In MISMO Media</b>, the running totals.</li>
   <li><b>How It All Connects</b> (the switch next to the Studio heading) shows the same things as a map of how work flows from what comes in to what goes out, with Follow the Story for the next episode and edition. Your choice is remembered.</li>
  </ul>`},
 {id:"who", t:"Who Does What", g:"Basics", b:`
  <table class="t"><thead><tr><th>Person</th><th>What They Do Here</th></tr></thead><tbody>
   <tr><td><b>Kelly</b></td><td>Collects MISMO Matters content and drops each piece into its section as it arrives. Sends sections to Amy for review. Keeps the subscriber and downloader lists loaded. Owns most summit marketing tasks.</td></tr>
   <tr><td><b>Amy</b></td><td>Reviews and edits sections, then approves them or sends them back with notes. Gives final approval before a send. Runs Engagements &amp; Events (MISMO on the Move) and onsite summit moments.</td></tr>
   <tr><td><b>Vanessa</b></td><td>Builds each edition in Higher Logic from the HTML, runs the Mic'd Up YouTube upload and Monday LinkedIn post, logs In the News, and records stats.</td></tr>
   <tr><td><b>Jonna</b></td><td>Owns the system, the lists and unsubscribes, the Higher Logic setup and the automations.</td></tr>
   <tr><td><b>Brian</b></td><td>Writes the President's Vieaux Point and records Mic'd Up. Sends each guest the guest form, then drops the finished video, thumbnails and transcript into the episode's SharePoint folder. MISMO Media does the rest.</td></tr>
   <tr><td><b>Contributors</b></td><td>Facilitators (through Kathryn), sponsors and members send copy, quotes and headshots to Kelly. They don't need to log in.</td></tr>
  </tbody></table>`},
 {id:"schedule", t:"The Schedule", g:"Pages", b:`
  <p>The Schedule page is the overview of everything.</p>
  <ul>
   <li><b>The navy band</b> says what's next for MISMO Matters and how many items are past due. Click a box to jump to that page.</li>
   <li><b>The Next Four Weeks</b> shows one line per channel. Each marker is a day with something due; hover for what it is, click to open it. A filled marker is open, a check is done, a dashed outline is an open Mic'd Up slot, and a pulsing red marker is past due.</li>
   <li><b>Calendar</b> is the month view. Use the arrows to move months and Today to come back.</li>
   <li><b>Next Two Weeks</b> lists what's due by day, grouped into this week and next, with anything past due in red at the top. Each line shows its channel and who owns it; click a line to open it. Setup tasks aren't repeated here; they're under Getting Set Up.</li>
   <li><b>Getting Set Up</b> is the checklist for launching the system. The bar shows how much is done. Open items are grouped into Past Due, This Week and Coming Up; finished items are tucked under <b>Show finished</b>. Tick items off as they're done; <b>+ Add</b> puts a new one on it.</li>
  </ul>
  <p>Colors match everywhere: MISMO Matters blue, Mic'd Up orange, LinkedIn aqua, YouTube pink, Mailchimp gold, Summits green, Community Posts purple, Setup navy.</p>`},
 {id:"requests", t:"Requests and the Request Form", g:"Pages", b:`
  <p>Staff and facilitators send marketing and communications requests through one form. Every request lands on the <b>Requests</b> page, where the team reviews it and turns it into work.</p>
  <ul>
   <li><b>The form:</b> <a href="https://resources.mismo.org/forms/request/" target="_blank" rel="noopener">resources.mismo.org/forms/request/</a>. No sign-in is needed. Share the link with staff and facilitators, or press <b>Copy Form Link</b> on the Requests page. It asks who's asking, what they need (LinkedIn post, MISMO Matters item, email blast, community post, video, summit promotion, graphic, print, signage, swag, slides, website update, press release), the details, the needed-by date, the audience, any related event, and links to files.</li>
   <li><b>The board:</b> requests move from <b>New</b> to <b>In Review</b> (including <b>Need More Info</b>), then to <b>Approved &amp; In Progress</b>, and finally to <b>Done</b>. <b>Declined</b> ones are hidden until you press Show Declined. The menu shows how many are new, and the Schedule mentions them too.</li>
   <li><b>Reviewing:</b> click a card to see exactly what was asked. Set the status, owner, priority and your target date. <b>Team Notes</b> stay with the team. <b>Email the Requester</b> opens an email to them with your <b>Note to the Requester</b> filled in.</li>
   <li><b>Turning it into work:</b> <b>Add to the Schedule</b> starts the post, email or task in the right channel, filled in from the request. For print, signage and swag, <b>Create an Order</b> starts an order instead. Either way the request is marked Approved. The request then lists everything made from it, and that item shows on the Schedule.</li>
   <li><b>On the Schedule:</b> a request with a needed-by date shows on the calendar until something has been made from it.</li>
   <li><b>Requests that come up in conversation:</b> press <b>+ Add a Request</b> to log it yourself.</li>
   <li><b>Behind the scenes:</b> the form uses the same Power Automate flow and GitHub workflow as the Subscribe form. The workflow files each request in <code>data/inbox.json</code> (only the workflow writes there), and the team's review is kept in <code>data/requests.json</code>. If a Higher Logic step is ever added to that flow, give it a condition so it only runs when <code>form</code> is <code>mismo-matters-subscribe</code>; otherwise requesters would be added to the MISMO Matters list.</li>
  </ul>`},
 {id:"matters", t:"The Monthly MISMO Matters Run", g:"MISMO Matters", b:`
  <p>MISMO Matters goes out on the <b>third Wednesday</b> of each month through Higher Logic. Every date below is set for you when an edition is started, skipping weekends and MISMO holidays.</p>
  <p><b>Moving a send date</b> (a holiday, a launch, someone out): open the edition, press <b>Change Dates</b>, change <b>Sent</b> and press Save. The test send, final approval and stats move with it, and the content deadlines stay where they are. You can also change any single date by hand. If a date lands on a weekend or MISMO holiday, a note tells you which.</p>
  <div class="hflow">
   <div><span>2 weeks before</span><b>Content Due</b><small>Contributors send copy to Kelly</small></div>
   <div><span>Next day</span><b>Sections In</b><small>Kelly drops each piece into its section</small></div>
   <div><span>1 week before</span><b>Amy's Review</b><small>Section by section, approve or send back</small></div>
   <div><span>Next day</span><b>Built in Higher Logic</b><small>Vanessa pastes the HTML</small></div>
   <div><span>2 days before</span><b>Test Send</b><small>Kelly and Amy open the test</small></div>
   <div><span>Day before</span><b>Final Approval</b><small>Amy signs off</small></div>
   <div><span>Third Wednesday</span><b>Sent</b><small>To the MISMO Matters group</small></div>
   <div><span>A week later</span><b>Stats Recorded</b><small>Opens, clicks, top links</small></div>
  </div>
  <h3>Step by Step</h3>
  <ol>
   <li><b>Start the edition.</b> On MISMO Matters, press <b>Start the Next Edition</b>. It creates the next month with all thirteen sections, waiting for content.</li>
   <li><b>Drop content in as it arrives.</b> Click a section, paste the headline, body copy, quote and link, add the image, and press <b>Save</b>. There's no need to wait for everything.</li>
   <li><b>Send each section to Amy.</b> <b>Save &amp; Send to Amy</b> marks it "With Amy for Review" and it shows in her count.</li>
   <li><b>Amy reviews.</b> She edits right in the section, then presses <b>Approve</b>, or writes in <b>Amy's Notes</b> and presses <b>Request Changes</b> to send it back.</li>
   <li><b>Check the preview.</b> <b>Preview &amp; HTML</b> shows the email as readers will see it, on desktop or phone.</li>
   <li><b>Build it in Higher Logic.</b> Press <b>Copy HTML for Higher Logic</b> and paste it into the email's HTML block. <b>Copy Plain Text</b> is the text-only version.</li>
   <li><b>Work the Send Checklist</b> and tick each step: lists refreshed, unsubscribes removed, links tested, test send reviewed, and the rest.</li>
   <li><b>Mark the milestones.</b> Click a date in the strip under the band to mark it done (click again to undo).</li>
   <li><b>Record the stats</b> a week later under <b>Stats</b>, unless the daily feed is filling them in.</li>
  </ol>
  <p>The panel at the top shows the edition at a glance: the days to send, the next step, and a picture of the newsletter with one block per section, colored by where it stands. Click a block to open that section.</p>`},
 {id:"sections", t:"Working a Section", g:"MISMO Matters", b:`
  <h3>The Thirteen Sections</h3>
  <p>President's Vieaux Point, Summit Spotlight, MISMO Highlight, Workgroup Highlight, Sponsor Highlight, Implementation Success, MISMO Mic'd Up, Member Highlight, New Member Welcome, Education, Certifications, Engagement &amp; Events, and In the News. The names match the header graphics from the October edition.</p>
  <h3>Inside a Section</h3>
  <ul>
   <li><b>Headline, Body Copy, Quote, Quote Attribution, Link Text and Link</b> each have their own box. The Body Copy box works like Word: use the toolbar (or Ctrl+B, Ctrl+I, Ctrl+K) for <b>bold</b>, <i>italics</i> and links, and the list buttons for bullets or numbers. Typing “- ” at the start of a line starts bullets. Pasting from Word or Outlook keeps bold, links and bullets and drops the rest. To make a subheading in the email, put a short line on its own and make the whole line bold. To add pictures, put your cursor where the picture should go and press the picture button: upload one or pick from the Image Library. Add as many as you like. Each picture has arrows to move it up or down, a Half Width / Full Width switch, a Description (for screen readers) and Remove. Before the send, each picture needs its Higher Logic link pasted on it in the Image Library; until then the copied HTML shows a placeholder box and the preview marks it. Notes and Details boxes everywhere work the same way.</li>
   <li><b>Image.</b> Upload it here so it can be reused for LinkedIn and Mailchimp, or say where it is (the Q drive path). Once it's uploaded to Higher Logic, paste that link in <b>Image Link in Higher Logic</b> so the email shows it.</li>
   <li><b>Section Header Graphic</b> is filled in from the October edition. Leave it blank to keep it, or paste a new graphic's link.</li>
   <li><b>Collecting It, Comes From and Status</b> say who's chasing it, where it comes from and where it stands.</li>
   <li><b>Also Use It In</b>: tick LinkedIn, Mailchimp, Website, YouTube or Summit and the section shows up as ready to reuse on that page. The small boxes on each row show where it's going.</li>
  </ul>
  <h3>Arranging the Edition</h3>
  <ul>
   <li><b>Reorder</b> by dragging a row by its grip (the six dots).</li>
   <li><b>Leave a section out</b> this month by unticking its box. It stays in the list, greyed, for next time.</li>
   <li><b>+ One-Off Section</b> adds something special, like a Summit Sponsor Spotlight or a sponsor banner.</li>
   <li><b>MISMO Mic'd Up and In the News fill themselves</b> from those pages: every episode and article dated after the last edition and up to this send date. You only write the intro line.</li>
  </ul>`},
 {id:"preview", t:"Preview, HTML and the Send Checklist", g:"MISMO Matters", b:`
  <ul>
   <li>The preview only shows sections that are running and have content.</li>
   <li>Every section has its own link, an "In This Issue" list at the top jumps to each one, and every section has "Back to top," so readers can share one story.</li>
   <li><b>Copy HTML for Higher Logic</b> copies the whole email. Paste it into Higher Logic's HTML block. If copying is blocked, a box opens with the HTML selected so you can copy it yourself.</li>
   <li>Images that haven't been uploaded to Higher Logic show as a placeholder saying which image goes there.</li>
   <li>The header graphics currently load from the October edition's copies. Moving them into Higher Logic is on the setup list.</li>
   <li>The footer's Unsubscribe link goes to MISMO's own unsubscribe page (resources.mismo.org/forms/unsubscribe/). The footer keeps the logo, address and social links; the Privacy Policy and Terms of Use stay on the website.</li>
  </ul>`},
 {id:"micdup", t:"The Weekly Mic'd Up Run", g:"Channels", b:`
  <div class="hflow">
   <div><span>2–3 Weeks Ahead</span><b>Guest Form</b><small>The guest fills in bio, topics and questions</small></div>
   <div><span>1–2 Weeks Ahead</span><b>Recorded</b><small>Brian records with the guest in Riverside</small></div>
   <div><span>Same Day</span><b>Into SharePoint</b><small>Video, thumbnails and transcript in the episode folder</small></div>
   <div><span>Friday · 8:30 AM ET</span><b>Live</b><small>LinkedIn Live on Brian's profile</small></div>
   <div><span>Friday Afternoon</span><b>YouTube</b><small>Upload with the written description and proofed captions</small></div>
   <div><span>Monday · 1:00 PM ET</span><b>MISMO LinkedIn Live</b><small>Streamed from Riverside, once Amy approves the wording</small></div>
   <div><span>Following Weeks</span><b>Clips and MISMO Matters</b><small>Four clip posts; listed in the next edition</small></div>
  </div>
  <h3>Before Recording</h3>
  <ol>
   <li><b>Add the episode</b> on The Weekly Run (or open Friday's row): guest, company, guest email.</li>
   <li><b>Send the guest form.</b> In the episode, under <b>Guest and Run of Show</b>, press <b>Copy Guest Form Link</b> and send it to the guest. It asks for name pronunciation, title, bio, LinkedIn, topics, four questions they'd like, anything to avoid, and where to send their share kit. No sign-in. Answers show in the episode by themselves.</li>
   <li><b>Draft the Run of Show</b> from the guest's answers, edit it, then <b>Email the Run of Show to Brian</b>.</li>
  </ol>
  <h3>The SharePoint Folder</h3>
  <p>Each Season 2 episode gets its own folder by itself, in Q Drive › MISMO › Active Documents › Marketing › MISMO Mic'd Up › Season 2, named like <i>S2 Ep 01 - Xactus</i>. <b>Open the Folder</b> in the episode or the kit goes straight there. Brian drops in the final video, the thumbnails and the transcript (.txt). Every ten minutes MISMO Media checks folders that are still missing something and pulls the files in: the largest video is the episode, other videos are clips, pictures go to the Image Library, and the Recorded On date fills itself in.</p>
  <h3>Release Week</h3>
  <ol>
   <li><b>Friday afternoon:</b> work the YouTube Kit (below) and upload. Title: <i>MISMO Mic'd Up Season 2, Ep. N: Title</i>, the way the channel has always done it. Upload the proofed captions; never burn captions into the video.</li>
   <li><b>Monday:</b> MISMO's LinkedIn Live at 1:00 PM ET, once Amy approves.</li>
   <li><b>Clips:</b> on hold until Amy decides whether MISMO posts clips, so the clip steps are hidden for now.</li>
   <li><b>Guest share kit:</b> <b>Email the Guest</b> opens an email to the guest with the links and a ready-made post; send it, then press <b>Mark as Sent</b>.</li>
   <li><b>The website</b> and <b>MISMO Matters</b> list the episode by themselves once it's on YouTube.</li>
  </ol>
  <p>The checks on The Weekly Run are Recorded, Captions, YouTube, LinkedIn, Website and MISMO Matters. <b>Not Recorded Yet</b> counts episodes running in the next two weeks that haven't been recorded. A red outline means it's late. An empty Friday says "No episode yet" so a missing week is obvious.</p>
  <p><b>Fresh start:</b> Episodes 50 and earlier (everything before Friday, October 30) are history. They stay in the episode list, but they never count as late or missing anything. Everything from Episode 51 on is tracked.</p>`},
 {id:"kit", t:"The Mic'd Up YouTube Kit", g:"Channels", b:`
  <p>Everything Vanessa needs to post an episode is filled in for her. The writing follows MISMO's Mic'd Up house style, taken from the published episodes on YouTube, Spotify, Apple Podcasts and MISMO's and Brian's LinkedIn posts: the same voice and shape, with the guest's title and company always included, the search words up front, chapters, topic-matched hashtags, takeaways and a subscribe line added. It's on the <b>MISMO Mic'd Up</b> page, under <b>YouTube Kit</b>. Once Brian's files are in the SharePoint folder, the episode's card appears by itself; <b>Check the Folder</b> looks again right away.</p>
  <p><b>Autopilot:</b> as soon as the transcript lands in the folder, MISMO Media does two things by itself, once per episode: it runs <b>Write Everything</b> and emails the LinkedIn Live wording to Amy for approval. Clip posts are only planned when someone presses <b>Plan the Clip Posts</b>. So when Vanessa opens the kit, the copy is written and Amy's approval is already on its way. Anything can still be rewritten or changed by hand.</p>
  <ol>
   <li><b>Video:</b> <b>Download</b> the final video from SharePoint, or <b>Watch</b> it there.</li>
   <li><b>Thumbnail:</b> when there are two, press <b>Use This One</b> on the one to use, then <b>Download</b> it.</li>
   <li><b>Transcript:</b> <b>Check</b> lists misspelled names and MISMO terms (MISMO, Mic'd Up, Vieaux, eNote, eClose, eVault, SMART Doc, the guest's name and more). Untick anything that's right as it is, then <b>Download Corrected Transcript</b> and upload it to YouTube as the captions.</li>
   <li><b>Titles, Descriptions and Posts:</b> press <b>Write Everything</b>. In about 20 seconds, the "MISMO Media - Writer" prompt reads the transcript and the guest's answers and writes title options, the YouTube title and description, chapters, a longer description, Brian's promo post, the LinkedIn Live event name and description, the MISMO Matters blurb, a post for the guest and clip captions. Copy what you need. <b>Write Again</b> asks for a new version; <b>Draft Article</b> writes a 600–800 word viewpoint piece in Brian's voice.</li>
   <li><b>YouTube:</b> post it, then paste the link. The kit also notices it by itself once the channel lists it.</li>
   <li><b>MISMO LinkedIn Live, Monday 1:00 PM ET:</b> streamed from Riverside to MISMO's page. Press <b>Send to Amy for Approval</b>: Amy gets an email and just replies <b>Approved</b>, or replies with her edits. Her reply lands in the kit by itself. If she hasn't answered, <b>Resend to Amy</b> emails the same wording again. With edits, update the description and press <b>Edits Made: Ready to Set Up</b>. Once approved, the copy buttons and setup steps appear (cover image: the thumbnail from step 2). Paste the event link, and press <b>Mark as Streamed</b> after Monday.</li>
   <li><b>Clips:</b> on hold until Amy decides whether MISMO posts clips.</li>
   <li><b>Guest share kit:</b> copy the guest's post, <b>Email the Guest</b>, then <b>Mark as Sent</b>.</li>
  </ol>
  <p><b>Seasons:</b> Season 2 starts over at Episode 1 on November 6, 2026. YouTube titles read "MISMO Mic'd Up Season 2, Ep. 1: …" and MISMO's LinkedIn Live events "MISMO Mic'd Up S2 Ep. 1: …". Older Season 1 episodes that came through Google Drive keep their Drive buttons.</p>
  <p>Teams messages are never kept in MISMO Media.</p>`},
 {id:"linkedin", t:"LinkedIn", g:"Channels", b:`
  <ul>
   <li><b>The top panel</b> shows the next post the way it will look in the feed (Mic'd Up shows as a LIVE event card) and a strip of the next seven days with a dot for each post. Click the post to open it.</li>
   <li><b>Coming Up</b> lists every post in the next six weeks, including the Monday Mic'd Up LinkedIn Live events (they appear by themselves once an episode is added) and summit tasks going to LinkedIn.</li>
   <li><b>Ready to Reuse from MISMO Matters</b>: any section with LinkedIn ticked under "Also Use It In." <b>Make a Post</b> starts one with its headline and copy.</li>
   <li><b>News to Share</b>: articles from In the News not yet posted. <b>Make a Post</b> starts one with the link.</li>
   <li><b>Make a Post</b> starts a draft here in MISMO Media. It does not put anything on LinkedIn by itself.</li>
   <li><b>Stage it</b> to have it go up automatically: give it a date and a post time, tick "Stage it," and save. It shows as <b>Staged to Post</b>. Once the posting flow is running (see <b>Posting and Scheduling</b>), it posts on the MISMO page at that time and marks itself posted with its link.</li>
   <li>If you post it yourself, open it, set Status to <b>Posted / Sent</b>, paste the post's link and save. Impressions, clicks, reactions, comments and reposts can be typed in, or brought in from the LinkedIn export on Results.</li>
  </ul>`},
 {id:"posting", t:"Posting and Scheduling", g:"Channels", b:`
  <p>Everything starts as a draft in MISMO Media. Here's what can go out on its own and what's still done in the platform.</p>
  <table class="t"><thead><tr><th>Where</th><th>Can MISMO Media Post It?</th><th>How</th></tr></thead><tbody>
   <tr><td>LinkedIn, posts with a link</td><td>Yes, once the posting flow is set up</td><td>Stage the post with a date and time. A Power Automate flow checks every 15 minutes and posts it on the MISMO company page with "Post an article on company page," using the copy as the post text and the link as the article. The Monday Mic'd Up post links to YouTube, so it fits exactly.</td></tr>
   <tr><td>LinkedIn, image, video or document posts</td><td>No</td><td>Power Automate's LinkedIn connector only posts link posts. Schedule these in LinkedIn itself (the clock icon next to Post on the MISMO page), then set the post's Status to Approved and note the time.</td></tr>
   <tr><td>YouTube uploads</td><td>No</td><td>Power Automate can't upload to YouTube. Upload in YouTube Studio and set Visibility to <b>Schedule</b> for the time you want; it goes public by itself. MISMO Media marks it on YouTube once it's up.</td></tr>
   <tr><td>MISMO Matters</td><td>No</td><td>Built and scheduled in Higher Logic from the HTML.</td></tr>
   <tr><td>Mailchimp</td><td>No</td><td>Scheduled in Mailchimp.</td></tr>
  </tbody></table>
  <h3>How the Posting Flow Works</h3>
  <ol>
   <li>Every 15 minutes it reads the staged LinkedIn posts from marketing-hq-data (posts and the Mic'd Up Monday posts).</li>
   <li>Any whose date and time have arrived, and that haven't gone out, are posted on the MISMO page.</li>
   <li>It writes what it posted, with each post's link, to <code>data/posted.json</code>. Only the flow writes that file. MISMO Media reads it and marks each post as posted, the same way Member 360 reads what its email flow has sent.</li>
  </ol>
  <p>To stop a staged post, untick "Stage it" before its time.</p>`},
 {id:"youtube", t:"YouTube", g:"Channels", b:`
  <ul>
   <li><b>The top panel</b> shows the next upload in a player, with a bar and checklist for what's done (video, thumbnail, transcript, title and description, uploaded, website). The play button opens the YouTube Kit.</li>
   <li><b>Upload Queue</b>: episodes that have aired, or air this week, and aren't on YouTube yet.</li>
   <li><b>Captions to Fix</b>: episodes on YouTube without proofed captions.</li>
   <li><b>Every Upload</b> is the checklist: title format, Brian's description, captions, the Mic'd Up playlist, the website list and MISMO Matters.</li>
   <li><b>Other Videos</b> logs FRAME videos, the MISMO Initiatives series, webinar recordings and special content.</li>
  </ul>`},
 {id:"mailchimp", t:"Mailchimp", g:"Channels", b:`
  <p>Mailchimp is the stopgap while marketing email moves into Higher Logic. Log each campaign with its subject, audience (for example the compliance list or the tech list), send date and copy. Before any send, pull Mailchimp's latest unsubscribes into the one unsubscribe list. Results come from the Mailchimp export on Results, or the daily feed once it's set up.</p>`},
 {id:"summits", t:"Summits", g:"Events & Brand", b:`
  <ul>
   <li>Pick the summit at the top. The clock counts down to its first day, the ring shows how much of the marketing is done, and the timeline puts every task on one line: blue before, gold at the summit, pink after, green when done, red when past due. Click a dot to open that task.</li>
   <li><b>Load the Standard Summit Plan</b> lays out about 27 posts and emails before, during and after, dated from the summit's first day: save the date, registration open, early-bird reminders, agenda highlights, speaker spotlights, sponsor thank-yous, countdown, know-before-you-go, daily posts at the summit, award winners, the thank-you and survey, the recap and the MISMO Matters Summit Spotlight. Anything already past is skipped.</li>
   <li>Tick tasks off as they're done. Click one to change its date, owner, where it goes or its copy. <b>+ New Task</b> adds your own.</li>
   <li>Summit planning (the agenda, Run of Show, hotel) stays in Summit HQ. This page is only the marketing.</li>
  </ul>`},
 {id:"news", t:"In the News", g:"Library", b:`
  <ul>
   <li>Log each MISMO press release and each article that mentions MISMO with <b>+ Add an Article</b>: headline, outlet, date, link, and whether it's a press release or a mention.</li>
   <li>Each item lands in the In the News section of the edition its date falls in. <b>In the News</b> posts on MISMO's LinkedIn page land there too (any post with Kind of Post set to In the News and a link), unless the same story is already logged here.</li>
   <li>If an older item was missed, set <b>Goes in MISMO Matters</b> to the edition it should run in.</li>
   <li><b>Coverage emails come in by themselves.</b> When Brittney Prophete (MBA communications) sends an "FYI: <i>headline</i> - <i>outlet</i>" note about MISMO in the media, the "MISMO Media - In the News Emails" flow picks it up and adds the story here and to the In the News section of the edition its date falls in: headline, outlet, the article link, the date it ran, Brittney's note and what the story says about MISMO. These show as <b>Found Automatically</b>; check each one, tidy the headline if you like, then untick "Found automatically · needs a look." <b>Remove</b> hides one for good.</li>
   <li><b>MISMO LinkedIn posts labeled In the News</b> come in with the LinkedIn export on Results: any post whose text says "In the News" (or #InTheNews) is set to Kind of Post: In the News and lands in the same section, unless the story is already here.</li>
   <li>Outlets to check: HousingWire, National Mortgage News, Mortgage News Daily and Chrisman Commentary, Inside Mortgage Finance, Scotsman Guide, National Mortgage Professional, The Mortgage Point, Commercial Observer and MBA NewsLink.</li>
  </ul>`},
 {id:"results", t:"Results and Stats", g:"Pages", b:`
  <p>Results puts every channel's numbers side by side: MISMO Matters open rate, LinkedIn impressions, Mic'd Up views, Mailchimp open rate, subscribers, the most-watched episodes, the posts that reached the most people, and what people download most.</p>
  <h3>Bringing Numbers In by Hand</h3>
  <table class="t"><thead><tr><th>Platform</th><th>Where the Export Is</th><th>How It's Matched</th></tr></thead><tbody>
   <tr><td>YouTube</td><td>YouTube Studio › Analytics › Advanced mode › Content › Export</td><td>By the episode number in the title</td></tr>
   <tr><td>LinkedIn</td><td>MISMO page › Analytics › Content › Export (All Posts tab)</td><td>By the post's link, or its date and wording; unmatched posts are added</td></tr>
   <tr><td>Mailchimp</td><td>Campaigns › Reports › Export</td><td>By subject; unmatched campaigns are added</td></tr>
   <tr><td>MISMO Matters</td><td>Higher Logic's report for the mailing</td><td>Typed into Record Stats on the edition</td></tr>
  </tbody></table>
  <p>Once the daily feed is running (see <b>Daily Stats from Power Automate</b>), YouTube, MISMO Matters and Mailchimp numbers fill themselves in every morning and these exports are only needed for LinkedIn.</p>
  <h3>The Monthly Reminder</h3>
  <p>On the 1st of each month, the previous month's numbers come due. A checklist sits at the top of Results (LinkedIn's line also shows on the LinkedIn page), a pop-up appears on those pages until everything is in, Results shows a count in the menu, and the date is on the Schedule. Each line ticks itself off when its file is dropped in (or the MISMO Matters stats are typed in), and channels the daily feed already covers tick themselves off. <b>Mark Done</b> ticks one off by hand; <b>Remind Me Tomorrow</b> hides the pop-up for the day.</p>`},
 {id:"people", t:"Subscribers and Downloaders", g:"Audience", b:`
  <ul>
   <li><b>Look someone up</b> by typing any part of a name, email, organization or title. Pick a list to narrow it. Click a person for their details and everything they've downloaded.</li>
   <li><b>Load a List</b> takes an Excel or CSV export: the website subscriber export, the downloader export, a prospect list, the MISMO Matters group, or an unsubscribe list. Columns are matched by name. People already there are kept and updated; new people are added.</li>
   <li>The first lists loaded are Kelly's website subscribers (64) and downloaders (764) from May 1 to September 8, 2026. New subscribers from the website form are added on their own (see <b>The Subscribe Form</b>).</li>
   <li>This page holds names and email addresses. Share it only with the MISMO team.</li>
  </ul>`},
 {id:"subscribe", t:"The Subscribe Form", g:"Audience", b:`
  <p>The website's Subscribe button opens MISMO's own form at <a href="https://resources.mismo.org/forms/subscribe/" target="_blank" rel="noopener"><b>resources.mismo.org/forms/subscribe/</b></a>, in the website's look. It replaces the Smartsheet form, and the MISMO Matters footer now links to it too.</p>
  <p>To get there fast: <b>Subscribe Form</b> at the bottom of the left menu, or <b>Open Subscribe Form</b> and <b>Copy Form Link</b> on the Website Sign-Ups card under Subscribers.</p>
  <div class="hflow">
   <div><span>On the Website</span><b>Someone Subscribes</b><small>Name, work email, company, title and what interests them</small></div>
   <div><span>Seconds Later</span><b>Higher Logic</b><small>Added to the MISMO Matters list (by CSV until Higher Logic gives us an API user)</small></div>
   <div><span>Same Moment</span><b>MISMO Media</b><small>They appear under Website Sign-Ups on Subscribers</small></div>
  </div>
  <ul>
   <li><b>Website Sign-Ups</b> on the Subscribers page lists the newest first, with whether each person made it into Higher Logic.</li>
   <li>If Higher Logic refused someone, or the automatic step isn't on yet, <b>Copy for Higher Logic</b> copies those people as a CSV to import into the MISMO Matters list by hand.</li>
   <li>The interests people pick (AI and FRAME, eMortgage, Servicing and so on) are kept with each sign-up, ready for targeted sends later.</li>
   <li>Robots are turned away quietly: a hidden field and a speed check stop automated sign-ups without bothering real people.</li>
   <li>Leaving works the same way in reverse: see <b>The Unsubscribe Form</b>.</li>
  </ul>
  <h3>How It's Wired</h3>
  <ol>
   <li>The form sends each sign-up to the <b>MISMO Matters Sign-Ups</b> flow in Power Automate, the same kind of door the certification applications use.</li>
   <li>Once Higher Logic provides a marketing API user, a step goes here that adds the person to the MISMO Matters list automatically. Until then each sign-up arrives marked <b>Pending</b>, and <b>Copy for Higher Logic</b> gives you the CSV to import.</li>
   <li>It then fires a "signup" event at the private marketing-hq-data repository (GitHub's "Create a repository dispatch event" action, connected as Jonna, with the GitMISMO organization's approval for Power Automate). A small GitHub workflow in that repository files it in <code>data/signups.json</code>; no key or password is stored anywhere for this.</li>
   <li>MISMO Media reads that file and shows the sign-up.</li>
  </ol>`},
 {id:"branding", t:"The Rebranding Tracker", g:"Events & Brand", b:`
  <p>The running list of everything that carries MISMO's look, so nothing with the old branding gets missed. Open <b>Rebranding</b> in the left menu.</p>
  <ul>
   <li><b>Add anything branded:</b> marketing materials, documents and templates, slide decks, email templates and signatures, social profiles and video art, web pages and tools, signs, print and summit pieces. Press <b>+ Add Item</b>.</li>
   <li><b>Statuses:</b> <b>To Check</b> (found, not looked at yet), <b>Old Branding</b> (needs replacing), <b>In Progress</b>, <b>Rebranded</b> and <b>Retiring</b> (won't be redone, so it drops out of the percentage).</li>
   <li><b>The boxes at the top</b> show how far along the rebrand is. Press one to see just those items. <b>By Type</b> shows progress for each kind of item, and pressing a type narrows the list to it.</li>
   <li><b>Keep the links:</b> each item can hold where it lives, a link to the old version and a link to the rebranded one. That way the new website, the Image Library and Higher Logic all point at the current files.</li>
   <li>The menu shows how many items still have <b>Old Branding</b>. <b>Archive</b> takes an item off the list without losing it.</li>
  </ul>`},
 {id:"orders", t:"Orders: Pins, Swag and Banners", g:"Events & Brand", b:`
  <p>Anything physical that has to be ordered: pins, swag and giveaways, banners and signs, print, apparel and booth pieces. Open <b>Orders</b> in the left menu.</p>
  <ul>
   <li><b>New Order:</b> say what it is, the type, quantity, vendor and cost, and the <b>Order By</b> and <b>Needed By</b> dates. Move the status along as it goes: To Order, Getting Quotes, Ordered, Shipped, Received.</li>
   <li><b>For an event:</b> pick the summit, or Another Event and type its name and date. The order then shows on that summit's page under <b>Orders for This Summit</b>, and if no Needed By date is set, the event date is used.</li>
   <li><b>On the Schedule:</b> each order's Order By and Needed By dates show on the calendar and in the Orders swimlane, so a banner that has to ship before a summit isn't missed.</li>
   <li><b>Need Attention</b> counts orders that are past their order-by or needed-by date, or needed within two weeks. The menu shows the same count.</li>
   <li><b>Tied to the rebrand:</b> on a Rebranding item, <b>Order a Replacement</b> starts an order already linked to it. The item moves to In Progress, and the order is listed on it.</li>
  </ul>`},
 {id:"images", t:"The Image Library", g:"Library", b:`
  <p>One place for the pictures every campaign uses. Open <b>Image Library</b> in the left menu.</p>
  <ul>
   <li><b>Add pictures:</b> press <b>+ Add Images</b> (pick several at once) or drag them onto the page. JPG, PNG, GIF, SVG and WebP all work. The original file is kept, full size.</li>
   <li><b>Tag them:</b> press a picture to name it, choose its campaign (MISMO Matters, Mic'd Up, LinkedIn, Mailchimp, Summits and so on) and, for MISMO Matters, its edition. Add alt text so the picture still makes sense when an email blocks images.</li>
   <li><b>Download one:</b> <b>Download</b> on the card, or <b>Download Original</b> inside it, saves the full-size file.</li>
   <li><b>Download many:</b> tick the box on each picture you want and press <b>Download Selected (ZIP)</b>. With nothing ticked, <b>Download All (ZIP)</b> zips everything the filters are showing, for example every picture for the November MISMO Matters.</li>
   <li><b>In a MISMO Matters section:</b> <b>Upload Image</b> adds the picture to the section and to the library, tagged to that edition. <b>Pick from Image Library</b> reuses one that's already there.</li>
   <li><b>Nothing is deleted:</b> tick <b>Archived</b> to hide a picture you no longer need. <b>Show Archived</b> brings archived pictures back into view.</li>
  </ul>
  <h3>Pictures in the Email (Higher Logic)</h3>
  <ul>
   <li>The preview shows each section's picture so the team can review the whole email. A picture that isn't in Higher Logic yet has an orange "Preview only" note under it.</li>
   <li><b>Before sending, every picture goes into Higher Logic's image library.</b> An email can only show pictures stored somewhere public on the web. The Image Library is private to MISMO, so people receiving the email couldn't see pictures from it.</li>
   <li>The steps: download the picture (or the whole edition as a ZIP), upload it to the Higher Logic image library, copy its link, and paste that link into the picture's <b>Link in Higher Logic's Image Library</b> in the Image Library (every section that uses it picks it up) or straight into the section's <b>Image Link in Higher Logic</b>. Then <b>Copy HTML</b> and paste it into Higher Logic. If a link is still missing, Copy HTML tells you, and that picture shows as a placeholder box.</li>
  </ul>
  <h3>Where the Pictures Live</h3>
  <ul>
   <li><b>Claude version:</b> in the page's own private image store.</li>
   <li><b>resources.mismo.org version:</b> MISMO's SharePoint. New pictures are saved to Q Drive › MISMO › Active Documents › Marketing › Marketing HQ Images, in a folder for each month. <b>Add from SharePoint</b> lists pictures that are already in SharePoint (Branding - 2026, for example) without copying them. Only people signed in with access to MISMO Media can see or add them.</li>
  </ul>`},
 {id:"qr", t:"QR Codes", g:"Library", b:`
  <p>The QR Code Manager now opens inside MISMO Media: <b>QR Codes</b> in the left menu. The tabs across the top are its sections: <b>Overview</b>, <b>All Codes</b>, <b>New Code</b>, <b>Scan Activity</b> and <b>What Scanners See</b>.</p>
  <ul>
   <li><b>Make a code:</b> <b>New Code</b> asks what it's for, who it's for, where it's printed and where it should go, with start and end dates. Download the code as a picture for print, slides or signs.</li>
   <li><b>Change where it goes</b> any time by opening the code; nothing needs reprinting. Turn a code off, or let it expire, and scanners see a friendly page with who to contact.</li>
   <li><b>Scan Activity</b> counts scans by code, device and region.</li>
   <li>Printed codes point to resources.mismo.org/qr/, so the manager also still opens on its own there (<b>Open on Its Own</b>). Its records are the same either way.</li>
  </ul>`},
 {id:"unsubscribe", t:"The Unsubscribe Form", g:"Audience", b:`
  <p>Every MISMO Matters footer ends with an <b>Unsubscribe</b> link to MISMO's own page at <a href="https://resources.mismo.org/forms/unsubscribe/" target="_blank" rel="noopener"><b>resources.mismo.org/forms/unsubscribe/</b></a>, in the website's look. MISMO keeps the unsubscribe list here, alongside the subscribe list.</p>
  <p>To get there fast: <b>Unsubscribe Form</b> under Help &amp; Forms in the left menu, or <b>Open Unsubscribe Page</b> on the Unsubscribes card under Subscribers.</p>
  <div class="hflow">
   <div><span>From the Email</span><b>Someone Unsubscribes</b><small>Their email, and a reason if they want to give one</small></div>
   <div><span>Seconds Later</span><b>MISMO Media</b><small>Off the subscriber list and onto Unsubscribes, automatically</small></div>
   <div><span>Before the Next Send</span><b>Higher Logic</b><small>Opted out in Informz (by CSV until Higher Logic gives us an API user)</small></div>
  </div>
  <ul>
   <li><b>What they see:</b> one email box, optional reasons (too many emails, not relevant, changed jobs, didn't sign up, something else) and a confirmation. The page says one more edition may still arrive if it's already on its way, and that it stops MISMO Matters only, not other MISMO or MBA email.</li>
   <li><b>Taken off automatically:</b> the person comes off the subscriber list in MISMO Media straight away. Nothing is deleted; their sign-up stays on file marked unsubscribed. If they subscribe again later, they're back on.</li>
   <li><b>Unsubscribes</b> on the Subscribers page lists the newest first, with the reason and whether they've been opted out in Higher Logic yet. The <b>Unsubscribed</b> tile at the top counts them.</li>
   <li><b>Before each send</b> (the Send Checklist's "unsubscribes removed" step): press <b>Copy for Higher Logic</b> under Unsubscribes, import the list into Informz as unsubscribes, then press <b>Mark Removed in Higher Logic</b>.</li>
   <li>Robots are turned away quietly, the same way as on the subscribe form. Search engines don't list the page.</li>
  </ul>
  <h3>How It's Wired</h3>
  <ol>
   <li>The page sends each unsubscribe to the same <b>MISMO Matters Sign-Ups</b> flow as the subscribe form, marked as an unsubscribe.</li>
   <li>The flow fires the same "signup" event at the private marketing-hq-data repository. The GitHub workflow files it in <code>data/unsubs.json</code> and marks the person's sign-up in <code>data/signups.json</code> as unsubscribed.</li>
   <li>MISMO Media reads both files. The Mark Removed presses are kept in <code>data/unsubhl.json</code>.</li>
   <li>Once Higher Logic provides a marketing API user, a step can opt people out in Informz automatically too.</li>
  </ol>`},
 {id:"lists", t:"Lists and Unsubscribes", g:"Audience", b:`
  <ul>
   <li><b>The Compound</b> is the set of lists behind the MISMO Matters group: the MBA Annual/IMB/LIRC list, active community members, event attendees, associate contacts, ResTech, website subscribers and downloaders, plus the member contacts, VIPs and current Axios audience still to come. Ciara Durkan at MBA refreshes it quarterly; the next refresh is November.</li>
   <li>Counts only live here. No names are kept on this page.</li>
   <li><b>The unsubscribe rule:</b> one list across every platform. Anyone who unsubscribed in Mailchimp, Axios or Higher Logic is left off every MISMO send, and MISMO's sends stay separate from MBA's Aptify unsubscribes.</li>
   <li><b>MISMO's own unsubscribe page</b> is where the MISMO Matters footer sends people. See <b>The Unsubscribe Form</b>.</li>
  </ul>`},
 {id:"saving", t:"Saving, Access and Where Things Live", g:"Behind the Scenes", b:`
  <ul>
   <li><b>The page</b> lives at <b>resources.mismo.org/marketing-hq/</b>, behind the shared MISMO sign-in (the same one as Summit HQ and Member 360).</li>
   <li><b>The records</b> live in a private GitHub repository, GitMISMO/marketing-hq-data, and are read and saved through the resources.mismo.org relay. Every save is a real change with a record of who made it and when, so anything can be rolled back.</li>
   <li><b>Two people at once:</b> if someone saved the same part a moment before you, your change is laid on top of theirs and saved again, so nobody's work is lost. Other people's changes show up within about a minute.</li>
   <li><b>Access</b> is set per person in People &amp; Access: <b>Admin</b> and <b>Staff</b> can change anything; <b>View</b> can look but not save, and the page says so at the top.</li>
   <li><b>Preview:</b> while the page says "Preview," nothing saves and the team keeps working in the Claude version.</li>
   <li><b>If a save fails</b>, a red line at the bottom says why. "Not saved yet, trying again" means keep the tab open; nothing is lost.</li>
   <li>Uploading images and "Write the LinkedIn Post" work in the Claude version today and will come to resources.mismo.org when the relay supports them.</li>
  </ul>`},
 {id:"automation", t:"Daily Stats from Power Automate", g:"Behind the Scenes", b:`
  <p>Where each number comes from today (Nov 7, 2026). The daily ones are written into one file, <code>data/feeds.json</code> in marketing-hq-data, which MISMO Media reads to fill in Results, the edition stats and the episode views. Typed or imported numbers always win over the feed. The rest stay on the monthly checklist at the top of Results, and each line there ticks itself once its numbers arrive.</p>
  <table class="t"><thead><tr><th>Source</th><th>How It Comes In</th><th>What's Needed</th></tr></thead><tbody>
   <tr><td>YouTube</td><td><b>Every morning, by itself.</b> The <b>Results feed</b> workflow in marketing-hq-data reads views and likes for every video from the channel's public pages.</td><td>Nothing. Watch time and other Studio numbers still come from the monthly YouTube Studio export, if wanted.</td></tr>
   <tr><td>MISMO Matters (Informz)</td><td>Typed in from Higher Logic's report with <b>Record Stats</b>, once a month.</td><td>To make it automatic: an Informz API user from Higher Logic support. With it, the Results feed can read sent, delivered, opens, clicks, unsubscribes and bounces every morning.</td></tr>
   <tr><td>Mailchimp</td><td>The monthly campaigns export dropped on Results.</td><td>Being retired now that MISMO Matters goes through Informz; a Mailchimp API key would make it automatic in the meantime.</td></tr>
   <tr><td>LinkedIn</td><td>The monthly export dropped on Results (Vanessa).</td><td>LinkedIn doesn't let outside tools read page analytics without an approved developer app, so this stays by hand.</td></tr>
   <tr><td>In the News</td><td><b>Every morning, by itself.</b> The <b>In the News web search</b> workflow searches Google News and Bing News for MISMO; Brittney's FYI emails come in as they're sent.</td><td>Nothing.</td></tr>
   <tr><td>Website subscribers</td><td>As they happen. MISMO's own Subscribe form sends each sign-up straight to Higher Logic and MISMO Media (see <b>The Subscribe Form</b>).</td><td>Nothing.</td></tr>
  </tbody></table>
  <p>Staged LinkedIn posts go out through a second flow, described under <b>Posting and Scheduling</b>.</p>
  <h3>What the File Looks Like</h3>
<pre class="hcode">{ "docs": {
  "feeds/youtube":   { "updated": "2026-11-03T11:00:00Z",
                       "videos": { "UlUdGHyQ6v0": { "views": 412, "likes": 18, "comments": 2 } } },
  "feeds/matters":   { "updated": "…", "mailings": [ { "month": "2026-11", "sent": 31250,
                       "delivered": 30710, "opens": 9120, "clicks": 1480, "unsubs": 41,
                       "bounces": 540, "topLinks": ["Winter Summit registration — 212"] } ] },
  "feeds/mailchimp": { "updated": "…", "campaigns": [ { "subject": "…", "date": "2026-11-02",
                       "audience": "Compliance list", "sent": 1800, "opens": 610, "clicks": 95, "unsubs": 3 } ] }
} }</pre>
  <p>The API keys stay inside Power Automate. They never go in the page or in either repository.</p>`},
 {id:"faq", t:"Questions and Fixes", g:"Behind the Scenes", b:`
  <dl class="faq">
   <dt>I don't see a Save button, or the page says view-only.</dt><dd>Your access is View. Ask Jonna to change it in People &amp; Access.</dd>
   <dt>A red line says a change didn't save.</dt><dd>It says why and puts your change back. "Trying again" means it will save once the connection is back; keep the tab open.</dd>
   <dt>A date won't take.</dt><dd>Type it like 11/18/26 or Nov 18, or use the calendar button.</dd>
   <dt>Copy HTML doesn't copy.</dt><dd>A box opens with the HTML already selected. Press <kbd>Ctrl</kbd>+<kbd>C</kbd> (<kbd>⌘</kbd>+<kbd>C</kbd>).</dd>
   <dt>An episode is on YouTube but the page says it isn't.</dt><dd>The YouTube list refreshes every few hours. Open the episode, tick "Posted to YouTube" and paste the link.</dd>
   <dt>An article ran last month but wasn't in that edition.</dt><dd>Open it and set "Goes in MISMO Matters" to this month.</dd>
   <dt>Where do I add something that isn't on any page?</dt><dd>Use <b>+ New Item</b> on the Schedule, or + Add under Getting Set Up.</dd>
  </dl>`}
];
const HL = {id:"start", q:""};
function renderHelp(){
  const el=$("#page-help"); const q=HL.q.trim().toLowerCase();
  const strip=s=>s.replace(/<[^>]+>/g," ").toLowerCase();
  const list=HELP.filter(h=>!q || (h.t+" "+strip(h.b)).toLowerCase().includes(q));
  if(!HELP.find(h=>h.id===HL.id)) HL.id="start";
  const cur=HELP.find(h=>h.id===HL.id);
  const groups=[...new Set(HELP.map(h=>h.g))];
  el.innerHTML='<div class="phead"><div><div class="eyebrow">How to Use MISMO Media</div><h1>Help</h1><div class="sub">Everything about the system: what each page does, the monthly and weekly runs, who does what, and how saving works.</div></div></div>'+
    '<div class="helpwrap"><nav class="helpnav" aria-label="Help topics"><input type="search" class="plain" id="hp-q" placeholder="Search help" value="'+esc(HL.q)+'" autocomplete="off">'+
      groups.map(g=>{ const hs=list.filter(h=>h.g===g); return hs.length?'<div class="hg">'+esc(g)+'</div>'+hs.map(h=>'<button type="button" data-hp="'+h.id+'"'+(h.id===HL.id?' aria-current="true"':'')+'>'+esc(h.t)+'</button>').join(""):""; }).join("")+(list.length?'':'<div class="note" style="padding:8px">Nothing matches.</div>')+
    '</nav><article class="card helpbody"><div class="cb"><div class="eyebrow">'+esc(cur.g)+'</div><h2>'+esc(cur.t)+'</h2>'+(cur.id==="dates"&&typeof datesHtml==="function"?datesHtml():cur.b)+
      '<div class="helpnext">'+(()=>{ const i=HELP.indexOf(cur); return (i>0?'<button class="btn" type="button" data-hp="'+HELP[i-1].id+'">← '+esc(HELP[i-1].t)+'</button>':'<span></span>')+(i<HELP.length-1?'<button class="btn" type="button" data-hp="'+HELP[i+1].id+'">'+esc(HELP[i+1].t)+' →</button>':''); })()+'</div>'+
    '</div></article></div>';
  if(cur.id==="dates" && typeof wireDates==="function") wireDates(el);
  $$("[data-hp]",el).forEach(b=>b.onclick=()=>{ HL.id=b.dataset.hp; renderHelp(); const a=$(".helpbody"); if(a) a.scrollIntoView({block:"start"}); });
  const qi=$("#hp-q",el); qi.oninput=()=>{ HL.q=qi.value; clearTimeout(HL._t); HL._t=setTimeout(()=>{ const first=HELP.find(h=>!HL.q.trim()||(h.t+" "+strip(h.b)).toLowerCase().includes(HL.q.trim().toLowerCase())); if(first) HL.id=first.id; renderHelp(); const n=$("#hp-q"); if(n){ n.focus(); n.setSelectionRange(n.value.length,n.value.length); } },200); };
}
