// New certifications from the CMS (Nov 21, 2026): resources.mismo.org/certified/new-certifications.json becomes one
// draft line per certification (tracked by slug + program + product + certifiedOn), first certifications highlighted,
// for Jonna to approve into the Certifications section of MISMO Matters. Nothing is sent or posted.
// New providers only (Jonna, Nov 21): a company's first MISMO certification of any kind. Snapdocs' first RON
// certification isn't new when Snapdocs renews eVault, and Docutech isn't new when it renews eClosing.
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
    {org:"Viant Eye",slug:"viant-eye",program:"Consultant",product:"Viant Eye",first:false,type:"Renewal",certifiedOn:"2026-08-07"},
    {org:"Docutech",slug:"docutech",program:"eClosing",product:"Solex eClosing",first:false,type:"Renewal 2",certifiedOn:"2026-09-02"},
    {org:"Snapdocs",slug:"snapdocs",program:"RON",product:"Snapdocs RON",first:true,type:"First certification",certifiedOn:"2026-11-12"},
    {org:"Snapdocs",slug:"snapdocs",program:"eVault",product:"Snapdocs eVault",first:false,type:"Renewal 1",certifiedOn:"2026-07-15"},
    {org:"Take Three Technologies",slug:"take-three-technologies",program:"RON",product:"Take Three RON",first:true,type:"First certification",certifiedOn:"2026-11-10"},
    {org:"Brand New Co",slug:"brand-new-co",program:"eNote",product:"X",first:true,newProvider:false,type:"First certification",certifiedOn:"2026-11-09"}]};
  const real=window.fetch; window.fetch=(u,o)=>String(u).indexOf("/certified/new-certifications.json")>=0 ? Promise.resolve(new Response(JSON.stringify(feed),{status:200,headers:{"Content-Type":"application/json"}})) : real(u,o);
  /* an edition that went out with Crittora in its Certifications list */
  const eds=editionsSorted(); const sent=eds[0]; sent.dates=Object.assign({},sent.dates,{publish:"2026-11-18"});
  S.sections[sent.month+"__cert"]=Object.assign({id:sent.month+"__cert",month:sent.month,key:"cert"},S.sections[sent.month+"__cert"]||{},{certProgram:"frame",certItems:[{name:"Crittora",path:""},{name:"Falcon Capital Advisors",path:""},{name:"Tidgewell Results eXperience",path:""},{name:"Viant Eye",path:""}]});
  LOADED.add("certnews"); CN.at=0;
  /* a renewal drafted before Jonna said new certifications only: set aside, not deleted */
  await put("certnews","cn-old-renewal",{key:"aven|ron|x|2026-11-19",org:"Aven",program:"RON",first:false,type:"Renewal 6",certifiedOn:"2026-11-19",text:"Aven renewed",status:"draft"});
  /* Snapdocs' RON drafted before Jonna said new providers only: set aside, not deleted */
  await put("certnews","cn-old-snap",{key:"snapdocs|ron|snapdocs ron|2026-11-12",org:"Snapdocs",slug:"snapdocs",program:"RON",first:true,type:"First certification",certifiedOn:"2026-11-12",text:"Snapdocs earned",status:"draft",feed:feed.certifications[9]}); await wait(200);
  await cnSync(true); await wait(500);
  const xs=vals("certnews");
  out.five=xs.filter(x=>x.first && x.newProvider!==false).length===5 && xs.every(x=>x.key && x.text && x.org) && !xs.some(x=>["Guidehouse","Viant Eye","Docutech","Brand New Co"].includes(x.org));
  out.renewalsOut=S.certnews["cn-old-renewal"].status==="skipped" && /new providers only/.test(S.certnews["cn-old-renewal"].skipReason);
  out.snapOut=S.certnews["cn-old-snap"].status==="skipped" && S.certnews["cn-old-snap"].newProvider===false && /already holds another MISMO certification/.test(S.certnews["cn-old-snap"].skipReason);
  out.rule=!cnNewProvider(feed.certifications[0],feed.certifications) && cnNewProvider(feed.certifications[11],feed.certifications) && !cnNewProvider(feed.certifications[12],feed.certifications)
    && cnNewProvider({slug:"twin",program:"RON",product:"a",first:true,certifiedOn:"2026-11-01"},[{slug:"twin",program:"eVault",product:"b",first:true,certifiedOn:"2026-11-01"}]);
  const by=o=>xs.find(x=>x.org===o)||{};
  out.covered=["Crittora","Falcon Capital Advisors LLC","TReX (Tidgewell Results Experience)"].every(o=>by(o).status==="covered") && /MISMO Matters/.test(by("Crittora").coveredBy);
  out.drafts=["Take Three Technologies","Actualize Consulting"].every(o=>by(o).status==="draft");
  out.wording=/first MISMO eVault certification, for Solex eVault/.test(cnDraft(feed.certifications[0])) && /is now a MISMO Certified FRAME Advisory Partner/.test(by("Actualize Consulting").text)
    && /renewed its MISMO Remote Online Notarization \(RON\) certification for Aven Remote Online Notarization Software \(renewal 6\)/.test(cnDraft(feed.certifications[1])) && !/for Consultant/.test(cnDraft(feed.certifications[3]));
  out.keyed=by("Take Three Technologies").key==="take-three-technologies|ron|take three ron|2026-11-10";
  /* again: nothing new */
  CN.at=0; await cnSync(true); await wait(300); out.noDupes=vals("certnews").length===7;
  /* the card: only Jonna approves */
  MS.sub="sections"; go("matters"); await wait(400);
  const card=document.getElementById("cn-card");
  out.card=!!card && /New Certifications from the CMS/.test(card.innerText) && card.querySelectorAll("tr[data-cn]").length===2 && /renewals and companies already certified aren't included/.test(card.innerText) && !/Snapdocs|Docutech/.test(card.innerText)
    && !!document.getElementById("ms-rows") && !!(document.getElementById("ms-rows").compareDocumentPosition(card) & Node.DOCUMENT_POSITION_FOLLOWING) && /First/i.test(card.innerText);
  out.locked=card.querySelector('[data-cna="ok"]').disabled;
  window.ResourcesSession={current:()=>({name:"Jonna Critchley",email:"jcritchley@mismo.org"}), token:()=>"tok"};
  go("matters"); await wait(300);
  const okBtn=document.querySelector('#cn-card tr[data-cn="'+by("Take Three Technologies").id+'"] [data-cna="ok"]'); out.unlocked=!okBtn.disabled; okBtn.click(); await wait(500);
  const d=S.certnews[by("Take Three Technologies").id]; out.approved=d.status==="approved" && !!d.edition && d.decidedBy==="Jonna Critchley";
  /* in the edition: first certifications on top */
  const ed=S.editions[d.edition]; S.sections[ed.month+"__cert"]=Object.assign({id:ed.month+"__cert",month:ed.month,key:"cert"},S.sections[ed.month+"__cert"]||{});
  const html=buildEmail(ed), txt=buildText(ed);
  out.email=/New MISMO Certifications/.test(html) && /First Certification/.test(html) && html.indexOf("Take Three Technologies")>=0 && !/Aven|Snapdocs|Docutech/.test(html) && !/Renewed/.test(html);
  out.text=/First certification: Take Three Technologies/.test(txt) && !/Renewed:/.test(txt);
  /* the panel: edit the words */
  cnOpen(by("Actualize Consulting").id); await wait(300);
  document.getElementById("f-text").value="Actualize Consulting joins MISMO's FRAME Advisory Partners."; document.getElementById("pf-save").click(); await wait(500);
  out.edited=/joins MISMO/.test(S.certnews[by("Actualize Consulting").id].text) && S.certnews[by("Actualize Consulting").id].status==="draft";
  out.health=(hhCertNews()||{}).level==="ok" && /13 certifications/.test(hhCertNews().line) && /5 new providers; renewals and companies already certified left out/.test(hhCertNews().line);
  /* the CMS's own newProvider field (added Nov 21, 2026) decides for records already read: Crittora set aside */
  feed.certifications[4].newProvider=false; CN.at=0; await cnSync(true); await wait(400);
  out.cmsField=by("Crittora").id && S.certnews[by("Crittora").id].status==="skipped" && /CMS's newProvider field/.test(S.certnews[by("Crittora").id].skipReason)
    && S.certnews[by("Take Three Technologies").id].status==="approved";
  out.ok=Object.values(out).every(v=>v===true); return out; });
console.log(JSON.stringify(r), errs.length?errs:"errors []"); if(errs.length) r.ok=false;
await b.close(); process.exit(r.ok?0:1);})();
