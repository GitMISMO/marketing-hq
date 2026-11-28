/* ================= Mailchimp numbers, read automatically (Nov 28, 2026) =================
   Jonna: "is there a mailchimp api thing like linkedin we can do?" The "Mailchimp reports" workflow in
   marketing-hq-data reads every sent campaign's report through Mailchimp's Marketing API every 6 hours (read only;
   nothing is ever sent) into data/mailchimp.json: "mailchimp/c-<campaign id>" per campaign and "mailchimp/_run".
   Here each campaign is matched to its Mailchimp record (by campaign id, or the same subject within a day) and its
   numbers are filled in; campaigns nobody logged are added, so nobody drops the export any more. */
const MC_API={done:"", busy:false, timer:0, err:""};
function mcRun(){ return (S.mailchimp||{})._run || null; }
function mcLive(){ const r=mcRun(); return !!(r && r.ok && r.lastOk && (Date.now()-Date.parse(r.lastOk))<3*864e5); }
function mcApiCamps(){ return Object.values(S.mailchimp||{}).filter(d=>d && d.id && d.date && +d.sent); }
/* the month's Mailchimp numbers are in once a good read happened after the month ended */
function mcApiCovers(per){ const r=mcRun(); if(!r || !r.lastOk) return false; const [y,m]=per.split("-").map(Number); return r.lastOk.slice(0,10) > new Date(Date.UTC(y,m,0)).toISOString().slice(0,10); }
const mcNums=x=>({sent:+x.sent||0, delivered:+x.delivered||0, opens:+x.opens||0, clicks:+x.clicks||0, unsubs:+x.unsubs||0, bounces:+x.bounces||0,
  totalOpens:+x.totalOpens||0, totalClicks:+x.totalClicks||0, forwards:+x.forwards||0, links:(x.links||[]).map(l=>[String(l[0]), +l[1]||0])});
const mcSame=(rec, part)=>Object.keys(part).every(k=>JSON.stringify(rec[k]==null?"":rec[k])===JSON.stringify(part[k]==null?"":part[k]));
function mcFindPiece(x, taken){
  const ps=vals("pieces").filter(p=>p.channel==="mailchimp" && !p.archived && !taken.has(p.id));
  const exact=ps.find(p=>p.mcId===x.id); if(exact) return exact;
  const subj=String(x.subject||"").trim().toLowerCase(), resend=!!x.resend;
  return ps.find(p=>!p.mcId && String(p.title||"").trim().toLowerCase()===subj && !!(p.resend||/^resend:/i.test(p.mcName||""))===resend && p.date && Math.abs((Date.parse(p.date)-Date.parse(x.date))/864e5)<=1) || null;
}
function mcSoon(){ clearTimeout(MC_API.timer); MC_API.timer=setTimeout(mcApiSync, 3500); }
async function mcApiSync(){
  const r=mcRun();
  if(MC_API.busy || (typeof STALE!=="undefined" && STALE.on) || !CANWRITE || !r || !r.ok || !LOADED.has("mailchimp") || !LOADED.has("pieces")) return 0;
  if(MC_API.done===r.at) return 0;
  MC_API.busy=true; let n=0;
  try{
    const taken=new Set();
    for(const x of mcApiCamps().sort((a,b)=>String(b.at).localeCompare(String(a.at)))){
      const nums=mcNums(x), p=mcFindPiece(x, taken);
      if(p){ taken.add(p.id); const part=Object.assign({mcId:x.id}, nums, p.mcName?{}:{mcName:x.name}, p.status==="done"?{}:{status:"done"});
        if(!mcSame(p, part)){ await patch("pieces", p.id, part); n++; } continue; }
      const nid="mc-"+x.id; if(S.pieces[nid]) continue;
      await put("pieces", nid, Object.assign({channel:"mailchimp", title:x.subject||x.name||"Mailchimp campaign", mcName:x.name||"", mcId:x.id, date:x.date, sentAt:x.date,
        status:"done", kind:"Email", owner:"", segment:"", resend:!!x.resend, mcFrom:"Mailchimp (read automatically)"}, nums)); n++;
    }
    MC_API.done=r.at; MC_API.err="";
  }catch(e){ MC_API.err=(e&&e.message)||"couldn't save"; }
  finally{ MC_API.busy=false; }
  return n;
}
/* System Health */
function hhMailchimp(){
  const r=mcRun();
  if(!r) return LOADED.has("mailchimp") ? hhRow("mcapi","Mailchimp Reports","off","Not connected yet. Once a Mailchimp API key is saved as the MAILCHIMP_API_KEY secret on marketing-hq-data, every campaign's numbers come in by themselves every 6 hours.") : null;
  if(r.waiting) return hhRow("mcapi","Mailchimp Reports","off",(r.error||"Not connected yet.")+" Until then, drop the Mailchimp campaigns export on Results.");
  if(!r.ok) return hhRow("mcapi","Mailchimp Reports","bad","The read failed "+hhWhen(r.at)+": "+(r.error||"no reason given")+". "+(r.lastOk?"Last good read "+hhWhen(r.lastOk)+".":"No good read yet.")+" The export can still be dropped on Results.");
  if((Date.now()-Date.parse(r.at))/36e5>14) return hhRow("mcapi","Mailchimp Reports","warn","Last read "+hhWhen(r.at)+", more than 14 hours ago (it runs every 6). The \"Mailchimp reports\" workflow in marketing-hq-data may be paused.");
  return hhRow("mcapi","Mailchimp Reports","ok","Read "+hhWhen(r.at)+": "+rsN(r.campaigns)+" campaigns from the last 120 days."+(MC_API.err?" Matching them here hit a problem: "+MC_API.err:""));
}
