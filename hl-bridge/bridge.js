/* MISMO Media → Higher Logic uploader (GitMISMO/marketing-hq, hl-bridge/bridge.js), loaded by the hidden
   website page collaborate.mismo.org/mismowebsite/mismo-media-uploader.
   MISMO Media (https://resources.mismo.org/marketing-hq/) loads this page out of sight, or in a small
   window, and sends pictures to it. It saves each one in the Higher Logic file library folder
   MISMO_Matters_Logos with the signed-in person's own Higher Logic session, and sends back the public link.
   It only listens to resources.mismo.org, never overwrites a file, and does nothing for anyone not signed in. */
(function () {
  var PARENT = "https://resources.mismo.org", API = "/HigherLogic/moxiemanager/api.ashx", FOLDER = "MISMO_Matters_Logos";
  var target = window.opener || (window.parent !== window ? window.parent : null);
  if (!target) return;
  var say = function (t) { var s = document.getElementById("mm-up-say"); if (s) s.textContent = t; };
  var form = { "Content-Type": "application/x-www-form-urlencoded" };
  function auth() { return fetch(API + "?action=auth", { method: "POST", credentials: "same-origin", headers: form, body: "time=" + Date.now() }).then(function (r) { return r.json(); }); }
  function rpc(method, params) {
    return auth().then(function (a) {
      return fetch(API, { method: "POST", credentials: "same-origin", headers: form,
        body: "json=" + encodeURIComponent(JSON.stringify({ id: "i" + Date.now(), method: method, params: params, jsonrpc: "2.0" })) + "&csrf=" + encodeURIComponent(a.token) }).then(function (r) { return r.json(); });
    });
  }
  var place = null;
  function folder() {
    if (place) return Promise.resolve(place);
    return rpc("listRoots", {}).then(function (r) {
      var base = (r.result && r.result[0] && r.result[0].path) || "/Site Shared Files", dir = base + "/" + FOLDER;
      return rpc("listFiles", { path: dir, offset: 0, length: 2000 }).then(function (l) {
        if (!l.error) return l;
        return rpc("createDirectory", { path: dir }).then(function () { return rpc("listFiles", { path: dir, offset: 0, length: 2000 }); });
      }).then(function (l) {
        if (l.error) throw new Error(l.error.message || "no folder");
        place = { dir: dir, url: "https:" + String(l.result.file.meta.url).replace(/^https?:/, ""), have: {} };
        (l.result.data || []).forEach(function (d) { place.have[String(d[0]).toLowerCase()] = 1; });
        return place;
      });
    });
  }
  function upload(name, blob) {
    name = String(name || "picture.png").replace(/[^A-Za-z0-9._-]+/g, "-").slice(0, 120);
    return folder().then(function (p) {
      var link = p.url + "/" + encodeURIComponent(name);
      if (p.have[name.toLowerCase()]) return link;   /* already there: reuse it, never overwrite */
      return auth().then(function (a) {
        var fd = new FormData(); fd.append("file", new File([blob], name, { type: blob.type || "image/png" }));
        return fetch(API + "?action=upload&path=" + encodeURIComponent(p.dir) + "&name=" + encodeURIComponent(name) + "&csrf=" + encodeURIComponent(a.token), { method: "POST", credentials: "same-origin", body: fd });
      }).then(function (r) { if (!r.ok) throw new Error("Higher Logic said " + r.status); return rpc("listFiles", { path: p.dir, offset: 0, length: 2000 }); })
        .then(function (l) {
          var ok = (l.result && l.result.data || []).some(function (d) { return String(d[0]).toLowerCase() === name.toLowerCase(); });
          if (!ok) throw new Error("the file didn't save");
          p.have[name.toLowerCase()] = 1; return link;
        });
    });
  }
  window.addEventListener("message", function (e) {
    if (e.origin !== PARENT || !e.data || e.data.mm !== "hl-upload") return;
    var d = e.data, reply = function (x) { x.mm = "hl-result"; x.id = d.id; e.source.postMessage(x, PARENT); };
    say("Saving " + d.name + "…");
    upload(d.name, d.blob).then(function (url) { say("Saved " + d.name + "."); reply({ url: url }); })
      .catch(function (err) { say("Couldn't save " + d.name + "."); reply({ error: String(err && err.message || err) }); });
  });
  auth().then(function (a) { target.postMessage({ mm: "hl-ready", loggedin: !!(a && a.loggedin && a.token) }, PARENT); })
    .catch(function () { target.postMessage({ mm: "hl-ready", loggedin: false }, PARENT); });
})();
