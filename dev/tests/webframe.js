// The web edition works inside the website's frame: links open in a new tab, jump links stay on the page,
// and the page tells mismo.org its height (Nov 20, 2026).
const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1300,height:900}});
const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('file://'+process.cwd()+'/live.html#matters');await p.waitForTimeout(2500);
const r=await p.evaluate(()=>{ const out={}; const h=buildWebPage(curEdition());
  const want="<script>(function(){function s(){if(parent!==window)parent.postMessage({type:'mm-matters-height',height:document.documentElement.scrollHeight},'https://www.mismo.org');}addEventListener('load',s);addEventListener('resize',s);setTimeout(s,1500);})();</script></body></html>";
  out.base=/<head>[\s\S]*<base target="_blank">[\s\S]*<\/head>/.test(h);
  out.height=h.endsWith(want);
  const jumps=[...h.matchAll(/<a [^>]*href="#[^"]*"[^>]*>/g)].map(m=>m[0]);
  out.jumpsStay=jumps.every(a=>/target="_self"/.test(a));
  out.scrollScript=/mm-matters-scroll/.test(h);
  window.__h=h; out.ok=Object.values(out).every(v=>v===true); return out; });
/* in a frame, a jump link sends the section's position to the parent page instead of jumping */
const msg=await p.evaluate(async()=>{ const h=window.__h.split("'https://www.mismo.org'").join("'*'");
  const f=document.createElement("iframe"); f.style.cssText="width:900px;height:20000px"; document.body.appendChild(f); f.srcdoc=h; await new Promise(r=>f.onload=r);
  const got=[]; window.addEventListener("message",e=>{ if(e.data&&e.data.type) got.push(e.data); });
  const a=f.contentDocument.querySelector('a[href^="#mm-"]'); if(!a) return {noLinks:true};
  a.click(); await new Promise(r=>setTimeout(r,400)); const s=got.find(m=>m.type==="mm-matters-scroll"); return {scroll:!!s && s.top>0, height:got.some(m=>m.type==="mm-matters-height")}; });
if(!msg.noLinks){ r.inFrame=msg.scroll===true; if(!r.inFrame) r.ok=false; }
console.log(JSON.stringify(r), errs.length?errs:"errors []"); if(errs.length) r.ok=false;
await b.close(); process.exit(r.ok?0:1);})();
