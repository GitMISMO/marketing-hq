// The Writer's answers are read even when it puts real line breaks inside a JSON string (Nov 23, 2026: press release
// first drafts failed about one time in four with "the Writer sent back something unexpected").
const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage();
const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('file://'+process.cwd()+'/preview.html');await p.waitForTimeout(1500);
const r=await p.evaluate(()=>{ const out={};
  const nl=String.fromCharCode(10), tab=String.fromCharCode(9);
  const raw='{"headline": "MISMO Publishes a Guide",'+nl+'  "body": "WASHINGTON, D.C. ([DATE]) – line one."+nl+nl+"has achieved \\"Candidate Recommendation\\" status.'+tab+'Done.'+nl+'[QUOTE]"'+nl+'}';
  const o=parseJson(raw.replace('"+nl+nl+"', nl+nl));
  out.lineBreaks=!!o && /line one\.\n\nhas achieved "Candidate Recommendation" status\.\tDone\.\n\[QUOTE\]/.test(o.body) && o.headline==="MISMO Publishes a Guide";
  out.fenced=(parseJson('```json'+nl+'{"a":1}'+nl+'```')||{}).a===1;
  out.wrapped=(parseJson('Here it is: {"a":"x'+nl+'y"} thanks')||{}).a==="x\ny";
  out.clean=(parseJson('{"a":"b"}')||{}).a==="b";
  out.nonsense=parseJson('no json here')===null;
  out.ok=Object.values(out).every(v=>v===true); return out; });
console.log(JSON.stringify(r), errs.length?errs:"errors []"); if(errs.length) r.ok=false;
await b.close(); process.exit(r.ok?0:1);})();
