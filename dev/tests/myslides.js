// MyMISMO Summit Alerts and Slides (CN-063, Nov 27, 2026; moved from Summit HQ). The relay, the website agenda and the
// data files are stand-ins here: nothing is sent anywhere. Checks: Send hidden until /mymismo/push/ready answers 200
// and for anyone not in alertSenders; nothing sends without pressing Send and saying yes; the send's shape, the phones
// reached and the list of alerts sent; slides stored in Summit HQ's chunked format (head {chunked:{ver,n}} plus parts)
// and listed in data/feed-mymismo-slides.json in CN-037's shape; only PDF or PowerPoint up to 25 MB; a file taken off
// leaves the feed but is kept; a stored file opens whole.
const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1300,height:900}});
const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('file://'+process.cwd()+'/live.html');await p.waitForTimeout(2500);
const r=await p.evaluate(async()=>{ const wait=ms=>new Promise(r=>setTimeout(r,ms)); const out={};
  document.querySelectorAll('[id^=mn-pop]').forEach(e=>e.remove());
  const nav=()=>document.querySelector('.hq nav button[data-hq="mymismo"]'), pg=document.getElementById('page-mymismo');
  const agenda={updated:"2026-11-25T00:00:00Z", summits:{nola:{name:"2027 Winter Summit", dates:"January 11–14, 2027", grid:{updated:"x", sessions:[
    {id:"opening@tue", day:"Tuesday", date:"2027-01-12", start:"09:00", end:"10:00", type:"General Session", title:"Opening General Session", room:"Grand Ballroom"},
    {id:"breakfast@mon", day:"Monday", date:"2027-01-11", start:"07:30", end:"09:00", type:"Breakfast", title:"Breakfast", room:"Frenchmen I & II"},
    {id:"dscop@tue", day:"Tuesday", date:"2027-01-12", start:"13:00", end:"14:30", type:"Community", title:"Data Standards COP", room:"Napoleon C"}]}}}};
  let ready=404; const calls=[]; const realFetch=window.fetch;
  window.fetch=(u,o)=>{ const s=String(u);
    if(/summit-agenda\/agenda\.json$/.test(s)) return Promise.resolve(new Response(JSON.stringify(agenda),{status:200}));
    if(/\/mymismo\/push\/ready$/.test(s)){ calls.push({k:"ready"}); return Promise.resolve(new Response(ready===200?'{"ok":true}':'{"error":"NOT_FOUND"}',{status:ready})); }
    if(/\/mymismo\/push\/send$/.test(s)){ calls.push({k:"send", method:o&&o.method, auth:o&&o.headers&&o.headers.Authorization, body:JSON.parse(o.body)}); return Promise.resolve(new Response('{"ok":true,"sent":42,"failed":1,"removed":0,"id":"A7"}',{status:200})); }
    if(/\/mymismo\/staff\//.test(s)) return Promise.resolve(new Response('{"error":"NOT_ALLOWED"}',{status:403}));
    return realFetch(u,o); };
  /* the data repo's plain files (feeds and slides), with GitHub's sha checks */
  const store={}; let n=0; const puts=[];
  window.__hqFile={ get:async name=>store[name]?{data:JSON.parse(JSON.stringify(store[name].data)), sha:store[name].sha}:{data:null, sha:null},
    put:async(name,content,sha)=>{ if(!/^(feed-[a-z0-9-]+|slide-[a-z0-9]+(--[a-z0-9]+-[0-9]+)?)$/.test(name)) throw new Error("bad name "+name);
      if(store[name] && store[name].sha!==sha){ const e=new Error("conflict"); e.status=409; throw e; } puts.push(name); store[name]={data:JSON.parse(JSON.stringify(content)), sha:"s"+(++n)}; return {sha:store[name].sha}; } };
  let email="someone@mismo.org";
  window.ResourcesSession={token:()=>"test-token", current:()=>({email})};
  /* signed in and able to save: MyMISMO shows with Summit Alerts and Slides, not reports or trivia (403) */
  await mymLoad(true); await myaLoad(true);
  out.navShown=!nav().hidden && !document.querySelector('#nb-mymismo:not([hidden])');
  go("mymismo"); await wait(80);
  out.tabs=!!pg.querySelector('[data-mym-sub="alerts"]') && !!pg.querySelector('[data-mym-sub="slides"]') && !pg.querySelector('[data-mym-sub="reports"]') && !pg.querySelector('[data-mym-sub="trivia"]') && MYM.sub==="alerts";
  out.summit=/2027 Winter Summit/.test(pg.innerText) && myaSid()==="nola";
  /* alerts not switched on: no Send */
  out.noSendNotReady=!document.getElementById('mya-send') && /aren't switched on yet/.test(pg.innerText);
  /* switched on, but not a sender: still no Send */
  ready=200; await myaLoad(true); await wait(40);
  out.noSendNotSender=!document.getElementById('mya-send') && /Only the people Jonna named/.test(pg.innerText);
  email="jcritchley@mismo.org"; renderMyMISMO(); await wait(20);
  const send=()=>document.getElementById('mya-send');
  out.sendDisabledEmpty=!!send() && send().disabled;
  const t=document.getElementById('mya-t'), bd=document.getElementById('mya-b');
  t.value="Room Change: Data Standards COP"; t.dispatchEvent(new Event('input')); bd.value="The Data Standards COP has moved to Napoleon Ballroom C."; bd.dispatchEvent(new Event('input'));
  out.preview=document.getElementById('mya-pt').textContent==="Room Change: Data Standards COP" && /Napoleon Ballroom C/.test(document.getElementById('mya-pb').textContent) && /31 of 80/.test(document.getElementById('mya-tc').textContent) && !send().disabled;
  const sel=document.getElementById('mya-s'); out.sessionsInOrder=[...sel.options].map(o=>o.value).join(",")===",breakfast@mon,opening@tue,dscop@tue";
  sel.value="dscop@tue"; sel.dispatchEvent(new Event('change')); out.tap=/Tapping it opens Data Standards COP/.test(document.getElementById('mya-tap').textContent);
  /* a redraw while typing keeps the words */
  renderMyMISMO(); out.keptDraft=document.getElementById('mya-t').value==="Room Change: Data Standards COP";
  /* Cancel on the question: nothing is sent */
  window.confirm=()=>false; send().click(); await wait(80); out.noSendWithoutYes=!calls.some(c=>c.k==="send");
  window.confirm=()=>true; send().click(); await wait(400);
  const c=calls.find(x=>x.k==="send");
  out.sent=!!c && c.method==="POST" && c.auth==="Bearer test-token" && JSON.stringify(c.body)===JSON.stringify({summit:"nola", title:"Room Change: Data Standards COP", body:"The Data Standards COP has moved to Napoleon Ballroom C.", session:"dscop@tue"});
  out.phones=/Sent to 42 phones \(1 couldn't be reached\)/.test(document.getElementById('mya-msg').textContent);
  const rec=S.mymismoalerts.nola; out.kept=!!rec && rec.list.length===1 && rec.list[0].sent===42 && rec.list[0].id==="A7" && rec.list[0].sessionTitle==="Data Standards COP" && rec.list[0].by==="jcritchley@mismo.org" && __MOCK.D.mymismoalerts && !!__MOCK.D.mymismoalerts.nola;
  out.sentList=/Alerts Sent/.test(pg.innerText) && /Room Change: Data Standards COP/.test(pg.querySelector('table.t').innerText) && /42/.test(pg.querySelector('table.t').innerText) && document.getElementById('mya-t').value==="";
  out.oneSend=calls.filter(x=>x.k==="send").length===1;
  /* Slides */
  pg.querySelector('[data-mym-sub="slides"]').click(); await wait(60);
  out.slidesPage=MYM.sub==="slides" && pg.querySelectorAll('[data-mya-up]').length===3 && /monday/i.test(pg.innerText) && /Data Standards COP/.test(pg.innerText);
  const upload=async(sesId, files)=>{ const inp=pg.querySelector('[data-mya-up="'+sesId+'"]'); const dt=new DataTransfer(); files.forEach(f=>dt.items.add(f)); inp.files=dt.files; inp.dispatchEvent(new Event('change')); for(let i=0;i<60 && MYA.prog[sesId]!==undefined || i<3;i++) await wait(50); await wait(200); };
  await upload("dscop@tue", [new File(["hello"],"notes.txt",{type:"text/plain"})]);
  out.wrongType=!puts.some(x=>/^slide-/.test(x)) && /isn't a PDF or PowerPoint/.test(pg.innerText);
  await upload("dscop@tue", [new File([new Uint8Array(25*1024*1024+1)],"huge.pdf",{type:"application/pdf"})]);
  out.tooBig=!puts.some(x=>/^slide-/.test(x)) && /up to 25 MB/.test(pg.innerText);
  const bytes=new Uint8Array(700000); for(let i=0;i<bytes.length;i++) bytes[i]=(i*7)%251;
  await upload("dscop@tue", [new File([bytes],"COP Deck.pdf",{type:"application/pdf"})]);
  const f1=((S.mymismoslides.nola||{}).sessions||{})["dscop@tue"]; const e1=f1&&f1[0];
  const head=e1 && store[e1.file.replace(/^data\//,"").replace(/\.json$/,"")];
  out.chunked=!!head && head.data.chunked.n===2 && e1.parts===2 && !!store["slide-"+e1.id+"--"+head.data.chunked.ver+"-0"] && !!store["slide-"+e1.id+"--"+head.data.chunked.ver+"-1"] &&
    store["slide-"+e1.id+"--"+head.data.chunked.ver+"-0"].data.s.length===800000 && /^data:application\/pdf;base64,/.test(store["slide-"+e1.id+"--"+head.data.chunked.ver+"-0"].data.s) && /^data\/slide-[a-z0-9]+\.json$/.test(e1.file);
  out.headLast=puts.indexOf("slide-"+e1.id)>puts.indexOf("slide-"+e1.id+"--"+head.data.chunked.ver+"-1") && puts.lastIndexOf("feed-mymismo-slides")>puts.indexOf("slide-"+e1.id);
  const feed=store["feed-mymismo-slides"]&&store["feed-mymismo-slides"].data;
  out.feed=!!feed && !!feed.updated && JSON.stringify(feed.summits)===JSON.stringify({nola:{sessions:{"dscop@tue":[{name:"COP Deck.pdf", type:"application/pdf", size:700000, file:e1.file, parts:2}]}}});
  out.listed=/COP Deck\.pdf/.test(pg.innerText) && /is on MyMISMO/.test(pg.innerText);
  await upload("opening@tue", [new File(["pptx"],"Opening.pptx")]);
  const f2=S.mymismoslides.nola.sessions["opening@tue"][0];
  out.pptx=!!f2 && f2.type==="application/vnd.openxmlformats-officedocument.presentationml.presentation" && f2.parts===1 && Object.keys(store["feed-mymismo-slides"].data.summits.nola.sessions).join()==="dscop@tue,opening@tue";
  /* opening a stored file puts the parts back together */
  let blob=null; const realURL=URL.createObjectURL; URL.createObjectURL=b=>{ blob=b; return "blob:x"; };
  const realOpen=window.open; window.open=()=>({location:null, close(){}});
  pg.querySelector('[data-mya-ses="dscop@tue"] [data-mya-open]').click(); await wait(300);
  out.opens=!!blob && blob.size===700000 && blob.type==="application/pdf" && new Uint8Array(await blob.arrayBuffer())[699999]===bytes[699999];
  URL.createObjectURL=realURL; window.open=realOpen;
  /* taking one off: out of the feed, the file and its record kept */
  pg.querySelector('[data-mya-ses="dscop@tue"] [data-mya-rm]').click(); await wait(300);
  const gone=S.mymismoslides.nola.sessions["dscop@tue"][0];
  out.removed=gone.gone===true && !!gone.goneAt && !!store["slide-"+e1.id] && JSON.stringify(Object.keys(store["feed-mymismo-slides"].data.summits.nola.sessions))==='["opening@tue"]' && !pg.querySelector('[data-mya-ses="dscop@tue"] [data-mya-open]');
  /* someone else changed the feed meanwhile: the 409 is retried on the newest copy */
  store["feed-mymismo-slides"].sha="other"; store["feed-mymismo-slides"].data.summits={};
  out.retry=await myaPublish() && Object.keys(store["feed-mymismo-slides"].data.summits.nola.sessions).join()==="opening@tue";
  /* nothing went to the relay but the stand-ins, and no alert went out on its own */
  out.noAutoSend=calls.filter(x=>x.k==="send").length===1;
  window.fetch=realFetch; delete window.ResourcesSession;
  out.ok=Object.values(out).every(v=>v===true); return out; });
console.log(JSON.stringify(r), errs.length?errs:"errors []"); if(errs.length) r.ok=false;
await b.close(); process.exit(r.ok?0:1);})();
