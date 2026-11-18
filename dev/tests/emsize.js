// The send version (emailForSend) looks the same as the email and is smaller (Nov 17, 2026).
const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1300,height:900}});
const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('file://'+process.cwd()+'/live.html#matters');await p.waitForTimeout(2500);
const r=await p.evaluate(()=>{ const ed=curEdition(); const a=buildEmail(ed), f=emailForSend(ed);
  const plain='<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="margin:0;padding:0;background:#ffffff;-webkit-text-size-adjust:100%;">'+a+'</body></html>';
  return {a:a.length, f:f.length, plain, send:f, head:/<head>[\s\S]*<style/.test(f), noFontLeft:!/IBM Plex Sans','Segoe UI',Arial,sans-serif;[^}]/.test(f.split('</style>')[1]||"")}; });
const PNG=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAQAAAABCAYAAAD5PA/NAAAAEElEQVR42mNk+M9QzwAEAA7hAQ5Qx3GkAAAAAElFTkSuQmCC','base64');
const shot=async html=>{const q=await b.newPage({viewport:{width:700,height:900}}); await q.route(/^https?:/, rt=>rt.request().resourceType()==='image'?rt.fulfill({contentType:'image/png',body:PNG}):rt.abort()); await q.setContent(html); await q.waitForTimeout(400); const s=await q.screenshot({fullPage:true}); const h=await q.evaluate(()=>document.body.scrollHeight); await q.close(); return {s,h};};
const A=await shot(r.plain), B=await shot(r.send);
const same=A.s.equals(B.s);
const out={orig:r.a, send:r.f, smaller:r.f<r.a, head:r.head, noFontLeft:r.noFontLeft, heightA:A.h, heightB:B.h, pixelsSame:same, ok:r.f<r.a && r.head && r.noFontLeft && same};
console.log(JSON.stringify(out), errs.length?errs:"errors []"); if(errs.length) out.ok=false;
require('fs').writeFileSync('emsize-a.png',A.s); require('fs').writeFileSync('emsize-b.png',B.s);
await b.close(); process.exit(out.ok?0:1);})();
