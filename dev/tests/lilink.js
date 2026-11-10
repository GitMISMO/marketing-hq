// A Mic'd Up LinkedIn post whose day has passed stops being past due once its link is pasted (Nov 10, 2026).
const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1300,height:900}});
const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('file://'+process.cwd()+'/live.html#linkedin');await p.waitForTimeout(2500);
const r=await p.evaluate(async()=>{ const wait=ms=>new Promise(r=>setTimeout(r,ms));
  const mon=add(T(),-2); await put("episodes","ep-test-li",{num:"1",season:2,title:"Test",airDate:add(mon,-3),linkedinDate:mon});
  await wait(100); const before=liClosed(S.episodes["ep-test-li"]);
  await patch("episodes","ep-test-li",{linkedinUrl:"https://www.linkedin.com/events/123/"}); await wait(100);
  const after=liClosed(S.episodes["ep-test-li"]);
  const fut=add(T(),5); await put("episodes","ep-test-li2",{num:"2",season:2,airDate:add(fut,-3),linkedinDate:fut,linkedinUrl:"https://www.linkedin.com/events/456/"}); await wait(100);
  const future=liClosed(S.episodes["ep-test-li2"]);
  go("linkedin"); await wait(200);
  return {before, after, future, ok: before===false && after===true && future===false};
});
console.log(JSON.stringify(r), errs.length?errs:"errors []"); if(errs.length) r.ok=false;
await b.close(); process.exit(r.ok?0:1);})();
