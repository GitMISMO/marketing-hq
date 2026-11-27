// Tour mode (CN-059, Nov 27, 2026): the MMS's Work Request Journey opens the real MISMO Media (the live build,
// dev/out/site.html) in a frame at /media/?tour=1 and hands it practice records through window.parent.__tourSeed.
// Checks: window.__mmTour is there and ready; today's date comes from window.parent.__tourClock; load() replaces the
// records and shows them as that person, on that view, with that release open; go() and open() work; Perry's emails
// are kept (sent(), and window.parent.__tourMail) instead of sent; saves change only the tab's copy; nothing at all
// reaches the relay, the flows or anywhere else; the browser's storage and the background-job lock are left alone;
// and without the journey (no frame, or no __tourSeed) the page is the normal one.
const fs=require('fs');const {chromium}=require('playwright');
const SITE=fs.readFileSync('../out/site.html','utf8');
const SESSION=`window.ResourcesSession={current:()=>({name:'Real Person',email:'real@mismo.org',token:'real-token',expiresAt:'2099-01-01T00:00:00Z'}),
  token:()=>'real-token',onChange(){},role:()=>'editor',canEdit:()=>true,requireAccess:()=>new Promise(()=>{}),signIn:()=>Promise.resolve()};`;
const BACK='window.MismoBack={layer(){}};';
const iso=s=>s+'T15:00:00.000Z';
const ann=(id,o)=>Object.assign({id, type:'release', name:'Practice Standard '+id, publicName:'Practice Standard '+id, pressRelease:true, stage:'Candidate Recommendation'},o);
const MEM={
  releases:{
    'pr-wr2027-07-a':{annId:'WR2027_07-a', ann:ann('WR2027_07-a',{draftNow:true, readyToPost:false, inComment:true, commentCloses:'2027-03-20'}), type:'release', status:'review', createdAt:iso('2027-03-01'),
      draft:{headline:'MISMO Announces the Practice Standard', body:'WASHINGTON (March 1, 2027) MISMO announced the Practice Standard.\n\n[QUOTE]\n\nAbout MISMO.', at:iso('2027-03-01'), by:'Claude'},
      source:{name:'Pat Example', title:'Chair', company:'Example Lending', email:'pat@example.com', reason:'Led the work'}, log:[]},
    'pr-wr2027-07-b':{annId:'WR2027_07-b', ann:ann('WR2027_07-b',{draftNow:true, readyToPost:true, readyAt:'2027-03-09', inComment:false}), type:'release', status:'final', createdAt:iso('2027-02-01'),
      draft:{headline:'MISMO Releases the Second Practice Standard', body:'WASHINGTON (March 9, 2027) MISMO released it.\n\nAbout MISMO.', at:iso('2027-02-01'), by:'Claude'},
      final:{at:iso('2027-02-20'), by:'Perry Williams'}, readyAt:'2027-03-09', log:[]}
  },
  requests:{'rq-practice':{title:'Practice request', type:'linkedin', status:'new', n:'Practice Person', e:'practice@mismo.org', neededBy:'2027-03-15', at:iso('2027-03-02')}}
};
const PARENT=`<!doctype html><html><head><title>Work Request Journey</title></head><body>
<script>
window.__mails=[];
window.__tourMail=m=>window.__mails.push(m);
window.__tourClock={base:Date.parse('2027-03-10T14:00:00Z'), at:Date.now()};
window.__tourSeed=()=>Promise.resolve({mem:${JSON.stringify(MEM)}, me:{name:'Vanessa Rios', email:'vrios@mismo.org'}, view:'press'});
localStorage.setItem('before','1');
</script>
<iframe id="f" src="__SRC__" style="width:1400px;height:860px"></iframe></body></html>`;
(async()=>{const out={};
const b=await chromium.launch();
const ctx=await b.newContext({viewport:{width:1440,height:900}});
const p=await ctx.newPage();
const errs=[], leaks=[];
p.on('pageerror',e=>errs.push(e.message));
let parentSrc='/media/?tour=1', parentSeed=true;
await ctx.route('**/*',r=>{ const u=r.request().url();
  if(u.startsWith('https://resources.mismo.org/mms/journey/')){ let h=PARENT.replace('__SRC__',parentSrc); if(!parentSeed) h=h.replace('window.__tourSeed=','window.__noSeed='); return r.fulfill({body:h,contentType:'text/html'}); }
  if(u.startsWith('https://resources.mismo.org/media/')&&!/\/media\/(spell|mm-headers)\//.test(u)) return r.fulfill({body:SITE,contentType:'text/html'});
  if(u==='https://resources.mismo.org/assets/session.js') return r.fulfill({body:SESSION,contentType:'application/javascript'});
  if(u==='https://resources.mismo.org/assets/back.js') return r.fulfill({body:BACK,contentType:'application/javascript'});
  if(u.startsWith('data:')||u.startsWith('blob:')) return r.continue();
  if(/fonts\.(googleapis|gstatic)\.com|resources\.mismo\.org\/assets\/|resources\.mismo\.org\/media\/spell\//.test(u)) return r.abort();
  leaks.push(r.request().method()+' '+u.split('?')[0]); return r.abort(); });
await p.goto('https://resources.mismo.org/mms/journey/');
const fr=async()=>{ const h=await p.waitForSelector('#f'); return await h.contentFrame(); };
let f=await fr();
await f.waitForFunction(()=>window.__mmTour,null,{timeout:15000}).catch(()=>{});
out.hasTour=await f.evaluate(()=>!!window.__mmTour && window.__mmTourOn===true);
out.ready=await f.evaluate(()=>window.__mmTour.ready());
let st=await f.evaluate(()=>window.__mmTour.state());
out.clockFromParent=st.today==='2027-03-10' && /^2027-03-10/.test(await f.evaluate(()=>new Date().toISOString()));
out.seedView=st.view==='press' && st.me.email==='vrios@mismo.org';
out.seedRecords=await f.evaluate(()=>Object.keys(S.releases).length===2 && /Practice Standard/.test(document.querySelector('#page-press').textContent));
out.practiceNote=/Practice Mode/.test(await f.textContent('#rail-save'));
out.views=JSON.stringify(st.views)===JSON.stringify(["overview","requests","press","results","matters","micdup","linkedin","youtube","mailchimp","summits","branding","orders","people","lists","news","images","qr","help"]);
// load as Perry on another day, with the held release open
st=await f.evaluate(m=>window.__mmTour.load({mem:m, me:{name:'Perry Williams', email:'pwilliams@mismo.org'}, today:'2027-03-12', view:'press', open:'pr-wr2027-07-a'}), MEM);
out.loadShows=st.view==='press' && st.open==='pr-wr2027-07-a' && st.today==='2027-03-12' && st.me.name==='Perry Williams';
const det=await f.textContent('#pr-detail').catch(()=>'');
out.releaseOpen=/MISMO Announces the Practice Standard/.test(det) && /Draft Now/.test(det) && /Out for Comment/.test(det);
out.goRequests=await f.evaluate(()=>window.__mmTour.go('requests'))==='requests' && await f.evaluate(()=>!document.querySelector('#page-requests').hidden);
out.openFinal=await f.evaluate(()=>window.__mmTour.open('pr-wr2027-07-b')) && /Ready to Post/.test(await f.textContent('#pr-detail').catch(()=>''));
// Perry sends the quote source to Amy: kept, not sent; the release moves on in the tab's copy only
await f.evaluate(()=>window.__mmTour.open('pr-wr2027-07-a'));
await f.evaluate(()=>prSendAmy('pr-wr2027-07-a')); await p.waitForTimeout(400);
const sent=await f.evaluate(()=>window.__mmTour.sent());
out.emailKept=sent.length===1 && sent[0].to==='amoses@mismo.org' && /MM:pr-wr2027-07-a/.test(sent[0].subject) && !('token' in sent[0]);
out.parentGotEmail=await p.evaluate(()=>window.__mails.length===1);
out.savedInTab=await f.evaluate(()=>window.__mmTour.mem().releases['pr-wr2027-07-a'].status==='source');
// the quote request, sent as Perry through the flow: kept too
await f.evaluate(async()=>{ const id='pr-wr2027-07-a'; await prSave(id,{status:'request', request:{to:'pat@example.com', toName:'Pat Example', subject:'Quote request', body:'Hi Pat'}},''); await prSendRequest(id); });
await p.waitForTimeout(400);
const sent2=await f.evaluate(()=>window.__mmTour.sent());
out.sendAsKept=sent2.length===2 && sent2[1].to==='pat@example.com' && !('token' in sent2[1]);
// a feed check reads nothing
await f.evaluate(()=>prLoadFeed(true)); out.noFeedError=await f.evaluate(()=>PR.feedErr==='' && PR.feed.list.length===2);
out.fetchRefused=await f.evaluate(()=>fetch('/mms/announcements.json').then(()=>false,()=>true)) && await f.evaluate(()=>fetch('https://rgvdi67cg27o5kcmiytcqbqnrm0hmztx.lambda-url.us-east-1.on.aws/marketing-hq/data/releases').then(()=>false,()=>true));
out.storageUntouched=await p.evaluate(()=>Object.keys(localStorage).join()==='before');
out.noJobLock=await f.evaluate(async()=>{ if(!navigator.locks||!navigator.locks.query) return true; const q=await navigator.locks.query(); return !q.held.some(l=>l.name==='mismo-media-autopilot'); });
out.noLeaks=leaks.length===0;
// not a tour: opened on its own, or by a page without __tourSeed
await p.goto('https://resources.mismo.org/media/?tour=1'); await p.waitForTimeout(800);
out.alonePlain=await p.evaluate(()=>!window.__mmTourOn && !window.__mmTour && !(window.__hqRelay&&window.__hqRelay.tour));
parentSeed=false; await p.goto('https://resources.mismo.org/mms/journey/'); f=await fr(); await p.waitForTimeout(800);
out.noSeedPlain=await f.evaluate(()=>!window.__mmTourOn && !window.__mmTour);
out.noErrors=errs.length===0;
out.ok=Object.values(out).every(v=>v===true);
console.log(JSON.stringify(out), errs.length?errs:"errors []", leaks.length?leaks:"");
await b.close(); process.exit(out.ok?0:1);})().catch(e=>{ console.log(JSON.stringify({ok:false,err:e.message})); process.exit(1); });
