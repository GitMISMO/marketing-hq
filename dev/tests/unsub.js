// Bring In Informz Unsubscribes: reads an Informz export, files new people with the same ids as the
// unsubscribe page (u-<sha1 of the email>), marks them already out of Higher Logic, skips repeats.
// The spreadsheet reader is a small stand-in here (the real one loads from cdn.sheetjs.com).
const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1300,height:900}});
const errs=[];p.on('pageerror',e=>errs.push(e.message)); p.on('dialog',d=>d.accept());
await p.goto('file://'+process.cwd()+'/live.html#people');await p.waitForTimeout(2500);
const r=await p.evaluate(async()=>{ window.__hqWho="Test Person"; const wait=ms=>new Promise(r=>setTimeout(r,ms));
  window.XLSX={read:u=>({SheetNames:["s"],Sheets:{s:new TextDecoder().decode(u)}}),utils:{sheet_to_json:t=>t.trim().split("\n").map(l=>l.split(","))}};
  const T=[]; const ot=window.toast; window.toast=(m,...a)=>{T.push(m); return ot(m,...a)};
  const csv="Email Address,Unsubscribe Date,Mailing\nPat.One@Example.com,11/02/2026 9:14 AM,MISMO Matters\npat.one@example.com,11/02/2026 9:14 AM,dup\nnot-an-email,11/02/2026,x\nsam@lender.example,11/03/2026,MISMO Matters\n";
  const f=new File([csv],"unsubs.csv",{type:"text/csv"});
  await importInformzUnsubs(f); await wait(300);
  const iz=vals("unsubs").filter(u=>u.source==="Informz"), n1=vals("unsubs").length;
  await importInformzUnsubs(f); await wait(200);
  const res={added:iz.length, emails:iz.map(u=>u.e).sort(), allRemoved:iz.every(u=>unsubHL(u)==="removed"),
    ids:iz.map(u=>u.id).sort(), noRepeat:vals("unsubs").length===n1 && /Nothing new/.test(T[T.length-1]||""),
    button:!!document.querySelector('#un-iz')};
  res.ok = res.added===2 && res.emails.join()==="pat.one@example.com,sam@lender.example" && res.allRemoved && res.noRepeat && res.button && res.ids.includes("u-713e257fdcc0");
  return res;
});
console.log(JSON.stringify(r), errs.length?errs:"errors []"); if(errs.length) r.ok=false;
await b.close(); process.exit(r.ok?0:1);})();
