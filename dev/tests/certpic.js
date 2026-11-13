// The Certifications spotlight shows its lead picture and quote after the highlighted company's text (Nov 13, 2026).
const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1300,height:900}});
const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('file://'+process.cwd()+'/live.html#matters');await p.waitForTimeout(2500);
const r=await p.evaluate(async()=>{ const wait=ms=>new Promise(r=>setTimeout(r,ms));
  const ed=curEdition(); const s=edSections(ed).find(x=>x.k==="cert"); if(!s) return {ok:false, why:"no cert section"};
  const id=s.id||(ed.month+"__cert");
  await patch("sections", id, {on:true, certProgram:(s.doc.certProgram||"frame"), certItems:[{name:"Teraverde Financial"}], body:"Intro.\n[Certified List]\nThis month, we're highlighting Teraverde.", imageUrl:"https://example.com/headshot-test.png", imageSize:"full", quote:"FRAME gives us a practical way.", quoteBy:"Test Person, Founder"});
  await wait(150);
  const h=buildEmail(curEdition()); const i=h.indexOf("headshot-test.png"), q=h.indexOf("FRAME gives us a practical way"), t=h.indexOf("highlighting Teraverde");
  return {pic:i>0, quote:q>0, order:t>0 && i>t && q>i, ok:i>0 && q>0 && t>0 && i>t && q>i};
});
console.log(JSON.stringify(r), errs.length?errs:"errors []"); if(errs.length) r.ok=false;
await b.close(); process.exit(r.ok?0:1);})();
