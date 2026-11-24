// Image Library: the Brand Kit (Nov 23, 2026). Logos & Brand files leave the Library grid for their own tab: the MISMO
// logo as one card per color with a button per format, each badge as one card, then guides, print, video and swag.
// The Library keeps campaign pictures, in sections (LinkedIn posts, Mic'd Up, social templates, email headers and designs, headshots, industry events), and says when a search also matches Brand Kit files.
const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1300,height:900}});
const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('file://'+process.cwd()+'/live.html#images');await p.waitForTimeout(2500);
const r=await p.evaluate(async()=>{ const wait=ms=>new Promise(r=>setTimeout(r,ms)); const out={};
  const m=document.getElementById("mn-pop"); if(m) m.remove();
  const now=new Date().toISOString(), add=(id,o)=>{ S.images[id]=Object.assign({id, at:now, archived:false, campaign:"brand"}, o); };
  [["Full Color","fc"],["Black","bk"],["White","wh"]].forEach(([c,k])=>{
    add("k-"+k+"-png",{name:"MISMO Logo, "+c+" (PNG)", file:"MISMO Logo "+c+".png", type:"image/png"});
    add("k-"+k+"-svg",{name:"MISMO Logo, "+c+" (SVG)", file:"MISMO Logo "+c+".svg", type:"image/svg+xml"});
    add("k-"+k+"-eps",{name:"MISMO FINAL "+c, file:"MISMO FINAL "+c+".eps", kind:"file", ext:"eps", spPath:"/x/EPS/MISMO FINAL "+c+".eps"});
    add("k-"+k+"-ai",{name:"MISMO FINAL "+c, file:"MISMO FINAL "+c+".ai", kind:"file", ext:"ai", spPath:"/x/AI/MISMO FINAL "+c+".ai"}); });
  add("k-ron",{name:"Certification Badge: RON", file:"ron.png", type:"image/png"});
  add("k-ron4",{name:"Certification Badge: RON Provider (400 x 400)", file:"ron400.png", type:"image/png"});
  add("k-ronp",{name:"Certification Badge: RON Provider (Vector PDF)", file:"1.pdf", kind:"file", ext:"pdf", spPath:"/x/Certification-Member Badges/1.pdf"});
  add("k-aip",{name:"Certification Badge: AI Governance, Pending (400 x 400)", file:"aip.png", type:"image/png"});
  add("k-ai",{name:"Certification Badge: AI Governance (400 x 400)", file:"ai.png", type:"image/png"});
  add("k-mem",{name:"Member Badge: Member", file:"m.png", type:"image/png"});
  add("k-champ",{name:"Member Badge: Champion Member", file:"c.png", type:"image/png"});
  add("k-guide",{name:"MISMO Brand Guide Presentation", file:"g.pdf", kind:"file", ext:"pdf", spPath:"/x/Brand Guide/g.pdf"});
  add("k-play",{name:"MISMO Executive Messaging Playbook v1", file:"p.docx", kind:"file", ext:"docx", spPath:"/x/Working Docs/p.docx"});
  add("k-trade",{name:"260910 mismo tradeshow sides PRINT", file:"t.pdf", kind:"file", ext:"pdf", spPath:"/x/Tradeshow Booth/t.pdf"});
  add("k-vid",{name:"MISMO Logo Reveal FINAL", file:"v.mp4", kind:"file", ext:"mp4", spPath:"/x/Sizzle Reel/v.mp4"});
  add("k-swag",{name:"Swag Mockup 01", file:"s.jpg", type:"image/jpeg", spPath:"/x/Digital Assets-2026/Swag Mockups/s.jpg"});
  add("k-old",{name:"Old Pic <script>", file:"o.png", type:"image/png", campaign:"linkedin", at:"2026-08-04T12:00:00Z"});
  go("images"); IM.view="lib"; renderImages(); await wait(200);
  let t=document.getElementById("page-images").innerText;
  /* the Library: no brand files, a Brand Kit tile and tab, months folded */
  out.libNoBrand=!document.querySelector('.imcard[data-im="k-fc-png"]') && !!document.querySelector('[data-imview="kit"]');
  /* the Library in sections (Nov 23, 2026): LinkedIn posts, Mic'd Up, social templates, email headers and designs, headshots, industry events */
  add("s-soc",{name:"Social Template: Event Announcement", file:"s.png", type:"image/png", campaign:"linkedin"});
  add("s-hdr",{name:"Email Header: Welcome", file:"h.png", type:"image/png", campaign:"matters", spPath:"/x/Email Headers - Cropped/h.png"});
  add("s-des",{name:"Email Design: Welcome", file:"d.png", type:"image/png", campaign:"matters"});
  add("s-head",{name:"Michele White Headshot2026", file:"m.jpg", type:"image/jpeg", campaign:"matters"});
  add("s-ev",{name:"Example Speaker Card", file:"e.png", type:"image/png", campaign:"events", source:"team-hq"});
  add("s-mu",{name:"Mic'd Up Ep 3 Thumbnail", file:"t.png", type:"image/png", campaign:"micdup"});
  add("s-moved",{name:"Brian Photo", file:"b.jpg", type:"image/jpeg", campaign:"matters", libGroup:"headshot"});
  for(let i=0;i<12;i++) add("s-li"+i,{name:"LinkedIn: Post "+i, file:"l"+i+".png", type:"image/png", campaign:"linkedin", at:new Date(Date.now()-i*864e5).toISOString()});
  renderImages(); await wait(150);
  const sec=k=>document.getElementById("lib-"+k), has=(k,id)=>!!(sec(k)&&sec(k).querySelector('.imcard[data-im="'+id+'"]'));
  out.sections=has("social","s-soc") && has("emailhdr","s-hdr") && has("emaildesign","s-des") && has("headshot","s-head") && has("headshot","s-moved") && has("events","s-ev") && has("micdup","s-mu") && !has("linkedin","s-soc");
  const order=[...document.querySelectorAll('section[id^="lib-"]')].map(x=>x.id.slice(4));
  out.order=order.indexOf("linkedin")<order.indexOf("micdup") && order.indexOf("micdup")<order.indexOf("social") && order.indexOf("headshot")<order.indexOf("events");
  out.more=sec("linkedin").querySelectorAll(".imcard").length===8 && !!sec("linkedin").querySelector("[data-immore]") && !document.querySelector("script#x");
  sec("linkedin").querySelector("[data-immore]").click(); await wait(100);
  out.showAll=document.getElementById("lib-linkedin").querySelectorAll(".imcard").length>=13;
  document.querySelector('[data-imsec="headshot"]').click(); await wait(100);
  out.oneSection=document.querySelectorAll('section[id^="lib-"]').length===1 && !!document.getElementById("lib-headshot");
  IM.sec=""; IM.more={}; renderImages();
  out.noBrandOption=!document.querySelector('#im-camp option[value="brand"]');
  /* a Library search for "eps" points to the Brand Kit */
  IM.q="eps"; renderImages(); await wait(100);
  const hint=document.querySelector(".bkhint"); out.hint=!!hint && /3 Brand Kit files also match/.test(hint.innerText);
  document.getElementById("im-tokit").click(); await wait(150);
  out.toKit=IM.view==="kit" && BKIT.q==="eps" && document.querySelectorAll(".bkcard").length===3;
  /* the Brand Kit: one card per logo color, every format on it */
  BKIT.q=""; renderImages(); await wait(100);
  const card=[...document.querySelectorAll('#bk-logo .bkcard')].find(c=>/^Full Color/.test(c.querySelector(".bkbody>b").textContent));
  const btns=card?[...card.querySelectorAll("[data-bkdl]")].map(x=>x.textContent):[];
  out.logoCards=document.querySelectorAll('#bk-logo .bkcard').length===3 && btns.join(",")==="PNG,SVG,EPS,AI";
  out.darkWhite=!![...document.querySelectorAll('#bk-logo .bkcard')].find(c=>/^White$/.test(c.querySelector(".bkbody>b").textContent)).querySelector(".bk-dark");
  /* badges: RON on one card with its sizes and vector PDF; Pending kept apart from AI Governance; Champion apart from Member */
  const titles=[...document.querySelectorAll('#bk-badge .bkcard b')].map(x=>x.textContent);
  const ron=[...document.querySelectorAll('#bk-badge .bkcard')].find(c=>/RON/.test(c.innerText));
  out.badges=titles.length===5 && titles.includes("AI Governance, Pending Certification") && titles.includes("Certified AI Governance") && titles.includes("Champion Member") && titles.includes("MISMO Member") &&
    !!ron && [...ron.querySelectorAll("[data-bkdl]")].map(x=>x.textContent).join(",")==="PNG,PNG 400 × 400,PDF (Vector)";
  out.groups=["logo","badge","guide","print","video","swag"].every(g=>!!document.getElementById("bk-"+g)) && !!document.querySelector('#bk-guide .bkcard') && document.querySelectorAll('#bk-guide .bkcard').length===2 && /Logo Reveal/.test(document.getElementById("bk-video").innerText);
  /* the EPS button: only cards with an EPS, the EPS button marked */
  document.querySelector('[data-bkfmt="eps"]').click(); await wait(100);
  out.fmtFilter=document.querySelectorAll(".bkcard").length===3 && document.querySelectorAll('.bkcard [data-bkdl].pri').length===3 && /EPS/.test(document.querySelector('.bkcard [data-bkdl].pri').textContent);
  /* downloading an EPS opens SharePoint's download, a picture downloads */
  let opened=""; const wo=window.open; window.open=u=>{ opened=String(u); return null; };
  document.querySelector('[data-bkdl="k-fc-eps"]').click(); window.open=wo;
  out.download=/download/i.test(opened) || /MISMO%20FINAL|MISMO FINAL/.test(opened);
  BKIT.fmt=""; renderImages();
  /* new uploads from the Brand Kit land there */
  out.uploadPreset=/IM\.view==="kit"\?"brand"/.test(String(addImages));
  out.ok=Object.values(out).every(v=>v===true); return out; });
console.log(JSON.stringify(r), errs.length?errs:"errors []"); if(errs.length) r.ok=false;
await b.close(); process.exit(r.ok?0:1);})();
