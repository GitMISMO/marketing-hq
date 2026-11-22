/* ================= MISMO Matters email numbers from Higher Logic, read automatically (Nov 21, 2026) =================
   Jonna: "then we have automated stats from Informz". The "MISMO Matters email numbers (Informz)" workflow in
   marketing-hq-data reads Higher Logic's Thrive Marketing Professional (formerly Informz) every 6 hours through its
   GridRequest API (read only) into data/informz.json: "informz/send-<mailing_instance_id>" for each send (sent,
   delivered, unique opens and clicks, bounces, unsubscribes, forwards, mobile and desktop opens) and "informz/_run".
   Here, each edition's MISMO Matters sends (one or two waves) are found by name and date and become the edition's
   numbers on Results and the MISMO Matters page, so nobody types them in. Anything typed by hand that Higher Logic
   doesn't give (top links, webmail and browser opens, total opens) stays. Nothing is written back. */
function izRun(){ return (S.informz||{})._run || null; }
function izSends(){ return Object.values(S.informz||{}).filter(d=>d && d.instanceId && d.date && +d.sent); }
const izIsMM = d=>/mismo\s*matters/i.test((d.name||"")+" "+(d.subject||""));
/* the edition's sends: MISMO Matters sends from the day before its publish date up to the day before the next one */
function izEdSends(ed){
  const pub=(ed && ed.dates && ed.dates.publish) || ""; if(!pub) return [];
  const later=editionsSorted().map(e=>(e.dates||{}).publish||"").filter(p=>p>pub).sort()[0] || add(pub,28);
  const from=add(pub,-1), to=add(later,-1);
  return izSends().filter(d=>izIsMM(d) && d.date>=from && d.date<to).sort((a,b)=>String(a.at||a.date).localeCompare(String(b.at||b.date)));
}
/* the edition's numbers from Higher Logic in the shape the edition's stats use, or null */
function izFor(ed){
  const xs=izEdSends(ed); if(!xs.length) return null;
  const sum=k=>xs.reduce((n,d)=>n+(+d[k]||0),0);
  const o={recipients:sum("sent"), delivered:sum("delivered"), opens:sum("opensUnique"), clicks:sum("clicksUnique"), unsubs:sum("unsubs")+sum("optOuts"),
    bounces:sum("bounces"), hard:sum("hardBounces"), soft:sum("softBounces"), blocked:sum("blocked"), forwards:sum("forwards"), unsubsHL:sum("unsubs")+sum("optOuts"),
    fromInformz:true, informzAt:xs.map(d=>d.statsAt||"").sort().pop()||"", informzSends:xs.length};
  /* where people read, as a share of the unique opens (the edition's fields are percentages) */
  if(o.opens && (sum("opensMobile")||sum("opensDesktop"))){ o.cMobile=Math.round(sum("opensMobile")/o.opens*1000)/10; o.cDesktop=Math.round(sum("opensDesktop")/o.opens*1000)/10; }
  if(xs.length>1) xs.slice(0,2).forEach((d,i)=>{ const w="w"+(i+1); o[w+"Label"]="Wave "+(i+1)+" · "+fS(d.date); o[w+"Sent"]=+d.sent||0; o[w+"Delivered"]=+d.delivered||0; o[w+"Opens"]=+d.opensUnique||0; o[w+"Clicks"]=+d.clicksUnique||0; });
  return o;
}
/* what the edition shows: Higher Logic's numbers over anything typed in, keeping what Higher Logic doesn't give */
function izMerge(ed){
  const iz=izFor(ed); if(!iz) return null;
  const typed=ed.stats||{}, out=Object.assign({}, typed, iz);
  ["w1Label","w2Label"].forEach(k=>{ if(typed[k] && out[k]) out[k]=typed[k]; });
  return out;
}
/* System Health */
function hhInformz(){
  const r=izRun();
  if(!r) return LOADED.has("informz") ? hhRow("informz","MISMO Matters Email Numbers","off","Not connected yet. Once Higher Logic sets up an API user and its details are saved on marketing-hq-data, each edition's numbers fill in by themselves every 6 hours.") : null;
  if(r.waiting) return hhRow("informz","MISMO Matters Email Numbers","off",r.error||"Not connected yet.");
  if(!r.ok) return hhRow("informz","MISMO Matters Email Numbers","bad","The read from Higher Logic failed "+hhWhen(r.at)+": "+(r.error||"no reason given")+". "+(r.lastOk?"Last good read "+hhWhen(r.lastOk)+".":"No good read yet.")+" The numbers can still be typed in on the MISMO Matters page.");
  if((Date.now()-Date.parse(r.at))/36e5>14) return hhRow("informz","MISMO Matters Email Numbers","warn","Last read "+hhWhen(r.at)+", more than 14 hours ago (it runs every 6). The \"MISMO Matters email numbers (Informz)\" workflow in marketing-hq-data may be paused.");
  const mm=izSends().filter(izIsMM).length;
  return hhRow("informz","MISMO Matters Email Numbers","ok","Read from Higher Logic "+hhWhen(r.at)+": "+rsN(r.sends)+" sends, "+rsN(mm)+" of them MISMO Matters.");
}
