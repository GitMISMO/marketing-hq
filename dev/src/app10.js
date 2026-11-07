/* ================= Requests ================= */
/* Where marketing and communications requests come in and get sorted. Staff and facilitators
   send them through the public form (resources.mismo.org/forms/request/); the form goes through
   the same Power Automate flow and GitHub workflow as website sign-ups, which files each one in
   data/inbox.json. Only that workflow writes inbox.json. Everything the team adds while
   reviewing (status, owner, notes) is kept in data/requests.json, so the two never collide.
   A request added here by the team goes straight into requests. */
const REQUEST_FORM = "https://resources.mismo.org/forms/request/";
const RQ_STAT = {new:["New","changes"], review:["In Review","review"], info:["Need More Info","wait"], approved:["Approved","in"], progress:["In Progress","in"], done:["Done","ok"], declined:["Declined","wait"]};
const RQ_ORDER = ["new","review","info","approved","progress","done","declined"];
const RQ_COLS = [["new","New",["new"]],["review","In Review",["review","info"]],["work","Approved & In Progress",["approved","progress"]],["done","Done",["done"]]];
/* what people can ask for, and where each one lands when it's turned into work */
const RQ_TYPES = [
  ["linkedin","LinkedIn Post",{piece:"linkedin"}],
  ["matters","MISMO Matters Item",{piece:"other",touch:"matters"}],
  ["email","Email Blast",{piece:"mailchimp"}],
  ["community","Community Post",{piece:"community"}],
  ["video","Video or YouTube",{piece:"youtube"}],
  ["summit","Summit Promotion",{piece:"summit"}],
  ["graphic","Graphic or Image",{piece:"other"}],
  ["print","Flyer, One-Pager or Print",{order:"Print"}],
  ["signage","Event Signage or Banner",{order:"Banners & Signage"}],
  ["swag","Swag or Pins",{order:"Swag & Giveaways"}],
  ["slides","Slides or Presentation",{piece:"other"}],
  ["web","Website Update",{piece:"other"}],
  ["press","Press Release or News",{piece:"other"}],
  ["other","Something Else",{piece:"other"}]
];
const RQ_TYPE = Object.fromEntries(RQ_TYPES.map(t=>[t[0],t]));
const RQ_ROLES = ["MISMO Staff","Facilitator","Other"];
const RQ = {q:"", type:"", declined:false};

/* the inbox copy (what was asked) with the team's review on top */
function requests(){
  const ids=new Set(Object.keys(S.inbox||{}).concat(Object.keys(S.requests||{})));
  return [...ids].map(id=>Object.assign({id, status:"new"}, (S.inbox||{})[id]||{}, (S.requests||{})[id]||{}, {id})).filter(r=>!r.archived);
}
function rqGet(id){ return requests().find(r=>r.id===id) || null; }
function rqTypeName(r){ const t=RQ_TYPE[r.type]; return t?t[1]:(r.typeName||"Request"); }
function rqLinked(id){ return vals("pieces").filter(p=>p.request===id).map(p=>({k:"piece",id:p.id,label:(CH[p.channel]||"Item")+" · "+(p.title||"Untitled"),done:p.status==="done"}))
  .concat(vals("orders").filter(o=>o.request===id && !o.archived).map(o=>({k:"order",id:o.id,label:"Order · "+(o.name||"Order"),done:o.status==="received"}))); }
function rqDue(r){ const t=T(); if(!r.neededBy || ["done","declined"].includes(r.status)) return ""; if(r.neededBy<t) return "late"; if(diff(r.neededBy,t)<=7) return "soon"; return ""; }
async function rqSave(id, part){
  /* only the team's fields go to requests.json; what was asked stays in the inbox */
  const cur=(S.requests||{})[id]||{};
  await put("requests", id, Object.assign({}, cur, part));
}

