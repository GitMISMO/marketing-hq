// Saving a request as Done emails the requester (MISMO or MBA address, box ticked) with an It's Not Done Yet
// button back to the team; a press release for a work product shows that on the request (Nov 19, 2026).
const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1300,height:900}});
const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('file://'+process.cwd()+'/live.html#requests');await p.waitForTimeout(2500);
const r=await p.evaluate(async()=>{ const wait=ms=>new Promise(r=>setTimeout(r,ms)); const out={};
  const sent=[];
  window.__hqImages=Object.assign(window.__hqImages||{}, {notify:async(to,subj,html)=>{ sent.push({to,subj,html}); return {ok:true}; }});
  const at=new Date().toISOString();
  S.inbox["rq-done1"]={n:"Pat Test",e:"pat@mismo.org",type:"press",workProduct:"yes",workProductName:"Loan Boarding Wrapper Files",title:"Press release: LBWF",details:"Please write a release.",at,source:"form"};
  S.inbox["rq-done2"]={n:"Out Side",e:"someone@gmail.com",type:"linkedin",title:"Outside ask",details:"Post this.",at,source:"form"};
  S.inbox["rq-done3"]={n:"Kim Test",e:"kim@mba.org",type:"linkedin",title:"No email please",details:"Post this.",at,source:"form"};
  go("requests"); await wait(300);
  /* 1: the work product shows on a press request */
  openRequest("rq-done1"); await wait(400);
  const t=document.getElementById("pane-body").innerText;
  out.wp=/Work Product/.test(t) && /Loan Boarding Wrapper Files/.test(t);
  out.boxTicked=document.getElementById("f-emailDone") && document.getElementById("f-emailDone").checked;
  /* 2: saved as Done with the box ticked: one email to the requester with the button back to the team */
  document.getElementById("f-status").value="done"; document.getElementById("f-reply").value="Scheduled for Nov 24.";
  document.getElementById("pf-save").click(); await wait(2500);
  out.sent=sent.length===1 && sent[0].to==="pat@mismo.org" && /Done: your MISMO Media request/.test(sent[0].subj) &&
    /It&rsquo;s Not Done Yet/.test(sent[0].html) && /mailto:jcritchley@mismo.org,amoses@mismo.org,kbradshaw@mismo.org,vrios@mismo.org/.test(sent[0].html) && /Scheduled for Nov 24\./.test(sent[0].html);
  const rec=S.requests["rq-done1"]||{};
  out.saved=rec.status==="done" && !!rec.doneEmailAt && !("emailDone" in rec);
  /* 3: saving it again doesn't email again, and the box isn't offered once it's Done */
  openRequest("rq-done1"); await wait(300); out.noBoxWhenDone=!document.getElementById("f-emailDone");
  document.getElementById("pf-save").click(); await wait(500); out.once=sent.length===1;
  /* 4: an outside address gets no email */
  openRequest("rq-done2"); await wait(300);
  out.outsideUnticked=document.getElementById("f-emailDone") && !document.getElementById("f-emailDone").checked;
  document.getElementById("f-emailDone").checked=true; document.getElementById("f-status").value="done";
  document.getElementById("pf-save").click(); await wait(600); out.outside=sent.length===1 && S.requests["rq-done2"].status==="done";
  /* 5: unticked: no email */
  openRequest("rq-done3"); await wait(300);
  document.getElementById("f-emailDone").checked=false; document.getElementById("f-status").value="done";
  document.getElementById("pf-save").click(); await wait(600); out.unticked=sent.length===1 && S.requests["rq-done3"].status==="done";
  out.ok=Object.values(out).every(v=>v===true);
  return out;
});
console.log(JSON.stringify(r), errs.length?errs:"errors []"); if(errs.length) r.ok=false;
await b.close(); process.exit(r.ok?0:1);})();
