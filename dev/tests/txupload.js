// Upload a Corrected Transcript: saved through the image flow, used instead of the folder's, earlier one kept in txHistory,
// and a SharePoint re-pull doesn't put the old one back (Nov 13, 2026).
const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1300,height:900}});
const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('file://'+process.cwd()+'/live.html#micdup');await p.waitForTimeout(2500);
const r=await p.evaluate(async()=>{ const wait=ms=>new Promise(r=>setTimeout(r,ms)); window.__hqWho="Test Person";
  const saved=[]; window.__hqImages=Object.assign(window.__hqImages||{},{save:async(blob,name)=>{ saved.push({name, text:await blob.text()}); return {id:"/Shared/2026-11/"+name}; }, get:async path=>new Blob([saved.find(s=>path.endsWith(s.name)).text])});
  await put("episodes","s2ep009",{num:9,season:"2",airDate:T(),title:"Test"});
  await put("kits","s2ep009",{source:"sp",spFolder:"x",transcriptPath:"/old/untitled.txt",transcriptName:"untitled.txt"}); await wait(100);
  const f=new File(["MISMO Mic'd Up transcript. ".repeat(20)],"fixed.txt",{type:"text/plain"});
  await kitUploadTranscript("s2ep009", f); await wait(150);
  const k=kitOf("s2ep009");
  return {uploaded:k.txUploaded===true, path:k.transcriptPath, hist:(k.txHistory||[]).map(h=>h.path), by:k.txUploadedBy, read:(KIT.tx["s2ep009"]||"").length>100,
    ok: k.txUploaded===true && /fixed\.txt$/.test(k.transcriptPath) && (k.txHistory||[])[0].path==="/old/untitled.txt" && k.txUploadedBy==="Test Person" && (KIT.tx["s2ep009"]||"").length>100};
});
console.log(JSON.stringify(r), errs.length?errs:"errors []"); if(errs.length) r.ok=false;
await b.close(); process.exit(r.ok?0:1);})();