function renderRequests(){
  const el=$("#page-requests"), all=requests(), t=T();
  const cnt=k=>all.filter(r=>r.status===k).length;
  const late=all.filter(r=>rqDue(r)==="late").length, soon=all.filter(r=>rqDue(r)==="soon").length;
  const month=t.slice(0,7), doneMo=all.filter(r=>r.status==="done" && String(r.doneOn||r.updatedAt||"").slice(0,7)===month).length;
  const q=(RQ.q||"").toLowerCase().trim();
  const match=r=>(!RQ.type||r.type===RQ.type) && (!q||[r.title,r.details,r.n,r.e,r.group,r.event,rqTypeName(r),r.owner].join(" ").toLowerCase().indexOf(q)>=0);
  const list=all.filter(match);
  const card=r=>{ const due=rqDue(r), ln=rqLinked(r.id).length;
    return '<button type="button" class="rqc'+(r.status==="new"?" fresh":"")+'" data-rq="'+esc(r.id)+'">'+
      '<span class="rqc-top"><span class="rqt">'+esc(rqTypeName(r))+'</span>'+(r.status==="info"?'<span class="chip wait">Need Info</span>':'')+(r.priority==="high"?'<span class="chip changes">High</span>':'')+'</span>'+
      '<b class="rqc-t">'+esc(r.title||"Untitled request")+'</b>'+
      (r.details?'<span class="rqc-d">'+esc(mdPlain(r.details).slice(0,120))+(mdPlain(r.details).length>120?"…":"")+'</span>':'')+
      '<span class="rqc-by">'+esc(r.n||"Someone")+(r.role?' · '+esc(r.role):'')+(r.group?' · '+esc(r.group):'')+'</span>'+
      '<span class="rqc-foot">'+(r.neededBy?'<span class="due'+(due?" "+due:"")+'">Needed '+esc(fS(r.neededBy))+'</span>':'<span class="due">No date</span>')+(ln?'<span class="rqc-ln">'+ln+' on the schedule</span>':'')+whoHtml(r.owner)+'</span></button>'; };
  const sortRq=(a,b)=>((a.neededBy||"9")<(b.neededBy||"9")?-1:(a.neededBy||"9")>(b.neededBy||"9")?1:String(b.at||"").localeCompare(String(a.at||"")));
  const cols=RQ_COLS.map(([k,l,sts])=>{ let its=list.filter(r=>sts.includes(r.status)).sort(sortRq);
    if(k==="done") its=its.sort((a,b)=>String(b.doneOn||b.updatedAt||"").localeCompare(String(a.doneOn||a.updatedAt||""))).slice(0,12);
    return '<div class="rqcol rq-'+k+'"><div class="rqcol-h"><span>'+esc(l)+'</span><b>'+list.filter(r=>sts.includes(r.status)).length+'</b></div><div class="rqcol-b">'+(its.map(card).join("")||'<div class="rqnone">'+(k==="new"?"Nothing new. Requests from the form land here.":"Nothing here.")+'</div>')+'</div></div>'; }).join("");
  const declined=list.filter(r=>r.status==="declined");
  el.innerHTML='<div class="phead"><div><div class="eyebrow">Marketing &amp; Communications Requests</div><h1>Requests</h1><div class="sub">Everything staff and facilitators ask for, in one queue: review it, give it an owner, and turn it into a post, email, order or task.</div></div>'+
      '<div class="tools"><button class="btn" type="button" id="rq-copy">Copy Form Link</button><a class="btn" href="'+REQUEST_FORM+'" target="_blank" rel="noopener">Open the Form ↗</a><button class="btn pri" type="button" id="rq-add">+ Add a Request</button></div></div>'+
    '<div class="band"><div class="tiles">'+
      '<button class="tile" type="button" data-rqcol="new"><div class="v'+(cnt("new")?" hot":"")+'">'+cnt("new")+'</div><div class="k">New</div><div class="s">waiting for a first look</div></button>'+
      '<div class="tile"><div class="v">'+(cnt("review")+cnt("info"))+'</div><div class="k">In Review</div><div class="s">'+(cnt("info")?cnt("info")+" waiting on the requester":"being looked at")+'</div></div>'+
      '<div class="tile"><div class="v sky">'+(cnt("approved")+cnt("progress"))+'</div><div class="k">Being Worked On</div><div class="s">approved or in progress</div></div>'+
      '<div class="tile"><div class="v'+(late?" hot":"")+'">'+(late+soon)+'</div><div class="k">Needed Soon</div><div class="s">'+(late?late+" past the needed-by date":"needed in the next 7 days")+'</div></div>'+
      '<div class="tile"><div class="v">'+doneMo+'</div><div class="k">Done This Month</div><div class="s">'+esc(MONL[+month.slice(5)-1])+'</div></div>'+
    '</div></div>'+
    '<div class="rqbar"><select id="rq-type" aria-label="Type of request"><option value="">Every Type</option>'+RQ_TYPES.map(x=>'<option value="'+x[0]+'"'+(RQ.type===x[0]?" selected":"")+'>'+esc(x[1])+'</option>').join("")+'</select>'+
      '<input type="search" class="plain" id="rq-q" placeholder="Search requests, people, events" value="'+esc(RQ.q)+'" aria-label="Search requests">'+
      '<button type="button" class="btn sm" id="rq-dec" aria-pressed="'+RQ.declined+'">'+(RQ.declined?"Hide":"Show")+' Declined · '+declined.length+'</button></div>'+
    '<div class="rqboard">'+cols+'</div>'+
    (RQ.declined?'<div class="card" style="margin-top:22px"><div class="ch"><h2>Declined</h2><span class="cnt">'+declined.length+'</span></div>'+(declined.length?'<div class="rqdec">'+declined.sort(sortRq).map(card).join("")+'</div>':'<div class="empty">Nothing declined.</div>')+'</div>':'');
  $("#rq-add",el).onclick=()=>openRequest(null);
  $("#rq-copy",el).onclick=()=>copyText(REQUEST_FORM,"The request form link");
  $("#rq-type",el).onchange=e=>{ RQ.type=e.target.value; renderRequests(); };
  $("#rq-dec",el).onclick=()=>{ RQ.declined=!RQ.declined; renderRequests(); };
  const qi=$("#rq-q",el); qi.oninput=()=>{ RQ.q=qi.value; clearTimeout(qi._t); qi._t=setTimeout(()=>{ renderRequests(); const n=$("#rq-q"); if(n){ n.focus(); n.setSelectionRange(n.value.length,n.value.length); } },250); };
  $$("[data-rq]",el).forEach(b=>b.onclick=()=>openRequest(b.dataset.rq));
  $$("[data-rqcol]",el).forEach(b=>b.onclick=()=>{ const c=$(".rq-"+b.dataset.rqcol,el); if(c) c.scrollIntoView({behavior:"smooth",block:"nearest",inline:"nearest"}); });
}

