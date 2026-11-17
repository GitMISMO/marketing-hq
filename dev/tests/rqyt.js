// A form request shows its YouTube details and pictures; automatic requests are labeled (Nov 17, 2026).
const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1300,height:900}});
const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('file://'+process.cwd()+'/live.html#requests');await p.waitForTimeout(2500);
const r=await p.evaluate(async()=>{ const wait=ms=>new Promise(r=>setTimeout(r,ms));
  window.__hqImages=Object.assign(window.__hqImages||{}, {get:async()=>new Blob([new Uint8Array([137,80,78,71])],{type:"image/png"})});
  S.inbox["rq-yttest"]={n:"Pat Test",e:"pat@mismo.org",type:"video",title:"YT Test",details:"Post this video.",ytTitle:"The Title",ytDescription:"Line one\nLine two",ytPlaylist:"Webinars",files:[{name:"thumb.png",path:"/MISMO/Active Documents/Marketing/MISMO Media Requests/2026-11/x.png"}],at:new Date().toISOString(),source:"form"};
  await put("requests","rq-auto-test",{status:"new",title:"New Member Announcement: Test",type:"linkedin",auto:"member-360",n:"Member 360"});
  go("requests"); await wait(400);
  const cardAuto=[...document.querySelectorAll(".rqc")].some(c=>/Automatic · Member 360/.test(c.textContent));
  const cardPics=[...document.querySelectorAll(".rqc")].some(c=>/1 picture/.test(c.textContent));
  openRequest("rq-yttest"); await wait(500);
  const pane=document.getElementById("pane-body"); const t=pane?pane.innerText:"";
  return {cardAuto, cardPics, yt:/For YouTube/i.test(t)&&/The Title/.test(t)&&/Webinars/.test(t), pic:!!(pane&&pane.querySelector(".rq-pics img")), ok:cardAuto&&cardPics&&/The Title/.test(t)&&/Webinars/.test(t)&&!!(pane&&pane.querySelector(".rq-pics img"))};
});
console.log(JSON.stringify(r), errs.length?errs:"errors []"); if(errs.length) r.ok=false;
await b.close(); process.exit(r.ok?0:1);})();
