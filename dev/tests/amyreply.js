// Amy's emailed reply to the LinkedIn Live wording, shown and used the way she wrote it (Nov 24, 2026): the email's
// ~80-character line wraps joined back, her own line breaks kept as paragraphs, her note on top ("Changes: (revised
// post below)") and the signature leftover ("MISMO") taken off.
const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1300,height:900}});
const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('file://'+process.cwd()+'/live.html');await p.waitForTimeout(2500);
const r=await p.evaluate(async()=>{ const wait=ms=>new Promise(r=>setTimeout(r,ms)); const out={};
  const raw="Changes: (revised post below)\nMISMO President Brian Vieaux sits down with Meghan Tidgewell, Principal\nConsultant at TRex, to tackle a challenging question: when should a data point\nbe required in the mortgage process, especially when professionals work with\nvery different types of loans? Brian and Meghan explore how collaboration across\nthe industry leads to better standards and more practical solutions.\nAs one of MISMO's first Certified FRAME Advisory Partners, Meghan also shares\nhow Trex is putting FRAME to work in real-world lending, from the use of AI\ntools like ChatGPT to new AI features in loan origination systems.\n\nMISMO";
  const want="MISMO President Brian Vieaux sits down with Meghan Tidgewell, Principal Consultant at TRex, to tackle a challenging question: when should a data point be required in the mortgage process, especially when professionals work with very different types of loans? Brian and Meghan explore how collaboration across the industry leads to better standards and more practical solutions.\n\nAs one of MISMO's first Certified FRAME Advisory Partners, Meghan also shares how Trex is putting FRAME to work in real-world lending, from the use of AI tools like ChatGPT to new AI features in loan origination systems.";
  out.exact=amyUnwrap(raw)===want;
  out.hashtags=amyUnwrap("Edits:\nShort first line.\n\n#MISMO #MicdUp\n#AI")==="Short first line.\n\n#MISMO #MicdUp\n#AI";
  out.noteKept=amyUnwrap("Changes: swap ICE for TReX in the first line")==="swap ICE for TReX in the first line";
  out.notWrapped=amyUnwrap("One paragraph from an HTML email that was never wrapped, and it runs well past eighty characters wide.\nSecond paragraph.")==="One paragraph from an HTML email that was never wrapped, and it runs well past eighty characters wide.\n\nSecond paragraph.";
  /* an older cleaned copy from before is redone, and the page shows her two paragraphs */
  const eps=vals("episodes"), e=eps[eps.length-1];
  await put("kits", e.id, Object.assign({}, kitOf(e.id)||{}, {id:e.id, liStatus:"edits", liNote:raw, liReplyId:"r-test", amyClean:"old merged text", amyFrom:"r-test", written:{li:"MISMO's draft"}}));
  await patch("episodes", e.id, {linkedinCopy:"MISMO's draft"});
  window.writer=async(task,text)=>JSON.stringify({text, fixes:[]});
  const t=await amyCleanVersion(e.id);
  out.redone=t===want && kitOf(e.id).amyVer===2;
  const h=liLiveHtml(S.episodes[e.id], kitOf(e.id), "MISMO's draft", []);
  const d=document.createElement("div"); d.innerHTML=h; const at=d.querySelector(".amy-text");
  out.shown=!!at && at.innerHTML.split("<br><br>").length===2 && !/Changes:/.test(at.textContent) && !/MISMO$/.test(at.textContent.trim()) && /loan origination systems\.$/.test(at.textContent.trim());
  out.ok=Object.values(out).every(v=>v===true); return out; });
console.log(JSON.stringify(r), errs.length?errs:"errors []"); if(errs.length) r.ok=false;
await b.close(); process.exit(r.ok?0:1);})();
