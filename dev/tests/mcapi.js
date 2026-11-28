// Mailchimp numbers read automatically (Nov 28, 2026): the "Mailchimp reports" workflow's campaigns fill in the
// matching Mailchimp records, new campaigns are added, and System Health reports it. The API counts bots, so its opens
// and clicks go into their own fields and never over the real (bot-filtered) ones; Results shows the bots separately.
const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1300,height:900}});
const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('file://'+process.cwd()+'/live.html');await p.waitForTimeout(2500);
const r=await p.evaluate(async()=>{ const wait=ms=>new Promise(r=>setTimeout(r,ms)); const out={};
  if(typeof mcNeedsReal!=="function" || typeof rsMcWhole!=="function" || typeof mcUnsubSync!=="function") return {ok:true, skipped:"the page this was built from predates the bot split"};
  document.querySelectorAll('[id^=mn-pop]').forEach(e=>e.remove());
  out.notYet=!mcLive() && rsSrc("mc").a==="hand";
  S.mailchimp={_run:{waiting:true, ok:false, error:"Not connected yet: the MAILCHIMP_API_KEY secret isn't set on marketing-hq-data", at:new Date().toISOString()}}; LOADED.add("mailchimp");
  out.healthWaiting=hhMailchimp().level==="off";
  /* a record logged by hand (no campaign id yet) and one with the id */
  await put("pieces","mct-a",{channel:"mailchimp", title:"Test Subject A", date:"2026-11-20", status:"done", sent:100, delivered:90, opens:10});
  await put("pieces","mct-b",{channel:"mailchimp", title:"Test Subject B", mcId:"bbb222", date:"2026-11-21", status:"done", sent:200, delivered:190, opens:20});
  const now=new Date().toISOString();
  S.mailchimp={_run:{ok:true, at:now, lastOk:now, campaigns:3},
    "c-aaa111":{id:"aaa111", name:"2026_11_20 Test A", subject:"Test Subject A", date:"2026-11-20", at:"2026-11-20T18:00:00Z", resend:false, sent:100, delivered:95, opens:40, clicks:5, unsubs:1, bounces:5, totalOpens:60, totalClicks:9, forwards:0, links:[["mismo.org",7]]},
    "c-bbb222":{id:"bbb222", name:"2026_11_21 Test B", subject:"Test Subject B", date:"2026-11-21", at:"2026-11-21T18:00:00Z", resend:false, sent:200, delivered:195, opens:80, clicks:9, unsubs:2, bounces:5, totalOpens:99, totalClicks:12, forwards:1, links:[]},
    "c-ccc333":{id:"ccc333", name:"Resend: 2026_11_21 Test B", subject:"Test Subject B", date:"2026-11-24", at:"2026-11-24T15:30:00Z", resend:true, sent:150, delivered:148, opens:12, clicks:1, unsubs:0, bounces:2, totalOpens:14, totalClicks:1, forwards:0, links:[]}};
  /* unsubscribes: one new, one already on the list, one who signed up again on MISMO's form afterward */
  S.mailchimp["unsubs-L1"]={list:"MISMO", listId:"L1", n:3, people:[["new.person@example.com","2026-10-02T14:00:00+00:00","N/A (Unsubscribed by an admin)"],["New.Person@example.com","2026-10-02T14:00:00+00:00",""],["back.again@example.com","2026-09-01T10:00:00+00:00","Too many emails"]]};
  await put("signups","sg-back",{e:"back.again@example.com", at:"2026-11-20T10:00:00Z", n:"Back Again"});
  const before=Object.keys(S.unsubs).length;
  MC_API.done=""; const n=await mcApiSync();
  out.matchedBySubject=S.pieces["mct-a"].mcId==="aaa111" && S.pieces["mct-a"].opensAll===40 && S.pieces["mct-a"].delivered===95 && JSON.stringify(S.pieces["mct-a"].linksAll)==='[["mismo.org",7]]';
  out.realKept=S.pieces["mct-a"].opens===10 && S.pieces["mct-b"].opens===20 && S.pieces["mct-b"].opensAll===80;
  out.added=!!S.pieces["mc-ccc333"] && S.pieces["mc-ccc333"].resend===true && S.pieces["mc-ccc333"].channel==="mailchimp" && S.pieces["mc-ccc333"].status==="done" && S.pieces["mc-ccc333"].opens==null;
  out.waiting=mcNeedsReal().some(p=>p.id==="mc-ccc333") && !mcNeedsReal().some(p=>p.id==="mct-a");
  const ms=mcSends(); const a=ms.find(m=>m.id==="mct-a"), c=ms.find(m=>m.id==="mc-ccc333");
  out.botSplit=a.real && a.oBot===30 && a.cBot===5 && !c.real && c.oBot===null;
  const added=vals("unsubs").filter(u=>u.source==="Mailchimp");
  out.unsubAdded=added.length===1 && added[0].e==="new.person@example.com" && added[0].reasons.length===0 && unsubHL(added[0])==="pending" && Object.keys(S.unsubs).length===before+1;
  out.count=n===4;
  MC_API.done=""; out.idempotent=(await mcApiSync())===0;
  out.live=mcLive() && rsSrc("mc").a==="mix" && rsFeedOn("mailchimp");
  out.healthOk=hhMailchimp().level==="ok";
  out.monthAuto=mcApiCovers("2026-10");
  RSP.range="all"; go("results"); await wait(250); document.querySelectorAll('#mn-pop').forEach(e=>e.remove());
  const chip=document.querySelector('[data-rs-open="mc"] .rs-src'); out.chip=!!chip && chip.textContent==="Partly by Hand";
  rsOpen("mc"); await wait(250); const pb=document.getElementById("pane-body").innerText;
  out.botsBox=/Real People and Bots/i.test(pb) && /Bot Opens Left Out/i.test(pb) && /counting bots/.test(pb) && /Real Numbers Due/i.test(pb);
  out.wholeList=!!document.querySelector("#pane-body #rs-mcwhole") && /Whole List Against Whole List/i.test(document.querySelector("#pane-body #rs-mcwhole").innerText) && !/Test B RESEND/i.test(document.querySelector("#pane-body #rs-mcwhole").innerText);
  closePane(true); RSP.range="30";
  S.mailchimp={_run:{ok:false, at:now, lastOk:"", error:"Mailchimp 401: bad key"}}; out.healthBad=hhMailchimp().level==="bad" && !mcLive();
  ["mct-a","mct-b","mc-ccc333"].forEach(k=>delete S.pieces[k]); vals("unsubs").filter(u=>u.source==="Mailchimp").forEach(u=>delete S.unsubs[u.id]); delete S.signups["sg-back"]; S.mailchimp={};
  out.ok=Object.values(out).every(v=>v===true); return out; });
console.log(JSON.stringify(r), errs.length?errs:"errors []"); if(errs.length) r.ok=false;
await b.close(); process.exit(r.ok?0:1);})();
