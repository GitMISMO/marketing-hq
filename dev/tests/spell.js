// Spelling (Jonna, Nov 26, 2026): every copy box has the browser's spell checker on, in American English; link, email,
// date and search boxes don't.
const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1300,height:900}});
const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('file://'+process.cwd()+'/live.html');await p.waitForTimeout(2500);
const r=await p.evaluate(async()=>{ const wait=ms=>new Promise(r=>setTimeout(r,ms)); const out={};
  document.querySelectorAll('[id^=mn-pop]').forEach(e=>e.remove());
  out.lang=document.documentElement.lang==="en-US";
  newPiece("linkedin",{date:T()}); await wait(300);
  const pane=document.getElementById("pane-body"), tas=[...pane.querySelectorAll("textarea")], ins=[...pane.querySelectorAll('input[type="text"], input:not([type])')];
  out.textareas=tas.length>0 && tas.every(t=>t.spellcheck===true && t.getAttribute("lang")==="en-US");
  const linky=ins.filter(i=>/url|link/i.test(i.id||"")), wordy=ins.filter(i=>!/url|link|date|time|search/i.test(i.id||"") && !/https?:|@/.test(i.placeholder||""));
  out.titles=wordy.length===0 || wordy.every(i=>i.spellcheck===true);
  out.linksOff=linky.every(i=>i.dataset.spell==="off");
  if(typeof closePane==="function") closePane(true);
  /* a box that appears later is switched on too */
  const t=document.createElement("textarea"); document.body.appendChild(t); await wait(50); out.later=t.spellcheck===true && t.dataset.spell==="on";
  const u=document.createElement("input"); u.type="text"; u.id="x-url"; document.body.appendChild(u); await wait(50); out.urlOff=u.dataset.spell==="off";
  const ce=document.createElement("div"); ce.contentEditable="true"; document.body.appendChild(ce); await wait(50); out.rich=ce.spellcheck===true;
  [t,u,ce].forEach(x=>x.remove());
  /* the spelling line, with a tiny stand-in dictionary (the real one is spell/en_US.dic on the site) */
  const aff="SFX S Y 1\nSFX S 0 s .\nPFX R Y 1\nPFX R 0 re .\n";
  const dic="20\nwe\nwill\nreceive/S\nthe\ncopy\nthis\nis\na\ngood\nedition/S\nspeak/S\nstandard/S\nand\nnew\ntoday\nwrite/R\nBrian\ndon't\nfor\nit\n";
  SPELL.words=spellBuild(aff,dic); SPELL.state="ready";
  out.build=SPELL.words.has("receives") && SPELL.words.has("rewrite") && SPELL.words.has("editions");
  out.issues=JSON.stringify(spellIssues("We will recieve the copy. Brian Vieaux will speak, and Xactus is new. Recieve it today."))==='["recieve"]';
  out.titleCase=JSON.stringify(spellIssues("This Is the New Edition: Good Standerds and Editions for Brianne"))==='["Standerds"]';
  out.skips=spellIssues("Read https://www.mismo.org/x and email jcritchley@mba.org #MISMOMatters @MISMO eNote ULAD")+""==="Read";
  out.suggest=spellSuggest("recieve")[0]==="receive" && spellSuggest("Recieve")[0]==="Receive";
  const box=document.createElement("textarea"); box.value="We will recieve the copy."; const wrap=document.createElement("div"); wrap.appendChild(box); document.body.appendChild(wrap); await wait(150);
  const line=box.nextElementSibling; out.line=!!line && line.classList.contains("spl") && !line.hidden && /recieve/.test(line.innerText);
  line.querySelector(".spl-w").click(); await wait(50);
  const menu=line.querySelector(".spl-menu"); out.menu=!!menu && !!menu.querySelector('[data-splto="receive"]') && /Add to MISMO Words/.test(menu.innerText);
  let changed=false; box.addEventListener("input",()=>changed=true);
  menu.querySelector('[data-splto="receive"]').click(); await wait(50);
  out.fixed=box.value==="We will receive the copy." && changed && line.hidden;
  box.value="This is good."; box.dispatchEvent(new Event("input",{bubbles:true})); await wait(800); out.noLineWhenRight=line.hidden;
  box.value="Teraverde wil speak."; box.dispatchEvent(new Event("input",{bubbles:true})); await wait(800);
  line.querySelector(".spl-w").click(); await wait(30); line.querySelector("[data-splign]").click(); await wait(50); out.ignore=line.hidden;
  wrap.remove(); SPELL.ignore.clear();
  out.ok=Object.values(out).every(v=>v===true); return out; });
console.log(JSON.stringify(r), errs.length?errs:"errors []"); if(errs.length) r.ok=false;
await b.close(); process.exit(r.ok?0:1);})();
