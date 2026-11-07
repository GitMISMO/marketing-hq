// Thank You to Our Sponsors reads Sponsorship Portal records: a custom Series package counts only at the summits it
// lists, at that summit's tier; blank custom lines fall back to the record's tier for all three summits.
const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('file://'+process.cwd()+'/live.html#matters');await p.waitForTimeout(2500);
const r=await p.evaluate(()=>{ SPN.apps=[
 {id:"a1",status:"Paid",event:"Winter 2027",company:"Alpha Co",level2027:"GOLD"},
 {id:"a2",status:"Approved",event:"2027 Series",company:"Beta Lending",level2027:"PLATINUM"},
 {id:"a3",status:"Paid",event:"2027 Series",company:"Gamma Tech",level2027:"SILVER",custom:[{s:"Spring",tier:"GOLD"},{s:"Fall",tier:"SILVER"}]},
 {id:"a4",status:"Paid",event:"2027 Series",company:"Delta Data",level2027:"BRONZE",custom:[{s:"Winter",tier:"PLATINUM"},{s:"Fall",tier:"GOLD"},{s:"",tier:""}]},
 {id:"a5",status:"Paid",event:"2027 Series",company:"Eps Inc",level2027:"SILVER",custom:[{s:"",tier:""}]},
 {id:"a6",status:"Declined",event:"2027 Series",company:"Zeta",level2027:"GOLD"}];
 const out={}; for(const n of ["Winter 2027","Spring 2027","Fall 2027"]){ const sm={name:n,year:2027}; out[n]=sponList(sm).map(a=>a.company+":"+sponTier(a,sm)).join(", "); } return out; });
const want={"Winter 2027":"Beta Lending:PLATINUM, Delta Data:PLATINUM, Alpha Co:GOLD, Eps Inc:SILVER","Spring 2027":"Beta Lending:PLATINUM, Gamma Tech:GOLD, Eps Inc:SILVER","Fall 2027":"Beta Lending:PLATINUM, Delta Data:GOLD, Eps Inc:SILVER, Gamma Tech:SILVER"};
const ok=!errs.length && Object.keys(want).every(k=>r[k]===want[k]);
console.log(JSON.stringify({ok, r}), errs.length?errs:"errors []"); await b.close(); process.exit(ok?0:1);})();
