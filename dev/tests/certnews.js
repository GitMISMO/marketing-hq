// New certifications from the CMS (Nov 21, 2026): resources.mismo.org/certified/new-certifications.json becomes one
// draft line per certification (tracked by slug + program + product + certifiedOn), first certifications highlighted,
// for Jonna to approve into the Certifications section of MISMO Matters. Nothing is sent or posted.
const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1300,height:900}});
const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('file://'+process.cwd()+'/live.html#matters');await p.waitForTimeout(2500);
const r=await p.evaluate(async()=>{ const wait=ms=>new Promise(r=>setTimeout(r,ms)); const out={};
  const m=document.getElementById("mn-pop"); if(m) m.remove();
  const feed={note:"x", updated:"2026-11-21", certifications:[
    {org:"Docutech",slug:"docutech",program:"eVault",product:"Solex eVault",first:true,type:"First certification",certifiedOn:"2026-11-20"},
    {org:"Aven",slug:"aven",program:"RON",product:"Aven Remote Online Notarization Software",first:false,type:"Renewal 6",certifiedOn:"2026-11-19"},
    {org:"Actualize Consulting",slug:"actualize-consulting",program:"FRAME",product:null,first:true,type:"First certification",certifiedOn:"2026-10-12"},
    {org:"Guidehouse",slug:"guidehouse",program:"Consultant",product:"Consultant",first:false,type:"Renewal 1",certifiedOn:"2026-08-07",newField:"the CMS may add fields"},
    {org:"Crittora",slug:"crittora",program:"FRAME",product:null,first:true,type:"First certification",certifiedOn:"2026-10-12"},
    {org:"Falcon Capital Advisors LLC",slug:"falcon-capital-advisors-llc",program:"FRAME",product:null,first:true,type:"First certification",certifiedOn:"2026-10-12"},
    {org:"TReX (Tidgewell Results Experience)",slug:"trex-tidgewell-results-experience",program:"FRAME",product:null,first:true,type:"First certification",certifiedOn:"2026-10-12"},
    {org:"Viant Eye",slug:"viant-eye",program:"Consultant",product:"Viant Eye",first:false,type:"Renewal",certifiedOn:"2026-08-07"}]};
  const real=window.fetch; window.fetch=(u,o)=>String(u).indexOf("/certified/new-certifications.json")>=0 ? Promise.resolve(new Response(JSON.stringify(feed),{status:200,headers:{"Content-Type":"application/json"}})) : real(u,o);
  /* an edition that went out with Crittora in its Certifications list */
  const eds=editionsSorted(); const sent=eds[0]; sent.dates=Object.assign({},sent.dates,{publish:"2026-11-18"});
  S.sections[sent.month+"__cert"]=Object.assign({id:sent.month+"__cert",month:sent.month,key:"cert"},S.sections[sent.month+"__cert"]||{},{certProgram:"frame",certItems:[{name:"Crittora",path:""},{name:"Falcon Capital Advisors",path:""},{name:"Tidgewell Results eXperience",path:""},{name:"Viant Eye",path:""}]});
  LOADED.add("certnews"); CN.at=0;
  await cnSync(true); await wait(500);
  const xs=vals("certnews");
  out.five=xs.length===8 && xs.every(x=>x.key && x.text && x.org);
  const by=o=>xs.find(x=>x.org===o)||{};
  out.covered=["Crittora","Falcon Capital Advisors LLC","TReX (Tidgewell Results Experience)"].every(o=>by(o).status==="covered") && /MISMO Matters/.test(by("Crittora").coveredBy);
  out.drafts=["Docutech","Aven","Actualize Consulting","Guidehouse","Viant Eye"].every(o=>by(o).status==="draft");   /* Viant Eye's Consultant renewal isn't covered by a FRAME list */
  out.wording=/first MISMO eVault certification, for Solex eVault/.test(by("Docutech").text) && /is now a MISMO Certified FRAME Advisory Partner/.test(by("Actualize Consulting").text)
    && /renewed its MISMO Remote Online Notarization \(RON\) certification for Aven Remote Online Notarization Software \(renewal 6\)/.test(by("Aven").text) && !/for Consultant/.test(by("Guidehouse").text);
  out.keyed=by("Docutech").key==="docutech|evault|solex evault|2026-11-20";
  /* again: nothing new */
  CN.at=0; await cnSync(true); await wait(300); out.noDupes=vals("certnews").length===8;
  /* the card: only Jonna approves */
  MS.sub="sections"; go("matters"); await wait(400);
  const card=document.getElementById("cn-card");
  out.card=!!card && /New Certifications from the CMS/.test(card.innerText) && card.querySelectorAll("tr[data-cn]").length===5 && /First/i.test(card.innerText);
  out.locked=card.querySelector('[data-cna="ok"]').disabled;
  window.ResourcesSession={current:()=>({name:"Jonna Critchley",email:"jcritchley@mismo.org"}), token:()=>"tok"};
  go("matters"); await wait(300);
  const okBtn=document.querySelector('#cn-card tr[data-cn="'+by("Docutech").id+'"] [data-cna="ok"]'); out.unlocked=!okBtn.disabled; okBtn.click(); await wait(500);
  document.querySelector('#cn-card tr[data-cn="'+by("Aven").id+'"] [data-cna="ok"]').click(); await wait(500);
  document.querySelector('#cn-card tr[data-cn="'+by("Guidehouse").id+'"] [data-cna="skip"]').click(); await wait(500);
  const d=S.certnews[by("Docutech").id]; out.approved=d.status==="approved" && !!d.edition && d.decidedBy==="Jonna Critchley" && S.certnews[by("Guidehouse").id].status==="skipped";
  /* in the edition: first certifications on top */
  const ed=S.editions[d.edition]; S.sections[ed.month+"__cert"]=Object.assign({id:ed.month+"__cert",month:ed.month,key:"cert"},S.sections[ed.month+"__cert"]||{});
  const html=buildEmail(ed), txt=buildText(ed);
  out.email=/New MISMO Certifications/.test(html) && /First Certification/.test(html) && html.indexOf("Docutech")>=0 && html.indexOf("Docutech")<html.indexOf("Aven") && !/Guidehouse/.test(html);
  out.text=/First certification: Docutech/.test(txt) && /Renewed:/.test(txt) && /Aven renewed/.test(txt);
  /* the panel: edit the words */
  cnOpen(by("Actualize Consulting").id); await wait(300);
  document.getElementById("f-text").value="Actualize Consulting joins MISMO's FRAME Advisory Partners."; document.getElementById("pf-save").click(); await wait(500);
  out.edited=/joins MISMO/.test(S.certnews[by("Actualize Consulting").id].text) && S.certnews[by("Actualize Consulting").id].status==="draft";
  out.health=(hhCertNews()||{}).level==="ok" && /8 certifications/.test(hhCertNews().line);
  out.ok=Object.values(out).every(v=>v===true); return out; });
console.log(JSON.stringify(r), errs.length?errs:"errors []"); if(errs.length) r.ok=false;
await b.close(); process.exit(r.ok?0:1);})();
