"""Builds MISMO Media from src/ into two pages:
  - the copy served at resources.mismo.org/marketing-hq/ (the repo's index.html), with the sign-in gate and the
    save-relay door (shim.html) wrapped around it
  - a plain copy with no sign-in, which the tests open with sample data
Run: python3 build.py   (in the repo it lives in dev/; see DEVELOPING.md at the top of the repo)"""
import os, re, hashlib, datetime
from zoneinfo import ZoneInfo
B=os.path.dirname(os.path.abspath(__file__))+'/'
def first(*paths):
    for p in paths:
        if os.path.exists(B+p): return B+p
    raise SystemExit('missing: '+' or '.join(paths))
LOCAL=os.path.isdir(B+'resources')            # the working copy keeps the old layout; the repo's dev/ folder is flat
SHIM=first('resources/shim.html','shim.html'); LOGO=first('dev/logo.txt','logo.txt'); GATE=first('dev/gate.html','gate.html')
OUT_PLAIN=B+('index.html' if LOCAL else 'out/plain.html'); OUT_SITE=B+('resources/index.html' if LOCAL else 'out/site.html')
os.makedirs(os.path.dirname(OUT_SITE), exist_ok=True)
head=open(B+'src/head.html').read(); body=open(B+'src/body.html').read(); logo=open(LOGO).read()
ORDER=['app1.js','app2.js','app4.js','app5.js','app6.js','app7.js','app8.js','app9.js','app10.js','app11.js','app12.js','app13.js','app14.js','app15.js','app16.js','app17.js','app18.js','app19.js','app20.js','app21.js','app22.js','app23.js','app3.js']
app=''.join(open(B+'src/'+f).read() for f in ORDER)
# the version shown on Help > System Health: build date (Eastern) + a short fingerprint of the code
et=datetime.datetime.now(ZoneInfo('America/New_York'))
if os.environ.get('BUILD_TIME'): et=datetime.datetime.fromisoformat(os.environ['BUILD_TIME'])
BUILD=et.strftime('%Y-%m-%d %H:%M ET')+' · '+hashlib.sha1(app.encode()).hexdigest()[:7]
app=app.replace('const BUILD = "__BUILD__";','const BUILD = "'+BUILD+'";')
# the plain copy (no sign-in), for the tests
open(OUT_PLAIN,'w').write(head+'\n'+logo+'</defs></svg>'+body+'<script>'+app+'</script>')
# resources.mismo.org copy
gate=open(GATE).read().rstrip('\n')  # the hide-until-signed-in block + session.js + sync (copied from Member 360)
shim=open(SHIM).read()
h2=head.replace('<title>Artifact - MISMO Media</title>\n','').replace('<meta name="claude:viewport-fit-sides" content="cover">\n','')
extra='''<meta http-equiv="Content-Security-Policy" content="object-src 'none'; base-uri 'self'">
<style>
/* the skeleton the Claude copy is wrapped in */
:root{padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}
body{margin:0}img{max-width:100%}[hidden]:not([hidden=until-found i]){display:none!important}
/* sign-in, access and connection notices (resources.mismo.org) */
/* account button: squared corners, same as Team HQ */
#rs-account{flex:0 0 auto;display:inline-flex;align-items:center}
#rs-account .rs-who,#rs-account .rs-signin{border-radius:4px}
.banner{background:var(--warn-soft);color:var(--warn);border:1px solid var(--warn);border-radius:6px;padding:10px 14px;margin-bottom:16px;font-size:13px}
</style>'''
b2=body.replace('<span class="hqtop-r"><span class="eyebrow-m">Strategic Growth</span></span>','''<span class="hqtop-r"><span class="eyebrow-m">Strategic Growth</span>
    <!-- The shared account bubble every tool shows in this spot (session.js fills it). -->
    <div id="rs-account"></div></span>''')
b2=b2.replace('<main id="main">','<main id="main">\n  <div class="banner" id="savebanner" hidden></div>')
assert 'rs-account' in b2 and 'savebanner' in b2
top='''<!doctype html>
<!--
  MISMO Media (formerly Marketing HQ), resources.mismo.org/marketing-hq/
  BEFORE UPLOADING A NEW COPY OF THIS FILE: download the current index.html from GitHub first
  and make your changes to that copy. Uploading an older copy silently undoes everything that
  changed since.
  Built the same way as Member 360, Summit HQ and the IIF Planning HQ: the shared resources.mismo.org
  sign-in (/assets/session.js) and the one door to the save relay (project key "marketing-hq", data
  in the PRIVATE repository GitMISMO/marketing-hq-data). No GitHub token or other secret ever goes
  in this file, and no records either: they all arrive from marketing-hq-data after sign-in.
-->
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>MISMO Media</title>
'''
out=top+gate+'\n'+shim+'\n'+h2+'\n'+extra+'\n</head><body>\n'+logo+'</defs></svg>'+b2+'<script>'+app+'</script>\n</body></html>\n'
for bad in ['ghp_','github_pat_','Bearer ey']: assert bad not in out
open(OUT_SITE,'w').write(out)
print(len(out), BUILD)
