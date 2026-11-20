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
  out.ok=Object.values(out).every(v=>v===true); return out; });
console.log(JSON.stringify(r), errs.length?errs:"errors []"); if(errs.length) r.ok=false;
await b.close(); process.exit(r.ok?0:1);})();
