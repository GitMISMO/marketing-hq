// Press releases drafted ahead and posted on release (CN-010, approved by Jonna Nov 22 and 23, 2026): comment
// periods get no release; Draft Now releases are finished and held; the same release moves to Distribution when
// the MMS marks it Ready to Post; Out for Comment shows while inComment is true; the draft never mentions comment.
// CN-013 (approved by Jonna Nov 23, 2026): comment-period releases are erased, archived ones included, and never come back.
const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1300,height:900}});
const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('file://'+process.cwd()+'/live.html');await p.waitForTimeout(2500);
const r=await p.evaluate(async()=>{ const wait=ms=>new Promise(r=>setTimeout(r,ms)); const out={};
  const leaders=[{name:"Pat Quigley",position:"Co-Chair",company:"Acme Servicing"}];
  const ahead={id:"WR2099_01-Final-Release-Announcement",type:"release",kind:"Final Release Announcement",status:"Requested",name:"Test Dataset",publicName:"Test Dataset",workgroup:"Test DWG",
    releaseStatus:"Final",commentOpens:"2026-11-03",commentCloses:"2026-12-03",leaders,pressRelease:true,draftNow:true,readyToPost:false,readyAt:"",stage:"Comment Period",inComment:true};
  const ready={id:"WR2099_02-Final-Release-Announcement",type:"release",kind:"Final Release Announcement",status:"Requested",name:"Ready Dataset",publicName:"Ready Dataset",workgroup:"Test DWG",
    releaseStatus:"Final",leaders,pressRelease:true,draftNow:false,readyToPost:true,readyAt:"2026-11-23",stage:"Release",inComment:false};
  const comment={id:"WR2099_03-LinkedIn-Post",type:"comment",kind:"LinkedIn Post",status:"Requested",name:"Comment Thing",workgroup:"Test DWG",leaders,pressRelease:false,draftNow:false,readyToPost:false,stage:"Comment Period",inComment:true};
  let feed=[ahead, ready, comment]; const tasks=[];
  const realFetch=window.fetch;
  window.fetch=async(u,o)=>{ u=String(u);
    if(u.includes("announcements.json")) return new Response(JSON.stringify({updated:new Date().toISOString(),announcements:feed}),{status:200});
    if(u.includes("catalog.json")) return new Response(JSON.stringify({products:[]}),{status:200});
    if(typeof PR_SEND_FLOW==="string" && PR_SEND_FLOW && u===PR_SEND_FLOW) return new Response(JSON.stringify({ok:true}),{status:200});
    return realFetch(u,o); };
  window.__hqImages=Object.assign(window.__hqImages||{}, { mkdir:async()=>({}), notify:async()=>({ok:true}),
    writer:async(task, material)=>{ tasks.push({task, material}); return JSON.stringify({headline:"MISMO Publishes the Test Dataset",body:"WASHINGTON, D.C. ([DATE]) – MISMO®, the real estate finance industry's standards organization, today announced the release of the Test Dataset.\n\n[QUOTE]\n\nThe Test DWG is led by co-chair Pat Quigley, Acme Servicing.\n\nThe Test Dataset has achieved Final status."}); } });
  window.ResourcesSession={current:()=>({name:"Perry Williams",email:"pwilliams@mismo.org"}), token:()=>"tok"};
  /* an old comment-period release from before the change */
  await put("releases","pr-old-comment",{annId:"WR2099_09-LinkedIn-Post",type:"comment",status:"draft",ann:{id:"WR2099_09-LinkedIn-Post",type:"comment"},createdAt:new Date().toISOString(),draft:{headline:"x",body:"seeking public comment"}});
  /* CN-013: an archived one is erased too, and a Final release still headed "Seeks Public Comment" is rewritten */
  await put("releases","pr-old-archived",{annId:"WR2099_08-LinkedIn-Post",type:"comment",status:"draft",archived:true,ann:{id:"WR2099_08-LinkedIn-Post",type:"comment",pressRelease:false},createdAt:new Date().toISOString(),draft:{headline:"MISMO Seeks Public Comment on Old Thing",body:"x"}});
  const seeks=Object.assign({},ready,{id:"WR2099_04-Final-Release-Announcement",name:"Seeks Dataset",publicName:"Seeks Dataset"});
  await put("releases",prIdFor(seeks.id),{annId:seeks.id,type:"release",status:"draft",ann:seeks,createdAt:new Date().toISOString(),draft:{headline:"MISMO Seeks Public Comment on Seeks Dataset",body:"MISMO is seeking public comment."}});
  feed=[ahead, ready, comment, seeks];
  await prSync(); await wait(300);
  const idA=prIdFor(ahead.id), idR=prIdFor(ready.id), idC=prIdFor(comment.id), idS=prIdFor(seeks.id);
  out.noComment=!prGet(idC);
  out.oldRemoved=!prGet("pr-old-comment") && !prGet("pr-old-archived") && !Object.keys(TRASH.releases||{}).length;
  out.seeksRewritten=!!prGet(idS) && !/comment/i.test(prGet(idS).draft.headline) && /Seeks Public Comment/.test((prGet(idS).draftOld||{}).headline||"");
  /* the MMS refreshes the facts of a comment entry: nothing comes back */
  feed=[ahead, ready, Object.assign({},comment,{summary:"changed"}), seeks]; await prSync(); await wait(200);
  out.notRecreated=!prGet(idC) && !prGet("pr-old-comment") && !prAll().some(r=>/comment/i.test(prTitle(r)));
  feed=[ahead, ready, comment];
  out.started=!!prGet(idA) && !!prGet(idR);
  /* the Writer never sees the comment dates or the timing fields, and is told never to mention public comment */
  const t=tasks.find(x=>/Test Dataset/.test(x.material))||{};
  out.writerFacts=!!t.material && !/commentCloses|commentOpens|inComment|draftNow|2026-12-03/.test(t.material) && /NEVER MENTION PUBLIC COMMENT/.test(t.task);
  /* the page: Draft Now, Ready to Post and Out for Comment are told apart */
  go("press"); renderPress(); await wait(150);
  const rowA=document.querySelector('[data-pr="'+idA+'"]'), rowR=document.querySelector('[data-pr="'+idR+'"]');
  out.tags=!!rowA && !!rowA.querySelector(".pr-tag.dn") && /Out for Comment · closes Dec 3/.test(rowA.innerText) && !!rowR && !!rowR.querySelector(".pr-tag.rp") && !rowR.querySelector(".pr-tag.oc");
  document.querySelector('[data-prv="draftnow"]').click(); await wait(80);
  out.viewDraftNow=!!document.querySelector('[data-pr="'+idA+'"]') && !document.querySelector('[data-pr="'+idR+'"]');
  document.querySelector('[data-prv="ready"]').click(); await wait(80);
  out.viewReady=!document.querySelector('[data-pr="'+idA+'"]') && !!document.querySelector('[data-pr="'+idR+'"]');
  PR.view=""; renderPress();
  /* a release that mentions comment can't get final approval */
  await prSave(idA,{draft:Object.assign({},prGet(idA).draft,{body:prGet(idA).draft.body+"\n\nThe dataset is open for public comment until December 3."})},"");
  out.commentCheck=prChecks(prGet(idA)).some(c=>c.kind==="comment") && !prReady(prGet(idA)).every(x=>x[0]);
  /* finish the Draft Now release: quote, date, final approval; then it's held */
  await prSave(idA,{status:"request", releaseDate:"2026-12-10", draft:Object.assign({},prGet(idA).draft,{body:prGet(idA).draft.body.replace("\n\nThe dataset is open for public comment until December 3.","")})},"");
  await prPutQuote(idA,{text:"This helps.",name:"Pat Quigley",title:"Co-Chair",company:"Acme Servicing",approval:"Approved. Pat",approvalAt:"2026-11-23"});
  PR.sel=idA; renderPress(); await wait(100);
  out.readyToApprove=!document.querySelector("#pr-final").disabled;
  await document.querySelector("#pr-final").onclick(); await wait(150);
  renderPress(); await wait(80);
  out.held=prGet(idA).status==="final" && prHeld(prGet(idA)) && document.querySelector("#pr-van").disabled && document.querySelector("#pr-li").disabled && /Finished and held/.test(document.querySelector("#pr-detail").innerText) && /Finished, Held/.test(document.querySelector("#pr-detail .ch").innerText);
  await prAskLinkedin(idA); out.noPostWhileHeld=!(S.requests||{})["rq-"+idA];
  /* the MMS moves it to Release: same id, same release, now Ready to Post; the Out for Comment mark goes */
  const draftBefore=prGet(idA).draft.body, n0=prAll().length;
  feed=[Object.assign({},ahead,{draftNow:false,readyToPost:true,readyAt:"2026-12-09",stage:"Release",inComment:false}), ready];
  await prSync(); await wait(200); renderPress(); await wait(80);
  const a2=prGet(idA);
  out.moved=prAll().length===n0 && a2.status==="final" && !prHeld(a2) && a2.readyAt==="2026-12-09" && a2.draft.body===draftBefore && !document.querySelector("#pr-van").disabled && !document.querySelector("#pr-li").disabled;
  out.tagsAfter=!!document.querySelector('[data-pr="'+idA+'"] .pr-tag.rp') && !document.querySelector('[data-pr="'+idA+'"] .pr-tag.oc') && (a2.log||[]).some(l=>/Ready to post/.test(l.what));
  await prAskLinkedin(idA); out.postsWhenReady=!!(S.requests||{})["rq-"+idA];
  out.ok=Object.values(out).every(v=>v===true);
  return out;
});
console.log(JSON.stringify(r), errs.length?errs:"errors []"); if(errs.length) r.ok=false;
await b.close(); process.exit(r.ok?0:1);})();
