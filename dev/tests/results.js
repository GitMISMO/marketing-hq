// Results leads with the numbers: MISMO Matters in depth (waves, delivery, links, where people read), every Mailchimp send
// with its chart, topics and links, and the tools to bring numbers in at the very bottom (Nov 20, 2026).
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
  go("results"); await wait(400); const m=document.getElementById("mn-pop"); if(m) m.remove();
  const page=document.getElementById("page-results"), txt=page.innerText;
  const order=["rs-mm","rs-mc","rs-tools"].map(id=>{ const e=document.getElementById(id); return e?[...page.querySelectorAll("*")].indexOf(e):-1; });
  out.order=order.every(x=>x>=0) && order[0]<order[1] && order[1]<order[2];
  out.mm=/20\.0%/.test(document.querySelector("#rs-mm .rs-kpis").innerText) && /Recent Openers/.test(txt) && /30\.4%/.test(txt) && /hard bounce/i.test(txt) && /37 people/.test(txt) && /President's Vieaux Point/.test(txt) && /Desktop/.test(txt);
  out.mc=/Mailchimp · /.test(txt) && document.querySelectorAll("#rs-mc svg circle.rs-dot").length===3 && document.querySelectorAll("#rs-mc svg circle.rs-re").length===1 && /small send/.test(txt) && /AI Governance & FRAME/.test(txt) && /mismo\.org\/events\/summit/.test(txt);
  out.lists=/Website sign-ups/.test(txt) && /MISMO Matters list/.test(txt);
  out.tip=(()=>{ const d=document.querySelector("#rs-mc .rs-dot"); d.dispatchEvent(new MouseEvent("mousemove",{bubbles:true,clientX:300,clientY:300})); const t=document.getElementById("rs-tip"); return !!t && t.style.display==="block" && /delivered/.test(t.textContent); })();
  out.tools=!!document.querySelector("#rs-tools #rs-yt") && !!document.querySelector("#rs-tools #rs-mc");
  out.ok=Object.values(out).every(v=>v===true); return out; });
console.log(JSON.stringify(r), errs.length?errs:"errors []"); if(errs.length) r.ok=false;
await b.close(); process.exit(r.ok?0:1);})();
