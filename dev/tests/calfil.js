// Schedule calendar: a channel filter and + on a day to add an item; Work Product Downloads: a date filter (Nov 24, 2026).
const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1300,height:900}});
const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('file://'+process.cwd()+'/live.html');await p.waitForTimeout(2500);
const r=await p.evaluate(async()=>{ const wait=ms=>new Promise(r=>setTimeout(r,ms)); const out={};
  const m0=document.getElementById("mn-pop"); if(m0) m0.remove();
  const t=T(), d1=add(t,1);
  S.pieces.cf1={id:"cf1", channel:"linkedin", title:"Calendar LinkedIn test", date:d1, status:"idea"};
  S.pieces.cf2={id:"cf2", channel:"mailchimp", title:"Calendar Mailchimp test", date:d1, status:"idea"};
  OV.month=d1.slice(0,7); OV.chans=[]; go("overview"); renderOverview(); await wait(150);
  const day=()=>document.querySelector('.cal .d[data-date="'+d1+'"]');
  out.both=/Calendar LinkedIn test/.test(day().innerText) && /Calendar Mailchimp test/.test(day().innerText);
  document.querySelector('[data-calch="linkedin"]').click(); await wait(100);
  out.filtered=/Calendar LinkedIn test/.test(day().innerText) && !/Calendar Mailchimp test/.test(day().innerText) && document.querySelector('[data-calch="linkedin"]').getAttribute("aria-pressed")==="true";
  /* with one channel picked, + opens a new item of that channel on that day */
  let seen=null; const keep=window.newPiece; window.newPiece=(ch,seed)=>{ seen={ch,seed}; };
  day().querySelector("[data-add]").click(); await wait(50);
  out.addOne=!!seen && seen.ch==="linkedin" && seen.seed.date===d1;
  /* with everything showing, + asks which kind first */
  document.querySelector('[data-calch=""]').click(); await wait(100); seen=null;
  day().querySelector("[data-add]").click(); await wait(80);
  const menu=document.querySelector(".calmenu");
  out.menu=!!menu && /Other Comms Task/.test(menu.innerText) && /Mailchimp Send/.test(menu.innerText);
  menu.querySelector('[data-k="other"]').click(); await wait(50);
  out.addPicked=!!seen && seen.ch==="other" && seen.seed.date===d1 && !document.querySelector(".calmenu");
  window.newPiece=keep;
  /* the real pane opens with the date filled in */
  newPiece("other",{date:d1}); await wait(150); const di=[...document.querySelectorAll("input[type=date]")].find(i=>i.value===d1);
  out.pane=!!di && di.value===d1; if(typeof closePane==="function") closePane();
  /* downloads: date filter */
  const now=Date.now(), dayAgo=n=>new Date(now-n*864e5).toISOString();
  S.wpdl={}; S.wpdl.a={id:"a", e:"a@x.org", n:"Ann", product:"Alpha", at:dayAgo(2)}; S.wpdl.b={id:"b", e:"b@x.org", n:"Bo", product:"Beta", at:dayAgo(40)}; S.wpdl.c={id:"c", e:"c@x.org", n:"Cy", product:"Gamma", at:dayAgo(200)};
  DLQ.range=""; DLQ.q="";
  const h=()=>{ const d=document.createElement("div"); d.innerHTML=downloadsCard(); return d; };
  out.all=h().querySelectorAll("tr[data-dl]").length===3 && !!h().querySelector("#dl-range");
  DLQ.range="week"; out.week=h().querySelectorAll("tr[data-dl]").length===1 && /1<\/b> download by/.test(h().querySelector(".dlsum").innerHTML);
  DLQ.range="90"; out.ninety=h().querySelectorAll("tr[data-dl]").length===2;
  DLQ.range="custom"; DLQ.from=localDay(dayAgo(60)); DLQ.to=localDay(dayAgo(30)); const c=h(); out.custom=c.querySelectorAll("tr[data-dl]").length===1 && /Bo/.test(c.innerText) && !!c.querySelector("#dl-from");
  out.csv=dlSorted().filter(dlMatch).length===1;
  DLQ.range=""; DLQ.from=""; DLQ.to="";
  out.ok=Object.values(out).every(v=>v===true); return out; });
console.log(JSON.stringify(r), errs.length?errs:"errors []"); if(errs.length) r.ok=false;
await b.close(); process.exit(r.ok?0:1);})();
