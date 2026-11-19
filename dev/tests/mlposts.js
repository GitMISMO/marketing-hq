// Each MISMO Matters section becomes its own LinkedIn post with a 1080 x 1080 graphic, waiting for Amy (Nov 19, 2026).
const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1300,height:900}});
const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('file://'+process.cwd()+'/live.html#linkedin');await p.waitForTimeout(2500);
const r=await p.evaluate(async()=>{ const wait=ms=>new Promise(r=>setTimeout(r,ms)); const out={};
  const tasks=[];
  window.__hqImages=Object.assign(window.__hqImages||{}, {mkdir:async()=>({}), writer:async(task,material)=>{ tasks.push({task,material});
    return JSON.stringify({post:"MISMO Matters is out. "+material.split("\n")[1]+"\n\nRead more: "+(material.match(/LINK: (\S+)/)||[])[1]+"\n\n#MISMOMatters #Mortgage", teaser:"The one line that matters."}); }});
  const ed=curEdition(); out.hasEdition=!!ed;
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
  const okBtn=document.querySelector("[data-mlok]"); out.lockedForOthers=!!okBtn && okBtn.disabled;
  await mlApprove(posts[0].id); out.notApprovedByOthers=S.pieces[posts[0].id].status==="review";
  window.ResourcesSession={current:()=>({name:"Amy Moses",email:"amoses@mismo.org"}), token:()=>"tok"};
  renderLinkedin(); await wait(200);
  out.amyCan=!document.querySelector("[data-mlok]").disabled;
  await mlApprove(posts[0].id); out.approved=S.pieces[posts[0].id].status==="ready" && S.pieces[posts[0].id].approvedBy==="Amy Moses";
  /* running it again makes nothing new */
  const before=tasks.length; await mlMakeAll(ed, true); out.noDupes=tasks.length===before && mlPosts(ed).length===secs.length;
  out.ok=Object.values(out).every(v=>v===true);
  return out;
});
console.log(JSON.stringify(r), errs.length?errs:"errors []"); if(errs.length) r.ok=false;
await b.close(); process.exit(r.ok?0:1);})();
