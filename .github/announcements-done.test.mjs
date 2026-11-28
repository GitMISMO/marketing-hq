// Checks .github/announcements-done.mjs (CN-078). Run: node .github/announcements-done.test.mjs
import assert from 'node:assert/strict';
import { build, entryFor, day } from './announcements-done.mjs';

const rel = (id, x) => Object.assign({ annId: id, type: 'release', status: 'final', final: { at: '2026-12-01T15:00:00Z', by: 'Perry' } }, x);
const docs = {
  'releases/a': rel('WR1-Final', { out: { link: 'https://newslink.mba.org/x', mbaAt: '2026-12-02T03:30:00Z', vanessaAt: '2026-12-03T14:00:00Z' } }),
  'releases/b': rel('WR2-CFP', { type: 'cfp', out: { link: 'https://www.mismo.org/news/cfp', linkAt: '2026-12-04T16:00:00Z' } }),
  'releases/c': rel('WR3-Draft', { final: null, status: 'quote', out: { link: 'https://example.org/early' } }),   // not approved, not sent
  'releases/d': rel('WR4-NoLink', { out: { vanessaAt: '2026-12-02T14:00:00Z' } }),                              // sent, no link yet
  'releases/e': { type: 'release', final: {}, out: { link: 'https://x.org', mbaAt: '2026-12-02T14:00:00Z' } },    // not from the MMS
  'releases/f': rel('WR5-Comment', { type: 'comment', out: { link: 'https://x.org', mbaAt: '2026-12-02T14:00:00Z' } }),
  'releases/g': rel('WR6-Bad', { out: { link: 'javascript:alert(1)', mbaAt: '2026-12-02T14:00:00Z' } }),
  'releases/h': rel('WR7-Gone', { _deletedAt: '2026-12-05T00:00:00Z', out: { link: 'https://x.org', mbaAt: '2026-12-02T14:00:00Z' } }),
};
assert.equal(day('2026-12-02T03:30:00Z'), '2026-12-01');   // Eastern day
assert.equal(entryFor(docs['releases/c']), null);

const one = build({ docs }, null, '2026-12-05T12:00:00.000Z');
assert.equal(one.changed, true);
assert.deepEqual(one.file, { source: 'MISMO Media', updated: '2026-12-05T12:00:00.000Z', announcements: [
  { id: 'WR2-CFP', type: 'cfp', published: '2026-12-04', link: 'https://www.mismo.org/news/cfp' },
  { id: 'WR1-Final', type: 'release', published: '2026-12-01', link: 'https://newslink.mba.org/x' },
] });

// nothing new: same file, same updated time
const two = build({ docs }, one.file, '2026-12-05T12:05:00.000Z');
assert.equal(two.changed, false); assert.equal(two.file.updated, '2026-12-05T12:00:00.000Z');

// earlier entries are kept even when the record is gone; a new one is added
const three = build({ docs: { 'releases/d': rel('WR4-NoLink', { out: { link: 'https://x.org/4', vanessaAt: '2026-12-06T14:00:00Z' } }) } }, one.file, '2026-12-06T15:00:00.000Z');
assert.equal(three.changed, true);
assert.deepEqual(three.file.announcements.map(a => a.id), ['WR4-NoLink', 'WR2-CFP', 'WR1-Final']);

// the empty start
assert.deepEqual(build({ docs: {} }, null, 't').file, { source: 'MISMO Media', updated: 't', announcements: [] });
console.log(JSON.stringify({ ok: true }));
