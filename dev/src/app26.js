/* ================= Results: the website =================
   Added Nov 20, 2026 (website note). www.mismo.org sends cookie-free visit counts to Cloudflare Web Analytics
   (site admins aren't counted); the "Web traffic" workflow in marketing-hq-data pulls them every night into
   data/webtraffic.json: one record per day ("webtraffic/<YYYY-MM-DD>": visits, views, pages, refs, countries,
   devices, each list as [name, page views, visits]) and "webtraffic/_run" for the last pull. Counting started
   Nov 20, 2026; Higher Logic's Site Traffic report stays the source for anything before that.
   Beside it: the "Not helpful" comments on Mimi and Ask MISMO answers (data/aifeedback.json) and the website
   problem reports (data/websiteproblems.json), both filed only by the sign-up workflow. */
const WT = {days:30};
const WT_START = "2026-11-20", WT_TOKEN_EXPIRES = "2027-11-20";
function wtRun(){ return (S.webtraffic||{})._run || null; }
function wtDays(){ return Object.values(S.webtraffic||{}).filter(d=>d && /^\d{4}-\d\d-\d\d$/.test(d.date||"")).sort((a,b)=>a.date.localeCompare(b.date)); }
/* add up [name, views, visits] lists over some days */
function wtSum(days, key){
  const m={}; days.forEach(d=>(d[key]||[]).forEach(r=>{ const k=String(r[0]||""); const x=m[k]||(m[k]={k, views:0, visits:0}); x.views+=+r[1]||0; x.visits+=+r[2]||0; }));
  return Object.values(m).sort((a,b)=>b.views-a.views);
}
function wtRefName(h){ h=String(h||"").toLowerCase(); if(!h) return "Direct or not shared";
  if(/(^|\.)mismo\.org$/.test(h)) return "Another mismo.org page ("+h+")";
  if(/google\./.test(h)) return "Google"; if(/bing\.com$/.test(h)) return "Bing"; if(/linkedin\.com$|lnkd\.in$/.test(h)) return "LinkedIn";
  if(/duckduckgo/.test(h)) return "DuckDuckGo"; if(/yahoo\./.test(h)) return "Yahoo"; if(/chatgpt\.com$|openai\.com$/.test(h)) return "ChatGPT"; if(/perplexity/.test(h)) return "Perplexity";
  if(/mba\.org$/.test(h)) return "MBA ("+h+")"; if(/higherlogic|informz/.test(h)) return "MISMO Matters email ("+h+")";
  return h.replace(/^www\./,""); }
