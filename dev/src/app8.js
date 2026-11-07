/* ================= Branding ================= */
/* The running list of everything that carries MISMO's branding: what's already on the
   new 2026 brand and what still has the old look and needs replacing. */
const BR_STAT = {check:["To Check","wait"], old:["Old Branding","changes"], progress:["In Progress","review"], done:["Rebranded","ok"], retire:["Retiring","wait"]};
const BR_KINDS = ["Documents & Templates","Email","Events & Summits","Marketing Materials","Presentations","Print & Signage","Products & Standards","Social & Video","Web Pages & Tools","Other"];
const BR_ORDER = ["old","progress","check","done","retire"];
const BR = {st:"", kind:"", q:""};
const brNorm = x=>String(x||"").replace(/\s+/g," ").trim().toLowerCase();
function brItems(){ return vals("branding").filter(b=>!b.archived); }

function renderBranding(){
  const el=$("#page-branding"), all=brItems(), t=T();
  const cnt=k=>all.filter(b=>(b.status||"check")===k).length;
  const live=all.filter(b=>(b.status||"check")!=="retire");
  const done=cnt("done"), pct=live.length?Math.round(done/live.length*100):0;
  const late=all.filter(b=>b.due && b.due<t && !["done","retire"].includes(b.status||"check")).length;
  const q=brNorm(BR.q);
  const list=all.filter(b=>(!BR.st||(b.status||"check")===BR.st) && (!BR.kind||b.kind===BR.kind) && (!q||brNorm([b.name,b.kind,b.where,b.owner,b.notes].join(" ")).indexOf(q)>=0))
    .sort((a,b)=>String(a.name||"").localeCompare(String(b.name||"")));
  const kinds=BR_KINDS.map(k=>{ const its=live.filter(b=>b.kind===k); return {k, n:its.length, d:its.filter(b=>b.status==="done").length}; }).filter(x=>x.n);
  el.innerHTML='<div class="phead"><div><div class="eyebrow">The 2026 Brand Everywhere</div><h1>Rebranding</h1><div class="sub">Everything that carries MISMO\'s look: what\'s on the new brand already and what still has the old branding and needs replacing.</div></div><div class="tools"><button class="btn pri" type="button" id="br-add">+ Add Item</button></div></div>'+
    '<div class="band"><div class="tiles">'+
      '<button class="tile" type="button" data-brst="done"><div class="v sky">'+pct+'%</div><div class="k">Rebranded</div><div class="s">'+done+' of '+live.length+' items</div><div class="brbar"><i style="width:'+pct+'%"></i></div></button>'+
      '<button class="tile" type="button" data-brst="old"><div class="v'+(cnt("old")?" hot":"")+'">'+cnt("old")+'</div><div class="k">Old Branding</div><div class="s">still to replace</div></button>'+
      '<button class="tile" type="button" data-brst="progress"><div class="v">'+cnt("progress")+'</div><div class="k">In Progress</div><div class="s">'+(late?late+" past due":"being redone")+'</div></button>'+
      '<button class="tile" type="button" data-brst="check"><div class="v">'+cnt("check")+'</div><div class="k">To Check</div><div class="s">found, not reviewed yet</div></button>'+
      '<button class="tile" type="button" data-brst="retire"><div class="v">'+cnt("retire")+'</div><div class="k">Retiring</div><div class="s">won\'t be redone</div></button>'+
    '</div></div>'+
    (kinds.length?'<div class="card" style="margin-bottom:22px"><div class="ch"><h2>By Type</h2></div><div class="brkinds">'+kinds.map(x=>'<button type="button" class="brk'+(BR.kind===x.k?" on":"")+'" data-brk="'+esc(x.k)+'"><span class="brk-n">'+esc(x.k)+'</span><span class="brk-bar"><i style="width:'+Math.round(x.d/x.n*100)+'%"></i></span><span class="brk-c">'+x.d+' of '+x.n+'</span></button>').join("")+'</div></div>':'')+
    '<div class="subtabs" role="group" aria-label="Status">'+[["","All",all.length]].concat(BR_ORDER.map(k=>[k,BR_STAT[k][0],cnt(k)])).map(([k,l,n])=>'<button type="button" data-brf="'+k+'" aria-pressed="'+(BR.st===k)+'">'+esc(l)+' · '+n+'</button>').join("")+'</div>'+
    '<div class="card"><div class="ch"><h2>'+(BR.st?esc(BR_STAT[BR.st][0]):"Every Item")+(BR.kind?' · '+esc(BR.kind):'')+'</h2><span class="cnt">'+list.length+'</span><div class="r im-filters">'+
      '<select id="br-kind" aria-label="Type"><option value="">Every Type</option>'+BR_KINDS.map(k=>'<option'+(BR.kind===k?" selected":"")+'>'+esc(k)+'</option>').join("")+'</select>'+
      '<input type="search" class="plain" id="br-q" placeholder="Search items" value="'+esc(BR.q)+'" aria-label="Search rebranding items"></div></div>'+
      (list.length?'<div class="tw"><table class="t"><thead><tr><th>Item</th><th>Type</th><th>Status</th><th>Owner</th><th>Due</th><th>New Version</th></tr></thead><tbody>'+
        list.map(b=>{ const st=b.status||"check", over=b.due&&b.due<t&&!["done","retire"].includes(st);
          return '<tr class="click" data-br="'+esc(b.id)+'"><td><b>'+esc(b.name||"Untitled")+'</b>'+(()=>{ const os=orders().filter(o=>o.brandItem===b.id&&orOpen(o)).length; const bits=[b.where, os?os+" order"+(os===1?"":"s")+" open":""].filter(Boolean); return bits.length?'<span class="t2">'+esc(bits.join(" · "))+'</span>':''; })()+'</td><td>'+esc(b.kind||"")+'</td><td>'+chip(BR_STAT,st)+'</td><td>'+esc(b.owner||"")+'</td><td'+(over?' style="color:var(--bad);font-weight:600"':'')+'>'+(b.due?esc(fS(b.due)):"—")+'</td><td>'+(b.newUrl?'<a href="'+esc(b.newUrl)+'" target="_blank" rel="noopener" onclick="event.stopPropagation()">Open ↗</a>':(st==="done"&&b.doneOn?esc(fS(b.doneOn)):"—"))+'</td></tr>'; }).join("")+'</tbody></table></div>'
        :'<div class="empty">'+(all.length?"Nothing matches. Pick another status or type, or clear the search.":"Nothing logged yet. Press Add Item for anything with MISMO branding: a document, template, slide deck, banner, sign, web page or social profile.")+'</div>')+
    '</div>';
  $("#br-add",el).onclick=()=>openBrand(null);
  $$("[data-brf]",el).forEach(b=>b.onclick=()=>{ BR.st=b.dataset.brf; renderBranding(); });
  $$("[data-brst]",el).forEach(b=>b.onclick=()=>{ BR.st=BR.st===b.dataset.brst?"":b.dataset.brst; renderBranding(); });
  $$("[data-brk]",el).forEach(b=>b.onclick=()=>{ BR.kind=BR.kind===b.dataset.brk?"":b.dataset.brk; renderBranding(); });
  $("#br-kind",el).onchange=e=>{ BR.kind=e.target.value; renderBranding(); };
  const qi=$("#br-q",el); qi.oninput=()=>{ BR.q=qi.value; clearTimeout(qi._t); qi._t=setTimeout(()=>{ renderBranding(); const n=$("#br-q"); if(n){ n.focus(); n.setSelectionRange(n.value.length,n.value.length); } },250); };
  $$("[data-br]",el).forEach(r=>r.onclick=()=>openBrand(r.dataset.br));
}
function openBrand(id){
  const b = id ? S.branding[id] : {status:"old", kind:"Marketing Materials", owner:"Jonna"};
  if(id && !b) return;
  const fields=[
    {k:"name",label:"Item",wide:true,ph:"e.g. Membership Brochure, Letterhead Template, LinkedIn Banner"},
    {k:"kind",label:"Type",type:"select",opts:BR_KINDS},
    {k:"status",label:"Status",type:"select",opts:BR_ORDER.map(k=>[k,BR_STAT[k][0]])},
    {k:"owner",label:"Owner",type:"select",blank:true,opts:PEOPLE},
    {k:"due",label:"Due",type:"date"},
    {k:"where",label:"Where It Lives",wide:true,ph:"e.g. SharePoint › Marketing › Templates, the Higher Logic site, the LinkedIn page"},
    {k:"oldUrl",label:"Link to the Old Version",type:"url",ph:"https://"},
    {k:"newUrl",label:"Link to the Rebranded Version",type:"url",ph:"https://"},
    {k:"doneOn",label:"Rebranded On",type:"date"},
    {k:"found",label:"How We Found It",ph:"e.g. the new website, a team member, research"},
    {k:"notes",label:"Notes",type:"rich",rows:3,ph:"What needs changing: logo, colors, fonts, tagline, the MISMO Connect name"}
  ];
  openPane({eye:"Rebranding", title:id?(b.name||"Item"):"New Rebranding Item", fields, data:b,
    save:async v=>{ if(!v.name){ toast("Give the item a name."); throw new Error("name"); }
      if(v.status==="done" && !v.doneOn) v.doneOn=T();
      await put("branding", id||uid("br"), Object.assign({}, b, v, {archived:false})); },
    buttons: id ? [{label:"Order a Replacement", run:async()=>{ closePane(true); openOrder(null,{brandItem:id, name:b.name||"", kind:"Print"}); }}] : [],
    extra: id ? (()=>{ const os=orders().filter(o=>o.brandItem===id); return os.length?'<div class="fsec">Orders</div><div class="brorders">'+os.map(o=>'<button type="button" class="lnk" data-bro="'+esc(o.id)+'"><b>'+esc(o.name||"Order")+'</b> · '+esc(OR_STAT[o.status||"toorder"][0])+(orEventName(o)?' · '+esc(orEventName(o)):'')+'</button>').join("")+'</div>':''; })() : '',
    after: b2=>{ $$("[data-bro]",b2).forEach(x=>x.onclick=()=>{ closePane(true); go("orders"); openOrder(x.dataset.bro); }); },
    del: id ? async()=>{ await patch("branding",id,{archived:true}); } : null, delLabel:"Archive"
  });
}
