// Work Product Downloads: records the sign-up workflow files from the website's Before You Download form
// (data/wpdl.json) show on Lists & Unsubscribes, count as downloaders under Subscribers, search, and copy as CSV.
const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1300,height:900}});
const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('file://'+process.cwd()+'/live.html#lists');await p.waitForTimeout(2500);
const r=await p.evaluate(async()=>{ const wait=ms=>new Promise(r=>setTimeout(r,ms));
  const now=new Date().toISOString(); let copied="";
  window.copyText=(s)=>{ copied=s; };
  await put("wpdl","d-aaa",{e:"pat.one@example.com",n:"Pat One",first:"Pat",last:"One",o:"Lender Co",t:"VP Ops",product:"Servicing Transfer Phase 2",pid:"st2",file:"st2.zip",accepted:true,firstAt:now,at:now,times:2});
  await put("wpdl","d-bbb",{e:"sam@lender.example",n:"Sam Two",o:"Servicer Inc",product:"MISMO Reference Model",at:now,firstAt:now,times:1});
  await wait(150); go("lists"); await wait(250);
  const card=[...document.querySelectorAll('#page-lists .card h2')].some(h=>h.textContent==="Work Product Downloads");
  const rows=document.querySelectorAll('#page-lists [data-dl]').length;
  document.querySelector('#dl-csv').click(); const csvOk=/Pat,One,pat\.one@example\.com,Lender Co,VP Ops,Servicing Transfer Phase 2/.test(copied.replace(/"/g,""));
  const q=document.querySelector('#dl-q'); q.value="reference"; q.oninput(); await wait(400);
  const filtered=document.querySelectorAll('#page-lists [data-dl]').length;
  const ppl=peopleIndex().find(x=>x.e==="pat.one@example.com");
  const res={card, rows, csvOk, filtered, downloader:!!(ppl&&ppl.lists.downloaders), what:ppl&&ppl.x, notSubscriber:!(ppl&&ppl.lists.subscribers)};
  res.ok=card && rows===2 && csvOk && filtered===1 && res.downloader && res.notSubscriber && (res.what||[]).includes("Servicing Transfer Phase 2");
  return res;
});
console.log(JSON.stringify(r), errs.length?errs:"errors []"); if(errs.length) r.ok=false;
await p.evaluate(()=>{ go("lists"); }); await p.waitForTimeout(200);
const c=await p.$('#page-lists .card'); if(c) await c.screenshot({path:'downloads.png'});
await b.close(); process.exit(r.ok?0:1);})();