function wtDevice(d){ d=String(d||"").toLowerCase(); return d==="desktop"?"Desktop":d==="mobile"?"Phone":d==="tablet"?"Tablet":d?d.charAt(0).toUpperCase()+d.slice(1):"Not known"; }
/* visits as bars and page views as a line, one shared count axis */
function wtChart(days){
  if(!days.length) return '';
  const W=760, H=210, L=48, R=12, Tp=14, B=28, n=days.length;
  const top=Math.max(10, ...days.map(d=>Math.max(+d.views||0,+d.visits||0)));
  const step=Math.pow(10, Math.floor(Math.log10(top))), nice=Math.ceil(top/step)*step;
  const bw=(W-L-R)/n, X=i=>L+i*bw+bw/2, Y=v=>Tp+(1-v/nice)*(H-Tp-B);
  let g=''; for(let k=0;k<=4;k++){ const v=nice*k/4; g+='<line x1="'+L+'" x2="'+(W-R)+'" y1="'+Y(v)+'" y2="'+Y(v)+'" class="rs-grid"/><text x="'+(L-8)+'" y="'+(Y(v)+4)+'" class="rs-ax" text-anchor="end">'+rsN(Math.round(v))+'</text>'; }
  const every=Math.max(1, Math.ceil(n/8));
  days.forEach((d,i)=>{ if(i%every===0 || i===n-1){ const dt=P(d.date); g+='<text x="'+X(i)+'" y="'+(H-8)+'" class="rs-ax" text-anchor="middle">'+MON[dt.getMonth()]+' '+dt.getDate()+'</text>'; } });
  const bars=days.map((d,i)=>{ const v=+d.visits||0, w=Math.max(2,Math.min(26,bw*0.62)); return '<rect class="wt-bar" x="'+(X(i)-w/2)+'" y="'+Y(v)+'" width="'+w+'" height="'+Math.max(0,Y(0)-Y(v))+'" rx="2" data-tip="'+esc(fS(d.date)+"\n"+rsN(v)+" visits · "+rsN(d.views)+" page views")+'"/>'; }).join("");
  const line=n>1?'<polyline class="wt-line" points="'+days.map((d,i)=>X(i)+","+Y(+d.views||0)).join(" ")+'"/>':'';
  const dots=days.map((d,i)=>'<circle class="wt-dot" cx="'+X(i)+'" cy="'+Y(+d.views||0)+'" r="'+(n>60?2:3.5)+'" data-tip="'+esc(fS(d.date)+"\n"+rsN(d.views)+" page views · "+rsN(d.visits)+" visits")+'"/>').join("");
  return '<div class="rs-chart"><div class="rs-legend"><span><i class="rs-k wt-kb"></i>Visits</span><span><i class="rs-k wt-kl"></i>Page views</span></div>'+
    '<svg viewBox="0 0 '+W+' '+H+'" role="img" aria-label="Visits and page views on www.mismo.org each day">'+g+bars+line+dots+'</svg></div>';
}
function rsWebsite(){
  const all=wtDays(), run=wtRun();
  const head='<div class="ch"><h2>Website · www.mismo.org</h2><span class="note">counted by Cloudflare Web Analytics since Nov 20, 2026 · no cookies · site admins not counted</span><span class="sp"></span>'+
    '<select class="plain" id="wt-days" aria-label="Days shown">'+[[7,"Last 7 Days"],[30,"Last 30 Days"],[90,"Last 90 Days"],[0,"Since Nov 20, 2026"]].map(([v,l])=>'<option value="'+v+'"'+(WT.days===v?' selected':'')+'>'+l+'</option>').join("")+'</select></div>';
  if(!all.length) return '<div class="card rs-sec" id="rs-web">'+head+'<div class="empty">'+(run&&!run.ok?'The nightly pull from Cloudflare didn\'t work: '+esc(run.error||"no reason given")+'. System Health shows it too.':'The first nightly pull from Cloudflare hasn\'t run yet. It runs every night at about 3:23 AM Eastern; numbers start with Nov 20, 2026.')+
    ' For traffic before Nov 20, use Higher Logic\'s Site Traffic report.</div></div>';
  const days=WT.days?all.slice(-WT.days):all, withLists=days.filter(d=>d.pages);
  const visits=days.reduce((n,d)=>n+(+d.visits||0),0), views=days.reduce((n,d)=>n+(+d.views||0),0), last=all[all.length-1];
  const best=days.reduce((b,d)=>(+d.visits||0)>(+b.visits||0)?d:b, days[0]);
  const pages=wtSum(withLists,"pages").slice(0,10).map(x=>({l:x.k||"/",v:x.views,c:"--c1",tip:(x.k||"/")+"\n"+rsN(x.views)+" page views · "+rsN(x.visits)+" visits"}));
  const refsM={}; wtSum(withLists,"refs").forEach(x=>{ const k=wtRefName(x.k); const r=refsM[k]||(refsM[k]={l:k,v:0}); r.v+=x.visits||x.views; });
  const refs=Object.values(refsM).sort((a,b)=>b.v-a.v).slice(0,9).map(r=>Object.assign(r,{c:"--c4",tip:r.l+" · "+rsN(r.v)+" visits"}));
  const countries=wtSum(withLists,"countries").slice(0,8).map(x=>({l:x.k||"Not known",v:x.visits||x.views,c:"--c3",tip:(x.k||"Not known")+" · "+rsN(x.visits||x.views)+" visits"}));
  const dev=wtSum(days,"devices"), devT=dev.reduce((n,x)=>n+(x.visits||x.views),0)||1, devC=["--c1","--c2","--c3","--c4","--c5"];
  const devices=dev.length?'<div class="rs-stack">'+dev.map((x,i)=>'<i style="flex:'+(x.visits||x.views)+' 1 0;background:var('+devC[i%5]+')" data-tip="'+esc(wtDevice(x.k)+": "+rsN(x.visits||x.views)+" visits ("+pct((x.visits||x.views)/devT)+")")+'"></i>').join("")+'</div>'+
    '<div class="rs-legend col">'+dev.map((x,i)=>'<span><i class="rs-k" style="background:var('+devC[i%5]+')"></i>'+esc(wtDevice(x.k))+'<b>'+pct((x.visits||x.views)/devT)+'</b></span>').join("")+'</div>':'<div class="empty sm">No device counts yet.</div>';
  const span=WT.days?'last '+days.length+' day'+(days.length===1?'':'s'):'since Nov 20';
  return '<div class="card rs-sec" id="rs-web">'+head+
    rsKpis([{v:rsN(visits),k:"Visits",s:span},{v:rsN(views),k:"Page Views",s:span},{v:visits?(views/visits).toFixed(1):"—",k:"Pages per Visit",s:"page views ÷ visits"},
      {v:rsN(Math.round(visits/Math.max(1,days.length))),k:"Visits a Day",s:"on average"},{v:rsN(last.visits),k:"Latest Day",s:fS(last.date)+" · "+rsN(last.views)+" views"},
      {v:rsN(best.visits),k:"Busiest Day",s:fS(best.date)}])+
    '<div class="rs-box"><h3>Visits and Page Views Each Day</h3>'+wtChart(days)+'<p class="rs-note">Days run midnight to midnight UTC (7 PM to 7 PM Eastern), the way Cloudflare counts them. For anything before Nov 20, 2026, use Higher Logic\'s Site Traffic report.</p></div>'+
    '<div class="rs-g2"><div class="rs-box"><h3>Top Pages</h3>'+(pages.length?hbars(pages,v=>rsN(v)+" views"):'<div class="empty sm">No pages counted for these days.</div>')+'</div>'+
      '<div class="rs-box"><h3>Where Visitors Come From</h3>'+(refs.length?hbars(refs,v=>rsN(v)+" visits"):'<div class="empty sm">No referrers counted for these days.</div>')+'<p class="rs-note">"Direct or not shared" is people who typed the address, used a bookmark, or came from an app or email that doesn\'t say where they came from.</p></div></div>'+
    '<div class="rs-g2"><div class="rs-box"><h3>Devices</h3>'+devices+'</div>'+
      '<div class="rs-box"><h3>Countries</h3>'+(countries.length?hbars(countries,v=>rsN(v)+" visits"):'<div class="empty sm">No countries counted for these days.</div>')+'</div></div>'+
  '</div>';
}
/* what people on the website told MISMO: "Not helpful" comments on AI answers, and problem reports */
function rsVoices(){
  const since=new Date(Date.now()-30*864e5).toISOString();
  const fb=vals("aifeedback").filter(x=>x.at && x.comment).sort((a,b)=>String(b.at).localeCompare(String(a.at)));
  const pr=vals("websiteproblems").filter(x=>x.at && x.message).sort((a,b)=>String(b.at).localeCompare(String(a.at)));
  const drop=(S.websiteproblems||{})._dropped||null;
  const pg=u=>{ u=String(u||""); const s=u.replace(/^https?:\/\/(www\.)?/,"").replace(/[?#].*$/,""); return /^https:\/\//.test(u)?'<a href="'+esc(u)+'" target="_blank" rel="noopener">'+esc(s||u)+'</a>':esc(s); };
  const who=x=>x.e?esc(x.n||x.e)+' · <a href="mailto:'+esc(x.e)+'">'+esc(x.e)+'</a>':'anonymous'+(x.reply?' · left <a href="mailto:'+esc(x.reply)+'">'+esc(x.reply)+'</a>':'');
  const fbRows=fb.slice(0,6).map(x=>'<li class="vo-i"><div class="vo-h"><span class="rs-tag">'+esc(x.assistant||"AI")+'</span><span>'+esc(fS(x.at.slice(0,10)))+'</span></div><div class="vo-q">“'+esc(x.comment)+'”</div><div class="vo-m">Asked: '+esc(String(x.question||"").slice(0,180))+'</div><div class="vo-m">'+(x.page?pg(x.page)+' · ':'')+who(x)+'</div></li>').join("");
  const prRows=pr.slice(0,6).map(x=>'<li class="vo-i"><div class="vo-h"><span class="rs-tag">'+(x.via==="mimi"?"From Mimi":"Page Link")+'</span><span>'+esc(fS(x.at.slice(0,10)))+'</span></div><div class="vo-q">“'+esc(String(x.message).slice(0,400))+'”</div><div class="vo-m">'+(x.page?pg(x.page)+' · ':'')+who(x)+(x.signedIn?' · signed in':'')+'</div></li>').join("");
  const n30=a=>a.filter(x=>x.at>=since).length;
  return '<div class="grid2 rs-row" id="rs-voices"><div class="card"><div class="ch"><h2>AI Answer Feedback</h2><span class="cnt">'+fb.length+'</span><span class="note">"Not helpful" on Mimi and Ask MISMO · '+n30(fb)+' in the last 30 days</span></div>'+
      (fbRows?'<ul class="vo-list">'+fbRows+'</ul>':'<div class="empty">No comments yet. They arrive when someone marks a Mimi or Ask MISMO answer "Not helpful" and says why.</div>')+
      (fb.length>6?'<p class="rs-note pad">The newest 6 of '+fb.length+'. Vanessa gets each day\'s in the morning email, with Jonna copied.</p>':'')+'</div>'+
    '<div class="card"><div class="ch"><h2>Website Problems</h2><span class="cnt">'+pr.length+'</span><span class="note">reported from a page or through Mimi · '+n30(pr)+' in the last 30 days</span></div>'+
      (prRows?'<ul class="vo-list">'+prRows+'</ul>':'<div class="empty">No problem reports yet. They arrive from the website\'s report-a-problem form and from Mimi.</div>')+
      (drop&&drop.total?'<p class="rs-note pad">'+rsN(drop.total)+' spam or repeat report'+(drop.total===1?' was':'s were')+' dropped and never kept'+(drop.byReason?' ('+Object.entries(drop.byReason).map(([k,v])=>esc(k)+' '+v).join(', ')+')':'')+'.</p>':'')+'</div></div>';
}
function wtWire(el){ const s=$("#wt-days",el); if(s) s.onchange=()=>{ WT.days=+s.value; renderResults(); }; }
/* System Health: the nightly pull and the token's end date */
function hhWebTraffic(){
  const r=wtRun();
  if(!r) return LOADED.has("webtraffic")? hhRow("cfwa","Cloudflare Web Analytics","off","Hasn't run yet. It pulls www.mismo.org's visit counts every night at about 3:23 AM Eastern.") : null;
  const left=Math.ceil((Date.parse(WT_TOKEN_EXPIRES+"T00:00:00Z")-Date.now())/864e5);
  const tok=left<=30 ? " The Cloudflare token "+(left<=0?"expired":"expires")+" Nov 20, 2027"+(left>0?" (in "+left+" day"+(left===1?"":"s")+")":"")+": ask for a new read-only one and put it in the CLOUDFLARE_ANALYTICS_TOKEN secret on marketing-hq-data." : "";
  if(!r.ok) return hhRow("cfwa","Cloudflare Web Analytics","bad","The nightly pull failed "+hhWhen(r.at)+": "+(r.error||"no reason given")+". "+(r.lastOk?"Last good pull "+hhWhen(r.lastOk)+".":"No good pull yet.")+tok);
  if(left<=30) return hhRow("cfwa","Cloudflare Web Analytics","warn",tok.trim());
  const hrs=(Date.now()-Date.parse(r.at))/36e5;
  if(hrs>36) return hhRow("cfwa","Cloudflare Web Analytics","warn","Last pulled "+hhWhen(r.at)+", more than a day ago. The \"Web traffic\" workflow in marketing-hq-data may be paused; GitHub pauses scheduled runs after 60 days without changes.");
  const d=wtDays(), last=d[d.length-1];
  return hhRow("cfwa","Cloudflare Web Analytics","ok","Pulled "+hhWhen(r.at)+"."+(last?" "+fS(last.date)+": "+rsN(last.visits)+" visits, "+rsN(last.views)+" page views.":""));
}
