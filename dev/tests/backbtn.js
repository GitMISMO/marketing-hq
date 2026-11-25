// The browser's Back button (CN-033, Nov 25, 2026): the shared /assets/back.js makes each left-menu page a Back step,
// and Back closes an open panel before it changes page. Like Summit HQ's check 31: two menu pages and Back returns to
// the first; Forward goes again; Back from a record's panel closes it and stays on the page; a panel closed with its
// X leaves no step behind; no page errors. back.js is served from the live copy (MISMO_BACK=<file> tries a local one).
const fs=require('fs');const {chromium}=require('playwright');
async function backJs(){ if(process.env.MISMO_BACK) return fs.readFileSync(process.env.MISMO_BACK,'utf8');
  const r=await fetch('https://resources.mismo.org/assets/back.js'); if(!r.ok) throw new Error('back.js '+r.status); return await r.text(); }
(async()=>{const out={};
/* the live page loads it in <head>, right after the shared sign-in */
const site=fs.readFileSync('../out/site.html','utf8');
out.loadsBackJs=/<script src="\/assets\/session\.js"><\/script>\n<script src="\/assets\/back\.js"><\/script>/.test(site) && site.split('src="/assets/back.js"').length===2;
out.noOwnPushState=!/history\.pushState/.test(site);
const BACK=await backJs();
/* the test page: sample records + the save-relay stand-in, served at a web address with back.js in <head> like the live page */
const page='<script src="/assets/back.js"></script>\n'+fs.readFileSync('live.html','utf8');
const b=await chromium.launch();const p=await b.newPage({viewport:{width:1440,height:900}});
const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.route('**/*',r=>{ const u=r.request().url();
  if(u.startsWith('http://media.test/media/')) return r.fulfill({body:page,contentType:'text/html'});
  if(u.includes('/assets/back.js')) return r.fulfill({body:BACK,contentType:'application/javascript'});
  if(u.startsWith('data:')||u.startsWith('blob:')) return r.continue();
  return r.abort(); });
await p.goto('http://media.test/media/');await p.waitForTimeout(2500);
const state=()=>p.evaluate(()=>({tab:(document.querySelector('.hq nav button[data-hq][aria-current]')||{}).dataset?.hq||'', pane:!!PANE, url:location.href, helper:!!window.MismoBack}));
const go=async t=>{ await p.click('.hq nav button[data-hq="'+t+'"]'); await p.waitForTimeout(700); };
const press=async sel=>{ const r=await p.evaluate(s=>{ const b=document.querySelector(s).getBoundingClientRect(); return {x:b.x+b.width/2,y:b.y+b.height/2}; },sel); await p.mouse.click(r.x,r.y); };
const back=async()=>{ await p.evaluate(()=>history.back()); await p.waitForTimeout(1000); };
const fwd=async()=>{ await p.evaluate(()=>history.forward()); await p.waitForTimeout(1000); };
let st=await state(); out.helper=st.helper; const start=st.tab; out.opensHome=start==='home';
await go('overview'); await go('lists'); await go('help');
st=await state(); out.helpOpens=st.tab==='help';
await back(); st=await state(); out.backToLists=st.tab==='lists';
await back(); st=await state(); out.backToSchedule=st.tab==='overview';
await fwd(); st=await state(); out.forwardToLists=st.tab==='lists';
await back(); await back(); st=await state(); out.backToStart=st.tab===start;
/* a record's panel: Back closes it and stays on the page */
await go('lists'); const row=await p.$('#page-lists [data-ls]'); out.hasRow=!!row;
if(row){ await row.click(); await p.waitForTimeout(700);
  out.panelOpens=(await state()).pane;
  await back(); st=await state(); out.backClosesPanel=!st.pane && st.tab==='lists';
  await back(); st=await state(); out.thenPageBefore=st.tab===start;
  /* closed with its X: Back goes straight to the page before */
  await go('lists'); await (await p.$('#page-lists [data-ls]')).click(); await p.waitForTimeout(700);
  await press('#pane-x'); await p.waitForTimeout(700); out.xCloses=!(await state()).pane;
  await back(); st=await state(); out.afterXPageBefore=st.tab===start && !st.pane;
  /* unsaved changes: Back asks first (like Close) instead of throwing them away */
  await go('lists'); await (await p.$('#page-lists [data-ls]')).click(); await p.waitForTimeout(700);
  await p.fill('#f-covers','typed by the Back test'); await p.waitForTimeout(200);
  await back(); st=await state(); out.unsavedAsks=st.pane && st.tab==='lists' && /aren't saved/.test(await p.textContent('#pf-msg'));
  await press('#pane-x'); await p.waitForTimeout(700); out.unsavedClosed=!(await state()).pane;
}
/* System Health (a pop-up over everything): Back closes it and stays on the page */
await go('help'); await p.evaluate(()=>hhOpen()); await p.click('#hh-modal .hh-hd'); await p.waitForTimeout(400);
const hh=await p.evaluate(()=>!!HH.modal);
await back(); st=await state(); out.backClosesHealth=hh && await p.evaluate(()=>!HH.modal) && st.tab==='help';
out.addressNeverChanged=st.url==='http://media.test/media/';
out.noErrors=errs.length===0;
out.ok=Object.values(out).every(v=>v===true);
console.log(JSON.stringify(out), errs.length?errs:"errors []");
await b.close(); process.exit(out.ok?0:1);})().catch(e=>{ console.log(JSON.stringify({ok:false,err:e.message})); process.exit(1); });
