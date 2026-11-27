// MyMISMO team area (CN-061, Nov 27, 2026): Attendee Reports, MISMO Trivia and MyMISMO on Results, each hidden until its
// route answers 200 (403 for anyone not in alertSenders). The relay is a stand-in here: nothing is sent anywhere.
const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1300,height:900}});
const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('file://'+process.cwd()+'/live.html');await p.waitForTimeout(2500);
const r=await p.evaluate(async()=>{ const wait=ms=>new Promise(r=>setTimeout(r,ms)); const out={};
  document.querySelectorAll('[id^=mn-pop]').forEach(e=>e.remove());
  const nav=()=>document.querySelector('.hq nav button[data-hq="mymismo"]');
  const realFetch=window.fetch, calls=[];
  let code={reports:403, trivia:403, stats:403};
  const reports=[{summit:"2027-winter", id:"RPa1", about:"x1", aboutName:"Pat Example", byName:"Sam Sample", reason:"Spam", note:"Kept sending links", at:"2026-11-26T15:00:00Z", status:"open", action:""},
    {summit:"2027-winter", id:"RPa2", about:"x2", aboutName:"Lee Test", byName:"Kim Demo", reason:"Other", note:"", at:"2026-11-20T15:00:00Z", status:"closed", action:"Talked with them."}];
  const trivia={month:"2026-11", quarter:"2026-Q4", boards:[{month:"2026-11", players:4, top:[{rank:1,name:"Ann A",score:90,right:9}]},{month:"2026-10", players:12, top:[{rank:1,name:"Bo B",score:100,right:10},{rank:2,name:"Cy C",score:80,right:8}]}],
    quarters:[{quarter:"2026-Q4", finalists:[{name:"Bo B", month:"2026-10"}], standings:null}], champ:null};
  const stats={at:Date.now(), phones:{summitAlerts:40, newsAlerts:25}, summits:[{summit:"2027-winter", signedIn:120, conversations:30, messages:210, alertsSent:3, alertsDelivered:110, checkins:400, sessions:22, scanners:6, met:55, touchpoints:18, photos:{submitted:60, picked:20, passed:10, sent:15}, reports:{total:2, open:1}}]};
  window.fetch=(u,o)=>{ const s=String(u); const m=s.match(/\/mymismo\/staff\/(reports|trivia|stats)/);
    if(m){ const k=m[1]; calls.push({k, method:(o&&o.method)||"GET", auth:o&&o.headers&&o.headers.Authorization, body:o&&o.body?JSON.parse(o.body):null});
      if(o && o.method==="POST"){ const bd=JSON.parse(o.body); if(k==="reports"){ const x=reports.find(y=>y.id===bd.id); x.status=bd.status; x.action=bd.action; } else trivia.champ=bd.champ?Object.assign({open:false},bd.champ):null; return Promise.resolve(new Response('{"ok":true}',{status:200})); }
      const body={reports:{reports, open:reports.filter(x=>x.status==="open").length}, trivia, stats}[k];
      return Promise.resolve(new Response(code[k]===200?JSON.stringify(body):'{"error":"NOT_ALLOWED"}',{status:code[k]})); }
    return realFetch(u,o); };
  /* no sign-in: nothing is asked and nothing shows */
  await mymLoad(true); out.noTokenNoCall=calls.length===0 && nav().hidden;
  window.ResourcesSession={token:()=>"test-token"};
  /* 403 for anyone not in alertSenders: nothing shows */
  await mymLoad(true); out.hidden403=nav().hidden && !document.querySelector('#nb-mymismo:not([hidden])') && RS_ORDER.indexOf("mymismo")<0 && calls.every(c=>c.auth==="Bearer test-token");
  go("results"); await wait(100); out.noCard403=!document.querySelector('[data-rs-open="mymismo"]');
  go("overview"); await wait(60); out.noSay403=!document.querySelector('#page-overview .mym-say');
  /* reports and trivia live (relay request 15), stats not yet (relay request 17) */
  code={reports:200, trivia:200, stats:404}; await mymLoad(true);
  out.navShown=!nav().hidden && document.getElementById('nb-mymismo').textContent==="1" && document.getElementById('nb-mymismo').classList.contains('hot');
  go("overview"); await wait(60); const sayB=document.querySelector('#page-overview .mym-say'); out.schedule=!!sayB && /1 open attendee report in MyMISMO/.test(sayB.textContent);
  go("results"); await wait(100); out.noCardYet=!document.querySelector('[data-rs-open="mymismo"]');
  sayB && (go("overview"), await wait(60), document.querySelector('#page-overview .mym-say').click()); await wait(80);
  const pg=document.getElementById('page-mymismo');
  out.page=TAB==="mymismo" && /Pat Example/.test(pg.innerText) && /Sam Sample/.test(pg.innerText) && /Spam/.test(pg.innerText) && /Kept sending links/.test(pg.innerText) && /2027 Winter Summit/.test(pg.innerText) && !/Lee Test/.test(pg.innerText);
  /* Close needs a note */
  pg.querySelector('[data-mym-do="closing"]').click(); await wait(40);
  pg.querySelector('[data-mym-do="close"]').click(); await wait(80);
  out.noteRequired=!calls.some(c=>c.method==="POST") && /short note/.test(document.getElementById('mym-msg').textContent);
  document.getElementById('mym-a').value="Removed their profile photo."; pg.querySelector('[data-mym-do="close"]').click(); await wait(300);
  const post=calls.find(c=>c.method==="POST"&&c.k==="reports");
  out.closed=!!post && post.body.summit==="2027-winter" && post.body.id==="RPa1" && post.body.status==="closed" && post.body.action==="Removed their profile photo." && post.auth==="Bearer test-token";
  out.badgeCleared=document.getElementById('nb-mymismo').hidden;
  /* Reopen keeps the note */
  MYM.filter="closed"; renderMyMISMO(); await wait(40);
  pg.querySelector('[data-mym-rep="2027-winter|RPa1"] [data-mym-do="reopen"]').click(); await wait(300);
  const re=calls.filter(c=>c.method==="POST"&&c.k==="reports").pop(); out.reopened=re.body.status==="open" && re.body.action==="Removed their profile photo." && document.getElementById('nb-mymismo').textContent==="1";
  /* Trivia: winners, top 10, the championship form */
  MYM.sub="trivia"; renderMyMISMO(); await wait(40);
  out.trivia=/Monthly Winners/.test(pg.innerText) && /October 2026/.test(pg.querySelector('.mym-win').innerText) && /Bo B/.test(pg.querySelector('.mym-win').innerText) && !/Ann A/.test(pg.querySelector('.mym-win').innerText) && /Cy C/.test(pg.innerText) && /Finalists/.test(pg.innerText);
  document.getElementById('mym-cq').value="2026-Q4"; document.getElementById('mym-co').value="2027-01-05T09:00"; document.getElementById('mym-cc').value="2027-01-04T09:00";
  document.getElementById('mym-champ').requestSubmit(); await wait(60); out.champCheck=!calls.some(c=>c.k==="trivia"&&c.method==="POST") && /close after it opens/.test(document.getElementById('mym-cmsg').textContent);
  document.getElementById('mym-cc').value="2027-01-12T09:00"; document.getElementById('mym-cm').value="15";
  document.getElementById('mym-champ').requestSubmit(); await wait(300);
  const tp=calls.filter(c=>c.k==="trivia"&&c.method==="POST").pop(); out.champSet=!!tp && tp.body.champ.quarter==="2026-Q4" && tp.body.champ.minutes===15 && new Date(tp.body.champ.opens).getTime()===new Date("2027-01-05T09:00").getTime() && !!document.getElementById('mym-cclear');
  window.confirm=()=>true; document.getElementById('mym-cclear').click(); await wait(300);
  out.champClear=calls.filter(c=>c.k==="trivia"&&c.method==="POST").pop().body.champ===null;
  /* stats live (relay request 17): the MyMISMO card on Results and its panel */
  code.stats=200; await mymLoad(true); go("results"); await wait(120);
  const card=document.querySelector('[data-rs-open="mymismo"]'); out.card=!!card && /120/.test(card.innerText) && /40/.test(card.innerText) && RS_ORDER.indexOf("mymismo")>=0;
  card.click(); await wait(200); const pb=document.getElementById('pane-body').innerText;
  out.rail=/People signed in/.test(pb) && /2027 Winter Summit/i.test(pb) && /Who I Met/.test(pb) && /Photos sent to MISMO Media/.test(pb) && /Trivia Players by Month/.test(pb) && /October 2026\s+12\s+Bo B/.test(pb) && !document.querySelector('#pane-body .rs-perbar');
  closePane(true);
  /* access taken away: everything hides again */
  code={reports:403, trivia:403, stats:403}; await mymLoad(true); await wait(60);
  out.hiddenAgain=nav().hidden; out.cardGone=!document.querySelector('[data-rs-open="mymismo"]') && RS_ORDER.indexOf("mymismo")<0;
  window.fetch=realFetch; delete window.ResourcesSession;
  out.ok=Object.values(out).every(v=>v===true); return out; });
console.log(JSON.stringify(r), errs.length?errs:"errors []"); if(errs.length) r.ok=false;
await b.close(); process.exit(r.ok?0:1);})();
