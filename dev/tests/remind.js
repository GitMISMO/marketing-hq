// Remind Amy: On Your Plate shows what's waiting on Amy with one button; the email lists everything,
// Mic'd Up wording keeps its [MM:…] reply buttons, the send is recorded, and a second send within 4 hours asks first.
const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1300,height:900}});
const errs=[];p.on('pageerror',e=>errs.push(e.message)); let asked=0; p.on('dialog',d=>{asked++; d.dismiss();});
await p.goto('file://'+process.cwd()+'/live.html#home');await p.waitForTimeout(2500);
const r=await p.evaluate(async()=>{ const wait=ms=>new Promise(r=>setTimeout(r,ms));
  window.__hqWho="Jonna Critchley"; const sent=[]; window.__hqImages=Object.assign(window.__hqImages||{},{notify:async(to,sub,html)=>{sent.push({to,sub,html});return {ok:true};}});
  const ed=curEdition(); const sec=edSections(ed).find(s=>!s.meta.auto); await patch("sections",sec.id||(ed.month+"__"+sec.key),{status:"review"});
  await put("pieces","p-remind",{title:"Test post for Amy",status:"review",channel:"linkedin"});
  const ep=vals("episodes")[0]; await put("kits",ep.id,Object.assign({},S.kits[ep.id]||{},{liStatus:"review"})); await wait(80);
  go("home"); await wait(200);
  const bar=document.querySelector('.hm-amy'), n=amyCount(amyWaiting());
  document.querySelector('#hm-remind').click(); await wait(400);
  const m=sent[0]||{};
  const res={bar:!!bar, barText:bar?bar.textContent:"", n, to:m.to, subj:m.sub, hasPost:/Test post for Amy/.test(m.html||""), hasMM:/%5BMM%3A/.test(m.html||""), saved:!!(S.settings["amy-remind"]&&S.settings["amy-remind"].count===n)};
  document.querySelector('#hm-remind').click(); await wait(300); res.secondSends=sent.length;
  window.__hqWho="Amy Moses"; go("home"); await wait(150); res.hiddenForAmy=!document.querySelector('.hm-amy');
  res.ok = res.bar && n>=3 && res.to==="amoses@mismo.org" && res.hasPost && res.hasMM && res.saved && res.secondSends===1 && res.hiddenForAmy;
  return res;
});
r.askedBeforeSecond = asked===1; r.ok = r.ok && r.askedBeforeSecond;
console.log(JSON.stringify(r), errs.length?errs:"errors []"); if(errs.length) r.ok=false;
await p.evaluate(()=>{window.__hqWho="Jonna Critchley"; go("home");}); await p.waitForTimeout(200);
const hero=await p.$('.hm-needs'); if(hero) await hero.screenshot({path:'remind.png'});
await b.close(); process.exit(r.ok?0:1);})();