function rqAsked(r){
  const row=(l,v)=>v?'<div class="rqa-r"><span>'+esc(l)+'</span><div>'+v+'</div></div>':'';
  const links=String(r.links||"").split(/\s+/).filter(x=>/^https?:\/\//i.test(x)).map(u=>'<a href="'+esc(u)+'" target="_blank" rel="noopener">'+esc(u.length>60?u.slice(0,58)+"…":u)+'</a>').join("<br>");
  return '<div class="rqasked"><div class="rqa-h"><span class="rqt">'+esc(rqTypeName(r))+'</span><span class="rqa-when">Sent '+esc(r.at?fD(String(r.at).slice(0,10)):"")+'</span></div>'+
    '<h3>'+esc(r.title||"Untitled request")+'</h3>'+(r.details?'<div class="rt-view">'+mdHtml(r.details)+'</div>':'')+
    row("From", esc(r.n||"")+(r.e?' · <a href="mailto:'+encodeURIComponent(r.e||"")+'?subject='+encodeURIComponent("Your request: "+(r.title||""))+'">'+esc(r.e)+'</a>':''))+
    row("Role", esc([r.role,r.group].filter(Boolean).join(" · ")))+
    row("Needed By", r.neededBy?esc(fD(r.neededBy))+(r.firm?' <b>(firm date)</b>':''):"")+
    row("Audience", esc(r.audience||""))+row("Event", esc(r.event||""))+row("Links and Files", links)+
    '</div>';
}
function openRequest(id){
  const isNew=!id, r = id ? rqGet(id) : {status:"review", role:"MISMO Staff", type:"linkedin", owner:"", n:"", e:""};
  if(id && !r) return;
  const fromForm = id && (S.inbox||{})[id];
  const typeOpts=RQ_TYPES.map(x=>[x[0],x[1]]);
  const asked = fromForm ? [] : [{sec:"The Request"},
    {k:"title",label:"What's Needed",wide:true,ph:"e.g. LinkedIn post for the eNote webinar"},
    {k:"type",label:"Type",type:"select",opts:typeOpts},
    {k:"neededBy",label:"Needed By",type:"date"},
    {k:"details",label:"Details",type:"rich",rows:4,ph:"What it is, the key message, anything that must be included"},
    {k:"n",label:"Requested By"},{k:"e",label:"Their Email",ph:"name@mismo.org"},
    {k:"role",label:"Role",type:"select",opts:RQ_ROLES},{k:"group",label:"Team or Workgroup"},
    {k:"audience",label:"Audience"},{k:"event",label:"Related Event"},
    {k:"links",label:"Links and Files",wide:true,ph:"SharePoint or Drive links, one per line"}];
  const fields=asked.concat([{sec:"Review"},
    {k:"status",label:"Status",type:"select",opts:RQ_ORDER.map(k=>[k,RQ_STAT[k][0]])},
    {k:"owner",label:"Owner",type:"select",blank:true,opts:PEOPLE},
    {k:"priority",label:"Priority",type:"select",opts:[["normal","Normal"],["high","High"],["low","Low"]]},
    {k:"target",label:"Our Target Date",type:"date"},
    {k:"reply",label:"Note to the Requester (sent with Email the Requester)",wide:true,ph:"e.g. Scheduled for LinkedIn on Nov 12; need the speaker's headshot"},
    {k:"notes",label:"Team Notes",type:"rich",rows:3,ph:"Only the team sees these"}]);
  const linked = id ? rqLinked(id) : [];
  const t=RQ_TYPE[r.type]||RQ_TYPE.other, dest=t[2];
  const makeLabel = dest.order ? "Create an Order" : "Add to the Schedule";
  openPane({eye:"Request", title:isNew?"Add a Request":(r.title||"Request"), fields, data:Object.assign({priority:"normal"}, r),
    extra:(linked.length?'<div class="fsec">On the Schedule</div><div class="brorders">'+linked.map(x=>'<button type="button" class="lnk" data-rql="'+x.k+':'+esc(x.id)+'"><b>'+esc(x.label)+'</b>'+(x.done?' · Done':'')+'</button>').join("")+'</div>':''),
    save:async v=>{
      if(isNew && !v.title){ toast("Say what's needed."); throw new Error("title"); }
      const rid=id||uid("rq");
      if(v.status==="done" && r.status!=="done") v.doneOn=T();
      if(!["new"].includes(v.status) && !r.firstLook) v.firstLook=T();
      if(isNew) Object.assign(v,{at:new Date().toISOString(), source:"team"});
      await rqSave(rid, Object.assign({archived:false}, v));
    },
    buttons: id ? [].concat(r.e?[{label:"Email the Requester", run:async v=>{
      const body=(v.reply||"")+"\n\n— Your request: "+(r.title||"")+(r.neededBy?" (needed "+fS(r.neededBy)+")":"");
      window.open("mailto:"+encodeURIComponent(r.e)+"?subject="+encodeURIComponent("Your MISMO request: "+(r.title||""))+"&body="+encodeURIComponent(body.trim()),"_blank");
      if(v.reply!==(r.reply||"")) await rqSave(id,{reply:v.reply||""});
    }}]:[]).concat([{label:makeLabel, run:async v=>{
      const rid=id; const seedNote=[r.details, r.n?"Requested by "+r.n+(r.e?" ("+r.e+")":""):"", r.links].filter(Boolean).join("\n\n");
      await rqSave(rid, Object.assign({}, v, {status:["new","review","info"].includes(v.status)?"approved":v.status, firstLook:r.firstLook||T()}));
      closePane(true);
      const when = v.target || r.neededBy || T();
      if(dest.order) openOrder(null,{name:r.title||"", kind:dest.order, neededBy:r.neededBy||"", eventName:r.event||"", event:r.event?"other":"", notes:seedNote, owner:v.owner||"", request:rid});
      else newPiece(dest.piece, {title:(t[0]==="matters"?"MISMO Matters: ":"")+(r.title||""), date:when, owner:v.owner||"", copy:(dest.piece==="linkedin"||dest.piece==="youtube")?mdPlain(r.details):(r.details||""), notes:seedNote, request:rid, touch:dest.touch?{[dest.touch]:true}:undefined});
    }}]) : [],
    after:b=>{
      if(fromForm){ const box=document.createElement("div"); box.innerHTML=rqAsked(r); b.insertBefore(box.firstChild, b.firstChild); }
      $$("[data-rql]",b).forEach(x=>x.onclick=()=>{ const [k,xid]=x.dataset.rql.split(":"); closePane(true); if(k==="order"){ go("orders"); openOrder(xid); } else openPiece(xid); });
    },
    del: id ? async()=>{ await rqSave(id,{archived:true}); } : null, delLabel:"Archive"
  });
}
