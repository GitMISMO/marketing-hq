/* ================= Monthly numbers =================
   Some results can't be fetched automatically (LinkedIn won't let outside tools read the
   page's analytics, and the daily feed isn't running for every channel yet). On the 1st of
   each month the previous month's numbers come due: a checklist at the top of Results, a
   pop-up on Results and LinkedIn until they're in, a count on the Results menu item, and a
   date on the Schedule. Each one is ticked off by itself when its file is dropped in (or its
   stats are typed in), or by hand. Kept in data/monthly.json: "monthly/<YYYY-MM>" is the
   month being reported. */
const MN = {closed:{}};
function mnPeriod(d){ const t=d?P(d):today(); const p=new Date(t.getFullYear(), t.getMonth()-1, 1); return p.getFullYear()+"-"+String(p.getMonth()+1).padStart(2,"0"); }
function mnName(per){ return MONL[+per.slice(5)-1]+" "+per.slice(0,4); }
function mnFeedLive(k){ const f=feed(k); if(!f||!f.updated) return false; const d=new Date(f.updated); return !isNaN(d) && (Date.now()-d.getTime()) < 4*864e5; }
function mnSentEdition(per){ return editionsSorted().find(e=>e.dates && e.dates.publish && e.dates.publish.slice(0,7)===per) || null; }
function mnTasks(per){
  const m=MONL[+per.slice(5)-1], ed=mnSentEdition(per);
  return [
    {k:"li", t:"LinkedIn", page:"linkedin",
      how:'On the MISMO LinkedIn page, open <b>Analytics › Content</b>, set the dates to <b>'+m+'</b>, and press <b>Export</b>. Drop the file into <b>LinkedIn Page Analytics Export</b> below.',
      why:'Brings in impressions, clicks and reactions for every post and Mic\'d Up Live, and any post that says "In the News" goes into MISMO Matters.',
      link:["Open LinkedIn Analytics","https://www.linkedin.com/company/mismo-mortgage-industry-standards-maintenance-organization/admin/analytics/updates/"], drop:"rs-li"},
    {k:"yt", t:"YouTube", feed:"youtube",
      how:'In <b>YouTube Studio › Analytics › Advanced mode › Content</b>, set the dates to <b>'+m+'</b>, then <b>Export › Comma-separated values</b>. Drop the file into <b>YouTube Studio Export</b> below.',
      why:'Views, watch time and likes for each Mic\'d Up episode.', link:["Open YouTube Studio","https://studio.youtube.com/"], drop:"rs-yt"},
    {k:"mc", t:"Mailchimp", feed:"mailchimp",
      how:'In <b>Mailchimp › Campaigns › Reports</b>, export the campaigns sent in <b>'+m+'</b> (CSV). Drop the file into <b>Mailchimp Campaigns Export</b> below.',
      why:'Sends, opens, clicks and unsubscribes for each campaign.', link:["Open Mailchimp Reports","https://admin.mailchimp.com/reports/"], drop:"rs-mc"},
    {k:"mm", t:"MISMO Matters", feed:"matters", skip:!ed,
      how: ed ? 'Open Higher Logic\'s report for the <b>'+esc(monthName(ed.month))+'</b> mailing and type Sent To, Delivered, Opens, Clicks, Unsubscribes and the most-clicked links into <b>Record Stats</b>.' : 'No MISMO Matters went out in '+m+'.',
      why:'The open rate and clicks for the edition.', auto: ed && +edStats(ed).recipients, act: ed ? ["Record Stats", ()=>openStats(ed)] : null},
    {k:"sp", t:"Spotify", skip:MU_PAUSED.spotify,
      how:'In <b>Spotify for Creators › Analytics</b>, look up each Mic\'d Up episode\'s plays and type them into <b>Spotify Plays</b> on the episode (MISMO Mic\'d Up › the episode › Results).',
      why:'Plays for each episode on Spotify.', link:["Open Spotify for Creators","https://creators.spotify.com/"], act:["Open Mic'd Up", ()=>go("micdup")]}
  ].filter(x=>!x.skip);
}
function mnDoc(per){ return (S.monthly||{})[per] || {}; }
function mnState(per, x){
  const d=mnDoc(per)[x.k];
  if(d && d.on) return {done:true, how:"by hand", when:d.on, who:d.by||""};
  if(d && d.file) return {done:true, how:"file", when:d.file};
  if(x.auto) return {done:true, how:"typed in"};
  if(x.feed && mnFeedLive(x.feed)) return {done:true, how:"feed"};
  return {done:false};
}
function mnOpen(per, only){ return mnTasks(per).filter(x=>(!only||x.k===only) && !mnState(per,x).done); }
/* called by the Results drops when a file goes in */
async function mnMarkFile(k){ const per=mnPeriod(); if(!LOADED.has("monthly") && LIVE) return; const doc=Object.assign({}, mnDoc(per)); doc[k]=Object.assign({}, doc[k]||{}, {file:T()}); await put("monthly", per, doc); }
async function mnMark(k, on){ const per=mnPeriod(); const doc=Object.assign({}, mnDoc(per)); doc[k]= on ? {on:T()} : {}; await put("monthly", per, doc); }

