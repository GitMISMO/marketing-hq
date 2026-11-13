// A section's button: its own words, shown as a button, a text link, or left out (Nov 13, 2026).
const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1300,height:900}});
const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('file://'+process.cwd()+'/live.html#matters');await p.waitForTimeout(2500);
const r=await p.evaluate(async()=>{ const wait=ms=>new Promise(r=>setTimeout(r,ms));
  const ed=curEdition(); const s=edSections(ed).find(x=>!x.meta.auto && !isLogoSec(x.k) && x.k!=="cert" && !FULL_ARTICLE[x.k]); if(!s) return {ok:false, why:"no section"};
  const id=ed.month+"__"+s.k, U="https://example.com/cta-test";
  const run=async part=>{ await patch("sections", id, Object.assign({on:true, headline:"Cta Test", body:"Words.", ctaUrl:U}, part)); await wait(120); const h=buildEmail(curEdition()); const i=h.indexOf(U); return {has:i>0, btn:i>0 && /<table/.test(h.slice(Math.max(0,i-900), i)) && h.slice(i, i+700).includes("See the Agenda"), words:h.includes("See the Agenda")}; };
  const a=await run({ctaText:"See the Agenda", ctaStyle:""}), l=await run({ctaText:"See the Agenda", ctaStyle:"link"}), n=await run({ctaText:"See the Agenda", ctaStyle:"none"});
  await patch("sections", id, {ctaText:"", ctaStyle:""}); await wait(120); const dflt=buildEmail(curEdition()).includes("Learn More&nbsp;&rarr;");
  const vp=edSections(ed).find(x=>FULL_ARTICLE[x.k]); let full=true;
  if(vp){ await patch("sections", ed.month+"__"+vp.k, {on:true, headline:"Vp", body:"Words.", fullText:"Keep Reading Here"}); await wait(120); full=buildEmail(curEdition()).includes("Keep Reading Here"); }
  return {button:a.has&&a.words, link:l.has&&l.words, none:!n.has, dflt, full, ok:a.has&&a.words&&l.has&&!n.has&&dflt&&full};
});
console.log(JSON.stringify(r), errs.length?errs:"errors []"); if(errs.length) r.ok=false;
await b.close(); process.exit(r.ok?0:1);})();
