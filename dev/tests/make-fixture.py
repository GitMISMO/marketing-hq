#!/usr/bin/env python3
"""Makes dev/tests/fixture.html: made-up records in the same shape as MISMO Media's private sample data,
safe for this public repo, so the browser tests run on every change. Same ids, keys, months, dates and
statuses (the tests click on those); every name, title, note, link and picture is replaced.
   python3 make-fixture.py <private sample-data.html> fixture.html"""
import json, re, sys, hashlib
src, out = sys.argv[1], sys.argv[2]
s = open(src, encoding='utf-8').read()
i = s.index('window.__D=') + len('window.__D=')
D, n = json.JSONDecoder().raw_decode(s[i:])
rest = s[i+n:]                                   # the stand-in window.claude loader, kept as is
KEEP = {'key','month','status','kind','channel','owner','type','edition','id','order','excluded','sectionsRun','fileIn'}
GIF = 'data:image/gif;base64,R0lGODlhAQABAAAAACw='
DATE = re.compile(r'^\d{4}-\d{2}(-\d{2})?([T ][\d:.]+Z?)?$')
cnt = {}
def fake(field, v):
    if not isinstance(v, str) or not v: return v
    if field in KEEP or DATE.match(v) or re.fullmatch(r'[a-z0-9_\-]{1,24}', v): return v
    h = hashlib.sha1(v.encode()).hexdigest()[:8]
    if re.match(r'^(https?:|data:)', v):
        if field in ('url','hlUrl') and re.search(r'\.(png|jpe?g|gif|webp|svg)|^data:image', v, re.I): return GIF
        return 'https://example.com/sample/' + h
    cnt[field] = cnt.get(field, 0) + 1
    return 'Sample ' + field + ' ' + str(cnt[field])
def walk(field, v):
    if isinstance(v, dict): return {k: walk(k, x) for k, x in v.items()}
    if isinstance(v, list): return [walk(field, x) for x in v]
    return fake(field, v)
F = {col: {rid: walk(col, rec) for rid, rec in recs.items()} for col, recs in D.items()}
open(out, 'w', encoding='utf-8').write('<!-- Made-up test records (dev/tests/make-fixture.py). Nothing here is real. -->\n<script>window.__D=' + json.dumps(F, ensure_ascii=False) + rest)
