/* ================= Orders: pins, swag, banners, print ================= */
/* Anything physical that has to be ordered. Each order can be tied to an event (a
   summit or another event) and to the Rebranding item it replaces, so the Summits page,
   the Schedule and the Rebranding tab all show the same order. */
const OR_STAT = {toorder:["To Order","changes"], quote:["Getting Quotes","review"], ordered:["Ordered","in"], shipped:["Shipped","in"], received:["Received","ok"], cancelled:["Cancelled","wait"]};
const OR_ORDER = ["toorder","quote","ordered","shipped","received","cancelled"];
const OR_KINDS = ["Pins","Swag & Giveaways","Banners & Signage","Print","Apparel","Booth & Display","Other"];
const OR = {st:"", ev:"", q:""};
const orOpen = o=>!["received","cancelled"].includes(o.status||"toorder");
function orders(){ return vals("orders").filter(o=>!o.archived); }
function orEventName(o){ if(o.event && o.event!=="other"){ const s=SUMMITS.find(x=>x.id===o.event); return s?s.name:o.event; } return o.eventName||""; }
function orEventDate(o){ const s=o.event&&SUMMITS.find(x=>x.id===o.event); return s?s.start:(o.eventDate||""); }
function orMoney(n){ n=+n||0; return "$"+n.toLocaleString(undefined,{minimumFractionDigits:n%1?2:0, maxFractionDigits:2}); }
function orTotal(o){ return (+o.cost||0) || ((+o.unit||0)*(+o.qty||0)); }
function orRisk(o){ const t=T(); if(!orOpen(o)) return ""; if(o.orderBy && o.orderBy<t && ["toorder","quote"].includes(o.status||"toorder")) return "Past the order-by date"; const need=o.neededBy||orEventDate(o); if(need && need<t) return "Past the needed-by date"; if(need && diff(need,t)<=14) return "Needed within two weeks"; return ""; }

function orderRows(list, showEvent){
  const t=T();
  return '<div class="tw"><table class="t"><thead><tr><th>Item</th><th>Type</th>'+(showEvent?'<th>Event</th>':'')+'<th class="n">Qty</th><th>Status</th><th>Order By</th><th>Needed By</th><th class="n">Cost</th></tr></thead><tbody>'+
    list.map(o=>{ const st=o.status||"toorder", risk=orRisk(o), need=o.neededBy||orEventDate(o);
      return '<tr class="click" data-or="'+esc(o.id)+'"><td><b>'+esc(o.name||"Untitled")+'</b>'+(o.vendor||risk?'<span class="t2"'+(risk?' style="color:var(--bad);font-weight:600"':'')+'>'+esc(risk||o.vendor)+'</span>':'')+'</td><td>'+esc(o.kind||"")+'</td>'+(showEvent?'<td>'+esc(orEventName(o)||"—")+'</td>':'')+'<td class="n">'+(o.qty?(+o.qty).toLocaleString():"—")+'</td><td>'+chip(OR_STAT,st)+'</td><td'+(o.orderBy&&o.orderBy<t&&["toorder","quote"].includes(st)?' style="color:var(--bad);font-weight:600"':'')+'>'+(o.orderBy?esc(fS(o.orderBy)):"—")+'</td><td>'+(need?esc(fS(need)):"—")+'</td><td class="n">'+(orTotal(o)?orMoney(orTotal(o)):"—")+'</td></tr>'; }).join("")+'</tbody></table></div>';
}
function wireOrderRows(el){ $$("[data-or]",el).forEach(r=>r.onclick=()=>openOrder(r.dataset.or)); }

