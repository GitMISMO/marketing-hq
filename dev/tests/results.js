// Results is a page of summary cards (Nov 21, 2026, Jonna: not an endless scroll). Pressing a card opens the full
// detail in the right-hand panel; Previous and Next move between channels. The detail is the same as before:
// MISMO Matters in depth, every Mailchimp send, LinkedIn, Mic'd Up, the lists and the tools to bring numbers in.
const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1300,height:900}});
const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('file://'+process.cwd()+'/live.html#results');await p.waitForTimeout(2500);
const r=await p.evaluate(async()=>{ const wait=ms=>new Promise(r=>setTimeout(r,ms)); const out={};
  const ed=editionsSorted()[0]; ed.dates=Object.assign({},ed.dates,{publish:ed.month+"-15"});
  ed.stats={recipients:1000, delivered:950, opens:190, clicks:19, unsubs:3, unsubsHL:1, unsubsPage:2, hard:30, blocked:15, soft:5, totalOpens:240, forwards:12,
    cDesktop:40, cMobile:35, cUnknown:25, w1Label:"Recent Openers", w1Sent:400, w1Delivered:395, w1Opens:120, w1Clicks:12, w2Label:"Everyone Else", w2Sent:600, w2Delivered:555, w2Opens:70, w2Clicks:7,
    topLinks:"President's Vieaux Point (mismo.org/about-mismo) — 37 people\nMCD page — 12 people"};
  const y=String(new Date().getFullYear());
  [[y+"-03-02","Spring Summit",5000,4900,1200,60],[y+"-04-10","AI Governance webinar",6000,5800,1500,90],[y+"-04-12","Resend: AI Governance webinar",3000,2950,300,20],[y+"-05-01","test",3,3,3,0]].forEach(([d,n,s,dl,o,c],i)=>{
    S.pieces["mc-t"+i]={id:"mc-t"+i, channel:"mailchimp", title:n, mcName:n, date:d, status:"done", sent:s, delivered:dl, opens:o, clicks:c, unsubs:2, bounces:s-dl, links:[["mismo.org/events/summit",40]]}; });
  /* LinkedIn: only the page's daily totals so far */
  for(let i=1;i<=5;i++) S.pieces["lid"+i]={id:"lid"+i, channel:"linkedin", title:"LinkedIn page", date:"2026-10-0"+i, status:"done", kind:"Daily totals", impressions:100*i, clicks:i, reactions:2*i};
  go("results"); await wait(400); const m=document.getElementById("mn-pop"); if(m) m.remove();
  const page=document.getElementById("page-results");
  out.short=page.scrollHeight<2200;
  out.cards=document.querySelectorAll("#rs-cards .rs-card").length===9 && !page.querySelector("#rs-mm") && !page.querySelector("#rs-tools");
  const card=k=>page.querySelector('[data-rs-open="'+k+'"]');
  out.mmCard=/20\.0%/.test(card("mm").innerText);
  out.liCard=/1,500/.test(card("li").innerText) && /page impressions, October/i.test(card("li").innerText) && /none yet/.test(card("li").innerText);
  /* MISMO Matters in the panel */
  card("mm").click(); await wait(350);
  const pane=document.getElementById("pane"), body=()=>document.getElementById("pane-body"), txt=()=>body().innerText;
  out.open=pane.classList.contains("open") && /MISMO Matters/.test(document.getElementById("pane-title").textContent) && card("mm").classList.contains("on");
  out.mm=/20\.0%/.test(body().querySelector("#rs-mm .rs-kpis").innerText) && /Recent Openers/.test(txt()) && /30\.4%/.test(txt()) && /hard bounce/i.test(txt()) && /37 people/.test(txt()) && /President's Vieaux Point/.test(txt()) && /Desktop/.test(txt());
  /* Next: Mailchimp */
  [...document.querySelectorAll("#pane-foot button")].find(x=>/Mailchimp/.test(x.textContent)).click(); await wait(300);
  out.mc=/Mailchimp · /.test(document.getElementById("pane-title").textContent) && body().querySelectorAll("#rs-mc svg circle.rs-dot").length===3 && body().querySelectorAll("#rs-mc svg circle.rs-re").length===1 && /small send/.test(txt()) && /AI Governance & FRAME/.test(txt()) && /mismo\.org\/events\/summit/.test(txt());
  out.tip=(()=>{ const d=body().querySelector("#rs-mc .rs-dot"); d.dispatchEvent(new MouseEvent("mousemove",{bubbles:true,clientX:300,clientY:300})); const t=document.getElementById("rs-tip"); return !!t && t.style.display==="block" && /delivered/.test(t.textContent); })();
  /* LinkedIn: daily totals are not posts */
  rsOpen("li"); await wait(250);
  out.liPane=/Page Impressions/.test(txt()) && /No single posts are here yet/.test(txt()) && body().querySelectorAll("#rs-li .wt-bar").length===5 && !/Posts That Reached/i.test(txt());
  S.pieces.lp1={id:"lp1", channel:"linkedin", title:"MISMO opens Winter Summit registration", date:"2026-10-03", status:"done", impressions:900, clicks:30, reactions:12, postedUrl:"https://www.linkedin.com/feed/update/1"};
  renderResults(); await wait(250);
  out.liPosts=/Winter Summit registration/.test(txt()) && /Posts That Reached/i.test(txt()) && /Winter Summit registration/.test(card("li").innerText);
  /* the lists: where the website sign-ups come from, and straight to them */
  rsOpen("lists"); await wait(250);
  out.lists=/Website sign-ups/i.test(txt()) && /MISMO Matters list/.test(txt()) && /Where the .* Website Sign-Ups Come From/i.test(txt()) && /May 1 and Sept 8/.test(txt());
  body().querySelector('[data-rs-people="subscribers"]').click(); await wait(300);
  out.toPeople=TAB==="people" && PL.list==="subscribers" && !pane.classList.contains("open");
  /* the tools */
  go("results"); await wait(300); rsOpen("tools"); await wait(250);
  out.tools=!!body().querySelector("#rs-yt") && !!body().querySelector("#rs-mcfile") && !!body().querySelector("#rs-lifile");
  /* Escape closes it and the card gets the focus back */
  document.dispatchEvent(new KeyboardEvent("keydown",{key:"Escape",bubbles:true})); await wait(300);
  out.closed=!pane.classList.contains("open");
  out.ok=Object.values(out).every(v=>v===true); return out; });
console.log(JSON.stringify(r), errs.length?errs:"errors []"); if(errs.length) r.ok=false;
await b.close(); process.exit(r.ok?0:1);})();
