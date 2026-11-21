// Each MISMO Matters section becomes its own LinkedIn post with a 1080 x 1080 graphic, waiting for Amy; the card folds up (Nov 19, 2026).
const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1300,height:900}});
const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('file://'+process.cwd()+'/live.html#linkedin');await p.waitForTimeout(2500);
const r=await p.evaluate(async()=>{ const wait=ms=>new Promise(r=>setTimeout(r,ms)); const out={};
  const tasks=[];
  window.__hqImages=Object.assign(window.__hqImages||{}, {mkdir:async()=>({}), writer:async(task,material)=>{ tasks.push({task,material});
    return JSON.stringify({post:"MISMO Matters is out. "+material.split("\n")[1]+"\n\nRead more: "+(material.match(/LINK: (\S+)/)||[])[1]+"\n\n#MISMOMatters #Mortgage", teaser:"The one line that matters."}); }});
  const ed=mlEdition(); out.hasEdition=!!ed;
  const secs=mlSections(ed); out.sections=secs.length>0;
  go("linkedin"); await wait(300);
  out.card=!!document.querySelector("#ml-card") && /as LinkedIn Posts/.test(document.querySelector("#ml-card").innerText);
  /* the graphic: a real 1080 x 1080 PNG, even with no header banner reachable (file://) */
  const blob=await mlCard(ed, secs[0], "A teaser line for the card.");
  const bmp=blob && await createImageBitmap(blob);
  out.graphic=!!blob && blob.type==="image/png" && blob.size>5000 && bmp.width===1080 && bmp.height===1080;
  /* make them all: one post per section, no date, Ready for Review, from the edition */
  await mlMakeAll(ed, true); await wait(300);
  const posts=mlPosts(ed);
  out.allMade=posts.length===secs.length && posts.every(x=>x.status==="review" && !x.date && x.kind==="MISMO Matters" && /#MISMOMatters/.test(x.copy));
  out.factsOnly=tasks.length===secs.length && tasks.every(t=>/never add or guess/.test(t.task) && /SECTION: /.test(t.material));
  out.links=posts.every(x=>/^https?:\/\//.test(x.link));
  /* only Amy can approve */
  renderLinkedin(); await wait(200);
  out.rows=document.querySelectorAll("#ml-card tr[data-mlrow]").length===secs.length && !document.querySelector("#ml-make");
  document.querySelector('#ml-card tr[data-mlrow="'+posts[0].fromSec+'"]').click(); await wait(300);
  const okBtn=document.querySelector('#pane-body [data-mla="ok"]'); out.lockedForOthers=!!okBtn && okBtn.disabled && !!document.querySelector("#pane-body #f-copy") && /for Amy, Jonna and Vanessa/.test(document.querySelector("#pane-body .ml-who").innerText) && document.querySelector('#pane-body [data-mla="posted"]').disabled;
  /* the card folds up to its header and stays that way after a redraw */
  closePane(true); document.querySelector("#ml-tog").click(); await wait(100);
  const folded=()=>{ const b=document.querySelector("#ml-body"); return document.querySelector("#ml-card").classList.contains("closed") && b && b.offsetHeight===0; };
  out.folds=folded() && document.querySelector("#ml-tog").getAttribute("aria-expanded")==="false";
  renderLinkedin(); await wait(200); out.staysFolded=folded();
  document.querySelector("#ml-tog").click(); await wait(100); out.opens=!document.querySelector("#ml-card").classList.contains("closed") && document.querySelector("#ml-body").offsetHeight>0;
  await mlApprove(posts[0].id); out.notApprovedByOthers=S.pieces[posts[0].id].status==="review";
  window.ResourcesSession={current:()=>({name:"Amy Moses",email:"amoses@mismo.org"}), token:()=>"tok"};
  closePane(true); renderLinkedin(); await wait(200);
  mlOpen(ed, posts[0].fromSec); await wait(300);
  out.amyCan=!document.querySelector('#pane-body [data-mla="ok"]').disabled; closePane(true);
  await mlApprove(posts[0].id); out.approved=S.pieces[posts[0].id].status==="ready" && S.pieces[posts[0].id].approvedBy==="Amy Moses";
  /* Jonna and Vanessa can approve too (Nov 21, 2026), under their own names */
  window.ResourcesSession={current:()=>({name:"Vanessa Rios",email:"vrios@mismo.org"}), token:()=>"tok"};
  await patch("pieces", posts[0].id, {status:"review", approvedBy:""}); await wait(200);
  await mlApprove(posts[0].id); out.vanessaApproves=S.pieces[posts[0].id].status==="ready" && S.pieces[posts[0].id].approvedBy==="Vanessa Rios";
  /* Amy posted it herself: Jonna puts the date and the live link in, and it clears (Posted), with the post's own link kept */
  window.ResourcesSession={current:()=>({name:"Jonna Critchley",email:"jcritchley@mismo.org"}), token:()=>"tok"};
  const keep=S.pieces[posts[0].id].link;
  mlOpen(ed, posts[0].fromSec); await wait(300);
  document.getElementById("f-link").value="https://www.linkedin.com/feed/update/urn:li:activity:123"; document.getElementById("f-date").value="11/20/26";
  document.getElementById("pf-save").click(); await wait(500);
  const q=S.pieces[posts[0].id]; out.clearsWithLink=q.status==="done" && /activity:123/.test(q.postedUrl) && q.link===keep && q.postedBy==="Jonna Critchley" && q.date==="2026-11-20";
  mlOpen(ed, posts[1].fromSec); await wait(300); document.querySelector('#pane-body [data-mla="posted"]').click(); await wait(500);
  out.markPosted=S.pieces[posts[1].id].status==="done";
  renderLinkedin(); await wait(200); out.postedCount=/2<\/b> posted/.test(document.querySelector("#ml-card .ml-sub").innerHTML);
  closePane(true); await patch("pieces", posts[1].id, {status:"review", postedUrl:"", postedBy:""}); await wait(300);
  window.ResourcesSession={current:()=>({name:"Amy Moses",email:"amoses@mismo.org"}), token:()=>"tok"};
  /* Don't Post: Amy, Jonna or Vanessa, shows as Not Posting, can be brought back, and isn't remade */
  await mlSkip(posts[1].id); out.skipped=S.pieces[posts[1].id].status==="canceled";
  renderLinkedin(); await wait(200); out.notPostingShown=/Not Posting/.test(document.querySelector("#ml-card").innerText);
  mlOpen(ed, posts[1].fromSec); await wait(300); out.backBtn=!!document.querySelector('#pane-body [data-mla="back"]'); closePane(true);
  await mlUnskip(posts[1].id); out.backAgain=S.pieces[posts[1].id].status==="review";
  await mlSkip(posts[1].id);
  /* running it again makes nothing new */
  const before=tasks.length; await mlMakeAll(ed, true); out.noDupes=tasks.length===before && mlPosts(ed).length===secs.length && S.pieces[posts[1].id].status==="canceled";
  /* company logos: the company the section names most, from the Image Library (Amy, Nov 20, 2026) */
  S.images["img-acme-logo"]={id:"img-acme-logo", name:"AcmeLendingLogo", campaign:"matters", w:400, h:120};
  S.images["img-other-logo"]={id:"img-other-logo", name:"Other Co Logo", company:"Other Co", campaign:"logos", w:400, h:120};
  const fake=k=>({k, s:{doc:{}}, text:"A list: Other Co. This month we feature Acme Lending. Acme Lending helps lenders. Learn about Acme Lending."});
  out.logoPicked=mlLogoPicks(ed, fake("sponsor")).map(i=>i.id).join()==="img-acme-logo" && mlLogoPicks(ed, fake("summit")).length===0;
  out.ok=Object.values(out).every(v=>v===true);
  return out;
});
console.log(JSON.stringify(r), errs.length?errs:"errors []"); if(errs.length) r.ok=false;
await b.close(); process.exit(r.ok?0:1);})();
