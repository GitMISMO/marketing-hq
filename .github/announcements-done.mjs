// CN-078 (approved by Jonna Nov 28, 2026): tell the MMS what MISMO Media has published for it, so nobody records
// it by hand. Builds the public file announcements-done.json (resources.mismo.org/media/announcements-done.json)
// from MISMO Media's press release records (collection releases, one record per MMS request; calls for
// participation are releases with type cfp). The MMS reads it about every 5 minutes and marks each request Done.
//
//   node .github/announcements-done.mjs <releases.json> <announcements-done.json>
//
// Shape (a contract with the MMS: add fields, never rename):
//   {"source":"MISMO Media","updated":"<ISO time>","announcements":[{"id","type":"cfp"|"release","published":"YYYY-MM-DD","link"}]}
// Rules: only what is already published (the file is public): the release has its published link and has gone out
// (sent to MISMO Connect or the MBA newsroom) or has Perry's final approval. Only requests the MMS sent (the record
// carries the MMS request id, annId). Entries already in the file are kept as they are, even if the record changes or
// is deleted later. "updated" changes only when the list does, so the file changes only when its contents do.
// If the records can't be read, the file is left exactly as it is.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';

const TYPES = ['cfp', 'release'];
const str = (v, n) => String(v == null ? '' : v).trim().slice(0, n);
/* the calendar day in Eastern time, which is the day MISMO staff see */
export function day(iso) {
  if (!iso) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) return iso;
  const d = new Date(iso); if (isNaN(d)) return '';
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);
}
export function goodLink(u) { try { const x = new URL(String(u || '').trim()); return (x.protocol === 'https:' || x.protocol === 'http:') ? x.href : ''; } catch { return ''; } }

/* one entry for a release record, or null if it isn't published (or wasn't asked for by the MMS) */
export function entryFor(r) {
  if (!r || typeof r !== 'object' || r._deletedAt || r.archived) return null;
  const id = str(r.annId || (r.ann && r.ann.id), 200), type = String(r.type || (r.ann && r.ann.type) || '');
  if (!id || !TYPES.includes(type)) return null;
  const o = r.out || {}, link = goodLink(o.link);
  if (!link) return null;
  if (!(o.vanessaAt || o.mbaAt || r.final)) return null;
  const went = [o.vanessaAt, o.mbaAt].map(day).filter(Boolean).sort()[0];
  const published = went || day(o.linkAt) || day(r.releaseDate) || day(new Date().toISOString());
  return { id, type, published, link };
}

export function build(releases, before, now) {
  const docs = (releases && releases.docs && typeof releases.docs === 'object') ? releases.docs : (releases || {});
  const old = (before && Array.isArray(before.announcements)) ? before.announcements.filter(a => a && a.id && a.type) : [];
  const key = a => a.type + '|' + a.id, have = new Set(old.map(key)), add = [];
  for (const r of Object.values(docs)) { const e = entryFor(r); if (e && !have.has(key(e))) { have.add(key(e)); add.push(e); } }
  const list = old.concat(add).sort((a, b) => String(b.published).localeCompare(String(a.published)) || key(a).localeCompare(key(b)));
  const same = before && before.source === 'MISMO Media' && JSON.stringify(list) === JSON.stringify(before.announcements || []);
  return { changed: !same, file: { source: 'MISMO Media', updated: same ? before.updated : now, announcements: list }, added: add };
}

if (import.meta.url === 'file://' + process.argv[1]) {
  const [src, out] = process.argv.slice(2);
  let releases;
  try { releases = JSON.parse(readFileSync(src, 'utf8')); if (!releases || typeof releases.docs !== 'object') throw new Error('no docs'); }
  catch (e) { console.log('::warning::The release records could not be read (' + e.message + '); announcements-done.json is left as it is.'); process.exit(0); }
  let before = null; if (existsSync(out)) { try { before = JSON.parse(readFileSync(out, 'utf8')); } catch { before = null; } }
  const r = build(releases, before, new Date().toISOString());
  if (!r.changed) { console.log('Nothing new: ' + r.file.announcements.length + ' published announcement(s) listed.'); process.exit(0); }
  writeFileSync(out, JSON.stringify(r.file, null, 2) + '\n');
  console.log('announcements-done.json: ' + r.file.announcements.length + ' listed, ' + r.added.length + ' new' + (r.added.length ? ' (' + r.added.map(a => a.id).join(', ') + ')' : '') + '.');
}
