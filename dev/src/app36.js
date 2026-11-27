
/* ================= Tour mode (CN-059, approved by Jonna Nov 27, 2026) =================
   The MMS's Work Request Journey (resources.mismo.org/mms/journey/) is the MMS's training tour. For MISMO Media's
   steps (the first draft from the MMS feed, Perry's review, who to quote, the quote request, final approval,
   Distribution, Ready to Post, the Out for Comment tag) it opens the real MISMO Media in a frame at /media/?tour=1
   and moves its pointer to the real buttons. dev/shim.html does the safe part: practice records from
   window.parent.__tourSeed instead of the relay, today's date from window.parent.__tourClock, nothing read, saved
   or sent (an email is kept, not sent). This file is what the journey drives:
     window.__mmTour.ready()            a promise: true once the practice records are drawn
     window.__mmTour.load({mem, me, today, view, open})
                                        replace the records (mem = {collection: {id: record}}) and show them as that
                                        person ({name, email}), on that day ("YYYY-MM-DD"), on that view, with that
                                        release (or request) open; every part is optional
     window.__mmTour.go(view)           one of __mmTour.views ("press", "requests", "overview", ...)
     window.__mmTour.open(id)           a release id ("pr-..."; opens Press Releases) or a request id
     window.__mmTour.state() / sent() / blocked()
                                        what is showing; the emails a person "sent"; anything that tried to leave
   Built like the MMS's own window.__mmsTour (src/tour.js in GitMISMO/mms-data source). Never on the normal page. */
if(TOUR) (function(){
  const door=window.__mmTourDoor;
  const VIEWS=TABS.filter(t=>t!=="home" && t!=="mymismo");   /* MyMISMO never shows in a tour (CN-061): its routes are never asked */
  const tick=()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
  const later=ms=>new Promise(r=>setTimeout(r,ms));
  /* drawn = connected, every collection read and the page drawn with it */
  async function drawn(){
    const t0=performance.now();
    while(!(CONNECTED && DB && Object.keys(S).every(c=>LOADED.has(c)))){ if(performance.now()-t0>20000) return false; await later(40); }
    await later(0); await tick(); return true;
  }
  function setMe(me){
    if(!me) return;
    door.setMe(me); const m=door.me();
    window.__hqWho=m.name; CANWRITE=true;
  }
  function showOpen(id){
    id=String(id||""); if(!id) return false;
    if((S.releases||{})[id]){
      if(TAB!=="press") show("press");
      const r=S.releases[id]; PR.q="";
      if(r.status==="final" && !(prToPost(r) && !prPosted(r))) PR.showDone=true;
      if(PR.view==="draftnow" && !prHeld(r) || PR.view==="ready" && !(prToPost(r) && !prPosted(r))) PR.view="";
      PR.sel=id; renderPress();
      const d=$("#pr-detail"); if(d) d.scrollIntoView({block:"start"});
      return true;
    }
    if((S.requests||{})[id] && TAB!=="requests") show("requests");
    const row=document.querySelector('#page-'+TAB+' [data-rq="'+CSS.escape(id)+'"], #page-'+TAB+' [data-pr="'+CSS.escape(id)+'"]');
    if(row){ row.click(); return true; }
    return false;
  }
  function state(){
    return {view:TAB, open:PR.sel||(PANE&&PANE.id)||null, me:door.me(), today:T(), now:new Date().toISOString(), views:VIEWS.slice()};
  }
  let readyP=null;
  const api={
    views:VIEWS.slice(),
    ready(){
      if(!readyP) readyP=door.seeded.then(async a=>{
        const ok=await drawn();
        if(a && a.me) setMe(a.me);
        if(typeof prApplyApprovals==="function") try{ await prApplyApprovals(); }catch(e){}
        if(a && a.view) api.go(a.view);
        if(a && a.open) showOpen(a.open);
        await tick(); return ok;
      });
      return readyP;
    },
    async load(o){
      o=o||{}; await api.ready();
      if(o.me) setMe(o.me);
      if("today" in o) door.setToday(o.today);
      if(o.mem){
        if(PANE) closePane(true);
        PR.sel=null; PR.view=""; PR.q=""; PR.showDone=false; PR.feed=null;
        door.load(o.mem); await later(0);
        /* Amy's practice reply (an approvals record) is applied the way the background job applies a real one */
        if(typeof prApplyApprovals==="function") try{ await prApplyApprovals(); }catch(e){}
      }
      if(o.view) api.go(o.view); else renderAll();
      if(o.open) showOpen(o.open);
      await tick(); return state();
    },
    go(view){ if(PANE) closePane(true); show(VIEWS.includes(view)?view:"overview"); return TAB; },
    open(id){ return showOpen(id); },
    state, sent:()=>door.sent(), blocked:()=>door.blocked(), mem:()=>door.mem()
  };
  window.__mmTour=api;
  api.ready();
})();
