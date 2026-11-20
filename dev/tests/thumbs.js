// Picture thumbnails are saved to SharePoint one at a time, and a refusal pauses the rest for 15 minutes
// (Nov 20, 2026: a big grid fired dozens of saves at once and SharePoint turned most of them away).
const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1300,height:900}});
const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('file://'+process.cwd()+'/live.html#settings');await p.waitForTimeout(2500);
const r=await p.evaluate(async()=>{ const wait=ms=>new Promise(r=>setTimeout(r,ms)); const out={};
  /* big noisy pictures, so a small copy is worth making */
  const big=async(seed)=>{ const c=document.createElement('canvas'); c.width=1600; c.height=1000; const x=c.getContext('2d');
    const d=x.createImageData(1600,1000); let s=seed; for(let i=0;i<d.data.length;i++){ s=(s*1103515245+12345)&0x7fffffff; d.data[i]= i%4===3?255:(s>>16)&255; } x.putImageData(d,0,0);
    return await new Promise(r=>c.toBlob(r,'image/png')); };
  let live=0, most=0, calls=0, fail=false; const saved=[];
  window.__hqImages=Object.assign(window.__hqImages||{}, {get:async()=>new Blob(['x'],{type:'image/png'}), list:async()=>[], save:async(blob,name)=>{ calls++; live++; most=Math.max(most,live);
    await wait(120); live--; if(fail){ throw new Error('Cannot open file'); } saved.push(name); return {id:'/thumbs/'+name}; }});
  LEADER=true;
  const ids=[];
  for(let i=0;i<5;i++){ const id='img-tt'+i; ids.push(id);
    IMG_LOCAL[id]=URL.createObjectURL(await big(i+1));
    await put('images', id, {name:'Test '+i,file:'test-'+i+'.png',spPath:'/x/test-'+i+'.png',campaign:'brand',at:new Date().toISOString()});
  }
  /* all five asked for at once, as a grid does */
  await Promise.all(ids.slice(0,3).map(id=>thumbMake(S.images[id])));
  out.oneAtATime=most===1;
  out.threeSaved=saved.length===3 && ids.slice(0,3).every(id=>S.images[id] && S.images[id].spThumb);
  out.noRepeat=(await thumbMake(S.images[ids[0]]), calls===3);
  /* SharePoint refuses one: nothing more is tried for a while */
  fail=true; await thumbMake(S.images[ids[3]]);
  out.paused=THUMB.pauseUntil>Date.now()+14*60000;
  fail=false; await thumbMake(S.images[ids[4]]);
  out.skippedWhilePaused=calls===4 && !S.images[ids[4]].spThumb;
  out.ok=Object.values(out).every(v=>v===true); if(!out.ok) out.dbg={calls,pause:THUMB.pauseUntil-Date.now(),i3:String(JSON.stringify(S.images[ids[3]])).slice(0,200),jobs:typeof JOBS!=='undefined'?JSON.stringify(JOBS).slice(0,300):''};
  return out;
});
console.log(JSON.stringify(r), errs.length?errs:"errors []"); if(errs.length) r.ok=false;
await b.close(); process.exit(r.ok?0:1);})();
