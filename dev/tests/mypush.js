// Push to MyMISMO (CN-049, Nov 26, 2026): a button on each MISMO Matters edition that has gone out and each Mic'd Up
// episode on YouTube; the words are filled in and editable; it sends only when pressed. The relay is a stand-in here:
// nothing is sent anywhere.
const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1300,height:900}});
const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('file://'+process.cwd()+'/live.html');await p.waitForTimeout(2500);
const r=await p.evaluate(async()=>{ const wait=ms=>new Promise(r=>setTimeout(r,ms)); const out={};
  document.querySelectorAll('[id^=mn-pop]').forEach(e=>e.remove());
  window.ResourcesSession={token:()=>"test-token"};
  const sent=[]; let answer={status:200, body:{ok:true, id:"n1", sent:12, failed:0, removed:0}};
  const realFetch=window.fetch;
  window.fetch=(u,o)=>{ if(String(u).indexOf("/mymismo/push/news")>=0){ sent.push({u, o, body:JSON.parse(o.body)}); const a=answer; return Promise.resolve(new Response(JSON.stringify(a.body),{status:a.status})); }
    if(String(u).indexOf("/podcast/micdup.json")>=0) return Promise.resolve(new Response(JSON.stringify({episodes:[{id:"abcDEF12345",title:"MISMO Mic'd Up Ep 60: Test Title",published:"2026-11-20T15:00:00Z",duration:"PT24M"}]}),{status:200}));
    return realFetch(u,o); };
  /* an edition that hasn't gone out has no button */
  const ed=editionsSorted().find(e=>!e.archived); ed.done=Object.assign({},ed.done,{publish:false});
  S.sections[ed.month+"__vieaux"]=Object.assign({},S.sections[ed.month+"__vieaux"]||{id:ed.month+"__vieaux",month:ed.month,key:"vieaux"},{headline:"Why Data Standards Matter"});
  MS.ed=ed.id; MS.sub="stats"; go("matters"); renderMatters(); await wait(200);
  out.noButtonBefore=!document.querySelector('#page-matters [data-mypush]');
  ed.done.publish=true; renderMatters(); await wait(150);
  const btn=document.querySelector('#page-matters [data-mypush="matters"]'); out.button=!!btn && btn.textContent==="Push to MyMISMO";
  btn.click(); await wait(100);
  const d=document.getElementById("myp-pop");
  out.filled=!!d && d.querySelector("#myp-t").value==="MISMO Matters: "+monthName(ed.month) && d.querySelector("#myp-b").value==="The Vieaux Point: Why Data Standards Matter";
  out.preview=/MyMISMO/.test(d.querySelector(".myp-prev").innerText) && /turned on MISMO Matters and Mic'd Up notifications/.test(d.innerText) && /No sponsor ads/.test(d.innerText);
  out.notSentYet=sent.length===0;
  d.querySelector("#myp-b").value="The Vieaux Point: Why Data Standards Matter (edited)"; d.querySelector("#myp-b").dispatchEvent(new Event("input"));
  d.querySelector("#myp-send").click(); await wait(300);
  const s0=sent[0]||{}; out.payload=s0.body && s0.body.kind==="matters" && s0.body.ref===ed.month && /edited/.test(s0.body.body) && /^https:\/\/resources\.mismo\.org\/media\/matters\//.test(s0.body.url) && s0.o.headers.Authorization==="Bearer test-token" && !s0.body.again;
  out.result=/Sent to 12 phones/.test(document.getElementById("myp-msg").textContent) && !!(S.editions[ed.id].mymismo && S.editions[ed.id].mymismo.n===12);
  mypClose(); renderMatters(); await wait(100);
  out.noted=/Pushed to MyMISMO/.test(document.querySelector('#page-matters .myp-wrap').innerText);
  /* a second push answers 409: offered as Send Again, which sends again:true */
  answer={status:409, body:{error:"ALREADY_SENT", at:"2026-11-26T15:00:00Z"}};
  document.querySelector('#page-matters [data-mypush]').click(); await wait(80); document.querySelector("#myp-send").click(); await wait(250);
  out.already=/Already pushed on Nov 26/.test(document.getElementById("myp-msg").textContent) && document.querySelector("#myp-send").textContent==="Send Again";
  answer={status:200, body:{ok:true, sent:13}}; document.querySelector("#myp-send").click(); await wait(250);
  out.again=sent[sent.length-1].body.again===true; mypClose();
  /* 403 and 404 in plain words */
  answer={status:403, body:{error:"DENIED"}}; document.querySelector('#page-matters [data-mypush]').click(); await wait(80); document.querySelector("#myp-send").click(); await wait(200);
  out.denied=/Only the people Jonna named/.test(document.getElementById("myp-msg").textContent);
  answer={status:404, body:{error:"NOT_FOUND"}}; document.querySelector("#myp-send").click(); await wait(200);
  out.notOn=/aren't switched on yet/.test(document.getElementById("myp-msg").textContent); mypClose();
  /* Mic'd Up: an episode on YouTube */
  const ep=vals("episodes").find(e=>e.airDate); ep.youtubeDone=true; ep.youtubeUrl="https://www.youtube.com/watch?v=abcDEF12345"; ep.title="Test Title"; ep.guests="Pat Guest";
  const html=myPushHtml("micdup", ep); out.epButton=/data-mypush="micdup"/.test(html);
  answer={status:200, body:{ok:true, sent:5}};
  mypOpen("micdup", ep.id, null); await wait(80);
  out.epFilled=document.querySelector("#myp-t").value==="New MISMO Mic'd Up Episode" && document.querySelector("#myp-b").value==="Test Title with Pat Guest";
  document.querySelector("#myp-send").click(); await wait(300);
  const s1=sent[sent.length-1].body; out.epPayload=s1.kind==="micdup" && s1.ref==="abcDEF12345" && s1.video && s1.video.id==="abcDEF12345" && s1.video.duration==="PT24M" && !s1.url;
  mypClose();
  out.health=(hhMyMISMO()||{}).level==="ok";
  const off=Object.assign({},ep,{youtubeDone:false}); out.epNoButton=myPushHtml("micdup", off)==="";
  window.fetch=realFetch;
  out.ok=Object.values(out).every(v=>v===true); return out; });
console.log(JSON.stringify(r), errs.length?errs:"errors []"); if(errs.length) r.ok=false;
await b.close(); process.exit(r.ok?0:1);})();
