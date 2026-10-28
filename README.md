# marketing-hq

Marketing HQ: MISMO's one place for marketing. The schedule across every channel, the MISMO Matters builder (sections, Amy's review, the Higher Logic HTML, stats), MISMO Mic'd Up's weekly run, LinkedIn, YouTube, Mailchimp, summit marketing, results, In the News, subscribers and downloaders, and the send lists.
Live at https://resources.mismo.org/marketing-hq/ (sign-in required).

Set up the same way as Member 360 and Summit HQ. The records live in the private `marketing-hq-data` repo and are read and saved through the resources.mismo.org relay under the project key `marketing-hq`. No token, secret, subscriber list or other record is ever kept in this repo.

While `PREVIEW` near the top of index.html is `true`, the page opens but saves nothing; the team keeps using the Claude version. Switching on = Claude re-copies the latest records into marketing-hq-data, then `PREVIEW` is set to `false`.

Mic'd Up episodes are marked "on YouTube", with their link, from /podcast/micdup.json, the list the home page already keeps.

Who can do what (set per person in People & Access):
- **Admin** and **Staff**: change anything.
- **View**: read-only.

Before uploading a new copy of index.html, download the current one from GitHub first and make changes to that copy, so nothing that changed since is undone.