/* the checklist card: full at the top of Results, one line on LinkedIn */
function mnCard(only){
  const per=mnPeriod(), all=mnTasks(per).filter(x=>!only||x.k===only), open=all.filter(x=>!mnState(per,x).done);
  if(only && !open.length) return '';
  const row=x=>{ const s=mnState(per,x);
    return '<div class="mn-row'+(s.done?" done":"")+'"><span class="mn-tick" aria-hidden="true">'+(s.done?"✓":"")+'</span><div class="mn-b"><b>'+esc(x.t)+'</b>'+
      (s.done ? '<small>'+(s.how==="feed"?"Filled in by the daily feed":s.how==="typed in"?"Stats are in":s.how==="file"?"File brought in "+esc(fS(s.when)):"Marked done "+esc(fS(s.when)))+'</small>'
              : '<div class="mn-how">'+(only?x.how.replace(/ below\./," on Results."):x.how)+'</div><small>'+esc(x.why)+'</small>')+'</div>'+
      '<div class="mn-acts">'+(s.done ? (s.how==="by hand"?'<button class="btn sm" type="button" data-mn-undo="'+x.k+'">Undo</button>':'') :
        (x.link?'<a class="btn sm" href="'+esc(x.link[1])+'" target="_blank" rel="noopener">'+esc(x.link[0])+' ↗</a>':'')+
        (x.drop?'<button class="btn sm pri" type="button" data-mn-drop="'+x.drop+'">Drop the File</button>':'')+
        (x.act?'<button class="btn sm pri" type="button" data-mn-act="'+x.k+'">'+esc(x.act[0])+'</button>':'')+
        '<button class="btn sm" type="button" data-mn-done="'+x.k+'">Mark Done</button>')+'</div></div>'; };
  const n=all.length-open.length;
  return '<div class="card mn'+(open.length?" mn-due":" mn-ok")+'" id="mn-card"><div class="ch"><h2>'+(open.length?esc(mnName(per))+' Numbers Are Due':esc(mnName(per))+' Numbers Are In')+'</h2><span class="cnt">'+n+' of '+all.length+'</span>'+
    (only?'<span class="sp"></span><button class="btn sm" type="button" data-go-results>Go to Results</button>':'<span class="note">due the 1st of each month, for the month before</span>')+'</div>'+
    '<div class="cb">'+(open.length||!only? all.map(row).join("") : '')+'</div></div>';
}
function mnWire(el, only){
  $$("[data-mn-done]",el).forEach(b=>b.onclick=async()=>{ await mnMark(b.dataset.mnDone,true); toast("Marked done"); mnRedraw(); });
  $$("[data-mn-undo]",el).forEach(b=>b.onclick=async()=>{ await mnMark(b.dataset.mnUndo,false); mnRedraw(); });
  $$("[data-mn-drop]",el).forEach(b=>b.onclick=()=>{ if(only){ go("results"); setTimeout(()=>{ const i=$("#"+b.dataset.mnDrop); if(i){ i.scrollIntoView({block:"center"}); i.click(); } },150); return; } const i=$("#"+b.dataset.mnDrop,el); if(i){ i.scrollIntoView({block:"center"}); i.click(); } });
  $$("[data-mn-act]",el).forEach(b=>b.onclick=()=>{ const x=mnTasks(mnPeriod()).find(t=>t.k===b.dataset.mnAct); if(x&&x.act) x.act[1](); });
  $$("[data-go-results]",el).forEach(b=>b.onclick=()=>go("results"));
}
function mnRedraw(){ if(TAB==="results"||TAB==="linkedin") renderTab(TAB); badges(); }

/* the pop-up: once a day per person while anything is open, on Results and LinkedIn */
function mnPopup(tab){
  const per=mnPeriod(), only=tab==="linkedin"?"li":null, open=mnOpen(per, only);
  if(!open.length || $("#mn-pop") || MN.closed[tab]) return;
  let snooze=""; try{ snooze=localStorage.getItem("mm.monthly.snooze."+tab)||""; }catch(e){}
  if(snooze===T()) return;
  const d=document.createElement("div"); d.id="mn-pop"; d.className="mn-pop"; d.setAttribute("role","dialog"); d.setAttribute("aria-modal","true"); d.setAttribute("aria-labelledby","mn-pop-h");
  d.innerHTML='<div class="mn-pop-card"><div class="mn-pop-eye">Monthly Reminder</div><h2 id="mn-pop-h">Time to bring in '+esc(mnName(per))+'\'s numbers</h2>'+
    '<p>'+(only?'LinkedIn can\'t be read automatically, so its numbers come in from an export once a month.':'These channels can\'t be filled in automatically yet, so once a month their numbers come in by hand.')+' It takes a few minutes:</p>'+
    '<ul>'+open.map(x=>'<li><b>'+esc(x.t)+':</b> '+x.how.replace(/ below\./," on Results.")+'</li>').join("")+'</ul>'+
    '<div class="kbtns"><button class="btn pri" type="button" data-pop="go">'+(only?"Do It on Results":"Show Me the Checklist")+'</button><button class="btn" type="button" data-pop="later">Remind Me Tomorrow</button></div></div>';
  document.body.appendChild(d);
  const close=()=>{ MN.closed[tab]=true; d.remove(); };
  d.addEventListener("click",e=>{ const b=e.target.closest("[data-pop]"); if(e.target===d) return close();
    if(!b) return; if(b.dataset.pop==="later"){ try{ localStorage.setItem("mm.monthly.snooze."+tab, T()); }catch(err){} close(); }
    else { close(); if(only) go("results"); const c=$("#mn-card"); if(c) c.scrollIntoView({block:"start", behavior:"smooth"}); } });
  d.addEventListener("keydown",e=>{ if(e.key==="Escape") close(); });
  setTimeout(()=>{ const b=$('[data-pop="go"]',d); if(b) b.focus(); },50);
}
