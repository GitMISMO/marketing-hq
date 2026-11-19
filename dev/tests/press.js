// Press Releases: a feed entry starts a release with Claude's draft; names are checked against the MMS leaders list;
// Amy's reply sets the quote source; a quote needs written approval; sending is Perry's only (Nov 19, 2026).
const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1300,height:900}});
const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('file://'+process.cwd()+'/live.html');await p.waitForTimeout(2500);
const r=await p.evaluate(async()=>{ const wait=ms=>new Promise(r=>setTimeout(r,ms)); const out={};
  const ann={id:"ANN-77 test",type:"release",kind:"publication",status:"approved",name:"Loan Boarding Wrapper Files",publicName:"Loan Boarding Wrapper Files",workgroup:"Servicing Transfer DWG",groupType:"Development Workgroup",
    releaseStatus:"Candidate Recommendation",summary:"Wrapper files for the Loan Boarding Data Segment.",websiteId:"",leaders:[{name:"Pat Quigley",position:"Co-Chair",company:"Acme Servicing"},{name:"Dana Ruiz",position:"Vice-Chair",company:"Beta Bank"}],mmsUrl:"https://mms.example/x"};
  const sent=[]; const notes=[];
  const realFetch=window.fetch;
  window.fetch=async(u,o)=>{ u=String(u);
    if(u.includes("announcements.json")) return new Response(JSON.stringify({updated:new Date().toISOString(),announcements:[ann]}),{status:200});
    if(u.includes("catalog.json")) return new Response(JSON.stringify({products:[]}),{status:200});
    if(typeof PR_SEND_FLOW==="string" && PR_SEND_FLOW && u===PR_SEND_FLOW){ sent.push(JSON.parse(o.body)); return new Response(JSON.stringify({ok:true}),{status:200}); }
    return realFetch(u,o); };
  window.__hqImages=Object.assign(window.__hqImages||{}, {
    mkdir:async()=>({}), notify:async(to,subj,html)=>{ notes.push({to,subj,html}); return {ok:true}; },
    writer:async(task)=>{ if(/Suggest 2 or 3/.test(task)) return JSON.stringify({suggestions:[{name:"Pat Quigley",title:"Co-Chair",company:"Acme Servicing",reason:"Leads the workgroup."},{name:"Brian Vieaux",title:"President",company:"MISMO",reason:"MISMO's voice."}]});
      if(/short, warm email/.test(task)) return JSON.stringify({subject:"Quote request",body:"Hi Pat,\nWould you give us a quote?\nPerry",suggestedQuote:"This helps."});
      return JSON.stringify({headline:"MISMO Publishes Loan Boarding Wrapper Files",body:"WASHINGTON, D.C. ([DATE]) – MISMO®, the real estate finance industry's standards organization, today announced the release of the Loan Boarding Wrapper Files.\n\nWhy it matters.\n\n[QUOTE]\n\nThe files were developed by MISMO's Servicing Transfer DWG, led by co-chairs Pat Quigly, Acme Servicing; and vice-chair Dana Ruiz, Beta Bank. Brian Vieux agrees.\n\nMISMO's work to solve key industry challenges is made possible through the support of its members, champions, sponsors, and lenders (via the Innovation Investment Fee). To learn more about MISMO and opportunities to participate, visit MISMO.org."}); }});
  window.ResourcesSession={current:()=>({name:"Jonna Critchley",email:"jcritchley@mismo.org"}), token:()=>"tok"};
  /* 1: the feed entry starts a release with a first draft */
  await prSync(); await wait(300);
  const id=prIdFor(ann.id), r0=prGet(id);
  out.created=!!r0 && r0.status==="draft" && /Wrapper Files/.test(r0.draft&&r0.draft.headline||"") && id.length<=43 && /^pr-[a-z0-9-]+$/.test(id);
  /* 2: names: the misspelled co-chair and Brian are caught */
  const ck=prChecks(r0).map(c=>c.msg).join(" | ");
  out.names=/Pat Quigly.*misspelling of Pat Quigley/.test(ck) && /Vieaux/.test(ck);
  go("press"); PR.sel=id; renderPress(); await wait(200);
  out.page=!!document.querySelector("#pr-detail") && /Facts from the MMS/i.test(document.querySelector("#pr-detail").innerText) && !!document.querySelector('.hq nav button[data-hq="press"]');
  /* 3: not Perry: Send to Amy and Send as Perry are off */
  out.lockedForOthers=document.querySelector("#pr-amy").disabled && document.querySelector("#pr-qsend").disabled && document.querySelector("#pr-final").disabled;
  /* 4: Perry picks a source and sends to Amy (email to Amy only, with [MM:id]) */
  window.ResourcesSession={current:()=>({name:"Perry Williams",email:"pwilliams@mismo.org"}), token:()=>"tok"};
  await prSuggest(id); renderPress(); await wait(100);
  document.querySelector('input[name="pr-pick"][value="0"]').click(); document.querySelector('input[name="pr-pick"][value="0"]').dispatchEvent(new Event("change"));
  document.querySelector("#pr-se").value="pat@acme.example";
  await document.querySelector("#pr-amy").onclick(); await wait(200);
  out.amyMail=notes.length===1 && notes[0].to==="amoses@mismo.org" && notes[0].subj.includes("[MM:"+id+"]") && /Approve/.test(notes[0].html) && prGet(id).status==="source";
  /* 5: Amy's reply (filed by the Amy Replies flow) approves it */
  S.approvals["r-pr-test"]={id:"r-pr-test", ref:id, decision:"approved", text:"Approved", at:new Date(Date.now()+1000).toISOString(), from:"Amy"};
  await prApplyApprovals(); out.amyApplied=prGet(id).status==="request" && prGet(id).amy.decision==="approved";
  /* 6: a quote without written approval is refused; with it, it goes in where [QUOTE] was */
  await prPutQuote(id,{text:"This helps servicers.",name:"Pat Quigley",title:"Co-Chair",company:"Acme Servicing",approval:"",approvalAt:""});
  const noApproval=!(prGet(id).quote&&prGet(id).quote.text);
  await prPutQuote(id,{text:"This helps servicers. It saves time.",name:"Pat Quigley",title:"Co-Chair",company:"Acme Servicing",approval:"Yes, approved. Pat",approvalAt:"2026-11-20"});
  const r2=prGet(id); out.quote=noApproval && r2.status==="quote" && !/\[QUOTE\]/.test(r2.draft.body) && /“This helps servicers,” said Pat Quigley, Co-Chair at Acme Servicing\. “It saves time\.”/.test(r2.draft.body) && r2.quote.approval==="Yes, approved. Pat";
  /* 7: final approval waits for the date and clean names */
  renderPress(); await wait(100);
  const notReady=document.querySelector("#pr-final").disabled;
  await prSave(id,{releaseDate:"2026-11-24", draft:Object.assign({},prGet(id).draft,{body:prGet(id).draft.body.replace("Pat Quigly","Pat Quigley").replace("Brian Vieux agrees.","")})},"");
  renderPress(); await wait(100);
  out.final=notReady && !document.querySelector("#pr-final").disabled && /November 24, 2026/.test(prText(prGet(id)));
  await document.querySelector("#pr-final").onclick(); await wait(150);
  out.approved=prGet(id).status==="final";
  /* 8: distribution: MISMO Matters and LinkedIn records */
  await prOfferMatters(id); await prAskLinkedin(id);
  out.dist=!!S.news["n-"+id] && S.news["n-"+id].kind==="press" && !!S.requests["rq-"+id] && S.requests["rq-"+id].type==="linkedin";
  /* 9: sending as Perry posts to the flow with the sign-in token (only when the flow is set up) */
  if(PR_SEND_FLOW){ await prSave(id,{request:Object.assign({},prGet(id).request,{to:"pat@acme.example",body:"Hi"})},""); await prSendRequest(id);
    out.sendAs=sent.length===1 && sent[0].token==="tok" && sent[0].to==="pat@acme.example" && sent[0].ccAmy===true && /DRAFT PRESS RELEASE/.test(sent[0].html); }
  else out.sendAs="flow not set";
  out.health=/MMS Announcements Feed/.test(JSON.stringify(hhPress()));
  out.ok=Object.values(out).every(v=>v===true||v==="flow not set");
  return out;
});
console.log(JSON.stringify(r), errs.length?errs:"errors []"); if(errs.length) r.ok=false;
await b.close(); process.exit(r.ok?0:1);})();
