// Browser tab icon (CN-030, Nov 25, 2026): every page MISMO Media serves has exactly one icon line in its <head>,
// the shared mismo.org icon, and no other icon (no shortcut icon, no data: or SVG icon, none added by a script).
const fs=require('fs');const {chromium}=require('playwright');
const ICON='<link rel="icon" type="image/png" sizes="48x48" href="https://resources.mismo.org/assets/favicon-48x48.png">';
function check(html){ html=html.replace(/(<script\b[^>]*>)[\s\S]*?<\/script>/gi,'$1</script>'); /* a page the app builds, like the web edition, is checked on its own below */
  const head=(html.match(/<head[\s>][\s\S]*?<\/head>/i)||[''])[0];
  const icons=(html.match(/<link\b[^>]*\brel\s*=\s*["']?[^"'>]*\bicon\b[^>]*>/gi)||[]).filter(l=>!/apple-touch-icon/i.test(l));
  return head.split(ICON).length===2 && icons.length===1 && icons[0]===ICON && !/favicon\.ico|image\/x-icon|image\/svg\+xml[^"']*icon/i.test(html); }
(async()=>{const out={};
out.site=check(fs.readFileSync('../out/site.html','utf8'));
out.matters=check(fs.readFileSync('../../matters/2026-11/index.html','utf8'));
out.headerSource=check(fs.readFileSync('../../mm-headers/source.html','utf8'));
const b=await chromium.launch();const p=await b.newPage({viewport:{width:1300,height:900}});
const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('file://'+process.cwd()+'/live.html#matters');await p.waitForTimeout(2500);
const h=await p.evaluate(()=>buildWebPage(curEdition()));
out.webEdition=check(h);
/* nothing the app runs adds a tab icon of its own */
out.noScriptIcon=await p.evaluate(()=>document.querySelectorAll('link[rel~="icon"],link[rel="shortcut icon"]').length===0);
out.ok=Object.values(out).every(v=>v===true);
console.log(JSON.stringify(out), errs.length?errs:"errors []"); if(errs.length) out.ok=false;
await b.close(); process.exit(out.ok?0:1);})();
