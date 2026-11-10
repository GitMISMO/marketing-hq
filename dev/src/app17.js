/* ================= canceling a post =================
   A LinkedIn post (or any item) that isn't going to run gets canceled with a reason, not deleted.
   It leaves the to-do counts and the overdue list, shows as Canceled with its reason, and can be
   restored. Staged auto-posting is switched off when it's canceled.
     items:    status "canceled", cancelReason, canceledOn, prevStatus
     episodes: liCanceled, liCancelReason, liCanceledOn  (the Monday LinkedIn post / Live) */
function pOpen(p){ return p.status!=="done" && p.status!=="canceled"; }
function pClosed(p){ return !pOpen(p); }
/* the Monday LinkedIn post or Live counts as done once it's ticked, or once its link is in and its day has come
   (pasting the link after it ran is how people record it; Nov 10, 2026) */
function liDone(e){ return !!(e && (e.linkedinDone || (e.linkedinUrl && liDate(e) && liDate(e)<=T()))); }
function liClosed(e){ return !!(e && (liDone(e) || e.liCanceled)); }

/* the control: kind "piece" or "ep", the record's id, and what to call the thing */
function cxBox(kind, id, what){
  const r = kind==="ep" ? S.episodes[id] : S.pieces[id];
  if(!id || !r) return '';
  const on = kind==="ep" ? !!r.liCanceled : r.status==="canceled";
  const why = kind==="ep" ? r.liCancelReason : r.cancelReason, when = kind==="ep" ? r.liCanceledOn : r.canceledOn;
  if(on) return '<div class="cx on" data-cxk="'+kind+'" data-cxid="'+esc(id)+'"><div class="cx-h"><span class="chip changes">Canceled</span>'+(when?'<small>'+esc(fS(when))+'</small>':'')+'<button class="btn sm" type="button" data-cx="restore">Restore '+esc(what)+'</button></div>'+
    (why?'<div class="cx-why"><b>Reason:</b> '+esc(why)+'</div>':'')+'</div>';
  return '<div class="cx" data-cxk="'+kind+'" data-cxid="'+esc(id)+'"><button class="btn sm cx-open" type="button" data-cx="open">Cancel '+esc(what)+'</button>'+
    '<div class="cx-form" hidden><label class="flabel" for="cx-r-'+esc(id)+'">Why Is It Canceled?</label><textarea id="cx-r-'+esc(id)+'" rows="2" placeholder="e.g. The LinkedIn Live didn\'t run. Reposting with Episode 52."></textarea>'+
    '<div class="kbtns"><button class="btn sm danger" type="button" data-cx="go">Cancel '+esc(what)+'</button><button class="btn sm" type="button" data-cx="keep">Keep It</button><span class="hint cx-msg"></span></div></div></div>';
}
function wireCx(root, after){
  $$(".cx",root).forEach(w=>{
    if(w.dataset.wired) return; w.dataset.wired="1";
    const kind=w.dataset.cxk, id=w.dataset.cxid;
    w.addEventListener("click", async e=>{
      const b=e.target.closest("[data-cx]"); if(!b) return; const a=b.dataset.cx;
      const form=$(".cx-form",w), open=$(".cx-open",w);
      if(a==="open"){ form.hidden=false; open.hidden=true; $("textarea",form).focus(); return; }
      if(a==="keep"){ form.hidden=true; open.hidden=false; return; }
      b.disabled=true;
      try{
        if(a==="go"){
          const why=$("textarea",form).value.trim(); const msg=$(".cx-msg",w);
          if(!why){ msg.textContent="Add a reason first, so the team knows why."; b.disabled=false; $("textarea",form).focus(); return; }
          if(kind==="ep") await patch("episodes",id,{liCanceled:true, liCancelReason:why, liCanceledOn:T(), linkedinAuto:false});
          else { const p=S.pieces[id]||{}; await patch("pieces",id,{status:"canceled", prevStatus:p.status||"", cancelReason:why, canceledOn:T(), autoPost:false}); }
          toast("Canceled. The reason is saved with it.");
        }
        if(a==="restore"){
          if(kind==="ep") await patch("episodes",id,{liCanceled:false, liCancelReason:"", liCanceledOn:""});
          else { const p=S.pieces[id]||{}; const back=p.prevStatus && !["canceled","staged"].includes(p.prevStatus) ? p.prevStatus : "ready"; await patch("pieces",id,{status:back, cancelReason:"", canceledOn:"", prevStatus:""}); }
          toast("Restored");
        }
        if(typeof after==="function") after(); else { if(PANE) closePane(true); renderAll(); if(kind==="ep") openEpisode(id); else openPiece(id); }
      }catch(err){ b.disabled=false; }
    });
  });
}
