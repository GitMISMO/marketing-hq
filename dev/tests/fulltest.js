const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch(); const report=[];
const TABS=["home","overview","requests","results","matters","micdup","linkedin","youtube","mailchimp","summits","branding","orders","people","lists","news","images","qr","help"];
for(const [w,tag,dark] of [[1440,'desk',false],[1440,'dark',true],[390,'phone',false]]){
  const p=await b.newPage({viewport:{width:w,height:900},colorScheme:dark?'dark':'light'});
  const errs=[]; p.on('pageerror',e=>errs.push(e.message)); p.on('console',m=>{ if(m.type()==='error' && !/net::|Failed to load|ERR_/.test(m.text())) errs.push('console: '+m.text()); });
  await p.route('**/*',r=>r.request().url().startsWith('file:')||r.request().url().startsWith('data:')?r.continue():r.abort());
  await p.goto('file://'+process.cwd()+'/preview.html');await p.waitForTimeout(1200);
  for(const t of TABS){
    errs.length=0;
    const r=await p.evaluate(async t=>{ show(t); await new Promise(r=>setTimeout(r,250)); const el=document.getElementById('page-'+t);
      const txt=el?el.innerText:''; return {len:txt.length, broke:/didn't draw|undefined|NaN|\[object Object\]/.test(txt)?(txt.match(/.{0,40}(didn't draw|undefined|NaN|\[object Object\]).{0,40}/)||[''])[0]:'', ow:document.documentElement.scrollWidth-innerWidth}; }, t);
    if(errs.length||r.broke||r.ow>0||r.len<20) report.push(tag+' '+t+': '+JSON.stringify({errs:errs.slice(0,3),broke:r.broke,overflow:r.ow,len:r.len}));
  }
  await p.close();
}
console.log(report.length?report.join('\n'):'ALL TABS CLEAN');
await b.close();})();
