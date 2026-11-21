/* ================= The LinkedIn page, read automatically (Nov 21, 2026) =================
   Jonna: "not ready for auto linkedin posts but would love for us to bring back information from linkedin
   automatically". The "LinkedIn page" workflow in marketing-hq-data reads MISMO's company page every 3 hours through
   LinkedIn's Community Management API (read only: the "MISMO Media Page Reporting" app; nothing is ever posted) into
   data/linkedin.json: "linkedin/post-<id>" for each post (link, date, words, impressions, clicks, likes, comments,
   reposts), "linkedin/day-<date>" for the page's daily totals and "linkedin/_run" for the last read.
   Here, whoever has MISMO Media open with saving rights matches each post to its own record: the post is marked
   Posted with its live link and its numbers fill in (the MISMO Matters posts, Sponsor Highlights, the Monday Mic'd Up
   posts). A post MISMO Media didn't know about (dated Oct 1, 2026 or later) is added, the way the monthly export did.
   The page's daily totals become the LinkedIn page's Daily totals records that Results charts. */
const LI_API={done:"", busy:false, timer:0, from:"2026-10-01"};
function liRun(){ return (S.linkedin||{})._run || null; }
function liApiPosts(){ return Object.values(S.linkedin||{}).filter(d=>d && d.urn && d.date); }
function liApiDays(){ return Object.values(S.linkedin||{}).filter(d=>d && !d.urn && /^\d{4}-\d\d-\d\d$/.test(d.date||"")); }
function liLive(){ const r=liRun(); return !!(r && r.ok && r.lastOk && (Date.now()-Date.parse(r.lastOk))<3*864e5); }
/* the month's LinkedIn numbers have come in by themselves once a good read happened after the month ended */
function liApiCovers(per){ const r=liRun(); if(!r || !r.lastOk) return false; const [y,m]=per.split("-").map(Number); return r.lastOk.slice(0,10) > new Date(Date.UTC(y,m,0)).toISOString().slice(0,10); }
/* how alike two posts' words are: the share of the shorter one's words found in the other */
const liWords=s=>new Set(String(s||"").toLowerCase().replace(/https?:\/\/\S+/g," ").replace(/#\w+/g," ").match(/[a-z0-9']{3,}/g)||[]);
function liSim(a,b){ const A=liWords(String(a||"").slice(0,500)), B=liWords(String(b||"").slice(0,500)); if(A.size<3||B.size<3) return 0; let n=0; A.forEach(w=>{ if(B.has(w)) n++; }); return n/Math.min(A.size,B.size); }
const liDays=(a,b)=>Math.abs((P(a)-P(b))/864e5);
const liNums=x=>({impressions:+x.impressions||0, uniqueImpressions:+x.uniqueImpressions||0, clicks:+x.clicks||0, reactions:+x.likes||0, comments:+x.comments||0, reposts:+x.shares||0});
/* which of MISMO Media's own records a post on the page is */
function liFindPiece(x, taken){
  const id=String(x.urn).split(":").pop();
  const own=vals("pieces").filter(p=>p.channel==="linkedin" && !liIsDay(p) && !p.archived && p.status!=="canceled" && !taken.has(p.id));
  const exact=own.find(p=>p.liUrn===x.urn || (p.postedUrl && p.postedUrl.indexOf(id)>=0)); if(exact) return exact;
  let best=null, score=0;
  own.filter(p=>!p.liUrn).forEach(p=>{ const near=p.date ? liDays(p.date, x.date)<=3 : true; if(!near) return;
    const s=liSim(p.copy||p.title, x.text); const need=p.date?0.6:0.75; if(s>=need && s>score){ best=p; score=s; } });
  return best;
}
function liFindEpisode(x, taken){
  const id=String(x.urn).split(":").pop();
  const eps=vals("episodes").filter(e=>!taken.has(e.id));
  const exact=eps.find(e=>e.liUrn===x.urn || (e.linkedinUrl && e.linkedinUrl.indexOf(id)>=0)); if(exact) return exact;
  const m=String(x.text||"").match(/mic['’]?d up[\s\S]{0,40}?ep(?:isode)?\.?\s*(\d{1,3})/i) || (/mic['’]?d up/i.test(x.text||"") && String(x.text).match(/\bep(?:isode)?\.?\s*(\d{1,3})\b/i));
  return eps.find(e=>!e.liUrn && ((m && +e.num===+m[1] && e.airDate && liDays(e.airDate, x.date)<=14) || (e.linkedinCopy && liDate(e) && liDays(liDate(e), x.date)<=3 && liSim(e.linkedinCopy, x.text)>=0.6))) || null;
}
const liSame=(rec, part)=>Object.keys(part).every(k=>String(rec[k]==null?"":rec[k])===String(part[k]==null?"":part[k]));
function liSoon(){ clearTimeout(LI_API.timer); LI_API.timer=setTimeout(liSync, 3000); }
async function liSync(){
  const r=liRun();
  if(LI_API.busy || STALE.on || !CANWRITE || !r || !r.ok || !LOADED.has("linkedin") || !LOADED.has("pieces") || !LOADED.has("episodes")) return;
  if(LI_API.done===r.at) return;
  LI_API.busy=true; let n=0;
  try{
    const taken=new Set();
    for(const x of liApiPosts().sort((a,b)=>String(b.at).localeCompare(String(a.at)))){
      const nums=liNums(x);
      const ep=liFindEpisode(x, taken);
      if(ep){ taken.add(ep.id); const part={liUrn:x.urn, linkedinDone:true, linkedinUrl:ep.linkedinUrl||x.url, liImpressions:nums.impressions, liClicks:nums.clicks, liReactions:nums.reactions};
        if(!liSame(ep, part)){ await patch("episodes", ep.id, part); n++; } continue; }
      const p=liFindPiece(x, taken);
      if(p){ taken.add(p.id); const part=Object.assign({liUrn:x.urn, postedUrl:p.postedUrl||x.url, date:p.date||x.date}, nums, p.status==="done"?{}:{status:"done", autoPost:false, postedBy:"LinkedIn page (read automatically)", postedAt:x.at});
        if(!liSame(p, part)){ await patch("pieces", p.id, part); n++; } continue; }
      if(x.date < LI_API.from) continue;
      const nid="li-"+String(x.urn).split(":").pop(); if(S.pieces[nid]) continue;
      const text=String(x.text||""), first=text.split("\n").map(s=>s.trim()).find(Boolean)||"";
      await put("pieces", nid, Object.assign({channel:"linkedin", title:(first.length>90?first.slice(0,87)+"…":first)||("Post on "+fS(x.date)), copy:text, date:x.date, status:"done",
        postedUrl:x.url, liUrn:x.urn, kind:/\bin the news\b|#inthenews\b/i.test(text)?"In the News":/mic['’]?d up/i.test(text)?"Mic'd Up":/sponsor/i.test(text)?"Sponsor Highlight":"Other", owner:"",
        source:"LinkedIn page (read automatically)"}, nums)); n++;
    }
    /* the page's daily totals: the records Results charts, one a day */
    for(const d of liApiDays()){
      const part={impressions:+d.impressions||0, clicks:+d.clicks||0, reactions:+d.likes||0, comments:+d.comments||0, reposts:+d.shares||0, uniqueImpressions:+d.uniqueImpressions||0};
      const had=vals("pieces").find(q=>q.channel==="linkedin" && liIsDay(q) && q.date===d.date);
      if(had){ if(!liSame(had, part)){ await patch("pieces", had.id, part); n++; } }
      else { await put("pieces", "lid-"+d.date, Object.assign({channel:"linkedin", title:"LinkedIn page, "+fS(d.date), date:d.date, status:"done", kind:"Daily totals", owner:"", source:"LinkedIn page (read automatically)"}, part)); n++; }
    }
    LI_API.done=r.at;
  }catch(e){ LI_API.err=(e&&e.message)||"couldn't save"; }
  finally{ LI_API.busy=false; }
  return n;
}
/* System Health */
function hhLinkedIn(){
  const r=liRun();
  if(!r) return LOADED.has("linkedin") ? hhRow("liapi","LinkedIn Page","off","Not connected yet. Once LinkedIn approves the MISMO Media Page Reporting app, the LinkedIn page workflow reads posts and numbers every 3 hours.") : null;
  if(r.waiting) return hhRow("liapi","LinkedIn Page","off",r.error||"Not connected yet.");
  const left=r.tokenExpires ? Math.ceil((Date.parse(r.tokenExpires+"T00:00:00Z")-Date.now())/864e5) : null;
  const tok=left!=null && left<=10 ? " The LinkedIn token "+(left<=0?"ran out":"runs out")+" "+fS(r.tokenExpires)+": a page admin makes a new one in LinkedIn's token generator and saves it as the LINKEDIN_TOKEN secret on marketing-hq-data (and the new date in LINKEDIN_TOKEN_EXPIRES)." : "";
  if(!r.ok) return hhRow("liapi","LinkedIn Page","bad","The read failed "+hhWhen(r.at)+": "+(r.error||"no reason given")+". "+(r.lastOk?"Last good read "+hhWhen(r.lastOk)+".":"No good read yet.")+tok);
  if(left!=null && left<=10) return hhRow("liapi","LinkedIn Page","warn",tok.trim());
  if((Date.now()-Date.parse(r.at))/36e5>8) return hhRow("liapi","LinkedIn Page","warn","Last read "+hhWhen(r.at)+", more than 8 hours ago (it runs every 3). The \"LinkedIn page\" workflow in marketing-hq-data may be paused.");
  return hhRow("liapi","LinkedIn Page","ok","Read "+hhWhen(r.at)+": "+rsN(r.posts)+" posts"+(r.followers?", "+rsN(r.followers)+" followers":"")+"."+(LI_API.err?" Matching them here hit a problem: "+LI_API.err:""));
}