function renderOrders(){
  const el=$("#page-orders"), all=orders(), t=T();
  const open=all.filter(orOpen), cnt=k=>all.filter(o=>(o.status||"toorder")===k).length;
  const risky=open.filter(o=>orRisk(o)).length;
  const spend=all.filter(o=>o.status!=="cancelled").reduce((n,o)=>n+orTotal(o),0);
  const evs=[...new Set(all.map(o=>o.event==="other"?"other:"+(o.eventName||""):(o.event||"")))].filter(Boolean);
  const q=(OR.q||"").toLowerCase().trim();
  const list=all.filter(o=>(!OR.st||(o.status||"toorder")===OR.st) && (!OR.ev || (OR.ev==="none"?!o.event:(o.event==="other"?"other:"+(o.eventName||""):o.event)===OR.ev)) && (!q||[o.name,o.kind,o.vendor,o.notes,orEventName(o)].join(" ").toLowerCase().indexOf(q)>=0))
    .sort((a,b)=>String(a.name||"").localeCompare(String(b.name||"")));
  el.innerHTML='<div class="phead"><div><div class="eyebrow">Pins, Swag, Banners and Print</div><h1>Orders</h1><div class="sub">Everything that has to be ordered, tied to the event it\'s for and the old-branded piece it replaces.</div></div><div class="tools"><button class="btn pri" type="button" id="or-add">+ New Order</button></div></div>'+
    '<div class="band"><div class="tiles">'+
      '<button class="tile" type="button" data-orst="toorder"><div class="v'+(cnt("toorder")?" hot":"")+'">'+cnt("toorder")+'</div><div class="k">To Order</div><div class="s">not placed yet</div></button>'+
      '<button class="tile" type="button" data-orst="ordered"><div class="v">'+(cnt("ordered")+cnt("shipped")+cnt("quote"))+'</div><div class="k">On the Way</div><div class="s">quoting, ordered or shipped</div></button>'+
      '<button class="tile" type="button" data-orst="received"><div class="v sky">'+cnt("received")+'</div><div class="k">Received</div><div class="s">in hand</div></button>'+
      '<div class="tile"><div class="v'+(risky?" hot":"")+'">'+risky+'</div><div class="k">Need Attention</div><div class="s">late or needed within two weeks</div></div>'+
      '<div class="tile"><div class="v">'+orMoney(spend)+'</div><div class="k">Total Cost</div><div class="s">all orders not cancelled</div></div>'+
    '</div></div>'+
    '<div class="subtabs" role="group" aria-label="Status">'+[["","All",all.length]].concat(OR_ORDER.map(k=>[k,OR_STAT[k][0],cnt(k)])).map(([k,l,n])=>'<button type="button" data-orf="'+k+'" aria-pressed="'+(OR.st===k)+'">'+esc(l)+' · '+n+'</button>').join("")+'</div>'+
    '<div class="card"><div class="ch"><h2>'+(OR.st?esc(OR_STAT[OR.st][0]):"Every Order")+'</h2><span class="cnt">'+list.length+'</span><div class="r im-filters">'+
      '<select id="or-ev" aria-label="Event"><option value="">Every Event</option>'+SUMMITS.map(s=>'<option value="'+s.id+'"'+(OR.ev===s.id?" selected":"")+'>'+esc(s.name)+'</option>').join("")+evs.filter(e=>e.indexOf("other:")===0).map(e=>'<option value="'+esc(e)+'"'+(OR.ev===e?" selected":"")+'>'+esc(e.slice(6)||"Other Event")+'</option>').join("")+'<option value="none"'+(OR.ev==="none"?" selected":"")+'>Not for an Event</option></select>'+
      '<input type="search" class="plain" id="or-q" placeholder="Search orders" value="'+esc(OR.q)+'" aria-label="Search orders"></div></div>'+
      (list.length?orderRows(list,true):'<div class="empty">'+(all.length?"Nothing matches. Pick another status or event, or clear the search.":"No orders yet. Press New Order for pins, swag, banners, signs or anything printed.")+'</div>')+
    '</div>';
  $("#or-add",el).onclick=()=>openOrder(null);
  $$("[data-orf]",el).forEach(b=>b.onclick=()=>{ OR.st=b.dataset.orf; renderOrders(); });
  $$("[data-orst]",el).forEach(b=>b.onclick=()=>{ OR.st=OR.st===b.dataset.orst?"":b.dataset.orst; renderOrders(); });
  $("#or-ev",el).onchange=e=>{ OR.ev=e.target.value; renderOrders(); };
  const qi=$("#or-q",el); qi.oninput=()=>{ OR.q=qi.value; clearTimeout(qi._t); qi._t=setTimeout(()=>{ renderOrders(); const n=$("#or-q"); if(n){ n.focus(); n.setSelectionRange(n.value.length,n.value.length); } },250); };
  wireOrderRows(el);
}
function openOrder(id, preset){
  const o = id ? S.orders[id] : Object.assign({status:"toorder", kind:"Pins", owner:"Jonna"}, preset||{});
  if(id && !o) return;
  const brs=brItems().sort((a,b)=>String(a.name||"").localeCompare(String(b.name||"")));
  const fields=[
    {k:"name",label:"What's Being Ordered",wide:true,ph:"e.g. MISMO Lapel Pins, Retractable Banner, Tote Bags"},
    {k:"kind",label:"Type",type:"select",opts:OR_KINDS},
    {k:"status",label:"Status",type:"select",opts:OR_ORDER.map(k=>[k,OR_STAT[k][0]])},
    {sec:"Event"},
    {k:"event",label:"For an Event",type:"select",blank:true,opts:SUMMITS.map(s=>[s.id,s.name]).concat([["other","Another Event"]])},
    {k:"eventName",label:"Event Name (if another event)",ph:"e.g. MBA Annual, a webinar series"},
    {k:"eventDate",label:"Event Date (if another event)",type:"date"},
    {sec:"Dates"},
    {k:"orderBy",label:"Order By",type:"date"},
    {k:"neededBy",label:"Needed By",type:"date"},
    {k:"orderedOn",label:"Ordered On",type:"date"},
    {k:"receivedOn",label:"Received On",type:"date"},
    {sec:"Order"},
    {k:"qty",label:"Quantity",type:"number"},
    {k:"unit",label:"Cost Each ($)",type:"number"},
    {k:"cost",label:"Total Cost ($)",type:"number"},
    {k:"vendor",label:"Vendor",ph:"Who it's ordered from"},
    {k:"owner",label:"Owner",type:"select",blank:true,opts:PEOPLE},
    {k:"shipTo",label:"Ship To",wide:true,ph:"Venue, office or person"},
    {k:"link",label:"Order or Tracking Link",type:"url",wide:true,ph:"https://"},
    {sec:"Rebranding"},
    {k:"brandItem",label:"Replaces This Rebranding Item",type:"select",blank:true,opts:brs.map(b=>[b.id,b.name||"Item"])},
    {k:"notes",label:"Notes",type:"rich",rows:3,ph:"Artwork file, colors, sizes, proof approval"}
  ];
  openPane({eye:"Orders", title:id?(o.name||"Order"):"New Order", fields, data:o,
    save:async v=>{ if(!v.name){ toast("Say what's being ordered."); throw new Error("name"); }
      if(v.status==="ordered" && !v.orderedOn) v.orderedOn=T();
      if(v.status==="received" && !v.receivedOn) v.receivedOn=T();
      if(v.event!=="other"){ v.eventName=""; v.eventDate=""; }
      const oid=id||uid("or"); await put("orders", oid, Object.assign({}, o, v, {archived:false}));
      if(v.brandItem && S.branding[v.brandItem] && ["old","check"].includes(S.branding[v.brandItem].status||"check")) await patch("branding", v.brandItem, {status:"progress"});
    },
    del: id ? async()=>{ await patch("orders",id,{archived:true}); } : null, delLabel:"Archive"
  });
}
/* orders on the Summits page */
function summitOrdersCard(s){
  const list=orders().filter(o=>o.event===s.id).sort((a,b)=>(a.neededBy||a.orderBy||"z")<(b.neededBy||b.orderBy||"z")?-1:1);
  const open=list.filter(orOpen).length, risky=list.filter(o=>orRisk(o)).length;
  return '<div class="card" style="margin-top:22px"><div class="ch"><h2>Orders for This Summit</h2><span class="cnt">'+open+' open</span>'+(risky?'<span class="note" style="color:var(--bad);font-weight:600">'+risky+' need attention</span>':'')+'<div class="r"><button class="btn sm" type="button" id="sm-order">+ New Order</button><button class="btn sm" type="button" id="sm-orders">See All Orders</button></div></div>'+
    (list.length?orderRows(list,false):'<div class="empty">No pins, swag, banners or print ordered for this summit yet.</div>')+'</div>';
}
function wireSummitOrders(el,s){
  const a=$("#sm-order",el); if(a) a.onclick=()=>openOrder(null,{event:s.id, neededBy:add(s.start,-7)});
  const b=$("#sm-orders",el); if(b) b.onclick=()=>{ OR.ev=s.id; OR.st=""; go("orders"); };
  wireOrderRows(el);
}
