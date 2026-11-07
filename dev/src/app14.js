/* ================= QR Codes =================
   The QR Code Manager (GitMISMO/qr, served at resources.mismo.org/qr/) inside MISMO Media.
   It stays where it is, because every printed code points to resources.mismo.org/qr/?c=CODE,
   and it keeps its own records and sign-in. This page shows it in a frame on the same site,
   hides its own masthead and menu, and drives its sections from the tabs here. */
const QR_URL = "https://resources.mismo.org/qr/";
const QR_TABS = [["overview","Overview"],["codes","All Codes"],["new","New Code"],["scans","Scan Activity"],["scanner","What Scanners See"]];
let QR_SUB = "overview";
const QR_CSS =
  ".hqtop,.hq.rail,.railscrim{display:none!important}" +
  "body,body.railmini,body:not(.railmini){padding-left:0!important}" +
  ".wrap{padding-block:18px 60px!important;padding-inline:4px!important}" +
  ".panel.wide,body.railmini .panel.wide{width:min(1320px,calc(100vw - 24px))!important}" +
  ".signwrap{padding-block:24px!important}";

function qrSameSite(){ return location.hostname === "resources.mismo.org"; }
function qrDoc(){ const f = $("#qr-frame"); try{ return f && f.contentDocument; }catch(e){ return null; } }

function qrDress(){
  const d = qrDoc(); if(!d || !d.documentElement) return;
  if(!d.getElementById("mm-embed")){
    const s = d.createElement("style"); s.id = "mm-embed"; s.textContent = QR_CSS;
    (d.head || d.documentElement).appendChild(s);
  }
  const th = document.documentElement.getAttribute("data-theme");
  if(th) d.documentElement.setAttribute("data-theme", th); else d.documentElement.removeAttribute("data-theme");
  qrMark();
}
/* Which of its sections is showing, read from its own (hidden) menu. */
function qrMark(){
  const d = qrDoc(); let cur = QR_SUB;
  if(d){ const b = d.querySelector('.hq nav button[aria-current]'); if(b && b.dataset.hq) cur = b.dataset.hq; }
  QR_SUB = cur;
  $$("#qr-tabs button").forEach(b => b.setAttribute("aria-pressed", b.dataset.qr === cur ? "true" : "false"));
  const ro = d && d.body && d.body.classList.contains("viewonly");
  const nb = $('#qr-tabs button[data-qr="new"]'); if(nb) nb.hidden = !!ro;
}
function qrGo(sub){
  const d = qrDoc(), b = d && d.querySelector('.hq nav button[data-hq="' + sub + '"]');
  if(b){ b.click(); QR_SUB = sub; setTimeout(qrMark, 50); }
  else { QR_SUB = sub; qrMark(); }
}

function renderQr(){
  const el = $("#page-qr");
  if(el.dataset.built){ qrDress(); return; }
  const head = '<div class="phead"><div><div class="eyebrow">Codes for Print, Signs and Slides</div><h1>QR Codes</h1>' +
    '<div class="sub">Make a code once and change where it goes any time, without reprinting. Every code\'s scans are counted here.</div></div>' +
    '<div class="tools"><a class="btn" href="' + QR_URL + '" target="_blank" rel="noopener">Open on Its Own ↗</a></div></div>';
  if(!qrSameSite()){
    el.innerHTML = head + '<div class="band"><div class="today">QR Code Manager</div><div class="say">The QR Code Manager opens inside MISMO Media at resources.mismo.org. ' +
      'Here, use <a href="' + QR_URL + '" target="_blank" rel="noopener" style="color:var(--sky)">resources.mismo.org/qr/</a>.</div></div>';
    return;
  }
  el.dataset.built = "1";
  el.innerHTML = head +
    '<div class="qrtabs" id="qr-tabs" role="toolbar" aria-label="QR Code Manager sections">' +
      QR_TABS.map(t => '<button type="button" data-qr="' + t[0] + '" aria-pressed="' + (t[0] === QR_SUB) + '">' + t[1] + '</button>').join("") +
    '</div>' +
    '<div class="qrwrap"><iframe id="qr-frame" title="QR Code Manager" src="' + QR_URL + '"></iframe></div>';
  $$("#qr-tabs button").forEach(b => b.onclick = () => qrGo(b.dataset.qr));
  const f = $("#qr-frame");
  f.addEventListener("load", () => {
    qrDress();
    const d = qrDoc(); if(!d) return;
    /* keep the tabs here in step when it changes section by itself (a card, a search hit) */
    try{
      const nav = d.querySelector(".hq nav");
      if(nav) new MutationObserver(qrMark).observe(nav, {subtree:true, attributes:true, attributeFilter:["aria-current"]});
      new MutationObserver(qrMark).observe(d.body, {attributes:true, attributeFilter:["class"]});
    }catch(e){}
    if(QR_SUB !== "overview") qrGo(QR_SUB);
  });
  /* its sign-in check can land after load; dress it again once it settles */
  [600, 1500, 3500].forEach(ms => setTimeout(qrDress, ms));
}
/* Follow MISMO Media's light and dark mode. */
try{ new MutationObserver(() => { if(TAB === "qr") qrDress(); }).observe(document.documentElement, {attributes:true, attributeFilter:["data-theme"]}); }catch(e){}

/* ================= left menu groups =================
   Every page stays in view (grouped under plain headings); nothing folds away. */
function navBadges(){}
function navOpenFor(tab){}
