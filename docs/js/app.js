/* Wordbook – Oberfläche, Übungstypen, Session-Ablauf */
(function (global) {
  "use strict";
  var S = global.VT, view = document.getElementById("view"), tabs = document.getElementById("tabs"),
      sessionEl = document.getElementById("session"), tab = "home", detailUnit = null,
      uebenSeg = "modi", statsSeg = "ueb", shopSeg = "shop", startMin = null, lastRec = null, openGroups = {}, openFolds = {}, wFilter = "alle", wQuery = "", wMax = 40;

  /* ---------- Werkzeug ---------- */
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]; }); }
  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function toast(msg, ms) {
    var t = document.createElement("div"); t.className = "toast pop"; t.textContent = msg;
    document.body.appendChild(t); setTimeout(function () { t.remove(); }, ms || 2600);
  }
  function plural(n, a, b) { return n === 1 ? a : b; }
  function fmtMin(sec) { var m = Math.round(sec / 60); return m < 1 ? "unter 1 Min" : m + " Min"; }

  /* ---------- Installation ---------- */
  var installPrompt = null;
  global.addEventListener("beforeinstallprompt", function (e) {
    e.preventDefault(); installPrompt = e;
    if (tab === "parent") render();
  });
  global.addEventListener("appinstalled", function () { installPrompt = null; toast("Wordy ist jetzt installiert."); });
  function isStandalone() {
    try {
      return global.matchMedia("(display-mode: standalone)").matches || global.navigator.standalone === true;
    } catch (e) { return false; }
  }
  function isIOS() { return /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1); }
  function installCard() {
    if (isStandalone()) return '<section class="card"><div class="eyebrow" style="color:var(--good)">Installiert</div>' +
      '<p class="small muted" style="margin:8px 0 0">Wordy läuft als App. Der Lernstand bleibt auf diesem Gerät gespeichert, auch offline.</p></section>';
    if (installPrompt) return '<section class="card"><div class="eyebrow">Als App installieren</div>' +
      '<p class="small muted" style="margin:8px 0 10px">Dann liegt Wordy als Symbol auf dem Startbildschirm, startet im Vollbild und funktioniert ohne Netz.</p>' +
      '<button class="btn" data-act="install">Auf dem Gerät installieren</button></section>';
    if (isIOS()) return '<section class="card"><div class="eyebrow">Als App installieren</div>' +
      '<p class="small muted" style="margin:8px 0 0">In Safari unten auf das Teilen-Symbol tippen und „Zum Home-Bildschirm“ wählen. Danach startet Wordy im Vollbild und läuft auch ohne Netz.</p></section>';
    return '<section class="card"><div class="eyebrow">Als App installieren</div>' +
      '<p class="small muted" style="margin:8px 0 0">Im Browsermenü gibt es dafür „Installieren“ oder „Zum Startbildschirm hinzufügen“. Offline funktioniert Wordy, sobald es über eine Adresse geöffnet wird und nicht als lose Datei.</p></section>';
  }

  /* ---------- Aussprache ---------- */
  var voice = null, voiceDe = null, voicesReady = false;
  function pickVoice() {
    if (!window.speechSynthesis) return null;
    var v = window.speechSynthesis.getVoices() || [];
    if (!v.length) return null;
    voice = v.filter(function (x) { return /^en[-_]GB/i.test(x.lang); })[0] ||
            v.filter(function (x) { return /^en/i.test(x.lang); })[0] || null;
    voiceDe = v.filter(function (x) { return /^de[-_]DE/i.test(x.lang); })[0] ||
              v.filter(function (x) { return /^de/i.test(x.lang); })[0] || null;
    voicesReady = true; return voice;
  }
  if (window.speechSynthesis) {
    pickVoice();
    window.speechSynthesis.onvoiceschanged = pickVoice;
  }
  /* Erzählerstimme (deutsch): bewertet die Geräte-Stimmen (natürlich klingende zuerst) und wählt nach Wunsch Frau oder Mann */
  var FEM = /anna|petra|marlene|vicki|helena|katja|hedda|amala|seraphina|jana|elke|kerstin|marie|female|weiblich|frau|sandy|shelley|flo\b/i, MAL = /markus|yannick|martin|stefan|conrad|killian|jonas|florian|reed|rocko|eddy|grandpa|male|männlich|mann|hans|dieter/i;
  function scoreVoice(v) {
    var n = v.name + " " + v.voiceURI, s = 0;
    if (/natural|neural|premium|enhanced|erweitert|siri|online|wavenet|studio/i.test(n)) s += 50;
    if (/google/i.test(n)) s += 20;
    if (v.localService === false) s += 10;
    if (/compact|espeak|robot|novelty|fred|ralph|zarvox|trinoids|whisper|bad|bells|cellos|boing|bubbles|deranged|hysterical|organ|superstar|wobble/i.test(n)) s -= 80;
    if (/^de[-_]DE/i.test(v.lang)) s += 8;
    return s;
  }
  function deVoices() {
    var all = (window.speechSynthesis && window.speechSynthesis.getVoices()) || [];
    return all.filter(function (x) { return /^de/i.test(x.lang); });
  }
  function narratorVoice() {
    var set = S.state.settings, list = deVoices();
    if (!list.length) return voiceDe;
    if (set.narratorVoice) { var f = list.filter(function (x) { return x.voiceURI === set.narratorVoice; })[0]; if (f) return f; }
    var g = set.narrator || "auto", re = g === "f" ? FEM : g === "m" ? MAL : null;
    list.sort(function (a, b) { return (scoreVoice(b) + (re && re.test(b.name) ? 100 : 0)) - (scoreVoice(a) + (re && re.test(a.name) ? 100 : 0)); });
    return list[0];
  }
  /* Klangfarbe: Frau warm und etwas langsamer, Mann tief und ruhig */
  function narratorTune() { var g = S.state.settings.narrator || "auto"; return g === "f" ? { pitch: 1.08, rate: 0.94 } : g === "m" ? { pitch: 0.82, rate: 0.93 } : { pitch: 1, rate: 1 }; }
  /* Handy-Browser öffnen den Audiokanal erst beim Sprechen und verlieren dabei den Anfang des Satzes
     (nur beim ersten Vorlesen nach einer Pause). Deshalb: war die Ausgabe länger still, wird zuerst eine
     kaum hörbare Silbe gesprochen und der eigentliche Satz erst nach einem Vorlauf gestartet.
     Die Länge des Vorlaufs ist unter Setup einstellbar (Standard 500 ms). */
  var lastSpoke = 0;
  function speechLead() { var v = S.state.settings.speechLead; return v == null ? 500 : v; }
  /* Wärmt die Ausgabe an, ohne etwas zu sagen: Früher wurde dafür das Wort „Okay“ mit Lautstärke 0,001 gesprochen. Viele Handy-Stimmen
     ignorieren die Lautstärke, dann war ein abgehacktes „OK“ in der Standardstimme zu hören, bevor die gewählte Stimme die Aufgabe vorlas.
     Jetzt ist der Wärm-Text nur ein Punkt (wird nicht gesprochen), mit derselben Stimme und Sprache wie die eigentliche Ausgabe (ref).
     done() läuft nach dem Vorlauf (ms), mindestens nach dem Ende des stillen Textes. */
  function primeSpeech(done, ms, ref) {
    var synth = window.speechSynthesis, fired = false, t0 = Date.now(), lead = Math.max(0, ms || 0);
    function fin() { if (fired) return; fired = true; if (done) setTimeout(done, Math.max(40, lead - (Date.now() - t0))); }
    if (!synth) return fin();
    try {
      var w = new SpeechSynthesisUtterance(".");
      w.volume = 0.001; w.rate = 2;
      if (ref && ref.voice) w.voice = ref.voice;
      if (ref && ref.lang) w.lang = ref.lang;
      w.onend = fin; w.onerror = fin;
      synth.speak(w);
      setTimeout(fin, Math.min(lead || 300, 600));
    } catch (e) { fin(); }
  }
  /* Englischen Text für die Sprachausgabe aufbereiten: Abkürzungen ausschreiben, Klammern und Schrägstriche glätten */
  function speechClean(t) {
    return String(t)
      .replace(/\bsb\.?\s*\/\s*sth\.?/gi, "somebody or something")
      .replace(/\bsth\.?\s*\/\s*sb\.?/gi, "something or somebody")
      .replace(/\bsb\.?(?=\W|$)/gi, "somebody")
      .replace(/\bsth\.?(?=\W|$)/gi, "something")
      .replace(/\be\.\s?g\.?/gi, "for example")
      .replace(/\bi\.\s?e\.?/gi, "that is")
      .replace(/\betc\.?/gi, "et cetera")
      .replace(/£\s?(\d+(?:[.,]\d+)?)/g, "$1 pounds")
      .replace(/\bthe (\d)0s\b/gi, function (m, d) { return "the " + ({ 6: "sixties", 7: "seventies", 8: "eighties", 9: "nineties" }[d] || m.slice(4)); })
      .replace(/\s*\((Nomen|Verb|Adjektiv|Vergangenheit|überhören|Stufe|klein|zum Beispiel)\)/g, "")   // deutsche Hinweise nicht vorlesen
      .replace(/\bat (\d{1,2})\.(\d{2})\b/g, "at $1:$2")
      .replace(/\s*(…|\.\.\.)\s*/g, " ")
      .replace(/[()]/g, "")
      .replace(/\s*\/\s*/g, ", ")
      .replace(/\s*[;:]\s*/g, ", ")
      .replace(/([.!?]),/g, "$1")
      .replace(/\s+/g, " ").trim();
  }
  var keepUtt = null;
  function speak(text, rate, lang, forceCold, onEnd) {
    if (!S.state.settings.audio || !window.speechSynthesis) return false;
    try {
      var synth = window.speechSynthesis, now = Date.now();
      var busy = synth.speaking || synth.pending, cold = !busy && (forceCold || now - lastSpoke > 30000);
      if (busy) synth.cancel();
      var de = lang === "de";
      var u = new SpeechSynthesisUtterance(de ? String(text) : speechClean(String(text)).replace(/^to\s+/i, ""));
      if (!voicesReady) pickVoice();
      var vo = de ? narratorVoice() : voice, tune = de ? narratorTune() : null;
      if (vo) u.voice = vo;
      u.lang = (vo && vo.lang) || (de ? "de-DE" : "en-GB");
      u.rate = rate || (de ? tune.rate : 0.92); if (de) u.pitch = tune.pitch;
      if (onEnd) { u.onend = onEnd; u.onerror = onEnd; }
      lastSpoke = now; keepUtt = u;   // Referenz halten: Chrome/Android feuert onend sonst nicht immer
      var lead = speechLead();
      if (busy) setTimeout(function () { synth.speak(u); }, 150);
      else if (cold && lead > 0) primeSpeech(function () { synth.speak(u); }, lead, u);
      else synth.speak(u);
      return true;
    } catch (e) { return false; }
  }
  /* Beim ersten Tippen die Sprachausgabe unhörbar anwerfen, damit schon der erste Satz vollständig kommt. */
  document.addEventListener("pointerdown", function warm() {
    document.removeEventListener("pointerdown", warm);
    if (S.state.settings.audio && window.speechSynthesis) { try { primeSpeech(null, 300); lastSpoke = Date.now(); } catch (e) {} }
  }, { passive: true });
  /* Tägliche Erinnerung (Web Push). Der Server schickt zur gewählten Uhrzeit einen Spruch; hier meldet sich das Gerät an. */
  function b64uToBytes(b) { var p = (b + "====").slice(0, b.length + (4 - b.length % 4) % 4).replace(/-/g, "+").replace(/_/g, "/"), r = atob(p), a = new Uint8Array(r.length), i; for (i = 0; i < r.length; i++) a[i] = r.charCodeAt(i); return a; }
  function pushSupported() { return !!(global.Notification && navigator.serviceWorker && global.PushManager); }
  function pushIosHint() { return /iPhone|iPad|iPod/.test(navigator.userAgent) && !(navigator.standalone || (global.matchMedia && global.matchMedia("(display-mode: standalone)").matches)); }
  /* Gerät für die Erinnerung anmelden (Erlaubnis, Abo, Server). Braucht beim ersten Mal einen Klick, weil der Browser sonst nicht fragt. */
  function pushEnable(W, time) {
    return W.push("GET").then(function (v) {
      return global.Notification.requestPermission().then(function (perm) {
        if (perm !== "granted") throw new Error("Ohne Erlaubnis geht es leider nicht.");
        return navigator.serviceWorker.ready.then(function (reg) {
          return reg.pushManager.getSubscription().then(function (ex) { return ex || reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64uToBytes(v.key) }); });
        }).then(function (sb) { return W.push("POST", { action: "subscribe", sub: sb.toJSON(), time: time || v.time, ua: (navigator.userAgent || "").slice(0, 70) }); });
      });
    });
  }
  /* Erinnerung ist standardmäßig an: Ist die Erlaubnis schon da, meldet sich das Gerät still an; sonst fragt einmal ein freundliches Fenster. */
  function pushAuto() {
    try {
      var W = global.WordySync, pf = S.state.profile;
      if (!W || !W.connected() || !pushSupported() || pushIosHint() || pf.pushOff || global.Notification.permission === "denied") return;
      navigator.serviceWorker.ready.then(function (reg) { return reg.pushManager.getSubscription(); }).then(function (sub) {
        if (sub) return;
        if (global.Notification.permission === "granted") { pushEnable(W).catch(function () {}); return; }
        if (pf.pushAsked) return;
        if ($(".srmd")) { setTimeout(pushAuto, 20000); return; }   // erst wenn kein anderes Fenster offen ist
        var ov = document.createElement("div"); ov.className = "srmd"; ov.id = "pushAsk";
        ov.innerHTML = '<div class="dsh" style="text-align:center"><div class="dshg"></div><div style="font-size:46px">⏰</div><h3>Soll Wordy dich erinnern?</h3><p>Jeden Tag kommt ein kurzer, frecher Spruch aufs Handy, damit du dein Tagesziel nicht vergisst. Du kannst es jederzeit unter Profil ausschalten.</p><button class="btn" data-ok="1">Ja, erinnere mich</button><button class="dshx" data-close="1">Nicht jetzt</button></div>';
        document.body.appendChild(ov);
        ov.addEventListener("click", function (e) {
          var ok = e.target.closest("[data-ok]");
          if (!ok && e.target !== ov && !e.target.closest("[data-close]")) return;
          pf.pushAsked = 1; S.save(true); ov.remove();
          if (ok) pushEnable(W).then(function () { toast("Erinnerung ist an. Einstellung: Profil › Ton & Aussehen."); }).catch(function (er) { toast(er.message || "Das hat nicht geklappt."); });
        });
      }).catch(function () {});
    } catch (e) {}
  }
  /* Erinnerung als Fenster in der App, bleibt stehen bis zum Wegklicken */
  function pushPopup(title, body) {
    var old = $("#pushPop"); if (old) old.remove();
    var ov = document.createElement("div"); ov.className = "srmd"; ov.id = "pushPop";
    ov.innerHTML = '<div class="dsh" style="text-align:center"><div class="dshg"></div><div style="font-size:46px">⏰</div><div class="eyebrow">' + esc(title || "Wordy") + '</div><h3>' + esc(body || "") + '</h3><button class="btn" data-go="1">Los geht’s</button><button class="dshx" data-close="1">Später</button></div>';
    document.body.appendChild(ov);
    ov.addEventListener("click", function (e) {
      if (e.target.closest("[data-go]")) { ov.remove(); if (!SS && tab !== "home") { tab = "home"; render(); } return; }
      if (e.target.closest("[data-close]")) ov.remove();
    });
    try { if (navigator.vibrate) navigator.vibrate([200, 100, 200]); } catch (e) {}
  }
  if (navigator.serviceWorker) navigator.serviceWorker.addEventListener("message", function (e) { if (!e.data || e.data.type !== "wordy-push") return; if (/^duel/.test(e.data.kind || "")) { toast(e.data.body, 5000); try { if (navigator.vibrate) navigator.vibrate([150, 80, 150]); } catch (x) {} if (socOn()) socLoad(true); return; } pushPopup(e.data.title, e.data.body); });
  setTimeout(pushAuto, 4500);
  function pushInit() {
    var box = $("#pushBox"); if (!box) return;
    var W = global.WordySync, head = '<span style="flex:1 1 auto"><b>Tägliche Erinnerung</b><br><span class="small muted">Ein frecher Spruch als Mitteilung, zum Beispiel nach der Schule</span></span>';
    if (!W || !W.connected()) { box.innerHTML = '<div class="row">' + head + '</div><p class="small muted" style="margin:6px 0 0">Dafür muss Wordy erst mit dem Server verbunden sein (Profil › Server).</p>'; return; }
    if (!pushSupported()) { box.innerHTML = '<div class="row">' + head + '</div><p class="small muted" style="margin:6px 0 0">Dieses Gerät oder dieser Browser kann leider keine Mitteilungen von Webseiten empfangen.</p>'; return; }
    if (pushIosHint()) { box.innerHTML = '<div class="row">' + head + '</div><p class="small muted" style="margin:6px 0 0">Auf dem iPhone geht das nur, wenn Wordy auf dem Home-Bildschirm liegt: In Safari auf Teilen tippen, „Zum Home-Bildschirm“ wählen und Wordy von dort öffnen.</p>'; return; }
    W.push("GET").then(function (v) {
      navigator.serviceWorker.ready.then(function (reg) { return reg.pushManager.getSubscription(); }).then(function (sub) {
        var active = !!sub && v.on && v.devices > 0, denied = global.Notification.permission === "denied";
        box.innerHTML = '<div class="row">' + head + '<input type="checkbox" id="pushOn" ' + (active ? "checked" : "") + (denied ? " disabled" : "") + ' style="width:auto"></div>' +
          '<div class="row" id="pushRow" style="margin-top:8px;gap:8px;align-items:center;flex-wrap:wrap"' + (active ? "" : " hidden") + '><label class="small" for="pushT">Uhrzeit</label><input id="pushT" type="time" value="' + esc(v.time) + '" style="width:auto"><button class="chip" id="pushTest">Test senden</button></div>' +
          '<p class="small muted" id="pushMsg" style="margin:6px 0 0">' + (denied ? "Mitteilungen sind für Wordy im Browser gesperrt. Erlaube sie in den Einstellungen des Browsers." : "") + "</p>";
        var msg = function (t, bad) { var m = $("#pushMsg"); if (m) { m.textContent = t; m.style.color = bad ? "var(--bad)" : ""; } };
        $("#pushOn").onchange = function () {
          var on = this.checked, sw = this, pf = S.state.profile;
          pf.pushOff = !on; S.save(true);
          if (!on) {
            navigator.serviceWorker.ready.then(function (reg) { return reg.pushManager.getSubscription(); }).then(function (sb) { var ep = sb && sb.endpoint; return (sb ? sb.unsubscribe() : Promise.resolve()).then(function () { return W.push("POST", ep ? { action: "unsubscribe", endpoint: ep } : { action: "settings", on: false }); }); })
              .then(function () { $("#pushRow").hidden = true; msg("Erinnerung ausgeschaltet."); }).catch(function (e) { msg(e.message, true); });
            return;
          }
          pushEnable(W, $("#pushT").value).then(function () { $("#pushRow").hidden = false; msg("Fertig! Die Erinnerung kommt jeden Tag um " + $("#pushT").value + " Uhr."); })
            .catch(function (e) { sw.checked = false; pf.pushOff = true; S.save(true); msg(e.message || "Das hat nicht geklappt.", true); });
        };
        $("#pushT").onchange = function () { W.push("POST", { action: "settings", time: this.value }).then(function () { msg("Uhrzeit gespeichert."); }).catch(function (e) { msg(e.message, true); }); };
        $("#pushTest").onclick = function () { msg("Wird gesendet …"); W.push("POST", { action: "test" }).then(function (r) { msg(r.sent ? "Gesendet. Sie sollte gleich ankommen." : "Es ist kein Gerät angemeldet.", !r.sent); }).catch(function (e) { msg(e.message, true); }); };
      });
    }).catch(function (e) { box.innerHTML = '<div class="row">' + head + '</div><p class="small muted" style="margin:6px 0 0">' + esc(e.message) + "</p>"; });
  }
  /* Bildschirm anlassen, solange Wordy offen ist (Screen Wake Lock). Das System gibt die Sperre beim Wechsel in den Hintergrund selbst frei, deshalb beim Zurückkehren neu anfordern. */
  var wakeLock = null;
  function wakeSync() {
    try {
      var want = S.state.settings.wake !== false && document.visibilityState === "visible";
      if (!want) { if (wakeLock) { wakeLock.release().catch(function () {}); wakeLock = null; } return; }
      if (wakeLock || !navigator.wakeLock) return;
      navigator.wakeLock.request("screen").then(function (l) { wakeLock = l; l.addEventListener("release", function () { if (wakeLock === l) wakeLock = null; }); }).catch(function () {});
    } catch (e) {}
  }
  document.addEventListener("visibilitychange", wakeSync);
  document.addEventListener("pointerdown", function () { if (!wakeLock) wakeSync(); }, { passive: true });
  setTimeout(wakeSync, 600);
  function audioAvailable() { return !!(window.speechSynthesis && S.state.settings.audio); }

  /* ---------- Textvergleich ---------- */
  function norm(s) {
    return String(s).toLowerCase().replace(/^to\s+/, "").replace(/^(a|an|the)\s+/, "")
      .replace(/[.,!?;:'"´`]/g, "").replace(/\s+/g, " ").trim();
  }
  function lev(a, b) {
    var m = a.length, n = b.length, d = [], i, j;
    for (i = 0; i <= m; i++) d[i] = [i];
    for (j = 0; j <= n; j++) d[0][j] = j;
    for (i = 1; i <= m; i++) for (j = 1; j <= n; j++)
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    return d[m][n];
  }
  function judgeTyped(input, target) {
    var a = norm(input), alts = String(target).split(/\s*[\/,]\s*/).map(norm).filter(Boolean);
    if (!a) return 0;
    if (alts.indexOf(a) >= 0) return 2;
    for (var i = 0; i < alts.length; i++) {
      var d = lev(a, alts[i]);
      if (d <= (alts[i].length > 6 ? 2 : 1)) return 1;
    }
    return 0;
  }

  /* ---------- Kopfzeile ---------- */
  /* Avatare sind Emojis oder, mit "svg:"-Präfix, Zeichnungen aus cosmetics.js */
  function avatarHtml(v) { return global.VTC.avatarHtml(v, esc); }
  function playerName() {
    var d = S.profiles(), x = d.list.filter(function (y) { return y.id === d.active; })[0];
    return x ? x.name : "";
  }
  /* Sticker hängen am unteren Rand der Kopfzeile (brauchen keinen Platz); passt die Zeile nicht, wird sie dichter, zuletzt umbrechen */
  function fitStickers() {
    var top = $("#top"); if (!top) return;
    top.classList.remove("dn", "hc", "wr");
    [["dn"], ["dn", "hc"], ["dn", "hc", "wr"]].some(function (c) {
      if (top.scrollWidth <= top.clientWidth) return true;
      c.forEach(function (x) { top.classList.add(x); });
      return false;
    });
  }
  global.addEventListener("resize", fitStickers);
  if (global.document && document.fonts && document.fonts.ready) document.fonts.ready.then(function () { fitStickers(); });
  /* Saison-Look (Halloween): Einstellung "auto" gilt vom 15.10. bis 2.11., "on" immer, "off" nie */
  function seasonNow() {
    var m = S.state.settings.season || "auto"; if (m === "off") return ""; if (m === "on") return "halloween";
    var d = new Date(), md = (d.getMonth() + 1) * 100 + d.getDate(); return md >= 1015 && md <= 1102 ? "halloween" : "";
  }
  /* Leiser Halloween-Klangteppich: nur mit Saison-Look, Ton an, Gruselklängen an, außerhalb von Lernrunden und Spielen, solange die App sichtbar ist */
  function ambientSync() {
    var V = global.VTC; if (!V || !V.ambientStart) return;
    var want = seasonNow() === "halloween" && S.state.settings.audio !== false && S.state.settings.seasonSound !== false && sessionEl.hidden && !document.hidden && heard;
    if (want && !V.ambientOn()) V.ambientStart(); else if (!want && V.ambientOn()) V.ambientStop();
  }
  /* Halloween-Spinne in der Kopfzeile als echtes Element (antippbar): Dekoration per CSS, Effekt in saison.js */
  function spiderSync() {
    var h = $("#top"), el = $("#hwSp"), on = seasonNow() === "halloween";
    if (global.VTS && global.VTS.home) global.VTS.home(on && tab === "home" && sessionEl.hidden);
    if (on && h && !el) { el = document.createElement("div"); el.id = "hwSp"; el.className = "hwsp"; el.setAttribute("role", "button"); el.setAttribute("aria-label", "Spinne antippen"); el.style.setProperty("--cd", (150 + Math.random() * 140 | 0) + "px"); el.addEventListener("animationiteration", function (ev) { if (ev.animationName === "hwCrawl") el.style.setProperty("--cd", (100 + Math.random() * 200 | 0) + "px"); }); h.appendChild(el); }
    else if (!on && el) el.remove();
  }
  document.addEventListener("click", function (e) {
    var sp = e.target.closest && e.target.closest("#hwSp"); if (!sp || !global.VTS || !sessionEl.hidden) return;
    var r = sp.getBoundingClientRect(); sp.classList.add("gone");
    if (!global.VTS.spider({ left: r.left, width: r.width, bottom: r.bottom }, function () { sp.classList.remove("gone"); }, S.state.settings.audio === false)) return;
  });
  var heard = false;
  document.addEventListener("pointerdown", function () { heard = true; ambientSync(); }, { passive: true });
  document.addEventListener("keydown", function () { heard = true; }, { passive: true });
  document.addEventListener("visibilitychange", ambientSync);
  setInterval(ambientSync, 1500);
  function renderHeader() {
    var st = S.state, r = S.rankOf(st.xp);
    $("#hAvatar").innerHTML = avatarHtml(st.profile.avatar);
    $("#hAvatar").className = ("avatar " + global.VTC.frameClass(st.profile)).trim();
    var pd = S.profiles(); var pn = pd.list.filter(function (x) { return x.id === pd.active; })[0];
    $("#hAvatar").title = pn ? pn.name : "";
    $("#hRank").textContent = r.rank.n + (st.profile.title ? " · " + st.profile.title : "");
    $("#hXp").textContent = st.xp;
    var hs = $("#hStk"); if (hs) { var sh = S.stickers().length ? placedStickers(30) : ""; hs.innerHTML = sh; hs.hidden = !sh; }   // Sticker immer oben neben den XP
    $("#hCoins").textContent = st.coins;
    $("#hStreak").textContent = st.streak.count;
    var hEl = $("#hHearts");
    if (!st.settings.hearts) { hEl.textContent = "∞"; hEl.title = "Ohne Herzen"; }
    else { S.regenHearts(); hEl.setAttribute("data-n", st.hearts); hEl.innerHTML = "<span style='color:var(--bad)'>" + "♥".repeat(st.hearts) + "</span><span style='color:var(--line)'>" + "♥".repeat(5 - st.hearts) + "</span>"; }
    global.VTC.applyLook(st.profile, st.settings.themeMode, st.settings.design, seasonNow());
    ambientSync(); spiderSync();
    var hb = $("#hBoost");
    if (hb) {
      var bs = st.path && st.path.boost, on = !!(bs && bs.on && bs.left > 0);
      hb.hidden = !on; if (on) hb.textContent = "⚡×2 " + Math.floor(bs.left / 60) + ":" + ("0" + (bs.left % 60)).slice(-2);
    }
    fitStickers();
  }

  function trackSwitch() {
    var t = S.state.settings.track;
    return '<div class="seg" role="group" aria-label="Lernbereich">' +
      '<button data-act="track" data-t="schule" aria-pressed="' + (t === "schule") + '">🎒 Schule</button>' +
      '<button data-act="track" data-t="business" aria-pressed="' + (t === "business") + '">💼 Business</button></div>';
  }
  function groupLabel(k) { return typeof k === "number" ? "Klasse " + k : k; }

  /* ---------- Wunsch ---------- */
  /* Wunsch als Silhouette, die sich mit dem Fortschritt von unten mit Farbe füllt */
  function wishFigure(it, pc, locked) {
    var ico = it.kind === "sticker" ? stickerHtml(it, 40) : it.kind === "avatar" ? avatarHtml(it.val) : shopIcon(it);
    return '<div class="wishfig" style="--p:' + Math.max(0, Math.min(100, pc)) + '%" role="img" aria-label="' + esc(it.label) + ', ' + Math.round(pc) + ' Prozent">' +
      '<span class="sil" aria-hidden="true">' + ico + '</span><span class="col" aria-hidden="true">' + ico + '</span>' + (locked ? '<span class="lock">🔒</span>' : "") + '</div>';
  }
  function wishCard() {
    var st = S.state, it = S.wish();
    if (!it) return '<section class="card"><div class="row" style="gap:12px;align-items:center"><div style="font-size:30px">⭐</div>' +
      '<div style="flex:1 1 auto"><b>Was wünschst du dir?</b><p class="small muted" style="margin:2px 0 0">Wähle im Shop einen Wunsch, auf den du Münzen sammelst. Hier siehst du, wie weit du schon bist.</p></div></div>' +
      '<button class="btn soft wide" data-act="goshop" style="margin-top:10px">Zum Shop</button></section>';
    var cost = S.priceOf(it), have = Math.min(st.coins, cost), pc = cost ? Math.round(have * 100 / cost) : 100, left = Math.max(0, cost - st.coins);
    var needXp = Math.max(0, S.minXp(it) - st.xp);
    var icon = wishFigure(it, pc, needXp > 0);
    var line = needXp ? "Du brauchst noch " + needXp + " XP bis Rang " + esc(it.rank) + (left ? " und " + left + " 🪙." : ".")
      : left ? "Noch " + left + " 🪙 – etwa " + Math.max(1, Math.ceil(left / S.avgCoins())) + " " + plural(Math.max(1, Math.ceil(left / S.avgCoins())), "Lerntag", "Lerntage") + "." : "Genug Münzen! Jetzt im Shop holen.";
    return '<section class="card"><div class="eyebrow">Dein Wunsch</div><div class="row" style="gap:12px;align-items:center;margin-top:8px"><div style="width:50px;display:grid;place-items:center">' + icon + '</div>' +
      '<div style="flex:1 1 auto;min-width:0"><b>' + esc(it.label) + '</b><div class="bar" style="margin:6px 0 4px"><i style="width:' + pc + '%"></i></div>' +
      '<div class="small muted tnum">' + have + ' / ' + cost + ' 🪙 · ' + line + '</div></div></div>' +
      '<div class="row" style="gap:8px;margin-top:10px">' + (!needXp && !left ? '<button class="btn" data-act="buy" data-id="' + esc(it.id) + '">Jetzt kaufen</button>' : "") +
      '<button class="btn ghost" data-act="goshop">Anderen Wunsch wählen</button></div></section>';
  }
  /* Verbformen (Einstellung `verbForms`): "all" = Infinitiv, Simple Past, Past Participle; "past" = nur Infinitiv und Simple Past (ohne 3. Form) */
  function vPastOnly() { return S.state.settings.verbForms === "past"; }
  function vN() { return vPastOnly() ? 2 : 3; }
  function vFirst(x) { return String(x).split("/")[0]; }
  function vFormsText(v) { return vPastOnly() ? v.inf + " – " + v.past : v.inf + " – " + v.past + " – " + v.pp; }
  function verbFormsSwitch() {
    return '<div class="row wrap" style="gap:6px;margin-top:10px;align-items:center"><span class="small muted">Formen lernen:</span>' +
      '<button class="chip" data-act="vforms" data-k="all" aria-pressed="' + !vPastOnly() + '">Alle drei</button>' +
      '<button class="chip" data-act="vforms" data-k="past" aria-pressed="' + vPastOnly() + '">Nur Simple Past</button></div>';
  }
  /* ---------- Unregelmäßige Verben: Karte, Liste ---------- */
  function verbCard() {
    var vs = S.verbStats(), vp = S.verbPools(), due = vp.box.length + vp.due.length;
    return '<section class="card"><div class="row"><div style="flex:1 1 auto"><div class="eyebrow">Unregelmäßige Verben</div>' +
      '<h2 style="font-size:19px">' + vs.seen + ' von ' + vs.total + ' geübt · ' + vs.mastered + ' sitzen</h2>' +
      '<p class="small muted" style="margin:4px 0 0">' + (due ? due + " " + plural(due, "Verb ist", "Verben sind") + " zur Wiederholung dran. " : "") +
      (vPastOnly() ? 'Go – went: Grundform und Simple Past (die 3. Form ist ausgeblendet). ' : 'Go – went – gone: alle Formen, die man in der Schule braucht. ') + 'In normalen Runden kommen sie immer wieder zwischendurch.</p>' + verbFormsSwitch() + '</div></div>' +
      '<div class="row wrap" style="margin-top:12px;gap:8px"><button class="btn" data-act="start" data-mode="verbs" data-min="5">Verben üben</button>' +
      '<button class="btn soft" data-act="start" data-mode="verbs" data-vtype="1" data-min="5">Nur Tippen</button>' +
      '<button class="btn ghost" data-act="verblist">Alle Verben ansehen</button></div>' +
      '<p class="small muted" style="margin:8px 0 0">„Verben üben“ mischt Einführung, Lückenaufgabe und Tippen. „Nur Tippen“ fragt immer ' + (vPastOnly() ? 'das Simple Past' : 'beide Formen') + ' zum Schreiben ab.</p></section>';
  }
  function viewVerbList() {
    var vs = S.verbStats(), list = S.verbs();
    var rows = list.map(function (v) {
      var lv = S.levelOf(v.id), r = S.state.w[v.id];
      return '<div class="wordrow" data-act="vtoggle" style="cursor:pointer">' +
        (audioAvailable() ? '<button class="mini-speak" data-act="say" data-text="' + esc(v.en) + '" aria-label="' + esc(v.inf) + ' anhören">🔊</button>' : '') +
        '<span class="vchev" aria-hidden="true">▸</span>' +
        '<span class="en" style="flex:1 1 auto">' + esc(vFormsText(v)) + '<br><span class="small muted">' + esc(v.de) + '</span></span>' +
        (r && r.no ? '<span class="pill" title="Fehler">✗ ' + r.no + '</span>' : '') +
        '<span class="pill l' + lv + '">' + esc(S.LEVELS[lv].n) + '</span></div>' +
        '<div class="vsent stack" hidden style="gap:8px;padding:0 0 12px">' + verbSentCards(v, true) +
        '<button class="btn soft" data-act="start" data-mode="verbs" data-vtype="1" data-verb="' + esc(v.id) + '" style="align-self:flex-start">✍️ Dieses Verb tippen</button></div>';
    }).join("");
    view.innerHTML = '<div class="stack">' +
      '<button class="btn ghost" data-act="back" style="align-self:flex-start">← Zurück</button>' +
      '<section class="card"><div class="eyebrow">Unregelmäßige Verben</div>' +
      '<h1 style="font-size:24px">Verbenliste</h1>' +
      '<p class="small muted" style="margin:6px 0 0">' + vs.total + ' Verben · ' + vs.seen + ' geübt · ' + vs.mastered + ' gemeistert. Infinitiv – Simple Past (Präteritum)' + (vPastOnly() ? '' : ' – Past Participle (Partizip Perfekt)') + '.</p>' + verbFormsSwitch() +
      '<div class="row wrap" style="margin-top:12px;gap:8px"><button class="btn" data-act="start" data-mode="verbs" data-min="5">Verben üben</button>' +
      '<button class="btn soft" data-act="start" data-mode="verbs" data-vtype="1" data-min="5">Nur Tippen</button></div></section>' +
      '<section class="card"><div class="eyebrow">Alle Verben · Zeile antippen = Beispielsätze</div>' + rows + '</section></div>';
  }

  /* ================= START ================= */

  /* ---------- Ziele und Lernpläne der Eltern (Startseite) ---------- */
  function itemLabel(id) { var it = S.itemById && S.itemById(id); return it ? it.label : "Überraschung"; }
  function parentCards(skipPlans) {
    var W = window.WordySync; if (!W || !W.connected()) return "";
    var h = "", goals = W.currentGoals(), plans = W.activePlans(), st = S.state;
    (skipPlans || skipPlans === "goals" ? [] : plans).forEach(function (pl) {
      var i = W.planInfo(pl), done = st.goalsDone && st.goalsDone["p" + pl.id];
      var when = i.days > 1 ? "in " + i.days + " Tagen" : i.days === 1 ? "morgen" : "heute";
      var newToday = (st.daily && st.daily.newSeen) || 0, left = Math.max(0, i.quota - newToday);
      h += '<section class="card"><div class="eyebrow">' + (pl.cls ? "🏫 Klassenaufgabe" : "📅 Lernplan") + '</div>' +
        '<div style="margin-top:6px"><b>' + esc(pl.title) + '</b> <span class="small muted">· ' + (pl.cls ? "Ende " : "Arbeit ") + when + '</span></div>' +
        '<div class="bar" style="margin:10px 0 6px"><i style="width:' + i.pct + '%"></i></div>' +
        '<p class="small muted" style="margin:0 0 10px">' + i.pct + ' % sicher (' + i.ok + ' von ' + i.total + ' Wörtern)' +
        (done ? ' · ✅ Ziel erreicht' : !pl.cls && (pl.coins || pl.item) ? ' · Bonus bei 90 %: ' + (pl.coins ? pl.coins + ' Münzen' : '') + (pl.coins && pl.item ? ' + ' : '') + (pl.item ? '🎁 ' + esc(itemLabel(pl.item)) : '') : '') + '</p>' +
        (i.total - i.ok > 0 ? '<p class="small" style="margin:0 0 10px">Heute dran: ' + (left > 0 ? '<b>' + left + ' neue ' + plural(left, "Wort", "Wörter") + '</b> und ' : '') + 'Wiederholung.</p>' : '') +
        '<button class="btn wide" data-act="startplan" data-id="' + esc(pl.id) + '">' + (pl.cls ? "Klassen-Challenge starten" : "Lernplan üben") + '</button></section>';
    });
    if (goals.length && skipPlans !== "plans") {
      h += '<section class="card"><div class="eyebrow">🎯 Deine persönlichen Wochenziele</div><div style="margin-top:8px">' + goals.map(function (g) {
        var pr = W.progress(g), done = st.goalsDone && st.goalsDone["g" + g.id];
        return '<div style="padding:8px 0;border-top:1px solid var(--line)"><div class="row"><b class="small" style="flex:1 1 auto">' + (done ? "✅ " : "") + esc(g.title) + '</b>' +
          '<span class="pill tnum">' + Math.min(pr.cur, g.target) + ' / ' + g.target + (g.kind === "unit" ? " %" : "") + '</span></div>' +
          '<div class="bar" style="margin-top:6px"><i style="width:' + (done ? 100 : pr.pct) + '%"></i></div>' +
          '<div class="row" style="margin-top:6px;gap:8px">' + (g.coins || g.item ? '<div class="small muted" style="flex:1 1 auto">' + (done ? 'Geschafft, ' + (g.coins ? g.coins + ' Münzen' : '') + (g.coins && g.item ? ' und ' : '') + (g.item ? esc(itemLabel(g.item)) : '') + ' sind gutgeschrieben.' : 'Belohnung: ' + (g.coins ? '🪙 ' + g.coins : '') + (g.coins && g.item ? ' + ' : '') + (g.item ? '🎁 ' + esc(itemLabel(g.item)) : '')) + '</div>' : '<span style="flex:1 1 auto"></span>') +
          (done ? '' : '<button class="chip" data-act="startgoal" data-id="' + esc(g.id) + '">Jetzt üben →</button>') + '</div></div>';
      }).join("") + '</div></section>';
    }
    return h;
  }

  /* ---------- Tagesmissionen: direkt zum passenden Modus ---------- */
  var MISSION_TIP = {
    items: "Gemischte Runde: jedes Wort zählt.", goal: "Gemischte Runde bis zum Tagesziel.", box: "Fehlerkartei üben: richtige Antworten zählen.",
    chain: "Gemischte Runde, konzentriert und ohne Hinweis.", new: "Wörter wiedererkennen, die du schon mal gesehen hast.", master: "Fast sitzende Wörter tippen, ohne Hinweis.",
    sent: "Satzbau: Sätze richtig legen.", arena: "Ein Spiel aus der Arena."
  };
  function missionGo(m) {
    var st = S.state, left = Math.max(5, Math.min(15, Math.ceil((S.goalMin() * 60 - ((st.daily && st.daily.sec) || 0)) / 60)));
    switch (m.type) {
      case "items": return 'data-act="start" data-mode="mix" data-min="' + S.goalMin() + '"';
      case "goal": return 'data-act="start" data-mode="mix" data-min="' + left + '"';
      case "box": return 'data-act="start" data-mode="box" data-min="5"';
      case "chain": return 'data-act="start" data-mode="mix" data-min="5"';
      case "new": return 'data-act="start" data-mode="mix" data-min="5"';
      case "master": return 'data-act="start" data-mode="master" data-min="5"';
      case "sent": return 'data-act="start" data-mode="sent" data-min="5"';
      case "arena": return global.ARENA ? 'data-act="arena" data-id="' + esc(m.mode || "match") + '"' : "";
    }
    return "";
  }

  /* ---------- Segment-Umschalter und Kacheln ---------- */
  function segBar(group, cur, items) {
    return '<div class="segs">' + items.map(function (x) {
      return '<button data-act="seg" data-g="' + group + '" data-v="' + x[0] + '" aria-pressed="' + (cur === x[0]) + '">' + x[1] + '</button>';
    }).join("") + (global.VTFILM && (group === "lernen" || group === "spielen") ? '<button class="howto" data-act="howto" aria-label="How-to: Erklärfilme">▶ How-to</button>' : "") + '</div>';
  }
  /* How-to: die Erklärfilme liegen hinter einem eigenen Knopf, damit sie das Üben nicht stören */
  function howtoSheet() {
    var ov = document.createElement("div"); ov.className = "srmd";
    ov.innerHTML = '<div class="dsh" style="max-height:86vh;overflow:auto;text-align:left"><div class="dshg"></div><div class="eyebrow">How-to</div><h3 style="text-align:center">Kurz erklärt</h3><p style="text-align:center">Bruno, Pingo, Robbi und Eisi zeigen jeden Modus in 30 Sekunden.</p><div class="fmlist">' +
      global.VTFILM.list.map(function (f) { return '<button class="fmcard" data-id="' + f.id + '"><span>' + f.icon + '</span><b>' + esc(f.title) + '</b><i>▶</i></button>'; }).join("") + '</div><button class="dshx" data-close="1">Schließen</button></div>';
    document.body.appendChild(ov);
    ov.addEventListener("click", function (e) {
      var c = e.target.closest(".fmcard");
      if (e.target === ov || e.target.closest("[data-close]")) return ov.remove();
      if (c) { var id = c.getAttribute("data-id"); ov.remove(); var b = document.createElement("button"); b.hidden = true; b.setAttribute("data-act", "film"); b.setAttribute("data-id", id); view.appendChild(b); b.click(); b.remove(); }
    });
  }
  function tile(icon, title, desc, attrs, extra, cls) {
    return '<button class="tile' + (cls ? " " + cls : "") + '" ' + attrs + '><span class="ti">' + icon + '</span><span class="tt"><b>' + title + '</b><span class="d">' + desc + '</span>' + (extra || "") + '</span></button>';
  }

  /* ---------- Wochenzeitplan (von den Eltern im Dashboard festgelegt) ---------- */
  function weekPlanCard() {
    var gm = S.goalMin(), wp = S.weekPlan(), auto = !wp;   // ohne Wochenzeitplan der Eltern: jeder Tag mit dem Tagesziel
    if (!wp) wp = { min: [gm, gm, gm, gm, gm, gm, gm], bonus: 0 };
    var st = S.state, t = S.today(), d0 = new Date(t + "T00:00:00Z"), wd = (d0.getUTCDay() + 6) % 7, names = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"], planDays = 0, ok = 0, cells = "";
    wp.min.forEach(function (m, i) {
      var k = new Date(d0.getTime() + (i - wd) * 86400000).toISOString().slice(0, 10), sec = k === t ? ((st.daily && st.daily.sec) || 0) : ((st.history[k] && st.history[k].sec) || 0), done = m > 0 && sec >= m * 60, sym, color = "var(--ink-3,#8896ab)";
      if (m > 0) { planDays++; if (done) ok++; }
      if (m === 0) sym = "frei";
      else if (done) { sym = "✓"; color = "var(--good,#2e7d4f)"; }
      else if (k === t) { sym = "▶"; color = "var(--accent,#1e6273)"; }
      else if (k > t) sym = "○";
      else sym = "·";
      cells += '<div style="text-align:center;font-size:12px;border-radius:8px;padding:3px 0' + (k === t ? ';background:var(--accent-soft,#ddeef2)' : '') + '">' + names[i] + '<br><b style="font-size:' + (sym === "frei" ? 12 : 18) + 'px;color:' + color + '">' + sym + '</b>' + (m > 0 ? '<br><span class="muted" style="font-size:11px">' + m + '′</span>' : '') + '</div>';
    });
    var need = Math.max(1, Math.ceil(planDays * 0.8)), got = st.goalsDone && st.goalsDone["wp" + (function () { var m0 = new Date(d0.getTime() - wd * 86400000); return m0.toISOString().slice(0, 10); })()];
    return '<section class="card"><div class="row"><div class="eyebrow" style="flex:1 1 auto">Deine Woche</div><span class="pill tnum">' + ok + ' von ' + planDays + (auto ? ' Tagen' : ' Plan-Tagen') + '</span></div>' +
      '<div style="display:grid;grid-template-columns:repeat(7,1fr);gap:4px;margin-top:10px">' + cells + '</div>' +
      (wp.bonus > 0 ? '<p class="small muted" style="margin:10px 0 0">' + (got ? "🎉 Wochenbonus geholt: 🪙 " + wp.bonus : "Bonus: 🪙 " + wp.bonus + ", wenn mindestens " + need + " von " + planDays + " Plan-Tagen geschafft sind.") + '</p>' : "") + '</section>';
  }

  /* ---------- Pass: Monat aus Wochen-Sets ---------- */
  var passSel = null;
  var RAR_COL = { common: ["#7a9a6a", "#4f6f46"], rare: ["#2f8cff", "#1b57c9"], epic: ["#a855f7", "#6d28d9"], legend: ["#ffb61e", "#e8730c"] };
  function itemIcon(it, big) {
    if (!it) return "";
    if (it.kind === "avatar") return '<span class="ri">' + avatarHtml(it.val) + '</span>';
    if (it.kind === "sticker") return '<span class="ri">' + stickerHtml(it, big ? 44 : 34) + '</span>';
    if (it.kind === "frame") return '<span class="ri"><span class="avatar fr-' + esc(it.val) + '" style="width:30px;height:30px;font-size:16px">🙂</span></span>';
    return '<span class="ri em">' + (it.kind === "dance" ? "💃" : it.kind === "outfit" ? "👕" : it.kind === "kit" ? "⚽" : it.kind === "fx" ? "✨" : "🎁") + '</span>';
  }
  function rcard(id, locked) {
    var it = S.itemById(id); if (!it) return "";
    var r = S.rarityOf(it), c = RAR_COL[r];
    return '<div class="rcard' + (locked ? " lock" : "") + '" style="--c1:' + c[0] + ';--c2:' + c[1] + '">' + itemIcon(it) + '<b>' + esc(it.label) + '</b></div>';
  }
  function passCard() {
    var info = S.passInfo(), s = info.season, st = S.state, sel = passSel;
    var cur = info.weeks.filter(function (w) { return w.state === "ready" || w.state === "cur"; })[0];
    if (sel == null) sel = cur ? cur.n : info.fin.ready ? "fin" : info.weeks.length;
    var done = info.weeks.filter(function (w) { return w.claimed; }).length;
    var head = !info.started ? "Startet am " + info.start.split("-").reverse().slice(0, 2).join(".") + "." : info.over ? "Pass beendet" : "Woche " + Math.min(info.idx + 1, info.weeks.length) + " von " + info.weeks.length;
    var tiles = info.weeks.map(function (w) {
      var firstAv = w.items.map(S.itemById).filter(function (x) { return x && x.kind === "avatar"; })[0] || S.itemById(w.items[0]);
      var future = w.state === "future" || w.state === "missed" && false, pc = Math.round(Math.min(1, w.cnt / w.need) * 100);
      return '<button class="ptile ' + w.state + (sel === w.n ? " sel" : "") + '" data-act="passsel" data-n="' + w.n + '" style="--p:' + pc + '%" aria-label="Woche ' + w.n + '">' +
        '<span class="pring">' + (w.state === "future" ? '<span class="sil">' + itemIcon(firstAv) + '</span><span class="q">?</span>' : itemIcon(firstAv)) + '</span>' +
        '<span class="pl">' + (w.claimed ? "✓" : w.state === "ready" ? "Abholen!" : "Woche " + w.n) + '</span></button>';
    }).join("");
    if (s.finale) tiles += '<button class="ptile pfin ' + (info.fin.claimed ? "claimed" : info.fin.ready ? "ready" : "future") + (sel === "fin" ? " sel" : "") + '" data-act="passsel" data-n="fin"><span class="pring"><span class="em">👑</span></span><span class="pl">' + (info.fin.claimed ? "✓" : info.fin.ready ? "Abholen!" : "Finale") + '</span></button>';
    var det = "";
    if (sel === "fin" && s.finale) {
      det = '<div class="pdet"><b>' + esc(s.finale.title || "Finale") + '</b><p class="small muted" style="margin:2px 0 8px">Hol alle Wochen ab, dann gehört dir der Schatz.</p><div class="rcards">' + (s.finale.items || []).map(function (id) { return rcard(id, !info.fin.ready && !info.fin.claimed); }).join("") + '</div>' +
        '<div class="small" style="margin:8px 0 0">' + (s.finale.coins ? "+" + s.finale.coins + " 🪙 " : "") + (s.finale.slot ? "· +1 Stickerplatz " : "") + (s.finale.boost ? "· +" + s.finale.boost + " ⚡ Booster" : "") + '</div>' +
        (info.fin.ready ? '<button class="btn wide lg" data-act="passclaim" data-n="fin" style="margin-top:10px">🎁 Finale abholen</button>' : info.fin.claimed ? '<p class="small muted" style="margin:10px 0 0">Schon abgeholt. Stark!</p>' : '') + '</div>';
    } else {
      var w = info.weeks[sel - 1] || info.weeks[0];
      var sIcon = passIcon(s), dayDots = '<div class="stamps">' + w.days.map(function (d) {
        var lab = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"][(new Date(d.k + "T00:00:00Z").getUTCDay() + 6) % 7], cls = d.ok ? "ok" : d.joker || d.makeup ? "joker" : d.today ? "now" : d.future ? "fut" : "miss", fresh = d.ok && d.today && S.stampNew(d.k);
        if (fresh) setTimeout(function () { try { if (S.state.settings.audio) global.VTC.sound(S.state.profile.snd, true); global.VTC.burst(S.state.profile.fx, global.innerWidth / 2, global.innerHeight * .4, 14, 1); } catch (e) {} }, 350);
        return '<span class="stp ' + cls + (fresh ? " new" : "") + '"><span class="stpi">' + (d.ok ? sIcon : d.joker ? "🃏" : d.makeup ? "💪" : d.today ? "▶" : d.future ? "○" : "·") + '</span><small>' + lab + '</small></span>';
      }).join("") + '</div>' + (w.joker ? '<p class="small muted" style="margin:6px 0 0">🃏 Joker: ein verpasster Tag zählt in dieser Woche trotzdem mit.</p>' : '<p class="small muted" style="margin:6px 0 0">🃏 Pro Woche zählt ein verpasster Tag als Joker mit.</p>') + (w.makeup ? '<p class="small" style="margin:4px 0 0">💪 Nachgeholt: Mit dem doppelten Tagesziel heute zählt ein weiterer Tag mit.</p>' : w.state === "cur" ? '<p class="small muted" style="margin:4px 0 0">💪 Nachholen: Schaffst du heute das doppelte Tagesziel, zählt ein weiterer verpasster Tag.</p>' : "");
      var TN = { bronze: "🥉 Bronze", silber: "🥈 Silber", gold: "🥇 Gold" };
      var tierHtml = '<div class="ptiers">' + w.tiers.map(function (t) {
        return '<button class="ptr ' + t.k + (t.got ? " got" : t.ok ? " rdy" : "") + '" ' + (t.ok && !t.got ? 'data-act="passtier" data-n="' + w.n + '" data-k="' + t.k + '"' : "disabled") + '><b>' + TN[t.k] + '</b><small>' + t.d + ' Tage</small><span>' + (t.got ? "✓" : "+" + t.c + " 🪙") + '</span></button>';
      }).join("") + '</div>';
      tierHtml += '<button class="ptr crew ' + (w.crew.got ? "got" : w.crew.ok ? "rdy" : "") + '" style="width:100%;margin-top:8px;flex-direction:row;justify-content:center;gap:8px" ' + (w.crew.ok && !w.crew.got ? 'data-act="passcrew" data-n="' + w.n + '"' : "disabled") + '><b>👥 Crew-Bonus</b><small>Crew-Wochenziel geholt</small><span>' + (w.crew.got ? "✓" : "+" + w.crew.c + " 🪙") + '</span></button>';
      det = '<div class="pdet"><b>Woche ' + w.n + ': ' + esc(w.title) + '</b><p class="small muted" style="margin:2px 0 0">' + esc(w.motto) + '</p><p class="small" style="margin:4px 0 6px">Schaffe an <b>' + w.need + ' Tagen</b> dein Tagesziel: <b class="tnum">' + w.cnt + ' / ' + w.need + '</b>' +
        (w.state === "cur" && w.left != null ? ' · noch ' + w.left + ' ' + plural(w.left, "Tag", "Tage") : w.state === "missed" ? ' · Zeit abgelaufen' : "") + '</p>' +
        dayDots + tierHtml + '<div class="rcards" style="margin-top:10px">' + w.items.map(function (id) { var it = S.itemById(id), x = rcard(id, !w.claimed && w.state !== "ready"); return x; }).join("") +
        (w.slot ? '<div class="rcard extra"><span class="ri em">🏷️</span><b>+1 Sticker-Platz</b></div>' : "") + (w.coins ? '<div class="rcard extra"><span class="ri em">🪙</span><b>+' + w.coins + ' Münzen</b></div>' : "") + (w.boost ? '<div class="rcard extra"><span class="ri em">⚡</span><b>+' + w.boost + ' XP-Booster</b></div>' : "") + '</div>' +
        (w.state === "ready" ? '<button class="btn wide lg" data-act="passclaim" data-n="' + w.n + '" style="margin-top:10px">🎁 Set abholen</button>' : w.claimed ? '<p class="small muted" style="margin:10px 0 0">Schon abgeholt. 🎉</p>' : "") + '</div>';
    }
    var hl = passHighlights(info), icon = passIcon(s);
    var hlHtml = hl.length >= 2 ? '<div class="phl">' + hl.map(function (x) {
      var it = S.itemById(x.id), rr = S.rarityOf(it);
      return '<button class="phc ' + rr + (x.claimed ? " got" : "") + '" data-act="passsel" data-n="' + x.n + '"><span class="phr">' + (RAR_NAME[rr] || "") + '</span>' +
        '<span class="phi' + (x.claimed ? "" : " sil") + '">' + itemIcon(it) + '</span><b>' + (x.claimed ? esc(it.label) : "???") + '</b><small>' + (x.claimed ? "✓ abgeholt" : x.label) + '</small></button>';
    }).join("") + '</div><div class="small muted" style="margin:-2px 0 8px">Die Highlights dieser Saison</div>' : "";
    var nx = info.started && !info.over && info.weeks[info.idx + 1], secret = "";
    if (nx) { var nm = (nx.items.map(S.itemById).filter(function (x) { return x && x.kind === "avatar"; })[0] || S.itemById(nx.items[0])); if (nm) secret = '<div class="psgift ' + S.rarityOf(nm) + '"><span class="phi sil">' + itemIcon(nm) + '</span><div><b>🎁 Geheimes Geschenk</b><small>Woche ' + nx.n + ' · ' + (RAR_NAME[S.rarityOf(nm)] || "") + ' · kommt Montag, ' + nx.days[0].k.split("-").reverse().slice(0, 2).join(".") + '.</small></div></div>'; }
    return '<section class="card passc"><div class="row"><div class="eyebrow" style="flex:1 1 auto">' + icon + ' ' + esc(s.title) + '</div><span class="pill tnum">' + head + '</span></div>' + hlHtml +
      '<div class="ptiles">' + tiles + '</div>' + secret + det + '<div class="psgift" style="border-style:solid;margin-top:12px"><div style="flex:1"><b>🧩 Sammel-Set ' + esc(s.title) + '</b><small>' + info.coll.have + ' von ' + info.coll.total + ' Wochen-Figuren gesammelt' + (info.coll.have === info.coll.total && info.coll.total ? ' · komplett! 🎉' : '') + '</small></div><button class="btn" data-act="passshare">📤 Teilen</button></div></section>';
  }
  /* Siegerbild: Pass-Stand als Bild zum Teilen (ohne Namen, nur Saison, Stempel und Stufen) */
  function sharePass() {
    var info = S.passInfo(), w = info.weeks[Math.min(Math.max(info.idx, 0), info.weeks.length - 1)], c = document.createElement("canvas"); c.width = 900; c.height = 600;
    var g = c.getContext("2d"), gr = g.createLinearGradient(0, 0, 900, 600); gr.addColorStop(0, "#0E1320"); gr.addColorStop(1, "#27407a"); g.fillStyle = gr; g.fillRect(0, 0, 900, 600);
    g.fillStyle = "#f2b33d"; g.font = "bold 60px sans-serif"; g.fillText(passIcon(info.season) + " " + info.season.title, 50, 100);
    g.fillStyle = "#fff"; g.font = "bold 40px sans-serif"; g.fillText("Woche " + w.n + ": " + w.cnt + " von " + w.need + " Tagen geschafft", 50, 180);
    w.days.forEach(function (d, i) { g.beginPath(); g.arc(110 + i * 110, 300, 40, 0, 7); g.fillStyle = d.ok ? "#f2b33d" : d.joker || d.makeup ? "#9a8cff" : "rgba(255,255,255,.18)"; g.fill(); g.fillStyle = "#14213d"; g.font = "bold 36px sans-serif"; g.textAlign = "center"; g.fillText(d.ok ? "✓" : d.joker ? "J" : "", 110 + i * 110, 313); });
    g.textAlign = "left"; g.fillStyle = "#fff"; g.font = "36px sans-serif"; g.fillText(w.tiers.filter(function (t) { return t.ok; }).map(function (t) { return { bronze: "🥉", silber: "🥈", gold: "🥇" }[t.k]; }).join(" ") + "   " + info.coll.have + "/" + info.coll.total + " Figuren gesammelt", 50, 440);
    g.fillStyle = "#b9c9de"; g.font = "30px sans-serif"; g.fillText("Wordy – Vokabeln lernen und sammeln", 50, 540);
    c.toBlob(function (b) {
      var f = new File([b], "wordy-pass.png", { type: "image/png" });
      if (navigator.canShare && navigator.canShare({ files: [f] })) navigator.share({ files: [f], text: "Mein Wordy-Pass" }).catch(function () {});
      else { var a = document.createElement("a"); a.href = URL.createObjectURL(b); a.download = "wordy-pass.png"; a.click(); toast("Bild gespeichert."); }
    });
  }
  function passIcon(s) { return { Zauberwald: "🔮", "Beute-Insel": "🪂", Sternenreise: "🌌" }[s.title] || "❄️"; }
  /* Die 2 bis 3 größten Geschenke einer Saison: höchste Seltenheit, in Reihenfolge der Wochen */
  function passHighlights(info) {
    var rk = { common: 0, rare: 1, epic: 2, legend: 3 }, c = [];
    function main(items) { var its = (items || []).map(S.itemById).filter(Boolean); return (its.filter(function (x) { return x.kind === "avatar"; })[0] || its[0] || {}).id; }
    info.weeks.forEach(function (w) { var id = main(w.items); if (id) c.push({ id: id, n: w.n, claimed: w.claimed, label: "Woche " + w.n }); });
    var f = info.season.finale; if (f && main(f.items)) c.push({ id: main(f.items), n: "fin", claimed: info.fin.claimed, label: "Finale" });
    c.forEach(function (x, i) { x.o = i; x.r = rk[S.rarityOf(S.itemById(x.id))] || 0; });
    return c.slice().sort(function (a, b) { return (b.r - a.r) || (a.o - b.o); }).slice(0, 3).sort(function (a, b) { return a.o - b.o; });
  }
  /* ---------- Showroom (Trophäenschrank) ---------- */
  var DANCE_NUM = { wackler: 1, huepfer: 2, drehung: 3, roboter: 4, moonwalk: 5, sieg: 6, eislauf: 7 };
  var RAR_NAME = { common: "Gewöhnlich", rare: "Selten", epic: "Episch", legend: "Legendär" };
  var RAR_GLOW = { common: "rgba(150,200,130,.7)", rare: "rgba(70,160,255,.8)", epic: "rgba(190,110,255,.85)", legend: "rgba(255,200,70,.95)" };
  var MED_COL = { common: ["#9bd48a", "#4f9a46"], rare: ["#7fd0ff", "#2f8cff"], epic: ["#d79bff", "#a855f7"], legend: ["#ffe58a", "#ffb61e"] };
  var SHIRTS = { skater: ["#ff8a3d", "#ff8a3d", ""], cowboy: ["#9a6a35", "#9a6a35", "★"], ninja: ["#3a3a5c", "#3a3a5c", ""], chef: ["#ffffff", "#ffffff", ""], pirat: ["#c0392b", "#c0392b", "☠"], ritter: ["#cfd6e4", "#cfd6e4", "⚔"], dj: ["#ffd34d", "#ffd34d", "♫"], zauberer: ["#7a4fff", "#7a4fff", "★"], koenig: ["#d12036", "#d12036", "♛"], natur: ["#b9c9de", "#b9c9de", ""], shirt: ["#35c6ff", "#35c6ff", ""], hoodie: ["#7a63f0", "#7a63f0", ""], trikot: [["#e53935", "#fff"], "#e53935", "7"], held: ["#2b6fe0", "#c62828", "★"], raum: ["#dfe6ee", "#dfe6ee", "★"], rock: ["#ffd23d", "#ffd23d", "♪"], polar: ["#3f9bff", "#3f9bff", "❄"],
    "k-muenchen": ["#d4151f", "#d4151f", "7"], "k-barcelona": [["#a50044", "#004d98"], "#004d98", "7"], "k-turin": [["#111", "#fff"], "#111", "7"], "k-deutschland": ["#f1f1f4", "#fff", "7"], "k-argentinien": [["#74acdf", "#fff"], "#74acdf", "7"], "k-portugal": ["#c1121f", "#c1121f", "7"] };
  function svgCup(c1, c2) { return '<svg viewBox="0 0 64 64"><path d="M16 8h32v14q0 14-16 18q-16-4-16-18z" fill="' + c1 + '" stroke="#14213d" stroke-width="4" stroke-linejoin="round"/><path d="M16 14H6q0 14 12 16M48 14h10q0 14-12 16" fill="none" stroke="#14213d" stroke-width="4"/><rect x="28" y="40" width="8" height="8" fill="' + c2 + '" stroke="#14213d" stroke-width="3"/><rect x="18" y="48" width="28" height="10" rx="3" fill="' + c2 + '" stroke="#14213d" stroke-width="4"/><path d="M22 14q0 10 6 14" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".6" fill="none"/><path d="M32 18l3 6l6 1l-4.5 4l1 6l-5.5-3l-5.5 3l1-6l-4.5-4l6-1z" fill="#fff" opacity=".85"/></svg>'; }
  function svgMedal(c, n) { return '<svg viewBox="0 0 64 64"><path d="M20 4l8 22h8l8-22z" fill="#2f8cff" stroke="#14213d" stroke-width="3" stroke-linejoin="round"/><circle cx="32" cy="40" r="19" fill="' + c + '" stroke="#14213d" stroke-width="4"/><circle cx="32" cy="40" r="13" fill="none" stroke="#fff" stroke-width="2" opacity=".6"/><text x="32" y="' + (String(n).length > 2 ? 44 : 46) + '" text-anchor="middle" font-size="' + (String(n).length > 2 ? 13 : 18) + '" font-weight="900" fill="#14213d" font-family="Trebuchet MS,sans-serif">' + esc(n) + '</text></svg>'; }
  var jid = 0;
  function svgShirt(spec) {
    var id = "sj" + (jid++), tb = spec[0], f = "", x;
    if (Array.isArray(tb)) for (x = 0; x < 64; x += 8) f += '<rect x="' + x + '" width="4" height="64" fill="' + tb[0] + '"/><rect x="' + (x + 4) + '" width="4" height="64" fill="' + tb[1] + '"/>'; else f = '<rect width="64" height="64" fill="' + tb + '"/>';
    return '<svg viewBox="0 0 64 64"><clipPath id="' + id + '"><path d="M20 8l-14 8l6 12l6-4v30h28V24l6 4l6-12l-14-8q-4 6-12 6t-12-6z"/></clipPath><g clip-path="url(#' + id + ')">' + f + '<path d="M0 0h20v34H0zM44 0h20v34H44z" fill="' + spec[1] + '"/></g><path d="M20 8l-14 8l6 12l6-4v30h28V24l6 4l6-12l-14-8q-4 6-12 6t-12-6z" fill="none" stroke="#14213d" stroke-width="3.5" stroke-linejoin="round"/>' +
      (spec[2] ? '<text x="32" y="44" text-anchor="middle" font-size="22" font-weight="900" fill="#fff" stroke="#14213d" stroke-width="1.2" font-family="Trebuchet MS,sans-serif">' + esc(spec[2]) + '</text>' : "") + '</svg>';
  }
  /* Symbol für ein Sammelstück: c = {kind, val, rar, it} */
  function srIcon(c) {
    var col = MED_COL[c.rar] || MED_COL.common;
    if (c.kind === "medal") return c.val === "cup" ? svgCup(col[0], col[1]) : svgMedal(col[0], c.val);
    if (c.kind === "avatar") return avatarHtml(c.val);
    if (c.kind === "sticker") return '<span class="srst">' + stickerHtml(c.it, 46) + '</span>';
    if (c.kind === "dance") return '<div class="srdisc" style="--c:' + col[1] + '"><i>♪</i></div>';
    if (c.kind === "outfit" || c.kind === "kit") return svgShirt(SHIRTS[c.val] || SHIRTS.natur);
    if (c.kind === "frame") return '<span class="avatar fr-' + esc(c.val) + '" style="width:44px;height:44px;font-size:22px">' + avatarHtml(S.state.profile.avatar) + '</span>';
    return '<span class="srem">' + (c.it ? shopIcon(c.it) : "🎁") + '</span>';
  }
  function medalStyle(id) {
    var m = /^md:(\w+?)(?:p(\d)|cup)?$/.exec(id) || [], k = id.slice(3), T = { boss1: ["common", "⚔"], boss5: ["rare", "⚔"], boss10: ["epic", "⚔"], serie7: ["rare", "7"], serie30: ["epic", "30"], serie100: ["legend", "100"], crew1: ["common", "★"], crewgold: ["epic", "★"], duel1: ["common", "⚔"], duel5: ["rare", "5"], duel20: ["epic", "20"], chal7: ["rare", "7"], chal30: ["legend", "30"], w25: ["rare", "25"], w100: ["epic", "100"] };
    if (T[k]) return { rar: T[k][0], val: T[k][1] };
    var pm = /p(\d)$/.exec(k); if (pm) return { rar: +pm[1] >= S.passInfo().weeks.length ? "legend" : "epic", val: pm[1] };
    return { rar: "legend", val: "cup" };
  }
  function favIcon(id) {
    if (id.indexOf("md:") === 0) { var ms = medalStyle(id); return srIcon({ kind: "medal", val: ms.val, rar: ms.rar }); }
    var it = S.itemById(id); return it ? srIcon({ kind: it.kind, val: it.val, rar: S.rarityOf(it), it: it }) : "";
  }
  var srAv = null, srDn = null, hhT = null;
  function heroHtml(av, dn) {
    var o = S.state.profile.outfit;
    if (global.VTA && global.VTA.has(av)) return global.VTA.dancer(av, o, dn || 0).replace('class="afig a0"', 'class="afig"');
    return '<div class="srleg">' + global.VTFIG.figure(av, o, avatarHtml(av)).replace('class="fig ', 'class="fig ' + (dn ? "d" + dn + " " : "")) + '</div>';
  }
  function srMark(id) { var p = S.state.profile; if (!p.seen) p.seen = {}; if (!p.seen[id]) { p.seen[id] = 1; S.save(); } }
  function viewShowroom() {
    var c = S.collection(true), pf = S.state.profile, seen = pf.seen;
    if (!pf.seen) { seen = pf.seen = {}; c.shelves.forEach(function (s) { s.items.forEach(function (i) { if (i.owned) seen[i.id] = 1; }); }); S.save(); }
    var favHtml = [0, 1, 2].map(function (i) { var id = S.favs()[i]; return id ? '<button class="fslot" data-act="sritem" data-id="' + esc(id) + '">' + favIcon(id) + '</button>' : '<button class="fslot e" data-act="srfavhint">＋</button>'; }).join("");
    if (!srAv) srAv = pf.avatar;
    var h = '<div class="stack srv"><div><h1 style="font-size:22px">🏆 Mein Showroom</h1><p class="small muted" style="margin:2px 0 0">Alles, was du gesammelt, gekauft und erspielt hast. Tippe auf ein Stück.</p></div>' +
      '<section class="srtop"><div class="srring" style="--p:' + c.pct + '"><b>' + c.pct + '%</b></div><div class="srcups">' + c.cups.map(function (t) { var col = { Bronze: ["#e0975a", "#8a4a1e"], Silber: ["#eef2fa", "#8794ad"], Gold: ["#ffd24a", "#c8780a"], Platin: ["#c9efff", "#7a8fff"] }[t.n]; return '<div class="srcup' + (t.done ? "" : " lock") + '">' + svgCup(col[0], col[1]) + '<b>' + t.n + '</b><small>ab ' + t.pct + '%</small></div>'; }).join("") + '</div></section>' +
      '<div class="srrar">' + ["common", "rare", "epic", "legend"].map(function (r) { return '<span class="' + r + '"><b>' + c.rar[r] + '</b>' + RAR_NAME[r] + '</span>'; }).join("") + '</div>' +
      '<section class="srstage"><div class="srray"></div><div class="srfloor"></div><div class="srfav">' + favHtml + '</div><div class="srlbl">Favoriten</div><div class="srpod"><i></i></div><div class="srhero" id="srHero"></div>' +
      '<div class="srname" id="srName"></div><div class="srbtns"><button class="sbtn" data-act="srdance">💃 Tanzen</button><button class="sbtn b2" data-act="srswap">🔄 Wechseln</button></div></section>' +
      '<button class="sbtn b5 srwear" id="srWear" data-act="srwear" hidden>✅ Als Avatar übernehmen</button>' +
      '<section class="srcab">' + c.shelves.map(function (s) {
        return '<div class="srshelf"><div class="srhead"><span>' + s.icon + ' ' + esc(s.title) + '</span><span class="c' + (s.own === s.items.length ? " full" : "") + '">' + s.own + ' / ' + s.items.length + '</span></div><div class="sritems">' + s.items.map(function (i) {
          var isNew = i.owned && !seen[i.id];
          return '<button class="srs ' + i.rar + (i.owned ? "" : " lock") + (isNew ? " isnew" : "") + '" data-act="sritem" data-id="' + esc(i.id) + '" style="--g:' + RAR_GLOW[i.rar] + '"><div class="ped"><span class="rb"></span><div class="it">' + srIcon(i) + '</div></div><b>' + esc(i.label) + '</b></button>';
        }).join("") + '</div></div>';
      }).join("") + '</section></div>';
    view.innerHTML = h; srHero(false);
    flushNews();
  }
  function srHero(dance) {
    var e = $("#srHero"); if (!e) return;
    var pf = S.state.profile, dn = dance ? srDn : 0;
    e.innerHTML = heroHtml(srAv, dn);
    var it = S.SHOP.filter(function (x) { return x.kind === "avatar" && x.val === srAv; })[0], same = srAv === pf.avatar;
    var nm = $("#srName"); if (nm) nm.innerHTML = '<b>' + esc(it ? it.label : "Fuchs") + '</b>' + (same ? ' · aktiv ✓' : "");
    var wb = $("#srWear"); if (wb) wb.hidden = same;
  }
  function srModal(id) {
    var it = S.findCollItem(id), fav = S.favs().indexOf(id) >= 0;
    if (!it) return;
    var ms = id.indexOf("md:") === 0 ? medalStyle(id) : null, rar = ms ? ms.rar : it.rar, col = MED_COL[rar] || MED_COL.common, val = ms ? ms.val : it.val;
    var c = { kind: it.kind, val: val, rar: rar, it: it.it }, canEq = it.owned && it.kind !== "medal", eq = it.it && S.isActive(it.it);
    var ov = document.createElement("div"); ov.className = "srmd";
    ov.innerHTML = '<div class="srmc" style="--c:' + col[1] + ';--g:' + RAR_GLOW[rar] + '"><div class="eyebrow" style="color:#fff;opacity:.85">' + RAR_NAME[rar] + '</div><div class="big' + (it.owned ? "" : " lock") + '">' + srIcon(c) + '</div><h3>' + esc(it.label) + '</h3><p>' + (it.owned ? "Gehört dir! " : "Noch nicht gesammelt. ") + esc(it.how || "") + '</p><div class="row wrap" style="gap:8px;justify-content:center">' +
      (it.owned ? '<button class="sbtn" data-m="fav">' + (fav ? "★ Favorit" : "☆ Als Favorit") + '</button>' : "") +
      (canEq ? '<button class="sbtn b2" data-m="eq">' + (it.kind === "sticker" ? (eq ? "Ablösen" : "Aufkleben") : eq ? "✓ Aktiv" : "Tragen") + '</button>' : "") +
      (it.owned && (it.kind === "dance" || it.kind === "outfit" || it.kind === "kit") ? '<button class="sbtn b3" data-m="try">▶ Ansehen</button>' : "") +
      (!it.owned && it.it && !it.it.pass && !it.it.reward ? '<button class="sbtn b2" data-m="shop">Zum Shop</button>' : "") +
      (!it.owned && it.it && it.it.pass ? '<button class="sbtn b2" data-m="pass">Zum Pass</button>' : "") + '<button class="sbtn b4" data-m="x">Schließen</button></div></div>';
    document.body.appendChild(ov);
    if (it.owned) srMark(id);
    ov.addEventListener("click", function (e) {
      var m = e.target.closest("[data-m]"), mm = m && m.getAttribute("data-m");
      if (e.target === ov || mm === "x") { ov.remove(); render(); return; }
      if (mm === "fav") { var on = S.toggleFav(id); toast(on ? "Zu deinen Favoriten gelegt ⭐" : "Aus den Favoriten genommen"); ov.remove(); render(); }
      else if (mm === "eq") { var r = S.equip(it.it.id); if (r.error) return toast(r.error); ov.remove(); toast(it.kind === "sticker" ? (r.on ? "Aufgeklebt" : "Abgelöst") : "Getragen: " + it.label); render(); }
      else if (mm === "try") { global.VTC.dance({ av: S.state.profile.avatar, avatar: avatarHtml(S.state.profile.avatar), outfit: it.kind === "dance" ? S.state.profile.outfit : it.it.val, dance: it.kind === "dance" ? it.it.val : (S.state.profile.dance || "wackler"), title: it.label }); }
      else if (mm === "shop") { ov.remove(); shopTab = it.kind === "kit" ? "kit" : it.it.set === "fn" ? "fn" : it.kind; tab = "shop"; shopSeg = "shop"; render(); view.scrollTop = 0; }
      else if (mm === "pass") { ov.remove(); tab = "beute"; beuteSeg = "pass"; render(); view.scrollTop = 0; }
    });
  }

  /* Set komplett: Eisblock-Szene (Figur im Eis, Risse, Splittern), dann die Belohnung */
  function openSetReveal(sets) {
    var sd = sets[0], def = S.SETS.filter(function (x) { return x.name === sd.set; })[0], rw = def && S.itemById(def.reward);
    var ov = document.createElement("div"); ov.className = "chestov";
    var card = rw ? '<div class="rcard big" id="rc0" style="--c1:#7fd0ff;--c2:#2f8cff">' + itemIcon(rw, true) + '<b>' + esc(rw.label) + '</b></div>' : '<div class="rcard big" id="rc0" style="--c1:#7fd0ff;--c2:#2f8cff"><span class="ri em">🎁</span><b>' + esc(sd.reward) + '</b></div>';
    ov.innerHTML = '<div class="eyebrow" style="color:#bfe9ff;position:relative;z-index:2">❄️ Alle Teile gesammelt</div><h2 style="position:relative;z-index:2;font-size:26px;margin:0">' + esc(sd.set) + ' komplett!</h2>' +
      '<div id="lootStage" style="position:relative;z-index:2;width:min(86vw,300px);height:250px;border-radius:14px;overflow:visible;cursor:pointer"></div>' +
      '<div class="rcards bigrow" style="position:relative;z-index:2">' + card + '</div>' +
      '<button class="btn lg" id="cOk" style="position:relative;z-index:2;opacity:0;pointer-events:none;background:var(--gold,#f2b33d);color:#2b1d00;margin-top:8px">Weiter ▶</button>';
    document.body.appendChild(ov);
    global.VTL.mount(document.getElementById("lootStage"), "ice", function () {
      try { if (S.state.settings.audio) global.VTC.sound(S.state.profile.snd, true); } catch (e) {}
      var e0 = ov.querySelector("#rc0");
      setTimeout(function () { e0.classList.add("show"); try { global.VTC.burst("stars", e0.getBoundingClientRect().left + 40, e0.getBoundingClientRect().top + 20, 14, 1); } catch (x) {} }, 300);
      setTimeout(function () { var b = $("#cOk"); if (b) { b.style.transition = "opacity .4s"; b.style.opacity = 1; b.style.pointerEvents = "auto"; } }, 1100);
    }, def && def.fig);
    $("#cOk").addEventListener("click", function () { ov.remove(); renderHeader(); if (sets.length > 1) openSetReveal(sets.slice(1)); else render(); });
  }
  function openPassReward(n) {
    var r = n === "fin" ? S.claimPassFinale() : S.claimPassWeek(+n);
    if (r.error) return toast(r.error);
    var pf = S.state.profile, ov = document.createElement("div"); ov.className = "chestov";
    var type = n === "fin" ? "vault" : "ice", title = n === "fin" ? (S.passInfo().season.finale.title || "Finale") : "Woche " + n + " geschafft";
    var cards = r.items.map(function (x, i) { var c = RAR_COL[x.rar] || RAR_COL.rare; return '<div class="rcard big" id="rc' + i + '" style="--c1:' + c[0] + ';--c2:' + c[1] + '">' + itemIcon(x, true) + '<b>' + esc(x.label) + '</b></div>'; }).join("") +
      (r.slot ? '<div class="rcard big extra" id="rcs"><span class="ri em">🏷️</span><b>+1 Sticker-Platz</b></div>' : "") + (r.coins ? '<div class="rcard big extra" id="rcc"><span class="ri em">🪙</span><b>+' + r.coins + ' Münzen</b></div>' : "") + (r.boost ? '<div class="rcard big extra"><span class="ri em">⚡</span><b>+' + r.boost + ' XP-Booster</b></div>' : "");
    ov.innerHTML = '<div class="eyebrow" style="color:#d8cfff;position:relative;z-index:2">❄️ ' + esc(S.passInfo().season.title) + '</div><h2 style="position:relative;z-index:2;font-size:26px;margin:0">' + esc(title) + '</h2>' +
      '<div id="lootStage" style="position:relative;z-index:2;width:min(86vw,300px);height:250px;border-radius:14px;overflow:visible;cursor:pointer"></div>' +
      '<div class="rcards bigrow" style="position:relative;z-index:2">' + cards + '</div>' +
      '<button class="btn lg" id="cOk" style="position:relative;z-index:2;opacity:0;pointer-events:none;background:var(--gold,#f2b33d);color:#2b1d00;margin-top:8px">Weiter ▶</button>';
    document.body.appendChild(ov);
    global.VTL.mount(document.getElementById("lootStage"), type, function () {
      try { if (S.state.settings.audio) global.VTC.sound(pf.snd, true); } catch (e) {}
      var els = ov.querySelectorAll(".rcard.big"), k = 0;
      Array.prototype.forEach.call(els, function (e, i) { setTimeout(function () { e.classList.add("show"); try { global.VTC.burst("stars", e.getBoundingClientRect().left + 40, e.getBoundingClientRect().top + 20, 8, .8); } catch (x) {} }, 300 + i * 450); k = i; });
      setTimeout(function () { var b = $("#cOk"); if (b) { b.style.transition = "opacity .4s"; b.style.opacity = 1; b.style.pointerEvents = "auto"; } }, 600 + els.length * 450);
    });
    $("#cOk").addEventListener("click", function () { ov.remove(); renderHeader(); passSel = null; render(); });
  }

  /* ---------- Lernpfad ---------- */
  var pathShown = null, pathScroll = null;   // zuletzt gezeigte Position (Figur läuft weiter) und Scrollstand der Pfadkarte
  function pathPoint(i, n, H) { return { x: i === n ? 50 : (i % 2 ? 74 : 26), y: H - 74 - i * 84 }; }
  /* Ein Abschnitt als Karte; Stationen sind antippbar: erledigte (auch Boss) lassen sich wiederholen, gesperrte wackeln */
  function pathSectionHtml(sec, secNo, secCount, p, curStation) {
    var n = sec.length, H = (n + 1) * 84 + 50, pts = [], i, first = sec[0], isCur = curStation && curStation.section === first.section;
    for (i = 0; i <= n; i++) pts.push(pathPoint(i, n, H));
    var curIdx = isCur ? Math.max(0, Math.min(n, curStation.index - first.index)) : (sec.every(function (s) { return p.stars[s.id]; }) ? n : -1);
    var d = "M" + pts[0].x + " " + pts[0].y, dDone = d;
    for (i = 1; i <= n; i++) {
      var ym = (pts[i - 1].y + pts[i].y) / 2, seg = " C" + pts[i - 1].x + " " + ym + "," + pts[i].x + " " + ym + "," + pts[i].x + " " + pts[i].y;
      d += seg; if (i <= curIdx) dDone += seg;
    }
    var done = sec.filter(function (s) { return p.stars[s.id]; }).length, pend = p.pending.some(function (c) { return c.section === first.section; });
    var boss = sec[n - 1], h = '<div class="psec' + (isCur ? " cur" : "") + '" data-sec="' + esc(first.section) + '"><div class="psechead"><div><div class="eyebrow">Abschnitt ' + secNo + ' von ' + secCount + '</div><b>' + esc(first.sectionTitle) + '</b></div>' +
      '<span class="pill tnum">' + done + ' / ' + n + (p.chests[first.section] ? " · 💰" : "") + '</span></div>' +
      '<button class="chip" data-act="mitlesen" data-sec="' + esc(first.section) + '" style="margin:0 0 8px">🗣️ Mitlesen (optional)</button>' +
      '<div class="pmap" style="height:' + H + 'px"><svg viewBox="0 0 100 ' + H + '" preserveAspectRatio="none" aria-hidden="true">' +
      '<path d="' + d + '" fill="none" stroke="#fff" stroke-opacity=".85" stroke-width="16" stroke-linecap="round" vector-effect="non-scaling-stroke"/>' +
      '<path d="' + dDone + '" fill="none" stroke="#2e7d4f" stroke-width="6" stroke-linecap="round" stroke-dasharray="1 12" vector-effect="non-scaling-stroke"/></svg>';
    sec.forEach(function (s, k) {
      var pt = pts[k], state = s.index < p.pos ? "done" : s.index === p.pos ? "cur" : "lock", stars = p.stars[s.id] || 0;
      var tip = (s.last ? "Boss-Runde: " + BOSS_NAMES[s.bossMode] + " (Ziel " + s.bossNeed + " richtig)" : s.gram ? "Grammatik: " + s.gtitle : "Station " + s.n + " von " + s.of + (s.verbIds ? " (mit unregelmäßigen Verben)" : "")) + " · " + s.sectionTitle +
        (state === "done" ? " · " + "★".repeat(stars) + "☆".repeat(3 - stars) + " · antippen zum Wiederholen" : state === "cur" ? " · jetzt dran" : " · noch gesperrt");
      h += '<button class="pnode ' + state + (s.last ? " boss" : "") + '" style="left:' + pt.x + '%;top:' + pt.y + 'px" data-tip="' + esc(tip) + '" title="' + esc(tip) + '" data-act="' + (state === "lock" ? "pathlocked" : state === "cur" ? "pathgo" : "pathreplay") + '" data-id="' + esc(s.id) + '" aria-label="' + esc(tip) + '">' +
        (state === "done" ? "✓" : state === "cur" ? (s.last ? "⚔️" : s.gram ? "✏️" : "▶") : s.last ? "⚔️" : "🔒") + '</button>';
      if (state === "done") h += '<span class="pstars" style="left:' + pt.x + '%;top:' + pt.y + 'px">' + "★".repeat(stars) + "☆".repeat(3 - stars) + '</span>';
    });
    var cp = pts[n], ctip = pend ? "Truhe wartet: antippen zum Öffnen" : p.chests[first.section] ? "Schon geplündert – die nächste Truhe wartet nach dem nächsten Boss" : "Truhe nach der Boss-Runde";
    h += '<button class="pchest' + (pend ? " ready" : p.chests[first.section] ? " got" : "") + '" style="left:' + cp.x + '%;top:' + cp.y + 'px" data-tip="' + esc(ctip) + '" title="' + esc(ctip) + '" data-act="' + (pend ? "openchest" : "pathlocked") + '" aria-label="' + esc(ctip) + '">' + global.VTL.icon(global.VTL.typeFor(secNo - 1), p.chests[first.section] && !pend ? "looted" : "closed") + '</button>';
    if (isCur && p.pos < S.pathStations().length) {
      var cpt = pts[curIdx], side = cpt.x < 50 ? 1 : -1;
      h += '<div class="pme" id="pme" style="left:calc(' + cpt.x + '% + ' + (side * 62) + 'px);top:' + (cpt.y - 4) + 'px">' + avatarHtml(S.state.profile.avatar) + '</div>' +
        '<div class="pbubble" style="left:calc(' + cpt.x + '% + ' + (side * 62) + 'px);top:' + (cpt.y - 46) + 'px;transform:translateX(-50%)">Los geht’s!</div>';
    }
    return { html: h + '</div></div>', pts: pts, curIdx: curIdx, H: H };
  }
  function pathCard() {
    var st = S.state; if (st.settings.pathOn === false) return "";
    var p = S.pathSync(), all = S.pathStations(); if (!all.length) return "";
    var boost = p.boost, secIds = [], bySec = {};
    all.forEach(function (s) { if (!bySec[s.section]) { bySec[s.section] = []; secIds.push(s.section); } bySec[s.section].push(s); });
    var bar = boost.on && boost.left > 0 ? '<div class="row small" style="margin-top:10px;gap:8px"><span>⚡</span><b>Booster läuft: doppelte XP</b><span class="muted tnum">' + Math.floor(boost.left / 60) + ':' + ("0" + (boost.left % 60)).slice(-2) + '</span></div>'
      : boost.stock > 0 ? '<div class="row" style="margin-top:10px;gap:8px"><span style="font-size:20px">⚡</span><span class="small" style="flex:1 1 auto"><b>' + boost.stock + ' XP-Booster</b> bereit<br><span class="muted">15 Minuten Üben mit doppelten XP</span></span><button class="chip" data-act="boostgo">Starten</button></div>' : "";
    if (p.pos >= all.length && !p.pending.length && false) return "";
    var cur = all[Math.min(p.pos, all.length - 1)], finished = p.pos >= all.length, curNo = secIds.indexOf(cur.section) + 1;
    var h = '<section class="card path"><div class="eyebrow">Dein Lernpfad · Abschnitt ' + curNo + ' von ' + secIds.length + '</div>' +
      '<h2 style="margin:4px 0 2px">' + (finished ? "🏆 Alle Abschnitte geschafft!" : esc(cur.sectionTitle)) + '</h2>' +
      '<div class="small muted">' + (finished ? "Du kannst jede Station und jeden Boss noch einmal spielen." : "Station " + cur.n + " von " + cur.of + (cur.last ? " · Boss-Runde: " + BOSS_NAMES[cur.bossMode] : cur.gram ? " · Grammatik: " + esc(cur.gtitle) : "")) + '</div>';
    // alle Abschnitte, der erste unten, der aktuelle wird in den Blick gescrollt
    var blocks = "", coords = null;
    for (var k = secIds.length - 1; k >= 0; k--) {
      var r = pathSectionHtml(bySec[secIds[k]], k + 1, secIds.length, p, finished ? null : cur);
      if (!finished && secIds[k] === cur.section) coords = r;
      blocks += r.html;
    }
    h += '<div class="pscroll" id="pscroll" tabindex="0" aria-label="Lernpfad, scrollbar">' + blocks + '</div>';
    if (p.pending.length) h += '<button class="btn wide lg" data-act="openchest" style="background:var(--gold,#f2b33d);color:#2b1d00;margin-bottom:8px">💰 Truhe öffnen' + (p.pending.length > 1 ? ' (' + p.pending.length + ')' : '') + '</button>';
    if (!finished) h += '<button class="btn wide lg" data-act="pathgo" data-id="' + esc(cur.id) + '">' + (cur.last ? "Boss-Runde starten ⚔️" : cur.gram ? "Grammatik-Station starten ✏️" : "Los geht’s – Station " + cur.n + " ▶") + '</button>' +
      '<div class="row" style="justify-content:center;margin-top:8px"><button class="chip" data-act="pathfocus">↧ zur aktuellen Station</button></div>';
    h += bar + '</section>';
    if (pathShown && pathShown.pos !== p.pos) pathScroll = null;   // nach einem Fortschritt wieder zur aktuellen Station
    var moved = pathShown && pathShown.section === cur.section && pathShown.pos < p.pos && coords && pathShown.k < coords.pts.length;
    var prevPt = moved ? coords.pts[pathShown.k] : null, curPt = coords ? coords.pts[coords.curIdx] : null, side = curPt && curPt.x < 50 ? 1 : -1;
    // nach dem Einfügen ins DOM: Scrollstand wiederherstellen oder die aktuelle Station in die Mitte holen
    setTimeout(function () {
      var sc = $("#pscroll"); if (!sc) return;
      var secEl = sc.querySelector(".psec.cur"), want = secEl ? Math.max(0, secEl.offsetTop + (curPt ? curPt.y : 0) - sc.clientHeight / 2) : sc.scrollHeight;
      sc.scrollTop = pathScroll != null ? pathScroll : want;
      sc.addEventListener("scroll", function () { pathScroll = sc.scrollTop; });
      if (moved && prevPt && curPt) {
        var el = $("#pme"); if (!el) return;
        el.style.transition = "none"; el.style.left = "calc(" + prevPt.x + "% + " + (side * 62) + "px)"; el.style.top = (prevPt.y - 4) + "px";
        void el.offsetWidth; el.style.transition = ""; el.style.left = "calc(" + curPt.x + "% + " + (side * 62) + "px)"; el.style.top = (curPt.y - 4) + "px";
      }
    }, 30);
    pathShown = { section: cur.section, pos: p.pos, k: coords ? coords.curIdx : 0, jump: false };
    return h;
  }
  /* Siegertanz der gewählten Figur: bei Boss immer der epische (wenn gekauft), sonst der gewählte */
  function danceWin(big, title) {
    var p = S.state.profile, sieg = S.SHOP.filter(function (x) { return x.id === "dn:sieg"; })[0];
    global.VTC.dance({ av: p.avatar, avatar: avatarHtml(p.avatar), outfit: p.outfit, dance: big && sieg && S.owns(sieg) ? "sieg" : (p.dance || "wackler"), title: title, big: big });
  }
  /* Truhen im Lernpfad: zu (wartet oder noch gesperrt) und geplündert (aufgebrochen) */
  function dustPuff(el) {
    for (var k = 0; k < 6; k++) {
      var i = document.createElement("i"); i.style.cssText = "position:absolute;width:10px;height:10px;border-radius:50%;background:#cbbd9c;pointer-events:none;left:" + (28 + Math.random() * 40) + "%;top:36%";
      el.appendChild(i);
      i.animate([{ opacity: .8, transform: "translate(0,0) scale(.6)" }, { opacity: 0, transform: "translate(" + ((Math.random() - .5) * 46) + "px,-34px) scale(1.8)" }], { duration: 800, easing: "ease-out" }).onfinish = (function (n) { return function () { n.remove(); }; })(i);
    }
  }
  var BOSS_NAMES = { match: "Match-Rausch", blitz: "Blitzrunde", survival: "Letztes Herz" };
  /* Boss-Runde: ein Arena-Modus mit den Wörtern des ganzen Abschnitts; geschafft ab einer Mindestzahl richtiger Antworten */
  function startBoss(st) {
    var ws = st.reviewWords.map(function (id) { return S.byId(id); }).filter(Boolean);
    if (ws.length < 8 || !global.ARENA) return false;
    var bn = S.bossNeedFor(st);
    global.ARENA.start(st.bossMode, { words: ws, boss: { id: st.id, title: st.sectionTitle, mode: st.bossMode, need: bn.need, base: bn.base, help: bn.help } });
    if (bn.help) toast("Boss etwas leichter gemacht: Ziel " + bn.need + " statt " + bn.base + " 💪");
    return true;
  }
  function bossFinish(boss, correct) {
    var pass = correct >= boss.need;
    S.bossRecord(boss, correct, pass);
    var stars = correct >= boss.need * 2 ? 3 : correct >= boss.need * 1.5 ? 2 : 1, res = pass ? S.pathComplete(boss.id, stars) : null;
    return { pass: pass, stars: stars, chest: res && res.chest, advanced: res && res.advanced, finished: res && res.finished };
  }
  var STEP_NAMES = ["Kennenlernen", "Tippen", "Hören & finden", "Zuordnen", "Unregelmäßige Verben"];
  function pathTasks(st) {
    var ids = st.last ? st.reviewWords.slice() : st.words, ws = ids.map(function (id) { return S.byId(id); }).filter(Boolean);
    if (st.last && ws.length > 12) ws = ws.sort(function (a, b) { return S.levelOf(a.id) - S.levelOf(b.id); }).slice(0, 12);
    ws = S.shuffle(ws);
    var t = [], pick = function (a, n) { return S.shuffle(a.slice()).slice(0, n); }, long = function (w) { return w.en.replace(/^to\s+/, "").length > 24; };
    ws.forEach(function (w, k) {   // 1 Kennenlernen
      if (S.levelOf(w.id) === 0 && !(S.state.w[w.id] && S.state.w[w.id].no)) { t.push({ type: "intro", w: w, step: 1 }); t.push({ type: "mc_en_de", w: w, isNew: true, step: 1 }); }
      else t.push({ type: k % 2 ? "mc_de_en" : "mc_en_de", w: w, step: 1 });
    });
    pick(ws, st.last ? 6 : ws.length).forEach(function (w) {   // 2 Tippen
      var plain = w.en.replace(/^to\s+/, ""), ty = long(w) ? "mc_de_en" : plain.length <= 16 && Math.random() < 0.35 ? "spell" : "type";
      t.push({ type: ty, w: w, step: 2 });
    });
    pick(ws, st.last ? 6 : Math.min(ws.length, 6)).forEach(function (w) {   // 3 Hören und finden
      t.push({ type: audioAvailable() ? "listen" : w.gap ? "gap" : "mc_de_en", w: w, step: 3 });
    });
    pick(ws, st.last ? 3 : 2).forEach(function (w) { t.push({ type: "match", w: w, step: 4 }); });   // 4 Zuordnen
    if (st.verbIds) {   // 5 Unregelmäßige Verben (einmal pro Abschnitt)
      var vs = st.verbIds.map(function (id) { return S.verbs().filter(function (v) { return v.id === id; })[0]; }).filter(Boolean);
      verbTasks(vs).forEach(function (vt) { vt.step = 5; t.push(vt); });
    }
    return t;
  }

  /* ---------- Start: eine Empfehlung, ein Knopf ---------- */
  function recommend() {
    var st = S.state, p = S.pools(), W = window.WordySync, mins = startMin || S.goalMin();
    var plans = (W && W.connected()) ? W.activePlans().filter(function (pl) { var d = W.planInfo(pl).days; return d >= 0 && d <= 14; }) : [];
    if (plans.length) {
      plans.sort(function (a, b) { return a.exam < b.exam ? -1 : 1; });
      var pl = plans[0], pi = W.planInfo(pl), newToday = (st.daily && st.daily.newSeen) || 0, left = Math.max(0, pi.quota - newToday);
      return { plan: true, icon: "📅", title: esc(pl.title),
        sub: "Arbeit " + (pi.days > 1 ? "in " + pi.days + " Tagen" : pi.days === 1 ? "morgen" : "heute") + " · " + pi.pct + " % sicher" + (left ? " · heute " + left + " neue " + plural(left, "Wort", "Wörter") : ""),
        opts: { minutes: mins, scope: pl.units, newMax: Math.max(pi.quota, newToday), mode: "plan" } };
    }
    if (p.box.length >= 8) return { icon: "♻️", title: "Fehlerkartei", sub: p.box.length + " Wörter warten darauf, endlich zu sitzen.", opts: { minutes: mins, mode: "box" } };
    if (p.due.length) return { icon: "🏆", title: "Daily Challenge", sub: p.due.length + " " + plural(p.due.length, "Wort ist", "Wörter sind") + " fällig.", opts: { minutes: mins, mode: "mix" } };
    if (p.fresh.length) return { icon: "✨", title: "Neue Wörter", sub: "Nichts ist fällig. Zeit für etwas Neues.", opts: { minutes: mins, mode: "new" } };
    return { icon: "🏆", title: "Daily Challenge", sub: "Eine bunte Runde aus allem.", opts: { minutes: mins, mode: "mix" } };
  }
  /* Persönlicher Tagesplan („Dein 10-Minuten-Plan“): kommt aus der Analyse des Servers (WordySync.dayplan), Fortschritt je Tag in profile.planDone */
  var lastStartOpts = null;
  /* Ein Baustein ist erst erledigt, wenn die Aktivität komplett gemacht wurde (Runde zu Ende, alle Wörter gehört, Spiel zu Ende, Lektion fertig, Duell gesendet oder gespielt). Ein Start oder Abbruch zählt nicht.
     Abgehakt wird der erste offene Baustein von heute, der zur Aktivität passt, auch wenn sie nicht über den Plan gestartet wurde. */
  function planComplete(spec) {
    var W = global.WordySync, dp = W && W.connected() ? W.dayplan() : null; if (!dp) return;
    var done = planDoneMap(), hit = dp.blocks.filter(function (b) {
      if (done[b.id]) return false;
      if (b.act === "start") return spec.act === "start" && b.mode === spec.mode && (b.mode !== "unit" || b.unit === spec.unit) && (b.focus || null) === (spec.focus || null);
      if (b.act === "mitlesen") return spec.act === "mitlesen" && (b.unit || "") === (spec.unit || "");
      if (b.act === "gram") return spec.act === "gram" && b.topic === spec.topic;
      if (b.act === "arena" || b.act === "wgame" || b.act === "unitgame") return spec.act === "game" && b.gid === spec.gid;
      if (b.act === "duel") return spec.act === "duel";
      return false;
    })[0];
    if (hit) { planMarkDone(hit.id); if (tab === "home" && sessionEl.hidden) render(); }
  }
  function planOnSession(d) {
    if (!d || d.mode !== "arena" || d.end === "quit") return;
    var sub = String(d.sub || "");
    planComplete(/^grammar:/.test(sub) ? { act: "gram", topic: sub.slice(8) } : { act: "game", gid: sub });
  }

  function planDoneMap() { var pf = S.state.profile, t = S.today(); if (!pf.planDone || pf.planDone.date !== t) pf.planDone = { date: t, ids: {} }; return pf.planDone.ids; }
  function planMarkDone(id) { var m = planDoneMap(); if (!m[id]) { m[id] = 1; S.save(true); } }
  function planCard() {
    var W = global.WordySync, dp = W && W.connected() ? W.dayplan() : null; if (!dp) return "";
    var done = planDoneMap(), n = dp.blocks.filter(function (b) { return done[b.id]; }).length, all = n === dp.blocks.length, nowIx = -1;
    dp.blocks.forEach(function (b, i) { if (nowIx < 0 && !done[b.id]) nowIx = i; });
    var h = '<section class="card dayw planw"><div class="row" style="align-items:baseline"><div class="eyebrow" style="flex:1 1 auto">' + (dp.custom ? "Dein Plan von den Eltern · " + dp.total + " Min." : "Dein " + dp.total + "-Minuten-Plan") + '</div><span class="small muted tnum">' + n + ' von ' + dp.blocks.length + '</span></div>' +
      (dp.why && dp.why.length ? '<p class="small muted" style="margin:4px 0 8px">Gebaut aus deinen Ergebnissen: ' + esc(dp.why.join(" · ")) + '</p>' : "") + '<div class="dwl">';
    dp.blocks.forEach(function (b, i) {
      var d = !!done[b.id], now = i === nowIx;
      h += '<div class="dws' + (d ? " d" : "") + (now ? " now" : "") + '"><div class="dwd">' + (d ? "✓" : now ? (i + 1) : b.icon) + '</div><div class="dwc"><div class="dwt"><b>' + b.icon + " " + esc(b.title) + '</b><span class="small muted" style="display:block"><b style="white-space:nowrap">' + b.min + ' Min.</b> · ' + esc(b.sub) + '</span></div>' +
        (d ? "" : '<button class="' + (now ? "btn" : "chip") + ' dwb" data-act="planblock" data-i="' + i + '">Los ▶</button>') + '</div></div>';
    });
    return h + '</div>' + (all ? '<p class="small" style="text-align:center;margin:6px 0 0">🎉 Plan geschafft! Alles Weitere ist Bonus.</p>' : "") + '</section>';
  }
  /* „Dein Tag“: feste Reihenfolge der Dinge, die heute dran sind (Daily Challenge, Pfad, Lernplan/Klassenaufgabe, Tagesziel) */
  function dayCard(pct) {
    var st = S.state, W = window.WordySync, steps = [], goalSec = S.goalMin() * 60, d = st.daily || {};
    steps.push({ icon: "🏆", t: "Daily Challenge", sub: S.challengeDone() ? "geschafft · Zusatz-Runden sind Bonus" : "Bunte Runde aus allem, was dran ist · 🪙 10", done: S.challengeDone(),
      go: 'data-act="start" data-mode="mix" data-min="' + S.goalMin() + '"', btn: S.challengeDone() ? "Zusatz" : "Los ▶" });
    var all = st.settings.pathOn === false ? [] : S.pathStations();
    if (all.length) {
      var p = S.pathSync(), fin = p.pos >= all.length;
      if (!fin) {
        var cur = all[p.pos], did = (d.pathDone || 0) > 0;
        steps.push({ icon: "🗺️", t: "Pfad: " + (cur.last ? "Boss-Runde" : cur.gram ? "Grammatik" : "Station " + cur.n), sub: esc(cur.sectionTitle) + (cur.last ? " · " + BOSS_NAMES[cur.bossMode] : cur.gram ? " · " + esc(cur.gtitle) : " · Station " + cur.n + " von " + cur.of), done: did,
          go: 'data-act="pathgo" data-id="' + esc(cur.id) + '"', btn: did ? "Weiter" : (cur.last ? "Boss ⚔️" : "Los ▶") });
      }
    }
    if (W && W.connected()) W.activePlans().forEach(function (pl) {
      var i = W.planInfo(pl), newToday = d.newSeen || 0, left = Math.max(0, i.quota - newToday), when = i.days > 1 ? "in " + i.days + " Tagen" : i.days === 1 ? "morgen" : "heute";
      steps.push({ icon: pl.cls ? "🏫" : "📅", t: (pl.cls ? "Klassenaufgabe: " : "Lernplan: ") + esc(pl.title), sub: (pl.cls ? "Ende " : "Arbeit ") + when + " · " + i.pct + " % sicher" + (left ? " · heute " + left + " neue" : "") + (!pl.cls && (pl.coins || pl.item) ? " · Bonus: " + (pl.coins ? "🪙 " + pl.coins : "") + (pl.coins && pl.item ? " + " : "") + (pl.item ? "🎁 " + esc(itemLabel(pl.item)) : "") : ""), done: left === 0 && i.pct >= 1,
        go: 'data-act="startplan" data-id="' + esc(pl.id) + '"', btn: "Üben" });
    });
    var goalDone = pct >= 100;
    steps.push({ icon: "🎯", t: "Tagesziel " + S.goalMin() + " Min.", sub: goalDone ? "geschafft · alles Weitere ist Bonus" : "noch " + fmtMin(Math.max(0, goalSec - (d.sec || 0))), done: goalDone,
      go: 'data-act="start" data-mode="mix" data-min="' + Math.max(5, Math.min(15, Math.ceil(Math.max(0, goalSec - (d.sec || 0)) / 60))) + '"', btn: "Los ▶" });
    var nowIx = -1; steps.forEach(function (s, i) { if (nowIx < 0 && !s.done) nowIx = i; });
    var doneN = steps.filter(function (s) { return s.done; }).length;
    var h = '<section class="card dayw"><div class="row" style="align-items:baseline"><div class="eyebrow" style="flex:1 1 auto">Dein Tag</div><span class="small muted tnum">' + doneN + ' von ' + steps.length + '</span></div><div class="dwl">';
    steps.forEach(function (s, i) {
      var now = i === nowIx;
      h += '<div class="dws' + (s.done ? " d" : "") + (now ? " now" : "") + '"><div class="dwd">' + (s.done ? "✓" : now ? (i + 1) : s.icon) + '</div>' +
        '<div class="dwc"><div class="dwt"><b>' + (s.done || now ? s.icon + " " : "") + s.t + '</b><span class="small muted" style="display:block">' + s.sub + '</span></div>' +
        (s.done && s.btn !== "Weiter" && s.btn !== "Zusatz" ? "" : '<button class="' + (now ? "btn" : "chip") + ' dwb" ' + s.go + '>' + s.btn + '</button>') + '</div></div>';
    });
    h += '</div>' + (all.length ? '<div style="text-align:center;margin-top:4px"><button class="chip" data-act="gopfad">Ganzen Pfad ansehen →</button></div>' : "") + '</section>';
    return h;
  }
  /* Neuheiten-Wolke auf der Startseite: kündigt ein neues Spiel an. Neues Spiel = Eintrag in NEWS (id = Spiel-ID aus VTG.GAMES, date = Datum der Veröffentlichung).
     Sie verschwindet nach dem ersten Spielen, nach ✕, nach dem Antippen oder nach 14 Tagen (pro Profil in profile.cloudSeen). */
  var NEWS = [{ id: "dropzauber", icon: "🔮", title: "Zauber-Drop!", sub: "Zauber-Eule, Sternenstaub & mehr", date: "2026-10-19", shop: "avatar" },
    { id: "verkleidung", icon: "🎭", title: "Neue Outfits!", sub: "Ritter, Ninja, Zauberer … ab in den Shop", date: "2026-10-19", shop: "outfit" },
    { id: "blast3d", icon: "🛸", title: "Blast 3D", sub: "Weich den Wörtern aus!", date: "2026-10-11" }];
  function newsCloud() {
    var pf = S.state.profile, seen = pf.cloudSeen || {}, ar = S.state.arena || {}, today = S.today();
    var n = NEWS.filter(function (x) {
      if (seen[x.id] || (!x.shop && (!global.VTG || !global.VTG.GAMES.some(function (g) { return g.id === x.id; })))) return false;
      if (dayDiff2(x.date, today) > 14 && !(pf.cloudForce || {})[x.id]) return false;
      if ((pf.cloudForce || {})[x.id]) return true;   // „Wolke wieder anzeigen“ unter Profil › Ton & Aussehen
      return x.shop ? true : !Object.keys(ar).some(function (k) { return k.indexOf("g_" + x.id + ":") === 0; });
    })[0];
    if (!n) return "";
    return '<div class="newscloud" data-id="' + esc(n.id) + '"><i class="ncs s1">✨</i><i class="ncs s2">⭐</i><i class="ncs s3">✨</i><span class="ncnew">NEU</span><button class="ncbody" data-act="newscloud" data-id="' + esc(n.id) + '"><span class="nci">' + n.icon + '</span><span class="nct"><b>' + esc(n.title) + '</b><small>' + esc(n.sub) + '</small></span></button><button class="ncx" data-act="newsx" data-id="' + esc(n.id) + '" aria-label="Ausblenden">✕</button></div>';
  }
  /* Duell-Wolke auf der Startseite: oben eine offene Herausforderung (Tippen = annehmen), sonst das Ergebnis eines Duells, das ein Freund gerade gegen dich gespielt hat
     (nur Duelle, die du gestartet hast; verschwindet nach dem Antippen, nach ✕ oder wenn du die Freunde-Seite ansiehst; Merkliste profile.duelSeen). */
  var duelHide = {}, homeDuelKey = "";
  function duelCloudItem() {
    var ib = socOn() && soc.inbox; if (!ib) return null;
    var seen = S.state.profile.duelSeen || {}, o = ib.open.filter(function (c) { return !duelHide[c.id]; })[0];
    if (o) return { kind: "open", c: o, key: "o" + o.id };
    var ci = ((soc.crew && soc.crew.invites) || []).filter(function (i) { return !duelHide["c" + i.crew]; })[0];   // Crew-Einladung
    if (ci) return { kind: "crew", c: ci, key: "c" + ci.crew };
    var r = ib.recent.filter(function (c) { return c.mine === "a" && c.done && Date.now() - c.done < 3 * 864e5 && !seen[c.id]; })[0];
    if (r) return { kind: "res", c: r, key: "r" + r.id };
    var w = ib.waiting.filter(function (c) { return c.created && Date.now() - c.created < 2 * 864e5 && !seen["w" + c.id]; })[0];   // von dir gesendet, noch unbeantwortet
    return w ? { kind: "wait", c: w, key: "w" + w.id } : null;
  }
  function shortName(n) { n = String(n || ""); return n.length > 12 ? n.slice(0, 11) + "…" : n; }
  function duelSeenAll() {
    var ib = soc.inbox; if (!ib) return; var pf = S.state.profile, m = pf.duelSeen || (pf.duelSeen = {}), ch = false;
    ib.recent.forEach(function (c) { if (c.mine === "a" && !m[c.id]) { m[c.id] = 1; ch = true; } });
    ib.waiting.forEach(function (c) { if (!m["w" + c.id]) { m["w" + c.id] = 1; ch = true; } });
    if (ch) { Object.keys(m).slice(0, -60).forEach(function (k) { delete m[k]; }); S.save(true); }
  }
  function duelCloud() {
    var it = duelCloudItem(); homeDuelKey = it ? it.key : ""; if (!it) return "";
    var c = it.c, head, sub, icon, tag, cid = it.kind === "crew" ? c.crew : c.id;
    if (it.kind === "crew") { icon = esc(c.emoji || "🛡️"); tag = "CREW"; head = esc(shortName(c.from)) + " lädt dich ein!"; sub = "Crew " + esc(shortName(c.name)) + " · Tippen zum Ansehen"; }
    else if (it.kind === "open") { icon = "⚔️"; tag = "DUELL"; head = esc(shortName(c.from.name)) + " fordert dich heraus!"; sub = modeName(c.mode) + " · schlag " + c.aScore; }
    else if (it.kind === "wait") { icon = "📨"; tag = "GESENDET"; head = "Duell an " + esc(shortName(c.to.name)) + " läuft"; sub = modeName(c.mode) + " · dein Wert " + c.aScore + " · wartet auf Antwort"; }
    else {
      var r = duelResult(c); tag = "ERGEBNIS"; icon = r.tie ? "🤝" : r.win ? "🏆" : "💪";
      head = r.tie ? "Unentschieden gegen " + esc(shortName(r.other.name)) : r.win ? "Du hast " + esc(shortName(r.other.name)) + " besiegt!" : esc(shortName(r.other.name)) + " war besser!";
      sub = "Du " + r.me + " : " + r.they + " " + esc(shortName(r.other.name)) + " · " + modeName(c.mode);
    }
    return '<div class="newscloud duelcl ' + it.kind + '" data-id="' + cid + '"><i class="ncs s1">⚡</i><i class="ncs s2">⭐</i><i class="ncs s3">⚡</i><span class="ncnew">' + tag + '</span><button class="ncbody" data-act="duelcloud" data-kind="' + it.kind + '" data-id="' + cid + '"><span class="nci">' + icon + '</span><span class="nct"><b>' + head + '</b><small>' + sub + '</small></span></button><button class="ncx" data-act="duelx" data-kind="' + it.kind + '" data-id="' + cid + '" aria-label="Ausblenden">✕</button></div>';
  }
  function dayDiff2(a, b) { return Math.round((new Date(b + "T00:00:00") - new Date(a + "T00:00:00")) / 864e5); }
  /* Titel in der Begrüßung: „Hallo [Titel] Name“. Ohne gekauften Titel gibt es einen Rangtitel, damit es alle sehen. */
  function titleChip() {   // nur der gewählte Titel; ohne Titel keine Marke
    var pf = S.state.profile; if (!pf.title) return "";
    var it = S.SHOP.filter(function (x) { return x.kind === "title" && x.val === pf.title; })[0], rar = it ? S.rarityOf(it) : "common";
    return '<span class="ttl ' + rar + '">' + esc(pf.title) + '</span> ';
  }
  /* Begrüßung auf eine Zeile einpassen (Schrift schrumpft bei langem Titel und Namen) */
  function fitGreet() {
    var h = $(".hh h1"); if (!h) return;
    var fs = 26; h.style.fontSize = fs + "px";
    while (h.scrollWidth > h.clientWidth && fs > 12) { fs -= 1; h.style.fontSize = fs + "px"; }
  }
  global.addEventListener("resize", function () { if (tab === "home") fitGreet(); });
  function viewHome() {
    var st = S.state, r = S.rankOf(st.xp);
    var goalSec = S.goalMin() * 60, pct = Math.min(100, Math.round(st.daily.sec * 100 / goalSec));
    var toNext = r.next ? (r.next.xp - st.xp) : 0;
    var pn = playerName(), named = pn && !/^Spieler \d+$/.test(pn), greet = named ? "Hallo " + titleChip(r) + esc(pn) : "Willkommen zurück";
    var hour = new Date().getHours();
    var biz = st.settings.track === "business";
    var tip = pct >= 100 ? "Tagesziel geschafft. Alles Weitere ist Bonus."
      : st.daily.sec > 0 ? "Noch " + fmtMin(goalSec - st.daily.sec) + " bis zum Tagesziel."
      : biz ? (hour < 12 ? "Fünf Minuten vor dem ersten Termin?" : "Eine kurze Runde zwischen zwei Meetings.")
      : hour < 12 ? "Eine kurze Runde vor der Schule?" : "Fünf Minuten reichen für heute.";
    var rec = lastRec = recommend(), mins = startMin || S.goalMin();

    var pf = S.state.profile, sky = hour >= 5 && hour < 11 ? "m" : hour < 17 ? "d" : hour < 21 ? "e" : "n";
    var cheer = pct >= 100 ? "Tagesziel geschafft! 🎉" : biz ? "Bereit für die nächste Runde?" : (seasonNow() === "halloween" ? "Tipp mich – Spinne weg! 🕷️" : "Tipp mich an – ich tanze!");
    var rn = r.rank ? r.rank.n : "", xpPct = r.next ? Math.min(100, Math.round(r.into * 100 / Math.max(1, r.span))) : 100;
    var html = '<div class="stack">';
    html += '<section class="hh sky-' + sky + '"><div class="hhsky"><i class="hhsun"></i><i class="hhcl c1"></i><i class="hhcl c2"></i><i class="hhst"></i></div>' +
      '<div class="hhtop"><div class="hhdate">' + esc(S.today().split("-").reverse().join(".")) + ' · ' + (biz ? "Business English" : "Schule") + '</div>' +
      '<h1>' + greet + '</h1><p class="hhtip">' + esc(tip) + '</p></div>' +
      '<div class="hhgoal"><div class="hhring" style="--p:' + pct + '"><b class="tnum">' + pct + '%</b></div><small>Tagesziel</small></div>' +
      newsCloud() + duelCloud() + '<div class="hhbubble" id="hhBub">' + esc(cheer) + '</div>' +
      '<div class="hhpod"><i></i></div><button class="hhfig" id="hhFig" data-act="hhdance" aria-label="Figur antippen">' + heroHtml(pf.avatar, 0) + '</button>' +
      '<div class="hhbar"><div class="hhrank"><b>' + esc(rn) + '</b><div class="hhxp"><i style="width:' + xpPct + '%"></i></div><small class="tnum">' + (r.next ? toNext + ' XP bis ' + esc(r.next.n) : "Höchster Rang") + '</small></div>' +
      '<div class="hhchips"><span class="hhc">🔥 <b class="tnum">' + st.streak.count + '</b></span><span class="hhc">🪙 <b class="tnum">' + st.coins + '</b></span></div></div>' +
      '</section>';

    html += resumeCard() + planCard() + dayCard(pct);

    var wish = S.wish();
    html += '<section class="card"><div class="eyebrow">Tagesmissionen</div><div style="margin-top:6px">' +
      st.daily.missions.map(function (m) {
        var pc = Math.min(100, Math.round(m.p * 100 / m.goal)), go = m.done ? "" : missionGo(m);
        return '<div class="mission' + (m.done ? " done" : "") + '"><div class="tick">✓</div>' +
          '<div class="txt"><div class="small" style="font-weight:600">' + esc(m.n) + '</div>' +
          '<div class="bar"><i style="width:' + pc + '%"></i></div>' +
          (go ? '<div class="row" style="margin-top:6px;gap:8px"><span class="small muted" style="flex:1 1 auto">' + esc(MISSION_TIP[m.type] || "") + '</span><button class="chip" style="white-space:nowrap" ' + go + '>Los →</button></div>' : '') + '</div>' +
          '<div class="pill nowrap">🪙 ' + m.coins + '</div></div>';
      }).join("") +
      (wish ? '<div class="mission">' + wishFigure(wish, Math.round(Math.min(st.coins, wish.cost) * 100 / Math.max(1, wish.cost)), S.minXp(wish) > st.xp) + '<div class="txt"><div class="small" style="font-weight:600">Dein Wunsch: ' + esc(wish.label) + '</div>' +
          '<div class="bar"><i style="width:' + Math.min(100, Math.round(st.coins * 100 / Math.max(1, wish.cost))) + '%"></i></div></div>' +
          '<div class="pill nowrap tnum">' + Math.min(st.coins, wish.cost) + ' / ' + wish.cost + '</div></div>'
        : '<div class="mission"><div class="tick" style="background:none">⭐</div><div class="txt small muted">Noch kein Wunsch gewählt.</div><button class="chip" data-act="goshop">Zum Shop</button></div>') +
      '</div></section>';
    html += '<div style="text-align:center"><button class="chip" data-act="goueben">Alle Spielmodi und Einheiten →</button></div>';
    html += '</div>';
    view.innerHTML = html;
    fitGreet();
    if (global.document && document.fonts && document.fonts.ready) document.fonts.ready.then(fitGreet);
  }

  /* ================= ÜBEN: Spielmodi und Einheiten ================= */
  function modiHtml(part) {
    var st = S.state, p = S.pools(), stt = S.stats(), mins = startMin || S.goalMin(), biz = st.settings.track === "business", few = p.all.length < 8;
    var nW = S.itemsFor(mins), nS = Math.max(5, Math.round(mins * 60 / 16)), nV = Math.max(5, Math.round(mins * 60 / 20));
    function cnt() { return " · ca.\u00a0" + mins + "\u00a0Min"; }   // Zeit statt Aufgabenzahl: die Runde hat kein Zeitlimit, die Zahl der Aufgaben richtet sich nach deinem Tempo
    var W = window.WordySync, plans = (W && W.connected()) ? W.activePlans() : [], aud = audioAvailable();
    var learn = tile("✨", "Neue Wörter", S.newBlocked() ? "Erst die " + S.newBlocked() + " fälligen wiederholen" : p.fresh.length ? p.fresh.length + " warten auf dich" + cnt(Math.min(nW, p.fresh.length)) : "Alles schon gesehen", 'data-act="start" data-mode="new" data-min="' + mins + '"' + (p.fresh.length && !S.newBlocked() ? "" : " disabled")) +
      tile("♻️", "Fehlerkartei", p.box.length ? p.box.length + " " + plural(p.box.length, "Wort", "Wörter") + " üben" + cnt(Math.min(nW, p.box.length)) : "Leer, sehr gut!", 'data-act="start" data-mode="box" data-min="' + mins + '"' + (p.box.length ? "" : " disabled")) +
      tile("💬", "Sätze", stt.sent.total ? stt.sent.seen + " von " + stt.sent.total + " geübt" + cnt(Math.min(nS, stt.sent.total)) : "Für diesen Bereich noch keine", 'data-act="start" data-mode="sent" data-min="' + mins + '"' + (stt.sent.total ? "" : " disabled")) +
      (biz ? "" : tile("🔀", "Verben", "Unregelmäßige Verben" + cnt(nV), 'data-act="start" data-mode="verbs" data-min="' + mins + '"')) +
      plans.map(function (pl) {
        var pi = W.planInfo(pl);
        return tile(pl.cls ? "🏫" : "📅", esc(pl.title), (pi.days > 1 ? "in " + pi.days + " Tagen" : pi.days === 1 ? "morgen" : pi.days === 0 ? "heute" : "vorbei") + " · " + pi.pct + " %", 'data-act="startplan" data-id="' + esc(pl.id) + '"');
      }).join("");
    var modes = global.ARENA ? global.ARENA.MODES : [];
    var play = modes.map(function (m) {
      var b = global.ARENA.best(m.id);
      return tile(esc(m.icon), esc(m.name), esc(m.tag), 'data-act="arena" data-id="' + esc(m.id) + '"' + (few ? " disabled" : ""), b.best ? '<span class="pill tnum">Bestwert ' + b.best + '</span>' : "");
    }).join("") + (global.VTG ? global.VTG.GAMES.map(function (m) {
      var b = global.VTG.best(m.id);
      return tile(esc(m.icon), esc(m.name), esc(m.tag), 'data-act="wgame" data-id="' + esc(m.id) + '"' + (few ? " disabled" : ""), b.best ? '<span class="pill tnum">Bestwert ' + b.best + '</span>' : "");
    }).join("") : "");
    var plays = 0, arena = st.arena || {};
    for (var k in arena) plays += arena[k].plays || 0;
    var focusT = [["👂", "Hören", "Wort hören und finden", "listen", !aud], ["⌨️", "Tippen", "Wort selbst schreiben", "type"], ["🧩", "Lücken", "Satz vervollständigen", "gap"], ["🔗", "Zuordnen", "Paare verbinden", "match"]];
    var films = global.VTFILM ? '<section class="card"><div class="row"><div class="eyebrow" style="flex:1 1 auto">🎬 Erklärfilme</div><span class="pill">neu</span></div>' +
      '<p class="small muted" style="margin:6px 0 10px">Bruno, Pingo, Robbi und Eisi erklären jeden Modus in 30 Sekunden.</p><div class="fmlist">' +
      global.VTFILM.list.map(function (f) { return '<button class="fmcard" data-act="film" data-id="' + f.id + '"><span>' + f.icon + '</span><b>' + esc(f.title) + '</b><i>▶</i></button>'; }).join("") + '</div></section>' : "";
    var playCard = '<section class="card"><div class="eyebrow">Arena</div>' +
      (few ? '<p class="small muted" style="margin:6px 0 0">Für die Spiele brauchst du mindestens acht Wörter im gewählten Bereich. Schalte unter „Was lernen?“ ein weiteres Schuljahr dazu.</p>' : '') +
      '<div class="tiles">' + play + '</div>' +
      '<details style="margin-top:12px"><summary class="small" style="cursor:pointer;font-weight:700">Wie die Spiele zählen</summary>' +
      '<p class="small muted" style="margin:8px 0 0">Ein Treffer unter Zeitdruck wird als sichere, aber flache Wiederholung gewertet. Er schiebt ein Wort eine Stufe weiter, ersetzt aber nicht das ruhige Training. Ein Fehlgriff landet sofort in der Fehlerkartei. Die Zeit läuft aufs Tagesziel.' + (plays ? ' Bisher ' + plays + ' ' + plural(plays, "Spiel", "Spiele") + ' gespielt.' : '') + '</p></details></section>';
    if (part === "spiel") return playCard;
    return '<section class="card"><div class="eyebrow">Lernen</div>' +
      '<div class="row wrap" style="margin-top:8px"><span class="small muted">Dauer in Min</span>' + [3, 5, 10, 15].map(function (m2) { return '<button class="chip" data-act="setmin" data-min="' + m2 + '" aria-pressed="' + (mins === m2) + '">' + m2 + '</button>'; }).join("") + '</div>' +
      '<div class="tiles">' + learn + '</div></section>' +
      '<section class="card"><div class="row"><div class="eyebrow" style="flex:1 1 auto">Gezielt üben</div><span class="pill">neu</span></div>' +
      '<p class="small muted" style="margin:6px 0 0">Eine Aufgabenform üben, mit Wörtern, die dran sind (ca. ' + mins + ' Min).</p><div class="tiles">' +
      focusT.map(function (f) { return tile(f[0], f[1], f[2], 'data-act="start" data-mode="focus" data-focus="' + f[3] + '" data-min="' + mins + '"' + (f[4] ? " disabled" : "")); }).join("") + tile("🗣️", "Mitlesen", "Alle gelernten Wörter hören und laut mitsprechen", 'data-act="mitlesen"') + '</div></section>';
  }


  /* ================= Freunde, Duelle, Ranglisten ================= */
  var soc = { me: null, inbox: null, crew: null, err: "", loading: false, ts: 0, board: {}, boardMode: "blitz" };
  var DUEL_MODES = [["match", "⚡ Match-Rausch"], ["blitz", "🔥 Blitzrunde"], ["survival", "💠 Letztes Herz"]], MODE_NAME = { match: "Match-Rausch", blitz: "Blitzrunde", survival: "Letztes Herz" };
  /* Name eines Duell-Spiels: Arena-Modus oder Wortspiel (Wort-Detektiv, Freezy, Xing, Letters, Blast, Blast 3D) */
  function modeName(m) { var g = global.VTG && global.VTG.GAMES.filter(function (x) { return x.id === m; })[0]; return MODE_NAME[m] || (g ? g.name : String(m)); }
  function isGameMode(m) { return !!(global.VTG && global.VTG.GAMES.some(function (x) { return x.id === m; })); }
  /* Einheiten einer Herausforderung aus den Wort-IDs („b-39#3“ -> Einheit b-39) */
  function duelUnitsText(ids) {
    var seen = {}, names = [];
    (ids || []).forEach(function (id) { var u = String(id).split("#")[0]; if (seen[u]) return; seen[u] = 1; var uu = S.units().filter(function (x) { return x.id === u; })[0]; if (uu) names.push(uu.title); });
    return names.length ? names.slice(0, 2).join(" + ") + (names.length > 2 ? " +" + (names.length - 2) : "") : "";
  }
  var REACTS = ["👏", "😮", "🔥", "😅", "💪", "🤝"];
  function socOn() { return !!(global.WordySync && global.WordySync.connected()); }
  function socViewing() { return tab === "spielen" && (spielSeg === "freunde" || spielSeg === "rang" || spielSeg === "crew") && sessionEl.hidden; }
  function socLoad(force) {
    if (!socOn() || soc.loading || (!force && Date.now() - soc.ts < 4000)) return;
    var W = global.WordySync; soc.loading = true;
    W.social("POST", "/profile", { avatar: S.state.profile.avatar }).catch(function () {})
      .then(function () { return W.social("GET", "/me"); })
      .then(function (me) { soc.me = me; soc.err = ""; return me.enabled ? W.social("GET", "/inbox").then(function (ib) { soc.inbox = ib; return W.social("GET", "/crew").then(function (cr) { soc.crew = cr; }); }) : null; })
      .catch(function (e) { soc.err = e.message; })
      .then(function () {
        soc.loading = false; soc.ts = Date.now();
        if (soc.inbox) { var gained = 0, wins = 0; soc.inbox.recent.forEach(function (c) { var r = duelResult(c), o = S.duelDone(c.id, r.win && !r.tie); if (o.fresh) { gained += o.coins; if (o.win) wins++; } }); if (wins) { toast("🏆 " + (wins === 1 ? "Duell gewonnen" : wins + " Duelle gewonnen") + (gained ? "! +" + gained + " 🪙" : "!"), 3600); renderHeader(); } }
        var n = soc.inbox ? soc.inbox.open.length : 0, b = $('#tabs [data-tab="spielen"]'); if (b) b.classList.toggle("dot", n > 0 || crewDot());
        var dk = duelCloudItem(); if (tab === "home" && sessionEl.hidden && (dk ? dk.key : "") !== homeDuelKey) render();
        if (socViewing()) render();
      });
  }
  function socBoardLoad(mode, force) {
    var c = soc.board[mode]; if (!socOn() || (c && (c.loading || (!force && Date.now() - c.ts < 4000)))) return;
    c = soc.board[mode] = c || { rows: null, ts: 0 }; c.loading = true;
    global.WordySync.social("GET", "/board?mode=" + mode).then(function (r) { c.rows = r.rows; c.err = ""; }).catch(function (e) { c.err = e.message; })
      .then(function () { c.loading = false; c.ts = Date.now(); if (socViewing()) render(); });
  }
  function infoCard(title, text) { return '<section class="card"><div class="eyebrow">' + title + '</div><p class="small muted" style="margin:8px 0 0">' + text + '</p></section>'; }
  function socGate() {
    if (!socOn()) return infoCard("👥 Freunde", "Dafür muss Wordy mit dem Server verbunden sein. Deine Eltern richten das unter <b>Profil › Auto-Save</b> ein.");
    if (!soc.me) return infoCard("👥 Freunde", soc.err ? esc(soc.err) : "Lade …");
    if (!soc.me.enabled) return infoCard("👥 Freunde sind noch aus", "Deine Eltern können sie im Eltern-Dashboard unter <b>„Freunde &amp; Duelle“</b> einschalten. Dann bekommst du deinen Freundescode.");
    return "";
  }
  function who(p, size) { return '<span class="fav" style="width:' + (size || 40) + 'px;height:' + (size || 40) + 'px">' + avatarHtml(p.avatar || "svg:pbaer") + '</span>'; }
  /* Figur mit Rahmen des Freundes (Rahmen nur bei bestätigten Freunden) */
  function whoFrame(f) { return '<span class="avatar ' + global.VTC.frameClass({ frame: f.frame }) + '" style="width:44px;height:44px;font-size:24px;overflow:visible;flex:none">' + avatarHtml(f.avatar || "svg:pbaer") + '</span>'; }
  function duelResult(c) {
    var me = c.mine === "a" ? c.aScore : c.bScore, they = c.mine === "a" ? c.bScore : c.aScore, other = c.mine === "a" ? c.to : c.from;
    return { me: me, they: they, other: other, win: me > they, tie: me === they };
  }
  /* Rang und XP-Fortschritt eines Freundes (nur bestätigte Freunde, Stand vom letzten Abgleich) */
  function friendRank(f) {
    if (f.xp == null) return "";
    var r = S.rankOf(f.xp), pc = r.next ? Math.round(r.into * 100 / r.span) : 100;
    var ti = f.title ? S.SHOP.filter(function (x) { return x.kind === "title" && x.val === f.title; })[0] : null,
      chip = f.title ? '<div style="margin-top:3px"><span class="ttl ' + (ti ? S.rarityOf(ti) : "common") + '">' + esc(f.title) + '</span></div>' : "";
    return '<div class="small" style="margin-top:2px"><b>' + esc(r.rank.n) + '</b> <span class="muted tnum">· ' + f.xp.toLocaleString("de-DE") + ' XP</span></div>' + chip +
      '<div class="bar" style="margin-top:4px"><i style="width:' + pc + '%"></i></div>' +
      '<div class="small muted tnum" style="margin-top:3px;font-size:11px;text-align:left">' + (r.next ? 'noch ' + (r.next.xp - f.xp).toLocaleString("de-DE") + ' bis ' + esc(r.next.n) : 'Höchster Rang') + '</div>';
  }
  function friendsHtml() {
    var gate = socGate(); if (gate) return gate;
    socLoad(); duelSeenAll();
    var me = soc.me, ib = soc.inbox || { open: [], waiting: [], recent: [] }, h = "";
    if (ib.open.length) h += '<section class="card duelcard"><div class="eyebrow">⚔️ Herausforderungen für dich</div>' + ib.open.map(function (c) {
      return '<div class="drow">' + who(c.from) + '<div class="grow"><b>' + esc(c.from.name) + '</b><div class="small muted">' + modeName(c.mode) + (duelUnitsText(c.words) ? ' · ' + esc(duelUnitsText(c.words)) : '') + ' · schlag <b class="tnum">' + c.aScore + '</b></div></div><button class="btn" data-act="socaccept" data-id="' + c.id + '">Annehmen ▶</button></div>';
    }).join("") + '</section>';
    h += '<section class="card"><div class="eyebrow">Mein Freundescode</div><div class="fcode">' + esc(me.code) + '</div>' +
      '<div class="row" style="gap:8px;margin-top:8px"><button class="chip" data-act="soccopy">📋 Kopieren</button><button class="chip" data-act="socshare">📤 Teilen</button></div>' +
      '<p class="small muted" style="margin:10px 0 0">Gib den Code deinen Freunden. Ihr könnt euch erst herausfordern, wenn die Eltern von euch beiden zugestimmt haben.</p>' +
      '<div class="row" style="gap:8px;margin-top:14px"><input id="socCode" class="grow soccode" maxlength="12" placeholder="Freundescode" autocapitalize="characters" autocomplete="off"><button class="btn" data-act="socadd">Hinzufügen</button></div><div id="socMsg" class="small muted" style="margin-top:6px"></div></section>';
    h += '<section class="card"><div class="eyebrow">Meine Freunde (' + me.friends.length + ')</div>' + (me.friends.length ? me.friends.map(function (f) {
      var st = f.state === "ok" ? "" : f.state === "mine" ? "wartet auf deine Eltern" : "wartet auf die Eltern von " + esc(f.name);
      return '<div class="drow">' + whoFrame(f) + '<div class="grow"><b>' + esc(f.name) + '</b>' + (st ? '<div class="small muted">' + st + '</div>' : '') + friendRank(f) + '</div>' +
        (f.state === "ok" ? '<button class="btn soft" data-act="socchallenge" data-id="' + f.id + '">⚔️ Duell</button>' : '<span class="pill">⏳</span>') + '<button class="chip" data-act="socdel" data-id="' + f.id + '" aria-label="Entfernen">✕</button></div>';
    }).join("") : '<p class="small muted" style="margin:8px 0 0">Noch keine Freunde. Tausche Codes aus!</p>') + '</section>';
    if (ib.waiting.length) h += '<section class="card"><div class="eyebrow">Warten auf Antwort</div>' + ib.waiting.map(function (c) { return '<div class="drow">' + who(c.to, 32) + '<div class="grow small"><b>' + esc(c.to.name) + '</b> · ' + modeName(c.mode) + ' · dein Wert <b class="tnum">' + c.aScore + '</b></div></div>'; }).join("") + '</section>';
    if (ib.recent.length) h += '<section class="card"><div class="eyebrow">Letzte Duelle</div>' + ib.recent.map(function (c) {
      var r = duelResult(c);
      return '<div class="drow">' + who(r.other, 32) + '<div class="grow"><b>' + (r.tie ? "🤝 Unentschieden" : r.win ? "🏆 Gewonnen" : "Verloren") + '</b> <span class="small muted">gegen ' + esc(r.other.name) + ' · ' + modeName(c.mode) + '</span><div class="tnum small"><b>' + r.me + '</b> : ' + r.they + '</div></div>' +
        '<span class="reacts">' + (c.theirReact ? '<span class="rea on" title="Reaktion von ' + esc(r.other.name) + '">' + c.theirReact + '</span>' : '') + REACTS.slice(0, 4).map(function (e) { return '<button class="rea' + (c.myReact === e ? " on" : "") + '" data-act="socreact" data-id="' + c.id + '" data-e="' + e + '">' + e + '</button>'; }).join("") + '</span></div>';
    }).join("") + '</section>';
    return h;
  }
  function boardHtml() {
    var gate = socGate(); if (gate) return gate;
    var mode = soc.boardMode; socBoardLoad(mode);
    var c = soc.board[mode], MED = ["🥇", "🥈", "🥉"];
    var SHORT = { match: "⚡ Match", blitz: "🔥 Blitz", survival: "💠 Herz" }, tabs = '<div class="segs">' + DUEL_MODES.map(function (m) { return '<button data-act="socmode" data-m="' + m[0] + '" aria-pressed="' + (mode === m[0]) + '">' + SHORT[m[0]] + '</button>'; }).join("") + '</div>';
    var body = !c || !c.rows ? '<p class="small muted">' + (c && c.err ? esc(c.err) : "Lade …") + '</p>' : c.rows.length < 2 ? '<p class="small muted">Noch keine Freunde auf der Liste. Hol dir welche und überhol sie!</p>' + c.rows.map(rankRow).join("") : c.rows.map(rankRow).join("");
    function rankRow(r, i) { return '<div class="drow' + (r.me ? " me" : "") + '"><span class="medal">' + (r.score ? (MED[i] || (i + 1)) : "·") + '</span>' + who(r, 34) + '<div class="grow"><b>' + esc(r.name) + (r.me ? " (du)" : "") + '</b></div><b class="tnum">' + r.score + '</b></div>'; }
    return tabs + '<section class="card"><div class="eyebrow">Diese Woche · beste Runde</div>' + body + '<p class="small muted" style="margin:10px 0 0">Jede Arena-Runde zählt. Nur du und deine bestätigten Freunde stehen auf der Liste. Am Montag geht es von vorn los.</p></section>';
  }

  /* ---------- Crew: gemeinsame Wochenziele ---------- */
  var crewUi = { adj: 0, noun: 0, emoji: 0 }, CREW_COL = ["#ff5e7e", "#ffb61e", "#3fd0ff", "#7cff6b", "#b58cff", "#ff8a4c"];
  function crewDot() { var c = soc.crew; if (!c) return false; if (c.invites.length) return true; return !!(c.crew && c.crew.quests.some(function (q) { return q.tiers.some(function (t) { return t.reached && t.eligible && !t.claimed; }); })); }
  function crewHtml() {
    var gate = socGate(); if (gate) return gate;
    socLoad(); var d = soc.crew; if (!d) return infoCard("🛡️ Crew", "Lade …");
    var me = soc.me, h = "";
    if (!d.crew) {
      h += d.invites.map(function (i) { return '<section class="card duelcard"><div class="eyebrow">🛡️ Crew-Einladung</div><div class="drow"><span class="crbadge">' + esc(i.emoji) + '</span><div class="grow"><b>' + esc(i.name) + '</b><div class="small muted">von ' + esc(i.from) + '</div></div><button class="btn" data-act="crewjoin" data-id="' + i.crew + '" data-a="1">Beitreten</button><button class="chip" data-act="crewjoin" data-id="' + i.crew + '" data-a="0">✕</button></div></section>'; }).join("");
      h += '<section class="card crewhero"><div class="eyebrow" style="color:#ffe58a">Neu: Crew-Wochenziele</div><h2 style="margin:4px 0 6px;color:#fff">Gemeinsam stärker 💪</h2><p class="small" style="margin:0;opacity:.9">Schließe dich mit deinen Freunden zu einer Crew zusammen. Jede Woche warten drei Ziele: Übungszeit, wiedererkannte Wörter und aktive Tage. Je mehr ihr schafft, desto mehr Bronze, Silber und Gold gibt es für alle. Anfeuern, Serie und MVP-Krone inklusive.</p></section>';
      h += '<section class="card"><div class="eyebrow">Eigene Crew gründen</div><div class="row" style="gap:8px;margin-top:8px"><select id="crAdj" class="grow">' + d.names.adj.map(function (x, i) { return '<option value="' + i + '"' + (crewUi.adj === i ? " selected" : "") + '>' + esc(x) + '</option>'; }).join("") + '</select><select id="crNoun" class="grow">' + d.names.noun.map(function (x, i) { return '<option value="' + i + '"' + (crewUi.noun === i ? " selected" : "") + '>' + esc(x) + '</option>'; }).join("") + '</select></div>' +
        '<div class="row" style="gap:6px;margin-top:10px;flex-wrap:wrap">' + d.names.emoji.map(function (x, i) { return '<button class="crpick' + (crewUi.emoji === i ? " on" : "") + '" data-act="crewpick" data-i="' + i + '">' + esc(x) + '</button>'; }).join("") + '</div>' +
        '<button class="btn wide" style="margin-top:12px" data-act="crewmake">🛡️ Crew gründen</button><p class="small muted" style="margin:8px 0 0">Danach lädst du bestätigte Freunde ein. Bis zu 6 in einer Crew.</p></section>';
      return h;
    }
    var c = d.crew, mine = c.members.filter(function (m) { return m.you; })[0] || {};
    S.crewJoined();
    var end = c.end.split("-").reverse().slice(0, 2).join(".");
    if (c.cheers.length) h += '<section class="card duelcard"><div class="eyebrow">📣 Angefeuert</div>' + c.cheers.slice(0, 3).map(function (x) { return '<div class="small" style="padding:3px 0"><b>' + esc(x.from) + '</b> ' + esc(x.emoji) + '</div>'; }).join("") + '</section>';
    h += '<section class="card crewhero"><div class="row" style="gap:12px;align-items:center"><span class="crbadge big">' + esc(c.emoji) + '</span><div class="grow"><div class="eyebrow" style="color:#ffe58a">Crew-Woche bis So ' + esc(end) + '</div><h2 style="margin:2px 0;color:#fff">' + esc(c.name) + '</h2>' +
      (c.streak ? '<div class="small" style="color:#ffe58a">🔥 ' + c.streak + (c.streak === 1 ? " Woche" : " Wochen") + ' in Folge stark</div>' : '<div class="small" style="opacity:.85">Schafft 2 Ziele, dann startet eure Serie</div>') + '</div></div>' +
      '<div class="crmem">' + c.members.map(function (m, i) { return '<span class="crm' + (m.today ? " on" : "") + '" title="' + esc(m.name) + '" style="--c:' + CREW_COL[i % 6] + '">' + who(m, 38) + (m.mvp ? '<i class="mvp">👑</i>' : '') + '<small>' + esc(m.name) + '</small></span>'; }).join("") + '</div></section>';
    c.quests.forEach(function (qs) {
      var gold = qs.targets[2], nextT = qs.targets.filter(function (t) { return qs.total < t; })[0], key = qs.id === "min" ? "min" : qs.id;
      var segs = c.members.map(function (m, i) { var v = m[key], w = Math.min(100, v * 100 / gold); return w > 0 ? '<i style="width:' + w + '%;background:' + CREW_COL[i % 6] + '"></i>' : ''; }).join("");
      var msg = nextT ? 'Noch <b>' + (nextT - qs.total) + ' ' + esc(qs.unit) + '</b> bis ' + ["Bronze", "Silber", "Gold"][qs.tier] : '🏆 Gold geschafft!';
      h += '<section class="card crq"><div class="row"><span style="font-size:26px">' + qs.icon + '</span><div class="grow"><b>' + esc(qs.name) + '</b><div class="small muted">Du ' + qs.mine + ' · Crew <b class="tnum">' + qs.total + '</b> von ' + gold + ' ' + esc(qs.unit) + '</div></div></div>' +
        '<div class="crbar">' + segs + '<s style="left:33.3%"></s><s style="left:66.6%"></s></div><div class="small" style="margin:6px 0 8px">' + msg + '</div><div class="crtiers">' +
        qs.tiers.map(function (t, i) { var cls = t.claimed ? "got" : t.reached ? (t.eligible ? "rdy" : "need") : "lock", ic = ["🥉", "🥈", "🥇"][i];
          return '<button class="crt ' + cls + '" ' + (t.reached && t.eligible && !t.claimed ? 'data-act="crewclaim" data-q="' + qs.id + '" data-t="' + (i + 1) + '"' : 'disabled') + '><span>' + ic + '</span><b>' + t.target + '</b><small>' + (t.claimed ? "✓ geholt" : t.reached ? (t.eligible ? "🪙 +" + t.coins + " holen" : "übe mit!") : "🔒 " + t.n) + '</small></button>'; }).join("") + '</div></section>';
    });
    h += '<section class="card"><div class="eyebrow">Crew-Mitglieder</div>' + c.members.map(function (m, i) {
      return '<div class="drow"><span class="crdot" style="background:' + CREW_COL[i % 6] + '"></span>' + who(m, 36) + '<div class="grow"><b>' + esc(m.name) + (m.you ? " (du)" : "") + (m.mvp ? " 👑" : "") + '</b><div class="small muted tnum">' + m.min + ' Min · ' + m.words + ' Wörter · ' + m.days + ' Tage</div></div>' +
        (m.you ? '' : (m.today ? '<span class="pill">🔥 heute dabei</span>' : '<span class="reacts">' + d.cheers.slice(0, 3).map(function (e) { return '<button class="rea" data-act="crewcheer" data-id="' + m.id + '" data-e="' + e + '" title="Anfeuern">' + e + '</button>'; }).join("") + '</span>')) + '</div>';
    }).join("") +
      (c.pending.length ? '<p class="small muted" style="margin:8px 0 0">Eingeladen: ' + c.pending.map(function (p) { return esc(p.name); }).join(", ") + '</p>' : '') + '</section>';
    var inviteable = c.canInvite ? me.friends.filter(function (f) { return f.state === "ok" && !c.members.some(function (m) { return m.id === f.id; }) && !c.pending.some(function (p) { return p.id === f.id; }); }) : [];
    if (inviteable.length) h += '<section class="card"><div class="eyebrow">Freunde einladen</div><div class="row" style="gap:6px;flex-wrap:wrap;margin-top:8px">' + inviteable.map(function (f) { return '<button class="chip" data-act="crewinvite" data-id="' + f.id + '">＋ ' + esc(f.name) + '</button>'; }).join("") + '</div></section>';
    var lw = c.last.quests.map(function (x) { var q = c.quests.filter(function (y) { return y.id === x.id; })[0]; return q.icon + " " + ["–", "🥉", "🥈", "🥇"][x.tier]; }).join("  ");
    h += '<section class="card"><div class="eyebrow">Letzte Woche</div><p style="margin:6px 0 0">' + lw + '</p><div class="row" style="margin-top:12px"><button class="chip" data-act="crewleave" style="margin-left:auto">Crew verlassen</button></div></section>';
    return h;
  }
  function crewDo(path, body, ok) {
    return global.WordySync.social("POST", path, body).then(function (r) { soc.ts = 0; socLoad(true); if (ok) ok(r); }).catch(function (e) { toast(e.message); });
  }
  /* Einheiten, aus denen man ein Duell wählen kann: alle im aktiven Lernbereich, ohne eigene Listen (der Freund hat sie nicht) */
  function duelUnits() {
    var aw = {}; S.activeWords().forEach(function (w) { aw[w.unit] = 1; });
    return S.units().filter(function (u) { return u.track !== "eigen" && aw[u.id] && u.words.length; });
  }
  var DUEL_MAX = 80, DUEL_MIN = 12;   // Der Server nimmt höchstens 80 Wörter je Herausforderung
  /* Alle Wörter der gewählten Einheiten, ohne doppelte Wörter; bei mehr als 80 eine zufällige, feste Auswahl */
  function duelDeckOf(unitIds) {
    var seenEn = {}, seenDe = {}, out = [];
    unitIds.forEach(function (uid) {
      var u = S.units().filter(function (x) { return x.id === uid; })[0]; if (!u) return;
      u.words.forEach(function (w, i) { var wo = S.byId(u.id + "#" + i); if (!wo || seenEn[wo.en] || seenDe[wo.de]) return; seenEn[wo.en] = seenDe[wo.de] = 1; out.push(wo); });
    });
    return out.length > DUEL_MAX ? S.shuffle(out).slice(0, DUEL_MAX) : out;
  }
  /* Schritt 1: Einheiten wählen. Schritt 2: Spiel wählen. Gespielt wird mit genau den Wörtern dieser Einheiten. */
  function duelSheet(friend, preUnits) {
    var ov = document.createElement("div"); ov.className = "srmd";
    var units = duelUnits(), sel = {}, step = preUnits ? 2 : 1;
    (preUnits || []).forEach(function (u) { sel[u] = 1; });
    function chosen() { return units.filter(function (u) { return sel[u.id]; }).map(function (u) { return u.id; }); }
    function draw() {
      var ids = chosen(), deck = duelDeckOf(ids), n = deck.length;
      if (step === 1) {
        var groups = {}, order = [];
        units.forEach(function (u) { var g = String(u.k || "Weitere"); if (!groups[g]) { groups[g] = []; order.push(g); } groups[g].push(u); });
        ov.innerHTML = '<div class="dsh"><div class="dshg"></div><div class="eyebrow">Herausforderung · Schritt 1 von 2</div><h3>Welche Einheiten?</h3>' +
          '<p>Du und ' + esc(friend.name) + ' spielt mit genau den Wörtern der gewählten Einheiten.</p>' +
          '<div class="dsu">' + (units.length ? order.map(function (g) {
            return '<div class="dsug">' + esc(g) + '</div>' + groups[g].map(function (u) {
              return '<label class="dsur"><input type="checkbox" data-u="' + esc(u.id) + '"' + (sel[u.id] ? " checked" : "") + '><span>' + esc(u.title) + '</span><small>' + u.words.length + '</small></label>';
            }).join("");
          }).join("") : '<p class="small">Keine Einheiten im aktiven Bereich.</p>') + '</div>' +
          '<div class="row" style="gap:8px;margin:10px 0 0;justify-content:center"><button class="dshs" data-d="all">Alle</button><button class="dshs" data-d="none">Keine</button></div>' +
          '<div class="small" style="margin:8px 0 0;color:#B9C0CE">' + (n >= DUEL_MIN ? "<b>" + n + " Wörter</b> gewählt" + (n >= DUEL_MAX ? " (höchstens " + DUEL_MAX + ")" : "") : "Wähle mindestens " + DUEL_MIN + " Wörter (jetzt " + n + ")") + '</div>' +
          '<button class="dshb" data-d="next"' + (n >= DUEL_MIN ? "" : " disabled") + '>Weiter ▶</button><button class="dshx" data-d="x">Abbrechen</button></div>';
      } else {
        var arenaM = DUEL_MODES.map(function (m) { return { id: m[0], label: m[1], ok: true }; });
        var gameM = (global.VTG ? global.VTG.GAMES : []).map(function (g) {
          var have = global.VTG.duelCount(g.id, deck), need = global.VTG.duelNeed(g.id);
          return { id: g.id, label: g.icon + " " + g.name, ok: have >= need, why: have + " von " + need + " passenden Wörtern" };
        });
        ov.innerHTML = '<div class="dsh"><div class="dshg"></div><div class="eyebrow">Herausforderung · Schritt 2 von 2</div><h3>Gegen ' + esc(friend.name) + '</h3>' +
          '<p>' + n + ' Wörter aus ' + chosen().length + (chosen().length === 1 ? " Einheit" : " Einheiten") + '. Du spielst zuerst, dann muss ' + esc(friend.name) + ' dein Ergebnis mit denselben Wörtern schlagen.</p>' +
          '<div class="dsu" style="max-height:46vh">' + arenaM.concat(gameM).map(function (m) {
            return '<button class="dshb" data-m="' + esc(m.id) + '"' + (m.ok ? "" : " disabled") + '>' + esc(m.label) + (m.ok ? "" : '<small style="display:block;font-size:11px;font-weight:600">zu wenige passende Wörter (' + esc(m.why) + ')</small>') + '</button>';
          }).join("") + '</div><button class="dshx" data-d="back">← Einheiten ändern</button><button class="dshx" data-d="x" style="margin-top:6px">Abbrechen</button></div>';
      }
    }
    draw(); document.body.appendChild(ov);
    ov.addEventListener("change", function (e) { var cb = e.target.closest("input[data-u]"); if (!cb) return; sel[cb.getAttribute("data-u")] = cb.checked ? 1 : 0; var sc = ov.querySelector(".dsu"), top = sc ? sc.scrollTop : 0; draw(); sc = ov.querySelector(".dsu"); if (sc) sc.scrollTop = top; });
    ov.addEventListener("click", function (e) {
      var d = e.target.closest("[data-d]"), dd = d && d.getAttribute("data-d"), m = e.target.closest("[data-m]"), mm = m && m.getAttribute("data-m");
      if (e.target === ov || dd === "x") return ov.remove();
      if (dd === "all") { units.forEach(function (u) { sel[u.id] = 1; }); return draw(); }
      if (dd === "none") { sel = {}; return draw(); }
      if (dd === "next") { if (duelDeckOf(chosen()).length >= DUEL_MIN) { step = 2; draw(); } return; }
      if (dd === "back") { step = 1; return draw(); }
      if (mm && !m.disabled) { var deck = duelDeckOf(chosen()); ov.remove(); startChallenge(friend, mm, deck); }
    });
  }
  /* Ein Duell spielen: Arena-Modus oder Wortspiel, mit festen Wörtern und fester Startzahl */
  function playDuel(mode, words, seed, duel, onFinish) {
    if (isGameMode(mode)) return global.VTG.start(mode, { duel: Object.assign({ words: words, seed: seed }, duel), onFinish: onFinish });
    global.ARENA.start(mode, { words: words, seed: seed, duel: duel, onFinish: onFinish });
  }
  function startChallenge(friend, mode, deck) {
    if (!deck) return duelSheet(friend);   // ohne Wörter erst die Einheiten wählen
    if (deck.length < DUEL_MIN) return toast("Dafür fehlen noch Wörter in den gewählten Einheiten.");
    var ids = deck.map(function (w) { return w.id; }), seed = Math.floor(Math.random() * 2000000000);
    playDuel(mode, deck, seed, { wait: "Herausforderung wird gesendet …" }, function (res, show) {
      global.WordySync.social("POST", "/challenges", { to: friend.id, mode: mode, words: ids, seed: seed, score: res.score })
        .then(function () { soc.ts = 0; socLoad(true); planComplete({ act: "duel" }); show("📨 <b>Gesendet!</b> " + esc(friend.name) + " muss jetzt deine <b>" + res.score + "</b> schlagen."); })
        .catch(function (e) { show("⚠️ " + esc(e.message)); });
    });
  }
  function acceptDuel(ch) {
    var words = ch.words.map(function (id) { return S.byId(id); }).filter(Boolean);
    if (words.length < 8) return toast("Die Wörter dieser Herausforderung gibt es in deiner App nicht.");
    if (isGameMode(ch.mode) && global.VTG.duelCount(ch.mode, words) < global.VTG.duelNeed(ch.mode)) return toast("Für dieses Spiel fehlen dir Wörter dieser Herausforderung. Bitte aktualisiere die App.");
    var other = ch.from;
    playDuel(ch.mode, words, ch.seed, { wait: "Dein Ergebnis wird übertragen …", nextLabel: "🔁 Revanche", next: function () { soc.ts = 0; startChallenge(other, ch.mode, words); } }, function (res, show) {
      global.WordySync.social("POST", "/challenges/" + ch.id + "/result", { score: res.score }).then(function (r) {
        var v = r.view, mine = v.bScore, theirs = v.aScore; soc.ts = 0; planComplete({ act: "duel" });
        show((mine > theirs ? "🏆 <b>Gewonnen!</b>" : mine === theirs ? "🤝 <b>Unentschieden!</b>" : "💪 <b>Knapp verloren.</b>") + " Du <b>" + mine + "</b> : " + theirs + " " + esc(other.name), true);
        if (mine > theirs) try { global.VTC.burst("stars", innerWidth / 2, innerHeight / 3, 30, 1.4); } catch (e) {}
      }).catch(function (e) { show("⚠️ " + esc(e.message)); });
    });
  }
  global.addEventListener("focus", function () { if (socOn()) socLoad(); });
  setInterval(function () { if (socOn() && !document.hidden) socLoad(); }, 30000);
  document.addEventListener("visibilitychange", function () { if (!document.hidden && socOn()) socLoad(true); });
  setTimeout(function () { if (socOn()) socLoad(); }, 4000);

  /* ================= Hauptmenü: Start · Lernen · Spielen · Beute · Profil ================= */
  function topSegs(html) { var st = view.querySelector(".stack"); if (st) st.insertAdjacentHTML("afterbegin", html); else view.insertAdjacentHTML("afterbegin", html); }
  /* ---------- Grammatik (Lernen › Grammatik): Themen aus data/grammatik.js, Lektionen in js/grammatik.js ---------- */
  function gramHtml() {
    var l = global.VTGR.list(), nx = global.VTGR.next(), h = "";
    if (nx) h += '<section class="card"><div class="eyebrow">Heute dran</div><h2 style="margin:6px 0 2px">' + esc(nx.icon) + ' ' + esc(nx.title) + '</h2><div class="small muted">' + esc(nx.book) + ' · ' + esc(nx.short) + '</div>' +
      '<p class="small" style="margin:8px 0 0">Erst eine kurze Erklärung, dann ' + 8 + ' Übungen.</p><button class="btn wide lg" data-act="gramstart" data-id="' + esc(nx.id) + '" style="margin-top:10px">' + (nx.lessons ? "Weiter üben ▶" : "Los geht\u2019s ▶") + '</button></section>';
    h += '<section class="card"><div class="eyebrow">Basis-Grammatik nach Headlight 2</div><p class="small muted" style="margin:6px 0 10px">Das braucht jeder. Die Themen folgen dem Schulbuch.</p>' +
      l.map(function (x) {
        return '<button class="unit gru' + (x.soon ? " soonu" : "") + '" ' + (x.soon ? "disabled" : 'data-act="gramstart" data-id="' + esc(x.id) + '"') + '><span class="ic">' + (x.soon ? "🔒" : esc(x.icon)) + '</span><span class="t"><b>' + esc(x.title) + '</b>' +
          '<span class="small muted" style="display:block">' + esc(x.book) + (x.soon ? " · kommt bald" : " · " + esc(x.short)) + '</span>' +
          (x.soon ? "" : '<span class="bar" style="margin-top:6px;display:block"><i style="width:' + x.pct + '%"></i></span>') + '</span>' +
          (x.soon ? "" : '<span class="pill tnum">' + x.pct + ' %</span>') + '</button>';
      }).join("") + '</section>';
    return h;
  }
  function viewLernen() {
    var seg = detailUnit ? "units" : lernSeg;
    var pfadOn = S.state.settings.pathOn !== false && S.pathStations().length > 0;
    if (seg === "pfad" && !pfadOn) seg = "ueben";
    var top = segBar("lernen", seg, [["units", "📚 Was lernen?"]].concat(pfadOn ? [["pfad", "🗺️ Pfad"]] : []).concat([["ueben", "🎮 Üben"]]).concat([["stats", "📈 Fortschritt"]]));
    if (detailUnit === "__verbs") return viewVerbList();
    if (detailUnit) return viewUnitDetail(detailUnit);
    if (seg === "stats") viewStats();
    else if (seg === "pfad") view.innerHTML = '<div class="stack">' + pathCard() + '</div>';
    else if (seg === "gram") view.innerHTML = '<div class="stack"><button class="chip" data-act="seg" data-g="lernen" data-v="units" style="align-self:flex-start">← Was lernen?</button>' + gramHtml() + '</div>';
    else {
      view.innerHTML = '<div class="stack">' + (seg === "units" ? unitsHtml() : modiHtml("lern")) + '</div>';
      $$("details.grp").forEach(function (d) { d.addEventListener("toggle", function () { openGroups[d.getAttribute("data-k")] = d.open; }); });
    }
    topSegs(top);
  }
  /* Klasse: freiwillige Wochenaufgabe der Lehrkraft (Klassencode, Zustimmung der Eltern am Server) */
  var cls = { d: null, ts: 0, loading: false, err: "" };
  function clsLoad(force) {
    if (!socOn() || cls.loading || (!force && Date.now() - cls.ts < 5000)) return;
    cls.loading = true; var before = JSON.stringify(cls.d);
    global.WordySync.social("GET", "/class").then(function (d) { cls.d = d; cls.err = ""; if (d.task && !global.WordySync.activePlans().some(function (x) { return x.id === "c" + d.task.id; })) return global.WordySync.pull(true); }).catch(function (e) { cls.err = e.message; })
      .then(function () { cls.loading = false; cls.ts = Date.now(); if (JSON.stringify(cls.d) !== before && tab === "spielen" && spielSeg === "challenge" && sessionEl.hidden && !document.activeElement.matches("input")) render(); });
  }
  function clsDo(path, body, ok) {
    return global.WordySync.social("POST", path, body).then(function (r) { cls.ts = 0; clsLoad(true); if (ok) ok(r); }).catch(function (e) { toast(e.message); });
  }
  function classHtml() {
    if (!socOn()) return { top: "", bottom: "" };
    clsLoad(); var d = cls.d; if (!d) return { top: "", bottom: "" };
    if (d.state === "none") return { top: "", bottom: '<section class="card"><div class="eyebrow">🏫 Klasse</div><p class="small muted" style="margin:6px 0 10px">Hat deine Lehrkraft dir einen Klassencode gegeben? Dann lernt ihr gemeinsam die Wörter der Woche. Das ist freiwillig, und deine Eltern müssen zustimmen.</p>' +
      '<div class="row" style="gap:8px"><input id="clsCode" class="grow" maxlength="12" autocapitalize="characters" autocomplete="off" placeholder="Klassencode" style="text-transform:uppercase"><button class="btn" data-act="clsjoin">Beitreten</button></div></section>' };
    if (d.state === "pending") return { top: "", bottom: '<section class="card"><div class="eyebrow">🏫 Klasse ' + esc(d.name) + '</div><p class="small" style="margin:6px 0 10px">Deine Anfrage ist raus. Sobald deine Eltern im Dashboard zugestimmt haben, geht es los.</p><button class="chip" data-act="clsleave">Anfrage zurückziehen</button></section>' };
    var t = d.task, h = '<section class="card clscard"><div class="eyebrow">🏫 Klasse ' + esc(d.name) + ' · ' + esc(d.teacher) + '</div>';
    if (!t) h += '<p class="small muted" style="margin:6px 0 0">Gerade gibt es keine Wochenaufgabe. Sobald ' + esc(d.teacher) + ' eine einstellt, erscheint sie hier.</p>';
    else {
      var my = Math.min(100, Math.round(d.mine.taskWords * 100 / Math.max(1, d.mine.goal))), cp = d.goal.target ? Math.min(100, Math.round(d.goal.total * 100 / d.goal.target)) : 0;
      h += '<h2 style="margin:6px 0 2px">' + esc(t.title) + '</h2><div class="small muted">' + esc(t.unitTitles.join(" · ")) + ' · bis ' + esc(t.to.split("-").reverse().slice(0, 2).join(".")) + '</div>' +
        '<div class="small" style="margin:12px 0 4px">Du: <b class="tnum">' + d.mine.taskWords + '</b> von ' + d.mine.goal + ' Wörtern</div><div class="bar"><i style="width:' + my + '%"></i></div>' +
        '<div class="small" style="margin:12px 0 4px">Ganze Klasse: <b class="tnum">' + d.goal.total + '</b> von ' + d.goal.target + ' · ' + d.active + ' von ' + d.kids + ' Kindern aktiv</div><div class="bar"><i style="width:' + cp + '%;background:var(--good)"></i></div>' +
        '<button class="btn wide" style="margin-top:14px" data-act="startplan" data-id="c' + t.id + '">🏫 Klassen-Challenge starten</button>' +
        '<p class="small muted" style="margin:8px 0 0">Zählt auch als Daily Challenge mit Tagesbonus.</p>';
    }
    if (d.league.length) h += '<div class="small" style="margin-top:14px"><b>Crew-Liga der Klasse</b></div>' + d.league.map(function (x) { return '<div class="row small" style="gap:8px;padding:3px 0' + (x.mine ? ';font-weight:700' : '') + '"><span>' + ["🥇", "🥈", "🥉"][x.rank - 1] + '</span><span class="grow">' + esc(x.emoji) + ' ' + esc(x.name) + '</span><span class="muted">' + x.kids + ' Kinder</span></div>'; }).join("") +
      (d.myCrew ? '<div class="row small muted" style="gap:8px;padding:3px 0"><span>' + d.myCrew.rank + '.</span><span class="grow">' + esc(d.myCrew.emoji) + ' ' + esc(d.myCrew.name) + ' (du)</span></div>' : '');
    h += '<div style="margin-top:12px"><button class="chip" data-act="clsleave">Klasse verlassen</button></div></section>';
    return { top: d.task ? h : "", bottom: d.task ? "" : h };
  }
  function challengeHtml() {
    var ci = S.chalInfo(), done = ci.doneToday, st = S.state, kl = classHtml();
    var dots = ci.days.map(function (d) { return '<span class="ctad' + (d.ok ? " ok" : "") + (d.today ? " now" : "") + '"><i>' + (d.ok ? "🔥" : d.today ? "⭐" : "·") + '</i>' + d.wd + '</span>'; }).join("");
    var left = ci.next ? ci.next - ci.streak : 0, xl = ci.extraLeft, mins = Math.max(5, S.goalMin());
    var nx = ci.next ? 'Noch ' + left + (left === 1 ? ' Tag' : ' Tage') + ' bis Serienbonus +' + ci.nextCoins + ' 🪙' : 'Alle Serienboni erreicht. Stark!';
    var rew = !done ? '<em>🪙</em><div><b>+10 Münzen für Runde 1</b><small>' + nx + '</small></div>'
      : xl ? '<em>🎁</em><div><b>Bonus-Runden: +' + ci.extraCoins + ' 🪙 je Runde</b><small>Tagesbonus ist geholt. Noch ' + xl + (xl === 1 ? ' Bonus-Runde' : ' Bonus-Runden') + ' heute. ' + nx + '</small></div>'
      : '<em>✅</em><div><b>Heute alles geholt!</b><small>' + nx + '</small></div>';
    var label = !done ? "Challenge starten ▶" : xl ? "Bonus-Runde ▶ +" + ci.extraCoins + " 🪙" : "Noch eine Runde ▶";
    return kl.top + '<section class="cta"><div class="ctaglow"></div><div class="ctatop"><div class="eyebrow">Daily Challenge</div><span class="ctafl">🔥 ' + ci.streak + (ci.streak === 1 ? " Tag" : " Tage") + '</span></div>' +
      '<h2>' + (done ? "Heute geschafft!" : "Deine Tagesbelohnung wartet") + '</h2>' +
      '<p class="ctap">' + (done ? (xl ? "Mehr üben lohnt sich: jede Bonus-Runde bringt Münzen." : "Alle Bonus-Runden sind geholt. Weiterüben zählt trotzdem für dein Lernen.") : "Eine bunte Runde aus Neuem, Fälligem und Fehlern.") + '</p>' +
      '<div class="ctarew">' + rew + '</div>' +
      '<button class="ctabtn" data-act="start" data-mode="mix" data-min="' + mins + '">' + label + '</button>' +
      '<div class="ctadays">' + dots + '</div>' +
      (done ? '' : '<button class="ctablitz" data-act="start" data-mode="mix" data-min="4">⚡ Keine Zeit? Blitz-Challenge (4 Min)</button>') +
      '<p class="small ctap" style="margin:12px 0 0;opacity:.8">Serienboni gibt es bei 3, 7, 14 und 30 Tagen in Folge' + (ci.best > 1 ? '. Bestserie: ' + ci.best + ' Tage' : '') + '.</p></section>' + kl.bottom;
  }
  function viewSpielen() {
    var top = segBar("spielen", spielSeg, [["challenge", "🏆 Challenge"], ["arena", "🕹️ Arena"], ["freunde", "👥 Freunde"], ["crew", "🛡️ Crew"], ["rang", "🥇 Liga"]]);
    view.innerHTML = '<div class="stack">' + top + (spielSeg === "arena" ? modiHtml("spiel") : spielSeg === "freunde" ? friendsHtml() : spielSeg === "crew" ? crewHtml() : spielSeg === "rang" ? boardHtml() : challengeHtml()) + '</div>';
  }
  function viewBeute() {
    var top = segBar("beute", beuteSeg, [["pass", "❄️ Monatspass"], ["shop", "🛍️ Shop"], ["showroom", "🏆 Showroom"]]);
    if (beuteSeg === "shop") { viewShop(); topSegs(top); }
    else if (beuteSeg === "showroom") { viewShowroom(); topSegs(top); }
    else {
      view.innerHTML = '<div class="stack">' + top + passCard() +
        '<section class="card"><div class="eyebrow">So funktioniert der Monatspass</div><p class="small muted" style="margin:6px 0 0">Der Pass läuft einen Monat in vier Wochen plus Finale. Jede Woche zählt, an wie vielen Tagen du dein Tagesziel schaffst, und jeder Tag gibt einen Stempel. Ein verpasster Tag pro Woche zählt als Joker mit. Sind genug Tage zusammen, öffnest du die Wochen-Beute mit Figur, Tanz und Münzen. Schon ab 3 Tagen gibt es Bronze, bei 5 Silber, bei 7 Gold, jeweils mit Münzen. Mit doppeltem Tagesziel holst du einen verpassten Tag nach, ein Crew-Wochenziel gibt Bonusmünzen, und nächste Woche wartet ein geheimes Geschenk. Alle vier Wochen geschafft? Dann wartet das Finale.</p></section></div>';
    }
  }
  function seasonCard() {
    var m = S.state.settings.season || "auto", on = seasonNow() === "halloween", snd = S.state.settings.seasonSound !== false;
    return '<section class="card"><div class="eyebrow">🎃 Halloween-Look</div><p class="small muted" style="margin:4px 0 10px">Fledermäuse, Spinnen, Friedhof und Kürbisse über deinem Design. „Automatisch“ gilt vom 15. Oktober bis 2. November.' + (on ? ' <b>Gerade aktiv.</b>' : '') + '</p>' +
      '<div class="row wrap" style="gap:8px">' + [["auto", "Automatisch"], ["on", "Immer an"], ["off", "Aus"]].map(function (x) { return '<button class="chip" data-act="setseason" data-v="' + x[0] + '" aria-pressed="' + (m === x[0]) + '">' + x[1] + (m === x[0] ? " ✓" : "") + '</button>'; }).join("") + '</div>' +
      '<div class="row" style="gap:8px;margin-top:12px;align-items:center"><button class="chip" data-act="seasonsound" aria-pressed="' + snd + '">🔊 Gruselklänge ' + (snd ? "an" : "aus") + '</button><span class="small muted">leise Hintergrundmusik, nur wenn „Ton“ an ist und nicht beim Üben</span></div></section>';
  }
  function designCard() {
    var cur = S.state.settings.design || "gold";
    return '<section class="card"><div class="eyebrow">🎨 Design</div><p class="small muted" style="margin:4px 0 10px">Such dir aus, wie Wordy aussieht. Du kannst jederzeit wechseln.</p><div class="dsgrid">' + global.VTC.DESIGNS.map(function (d) {
      return '<button class="dstile" data-act="setdesign" data-d="' + d[0] + '" aria-pressed="' + (cur === d[0]) + '"><i style="background:' + d[3] + '"></i><b>' + d[1] + (cur === d[0] ? " ✓" : "") + '</b><small>' + d[2] + '</small></button>';
    }).join("") + '</div><p class="small muted" style="margin:10px 0 0">„Hell“ oder „Dunkel“ stellst du unter Ton &amp; Aussehen ein (gilt für Nachtgold). Die Shop-Farbwelten gelten im Design „Klassisch“.</p></section>' + seasonCard();
  }
  function profileCard() {
    var st = S.state, r = S.rankOf(st.xp), pn = playerName(), pf = st.profile, xpPct = r.next ? Math.min(100, Math.round(r.into * 100 / Math.max(1, r.span))) : 100;
    var favs = S.favs().map(function (id) { return '<button class="hhf" data-act="gotab" data-t="showroom" aria-label="Favorit">' + favIcon(id) + '</button>'; }).join("");
    return '<section class="card"><div class="row" style="gap:14px;align-items:center"><div class="avatar ' + global.VTC.frameClass(pf) + '" style="width:64px;height:64px;font-size:34px;flex:none">' + avatarHtml(pf.avatar) + '</div>' +
      '<div style="flex:1 1 auto;min-width:0"><b style="font-size:18px">' + esc(pn || "Spieler") + '</b><div class="small muted">' + esc(r.rank.n) + ' · <span class="tnum">' + st.xp + '</span> XP</div>' +
      '<div class="bar" style="margin-top:6px"><i style="width:' + xpPct + '%"></i></div></div></div>' +
      '<div class="row" style="gap:8px;margin-top:12px;align-items:center"><span class="small muted">⭐ Favoriten</span>' + (favs || '<span class="small muted">noch keine</span>') + '<button class="chip" style="margin-left:auto" data-act="gotab" data-t="showroom">🏆 Showroom</button></div></section>';
  }
  function viewUeben() {
    if (detailUnit === "__verbs") return viewVerbList();
    if (detailUnit) return viewUnitDetail(detailUnit);
    view.innerHTML = '<div class="stack">' + segBar("ueben", uebenSeg, [["modi", "🎮 Spielmodi"], ["units", "📚 Was lernen?"]]) +
      (uebenSeg === "units" ? unitsHtml() : modiHtml()) + '</div>';
    $$("details.grp").forEach(function (d) { d.addEventListener("toggle", function () { openGroups[d.getAttribute("data-k")] = d.open; }); });
  }

  /* ================= EINHEITEN ================= */
  function unitsHtml() {
    var st = S.state, stt = S.stats();
    var biz = st.settings.track === "business";
    var groups = biz ? ["Basis", "Aufbau", "Profi", "Smalltalk", "Redewendungen"] : ["Headlight 2", 6, 7, 8];
    var sel = S.groupsOf();
    var html = '';
    var guided = S.steered();   // gesteuert: das Kind sieht nur die Einheiten, die für es vorgesehen sind (ohne Hinweis darauf)
    html += '<section class="card"><div class="eyebrow">Was lernen?</div><div style="margin-top:8px">' + trackSwitch() + '</div></section>';
    if (!guided) html += '<section class="card">' +
      '<div class="eyebrow">' + (biz ? "Stufe" : "Schuljahr") + '</div>' +
      '<div class="row wrap" style="margin-top:8px">' +
      groups.map(function (k) {
        return '<button class="chip" data-act="klasse" data-k="' + esc(k) + '" aria-pressed="' + (sel.indexOf(k) >= 0) + '">' + esc(groupLabel(k)) + '</button>';
      }).join("") +
      '</div><p class="small muted" style="margin:10px 0 0">' + (biz
        ? "Wähle, was im Training vorkommen soll. Unten stehen die Einheiten dazu."
        : "Headlight 2 ist das Schulbuch. Klassen kannst du dazuschalten.") + '</p></section>';

    if (!biz) {
      var vs0 = S.verbStats();
      html += '<div class="row" style="gap:10px;align-items:stretch">' +
        (global.VTGR ? '<button class="card" data-act="seg" data-g="lernen" data-v="gram" style="display:block;flex:1 1 0;min-width:0;text-align:left;cursor:pointer"><b>✏️ Grammatik</b><span class="small muted" style="display:block">Themen aus Headlight 2</span></button>' : '') +
        '<button class="card" data-act="verblist" style="display:block;flex:1 1 0;min-width:0;text-align:left;cursor:pointer"><b>🔀 Unregelmäßige Verben</b><span class="small muted" style="display:block">' + vs0.seen + ' von ' + vs0.total + ' geübt · ' + vs0.mastered + ' sitzen</span></button></div>';
    }
    var byGroup = {}, order = [], guidedIds = {};
    if (guided) S.pathUnitList().forEach(function (x) { guidedIds[x.id] = 1; });
    stt.perUnit.forEach(function (u) {
      if (guided) { if (u.track !== "eigen" && !guidedIds[u.id]) return; }
      else if (u.track !== "eigen" && sel.indexOf(u.k) < 0) return;   // nur die gewählten Stufen bzw. Jahrgänge
      var key = String(u.k);
      if (!byGroup[key]) { byGroup[key] = []; order.push(key); }
      byGroup[key].push(u);
    });
    order.sort(function (a, b) { var ia = groups.indexOf(/^\d+$/.test(a) ? +a : a), ib = groups.indexOf(/^\d+$/.test(b) ? +b : b); return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib); });
    var secShown = {};
    function secHead(id, h, sub) { if (guided || biz || secShown[id]) return ""; secShown[id] = 1; return '<div class="eyebrow" style="margin:18px 2px 2px">' + h + '</div><div class="small muted" style="margin:0 2px 8px">' + sub + '</div>'; }
    order.forEach(function (k) {
      var secH = k === "Headlight 2" ? secHead("books", "📕 Schulbücher", "Offizielle Schulbücher, nach Schuljahr und Schulzweig")
        : k === "0" ? secHead("own", "✏️ Eigene Listen", "Deine eigenen Vokabellisten")
        : secHead("cls", "📘 Klassen-Listen", "Nicht an ein Schulbuch gebunden");
      var bk0 = BOOKS.filter(function (b) { return byGroup[k][0].id.indexOf(b.pre) === 0; })[0];
      var title = k === "0" ? "✏️ Eigene Vokabeln" : k === "Headlight 2" ? "📕 Headlight 2 · Klasse " + (bk0 ? bk0.jahr : 6) + " · " + (bk0 ? bk0.zweig : "Realschule") : groupLabel(byGroup[k][0].k);
      html += secH;
      var books = [], rest = [];
      byGroup[k].forEach(function (u) { (BOOKS.filter(function (b) { return u.id.indexOf(b.pre) === 0; })[0] ? books : rest).push(u); });
      function unitRow(u) {
          var pc = Math.round(u.mastered * 100 / Math.max(1, u.total));
          return '<button class="unit" data-act="unit" data-id="' + esc(u.id) + '">' +
            '<span class="ic">' + esc(u.icon) + '</span><span class="t"><b>' + esc(BOOKS.some(function (b) { return u.id.indexOf(b.pre) === 0; }) ? u.title.replace(/^Headlight 2 · /, "") : u.title) + '</b>' +
            '<span class="bar" style="margin-top:6px;display:block"><i style="width:' + pc + '%"></i></span></span>' +
            '<span class="pill tnum">' + u.mastered + '/' + u.total + '</span></button>';
      }
      var tot = 0, sure = 0, seenW = 0, gids = []; byGroup[k].forEach(function (u) { tot += u.total; sure += u.sure; seenW += u.seen; gids.push(u.id); });
      var isOpen = openGroups[k] === undefined ? order.indexOf(k) === 0 : openGroups[k];
      html += '<details class="grp" data-k="' + esc(k) + '"' + (isOpen ? " open" : "") + '><summary><span class="chev">▸</span><span style="flex:1 1 auto;min-width:0"><b>' + esc(title) + '</b>' +
        '<span class="small muted" style="display:block">' + byGroup[k].length + ' ' + plural(byGroup[k].length, "Einheit", "Einheiten") + ' · ' + Math.round(sure * 100 / Math.max(1, tot)) + ' % sicher · ' + seenW + ' von ' + tot + ' Wörtern geübt</span></span></summary>' +
        '<button class="btn soft wide" data-act="start" data-scope="' + esc(gids.join(",")) + '" data-min="5" style="margin:4px 0 8px">Gruppe üben (5 Min.)</button>' +
        '<div class="small muted" style="margin:2px 2px 4px">Oder als Spiel mit allen Wörtern der Gruppe:</div><div class="row wrap" style="gap:8px;margin-bottom:10px">' + gameChips("data-scope", gids.join(","), tot >= 8) + '</div>' +
        '<div>' + rest.map(unitRow).join("") + '</div>' +
        (books.length ? bookTile(BOOKS.filter(function (b) { return books[0].id.indexOf(b.pre) === 0; })[0], books) + books.map(unitRow).join("") : "") + '</details>';
    });
    return html;
  }
  /* Buchkachel: selbst gezeichnetes Cover über den Einheiten eines Schulbuchs */
  var BOOKS = [{ pre: "H2-", name: "HEADLIGHT", no: "2", sub: "Schulbuch · Unit 1–6", jahr: 6, zweig: "Realschule" }];
  function bookTile(b, us) {
    var m = 0, t = 0; us.forEach(function (u) { m += u.mastered; t += u.total; });
    var pc = Math.round(m * 100 / Math.max(1, t));
    var svg = '<svg viewBox="0 0 120 150" width="84" height="105" role="img" aria-label="' + b.name + ' ' + b.no + '" style="flex:none;border-radius:6px;box-shadow:0 3px 10px rgba(0,0,0,.28)">' +
      '<rect width="120" height="150" fill="#C8202B"/><polygon points="0,150 120,60 120,150" fill="#E0323C"/>' +
      '<polygon points="0,96 0,118 34,100" fill="#F5C518"/><rect x="0" y="0" width="7" height="150" fill="#000" opacity=".18"/>' +
      '<rect x="10" y="9" width="46" height="11" fill="#2B2B2B"/><text x="13" y="17.5" font-family="sans-serif" font-size="7" font-weight="700" fill="#fff">ENGLISH</text>' +
      '<text x="45" y="17.5" font-family="sans-serif" font-size="7" font-weight="900" fill="#fff">G</text>' +
      '<text x="10" y="46" font-family="sans-serif" font-size="15" font-weight="200" fill="#fff">HEAD<tspan font-weight="900">LIGHT</tspan></text>' +
      '<text x="108" y="92" text-anchor="end" font-family="sans-serif" font-size="46" font-weight="800" fill="#fff">' + b.no + '</text>' +
      '<rect x="14" y="112" width="92" height="26" rx="2" fill="#fff" opacity=".92"/><text x="60" y="129" text-anchor="middle" font-family="sans-serif" font-size="9" font-weight="700" fill="#8E1520">UNIT 1–6</text></svg>';
    return '<div class="row" style="gap:14px;align-items:center;margin:14px 0 6px;padding:12px;border-radius:12px;background:var(--bg2,rgba(128,128,128,.1))">' + svg +
      '<div style="flex:1 1 auto"><b style="font-size:18px">' + b.name + ' ' + b.no + '</b><div class="small muted">' + esc(b.sub) + '</div>' +
      '<div class="small muted" style="margin-top:4px">' + us.length + ' Einheiten · ' + m + '/' + t + ' Wörter gemeistert</div>' +
      '<span class="bar" style="margin-top:8px;display:block"><i style="width:' + pc + '%"></i></span></div></div>';
  }
  /* Alle Vokabeln einer Einheit nacheinander vorlesen; Tempo (Sprechgeschwindigkeit und Pause) aus den Einstellungen */
  var PACES = { fast: { n: "Schnell", rate: 0.85, gap: 700 }, mid: { n: "Mittel", rate: 0.7, gap: 1400 }, slow: { n: "Langsam", rate: 0.55, gap: 2400 } };
  function readPace() { return PACES[S.state.settings.readPace] || PACES.mid; }
  var readToken = 0;
  function stopReading() { readToken++; try { window.speechSynthesis.cancel(); } catch (e) {} }
  function readAll(u, btn) {
    if (btn && btn.getAttribute("data-on")) { stopReading(); btn.removeAttribute("data-on"); btn.textContent = "🔊 Alle vorlesen"; return; }
    var my = ++readToken, i = 0, pace = readPace();
    if (btn) { btn.setAttribute("data-on", "1"); btn.textContent = "⏹ Stopp"; }
    function done() { if (btn && my === readToken) { btn.removeAttribute("data-on"); btn.textContent = "🔊 Alle vorlesen"; } }
    function next() {
      if (my !== readToken) return;
      if (i >= u.words.length) return done();
      var w = u.words[i++][0];
      if (!speak(w, pace.rate, "en", false, function () { setTimeout(next, pace.gap); })) done();
    }
    next();
  }
  /* ---------- Mitlesen: jedes Wort wird vorgelesen, dann spricht das Kind laut nach (ein Durchgang, kein Wertungsmodus, ohne Münzen) ---------- */
  function openMitlesen(list, title, unitId) {
    if (!list.length) return toast("Dafür gibt es noch keine Wörter. Übe erst ein paar neue.");
    stopReading();
    var SP = [null, { rate: .5, gap: 2800 }, { rate: .6, gap: 2000 }, { rate: .7, gap: 1400 }, { rate: .85, gap: 900 }, { rate: 1, gap: 600 }], sp = Math.min(5, Math.max(1, +S.state.settings.mlSpeed || 3)), pace = SP[sp], tok = 0, idx = 0, paused = false, closed = false, ov = document.createElement("div");
    ov.className = "mlov";
    ov.innerHTML = '<div class="mlh"><b id="mlT"></b><button class="btn ghost" id="mlX" aria-label="Schließen">✕</button></div><div class="mlp" id="mlP"></div><div class="mlc" id="mlC"></div><div class="mlst" id="mlSt"></div><div class="mlbar"><i id="mlB"></i></div>' +
      '<div class="mlsp"><span>🐢</span><input type="range" id="mlS" min="1" max="5" step="1" value="' + sp + '" aria-label="Tempo"><span>🐇</span></div><div class="mlf"><button class="btn ghost" id="mlPrev">⏮</button><button class="btn" id="mlPause">⏸ Pause</button><button class="btn ghost" id="mlNext">⏭</button></div><div class="mll" id="mlL"></div>';
    document.body.appendChild(ov); document.body.style.overflow = "hidden";
    var $c = function (id) { return ov.querySelector("#" + id); };
    $c("mlL").innerHTML = list.map(function (w, i) { return '<div class="mlw" id="mw' + i + '"><span class="en">' + esc(w.en) + '</span><span class="de">' + esc(w.de) + '</span></div>'; }).join("") + '<div style="height:45vh" aria-hidden="true"></div>';
    function close() { closed = true; tok++; try { window.speechSynthesis.cancel(); } catch (e) {} ov.remove(); document.body.style.overflow = ""; }
    function bar(ms) { var b = $c("mlB"); b.style.transition = "none"; b.style.width = "0"; if (ms) { void b.offsetWidth; b.style.transition = "width " + ms + "ms linear"; b.style.width = "100%"; } }
    function say(w, cb, t) { var fin = false, done = function () { if (fin) return; fin = true; if (t === tok && !closed) cb(); }; if (!speak(w.en, pace.rate, "en", false, done)) setTimeout(done, 1200); else setTimeout(done, 6000 + w.en.length * 150); }   // Notbremse: bleibt das Ende-Signal der Sprachausgabe aus, geht es trotzdem weiter
    function mark() { Array.prototype.forEach.call(ov.querySelectorAll(".mlw.on"), function (e) { e.classList.remove("on"); }); var e = $c("mw" + idx); if (e) { e.classList.add("on"); var L = $c("mlL"); L.scrollTo({ top: e.offsetTop - (L.clientHeight - e.offsetHeight) / 2, behavior: "smooth" }); } }
    function show(w) { $c("mlC").innerHTML = '<div class="mlen">' + esc(w.en) + '</div><div class="mlde">' + esc(w.de) + '</div>'; }
    function status(txt, you) { var e = $c("mlSt"); e.textContent = txt; e.className = "mlst" + (you ? " you" : ""); $c("mlB").style.background = you ? "#4caf50" : ""; }
    function finish() {
      planComplete({ act: "mitlesen", unit: unitId || "" });
      tok++; bar(0); status(""); $c("mlP").textContent = "Geschafft";
      $c("mlC").innerHTML = '<div class="mlen">🎉</div><div class="mlde">Alle ' + list.length + ' Wörter gehört und mitgesprochen.</div>';
      var st0 = $c("mlSt"); st0.className = "mlst"; st0.innerHTML = '<div class="row" style="justify-content:center;gap:8px"><button class="btn lg" id="mlAgain">Nochmal</button><button class="btn ghost lg" id="mlEnd">Fertig</button></div>';
      $c("mlAgain").onclick = function () { idx = 0; step(); }; $c("mlEnd").onclick = close;
    }
    function step() {
      if (closed || paused) return;
      var t = ++tok, w = list[idx]; ov.classList.remove("mlnof");
      if (idx >= list.length) { ov.classList.add("mlnof"); return finish(); }
      mark();
      /* Ein Durchgang: Wort vorlesen, dann spricht das Kind laut nach */
      $c("mlP").textContent = "Wort " + (idx + 1) + " von " + list.length; bar(0); show(w); status("👂 Erst zuhören …", false);
      say(w, function () {
        var ms = Math.max(2200, pace.gap + 900); status("🎤 Jetzt du! Sprich laut nach", true); bar(ms);
        setTimeout(function () { if (t === tok) { idx++; step(); } }, ms);
      }, t);
    }
    $c("mlS").oninput = function () { sp = +this.value; pace = SP[sp]; S.state.settings.mlSpeed = sp; try { S.save && S.save(); } catch (e) {} };
    $c("mlT").textContent = title;
    $c("mlX").onclick = close;
    $c("mlPause").onclick = function () { paused = !paused; this.textContent = paused ? "▶ Weiter" : "⏸ Pause"; if (paused) { tok++; try { window.speechSynthesis.cancel(); } catch (e) {} } else step(); };
    $c("mlNext").onclick = function () { if (idx < list.length) { idx++; try { window.speechSynthesis.cancel(); } catch (e) {} step(); } };
    $c("mlPrev").onclick = function () { idx = Math.max(0, idx - 1); try { window.speechSynthesis.cancel(); } catch (e) {} step(); };
    step();
  }
  function mitlesenList(unitId, secId) {
    if (secId) {
      var seen = {}, t = "";
      var l = []; S.pathStations().forEach(function (st) { if (st.section !== secId) return; t = st.sectionTitle; st.words.forEach(function (id) { var w = S.byId(id); if (w && !seen[id]) { seen[id] = 1; l.push({ en: w.en, de: w.de }); } }); });
      return { title: t || "Abschnitt", list: l };
    }
    if (unitId) { var u = S.units().filter(function (x) { return x.id === unitId; })[0]; return u ? { title: u.title, list: u.words.map(function (w) { return { en: w[0], de: w[1] }; }) } : { title: "", list: [] }; }
    return { title: "Alle gelernten Wörter", list: S.activeWords().filter(function (w) { return S.levelOf(w.id) >= 1; }).map(function (w) { return { en: w.en, de: w.de }; }) };
  }
  /* Spiel-Knöpfe für eine Einheit (attr = data-unit) oder eine ganze Gruppe (attr = data-scope) */
  function gameChips(attr, val, enough) {
    var dis = enough ? "" : " disabled", a = ' data-act="unitgame" ' + attr + '="' + esc(val) + '"';
    return (global.ARENA ? global.ARENA.MODES.filter(function (m) { return m.id !== "hunt"; }).map(function (m) { return '<button class="chip"' + a + ' data-arena="' + esc(m.id) + '"' + dis + '>' + esc(m.icon) + ' ' + esc(m.name) + '</button>'; }).join("") : "") +
      (global.VTG ? global.VTG.GAMES.map(function (m) { return '<button class="chip"' + a + ' data-game="' + esc(m.id) + '"' + dis + '>' + esc(m.icon) + ' ' + esc(m.name) + '</button>'; }).join("") : "");
  }
  function viewUnitDetail(id) {
    var u = S.units().filter(function (x) { return x.id === id; })[0];
    if (!u) { detailUnit = null; return viewUeben(); }
    var mastered = 0;
    var rows = u.words.map(function (w, i) {
      var wid = u.id + "#" + i, lv = S.levelOf(wid), r = S.state.w[wid];
      if (lv === 4) mastered++;
      return '<div class="wordrow">' +
        (audioAvailable() ? '<button class="mini-speak" data-act="say" data-text="' + esc(w[0]) + '" aria-label="' + esc(w[0]) + ' anhören">🔊</button>' : '') +
        '<span class="en">' + esc(w[0]) + '</span><span class="de">' + esc(w[1]) + '</span>' +
        (r && r.no ? '<span class="pill" title="Fehler">✗ ' + r.no + '</span>' : '') +
        '<span class="pill l' + lv + '">' + esc(S.LEVELS[lv].n) + '</span></div>';
    }).join("");
    view.innerHTML = '<div class="stack">' +
      '<button class="btn ghost" data-act="back" style="align-self:flex-start">← Alle Einheiten</button>' +
      '<section class="card"><div class="eyebrow">' + (u.track === "eigen" ? "Eigene Liste" : (u.track === "business" ? "Business · " : "") + groupLabel(u.k)) + '</div>' +
      '<h1 style="font-size:24px">' + esc(u.icon) + ' ' + esc(u.title) + '</h1>' +
      '<p class="small muted" style="margin:6px 0 0">' + u.words.length + ' Wörter · ' + mastered + ' gemeistert</p>' +
      '<div class="row" style="margin-top:12px;gap:8px"><button class="btn" data-act="start" data-unit="' + esc(u.id) + '">Diese Einheit üben</button>' +
      (audioAvailable() ? '<button class="btn ghost" data-act="readall" data-id="' + esc(u.id) + '">🔊 Alle vorlesen</button>' : '') + '<button class="btn ghost" data-act="mitlesen" data-unit="' + esc(u.id) + '">🗣️ Mitlesen</button></div>' +
      '<div class="eyebrow" style="margin-top:14px">Wie möchtest du üben?</div><div class="row wrap" style="margin-top:8px;gap:8px">' +
      [["👂", "Hören", "listen", !audioAvailable()], ["⌨️", "Tippen", "type"], ["🧩", "Lücken", "gap"], ["🔗", "Zuordnen", "match"]].map(function (f) {
        return f[3] ? "" : '<button class="chip" data-act="start" data-unit="' + esc(u.id) + '" data-focus="' + f[2] + '" data-min="5">' + f[0] + ' ' + f[1] + '</button>';
      }).join("") + '</div>' +
      '<div class="eyebrow" style="margin-top:14px">Oder als Spiel</div><div class="row wrap" style="margin-top:8px;gap:8px">' +
      gameChips("data-unit", u.id, u.words.length >= 5) + '</div>' +
      (audioAvailable() ? '<p class="small muted" style="margin:10px 0 0">Tippe auf 🔊 neben einem Wort, um nur dieses zu hören.</p>' : '') + '</section>' +
      '<section class="card"><div class="eyebrow">Wortliste</div>' + rows + '</section></div>';
  }


  /* ---------- Auto-Save / Lernfortschritt: Verbindung zum Server ---------- */
  {   // sync.js wird nach app.js geladen und ruft diese Hooks auf
    window.WordyHooks = {};
    window.WordyHooks.onSession = planOnSession;
    window.WordyHooks.onChange = function () { if ((tab === "home" || tab === "parent") && sessionEl.hidden) render(); };
    window.WordyHooks.onMode = function (hidden) {
      toast(hidden ? "Dein Fortschritt wird jetzt nur noch gesichert, nicht mehr angezeigt." : "Dein Fortschritt ist jetzt für die Eltern im Dashboard sichtbar.", 6000);
      if (sessionEl.hidden) render();
    };
    /* Geschenk der Eltern: Karte mit der Nachricht, erst wenn gerade keine Runde läuft */
    function showGifts(gifts) {
      if (!sessionEl.hidden) return setTimeout(function () { showGifts(gifts); }, 3000);
      var ov = document.createElement("div"); ov.className = "giftov";
      ov.innerHTML = '<div class="giftcard pop"><div style="font-size:44px">💌</div><div class="eyebrow">Post von den Eltern</div>' +
        gifts.map(function (g) { return '<div class="giftmsg">' + (g.note ? '„' + esc(g.note) + '“' : "Extramünzen für dich!") + '</div><div style="font-weight:800;font-size:20px">+' + g.coins + ' 🪙</div>'; }).join('<hr class="sep" style="margin:10px 0">') +
        '<button class="btn lg" id="giftOk" style="margin-top:12px">Danke! 🥰</button></div>';
      document.body.appendChild(ov);
      try { if (S.state.settings.audio) window.VTC.sound(S.state.profile.snd, true); window.VTC.burst("stars", window.innerWidth / 2, window.innerHeight * .4, 30, 1.6); } catch (e) {}
      document.getElementById("giftOk").onclick = function () { ov.remove(); renderHeader(); if (sessionEl.hidden) render(); };
    }
    window.WordyHooks.onReward = function (all) {
      var gl = all.filter(function (x) { return x.kind === "gift"; }), list = all.filter(function (x) { return x.kind !== "gift"; });
      if (gl.length) showGifts(gl.map(function (x) { return { note: x.note, coins: x.coins }; }));
      if (!list.length) return;
      var c = list.reduce(function (a, x) { return a + (x.coins || 0); }, 0);
      toast("🎉 " + (list[0].kind === "plan" ? "Lernplan geschafft" : list[0].kind === "week" ? "Wochenplan geschafft" : "Wochenziel geschafft") + ": " + list[0].title + (c ? " · +" + c + " Münzen" : "") + (list[0].item ? " · 🎁 " + list[0].item : ""), 6000);
      try { if (window.VTC && S.state.settings.audio) window.VTC.sound(S.state.profile.snd, true); window.VTC.burst(S.state.profile.fx, window.innerWidth / 2, window.innerHeight * .4, 24, 1); } catch (e) {}
      if (tab === "home" && sessionEl.hidden) render();
    };
  }
  function agoText(t) { var m = Math.round((Date.now() - t) / 60000); return m < 1 ? "gerade eben" : m < 60 ? "vor " + m + " Min." : m < 1440 ? "vor " + Math.round(m / 60) + " Std." : "vor " + Math.round(m / 1440) + " Tg."; }
  function syncCard() {
    var W = window.WordySync; if (!W) return "";
    var i = W.info();
    if (i.connected) {
      return '<div class="eyebrow" style="margin-top:14px">🌐 Auf dem Server</div>' +
        '<p style="margin:8px 0 4px"><b>✅ Verbunden</b> als <b>' + esc(i.name) + '</b>' + (i.hidden ? ' <span class="pill">nur Sicherung</span>' : '') + '</p>' +
        (i.hidden
          ? '<p class="small muted" style="margin:0 0 10px">Es wird nur eine Sicherung deines Lernstands auf dem Server abgelegt. Im Dashboard taucht niemand mit deinen Zahlen auf, es werden keine Antworten oder Zeiten übertragen.</p>'
          : '<p class="small muted" style="margin:0 0 10px">Die Eltern sehen, wann und was gelernt wurde: Übungszeit, richtige und falsche Antworten, Fortschritt pro Einheit und die Käufe im Shop. ' +
            (i.last ? 'Zuletzt gesendet ' + agoText(i.last) + '. ' : 'Noch nichts gesendet. ') + (i.pending ? i.pending + ' Einträge warten auf Netz.' : '') + '</p>') +
        (i.error ? '<p class="small" style="margin:0 0 10px;color:var(--bad)">' + esc(i.error) + '</p>' : '') +
        '<p class="small muted" style="margin:0 0 10px">Dein Lernstand wird nach jeder Runde auch auf dem Server gesichert' + (i.stateAt ? ' (zuletzt ' + agoText(i.stateAt) + ')' : '') + '. Geht das Handy kaputt oder werden die Daten gelöscht, kannst du ihn hier wiederherstellen.</p>' +
        (i.stateErr ? '<p class="small" style="margin:0 0 10px;color:var(--bad)">' + esc(i.stateErr) + '</p>' : '') +
        '<div class="row wrap" style="gap:8px"><button class="btn ghost" data-act="syncnow">Jetzt senden</button>' +
        '<button class="btn ghost" data-act="restoreopen">Lernstand wiederherstellen</button>' +
        '<button class="btn ghost" data-act="syncoff">Verbindung trennen</button></div><div id="restoreBox" style="margin-top:10px"></div>';
    }
    return '<div class="eyebrow" style="margin-top:14px">🌐 Auf dem Server</div>' +
      '<p class="small muted" style="margin:6px 0 10px">Optional: Verbinde dieses Gerät mit dem Wordy-Server. Der Fortschritt wird gespeichert. Den Code bekommst du von deinen Eltern. Ohne Verbindung läuft alles wie bisher.</p>' +
      '<input id="syncCode" placeholder="Code einfügen" autocomplete="off" autocapitalize="off" spellcheck="false" style="width:100%">' +
      '<button class="btn soft wide" data-act="syncpair" style="margin-top:8px">Verbinden</button>' +
      '<p class="small muted" style="margin:14px 0 6px;text-align:center">oder ohne Code</p>' +
      '<button class="btn ghost wide" data-act="pairask">Meine Eltern fragen</button><div id="pairBox" style="margin-top:10px"></div>';
  }
  /* Kind meldet sich selbst an: kurzer Code für die Eltern, das Gerät wartet auf die Freigabe */
  var pairReq = null, pairTimer = null;
  function pairStop() { clearInterval(pairTimer); pairTimer = null; pairReq = null; }
  function pairDraw(msg) {
    var el = $("#pairBox"); if (!el) return; if (!pairReq) { el.innerHTML = ""; return; }
    el.innerHTML = '<div style="text-align:center;padding:14px;border-radius:14px;background:var(--card-2)"><div class="small muted">Dein Code</div>' +
      '<div class="tnum" style="font-size:40px;font-weight:800;letter-spacing:.12em;margin:4px 0">' + esc(pairReq.code) + '</div>' +
      '<p class="small" style="margin:0 0 10px">Gib den Code deinen Eltern. Sie geben ihn im Dashboard frei, dann bist du verbunden. Er gilt 15 Minuten.</p>' +
      '<div class="row wrap" style="gap:8px;justify-content:center"><button class="btn soft" data-act="pairshare">Code teilen</button><button class="btn ghost" data-act="paircancel">Abbrechen</button></div>' +
      '<div class="small muted" style="margin-top:8px">' + esc(msg || "Warte auf deine Eltern …") + '</div></div>';
  }
  function afterPair(r) {
    toast(window.WordySync.info().hidden ? "Verbunden. Dein Lernstand wird gesichert." : "Verbunden. Deine Eltern sehen jetzt deinen Lernfortschritt.");
    if (r.backups && r.backups.length) {
      var b0 = r.backups[0], dt = new Date(b0.ts);
      if (confirm("Auf dem Server liegt ein gesicherter Lernstand von " + r.name + " (" + dt.toLocaleDateString("de-DE") + ", " + b0.words + " Wörter, " + b0.coins + " Münzen). Wiederherstellen?")) {
        window.WordySync.restore(b0.day).then(function (rr) { toast(rr.error || "Lernstand wiederhergestellt."); render(); });
        return;
      }
    }
    render();
  }
  function pairTick() {
    if (!pairReq || !$("#pairBox")) { pairStop(); return; }
    window.WordySync.pairPoll(pairReq).then(function (r) {
      if (!pairReq) return;
      if (r.status === "approved") { pairStop(); afterPair(r); }
      else if (r.status === "expired" || r.status === "denied") { var d = r.status === "denied"; pairStop(); var el = $("#pairBox"); if (el) el.innerHTML = '<p class="small" style="color:var(--bad)">' + (d ? "Deine Eltern haben den Code abgelehnt." : "Der Code ist abgelaufen.") + ' Du kannst einen neuen anfordern.</p>'; }
    });
  }
  /* Eine Karte für alles rund ums Speichern: Server, dieses Gerät, manuelles Sichern */
  function saveCard() {
    var st = S.state, bi = S.backupInfo(), pers = S.isPersisted();
    function ago(t) { return agoText(t); }
    return '<section class="card"><div class="eyebrow">Auto-Save / Lernfortschritt</div>' +
      '<p class="small muted" style="margin:6px 0 0">Dein Lernstand wird automatisch gesichert, auf diesem Gerät und, wenn du verbunden bist, zusätzlich auf dem Server.</p>' +
      syncCard() +
      '<hr class="sep" style="margin:16px 0 0">' +
      '<div class="eyebrow" style="margin-top:14px">📱 Auf diesem Gerät</div>' +
      '<p class="small muted" style="margin:6px 0 10px">Der Lernstand wird nach jeder Antwort und beim Schließen der App in diesem Browser gespeichert. Zusätzlich entsteht regelmäßig eine Sicherungskopie.' +
      (pers === true ? ' Der Browser hält den Speicher dauerhaft vor.' : pers === false ? ' Der Browser kann den Speicher bei Platzmangel räumen. Sichere den Lernstand gelegentlich unten oder verbinde dich mit dem Server.' : '') + '</p>' +
      (bi.restored ? '<p class="small" style="margin:0 0 10px;color:var(--bad)">Der Lernstand war beschädigt und wurde aus der Sicherung wiederhergestellt.</p>' : '') +
      '<div class="row wrap" style="gap:8px">' +
      (bi.auto ? '<button class="btn ghost" data-act="restore" data-slot="auto">Sicherung von ' + ago(bi.auto) + ' laden</button>' : '<span class="small muted">Noch keine Sicherungskopie.</span>') +
      (bi.pre ? '<button class="btn ghost" data-act="restore" data-slot="pre">Stand vor letzter Änderung (' + ago(bi.pre) + ') laden</button>' : '') +
      '</div>' +
      '<details style="margin-top:16px"><summary class="small" style="cursor:pointer;font-weight:700">Manuell sichern oder auf ein anderes Gerät übertragen</summary>' +
      '<p class="small muted" style="margin:8px 0 10px">Zum Umziehen auf ein anderes Gerät ohne Server: hier kopieren und dort einfügen.</p>' +
      '<div class="row wrap" style="gap:8px"><button class="btn ghost" data-act="exp" data-kind="json">Lernstand kopieren</button>' +
      '<button class="btn ghost" data-act="exp" data-kind="csv">Wortliste als CSV</button>' +
      '<button class="btn ghost" data-act="impopen">Lernstand einspielen</button></div>' +
      '<textarea id="expBox" rows="4" hidden style="margin-top:10px"></textarea>' +
      '<div id="impWrap" hidden style="margin-top:10px"><textarea id="impBox" rows="4" placeholder="Hier den kopierten Lernstand einfügen"></textarea>' +
      '<button class="btn" data-act="impdo" style="margin-top:8px">Einspielen</button></div>' +
      '<hr class="sep" style="margin:14px 0"><button class="btn ghost" data-act="reset" style="color:var(--bad)">Fortschritt zurücksetzen</button></details></section>';
  }

  /* ---------- Münzen: Übersicht und Regeln ---------- */
  function coinsCard() {
    var c = S.coinsToday(), st = S.state, total = c.fortschritt + c.missionen + c.ziel + c.serie + c.arena + c.eltern;
    function row(label, sub, val, done) {
      return '<div class="row" style="gap:10px;align-items:baseline;padding:6px 0;border-top:1px solid var(--line)"><div style="flex:1 1 auto"><b class="small">' + label + '</b>' +
        (sub ? '<div class="small muted">' + sub + '</div>' : "") + '</div><b class="tnum" style="' + (done ? "color:var(--good)" : "") + '">' + val + '</b></div>';
    }
    return '<section class="card"><div class="row"><div class="eyebrow" style="flex:1 1 auto">Münzen heute</div><span class="pill tnum">🪙 ' + st.coins + ' gesamt</span></div>' +
      '<div style="font-family:Newsreader,serif;font-size:30px;font-weight:600;margin:6px 0 4px" class="tnum">+' + total + ' <span class="small muted" style="font-family:Karla,sans-serif;font-weight:400">heute verdient</span></div>' +
      row("Lernfortschritt", "neue Wörter, höhere Stufen, Fehlerkartei, Einheiten", "+" + c.fortschritt) +
      row("Missionen", c.missionenDone + " von " + c.missionenAll + " erfüllt", "+" + c.missionen, c.missionenDone === c.missionenAll && c.missionenAll > 0) +
      row("Tagesziel", c.zielDone ? "geschafft" : "noch offen: " + S.goalMin() + " Minuten üben", c.zielDone ? "+" + c.ziel : "+20 möglich", c.zielDone) +
      row("Arena", "Tageslimit 30", c.arena + " / 30", c.arena >= 30) +
      (c.eltern ? row("Ziele der Eltern", "Wochenziel oder Lernplan geschafft", "+" + c.eltern, true) : "") +
      (c.streakNext ? row("Serien-Bonus", "noch " + c.streakDays + " " + plural(c.streakDays, "Tag", "Tage") + " bis zum " + c.streakNext + ". Tag", "+" + c.streakBonus + " möglich") : "") +
      '<details style="margin-top:10px"><summary class="small" style="cursor:pointer;font-weight:700">So verdienst du Münzen</summary>' +
      '<div class="small" style="margin-top:8px;line-height:1.7">' +
      '• <b>Neues Wort</b> +1, <b>höhere Stufe</b> +1 (Gemeistert +4), <b>Wort aus der Fehlerkartei</b> +2<br>' +
      '• <b>Neue Einheit entdeckt</b> +8 (fünf Wörter angefangen), <b>Einheit geschafft</b> +30 (Verben +60)<br>' +
      '• <b>Missionen</b> 10 bis 18, <b>Tagesziel</b> +20, <b>Serien</b> bei 3, 7, 14, 30, 60, 100 Tagen<br>' +
      '• <b>Arena</b> bis 30 pro Tag, +10 bei Rekord<br>' +
      '• <b>Boss-Truhen</b> 10 bis 25, manchmal mit Überraschung · <b>Rangaufstieg</b> 50 plus 10 je Rang und ein Geschenk<br>' +
      '• <b>Erste Woche</b> ×1,5 Münzen · jeden Tag ein <b>Tagesangebot</b> mit 20 % Rabatt<br>' +
      '<span class="muted">Jedes Wort zahlt höchstens einmal pro Tag und nur, wenn es zur Wiederholung dran war. Immer dieselben Wörter zu üben bringt nichts – neue Einheiten und fällige Wörter schon. Missionen, Tagesziel und Serien werden am Ende der Runde gutgeschrieben.</span></div></details></section>';
  }
  /* ---------- Ränge und XP: Übersicht ---------- */
  function ranksCard() {
    var st = S.state, cur = S.rankOf(st.xp);
    var rows = S.RANKS.map(function (r, i) {
      var reached = st.xp >= r.xp, isCur = r.n === cur.rank.n, next = S.RANKS[i + 1];
      var slot = S.RANK_SLOTS[r.n]; if (slot && !S.rankPickable(r.n)) slot = null; var unlocks = S.SHOP.filter(function (x) { return x.rank === r.n && x.kind !== "sticker" && !(slot && slot.indexOf(x.id) >= 0); }).map(function (x) { return x.label; });
      var gift = slot ? slot.map(function (id) { var it = S.itemById(id); return it ? it.label : ""; }).join(" oder ") : "";
      var pc = isCur && next ? Math.round(cur.into * 100 / cur.span) : 0;
      return '<div class="rank-i' + (isCur ? " cur" : reached ? "" : " off") + '"><div class="row" style="gap:10px;align-items:center">' +
        '<span style="width:22px;text-align:center">' + (isCur ? "▶" : reached ? "✓" : "🔒") + '</span>' +
        '<b style="flex:1 1 auto">' + esc(r.n) + '</b><span class="small muted tnum">ab ' + r.xp.toLocaleString("de-DE") + ' XP</span></div>' +
        (isCur && next ? '<div class="bar" style="margin:6px 0 2px 32px"><i style="width:' + pc + '%"></i></div><div class="small muted" style="margin-left:32px">Noch ' +
          (next.xp - st.xp).toLocaleString("de-DE") + ' XP bis ' + esc(next.n) + '</div>' : "") +
        (gift ? '<div class="small" style="margin:3px 0 0 32px">🎁 Figur zur Wahl: <b>' + esc(gift) + '</b></div>' : "") +
        (unlocks.length ? '<div class="small muted" style="margin:3px 0 0 32px">🔓 Im Shop: ' + esc(unlocks.join(", ")) + '</div>' : "") + '</div>';
    }).join("");
    return '<section class="card"><div class="eyebrow">Alle Ränge</div>' +
      '<p class="small muted" style="margin:6px 0 8px">Dein Stand: <b>' + st.xp.toLocaleString("de-DE") + ' XP</b> · ' + esc(cur.rank.n) + '. Bis Platin III darfst du dir bei manchen Rängen <b>eine Figur aussuchen</b>. Den passenden Sticker gibt es immer nur im Shop zu kaufen. Ab Diamant I wird nichts mehr geschenkt: Die legendären Figuren schaltet der Rang nur im Shop frei, du musst sie kaufen. Pass-Figuren gibt es nur im Wochenpass.</p>' + rows +
      '<div class="eyebrow" style="margin-top:14px">So bekommst du XP</div>' +
      '<div class="small" style="margin-top:6px;line-height:1.7">' +
      '• Richtige Antwort: <b>+10</b> (sicher) oder <b>+6</b> (mit kleinem Tippfehler)<br>' +
      '• Falsche Antwort: <b>+2</b> (Dranbleiben zählt)<br>' +
      '• Satz richtig gebaut: <b>+14</b>, falsch <b>+3</b><br>' +
      '• Arena: <b>+2</b> pro Treffer, dazu am Ende bis zu <b>+60</b> nach Punkten</div>' +
      '<div class="eyebrow" style="margin-top:14px">Stufen eines Worts</div>' +
      '<div class="small" style="margin-top:6px;line-height:1.7">' + S.LEVELS.map(function (l) { return '• <b>' + esc(l.n) + '</b>: ' + esc(l.hint); }).join("<br>") +
      '<br><span class="muted">Mit jeder richtigen Wiederholung wächst der Abstand zur nächsten. „Gemeistert“ heißt: mindestens drei Wochen Abstand.</span></div></section>';
  }
  /* ---------- Shop und Sammelalbum ---------- */
  var SHOP_TABS = [
    { k: "avatar", n: "Figuren" }, { k: "sticker", n: "Sticker" }, { k: "frame", n: "Rahmen" }, { k: "title", n: "Titel" },
    { k: "fn", n: "Fortnite" }, { k: "bg", n: "Hintergründe" }, { k: "fx", n: "Effekte" }, { k: "dance", n: "Tänze 💃" }, { k: "outfit", n: "Outfits 👕" }, { k: "kit", n: "Trikots ⚽" }, { k: "sets", n: "Sets ⭐" }, { k: "snd", n: "Töne" }, { k: "theme", n: "Farben" }
  ];
  var KIND_NAME = { sticker: "Sticker", avatar: "Figur", frame: "Rahmen", title: "Titel", bg: "Hintergrund", fx: "Effekt", dance: "Tanz", outfit: "Outfit", kit: "Trikot", snd: "Ton", theme: "Farbwelt" };
  var shopTab = "avatar", shopView = "stufe", lernSeg = "units", spielSeg = "challenge", beuteSeg = "pass";
  var TABMAP = { ueben: "lernen", stats: "lernen", shop: "beute", showroom: "beute" };
  var THEME_DOT = { paper: "#1E6273", mint: "#2E7357", plum: "#6A3D70", amber: "#8A5A1B" };
  function shopIcon(it) {
    switch (it.kind) {
      case "avatar": return avatarHtml(it.val);
      case "sticker": return stickerHtml(it, 38);
      case "theme": return '<span class="dot" style="background:' + (THEME_DOT[it.val] || "#1E6273") + '"></span>';
      case "frame": return '<span class="avatar fr-' + it.val + '" style="width:26px;height:26px;font-size:14px">' + (it.val === "none" ? "—" : "🙂") + '</span>';
      case "title": return "🏷️";
      case "bg": return it.val === "stars" ? "✨" : it.val === "clouds" ? "☁️" : it.val === "space" ? "🌌" : "▫️";
      case "fx": return it.val === "confetti" ? "🎊" : it.val === "stars" ? "⭐" : it.val === "sparks" ? "⚡" : it.val === "firework" ? "🎆" : it.val === "snow" ? "❄️" : it.val === "pixel" ? "👾" : it.val === "gold" ? "🪙" : it.val === "magie" ? "🔮" : "▫️";
      case "snd": return it.val === "none" ? "🔇" : "🔔";
      case "dance": return "💃";
      case "outfit": return "👕";
      case "kit": return "⚽";
    }
    return "";
  }
  /* Sticker: Glanz nur für gezeichnete Figuren mit Rangsperre und für Clombo */
  function stickerHtml(it, size, tilt) {
    return global.VTC.stickerHtml(it.val, size, tilt || 0, !!it.rank || /clombo/.test(it.val), esc);
  }
  var TILTS = [-7, 5, -3, 6, -5];
  function placedStickers(size) {
    var ids = S.stickers(); if (!ids.length) return "";
    if (ids.length > 3) size = Math.round(size * 0.8);   // mehr als drei: etwas kleiner, damit alle Platz haben
    return '<span class="stk-row">' + ids.map(function (id, i) {
      var it = S.SHOP.filter(function (x) { return x.id === id; })[0];
      return it ? stickerHtml(it, size, TILTS[i % TILTS.length]) : "";
    }).join("") + '</span>';
  }
  function stickerBook(set) {
    var list = S.SHOP.filter(function (x) { return x.kind === "sticker" && (set ? x.set === set : !x.set) && S.shopVisible(x); });
    var have = list.filter(function (x) { return S.owns(x); }).length;
    return '<section class="card"><div class="row"><div class="eyebrow" style="flex:1 1 auto">' + (set ? "Fortnite-Stickerbuch" : "Stickerbuch") + '</div><span class="pill tnum">' + have + ' / ' + list.length + '</span></div>' +
      '<p class="small muted" style="margin:6px 0 10px">Sammle Sticker im Shop und klebe bis zu zehn davon (so viele Plätze du freigeschaltet hast) auf deine Startseite und dein Profil. Antippen klebt auf oder löst ab.</p>' +
      '<div class="album stkbook">' + list.map(function (it) {
        var own = S.owns(it), act = S.isActive(it);
        var sub = own ? (act ? "aufgeklebt" : "") : lockNote(it) ? "🔒 " + it.rank : "🪙 " + it.cost;
        return '<button class="album-i' + (own ? "" : " off") + (act ? " on" : "") + '" ' +
          (own ? 'data-act="equip" data-id="' + esc(it.id) + '"' : 'data-act="albuminfo" data-id="' + esc(it.id) + '"') + ' aria-label="' + esc(it.label) + '">' +
          '<span class="art">' + stickerHtml(it, 58, own ? TILTS[list.indexOf(it) % TILTS.length] : 0) + '</span><small>' + esc(own ? it.label.replace("-Sticker", "") : "???") + '</small>' +
          '<small class="sub">' + esc(sub) + '</small></button>';
      }).join("") + '</div></section>';
  }
  function lockNote(it) { return S.minXp(it) > S.state.xp; }
  function albumCard(set) {
    var st = S.state, list = S.SHOP.filter(function (x) { return x.kind === "avatar" && (set ? x.set === set : !x.set) && S.shopVisible(x); });
    var have = list.filter(function (x) { return S.owns(x); }).length;
    return '<section class="card"><div class="row"><div class="eyebrow" style="flex:1 1 auto">' + (set ? "Fortnite-Album" : "Sammelalbum") + '</div><span class="pill tnum">' + have + ' / ' + list.length + '</span></div>' +
      '<p class="small muted" style="margin:6px 0 10px">' + (set ? "Tiere und Kristalle aus Fortnite, selbst gezeichnet. Die Tiere gibt es ab Rang Gold II, die Kristalle ab ihrem Rang, die Unreal-Stücke erst ab Unreal. Wünschen kannst du dir etwas im Shop mit dem ⭐."
        : "Alle Figuren auf einen Blick. Tippe auf eine, die du hast, um sie zu wählen.") + '</p>' +
      '<div class="album">' + list.map(function (it) {
        var own = S.owns(it), act = S.isActive(it);
        var sub = own ? (act ? "aktiv" : "") : lockNote(it) ? "🔒 " + it.rank : "🪙 " + it.cost;
        return '<button class="album-i' + (own ? "" : " off") + (act ? " on" : "") + '" ' +
          (own ? 'data-act="equip" data-id="' + esc(it.id) + '"' : 'data-act="albuminfo" data-id="' + esc(it.id) + '"') + ' aria-label="' + esc(it.label) + '">' +
          '<span class="art">' + avatarHtml(it.val) + '</span><small>' + esc(own ? it.label : "???") + '</small>' +
          '<small class="sub">' + esc(sub) + '</small></button>';
      }).join("") + '</div></section>';
  }
  /* Sticker-Plätze: nacheinander freischalten (Platz 1 gratis, 2 und 3: je 150, 4 bis 6: je 300, 7 bis 9: je 750, 10: 1000 Münzen) */
  function slotsHtml() {
    var n = S.stickerSlots(), st = S.state, next = n < 10 ? S.SLOT_COST[n] : 0, h = '<div class="shopitem" style="flex-wrap:wrap;gap:8px"><span style="flex:1 1 100%"><b class="small">Sticker-Plätze auf deinem Profil</b><br><span class="small muted">' +
      n + ' von 10 freigeschaltet. So viele Sticker kannst du gleichzeitig aufkleben.</span></span><span class="row" style="gap:6px;flex:1 1 100%;flex-wrap:wrap">';
    for (var i = 1; i <= 10; i++) h += '<span class="pill" style="' + (i <= n ? "background:var(--accent-soft);font-weight:700" : "opacity:.55") + '">' + (i <= n ? "✓ " : "🔒 ") + i + '</span>';
    h += '</span>';
    if (n < 10) h += '<button class="btn soft" data-act="buyslot"' + (st.coins < next ? ' aria-disabled="true" style="opacity:.6"' : "") + '>Platz ' + (n + 1) + ' freischalten · 🪙 ' + next + '</button>';
    return h + '</div>';
  }
  function tierOf(c) { return c <= 120 ? "Gewöhnlich" : c <= 350 ? "Selten" : c <= 800 ? "Episch" : "Legendär"; }
  function untilMidnight() {
    var n = new Date(), m = new Date(n.getFullYear(), n.getMonth(), n.getDate() + 1), mins = Math.max(1, Math.round((m - n) / 60000));
    return Math.floor(mins / 60) + " Std. " + (mins % 60) + " Min.";
  }
  /* Seltenheits-Karte im Shop: Farbe, Glanz und Etikett nach Seltenheit; gleiche Aktionen wie die Listenzeile */
  function shopTile(it, wishId) {
    var own = S.owns(it), act = S.isActive(it), soon = !own && S.shopSoon(it), locked = !own && (lockNote(it) || soon), price = S.priceOf(it), deal = price !== it.cost, rar = S.rarityOf(it), c = MED_COL[rar] || MED_COL.common;
    var setName = it.reward ? (S.SETS.filter(function (s) { return s.reward === it.id; })[0] || {}).name : "";
    var star = '<button class="rwish" data-act="wish" data-id="' + esc(it.id) + '" aria-pressed="' + (wishId === it.id) + '" aria-label="Wunsch">⭐</button>';
    var action = own ? '<button class="rbtn' + (act ? " on" : "") + '" data-act="equip" data-id="' + esc(it.id) + '">' + (act ? "✓ aktiv" : "Auswählen") + '</button>'
      : it.pass ? '<span class="rpill">🎁 ' + esc(it.pass) + '-Pass</span>' : it.reward ? '<span class="rpill">🎁 ' + esc(setName) + '</span>'
      : soon ? '<span class="rpill">🕒 Kommt bald</span>'
      : locked ? '<span class="rpill">🔒 ab ' + esc(it.rank) + '</span>'
      : '<button class="rbtn buy" data-act="buy" data-id="' + esc(it.id) + '">🪙 ' + (deal ? '<s>' + it.cost + '</s> ' : "") + price + '</button>';
    var sub = KIND_NAME[it.kind] + (it.bundle ? " · ❄️ Eis-Set" : "") + (it.rank && !own && (!locked || soon) ? " · ab " + esc(it.rank) : "");
    var prev = (it.kind === "dance" || it.kind === "outfit" || it.kind === "kit") ? '<button class="rprev" data-act="dancetry" data-id="' + esc(it.id) + '" aria-label="Vorschau">▶︎</button>' : "";
    return '<div class="rtile ' + rar + (own ? " own" : "") + (locked ? " lock" : "") + '"' + (locked ? ' data-act="lockinfo" data-id="' + esc(it.id) + '"' : "") + ' style="--c1:' + c[0] + ';--c2:' + c[1] + ';--g:' + RAR_GLOW[rar] + '">' +
      '<span class="rtag">' + RAR_NAME[rar] + (S.shopIsNew(it) && !own ? ' · NEU' : '') + '</span>' + (own || it.pass || it.reward || locked ? "" : star) + (own ? '<span class="rown">✓</span>' : "") +
      '<div class="rico">' + (soon ? '<span class="ri em" style="display:grid;place-items:center;height:64px;font-size:44px;filter:grayscale(1) brightness(.55)">❔</span>' : srIcon({ kind: it.kind, val: it.val, rar: rar, it: it }) + prev) + '</div>' +
      '<b class="rname">' + (soon ? "???" : esc(it.label)) + '</b><span class="rsub">' + sub + '</span><div class="ract">' + action + '</div></div>';
  }
  function shopRow(it, wishId) {
    var own = S.owns(it), act = S.isActive(it), locked = !own && lockNote(it), price = S.priceOf(it), deal = price !== it.cost;
    var setName = it.reward ? (S.SETS.filter(function (s) { return s.reward === it.id; })[0] || {}).name : "";
    var buyBtn = it.pass ? '<span class="pill" title="Gibt es nur im Pass">🎁 ' + esc(it.pass) + '-Pass</span>' : it.reward ? '<span class="pill" title="Gibt es nur für das komplette Set">🎁 ' + esc(setName) + '</span>'
      : '<button class="chip" data-act="wish" data-id="' + esc(it.id) + '" aria-pressed="' + (wishId === it.id) + '" aria-label="Wunsch" style="margin-right:6px">⭐</button><button class="btn soft" data-act="buy" data-id="' + esc(it.id) + '">🪙 ' + (deal ? '<s style="opacity:.55;font-weight:500">' + it.cost + '</s> ' : "") + price + '</button>';
    return '<div class="shopitem"><span class="si">' + shopIcon(it) + '</span>' +
      '<span style="flex:1 1 auto"><b class="small">' + esc(it.label) + '</b><br><span class="small muted">' + KIND_NAME[it.kind] + (it.cost > 0 ? " · " + tierOf(it.cost) : "") +
      (it.rank && !own ? " · ab " + esc(it.rank) : "") + (it.bundle ? " · ❄️ Eis-Set" : "") + '</span></span>' +
      ((it.kind === "dance" || it.kind === "outfit" || it.kind === "kit") ? '<button class="chip" data-act="dancetry" data-id="' + esc(it.id) + '" aria-label="Vorschau" style="margin-right:6px">▶︎</button>' : '') +
      (own ? '<button class="chip" data-act="equip" data-id="' + esc(it.id) + '" aria-pressed="' + act + '">' + (act ? "aktiv" : "auswählen") + '</button>'
        : locked && !it.reward ? '<span class="pill" title="Erst ab Rang ' + esc(it.rank) + '">🔒 ' + esc(it.rank) + '</span><button class="chip" data-act="wish" data-id="' + esc(it.id) + '" aria-pressed="' + (wishId === it.id) + '" aria-label="Wunsch" style="margin-left:6px">⭐</button>'
        : buyBtn) + '</div>';
  }
  /* „Kommt bald“: Silhouetten der nächsten Freischaltungen */
  function teaserHtml() {
    var t = S.shopTeasers(); if (!t.length) return "";
    var byW = {}, ws = []; t.forEach(function (x) { if (!byW[x.inWeeks]) { byW[x.inWeeks] = []; ws.push(x.inWeeks); } byW[x.inWeeks].push(x); });
    var DM = function (d) { var p = d.split("-"); return +p[2] + "." + +p[1] + "."; };
    return '<div style="margin:2px 0 10px"><div class="eyebrow">Kommt bald</div>' + ws.map(function (wk) {
      var l = byW[wk];
      return '<div style="margin-top:8px"><small class="muted" style="font-size:12px"><b>' + (wk === 1 ? "Nächsten Montag" : "In " + wk + " Wochen") + '</b> · Mo ' + DM(l[0].date) + '</small><div class="row wrap" style="gap:8px;margin-top:4px">' + l.map(function (x) {
        var it = S.itemById(x.id), c = MED_COL[x.rar] || MED_COL.common;
        return '<div style="width:62px;text-align:center"><div class="sil" style="width:56px;height:56px;margin:0 auto;display:grid;place-items:center;font-size:30px;border-radius:14px;background:var(--card-2);border:2px dashed ' + c[1] + ';filter:grayscale(1)' + (x.rar === "legend" ? ";box-shadow:0 0 10px ' + c[0] + '" : "") + '">' + (it && it.kind === "avatar" ? "❔" : "🎁") + '</div><small class="muted" style="display:block;font-size:10px;margin-top:2px">' + (RAR_NAME[x.rar] || "") + '</small></div>';
      }).join("") + '</div></div>';
    }).join("") + '</div>';
  }

  /* Willkommenspaket: jedes neue Kind wählt seine erste Figur und bekommt Münzen, Konfetti und einen Titel */
  function openWelcome() {
    if (!S.welcomeNeeded() || document.getElementById("welcomeSheet")) return;
    var ov = document.createElement("div"); ov.className = "srmd"; ov.id = "welcomeSheet";
    ov.innerHTML = '<div class="dsh" style="text-align:center"><div class="dshg"></div><div class="eyebrow">Willkommen</div><h3>Such dir deine erste Figur aus!</h3>' +
      '<p class="small muted" style="margin:4px 0 12px">Dazu schenken wir dir ' + S.WELCOME.coins + ' 🪙, den Effekt „Konfetti“ und den Titel „Wortjäger“.</p>' +
      '<div class="row" style="gap:10px;justify-content:center">' + S.WELCOME.choices.map(function (id) { var it = S.itemById(id); return '<button class="album-i" data-wel="' + esc(id) + '" style="min-width:86px"><span class="art">' + avatarHtml(it.val) + '</span><small>' + esc(it.label) + '</small></button>'; }).join("") + '</div></div>';
    document.body.appendChild(ov);
    ov.addEventListener("click", function (e) {
      var b = e.target.closest("[data-wel]"); if (!b) return;
      var r = S.welcomeGrant(b.getAttribute("data-wel")); if (r.error) return;
      ov.remove(); toast("Willkommen! +" + r.coins + " 🪙, deine Figur und Konfetti sind da."); render(); renderHeader();
    });
  }
  function shopCard() {
    var st = S.state, wishId = (S.wish() || {}).id, deal = S.dealItem(), sd = S.activeSetDeal();
    var html = '<section class="card"><div class="row"><div class="eyebrow" style="flex:1 1 auto">Shop</div><span class="pill">🪙 ' + st.coins + '</span></div>' +
      '<p class="small muted" style="margin:6px 0 10px">Münzen gibt es nur für Aussehen – nie für Lernvorteile.</p>' +
      (deal ? '<div class="shopitem" style="background:var(--accent-soft);border-radius:12px;padding:8px 10px;margin-bottom:8px"><span class="si">🔥</span><span style="flex:1 1 auto"><b class="small">Tagesangebot: ' + esc(deal.label) + '</b><br><span class="small muted">20 % günstiger · noch ' + untilMidnight() + '</span></span>' +
        (S.minXp(deal) > st.xp ? "" : '<button class="btn soft" data-act="buy" data-id="' + esc(deal.id) + '">🪙 <s style="opacity:.55;font-weight:500">' + deal.cost + '</s> ' + S.priceOf(deal) + '</button>') + '</div>' : "") +
      (sd ? '<div class="shopitem" style="background:linear-gradient(135deg,#dff3ff,#eaf6ff);border-radius:12px;padding:8px 10px;margin-bottom:8px"><span class="si">❄️</span><span style="flex:1 1 auto"><b class="small">Set-Angebot heute: ' + esc(sd.set.name) + '</b><br><span class="small muted">Jedes Teil nur ' + sd.price + ' 🪙 · noch ' + untilMidnight() + '</span></span><button class="btn soft" data-act="shoptab" data-k="sets">Ansehen</button></div>' : "") +
      '<div class="row wrap" style="gap:6px;margin-bottom:6px">' + SHOP_TABS.map(function (t) {
        return '<button class="chip" data-act="shoptab" data-k="' + t.k + '" aria-pressed="' + (shopTab === t.k) + '">' + t.n + '</button>';
      }).join("") + '</div>';
    if (shopTab === "sticker") html += slotsHtml();
    if (shopTab === "sets") {
      if (sd) html += '<div style="background:linear-gradient(135deg,#dff3ff,#eaf6ff);border-radius:12px;padding:10px 12px;margin:6px 0 10px"><b>❄️ Nur heute: ' + esc(sd.set.name) + ' für ' + sd.total + ' 🪙</b><div class="small muted" style="margin:2px 0 8px">Jedes fehlende Teil kostet heute ' + sd.price + ' 🪙 (' + sd.parts.length + ' ' + plural(sd.parts.length, "Teil", "Teile") + '). noch ' + untilMidnight() + '.</div><button class="btn" data-act="buyset">' + (sd.parts.some(function (x) { return S.minXp(x) > st.xp; }) ? "Alle freigeschalteten Teile kaufen · " + sd.parts.filter(function (x) { return S.minXp(x) <= st.xp; }).length * sd.price : "Komplettes Set kaufen · " + sd.total) + ' 🪙</button></div>';
      html += S.SETS.map(function (s) {
        var its = s.items.map(S.itemById), have = its.filter(function (x) { return S.owns(x); }).length, rw = S.itemById(s.reward), done = S.owns(rw);
        return '<div style="margin:6px 0 12px"><div class="row" style="gap:8px;align-items:center"><b style="flex:1 1 auto">' + s.icon + ' ' + esc(s.name) + '</b><span class="pill tnum">' + have + ' / ' + its.length + '</span></div>' +
          '<div class="bar" style="margin:6px 0"><i style="width:' + Math.round(have * 100 / its.length) + '%"></i></div>' +
          '<p class="small muted" style="margin:0 0 6px">' + (done ? "Komplett! Belohnung: " + esc(rw.label) + " ✓" : "Hol alle vier Teile und bekomm den " + esc(rw.label) + " geschenkt.") + '</p>' +
          '<div class="rgrid">' + its.map(function (x) { return shopTile(x, wishId); }).join("") + shopTile(rw, wishId) + '</div></div>';
      }).join("");
      return html + '</section>';
    }
    var RO = { common: 0, rare: 1, epic: 2, legend: 3 };   // Sortierung immer: gewöhnlich, selten, episch, legendär, danach nach Preis
    if (shopTab === "avatar") {
      html += '<div class="eyebrow" style="margin:14px 0 4px">Ansicht</div><div class="seg2">' + [["stufe", "🧩 Nach Stufe"], ["pfad", "🗺️ Rang-Pfad"]].map(function (v) { return '<button data-act="shopview" data-k="' + v[0] + '" aria-pressed="' + (shopView === v[0]) + '">' + v[1] + '</button>'; }).join("") + '</div>';
      if (shopView === "pfad") return html + rankPathHtml() + '</section>';
    }
    var all = shopTab === "avatar" || shopTab === "sticker";   // Figuren und Sticker: alles zeigen (auch Fortnite-Reihe, Noch-nicht-Freigegebenes als gesperrte Silhouette)
    var list = S.SHOP.filter(function (it) { return all ? it.kind === shopTab : (shopTab === "fn" ? it.set === "fn" : it.kind === shopTab && !it.set) && S.shopVisible(it); })
      .map(function (it, i) { return { it: it, i: i }; }).sort(function (a, b) { return (RO[S.rarityOf(a.it)] - RO[S.rarityOf(b.it)]) || (a.it.cost - b.it.cost) || (a.i - b.i); }).map(function (x) { return x.it; });
    var tot = list.filter(function (it) { return it.cost > 0 || shopTab !== "avatar"; }), have = tot.filter(function (it) { return S.owns(it); }).length;
    html += teaserHtml() + '<div class="small muted" style="margin:2px 0 4px">Gesammelt: <b>' + have + ' / ' + tot.length + '</b></div>';
    ["common", "rare", "epic", "legend"].forEach(function (r) {
      var l = list.filter(function (it) { return S.rarityOf(it) === r; }); if (!l.length) return;
      var own = l.filter(function (it) { return S.owns(it); }).length, free = l.filter(function (it) { return !S.owns(it) && !it.pass && !it.reward && S.minXp(it) <= S.state.xp; }).length;
      var mins = l.filter(function (it) { return !S.owns(it) && S.minXp(it) > S.state.xp; }).map(function (it) { return S.minXp(it); }), first = mins.length && !free ? S.rankOf(Math.min.apply(null, mins)).rank.n : "";
      html += '<div class="shsec" style="--c:' + MED_COL[r][1] + '"><b>' + RAR_NAME[r] + '</b><small>' + own + ' / ' + l.length + (first ? ' · ab ' + esc(first) : "") + '</small><i></i></div><div class="rgrid">' + l.map(function (it) { return shopTile(it, wishId); }).join("") + '</div>';
    });
    return html + '</section>';
  }
  /* Rang-Pfad: je Rang mit Figurenwahl die zwei Figuren, Stufenfarbe, Stand und XP-Balken */
  function softWrap(t) { return esc(t).replace(/(.{4})(pummel|einhorn|phönix|drache|schatten|kristall|zauber|flamingo|faultier|lama)/gi, "$1&shy;$2"); }   // lange Namen an Wortgrenzen trennen
  function rankPathHtml() {
    var st = S.state, cur = S.rankOf(st.xp), h = '<p class="small muted" style="margin:6px 0 8px">' + (cur.next ? "Noch <b>" + (cur.next.xp - st.xp).toLocaleString("de-DE") + " XP</b> bis " + esc(cur.next.n) + "." : "Höchster Rang erreicht!") + '</p>';
    S.RANKS.forEach(function (r) {
      var ids = S.RANK_SLOTS[r.n]; if (!ids) return; var pick = S.rankPickable(r.n);
      var reached = st.xp >= r.xp, isCur = r.n === cur.rank.n, got = (st.rankPick || {})[r.n], pc = isCur && cur.next ? Math.round(cur.into * 100 / cur.span) : 0;
      h += '<div class="rkrow' + (reached ? "" : " lock") + (isCur ? " cur" : "") + '"><div class="rkn"><b>' + (reached ? "✓ " : "🔒 ") + esc(r.n) + '</b><small>ab ' + r.xp.toLocaleString("de-DE") + ' XP</small>' + (pick ? "" : '<small>🛒 im Shop</small>') + (isCur && cur.next ? '<div class="bar"><i style="width:' + pc + '%"></i></div>' : "") + '</div><div class="rkf">' +
        ids.map(function (id) { var it = S.itemById(id), rr = S.rarityOf(it), own = S.owns(it), hid = !own && S.shopSoon(it);
          if (hid) return '<span class="rkx ' + rr + '" title="Geheim" data-act="lockinfo" data-id="' + esc(id) + '"><i style="display:grid;place-items:center;font-size:30px;filter:grayscale(1) brightness(.55)">❔</i><small>???</small></span>';
          return '<span class="rkx ' + rr + (got === id ? " pick" : "") + '" title="' + esc(it.label) + '"' + (reached ? "" : ' data-act="lockinfo" data-id="' + esc(id) + '"') + '><i>' + avatarHtml(it.val) + '</i><small>' + softWrap(it.label) + (got === id ? " 🎁" : own ? " ✓" : "") + '</small></span>'; }).join("") + '</div></div>';
    });
    return h;
  }
  /* Rang-Figur zur Wahl: ein Fenster je erreichter Stufe, nur die Figur, der Sticker muss gekauft werden */
  function openRankPick() {
    if ($("#rankPick") || !sessionEl.hidden) return;
    var p = S.rankPicks()[0]; if (!p) return;
    var its = p.ids.map(S.itemById), many = its.length > 1;
    var ov = document.createElement("div"); ov.className = "srmd"; ov.id = "rankPick";
    ov.innerHTML = '<div class="dsh" style="text-align:center"><div class="dshg"></div><div class="eyebrow">⬆️ Rang ' + esc(p.rank) + '</div><h3>' + (many ? "Such dir eine Figur aus!" : "Deine neue Figur!") + '</h3>' +
      '<div class="row wrap" style="gap:12px;justify-content:center;margin:10px 0">' + its.map(function (it) {
        var r = S.rarityOf(it);
        return '<button class="chip rpk" data-pick="' + esc(it.id) + '" style="min-width:120px;padding:12px;display:flex;flex-direction:column;align-items:center;gap:4px;border-radius:14px">' + itemIcon(it, true) + '<b>' + esc(it.label) + '</b><span class="small muted">' + RAR_NAME[r] + ' · + Sticker</span></button>';
      }).join("") + '</div>' +
      '<p class="small muted">' + (many ? "Die andere Figur kannst du ab jetzt im Shop kaufen." : "Den passenden Sticker kannst du im Shop kaufen.") + '</p></div>';
    document.body.appendChild(ov);
    ov.addEventListener("click", function (e) {
      var b = e.target.closest("[data-pick]"); if (!b) return;
      var r = S.rankPickClaim(p.rank, b.getAttribute("data-pick"));
      if (r.error) return toast(r.error);
      try { var rc = b.getBoundingClientRect(); global.VTC.burst("stars", rc.left + rc.width / 2, rc.top, 30, 1.6); if (S.state.settings.audio) global.VTC.sound(S.state.profile.snd, true); } catch (x) {}
      ov.remove(); renderHeader(); toast("🎁 " + r.item.label + " ist deine!", 3600);
      setTimeout(function () { if (S.rankPicks().length) openRankPick(); else render(); }, 700);
    });
  }
  /* Rang- und Set-Geschenke sowie die einmalige Preisgutschrift ansagen */
  function flushNews() {
    var parts = [], pn = S.state.priceNote;
    if (pn) { parts.push("Neue Preise: " + pn + " 🪙 zurück für schon gekaufte Sachen"); S.state.priceNote = 0; S.save(true); }
    var n = S.takeNews();
    if (n) {
      n.ranks.forEach(function (r) { parts.push("Rang " + r.rank + ": +" + r.coins + " 🪙" + (r.item ? " und " + r.item + " geschenkt" : "")); });
      if (n.sets.length) setTimeout(function () { openSetReveal(n.sets); }, 300);
      (n.cups || []).forEach(function (c) { parts.push("Sammler-Pokal " + c.cup + "! +" + c.coins + " 🪙"); });
      S.save(true);
    }
    if (parts.length) toast("🎉 " + parts.join(" · "), 5200);
    if (S.rankPicks().length) setTimeout(openRankPick, parts.length ? 1200 : 400);
  }

  /* ================= FORTSCHRITT ================= */
  /* ---------- Wörterliste (Fortschritt > Wörter) ---------- */
  var WFILTERS = [["alle", "Alle"], ["schwer", "Schwierig"], ["neu", "Gerade gelernt"], ["alt", "Lange nicht geübt"], ["sitzt", "Gemeistert"]];
  function wordRows() {
    var now = Date.now(), q = wQuery.trim().toLowerCase();
    return S.activeWords().map(function (w) { return { w: w, r: S.state.w[w.id], l: S.levelOf(w.id) }; }).filter(function (x) {
      if (!x.r || !x.r.reps && !x.r.no && !x.r.ok) return false;                       // nur schon geübte Wörter
      if (q && (x.w.en + " " + x.w.de).toLowerCase().indexOf(q) < 0) return false;
      if (wFilter === "schwer") return x.r.no > 0 && x.l < 3;
      if (wFilter === "neu") return now - (x.r.last || 0) < 7 * 86400000 && x.l >= 1 && x.l <= 2;
      if (wFilter === "alt") return x.l >= 1 && now - (x.r.last || 0) > 14 * 86400000;
      if (wFilter === "sitzt") return x.l === 4;
      return true;
    }).sort(function (a, b) {
      return wFilter === "schwer" ? (b.r.no - a.r.no) || (a.r.ok - b.r.ok)
        : wFilter === "alt" ? (a.r.last || 0) - (b.r.last || 0)
        : (b.r.last || 0) - (a.r.last || 0);
    });
  }
  function wordListHtml() {
    var rows = wordRows(), shown = rows.slice(0, wMax), now = Date.now();
    if (!rows.length) return '<p class="small muted" style="margin:10px 0 0">' + (wQuery || wFilter !== "alle" ? "Dazu gibt es nichts." : "Noch keine Wörter geübt. Nach der ersten Runde steht hier etwas.") + '</p>';
    return '<p class="small muted" style="margin:10px 0 0">' + rows.length + ' ' + plural(rows.length, "Wort", "Wörter") + '</p>' + shown.map(function (x) {
      var days = x.r.last ? Math.floor((now - x.r.last) / 86400000) : null, nd = x.r.due ? Math.ceil((x.r.due - now) / 86400000) : null;
      return '<div class="wordrow"><span class="en">' + esc(x.w.en) + '</span><span class="de" style="flex:1 1 auto">' + esc(x.w.de) +
        '<span class="small muted" style="display:block">' + esc(S.LEVELS[x.l].n) + (days != null ? " · zuletzt " + (days === 0 ? "heute" : "vor " + days + " " + plural(days, "Tag", "Tagen")) : "") +
        (nd != null && x.l > 0 ? " · nächste Wiederholung " + (nd <= 0 ? "jetzt" : "in " + nd + " " + plural(nd, "Tag", "Tagen")) : "") + '</span></span>' +
        '<span class="pill">✗ ' + x.r.no + '</span><span class="pill">✓ ' + x.r.ok + '</span></div>';
    }).join("") + (rows.length > wMax ? '<button class="btn ghost wide" data-act="wmore" style="margin-top:10px">Mehr anzeigen</button>' : '');
  }
  function wordListCard() {
    var week = S.activeWords().filter(function (w) { var r = S.state.w[w.id]; return r && r.last && Date.now() - r.last < 7 * 86400000; }).length;
    var mast = S.activeWords().filter(function (w) { var r = S.state.w[w.id]; return r && r.m && S.levelOf(w.id) === 4 && Date.now() - r.m < 7 * 86400000; }).length;
    return '<section class="card"><div class="eyebrow">Alle Wörter</div>' +
      '<p class="small muted" style="margin:6px 0 0">In den letzten 7 Tagen hast du ' + week + ' ' + plural(week, "Wort", "Wörter") + ' geübt' + (mast ? ' und ' + mast + ' ' + plural(mast, "Wort", "Wörter") + ' gemeistert 🎉' : '') + '.</p>' +
      '<input id="wSearch" type="search" placeholder="Wort suchen (englisch oder deutsch)" value="' + esc(wQuery) + '" autocomplete="off" style="width:100%;margin-top:10px">' +
      '<div class="row wrap" style="margin-top:10px">' + WFILTERS.map(function (f) {
        return '<button class="chip" data-act="wfilter" data-f="' + f[0] + '" aria-pressed="' + (wFilter === f[0]) + '">' + f[1] + '</button>';
      }).join("") + '</div><div id="wList">' + wordListHtml() + '</div></section>';
  }
  function viewStats() {
    var st = S.state, s = S.stats(), r = S.rankOf(st.xp);
    var maxItems = Math.max.apply(null, s.d14.map(function (d) { return d.items; }).concat([1]));
    var secTiles = '<section class="card"><div class="tiles4">' +
      '<div class="kpi"><b class="tnum">' + s.dist[4] + '</b><span>gemeistert</span></div>' +
      '<div class="kpi"><b class="tnum">' + (s.total - s.dist[0]) + '</b><span>schon geübt</span></div>' +
      '<div class="kpi"><b class="tnum">' + s.acc + '%</b><span>richtig</span></div>' +
      '<div class="kpi"><b class="tnum">' + s.days + '</b><span>Lerntage</span></div>' +
      '</div>' +
      '<div class="row" style="margin-top:14px;gap:12px"><div class="avatar ' + global.VTC.frameClass(st.profile) + '">' + avatarHtml(st.profile.avatar) + '</div>' +
      '<div style="flex:1 1 auto"><div class="row"><b>' + esc(r.rank.n) + '</b><span class="spacer"></span>' +
      '<span class="small muted tnum">' + st.xp + (r.next ? " / " + r.next.xp : "") + ' XP</span></div>' +
      '<div class="bar" style="margin-top:6px"><i style="width:' + (r.span ? Math.round(r.into * 100 / r.span) : 100) + '%"></i></div></div>' + placedStickers(46) + '</div></section>';

    /* Kompetenzverteilung – eine Farbe, hell nach dunkel (Ordinalskala) */
    var segs = s.dist.map(function (n, i) {
      return n ? '<i class="lv' + i + '" style="flex:' + n + '" title="' + esc(S.LEVELS[i].n) + ': ' + n + '"></i>' : "";
    }).join("");
    var secDist = '<section class="card"><div class="eyebrow">Wo stehen die ' + s.total + ' Wörter?</div>' +
      '<div class="levelbar" style="margin-top:10px">' + segs + '</div>' +
      '<div class="legend">' + s.dist.map(function (n, i) {
        return '<span><i class="lv' + i + '"></i>' + esc(S.LEVELS[i].n) + ' <b class="tnum">' + n + '</b></span>';
      }).join("") + '</div>' +
      '<p class="small muted" style="margin:10px 0 0">„Gemeistert“ heißt: mindestens drei Wochen Abstand bis zur nächsten Wiederholung.</p></section>';

    var secDays = '<section class="card"><div class="eyebrow">Letzte 14 Tage</div>' +
      '<div class="days" style="margin-top:12px">' + s.d14.map(function (d) {
        var h = d.items ? Math.max(4, Math.round(d.items * 100 / maxItems)) : 3;
        return '<div class="d" title="' + esc(d.date) + ': ' + d.items + ' Aufgaben"><i class="' + (d.items ? "" : "zero") + '" style="height:' + h + '%"></i><small>' + esc(d.label[0]) + '</small></div>';
      }).join("") + '</div>' +
      '<p class="small muted" style="margin:10px 0 0">' + (s.d14.some(function (d) { return d.items; }) ? 'Bester Tag: ' + maxItems + ' ' + plural(maxItems, "Aufgabe", "Aufgaben") + '.' : 'Noch keine Übungen in den letzten 14 Tagen.') + '</p></section>';

    var sn2 = s.sent;
    var secSent = '<section class="card"><div class="eyebrow">Satzbau</div>' +
      '<div class="row" style="margin-top:10px;gap:16px"><div><div style="font-family:Newsreader,serif;font-size:30px;font-weight:600" class="tnum">' + sn2.seen + '</div>' +
      '<div class="small muted">von ' + sn2.total + ' Sätzen geübt</div></div>' +
      '<div style="flex:1 1 auto"><div class="bar"><i style="width:' + Math.round(sn2.seen * 100 / Math.max(1, sn2.total)) + '%"></i></div>' +
      '<div class="small muted" style="margin-top:6px">' + sn2.mastered + ' sitzen langfristig · ' + sn2.ok + ' richtig gebaut</div></div></div></section>';

    var vst = S.verbStats();
    var secVerbs = '<section class="card"><div class="eyebrow">Unregelmäßige Verben</div>' +
      '<div class="row" style="margin-top:10px;gap:16px"><div><div style="font-family:Newsreader,serif;font-size:30px;font-weight:600" class="tnum">' + vst.seen + '</div>' +
      '<div class="small muted">von ' + vst.total + ' Verben geübt</div></div>' +
      '<div style="flex:1 1 auto"><div class="bar"><i style="width:' + Math.round(vst.seen * 100 / Math.max(1, vst.total)) + '%"></i></div>' +
      '<div class="small muted" style="margin-top:6px">' + vst.mastered + ' sitzen langfristig</div></div></div>' +
      '<button class="btn ghost" data-act="verblist" style="margin-top:10px">Verbenliste öffnen</button></section>';

    /* Einheiten nach Gruppen: Schulbuch (Headlight 2), Klassen 6–8, Eigene Listen bzw. Business Basis bis Redewendungen; je Gruppe nach Lernstand sortiert */
    var bizT = st.settings.track === "business";
    var ORDER = ["Headlight 2", "6", "7", "8", "Basis", "Aufbau", "Profi", "Smalltalk", "Redewendungen", "0"], byK = {}, ks = [];
    s.perUnit.forEach(function (u) { var k = String(u.k); if (!byK[k]) { byK[k] = []; ks.push(k); } byK[k].push(u); });
    ks.sort(function (a, b) { var ia = ORDER.indexOf(a), ib = ORDER.indexOf(b); return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib); });
    var state3 = function (u) { return u.seen === 0 ? 1 : u.sure < u.total ? 0 : 2; };   // 0 angefangen, 1 neu, 2 gefestigt
    var behindRow = function (u) {
      var pc = Math.round(u.sure * 100 / Math.max(1, u.total)), cur = state3(u), tag = cur === 1 ? "noch nicht angefangen · " + u.total + " Wörter" : u.seen + " von " + u.total + " geübt · " + u.sure + " sicher" + (cur === 2 ? " ✓" : "");
      return '<div class="mission"><div class="txt"><div class="small" style="font-weight:600">' + esc(u.icon + " " + u.title.replace(/^Headlight 2 · /, "")) + '</div>' +
        '<div class="bar"><i style="width:' + pc + '%"></i></div>' +
        '<div class="small muted" style="margin-top:2px">' + tag + '</div></div><span class="pill tnum nowrap">' + pc + '%</span>' +
        '<button class="btn soft" data-act="start" data-unit="' + esc(u.id) + '" data-min="5" aria-label="' + esc(u.title) + ' üben">Üben</button></div>';
    };
    var secBehind = '<section class="card"><div class="eyebrow">' + (bizT ? "Business English" : "Schule") + ' · Einheiten nach Gruppen</div>' +
      '<p class="small muted" style="margin:4px 0 6px">Tippe eine Gruppe an. Innerhalb der Gruppe stehen zuerst die angefangenen, noch nicht gefestigten Einheiten (nach Anteil sicherer Wörter, Stufe „sicher“ oder höher), dann die noch nicht begonnenen, zuletzt die gefestigten.</p>' +
      ks.map(function (k, gi) {
        var us = byK[k].slice().sort(function (a, b) { return (state3(a) - state3(b)) || ((a.sure / a.total) - (b.sure / b.total)); });
        var tot = 0, sure = 0, seen = 0, ids = []; us.forEach(function (u) { tot += u.total; sure += u.sure; seen += u.seen; ids.push(u.id); });
        var title = k === "0" ? "✏️ Eigene Vokabeln" : (k === "Headlight 2" ? "📕 Headlight 2 (Schulbuch)" : groupLabel(/^\d+$/.test(k) ? +k : k)), pc = Math.round(sure * 100 / Math.max(1, tot));
        var open = gi === 0 || (seen > 0 && sure < tot);
        return '<details class="grp"' + (open ? " open" : "") + '><summary><span class="chev">▸</span><span style="flex:1 1 auto;min-width:0"><b>' + esc(title) + '</b>' +
          '<span class="small muted" style="display:block">' + us.length + ' ' + plural(us.length, "Einheit", "Einheiten") + ' · ' + pc + ' % sicher · ' + seen + ' von ' + tot + ' Wörtern geübt</span></span></summary>' +
          '<div class="bar" style="margin:4px 0 8px"><i style="width:' + pc + '%"></i></div>' +
          '<button class="btn soft wide" data-act="start" data-scope="' + esc(ids.join(",")) + '" data-min="5" style="margin-bottom:6px">Gruppe üben (5 Min.)</button>' +
          us.map(behindRow).join("") + '</details>';
      }).join("") + '</section>';
    var secOverview = '<section class="card"><div class="eyebrow">Lernstand im Überblick</div>' +
      '<div class="tiles4" style="margin-top:10px">' +
      '<div class="kpi"><b class="tnum">' + Math.round(st.totals.sec / 60) + '</b><span>Minuten gesamt</span></div>' +
      '<div class="kpi"><b class="tnum">' + st.totals.items + '</b><span>Aufgaben</span></div>' +
      '<div class="kpi"><b class="tnum">' + s.acc + '%</b><span>richtig</span></div>' +
      '<div class="kpi"><b class="tnum">' + s.boxSize + '</b><span>in der Fehlerkartei</span></div>' +
      '<div class="kpi"><b class="tnum">' + s.sent.seen + '/' + s.sent.total + '</b><span>Sätze geübt</span></div>' +
      '<div class="kpi"><b class="tnum">' + s.dist[4] + '</b><span>Wörter gemeistert</span></div></div></section>';
    var secBox = '<section class="card"><div class="eyebrow">Fehlerkartei</div>' +
      '<p style="margin:8px 0 0"><b class="tnum">' + s.boxSize + '</b> ' + plural(s.boxSize, "Wort macht", "Wörter machen") + ' noch Probleme. Sie kommen automatisch häufiger dran.</p>' +
      (s.boxSize ? '<button class="btn soft wide" data-act="start" data-mode="box" data-min="5" style="margin-top:12px">Fehlerkartei üben</button>' : '') + '</section>';
    var html = '<div class="stack"><div class="row" style="gap:8px"><span class="pill">' + (bizT ? "💼 Business English" : "🎒 Schule") + '</span><span class="small muted">Fortschritt in diesem Lernbereich</span></div>' + segBar("stats", statsSeg, [["ueb", "Übersicht"], ["woerter", "Wörter"], ["verlauf", "Verlauf"]]);
    if (statsSeg === "woerter") html += secDist + wordListCard() + secBox + secVerbs;
    else if (statsSeg === "verlauf") html += weekPlanCard() + parentCards() + secDays + secSent;
    else html += secTiles + secDist + secOverview + secBehind;
    view.innerHTML = html + '</div>';
    var ws = $("#wSearch");
    if (ws) ws.addEventListener("input", function () { wQuery = ws.value; wMax = 40; $("#wList").innerHTML = wordListHtml(); });
  }

  /* ================= SHOP & ABZEICHEN ================= */
  function viewShop() {
    var st = S.state, html = '<div class="stack">';
    html += '<div class="row" style="align-items:center"><h1 style="font-size:22px;flex:1 1 auto">Shop &amp; Abzeichen</h1><span class="pill tnum nowrap">🪙 ' + st.coins + '</span></div>';
    html += segBar("shop", shopSeg, [["shop", "Shop"], ["sammlung", "Sammlung"], ["abzeichen", "Abzeichen"], ["raenge", "Ränge"]]);
    if (shopSeg === "sammlung") html += albumCard() + albumCard("fn") + stickerBook() + stickerBook("fn");
    else if (shopSeg === "abzeichen") {
      html += '<section class="card"><div class="eyebrow">Abzeichen · ' + st.badges.length + ' von ' + S.BADGES.length + '</div><div class="badges" style="margin-top:10px">' +
        S.BADGES.map(function (b) {
          var has = st.badges.indexOf(b.id) >= 0;
          return '<div class="badge' + (has ? "" : " off") + '" title="' + esc(b.d) + '"><div class="g">' + (has ? "🏅" : "🔒") + '</div><b>' + esc(b.n) + '</b></div>';
        }).join("") + '</div></section>';
    }
    else if (shopSeg === "raenge") html += ranksCard();
    else html += wishCard() + coinsCard() + shopCard();
    view.innerHTML = html + '</div>';
  }

  /* ================= ELTERN / LEHRER ================= */
  function playersCard() {
    var d = S.profiles();
    var h = '<section class="card"><div class="eyebrow">Spieler</div>' +
      '<p class="small muted" style="margin:8px 0 10px">Jeder Spieler hat einen eigenen Lernstand auf diesem Gerät. Wer verbunden ist, wird zusätzlich auf dem Server gesichert.</p><div class="stack" style="gap:8px">';
    d.list.forEach(function (x) {
      var on = x.id === d.active;
      h += '<div class="row wrap" style="gap:8px;align-items:center"><b style="flex:1">' + (on ? "● " : "") + esc(x.name) + '</b>' +
        (on ? '<button class="btn ghost" data-act="pren" data-id="' + x.id + '">Umbenennen</button>' : '<button class="btn" data-act="pswitch" data-id="' + x.id + '">Wechseln</button>') +
        (d.list.length > 1 ? '<button class="btn ghost" data-act="pdel" data-id="' + x.id + '">Löschen</button>' : '') + '</div>';
    });
    return h + '</div><div class="row wrap" style="margin-top:12px;gap:8px"><input id="newPlayer" placeholder="Name des neuen Spielers" style="flex:1;min-width:140px">' +
      '<button class="btn" data-act="padd">Spieler anlegen</button></div></section>';
  }
  function pickPlayer() {
    var d = S.profiles();
    if (d.list.length < 2) return;
    try { if (global.sessionStorage.getItem("wordy.picked")) return; } catch (e) {}
    var ov = document.createElement("div");
    ov.style.cssText = "position:fixed;inset:0;z-index:80;background:var(--bg);display:flex;align-items:center;justify-content:center;padding:16px";
    var h = '<div class="card" style="max-width:380px;width:100%"><div class="eyebrow">Wer lernt heute?</div><div class="stack" style="margin-top:12px;gap:10px">';
    d.list.forEach(function (x) { h += '<button class="btn" data-pick="' + x.id + '" style="font-size:1.1rem">' + esc(x.name) + '</button>'; });
    ov.innerHTML = h + '</div></div>';
    ov.addEventListener("click", function (e) {
      var b = e.target.closest("[data-pick]"); if (!b) return;
      S.switchProfile(b.getAttribute("data-pick"));
      try { global.sessionStorage.setItem("wordy.picked", "1"); } catch (er) {}
      global.location.reload();
    });
    document.body.appendChild(ov);
  }

  /* ---------- How-to (eingeklappt, ganz oben im Setup) ---------- */
  function howToCard() {
    var steps = [
      ["🚀", "Loslegen", "Auf <b>Start</b> schlägt Wordy dir die beste Runde für heute vor (zum Beispiel Fehlerkartei oder Lernplan). Mit <b>Los geht\'s</b> startest du, darunter stellst du die Dauer ein."],
      ["🎮", "Üben", "Unter <b>Üben → Spielmodi</b> wählst du selbst: <b>Lernen</b> (Daily Challenge, Neue Wörter, Fehlerkartei, Sätze, Verben), <b>Spielen</b> (die Arena) oder <b>Gezielt üben</b> (nur Hören, Tippen, Lücken oder Zuordnen)."],
      ["📚", "Einheiten", "Unter <b>Lernen → Was lernen?</b> wählst du Schule oder Business, Schuljahr oder Stufe und öffnest eine Einheit. Dort kannst du nur diese Einheit üben, anhören oder gezielt eine Aufgabenform trainieren."],
      ["🧩", "Aufgaben", "Wortkarte, Auswahl, Hören, Lückentext, Schreiben, Zuordnen und Satzbau. Eine falsche Antwort kostet ein Herz (unter Setup abschaltbar) und kommt später wieder."],
      ["✍️", "Unregelmäßige Verben", "<b>Üben → Spielmodi → Verben</b> (Einführung, Lückenaufgabe, Tippen). Die Verbenliste mit Beispielsätzen findest du unter <b>Üben → Lernbereich</b>."],
      ["⚡", "Arena", "Vier Zeitmodi unter <b>Spielen</b>: <b>Match-Rausch</b> (Paare in 60 Sekunden), <b>Blitzrunde</b> (Zeit sammeln), <b>Letztes Herz</b> (ein Fehler beendet), <b>Fehlerjagd</b> (Kartei leeren)."],
      ["📈", "Fortschritt", "Drei Ansichten: <b>Übersicht</b> (Wo stehe ich?), <b>Wörter</b> (schwierigste Wörter, Fehlerkartei, Verben) und <b>Verlauf</b> (die letzten 14 Tage, Satzbau)."],
      ["🪙", "Münzen & Shop", "Münzen gibt es für Fortschritt, Missionen und das Tagesziel. Im <b>Shop</b> kaufst du Figuren, Rahmen, Farben und mehr. Mit dem ⭐ setzt du einen Wunsch, auf den du sparst."],
      ["⭐", "Sammlung & Abzeichen", "<b>Shop → Sammlung</b>: Tier-Album und Stickerbuch (Sticker kaufst du im Shop; antippen klebt sie auf, so viele wie du Plätze freigeschaltet hast, bis zu zehn). <b>Abzeichen</b> und <b>Ränge</b> haben eigene Reiter im Shop."],
      ["⚙️", "Setup", "Das Zahnrad ⚙️ oben rechts: Spieler wechseln, Tagesziel und Ton einstellen, Auto-Save, eigene Vokabeln und Updates."]
    ];    return '<details class="how"><summary class="how-sum"><span class="chev" aria-hidden="true">▸</span><span style="flex:1 1 auto"><b>So funktioniert Wordy</b>' +
      '<span class="small muted" style="display:block">Kurz erklärt in zehn Schritten</span></span></summary>' +
      '<ol class="how-list">' + steps.map(function (x) {
        return '<li><span class="hi">' + x[0] + '</span><div><b>' + x[1] + '</b><div class="small muted">' + x[2] + '</div></div></li>';
      }).join("") + '</ol></details>';
  }
  /* Feedback im Profil: Formular + eigene Rückmeldungen mit Status und Antwort */
  var fbKind = "idea", FB_LBL = { idea: "💡 Idee", bug: "🐞 Fehler", praise: "👍 Lob", question: "❓ Frage" }, FB_ST = { neu: "neu", in_arbeit: "in Arbeit", erledigt: "erledigt" };
  function fbDraw() {
    var el = $("#fbApp"); if (!el) return;
    el.innerHTML = '<div class="row wrap" style="gap:6px">' + Object.keys(FB_LBL).map(function (k) { return '<button class="chip" data-act="fbkind" data-k="' + k + '" aria-pressed="' + (fbKind === k) + '">' + FB_LBL[k] + '</button>'; }).join("") + '</div>' +
      '<textarea id="fbTxt" rows="4" maxlength="2000" style="width:100%;margin-top:10px" placeholder="Was sollen wir wissen oder verbessern?"></textarea>' +
      '<p class="small muted" style="margin:4px 0 0">Bitte keine Namen, Adressen oder Telefonnummern schreiben.</p>' +
      '<button class="btn wide" data-act="fbsend" style="margin-top:8px">Senden</button><div id="fbMsg" class="small muted" style="margin-top:6px"></div><div id="fbList" style="margin-top:10px"></div>';
    window.WordySync.fbList().then(function (l) {
      var box = $("#fbList"); if (!box || !l.length) return;
      box.innerHTML = '<div class="eyebrow">Meine Rückmeldungen</div>' + l.map(function (x) {
        return '<div style="padding:8px 0;border-top:1px solid var(--line)"><div class="row"><b class="small" style="flex:1 1 auto">' + (FB_LBL[x.kind] || x.kind) + ' · ' + new Date(x.created).toLocaleDateString("de-DE") + '</b><span class="pill">' + (FB_ST[x.status] || x.status) + '</span></div>' +
          '<div style="margin-top:4px;white-space:pre-wrap">' + esc(x.text) + '</div>' + (x.reply ? '<div class="small" style="margin-top:6px;padding:8px 10px;border-radius:8px;background:var(--card-2)"><b>Antwort:</b> ' + esc(x.reply) + '</div>' : "") + '</div>';
      }).join("");
    });
  }
  function viewParent() {
    var st = S.state, s = S.stats();
    var html = '<div class="stack">';
    html += profileCard() + howToCard();
    function unCard(h) { return h.replace(/^<section class="card"[^>]*>(<div class="eyebrow"[^>]*>[^<]*<\/div>)?/, "").replace(/<\/section>$/, ""); }
    function fold(key, icon, title, sub, inner) {
      return '<details class="fold" data-f="' + key + '"' + (openFolds[key] ? " open" : "") + '><summary><span class="chev">▸</span><span style="flex:1 1 auto;min-width:0"><b>' + icon + " " + title + '</b>' +
        (sub ? '<span class="small muted" style="display:block">' + sub + '</span>' : "") + '</span></summary><div class="fbody">' + inner + '</div></details>';
    }
    html += fold("spieler", "👤", "Spieler", "Wer lernt", unCard(playersCard()));
    html += fold("lernen", "🎓", "Lernen", "Tagesziel, neue Wörter, Herzen",
      '<label class="row" style="margin-top:4px"><span style="flex:1 1 auto">Tagesziel</span>' +
      '<select id="setGoal" style="width:auto">' + [5, 10, 15, 20, 30].map(function (m) {
        return '<option value="' + m + '"' + (st.settings.goalMin === m ? " selected" : "") + '>' + m + ' Minuten</option>';
      }).join("") + '</select></label>' +
      '<label class="row" style="margin-top:10px"><span style="flex:1 1 auto">Neue Wörter pro Tag</span>' +
      '<select id="setNew" style="width:auto">' + [6, 12, 20, 30].map(function (m) {
        return '<option value="' + m + '"' + (st.settings.newPerDay === m ? " selected" : "") + '>' + m + '</option>';
      }).join("") + '</select></label>' +
      '<label class="row" style="margin-top:10px"><span style="flex:1 1 auto">Unregelmäßige Verben<br><span class="small muted">Bei „Nur Simple Past“ wird die 3. Form (Past Participle) nicht gezeigt und nicht abgefragt</span></span>' +
      '<select id="setVForms" style="width:auto"><option value="all"' + (!vPastOnly() ? " selected" : "") + '>Alle drei Formen</option><option value="past"' + (vPastOnly() ? " selected" : "") + '>Nur Simple Past</option></select></label>' +
      '<label class="row" style="margin-top:10px"><span style="flex:1 1 auto">Pause nach der Antwort<br><span class="small muted">Die Lösung bleibt kurz stehen. Bei Fehlern wird sie vorgelesen und das Wort einmal abgeschrieben</span></span>' +
      '<input type="checkbox" id="setPause" ' + (st.settings.pause !== false ? "checked" : "") + ' style="width:auto"></label>' +
      '<label class="row" style="margin-top:10px"><span style="flex:1 1 auto">Lernpfad auf dem Start-Tab<br><span class="small muted">Stationen und Truhen. Aus = nur die Empfehlung</span></span>' +
      '<input type="checkbox" id="setPathOn" ' + (st.settings.pathOn !== false ? "checked" : "") + ' style="width:auto"></label>' +
      '<label class="row" style="margin-top:10px"><span style="flex:1 1 auto">Arena als Tagesmission<br><span class="small muted">Ab und zu ist eine Arena-Runde eine der drei Tagesmissionen</span></span>' +
      '<input type="checkbox" id="setArenaM" ' + (st.settings.arenaMissions !== false ? "checked" : "") + ' style="width:auto"></label>' +
      '<label class="row" style="margin-top:10px"><span style="flex:1 1 auto">Herzen benutzen<br><span class="small muted">Aus = Üben ohne Abbruch</span></span>' +
      '<input type="checkbox" id="setHearts" ' + (st.settings.hearts ? "checked" : "") + ' style="width:auto"></label>' +
      '<p class="small muted" style="margin:10px 0 0">Gelernt wird als <b>' + esc(playerName()) + '</b>. Den Namen änderst du unter „Spieler“.</p>');
    html += fold("design", "🎨", "Design", "Aussehen von Wordy: " + ((global.VTC.DESIGNS.filter(function (d) { return d[0] === (st.settings.design || "gold"); })[0] || [])[1] || ""), unCard(designCard()));
    html += fold("ton", "🔊", "Ton &amp; Aussehen", "Vorlesen, Hell oder Dunkel",
      '<label class="row" style="margin-top:4px"><span style="flex:1 1 auto">Aussprache vorlesen<br><span class="small muted">Nutzt die englische Stimme des Geräts</span></span>' +
      '<input type="checkbox" id="setAudio" ' + (st.settings.audio ? "checked" : "") + ' style="width:auto"></label>' +
      '<div id="pushBox" style="margin-top:10px"></div>' +
      '<div class="row" style="margin-top:10px"><span style="flex:1 1 auto">Neuheiten-Wolke<br><span class="small muted">Zeigt die Ankündigung neuer Spiele auf der Startseite wieder an</span></span><button class="chip" id="setCloud">Wieder anzeigen</button></div>' +
      '<label class="row" style="margin-top:10px"><span style="flex:1 1 auto">Bildschirm anlassen<br><span class="small muted">Das Handy dunkelt nicht ab, solange Wordy offen ist</span></span>' +
      '<input type="checkbox" id="setWake" ' + (st.settings.wake !== false ? "checked" : "") + ' style="width:auto"></label>' +
      '<label class="row" style="margin-top:10px"><span style="flex:1 1 auto">Erscheinungsbild<br><span class="small muted">Automatisch folgt der Einstellung des Geräts</span></span>' +
      '<select id="setMode" style="width:auto">' + [["auto", "Automatisch"], ["light", "Hell"], ["dark", "Dunkel"]].map(function (o) {
        return '<option value="' + o[0] + '"' + ((st.settings.themeMode || "auto") === o[0] ? " selected" : "") + '>' + o[1] + '</option>';
      }).join("") + '</select></label>' +
      '<label class="row" style="margin-top:10px"><span style="flex:1 1 auto">Vorlauf beim Vorlesen<br><span class="small muted">Länger, wenn der Anfang eines Satzes fehlt. „Stimme testen“ zeigt die Wirkung.</span></span>' +
      '<select id="setLead" style="width:auto">' + [[0, "Aus"], [500, "Kurz"], [1000, "Mittel"], [1600, "Lang"]].map(function (o) {
        return '<option value="' + o[0] + '"' + (speechLead() === o[0] ? " selected" : "") + '>' + o[1] + '</option>';
      }).join("") + '</select></label>' +
      '<label class="row" style="margin-top:10px"><span style="flex:1 1 auto">Tempo bei „Alle vorlesen“<br><span class="small muted">Sprechgeschwindigkeit und Pause zwischen den Wörtern</span></span>' +
      '<select id="setPace" style="width:auto">' + [["fast", "Schnell"], ["mid", "Mittel"], ["slow", "Langsam"]].map(function (o) {
        return '<option value="' + o[0] + '"' + (st.settings.readPace === o[0] || (!st.settings.readPace && o[0] === "mid") ? " selected" : "") + '>' + o[1] + '</option>';
      }).join("") + '</select></label>' +
      '<label class="row" style="margin-top:10px"><span style="flex:1 1 auto">Erzählerstimme (Erklärfilme)<br><span class="small muted">Frau: warm, Mann: tief und ruhig. Gibt es eine aufgenommene Stimme, wird sie genutzt.</span></span>' +
      '<select id="setNarr" style="width:auto">' + [["auto", "Automatisch"], ["f", "Frau"], ["m", "Mann"], ["dev", "Nur Gerätestimme"]].map(function (o) {
        return '<option value="' + o[0] + '"' + ((st.settings.narrator || "auto") === o[0] ? " selected" : "") + '>' + o[1] + '</option>';
      }).join("") + '</select></label>' +
      '<label class="row" style="margin-top:10px"><span style="flex:1 1 auto">Stimme auf diesem Gerät<br><span class="small muted">Automatisch nimmt die natürlichste deutsche Stimme</span></span>' +
      '<select id="setNarrV" style="width:auto;max-width:48%"><option value="">Automatisch</option>' + deVoices().sort(function (a, b) { return scoreVoice(b) - scoreVoice(a); }).map(function (v) {
        return '<option value="' + esc(v.voiceURI) + '"' + (st.settings.narratorVoice === v.voiceURI ? " selected" : "") + '>' + esc(v.name.replace(/^(Microsoft|Google) /, "")) + '</option>';
      }).join("") + '</select></label>' +
      '<button class="btn ghost" data-act="narrtest" style="margin-top:10px">🎬 Erzähler testen</button>' +
      '<button class="btn ghost" data-act="voicetest" style="margin-top:10px">🔊 Stimme testen</button>');
    html += fold("save", "💾", "Auto-Save / Lernfortschritt", "Server, dieses Gerät, manuell sichern", unCard(saveCard()));
    var customCard = '<section class="card"><div class="eyebrow">Eigene Vokabelliste importieren</div>' +
      '<p class="small muted" style="margin:6px 0 10px">Eine Zeile pro Wort: <code>englisch;deutsch;beispielsatz</code>. Semikolon, Komma oder Tabulator funktionieren.</p>' +
      '<input id="csvTitle" placeholder="Name der Liste, z. B. Access 7 Unit 3" style="margin-bottom:8px">' +
      '<textarea id="csvText" rows="4" placeholder="library;die Bibliothek;I borrowed a book from the library."></textarea>' +
      '<div class="row wrap" style="margin-top:10px;gap:8px"><button class="btn" data-act="csvimport">Liste hinzufügen</button>' +
      '<label class="btn ghost" style="position:relative;overflow:hidden">Datei wählen<input type="file" id="csvFile" accept=".csv,.txt" style="position:absolute;inset:0;opacity:0;cursor:pointer"></label></div>' +
      (st.custom.length ? '<div style="margin-top:12px">' + st.custom.map(function (u) {
        return '<div class="shopitem"><span style="flex:1 1 auto"><b class="small">' + esc(u.title) + '</b><br><span class="small muted">' + u.words.length + ' Wörter</span></span>' +
          '<button class="chip" data-act="delcustom" data-id="' + esc(u.id) + '">entfernen</button></div>';
      }).join("") + '</div>' : "") + '</section>';
    html += fold("eigene", "➕", "Eigene Vokabeln", st.custom.length ? st.custom.length + " " + plural(st.custom.length, "Liste", "Listen") : "Eigene Wortlisten einfügen", unCard(customCard));
    var aboutHtml = '<div class="small muted" style="margin:10px 0 0;text-align:center;line-height:1.6"><b>Wordy · Version ' + esc(global.WORDY_VERSION || "–") + '</b>' +
      '<br><span style="font-size:11px">Build ' + esc(global.WORDY_BUILD || "lokal") + '</span>' +
      '<br>© ' + new Date().getFullYear() + ' Magnus, Pummel &amp; Christian</div>' +
      '<div class="row wrap" style="gap:8px;justify-content:center;margin-top:10px"><button class="btn ghost" data-act="checkupdate">Nach Updates suchen</button>' +
      '<button class="btn ghost" data-act="clearcache" title="Lernstand bleibt erhalten">App-Cache leeren</button></div>';
    if (window.WordySync && window.WordySync.connected()) html += fold("feedback", "💬", "Feedback", "Idee, Fehler oder Lob an das Wordy-Team", '<div id="fbApp"><p class="small muted">Lade …</p></div>');
    html += fold("about", "ℹ️", "Über Wordy", "Version " + esc(global.WORDY_VERSION || "–") + ", Updates, Installieren", unCard(installCard()) + '<hr class="sep" style="margin:14px 0">' + aboutHtml +
      '<hr class="sep" style="margin:14px 0"><div class="eyebrow">Datenschutz</div><p class="small muted" style="margin:6px 0 8px">Wordy speichert den Lernstand nur auf diesem Gerät. Nur wenn deine Eltern es verbinden, geht der Lernfortschritt an den Wordy-Server. Keine Werbung, kein Tracking.</p><a class="chip" target="_blank" rel="noopener" href="' + esc(((global.WordySync && global.WordySync.info().url) || "https://track.wordy.explusmore.com").replace(/\/+$/, "") + "/f/datenschutz") + '">Datenschutzerklärung lesen</a>');
    html += '</div>';
    view.innerHTML = html;
    $$("details.fold").forEach(function (d) { d.addEventListener("toggle", function () { openFolds[d.getAttribute("data-f")] = d.open; if (d.open && d.getAttribute("data-f") === "feedback") fbDraw(); }); });
    if (openFolds.feedback) fbDraw();

    $("#setGoal").onchange = function () { st.settings.goalMin = +this.value; S.save(true); renderHeader(); };
    $("#setNew").onchange = function () { st.settings.newPerDay = +this.value; S.save(true); };
    $("#setVForms").onchange = function () { st.settings.verbForms = this.value === "past" ? "past" : "all"; S.save(true); };
    $("#setAudio").onchange = function () { st.settings.audio = this.checked; S.save(true); };
    pushInit();
    $("#setCloud").onclick = function () { var pf2 = st.profile; pf2.cloudSeen = {}; pf2.cloudForce = {}; NEWS.forEach(function (n) { pf2.cloudForce[n.id] = 1; }); S.save(true); toast("Die Wolke erscheint wieder auf der Startseite."); };
    $("#setWake").onchange = function () { st.settings.wake = this.checked; S.save(true); wakeSync(); };
    if ($("#setPathOn")) $("#setPathOn").onchange = function () { st.settings.pathOn = this.checked; S.save(true); };
    if ($("#setArenaM")) $("#setArenaM").onchange = function () { st.settings.arenaMissions = this.checked; S.save(true); };
    if ($("#setPause")) $("#setPause").onchange = function () { st.settings.pause = this.checked; S.save(true); };
    $("#setMode").onchange = function () { st.settings.themeMode = this.value; S.save(true); renderHeader(); };
    $("#setPace").onchange = function () { st.settings.readPace = this.value; S.save(true); };
    $("#setNarr").onchange = function () { st.settings.narrator = this.value; st.settings.narratorVoice = ""; S.save(true); render(); };
    $("#setNarrV").onchange = function () { st.settings.narratorVoice = this.value; S.save(true); };
    $("#setLead").onchange = function () { st.settings.speechLead = +this.value; S.save(true); };
    $("#setHearts").onchange = function () { st.settings.hearts = this.checked; if (this.checked === false) st.hearts = 5; S.save(true); renderHeader(); };
    $("#csvFile").onchange = function () {
      var f = this.files && this.files[0]; if (!f) return;
      var fr = new FileReader();
      fr.onload = function () { $("#csvText").value = String(fr.result).slice(0, 200000); if (!$("#csvTitle").value) $("#csvTitle").value = f.name.replace(/\.[^.]+$/, ""); toast("Datei gelesen – jetzt „Liste hinzufügen“."); };
      fr.readAsText(f);
    };
  }

  /* ================= SESSION ================= */
  var SS = null;
  function pickType(w, focus) {
    var lv = S.levelOf(w.id), c;
    if (focus) {   // gezielt eine Aufgabenform üben
      var pl = w.en.replace(/^to\s+/, "");
      if (focus === "listen" && audioAvailable()) return "listen";
      if (focus === "type" && pl.length <= 24) return pl.length <= 16 && Math.random() < 0.35 ? "spell" : "type";
      if (focus === "gap" && w.gap) return "gap";
      if (focus === "match") return "match";
    }
    if (lv <= 1) c = ["mc_en_de", "mc_de_en", "listen", "odd"];
    else if (lv === 2) c = ["mc_de_en", "gap", "match", "listen", "spell", "odd"];
    else c = ["type", "spell", "gap", "match", "type"];
    c = c.filter(function (t) { return t !== "gap" || w.gap; });
    var plain = w.en.replace(/^to\s+/, "");
    if (plain.length > 16) c = c.filter(function (t) { return t !== "spell"; });
    if (plain.length > 24) c = c.filter(function (t) { return t !== "type"; });
    if (!audioAvailable()) c = c.filter(function (t) { return t !== "listen"; });
    if (!c.length) c = ["mc_en_de"];
    return c[Math.floor(Math.random() * c.length)];
  }
  function distractors(w, key, n) {
    var pool = S.words().filter(function (x) { return x.id !== w.id && x[key] !== w[key]; });
    var same = pool.filter(function (x) { return x.unit === w.unit; });
    var out = S.shuffle(same).slice(0, n);
    if (out.length < n) out = out.concat(S.shuffle(pool).slice(0, n - out.length));
    var seen = {}; return out.filter(function (x) { if (seen[x[key]]) return false; seen[x[key]] = 1; return true; }).slice(0, n);
  }
  /* ---------- Unregelmäßige Verben: Sätze, Aufgaben ---------- */
  var TENSES = [
    { label: "Infinitiv · Präsens", name: "Simple Present (Präsens)" },
    { label: "Simple Past · Präteritum", name: "Simple Past (Präteritum)" },
    { label: "Past Participle · Partizip Perfekt", name: "Present Perfect (Perfekt)" }
  ];
  function reEsc(x) { return x.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }
  /* Satz mit fett markierter Verbform und unterstrichenem Zeitwort */
  function sentHtml(x, blank) {
    var h = esc(x.en);
    h = h.replace(new RegExp("\\b" + reEsc(esc(x.form)) + "\\b"), blank ? '<u class="vblank">&nbsp;</u>' : "<b class=\"vform\">" + esc(x.form) + "</b>");
    if (x.time) h = h.replace(new RegExp(reEsc(esc(x.time))), "<u class=\"vtime\">" + esc(x.time) + "</u>");
    return h;
  }
  function verbSentCards(v, withDe) {
    return v.s.slice(0, vN()).map(function (x, i) {
      return '<div class="card" style="background:var(--card-2);box-shadow:none;padding:12px 14px">' +
        '<div class="row" style="gap:10px;align-items:center">' + (audioAvailable() ? '<button class="mini-speak" data-act="say" data-text="' + esc(x.en) + '" aria-label="Satz anhören">🔊</button>' : "") +
        '<div class="eyebrow" style="flex:1">' + TENSES[i].label + '</div></div>' +
        '<p class="vsp">' + sentHtml(x) + '</p>' +
        '<p class="small muted" style="margin:0">Zeitwort' + (x.time ? ' „' + esc(x.time) + '“' : "") + ' → ' + TENSES[i].name + '</p>' +
        (withDe ? '<p class="small muted" style="margin:2px 0 0">' + esc(x.de) + '</p>' : "") + '</div>';
    }).join("");
  }
  /* Verben laufen durch dieselben Anzeige- und Wertungsfunktionen wie Wörter; dafür ein Wort-förmiges Objekt */
  function verbWord(v) {
    var lines = v.s.slice(0, vN()).map(function (x) {
      return '<span class="cmp">' + (audioAvailable() ? '<button class="mini-speak" data-act="say" data-text="' + esc(x.en) + '" aria-label="Satz anhören">🔊</button>' : "") + sentHtml(x) + '</span>';
    }).join("");
    return { id: v.id, en: vPastOnly() ? v.inf + ", " + vFirst(v.past) : v.en, de: v.de + (v.alt ? " (alle Formen: " + v.past + (vPastOnly() ? "" : " · " + v.pp) + ")" : ""), ex: v.ex, exHtml: lines };
  }
  /* Unregelmäßige Verben als Lückenaufgabe: Form wählen, die zum Zeitwort passt */
  function regularForm(inf) {
    if (/^(be|have|do)$/.test(inf)) return null;
    return /e$/.test(inf) ? inf + "d" : /[^aeiou]y$/.test(inf) ? inf.slice(0, -1) + "ied" : inf + "ed";
  }
  function verbGapOptions(v) {
    var seen = {}, opts = [];
    v.s.slice(0, vN()).map(function (x) { return x.form; }).concat([regularForm(v.inf)]).forEach(function (f, i) {
      if (!f || seen[f]) return; seen[f] = 1; opts.push({ label: f, form: f, ok: false });
    });
    return opts;
  }
  function verbGapOk(v) { return verbGapOptions(v).length >= 3; }
  function verbTasks(list, typeOnly) {
    var out = [];
    list.forEach(function (v) {
      var fresh = S.levelOf(v.id) === 0 && !(S.state.w[v.id] && S.state.w[v.id].no);
      var gap = verbGapOk(v);
      if (fresh) out.push({ type: "verbintro", v: v });
      var easy = fresh || S.levelOf(v.id) <= 1 || Math.random() < 0.5;
      out.push(gap && easy && !typeOnly ? { type: "verbgap", v: v, idx: Math.floor(Math.random() * vN()) } : { type: "verb", v: v });
    });
    return out;
  }
  function buildTasks(list, sentOnly, focus) {
    var t = [];
    if (!sentOnly) list.forEach(function (w) {
      if (S.levelOf(w.id) === 0 && !(S.state.w[w.id] && S.state.w[w.id].no)) {
        t.push({ type: "intro", w: w }); t.push({ type: "mc_en_de", w: w, isNew: true });
      } else t.push({ type: pickType(w, focus), w: w });
    });
    if (focus) return t;   // gezielt üben: keine Sätze und Verben einstreuen
    var want = sentOnly ? Math.max(4, list.length) : Math.round(t.length / 8);
    var sents = S.planSentences(want);
    if (sentOnly) return sents.map(function (x) { return { type: "build", s: x }; });
    sents.forEach(function (x, i) {
      var pos = Math.min(t.length, Math.round((i + 1) * t.length / (sents.length + 1)) + 1);
      t.splice(pos, 0, { type: "build", s: x });
    });
    return t;
  }
  /* Wörter für "Gezielt üben": zuerst bekannte, fällige Wörter, die zur Aufgabenform passen */
  function focusList(opts) {
    var n = Math.max(6, S.itemsFor(opts.minutes || 5));
    var base = opts.unit ? S.words().filter(function (w) { return w.unit === opts.unit; }) : S.pools(opts.scope).all;
    var fits = function (w) {
      var pl = w.en.replace(/^to\s+/, "");
      return opts.focus === "gap" ? !!w.gap : opts.focus === "type" ? pl.length <= 24 : opts.focus === "listen" ? audioAvailable() : true;
    };
    var seen = function (w) { var r = S.state.w[w.id]; return S.levelOf(w.id) > 0 || (r && r.no > 0); };
    var ok = base.filter(fits);
    var known = ok.filter(seen).sort(function (a, b) { return (S.state.w[a.id].due || 0) - (S.state.w[b.id].due || 0); });
    var fresh = S.shuffle(ok.filter(function (w) { return !seen(w); }));
    var out = known.slice(0, n);
    if (out.length < Math.min(n, 8)) out = out.concat(fresh.slice(0, Math.min(n, 8) - out.length));
    return S.shuffle(out);
  }
  function startSession(opts) {
    S.rollDay(); S.regenHearts(); lastStartOpts = opts;
    var sentOnly = opts.mode === "sent";
    if (opts.mode === "verbs") {
      var vl = opts.verb ? S.verbs().filter(function (x) { return x.id === opts.verb; })
        : S.planVerbs(Math.max(5, Math.round((opts.minutes || 5) * 60 / 20)), { newMax: 5 });
      if (!vl.length) { toast("Gerade sind keine Verben fällig. Schau später wieder vorbei."); return; }
      SS = {
        tasks: verbTasks(vl, opts.vtype), i: 0, chain: 0, maxChain: 0, items: 0, correct: 0,
        newSeen: 0, boxSolved: 0, mastered: 0, sentOk: 0, start: Date.now(), answered: false,
        retry: [], mode: "verbs", ended: false
      };
      snapStart();
      sessionEl.hidden = false; document.body.style.overflow = "hidden";
      return renderTask();
    }
    var list = opts.mode === "master" ? S.masterList(Math.max(6, S.itemsFor(opts.minutes || 5))) : opts.focus ? focusList(opts) : sentOnly ? S.planSentences(Math.max(5, Math.round((opts.minutes || 5) * 60 / 16))) : S.planSession(opts);
    if (!list.length) { toast(opts.mode === "master" ? "Es gibt noch keine Wörter, die fast sitzen. Übe erst normal weiter." : opts.focus ? "Dafür gibt es gerade keine passenden Wörter. Probier eine andere Form." : sentOnly ? "Alle Sätze dieses Bereichs sind gerade erledigt." : "Für diese Auswahl gibt es gerade nichts zu üben."); return; }
    var tasks = buildTasks(list, sentOnly, opts.mode === "master" ? "type" : opts.focus);
    /* Unregelmäßige Verben: in normalen Schulrunden immer wieder eingestreut */
    if (!sentOnly && !opts.focus && !opts.unit && !opts.scope && opts.mode !== "box" && opts.mode !== "new" && opts.mode !== "master" && S.state.settings.track === "schule") {
      var vs = S.planVerbs(Math.max(1, Math.round(tasks.length / 8)), { mix: true });
      verbTasks(vs).forEach(function (vt, i) {
        var pos = Math.min(tasks.length, Math.round((i + 1) * tasks.length / (vs.length + 1)) + 2);
        tasks.splice(pos, 0, vt);
      });
    }
    if (!tasks.length) { toast("Hier gibt es gerade nichts zu üben."); return; }
    SS = {
      tasks: tasks, i: 0, chain: 0, maxChain: 0, items: 0, correct: 0,
      newSeen: 0, boxSolved: 0, mastered: 0, sentOk: 0, start: Date.now(), answered: false,
      retry: [], mode: opts.mode || "mix", ended: false, planned: list.length, cls: !!opts.cls
    };
    snapStart();
    sessionEl.hidden = false; document.body.style.overflow = "hidden";
    renderTask();
  }
  function startPathStation(id) {
    S.rollDay(); S.regenHearts();
    var st = S.pathStations().filter(function (x) { return x.id === id; })[0]; if (!st) return;
    if (st.gram) { if (global.VTGR) global.VTGR.start(st.gram, { station: st.id }); return; }   // Grammatik-Station: Lektion aus „Lernen › Grammatik“
    if (st.last && startBoss(st)) return;   // Boss-Runde läuft in der Arena
    if (S.state.settings.hearts && S.state.hearts <= 0) { toast("Die Herzen sind alle. Sie füllen sich bald wieder auf."); return; }
    var tasks = pathTasks(st); if (!tasks.length) { toast("Für diese Station gibt es gerade nichts zu üben."); return; }
    SS = { tasks: tasks, i: 0, chain: 0, maxChain: 0, items: 0, correct: 0, newSeen: 0, boxSolved: 0, mastered: 0, sentOk: 0, start: Date.now(), answered: false,
      retry: [], mode: "path", ended: false, planned: tasks.length, station: st, curStep: 1 };
    snapStart(); sessionEl.hidden = false; document.body.style.overflow = "hidden"; renderTask();
  }
  /* Stand zu Rundenbeginn, damit das Finale zeigen kann, was die Runde gebracht hat */
  function snapStart() { SS.xp0 = S.state.xp; SS.coins0 = S.state.coins; if (window.WordySync) window.WordySync.ctx = { mode: SS.mode || "mix" }; }
  function star(on, i) {
    return '<svg viewBox="0 0 24 24" class="fin-star' + (on ? " on" : "") + '" style="--i:' + i + '" aria-hidden="true"><path d="M12 2.2l2.9 6.2 6.8.8-5 4.7 1.3 6.7L12 17.2 6 20.6l1.3-6.7-5-4.7 6.8-.8z"/></svg>';
  }
  function endSession(reason) {
    if (!SS || SS.ended) return;
    SS.ended = true;
    var sec = Math.round((Date.now() - SS.start) / 1000);
    if (reason === "done" && SS.planned) S.recordPace(sec, SS.planned);
    var rw = S.finishSession({ items: SS.items, correct: SS.correct, sec: sec, maxChain: SS.maxChain, newSeen: SS.newSeen, deep: SS.deep || 0, daily: SS.mode === "mix" || !!SS.cls, boxSolved: SS.boxSolved, mastered: SS.mastered, sentOk: SS.sentOk, complete: reason === "done" });
    if (reason === "done" && lastStartOpts) planComplete({ act: "start", mode: lastStartOpts.mode || (lastStartOpts.focus ? "focus" : "mix"), unit: lastStartOpts.unit || null, focus: lastStartOpts.focus || null });
    var st = S.state, acc = SS.items ? Math.round(SS.correct * 100 / SS.items) : 0;
    var done = reason === "done";   // nur komplett gemachte Runden zählen als geschafft (Challenge, Münzen, Sterne)
    var head = reason === "hearts" ? "Kurze Pause" : !done ? "Runde beendet" : SS.correct === SS.items && SS.items > 3 ? "Fehlerfrei!" : "Runde geschafft";
    var msg = reason === "hearts"
      ? "Die Herzen sind alle. Dein Fortschritt ist gespeichert – die Herzen füllen sich von selbst wieder auf. Die Runde zählt nicht als geschafft."
      : !done ? "Abgebrochen: Deine Antworten und die XP bleiben, aber die Runde zählt nicht als geschafft. Für Challenge, Bonus und Münzen musst du sie zu Ende spielen."
      : acc >= 90 ? "Das saß. Weiter so." : acc >= 70 ? "Solide Runde. Die Wackelkandidaten kommen bald wieder." : "Schwierige Wörter dabei – die landen jetzt in der Fehlerkartei und kommen häufiger dran.";
    var good = done;
    var perfect = good && SS.correct === SS.items && SS.items > 3;
    var stars = !good ? 0 : acc >= 90 ? 3 : acc >= 70 ? 2 : 1;
    var pr = SS.station && reason === "done" ? S.pathComplete(SS.station.id, stars) : null;
    var xp0 = SS.xp0 == null ? st.xp : SS.xp0, gain = Math.max(0, st.xp - xp0), coinGain = Math.max(0, st.coins - (SS.coins0 == null ? st.coins : SS.coins0));
    if (window.WordySync) { window.WordySync.sessionEnd({ sec: sec, items: SS.items, correct: SS.correct, mode: SS.mode || "mix", unit: (SS.station && SS.station.unit) || (lastStartOpts && lastStartOpts.unit) || "", coins: coinGain, xp: gain, reason: reason }); window.WordySync.ctx = null; }
    var r0 = S.rankOf(xp0), r1 = S.rankOf(st.xp), rankUp = r0.rank.n !== r1.rank.n;
    var pct = function (r) { return r.span ? Math.round(r.into * 100 / r.span) : 100; };
    var html = '<div class="sbody"><div class="stack" style="padding-top:20px">' +
      '<section class="card fin-top" style="text-align:center">' + (perfect ? '<div class="fin-stamp">PERFEKT!</div>' : "") +
      (good ? '<div class="fin-hero"><div class="fin-rays"></div><div class="avatar fin-av ' + global.VTC.frameClass(st.profile) + '">' + avatarHtml(st.profile.avatar) + '</div></div>' +
        '<div class="fin-stars" aria-label="' + stars + ' von 3 Sternen">' + [0, 1, 2].map(function (i) { return star(i < stars, i); }).join("") + '</div>'
        : '<div style="font-size:40px">💤</div>') +
      '<h1 style="font-size:26px;margin-top:6px">' + head + '</h1><p class="muted small" style="margin:8px 0 0">' + esc(msg) + '</p>' +
      '<div class="tiles4" style="margin-top:16px">' +
      '<div class="kpi"><b class="tnum" data-count="' + SS.items + '">' + SS.items + '</b><span>Aufgaben</span></div>' +
      '<div class="kpi"><b class="tnum" data-count="' + acc + '" data-suffix="%">' + acc + '%</b><span>richtig</span></div>' +
      '<div class="kpi"><b class="tnum" data-count="' + SS.maxChain + '">' + SS.maxChain + '</b><span>beste Serie</span></div>' +
      '<div class="kpi"><b class="tnum">' + fmtMin(sec).replace(" Min", "") + '</b><span>Minuten</span></div></div></section>';
    if (gain || coinGain) html += '<section class="card fin-xp"><div class="row"><div class="eyebrow" style="flex:1 1 auto">Erfahrung</div>' +
      (gain ? '<b class="tnum" style="color:var(--accent)">+<span data-count="' + gain + '">' + gain + '</span> XP</b>' : "") +
      (coinGain ? '<span class="pill fin-coin" style="margin-left:10px">🪙 +<b data-count="' + coinGain + '">' + coinGain + '</b></span>' : "") + '</div>' +
      '<div class="row" style="margin-top:8px"><b>' + esc(r1.rank.n) + '</b><span class="spacer"></span><span class="small muted tnum">' + st.xp + (r1.next ? " / " + r1.next.xp : "") + ' XP</span></div>' +
      '<div class="bar fin-bar" style="margin-top:6px"><i style="width:' + pct(r1) + '%"></i></div>' +
      (rankUp ? '<div class="fin-rankup"><span>⬆️ Neuer Rang</span><b>' + esc(r1.rank.n) + '</b></div>' : "") +
      ((rw.parts || []).length ? '<div class="fin-parts"><div class="eyebrow" style="margin:12px 0 4px">Wofür es Münzen gab</div>' +
        rw.parts.map(function (x) { return '<div class="row small"><span style="flex:1 1 auto">' + esc(x.t) + '</span><b class="tnum">+' + x.c + ' 🪙</b></div>'; }).join("") + '</div>' : "") + '</section>';
    if (SS.sentOk) html += '<section class="card"><div class="eyebrow">Satzbau</div><p style="margin:6px 0 0">' + SS.sentOk + ' ' + plural(SS.sentOk, "Satz", "Sätze") + ' richtig zusammengesetzt.</p></section>';
    if (SS.mastered) html += '<section class="card"><div class="eyebrow" style="color:var(--gold)">Neu gemeistert</div><p style="margin:6px 0 0">' + SS.mastered + ' ' + plural(SS.mastered, "Wort sitzt", "Wörter sitzen") + ' jetzt langfristig.</p></section>';
    if (rw.extra) html += '<section class="card" style="border-color:var(--gold)"><div class="eyebrow" style="color:var(--gold)">🎁 Bonus-Runde</div><p style="margin:6px 0 0"><b>+' + rw.extra.coins + ' 🪙</b> für die Extra-Runde.' + (rw.extra.left ? ' Noch ' + rw.extra.left + (rw.extra.left === 1 ? ' Bonus-Runde' : ' Bonus-Runden') + ' heute.' : ' Das waren alle Bonus-Runden für heute.') + '</p></section>';
    if (rw.challenge) html += '<section class="card" style="border-color:var(--gold)"><div class="eyebrow" style="color:var(--gold)">🎁 Daily Challenge geschafft</div><p style="margin:6px 0 0">Tagesbonus: <b>+' + rw.challenge + ' 🪙</b>. Morgen wartet die nächste Challenge.' + (rw.challengeStreak ? '<br>🔥 <b>' + rw.challengeStreak.n + ' Tage in Folge!</b> Serienbonus +' + rw.challengeStreak.coins + ' 🪙' : '') + '</p></section>';
    if (rw.goalReached && rw.stamp) html += '<section class="card"><div class="eyebrow">🔖 Pass-Stempel</div><div class="stamps" style="margin-top:6px"><span class="stp ok new"><span class="stpi">' + passIcon({ title: rw.stamp.title }) + '</span></span></div><p style="margin:6px 0 0">' + esc(rw.stamp.title) + ', Woche ' + rw.stamp.n + ': <b>' + rw.stamp.cnt + ' von ' + rw.stamp.need + '</b> Tagen' + (rw.stamp.cnt >= rw.stamp.need ? ' – Wochen-Geschenk wartet im Pass! 🎁' : '') + '</p></section>';
    if (rw.goalReached) html += '<section class="card"><div class="eyebrow" style="color:var(--good)">Tagesziel erreicht</div>' + (rw.streakUp ? '<div class="fin-flame">🔥</div>' : "") + '<p style="margin:6px 0 0">' + (rw.streakUp ? "Streak steht bei " + st.streak.count + " " + plural(st.streak.count, "Tag", "Tagen") + "." : "Schon erledigt heute.") + '</p></section>';
    if (rw.missions.length) html += '<section class="card"><div class="eyebrow">Missionen erfüllt</div>' + rw.missions.map(function (m) { return '<div class="mission done"><div class="tick">✓</div><div class="txt small">' + esc(m.n) + '</div><span class="pill">🪙 ' + m.coins + '</span></div>'; }).join("") + '</section>';
    if (rw.badges.length) html += '<section class="card"><div class="eyebrow">Neue Abzeichen</div><div class="badges" style="margin-top:8px">' + rw.badges.map(function (b) { return '<div class="badge"><div class="g">🏅</div><b>' + esc(b.n) + '</b></div>'; }).join("") + '</div></section>';
    if (pr) html += '<section class="card"><div class="eyebrow">Lernpfad</div><p style="margin:6px 0 0"><b>Station geschafft</b> · ' + "★".repeat(stars) + "☆".repeat(3 - stars) + (pr.advanced ? "" : " (Wiederholung)") + '</p>' +
      (pr.chest ? '<p class="small" style="margin:6px 0 0">💰 Abschnitt geschafft – eine Truhe wartet auf dich!</p>' : pr.finished ? '<p class="small" style="margin:6px 0 0">🏆 Du hast den ganzen Pfad geschafft!</p>' : "") + '</section>';
    if (SS.station) html += '<div class="row" style="gap:8px">' + (pr && pr.chest ? '<button class="btn wide lg" data-act="openchest">💰 Truhe öffnen</button>' : '<button class="btn wide lg" data-act="close">' + (pr ? "Weiter auf dem Pfad" : "Zurück zum Pfad") + '</button>') + '</div></div></div>';
    else html += '<div class="row" style="gap:8px"><button class="btn wide" data-act="again">' + (SS.mode === "mix" && S.challengeDone() && S.chalInfo().extraLeft ? "Bonus-Runde +" + S.chalInfo().extraCoins + " 🪙" : "Noch eine Runde") + '</button>' +
      '<button class="btn ghost" data-act="close">Fertig</button></div></div></div>';
    sessionEl.innerHTML = html;
    renderHeader();
    global.VTC.runFinale(sessionEl, { pct0: pct(r0), pct1: pct(r1), rankUp: rankUp, coins: coinGain, perfect: perfect,
      ok: good && acc >= 70, fx: st.profile.fx, snd: st.profile.snd, audio: st.settings.audio });
    setTimeout(flushNews, 2500);
    if (rankUp || perfect) setTimeout(function () { danceWin(!!rankUp, rankUp ? "Rangaufstieg!" : "Fehlerfrei!"); }, 1900);
    if (rw.streakUp) { var fl = sessionEl.querySelector(".fin-flame"); if (fl) fl.classList.add("go"); }
  }
  function openChest() {
    var c = S.claimChest(); if (!c) { render(); return; }
    var secs = S.pathSections(), idx = 0; secs.forEach(function (x, i) { if (x.id === c.section) idx = i; });
    var type = global.VTL.typeFor(idx), pf = S.state.profile, ov = document.createElement("div"); ov.className = "chestov";
    ov.innerHTML = '<div class="eyebrow" style="color:#d8cfff;position:relative;z-index:2">' + esc(c.title) + ' geschafft</div>' +
      '<h2 style="position:relative;z-index:2;font-size:26px;margin:0">Deine Beute</h2><div id="lootStage" style="position:relative;z-index:2;width:min(86vw,300px);height:250px;border-radius:14px;overflow:visible;cursor:pointer"></div>' +
      '<div class="rwd" id="cr1"><span style="font-size:30px">🪙</span><span><b class="tnum" style="font-size:22px">+' + c.coins + '</b> Münzen</span></div>' +
      (c.boost ? '<div class="rwd" id="cr2"><span style="font-size:30px">⚡</span><span>XP-Booster<br><span style="font-weight:500;font-size:12px;color:#66748a">15 Minuten doppelte XP, im Vorrat</span></span></div>' : "") +
      (c.item ? '<div class="rwd" id="cr3"><span style="font-size:30px">🎁</span><span>Überraschung!<br><span style="font-weight:500;font-size:12px;color:#66748a">' + esc(c.item) + ' – gehört jetzt dir</span></span></div>' : "") +
      '<button class="btn lg" id="cOk" style="position:relative;z-index:2;opacity:0;pointer-events:none;background:var(--gold,#f2b33d);color:#2b1d00;margin-top:8px">Weiter ▶</button>';
    document.body.appendChild(ov);
    var show = function (id, ms) { setTimeout(function () { var e = document.getElementById(id); if (e) e.classList.add("show"); }, ms); };
    global.VTL.mount(document.getElementById("lootStage"), type, function () {
      try { if (S.state.settings.audio) global.VTC.sound(pf.snd, true); } catch (e) {}
      show("cr1", 250); if (c.boost) show("cr2", 850); if (c.item) show("cr3", c.boost ? 1450 : 850);
      setTimeout(function () { var b = $("#cOk"); if (b) { b.style.transition = "opacity .4s"; b.style.opacity = 1; b.style.pointerEvents = "auto"; } }, c.item ? 2000 : c.boost ? 1500 : 900);
    });
    $("#cOk").addEventListener("click", function () {
      ov.remove(); renderHeader();
      if (SS && !sessionEl.hidden) closeSession(); else render();
    });
  }
  function closeSession() {
    sessionEl.hidden = true; sessionEl.innerHTML = ""; SS = null;
    document.body.style.overflow = "";
    render();
  }

  /* ---------- Später weitermachen ----------
     Eine angefangene Runde (Aufgaben, Spiele, Lektionen) lässt sich pausieren und am selben Tag fortsetzen.
     Gespeichert wird über S.resumeSave; Spiele und Lektionen liefern ihren Stand selbst (park/resume in arena.js, spiele.js, grammatik.js). */
  function leaveAsk(o, cb) {
    var old = $("#leaveAsk"); if (old) old.remove();
    var ov = document.createElement("div"); ov.className = "srmd"; ov.id = "leaveAsk";
    ov.innerHTML = '<div class="dsh"><div class="dshg"></div><div style="font-size:42px">⏸️</div><h3>Pause machen?</h3>' +
      '<p>' + esc(o && o.text || "Du kannst heute noch genau hier weitermachen.") + '</p>' +
      '<button class="btn" data-pick="pause">Später weitermachen</button>' +
      '<button class="dshx" data-pick="end">Beenden – zählt nicht als geschafft</button>' +
      '<button class="dshx" data-pick="stay" style="border-color:transparent">Weiterspielen</button></div>';
    document.body.appendChild(ov);
    ov.addEventListener("click", function (e) {
      var b = e.target.closest("[data-pick]"); if (!b && e.target !== ov) return;
      var pick = b ? b.getAttribute("data-pick") : "stay";
      ov.remove(); try { cb(pick); } catch (x) { try { console.error("leave:", x); } catch (y) {} }
    });
  }
  var RUN_NAMES = { mix: "Daily Challenge", box: "Fehlerkartei", "new": "Neue Wörter", master: "Meistern", sent: "Sätze", verbs: "Unregelmäßige Verben", focus: "Gezielt üben", path: "Lernpfad" };
  function parkSession() {
    if (!SS || SS.ended) return false;
    try {
      var d = Object.assign({}, SS);
      delete d.station; delete d.pick;
      d.i = SS.answered ? SS.i + 1 : SS.i; d.answered = false;
      d.el = Date.now() - SS.start; d.stationId = SS.station ? SS.station.id : null; d.lopts = lastStartOpts || null;
      var name = SS.station ? "Lernpfad · Station " + SS.station.n : RUN_NAMES[(lastStartOpts && lastStartOpts.focus ? "focus" : SS.mode)] || "Runde";
      S.resumeSave({ key: "session", kind: "session", title: name, sub: "Aufgabe " + Math.min(d.i + 1, SS.tasks.length) + " von " + SS.tasks.length, data: S.resumePack(d) });
      return true;
    } catch (e) { try { console.error("park:", e); } catch (x) {} return false; }
  }
  function resumeSession(d, end) {
    var st = null;
    if (d.stationId) { st = S.pathStations().filter(function (x) { return x.id === d.stationId; })[0]; if (!st) { toast("Diese Station gibt es nicht mehr."); return; } }
    S.rollDay(); S.regenHearts();
    lastStartOpts = d.lopts || null; delete d.lopts;
    SS = d; SS.station = st || undefined; SS.start = Date.now() - (d.el || 0); SS.ended = false; SS.answered = false;
    if (window.WordySync) window.WordySync.ctx = { mode: SS.mode || "mix" };
    sessionEl.hidden = false; document.body.style.overflow = "hidden";
    if (end) return endSession("quit");
    renderTask();
  }
  /* Karte auf der Startseite: angefangene Runden von heute */
  function resumeCard() {
    var l = S.resumeList(); if (!l.length) return "";
    return '<section class="card rescard"><div class="eyebrow">⏸ Angefangen – mach weiter</div>' + l.map(function (e) {
      return '<div class="row" style="gap:10px;margin-top:10px;align-items:center"><div style="flex:1 1 auto;min-width:0"><b>' + esc(e.title) + '</b><div class="small muted">' + esc(e.sub || "") + '</div></div>' +
        '<button class="btn" data-act="resumego" data-k="' + esc(e.key) + '">Weiter</button>' +
        '<button class="chip" data-act="resumeend" data-k="' + esc(e.key) + '" aria-label="Runde beenden">✕</button></div>';
    }).join("") + '<p class="small muted" style="margin:10px 0 0">Der Stand gilt nur heute. ✕ beendet die Runde (XP bleiben, keine Münzen).</p></section>';
  }
  /* end = true: Runde wiederherstellen und sofort als abgebrochen beenden (XP für die Antworten) */
  function resumeGo(key, end) {
    var e = S.resumeList().filter(function (x) { return x.key === key; })[0]; if (!e) { render(); return; }
    if (!end && (e.kind === "session") && S.state.settings.hearts && S.state.hearts <= 0) { toast("Die Herzen sind alle. Sie füllen sich bald wieder auf."); return; }
    var d = S.resumeUnpack(e.data);
    if (!d) { S.resumeTake(key); toast("Die Runde lässt sich nicht mehr öffnen (Wörter geändert)."); render(); return; }
    S.resumeTake(key);
    var ok = e.kind === "session" ? (resumeSession(d, end), true)
      : e.kind === "arena" && global.ARENA ? global.ARENA.resume(d, end)
      : e.kind === "game" && global.VTG ? global.VTG.resume(d, end)
      : e.kind === "gram" && global.VTGR ? global.VTGR.resume(d, end) : false;
    if (ok === false) { toast("Die Runde lässt sich nicht mehr öffnen."); render(); }
  }

  function renderTask() {
    if (!SS) return;
    if (SS.i >= SS.tasks.length) {
      if (SS.retry.length) { SS.tasks = SS.tasks.concat(SS.retry); SS.retry = []; }
      else return endSession("done");
    }
    var t = SS.tasks[SS.i]; if (!t) return endSession("done");
    SS.answered = false; SS.pick = null;
    var st = S.state, total = SS.tasks.length, pc = Math.round(SS.i * 100 / total);
    var hearts = st.settings.hearts ? '<span class="hearts" style="color:var(--bad)">' + "♥".repeat(st.hearts) + '</span><span class="hearts" style="color:var(--line)">' + "♥".repeat(5 - st.hearts) + '</span>' : '<span class="pill">ohne Herzen</span>';
    var head = '<div class="shead"><button class="chip" data-act="quit">✕</button>' +
      '<div class="bar" style="flex:1 1 auto"><i style="width:' + pc + '%"></i></div>' + hearts + '</div>';
    var stepHtml = "";
    if (SS.station) {
      var cs = t.step || SS.curStep || 1; SS.curStep = cs;
      stepHtml = '<div class="stepbar">' + (SS.station.verbIds ? [1, 2, 3, 4, 5] : [1, 2, 3, 4]).map(function (k) { return '<i class="' + (k < cs ? "ok" : k === cs ? "now" : "") + '"></i>'; }).join("") + '<b>Station ' + SS.station.n + ' · ' + STEP_NAMES[cs - 1] + '</b></div>';
    }
    sessionEl.innerHTML = head + stepHtml + '<div class="sbody" id="sbody"></div><div class="sfoot" id="sfoot"></div>';
    var body = $("#sbody"), foot = $("#sfoot");
    body.className = "sbody pop";
    (RENDER[t.type] || RENDER.mc_en_de)(t, body, foot);
  }

  /* Prüfen-Knopf direkt unter dem letzten Eingabefeld, damit er bei eingeblendeter Tastatur sichtbar bleibt */
  function inlineCheck() {
    return '<button class="btn wide lg" data-act="check" id="inlineCheck" disabled>Prüfen</button>';
  }
  function footCheck(label, act) {
    return '<button class="btn wide lg" data-act="' + (act || "check") + '" id="mainBtn" disabled>' + esc(label || "Prüfen") + '</button>';
  }
  function optionList(items, keyLabels) {
    return '<div class="opts">' + items.map(function (o, i) {
      return '<button class="opt" data-opt="' + i + '"><span class="k">' + (i + 1) + '</span><span>' + esc(o.label) + '</span></button>';
    }).join("") + '</div>';
  }
  function speakBtn(text, big, lang) {
    return '<button class="speak' + (big ? " big" : "") + '" data-act="say" data-text="' + esc(text) + '"' + (lang ? ' data-lang="' + lang + '"' : "") + ' aria-label="Anhören">🔊</button>';
  }

  var RENDER = {
    intro: function (t, body, foot) {
      var w = t.w;
      body.innerHTML = '<div class="stack" style="padding-top:8px">' +
        '<div class="eyebrow">Neues Wort · ' + esc(w.unitTitle) + '</div>' +
        '<div class="row" style="gap:14px;align-items:center">' + (audioAvailable() ? speakBtn(w.en, true) : "") +
        '<div class="prompt">' + esc(w.en) + '</div></div>' +
        '<div class="introde"><span class="eyebrow">Auf Deutsch</span><b>' + esc(w.de) + '</b></div>' +
        (w.ex ? '<div class="card" style="background:var(--card-2);box-shadow:none"><div class="eyebrow">Im Satz</div><p style="margin:6px 0 0;font-family:Newsreader,serif;font-size:18px">' + esc(w.ex) + '</p></div>' : "") +
        '</div>';
      foot.innerHTML = '<button class="btn wide lg" data-act="next">Verstanden</button>';
      if (audioAvailable()) setTimeout(function () { speak(w.en); }, 250);
    },
    mc_en_de: function (t, body, foot) {
      var w = t.w, opts = S.shuffle(distractors(w, "de", 3).map(function (x) { return { label: x.de, ok: false }; }).concat([{ label: w.de, ok: true }]));
      t.opts = opts;
      body.innerHTML = '<div class="stack" style="padding-top:8px"><div class="eyebrow">Was heißt das auf Deutsch?</div>' +
        '<div class="row" style="gap:12px">' + (audioAvailable() ? speakBtn(w.en) : "") + '<div class="prompt">' + esc(w.en) + '</div></div>' +
        optionList(opts) + '</div>';
      foot.innerHTML = footCheck();
      if (audioAvailable()) setTimeout(function () { speak(w.en); }, 300);   // das englische Wort wird vor der Antwort vorgelesen
    },
    mc_de_en: function (t, body, foot) {
      var w = t.w, opts = S.shuffle(distractors(w, "en", 3).map(function (x) { return { label: x.en, ok: false }; }).concat([{ label: w.en, ok: true }]));
      t.opts = opts;
      body.innerHTML = '<div class="stack" style="padding-top:8px"><div class="eyebrow">Wie heißt das auf Englisch?</div>' +
        '<div class="prompt de">' + esc(w.de) + '</div>' + optionList(opts) + '</div>';
      foot.innerHTML = footCheck();
    },
    listen: function (t, body, foot) {
      var w = t.w, opts = S.shuffle(distractors(w, "de", 3).map(function (x) { return { label: x.de, ok: false }; }).concat([{ label: w.de, ok: true }]));
      t.opts = opts; t.hidden = true;
      body.innerHTML = '<div class="stack" style="padding-top:8px"><div class="eyebrow">Hör zu – was bedeutet das Wort?</div>' +
        '<div class="row" style="justify-content:center;padding:10px 0">' + speakBtn(w.en, true) + '</div>' +
        '<p class="small muted" style="text-align:center;margin:0">Tippe auf den Lautsprecher, um es noch einmal zu hören.</p>' +
        optionList(opts) + '</div>';
      foot.innerHTML = footCheck();
      setTimeout(function () { speak(w.en); }, 300);
    },
    gap: function (t, body, foot) {
      var w = t.w, parts = w.ex.split(w.gap);
      var opts = S.shuffle(distractors(w, "en", 3).map(function (x) { return { label: x.en.replace(/^to\s+/, ""), ok: false }; })
        .concat([{ label: w.gap, ok: true }]));
      t.opts = opts;
      var spoken = parts[0] + " … " + parts.slice(1).join(w.gap);   // die Lücke wird als Pause gelesen
      body.innerHTML = '<div class="stack" style="padding-top:8px"><div class="eyebrow">Welches Wort fehlt?</div>' +
        '<div class="row" style="gap:12px;align-items:center">' + (audioAvailable() ? speakBtn(spoken) : "") +
        '<p class="gapline" style="margin:0;flex:1 1 auto">' + esc(parts[0]) + '<u>&nbsp;</u>' + esc(parts.slice(1).join(w.gap)) + '</p></div>' +
        '<div class="sub">' + esc(w.de) + '</div>' + optionList(opts) + '</div>';
      foot.innerHTML = footCheck();
      if (audioAvailable()) setTimeout(function () { speak(spoken, 0.9); }, 300);
    },
    odd: function (t, body, foot) {
      var w = t.w;
      var mates = S.words().filter(function (x) { return x.unit !== w.unit; });
      var otherUnit = mates[Math.floor(Math.random() * mates.length)].unit;
      var three = S.shuffle(S.words().filter(function (x) { return x.unit === otherUnit; })).slice(0, 3);
      if (three.length < 3) return RENDER.mc_en_de(t, body, foot);
      var opts = S.shuffle([{ label: w.en, ok: true, de: w.de }].concat(three.map(function (x) { return { label: x.en, ok: false, de: x.de }; })));
      t.opts = opts;
      var topic = three[0].unitTitle;
      var spoken = opts.map(function (o) { return o.label; }).join(". ");   // alle vier Wörter nacheinander, bevor man antwortet
      body.innerHTML = '<div class="stack" style="padding-top:8px"><div class="eyebrow">Was passt nicht?</div>' +
        '<div class="row" style="gap:12px;align-items:center">' + (audioAvailable() ? speakBtn(spoken) : "") +
        '<h2 style="font-size:20px;margin:0;flex:1 1 auto">Drei Wörter gehören zum Thema „' + esc(topic) + '“.</h2></div>' +
        optionList(opts) + '</div>';
      foot.innerHTML = footCheck();
      if (audioAvailable()) setTimeout(function () { speak(spoken, 0.85); }, 300);
    },
    verbintro: function (t, body, foot) {
      var v = t.v, w = verbWord(v);
      body.innerHTML = '<div class="stack" style="padding-top:8px">' +
        '<div class="eyebrow">Neues unregelmäßiges Verb</div>' +
        '<div class="row" style="gap:14px;align-items:center">' + (audioAvailable() ? speakBtn(w.en, true) : "") +
        '<div><div class="prompt">' + esc(v.inf) + '</div><div class="sub" style="margin-top:4px">' + esc(v.de) + '</div></div></div>' +
        '<div class="card" style="background:var(--card-2);box-shadow:none"><div class="eyebrow">' + (vPastOnly() ? "Die zwei Formen" : "Die drei Formen") + '</div>' +
        '<p style="margin:6px 0 0;font-family:Newsreader,serif;font-size:22px">' + esc(vFormsText(v)) + '</p></div>' +
        verbSentCards(v, true) + '</div>';
      foot.innerHTML = '<button class="btn wide lg" data-act="next">Verstanden</button>';
      if (audioAvailable()) setTimeout(function () { speak(w.en); }, 250);
    },
    verbgap: function (t, body, foot) {
      var v = t.v, x = v.s[t.idx];
      var opts = S.shuffle(verbGapOptions(v).map(function (o) { o.ok = o.form === x.form; return o; }));
      t.opts = opts;
      body.innerHTML = '<div class="stack" style="padding-top:8px"><div class="eyebrow">Welche Form passt? · ' + esc(v.inf) + '</div>' +
        '<div class="row" style="gap:12px;align-items:center">' + (audioAvailable() ? speakBtn(x.en.replace(new RegExp("\\b" + reEsc(x.form) + "\\b"), "blank")) : "") +
        '<p class="gapline vgap" style="margin:0;flex:1 1 auto">' + sentHtml(x, true) + ' <span class="small muted">(' + esc(v.inf) + ')</span></p></div>' +
        '<div class="sub">' + esc(x.de) + '</div>' + optionList(opts) + '</div>';
      foot.innerHTML = footCheck();
      if (audioAvailable()) setTimeout(function () { speak(x.en.replace(new RegExp("\\b" + reEsc(x.form) + "\\b"), " … "), 0.9); }, 300);   // Satz mit Pause an der Lücke
    },
    verb: function (t, body, foot) {
      var v = t.v;
      body.innerHTML = '<div class="stack" style="padding-top:8px"><div class="eyebrow">Unregelmäßiges Verb</div>' +
        '<div class="row" style="gap:12px;align-items:center">' + (audioAvailable() ? speakBtn(v.inf) : "") +
        '<div><div class="prompt">' + esc(v.inf) + '</div><div class="sub" style="margin-top:4px">' + esc(v.de) + '</div></div></div>' +
        '<label class="small muted" for="vPast" style="margin-bottom:-6px">Simple Past (Präteritum, 2. Form)</label>' +
        '<input id="vPast" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" enterkeyhint="next" placeholder="z. B. went">' +
        (vPastOnly() ? "" : '<label class="small muted" for="vPp" style="margin-bottom:-6px">Past Participle (Partizip Perfekt, 3. Form)</label>' +
        '<input id="vPp" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" enterkeyhint="done" placeholder="z. B. gone">') +
        inlineCheck() +
        '<p class="small muted" style="margin:0">' + (vPastOnly() ? "Kleine Tippfehler zählen halb." : "Beides muss stimmen. Kleine Tippfehler zählen halb.") + '</p></div>';
      foot.innerHTML = "";
      var a = $("#vPast"), b = $("#vPp"), btn = $("#inlineCheck"), only = !b;
      function upd() { btn.disabled = !(a.value.trim() && (only || b.value.trim())); }
      a.addEventListener("input", upd); if (b) b.addEventListener("input", upd);
      a.addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); if (only) { if (!btn.disabled) check(); } else b.focus(); } });
      if (b) b.addEventListener("keydown", function (e) { if (e.key === "Enter" && !btn.disabled) check(); });
      [a, b].filter(Boolean).forEach(function (el) { el.addEventListener("focus", function () { setTimeout(function () { btn.scrollIntoView({ block: "nearest" }); }, 300); }); });
      setTimeout(function () { a.focus(); }, 60);
      if (audioAvailable()) setTimeout(function () { speak(v.inf); }, 300);
    },
    type: function (t, body, foot) {
      var w = t.w;
      body.innerHTML = '<div class="stack" style="padding-top:8px"><div class="eyebrow">Schreib das englische Wort</div>' +
        '<div class="prompt de">' + esc(w.de) + '</div>' +
        '<input id="typeIn" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" enterkeyhint="done" placeholder="englisches Wort">' +
        inlineCheck() +
        '<div id="hintBox" class="small" style="min-height:22px;letter-spacing:.18em;font-weight:700" aria-live="polite"></div>' +
        '<button class="chip" id="hintBtn" type="button" style="align-self:flex-start">💡 Hinweis</button>' +
        '<p class="small muted" style="margin:0">Kleine Tippfehler zählen halb – die Schreibweise siehst du gleich. Mit Hinweis gibt es keine XP.</p></div>';
      foot.innerHTML = "";
      var inp = $("#typeIn"), btn = $("#inlineCheck");
      var first = String(w.en).split(/\s*[\/,]\s*/)[0];
      var pattern = first.split(" ").map(function (wd) { return wd.split("").map(function (c, k) { return k === 0 ? c : /[A-Za-z]/.test(c) ? "_" : c; }).join(" "); }).join("   ");
      var hb = $("#hintBtn"), hbox = $("#hintBox");
      hb.addEventListener("click", function () {
        if (SS.answered) return;
        if (!t.hint) {
          t.hint = 1; hbox.textContent = pattern; hb.textContent = "👁 Wort kurz zeigen";
        } else if (t.hint === 1) {
          t.hint = 2; hb.disabled = true; hb.textContent = "Hinweis benutzt";
          hbox.textContent = first; setTimeout(function () { if (hbox) hbox.textContent = pattern; }, 2000);
        }
        inp.focus();
      });
      inp.addEventListener("input", function () { btn.disabled = !inp.value.trim(); });
      inp.addEventListener("keydown", function (e) { if (e.key === "Enter" && inp.value.trim()) check(); });
      inp.addEventListener("focus", function () { setTimeout(function () { btn.scrollIntoView({ block: "nearest" }); }, 300); });
      setTimeout(function () { inp.focus(); }, 60);
    },
    spell: function (t, body, foot) {
      var w = t.w, target = w.en.replace(/^to\s+/, "");
      t.target = target;
      var letters = S.shuffle(target.split("").map(function (ch, i) { return { ch: ch, i: i }; }));
      t.built = [];
      body.innerHTML = '<div class="stack" style="padding-top:8px"><div class="eyebrow">Rechtschreibung</div>' +
        '<div class="row" style="gap:12px">' + (audioAvailable() ? speakBtn(w.en) : "") + '<div class="prompt de">' + esc(w.de) + '</div></div>' +
        '<div class="slot" id="slot" data-len="' + target.length + '"></div>' +
        '<p class="small muted" style="margin:0">Tippe die Buchstaben an oder ziehe sie in die Reihe; auch in der Reihe lassen sie sich verschieben.</p>' +
        '<div class="tiles letters" id="tiles">' + letters.map(function (l, i) {
          return '<button class="tile" data-tile="' + i + '" data-ch="' + esc(l.ch) + '">' + (l.ch === " " ? "␣" : esc(l.ch)) + '</button>';
        }).join("") + '</div>' +
        '<button class="chip" data-act="undo" style="align-self:flex-start">⌫ Buchstabe löschen</button></div>';
      t.cursor = 0;
      foot.innerHTML = footCheck();
      paintSlot(t);
      if (audioAvailable()) setTimeout(function () { speak(w.en); }, 250);
    },
    build: function (t, body, foot) {
      var x = t.s, m = x.en.match(/[.?!]$/);
      t.punct = m ? m[0] : "";
      var parts = x.en.replace(/[.?!]$/, "").split(/\s+/);
      t.target = parts; t.built = []; t.usedTiles = [];
      body.innerHTML = '<div class="stack" style="padding-top:8px"><div class="eyebrow">Satzbau</div>' +
        '<h2 style="font-size:19px">Bring die Wörter in die richtige Reihenfolge.</h2>' +
        '<div class="card" style="background:var(--card-2);box-shadow:none"><div class="eyebrow">Gemeint ist</div>' +
        '<div class="row" style="gap:10px;align-items:center;margin-top:6px">' +
        (audioAvailable() ? '<button class="mini-speak" data-act="say" data-lang="de" data-text="' + esc(x.de) + '" aria-label="Deutschen Satz anhören">🔊</button>' : "") +
        '<p style="margin:0;font-family:Newsreader,serif;font-size:19px">' + esc(x.de) + '</p></div></div>' +
        '<div class="slot build" id="slot"></div>' +
        '<div class="tiles" id="tiles">' + S.shuffle(parts.slice()).map(function (wd, i) {
          return '<button class="tile word" data-tile="' + i + '" data-ch="' + esc(wd) + '">' + esc(wd) + '</button>';
        }).join("") + '</div>' +
        '<p class="small muted" style="margin:0">Tippe ein Wort an, um es zu legen oder zurückzulegen. Ziehen mit dem Finger schiebt es an eine andere Stelle.</p></div>';
      foot.innerHTML = footCheck();
      paintSlot(t, true);
    },
    match: function (t, body, foot) {
      var w = t.w;
      var mates = S.shuffle(S.words().filter(function (x) { return x.unit === w.unit && x.id !== w.id; })).slice(0, 3);
      if (mates.length < 3) return RENDER.mc_en_de(t, body, foot);
      var set = [w].concat(mates);
      t.set = set; t.pairs = 0; t.errors = 0; t.sel = null;
      body.innerHTML = '<div class="stack" style="padding-top:8px"><div class="eyebrow">Zuordnen</div>' +
        '<h2 style="font-size:19px">Tippe erst das englische, dann das deutsche Wort.</h2>' +
        '<div class="matchgrid" id="mg">' +
        '<div style="display:grid;gap:9px">' + S.shuffle(set.slice()).map(function (x) { return '<button data-side="en" data-wid="' + esc(x.id) + '">' + esc(x.en) + '</button>'; }).join("") + '</div>' +
        '<div style="display:grid;gap:9px">' + S.shuffle(set.slice()).map(function (x) { return '<button data-side="de" data-wid="' + esc(x.id) + '">' + esc(x.de) + '</button>'; }).join("") + '</div>' +
        '</div></div>';
      foot.innerHTML = '<div class="small muted" style="text-align:center">Noch <b id="mgLeft">4</b> Paare</div>';
    }
  };

  function paintSlot(t, words, dropIdx, dragIdx) {
    var el = $("#slot"); if (!el) return;
    var rest = Math.max(0, t.target.length - t.built.length);
    if (words || t.type === "build") {
      /* Gelegte Wörter sind eigene Knöpfe: antippen legt zurück, ziehen verschiebt (dropIdx = Einfügemarke beim Ziehen) */
      var h = "", k;
      for (k = 0; k < t.built.length; k++) {
        if (k === dropIdx) h += '<i class="dropbar"></i>';
        h += '<button type="button" class="sw' + (k === dragIdx ? " dragging" : "") + '" data-i="' + k + '">' + esc(t.built[k]) + '</button>';
      }
      if (dropIdx != null && dropIdx >= t.built.length) h += '<i class="dropbar"></i>';
      el.innerHTML = h +
        (rest ? '<span style="color:var(--ink-3);font-size:19px;letter-spacing:.1em"> ' + Array(rest + 1).join("··· ") + '</span>' : "") +
        (t.punct ? '<span style="font-size:19px;color:var(--ink-3)">' + esc(t.punct) + '</span>' : "");
    } else {
      /* Buchstaben einzeln antippbar: Tipp auf einen Buchstaben setzt den Cursor davor (linke Hälfte) oder dahinter (rechte Hälfte) */
      var cur = t.cursor == null ? t.built.length : Math.min(t.cursor, t.built.length), h = "", k, dragging = dropIdx != null || dragIdx != null;
      for (k = 0; k < t.built.length; k++) {
        if (dragging ? k === dropIdx : k === cur) h += dragging ? '<i class="dropbar"></i>' : '<i class="caret"></i>';
        h += '<span class="sl' + (k === dragIdx ? " dragging" : "") + '" data-i="' + k + '">' + (t.built[k] === " " ? "&nbsp;" : esc(t.built[k])) + '</span>';
      }
      if (dragging ? (dropIdx != null && dropIdx >= t.built.length) : cur >= t.built.length) h += dragging ? '<i class="dropbar"></i>' : '<i class="caret"></i>';
      el.innerHTML = h + '<span style="color:var(--ink-3);letter-spacing:.18em">' + "·".repeat(rest) + '</span>';
    }
  }

  /* ---------- Antwort prüfen ---------- */
  function applyGrade(w, g, extra) {
    var before = S.levelOf(w.id), wasBox = S.inErrorBox(w.id);
    var hint = !!(extra && extra.hint), res = S.grade(w.id, g, extra);
    SS.items++;
    if (g > 0 && hint) {
      SS.correct++; SS.chain = 0;   // mit Hinweis: gezählt, aber keine Serie und keine XP
    } else if (g > 0) {
      SS.correct++; SS.chain++; SS.maxChain = Math.max(SS.maxChain, SS.chain);
      S.addXp(before === 0 ? 2 : g === 2 ? 10 : 6);   // erstes Ansehen kaum XP: echte Punkte gibt es fürs Wiedererkennen
      if (before === 1 && res.after >= 2) SS.deep = (SS.deep || 0) + 1;
      if (wasBox) SS.boxSolved++;   // zählt für die Mission "Fehlerkartei-Wörter richtig beantworten"
      if (res.after === 4 && before < 4) SS.mastered++;
    } else {
      SS.chain = 0; S.addXp(2);
      if (S.state.settings.hearts) { S.state.hearts = Math.max(0, S.state.hearts - 1); S.state.heartTs = Date.now(); }
    }
    if (before === 0) SS.newSeen++;
    S.save();
    renderHeader();
    return res;
  }
  function verdict(ok, w, res, note) {
    var foot = $("#sfoot"); if (!foot) return;
    feedback(ok);
    var lvl = res ? S.levelOf(w.id) : 0;
    var comp = "";
    if (ok && res) {
      var r = S.state.w[w.id];
      comp = res.after > res.before && res.after === 4 ? "Dieses Wort sitzt jetzt langfristig. ★"
        : res.after > res.before ? "Stufe erreicht: " + S.LEVELS[res.after].n + "."
        : r.iv >= 1 ? "Kommt in " + r.iv + " " + plural(r.iv, "Tag", "Tagen") + " wieder." : "";
    } else if (!ok) comp = "Kommt gleich noch einmal – und häufiger, bis es sitzt.";
    foot.innerHTML = '<div class="verdict ' + (ok ? "ok" : "no") + ' pop">' + (ok ? "Richtig" : "Noch nicht") +
      (note ? " · " + esc(note) : "") +
      '<span class="cmp">' +
      (audioAvailable() ? '<button class="mini-speak" data-act="say" data-text="' + esc(w.en) + '" aria-label="' + esc(w.en) + ' anhören">🔊</button>' : '') +
      esc(w.en) + " – " + esc(w.de) + (comp ? " · " + comp : "") + '</span>' +
      (w.exHtml ? w.exHtml : (w.ex && audioAvailable() ? '<span class="cmp"><button class="mini-speak" data-act="say" data-text="' + esc(w.ex) + '" aria-label="Beispielsatz anhören">🔊</button>' + esc(w.ex) + '</span>' : "")) +
      '</div>' +
      '<button class="btn wide lg" data-act="next" id="mainBtn">Weiter</button>';
    var b = $("#mainBtn"); if (b) b.focus();
    if (b && pauseOn()) {
      var copyNeeded = !ok && !w.exHtml, copied = !copyNeeded, timeUp = false;   // Verben haben eigene Formen: dort nur Pause
      var release = function () { if (timeUp && copied) { b.disabled = false; b.focus(); } };
      holdButton(b, ok ? 1000 : 3000, function () { timeUp = true; release(); });
      if (copyNeeded) {
        var box = document.createElement("div"); box.className = "copybox";
        box.innerHTML = '<label class="small" for="copyIn">Schreib das Wort richtig ab, dann geht es weiter:</label>' +
          '<input id="copyIn" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" placeholder="' + esc(w.en.replace(/[^\s]/g, "·")) + '">';
        foot.insertBefore(box, b);
        var ci = $("#copyIn");
        ci.addEventListener("input", function () { copied = judgeTyped(ci.value, w.en) === 2; ci.classList.toggle("good", copied); release(); });
        setTimeout(function () { ci.focus(); }, 80);
      }
    }
    /* Nach jeder Antwort (richtig oder falsch) wird die englische Lösung vorgelesen; bei Lückensätzen der ganze Satz (liest check), bei Verblücken der Satz mit der Form */
    var tk = SS && SS.tasks[SS.i];
    if (tk && tk.type === "verbgap") speak(tk.v.s[tk.idx].en, 0.9);
    else if (!tk || tk.type !== "gap") speak(w.en);
  }
  /* Pause nach der Antwort: der Weiter-Knopf ist kurz gesperrt (Füllbalken), damit die Lösung gesehen wird */
  function pauseOn() { return S.state.settings.pause !== false; }
  function holdButton(b, ms, done) {
    b.disabled = true; b.classList.add("holding"); b.style.setProperty("--hold", ms + "ms");
    setTimeout(function () {
      /* erst weiter, wenn die Sprachausgabe fertig ist (höchstens 10 s warten) */
      var t0 = Date.now(), quiet = 0, synth = window.speechSynthesis;
      (function poll() {
        var busy = false; try { busy = !!(synth && (synth.speaking || synth.pending)); } catch (e) {}
        quiet = busy ? 0 : quiet + 1;
        if (quiet < 2 && Date.now() - t0 < 10000) return setTimeout(poll, 120);
        b.classList.remove("holding"); if (done) done(); else b.disabled = false;
      })();
    }, ms);
  }
  /* Effekt und Ton der gewählten Sammelobjekte bei einer Antwort */
  function feedback(ok) {
    var p = S.state.profile;
    if (S.state.settings.audio) global.VTC.sound(p.snd, ok);
    if (ok) global.VTC.burst(p.fx, global.innerWidth / 2, global.innerHeight * .55, 16, 1);
  }
  function verdictSentence(ok, x) {
    var foot = $("#sfoot"); if (!foot) return;
    feedback(ok);
    foot.innerHTML = '<div class="verdict ' + (ok ? "ok" : "no") + ' pop">' + (ok ? "Richtig gebaut" : "So heißt es richtig") +
      '<span class="cmp" style="font-family:Newsreader,Georgia,serif;font-size:16px;margin-top:6px">' + esc(x.en) + '</span>' +
      '<span class="cmp">Regel: ' + esc(x.rule) + '</span></div>' +
      (audioAvailable() ? '<button class="btn ghost wide" data-act="say" data-text="' + esc(x.en) + '" style="margin-bottom:8px">🔊 Satz anhören</button>' : "") +
      '<button class="btn wide lg" data-act="next" id="mainBtn">Weiter</button>';
    speak(x.en, 0.9);
    var b = $("#mainBtn"); if (b) b.focus();
    if (b && pauseOn()) holdButton(b, ok ? 1500 : 4000, function () { b.disabled = false; b.focus(); });
  }
  function check() {
    if (!SS || SS.answered) return;
    var t = SS.tasks[SS.i], w = t.w;
    var inl = $("#inlineCheck"); if (inl) inl.remove();
    if (t.type === "verbgap") {
      if (SS.pick == null) return;
      var vg = t.v, gx = vg.s[t.idx], okG = !!t.opts[SS.pick].ok, vgw = verbWord(vg);
      SS.answered = true;
      $$(".opt").forEach(function (b, i) { b.disabled = true; if (t.opts[i].ok) b.classList.add("right"); else if (i === SS.pick) b.classList.add("wrong"); });
      var rg = applyGrade(vgw, okG ? 1 : 0);
      if (!okG) SS.retry.push({ type: "verbgap", v: vg, idx: t.idx });
      verdict(okG, vgw, rg, "Zeitwort „" + gx.time + "“ → " + TENSES[t.idx].name);
      return;
    }
    if (t.type === "verb") {
      var v = t.v, vw = verbWord(v);
      var ppIn = $("#vPp"), ga = judgeTyped($("#vPast").value, v.past), gb = ppIn ? judgeTyped(ppIn.value, v.pp) : 2;
      var gv = ga === 0 || gb === 0 ? 0 : (ga === 2 && gb === 2 ? 2 : 1);
      SS.answered = true;
      var rv = applyGrade(vw, gv);
      if (gv === 0) SS.retry.push({ type: "verb", v: v });
      verdict(gv > 0, vw, rv, gv === 1 ? "fast – achte auf die Schreibweise"
        : gv === 0 ? "Deine Antwort: " + ($("#vPast").value.trim() || "–") + (ppIn ? " / " + ($("#vPp").value.trim() || "–") : "") : null);
      $("#vPast").disabled = true; if (ppIn) ppIn.disabled = true;
      return;
    }
    if (t.type === "type") {
      var val = $("#typeIn").value, g = judgeTyped(val, w.en), hinted = !!t.hint && g > 0;
      if (hinted) g = 1;
      SS.answered = true;
      var res = applyGrade(w, g, hinted ? { hint: true } : null);
      if (g === 0) SS.retry.push({ type: "mc_en_de", w: w });
      verdict(g > 0, w, res, hinted ? "mit Hinweis geschafft – das Wort kommt bald wieder, XP gibt es dafür nicht" : g === 1 ? "fast – achte auf die Schreibweise" : null);
      var inp = $("#typeIn"); if (inp) inp.disabled = true;
      return;
    }
    if (t.type === "build") {
      SS.answered = true;
      var okB = t.built.join(" ") === t.target.join(" ");
      S.gradeSentence(t.s.id, okB ? 2 : 0);
      SS.items++;
      if (okB) { SS.correct++; SS.sentOk++; SS.chain++; SS.maxChain = Math.max(SS.maxChain, SS.chain); S.addXp(14); }
      else {
        SS.chain = 0; S.addXp(3); SS.retry.push({ type: "build", s: t.s });
        if (S.state.settings.hearts) { S.state.hearts = Math.max(0, S.state.hearts - 1); S.state.heartTs = Date.now(); }
      }
      S.save(); renderHeader();
      verdictSentence(okB, t.s);
      return;
    }
    if (t.type === "spell") {
      var built = t.built.join(""); SS.answered = true;
      var okS = built === t.target;
      var resS = applyGrade(w, okS ? 2 : 0);
      if (!okS) SS.retry.push({ type: "spell", w: w });
      verdict(okS, w, resS);
      return;
    }
    if (SS.pick == null) return;
    SS.answered = true;
    var ok = !!t.opts[SS.pick].ok;
    $$(".opt").forEach(function (b, i) {
      b.disabled = true;
      if (t.opts[i].ok) b.classList.add("right");
      else if (i === SS.pick) b.classList.add("wrong");
    });
    var res2 = applyGrade(w, ok ? 2 : 0);
    if (!ok) SS.retry.push({ type: t.type === "odd" ? "mc_en_de" : t.type, w: w });
    if (t.type === "gap") {   // der ganze Satz mit dem richtigen Wort wird gezeigt und noch einmal vorgelesen
      var gu = $(".gapline u"); if (gu) { gu.innerHTML = esc(w.gap); gu.className = ok ? "gfill ok" : "gfill bad"; }
      if (audioAvailable()) setTimeout(function () { speak(w.ex, 0.9); }, 250);
    }
    verdict(ok, w, res2);
  }
  function next() {
    if (!SS) return;
    if (S.state.settings.hearts && S.state.hearts <= 0) return endSession("hearts");
    SS.i++; renderTask();
  }

  /* ---------- Ereignisse ---------- */
  sessionEl.addEventListener("click", function (e) {
    var t = SS && SS.tasks[SS.i];
    var say = e.target.closest("[data-act='say']");
    if (say) { speak(say.getAttribute("data-text"), 0, say.getAttribute("data-lang")); return; }
    var opt = e.target.closest(".opt");
    if (opt && !SS.answered) {
      SS.pick = +opt.getAttribute("data-opt");
      $$(".opt").forEach(function (b) { b.setAttribute("aria-pressed", b === opt); });
      var mb = $("#mainBtn"); if (mb) mb.disabled = false;
      return;
    }
    if (t && t.type === "spell" && !SS.answered && e.target.closest("#slot")) {   // Cursor in der Buchstabenreihe setzen
      var sl = e.target.closest(".sl");
      if (sl) { var rc = sl.getBoundingClientRect(); t.cursor = +sl.getAttribute("data-i") + (e.clientX - rc.left > rc.width / 2 ? 1 : 0); }
      else t.cursor = t.built.length;
      paintSlot(t);
      return;
    }
    var sw = e.target.closest(".sw");
    if (sw && t && t.type === "build" && !SS.answered) {   // gelegtes Wort zurück in die Auswahl
      var si = +sw.getAttribute("data-i");
      t.built.splice(si, 1); var ret = t.usedTiles.splice(si, 1)[0]; if (ret) ret.classList.remove("used");
      paintSlot(t, true); $("#mainBtn").disabled = true;
      return;
    }
    var tile = e.target.closest(".tile");
    if (tile && t && (t.type === "spell" || t.type === "build") && !SS.answered) {
      t.usedTiles = (t.usedTiles || []);
      var at = t.type === "spell" && t.cursor != null ? Math.min(t.cursor, t.built.length) : t.built.length;
      tile.classList.add("used"); t.built.splice(at, 0, tile.getAttribute("data-ch")); t.usedTiles.splice(at, 0, tile);
      if (t.type === "spell") t.cursor = at + 1;
      paintSlot(t);
      $("#mainBtn").disabled = t.built.length !== t.target.length;
      return;
    }
    var mg = e.target.closest("#mg button");
    if (mg && t && t.type === "match" && !SS.answered) return matchTap(t, mg);
    var act = e.target.closest("[data-act]"); if (!act) return;
    var a = act.getAttribute("data-act");
    if (a === "check") check();
    else if (a === "next") next();
    else if (a === "quit") {
      if (SS && SS.items) leaveAsk({}, function (pick) {
        if (pick === "stay") return;
        if (pick === "pause" && parkSession()) { toast("Gespeichert. Du findest die Runde auf der Startseite."); return closeSession(); }
        endSession("quit");
      });
      else closeSession();
    }
    else if (a === "close") closeSession();
    else if (a === "openchest") openChest();
    else if (a === "again") { closeSession(); startSession({ minutes: S.goalMin() }); }
    else if (a === "undo" && t && (t.type === "spell" || t.type === "build") && !SS.answered) {
      if (!t.built.length) return;
      var del = t.type === "spell" && t.cursor != null ? Math.min(t.cursor, t.built.length) - 1 : t.built.length - 1;   // wie die Löschtaste: der Buchstabe vor dem Cursor
      if (del < 0) return;
      t.built.splice(del, 1); var el = t.usedTiles.splice(del, 1)[0]; if (el) el.classList.remove("used");
      if (t.type === "spell") t.cursor = del;
      paintSlot(t); $("#mainBtn").disabled = true;
    }
  });
  /* ---------- Satzbau: Wörter ziehen ---------- */
  var drag = null, swallowClick = false;
  function dropIndex(x, y) {
    var chips = $$("#slot .sw, #slot .sl");
    for (var i = 0; i < chips.length; i++) {
      var r = chips[i].getBoundingClientRect();
      if (y < r.top || (y <= r.bottom && x < r.left + r.width / 2)) return i;
    }
    return chips.length;
  }
  function inSlot(x, y) {
    var s = $("#slot"); if (!s) return false;
    var r = s.getBoundingClientRect();
    return x >= r.left - 12 && x <= r.right + 12 && y >= r.top - 24 && y <= r.bottom + 24;
  }
  function dragEnd(commit, e) {
    if (!drag) return;
    var d = drag, t = d.t; drag = null;
    document.removeEventListener("pointermove", dragMove); document.removeEventListener("pointerup", dragUp); document.removeEventListener("pointercancel", dragCancel);
    if (d.ghost) { d.ghost.remove(); swallowClick = true; setTimeout(function () { swallowClick = false; }, 350); }
    if (!d.moved) return;
    if (commit && SS && !SS.answered && SS.tasks[SS.i] === t) {
      var over = inSlot(e.clientX, e.clientY), at = dropIndex(e.clientX, e.clientY);
      t.usedTiles = t.usedTiles || [];
      if (d.fromSlot) {
        var wd = t.built.splice(d.idx, 1)[0], tl = t.usedTiles.splice(d.idx, 1)[0];
        if (over) { if (at > d.idx) at--; t.built.splice(at, 0, wd); t.usedTiles.splice(at, 0, tl); if (t.type === "spell") t.cursor = at + 1; }
        else { if (tl) tl.classList.remove("used"); if (t.type === "spell") t.cursor = Math.min(d.idx, t.built.length); }   // aus der Reihe gezogen: zurück in die Auswahl
      } else if (over) {
        t.built.splice(at, 0, d.el.getAttribute("data-ch")); t.usedTiles.splice(at, 0, d.el); d.el.classList.add("used"); if (t.type === "spell") t.cursor = at + 1;
      }
      $("#mainBtn").disabled = t.built.length !== t.target.length;
    }
    if (SS && SS.tasks[SS.i] === t) paintSlot(t, t.type === "build");
  }
  function dragMove(e) {
    if (!drag) return;
    var d = drag;
    if (!d.moved) {
      if (Math.abs(e.clientX - d.x0) + Math.abs(e.clientY - d.y0) < 9) return;
      d.moved = true;
      d.ghost = document.createElement("div"); d.ghost.className = "dragghost"; d.ghost.textContent = d.el.getAttribute("data-ch") || d.el.textContent;   // eigenes kleines Element, nicht die Kachel kopieren
      document.body.appendChild(d.ghost);
    }
    d.ghost.style.left = e.clientX + "px"; d.ghost.style.top = e.clientY + "px";
    var over = inSlot(e.clientX, e.clientY);
    paintSlot(d.t, d.t.type === "build", over ? dropIndex(e.clientX, e.clientY) : null, d.fromSlot ? d.idx : null);
  }
  function dragUp(e) { dragEnd(true, e); }
  function dragCancel(e) { dragEnd(false, e); }
  sessionEl.addEventListener("pointerdown", function (e) {
    var t = SS && SS.tasks[SS.i]; if (!t || (t.type !== "build" && t.type !== "spell") || SS.answered || e.button > 0) return;
    var el = e.target.closest(t.type === "build" ? ".sw, .tile.word" : ".sl, .tile[data-ch]"); if (!el || el.classList.contains("used")) return;
    drag = { el: el, t: t, fromSlot: el.classList.contains("sw") || el.classList.contains("sl"), idx: +(el.getAttribute("data-i") || 0), x0: e.clientX, y0: e.clientY, moved: false, ghost: null };
    document.addEventListener("pointermove", dragMove); document.addEventListener("pointerup", dragUp); document.addEventListener("pointercancel", dragCancel);
  });
  sessionEl.addEventListener("click", function (e) { if (swallowClick) { swallowClick = false; e.stopPropagation(); e.preventDefault(); } }, true);   // nach dem Ziehen kein Antippen auslösen
  function matchTap(t, btn) {
    var side = btn.getAttribute("data-side"), wid = btn.getAttribute("data-wid");
    if (side === "en") {
      $$("#mg button[data-side='en']").forEach(function (b) { b.classList.remove("sel"); });
      btn.classList.add("sel"); t.sel = { wid: wid, el: btn };
      if (audioAvailable()) speak(S.byId(wid).en);
      return;
    }
    if (!t.sel) return;
    var ok = t.sel.wid === wid;
    if (ok) {
      btn.classList.add("ok"); t.sel.el.classList.add("ok"); t.sel.el.classList.remove("sel");
      t.pairs++; t.sel = null;
      var left = 4 - t.pairs; var lEl = $("#mgLeft"); if (lEl) lEl.textContent = left;
      if (t.pairs === 4) {
        SS.answered = true;
        var g = t.errors === 0 ? 2 : 1;
        t.set.forEach(function (x) { if (x.id !== t.w.id) S.grade(x.id, g); });
        var res = applyGrade(t.w, g);
        verdict(true, t.w, res, t.errors ? t.errors + " Fehlversuch" + (t.errors > 1 ? "e" : "") : null);
      }
    } else {
      t.errors++; btn.classList.add("no");
      setTimeout(function () { btn.classList.remove("no"); }, 500);
    }
  }
  document.addEventListener("keydown", function (e) {
    if (sessionEl.hidden || !SS) return;
    var t = SS.tasks[SS.i];
    if (e.key === "Enter") { var b = $("#mainBtn"); if (b && !b.disabled) { e.preventDefault(); b.click(); } return; }
    if (!SS.answered && t && t.opts && /^[1-4]$/.test(e.key)) {
      var o = $$(".opt")[+e.key - 1]; if (o) o.click();
    }
  });

  view.addEventListener("click", function (e) {
    var act = e.target.closest("[data-act]"); if (!act) return;
    var a = act.getAttribute("data-act"), st = S.state;
    if (a === "say") { if (!speak(act.getAttribute("data-text"), 0, act.getAttribute("data-lang"))) toast("Dieses Gerät hat keine Sprachausgabe bereit."); return; }
    if (a === "install") {
      if (!installPrompt) return toast("Dein Browser bietet die Installation gerade nicht an.");
      installPrompt.prompt();
      installPrompt.userChoice.then(function (r) {
        installPrompt = null;
        if (r && r.outcome !== "accepted") toast("Abgebrochen – du kannst es jederzeit nachholen.");
        render();
      });
      return;
    }
    if (a === "voicetest") {
      if (!st.settings.audio) return toast("Erst „Aussprache vorlesen“ einschalten.");
      var okV = speak("This is the English voice of your device.", 0.9, null, true);
      toast(okV ? (voice ? "Stimme: " + voice.name + " (" + voice.lang + ")" : "Standardstimme des Browsers wird genutzt.") : "Der Browser bietet hier keine Sprachausgabe an.");
      return;
    }
    if (a === "mitlesen") { var ml = mitlesenList(act.getAttribute("data-unit"), act.getAttribute("data-sec")); openMitlesen(ml.list, ml.title, act.getAttribute("data-unit") || ""); return; }
    if (a === "gramstart") { if (global.VTGR) global.VTGR.start(act.getAttribute("data-id")); return; }
    if (a === "unitgame") {
      var ids = (act.getAttribute("data-scope") || act.getAttribute("data-unit") || "").split(",").filter(Boolean), uws = [];
      ids.forEach(function (uid) { var uu = S.units().filter(function (x) { return x.id === uid; })[0]; if (uu) uu.words.forEach(function (w, i) { var wo = S.byId(uu.id + "#" + i); if (wo) uws.push(wo); }); });
      if (!uws.length) return;
      if (act.getAttribute("data-arena")) { if (global.ARENA) global.ARENA.start(act.getAttribute("data-arena"), { words: uws }); }
      else if (global.VTG) global.VTG.start(act.getAttribute("data-game"), { units: ids });
      return;
    }
    if (a === "wgame") { if (global.VTG) global.VTG.start(act.getAttribute("data-id")); return; }
    if (a === "arena") { if (global.ARENA) global.ARENA.start(act.getAttribute("data-id")); return; }
    if (a === "start") {
      var fc = act.getAttribute("data-focus") || null;
      startSession({ minutes: +(act.getAttribute("data-min") || S.goalMin()), mode: act.getAttribute("data-mode") || (fc ? "focus" : "mix"), unit: act.getAttribute("data-unit") || null, scope: act.getAttribute("data-scope") ? act.getAttribute("data-scope").split(",") : undefined,
        vtype: act.getAttribute("data-vtype") === "1", verb: act.getAttribute("data-verb") || null, focus: fc });
    } else if (a === "track") {
      var nt = act.getAttribute("data-t");
      if (nt !== st.settings.track) { S.setTrack(nt); toast(nt === "business" ? "Business English aktiv." : "Schule aktiv."); render(); view.scrollTop = 0; }
    } else if (a === "klasse") {
      var raw = act.getAttribute("data-k"), k = /^\d+$/.test(raw) ? +raw : raw;
      var arr = st.settings.track === "business" ? st.settings.bizGroups : st.settings.klassen;
      var i = arr.indexOf(k);
      if (i >= 0) { if (arr.length > 1) arr.splice(i, 1); }
      else arr.push(k);
      st.settings.units = []; S.save(true); render();
    } else if (a === "unit") { detailUnit = act.getAttribute("data-id"); render(); }
    else if (a === "vtoggle") { var vs2 = act.nextElementSibling; if (vs2 && vs2.classList.contains("vsent")) { vs2.hidden = !vs2.hidden; var ch = act.querySelector(".vchev"); if (ch) ch.textContent = vs2.hidden ? "▸" : "▾"; } }
    else if (a === "verblist") { detailUnit = "__verbs"; tab = "ueben"; uebenSeg = "units"; render(); view.scrollTop = 0; }
    else if (a === "seg") {
      var sg = act.getAttribute("data-g"), sv = act.getAttribute("data-v");
      if (sg === "ueben") uebenSeg = sv; else if (sg === "stats") statsSeg = sv; else if (sg === "shop") shopSeg = sv;
      else if (sg === "lernen") { lernSeg = sv; uebenSeg = sv === "units" ? "units" : "modi"; detailUnit = null; } else if (sg === "spielen") spielSeg = sv; else if (sg === "beute") beuteSeg = sv;
      render(); view.scrollTop = 0;
    }
    else if (a === "startrec") { if (lastRec) startSession(lastRec.opts); }
    else if (a === "pathgo" || a === "pathreplay") startPathStation(act.getAttribute("data-id"));
    else if (a === "pathfocus") { pathScroll = null; render(); }
    else if (a === "pathlocked") { act.classList.remove("shake"); void act.offsetWidth; act.classList.add("shake"); toast(act.classList.contains("pchest") ? (act.classList.contains("got") ? "Schon geplündert! Die nächste Truhe wartet nach dem nächsten Boss." : "Erst alle Stationen dieses Abschnitts schaffen, dann geht die Truhe auf.") : "Erst die Station davor schaffen."); if (act.classList.contains("got") && !global.matchMedia("(prefers-reduced-motion: reduce)").matches) dustPuff(act); }
    else if (a === "openchest") openChest();
    else if (a === "boostgo") { var bg = S.boostStart(); toast(bg.error || "Booster läuft: 15 Minuten doppelte XP beim Üben."); renderHeader(); render(); }
    else if (a === "wfilter") { wFilter = act.getAttribute("data-f"); wMax = 40; render(); }
    else if (a === "wmore") { wMax += 40; $("#wList").innerHTML = wordListHtml(); }
    else if (a === "setmin") { startMin = +act.getAttribute("data-min"); render(); }
    else if (a === "fbkind") { fbKind = act.getAttribute("data-k"); $$('[data-act="fbkind"]').forEach(function (b) { b.setAttribute("aria-pressed", String(b === act)); }); }
    else if (a === "fbsend") {
      var ft = $("#fbTxt"), fm = $("#fbMsg"); if (!ft || ft.value.trim().length < 3) { if (fm) fm.textContent = "Bitte ein paar Worte schreiben."; return; }
      act.disabled = true;
      window.WordySync.fbSend(fbKind, ft.value.trim()).then(function (r) { act.disabled = false; if (r.error) { if (fm) fm.textContent = r.error; return; } toast("Danke für deine Rückmeldung!"); fbDraw(); });
    }
    else if (a === "gopfad") { tab = "lernen"; lernSeg = "pfad"; detailUnit = null; render(); view.scrollTop = 0; }
    else if (a === "goueben") { tab = "ueben"; uebenSeg = "modi"; detailUnit = null; render(); view.scrollTop = 0; }
    else if (a === "back") { stopReading(); detailUnit = null; render(); }
    else if (a === "readall") {
      var u = S.units().filter(function (x) { return x.id === act.getAttribute("data-id"); })[0];
      if (u) readAll(u, act);
    }
    else if (a === "startgoal") {
      var gl = window.WordySync.currentGoals().filter(function (x) { return String(x.id) === act.getAttribute("data-id"); })[0];
      if (gl) {
        var gp = window.WordySync.progress(gl), gleft = Math.max(0, gl.target - gp.cur);
        if (gl.kind === "unit") startSession({ minutes: Math.max(5, S.goalMin()), scope: gl.scope, newMax: 10, mode: "unit" });
        else if (gl.kind === "newwords") startSession({ minutes: 10, mode: "mix" });
        else if (gl.kind === "days") startSession({ minutes: Math.max(5, S.goalMin()), mode: "mix" });
        else startSession({ minutes: Math.min(15, Math.max(5, gleft)), mode: "mix" });
      }
    }
    else if (a === "resumego") resumeGo(act.getAttribute("data-k"), false);
    else if (a === "resumeend") { if (confirm("Angefangene Runde beenden? Sie zählt dann nicht als geschafft (die XP für schon beantwortete Aufgaben bleiben).")) resumeGo(act.getAttribute("data-k"), true); }
    else if (a === "planblock") {
      var pdp = window.WordySync.dayplan(), pb = pdp && pdp.blocks[+act.getAttribute("data-i")]; if (!pb) return;
      if (pb.act === "start") startSession({ minutes: pb.min, mode: pb.mode, unit: pb.unit || null, focus: pb.focus || null, planBlock: pb.id });
      else if (pb.act === "mitlesen") { var pml = mitlesenList(pb.unit || null, null); if (!pml.list.length) { toast("Dafür gibt es noch keine Wörter zum Mitlesen."); return; } openMitlesen(pml.list, pml.title, pb.unit || ""); }
      else if (pb.act === "gram") { if (!global.VTGR) return; global.VTGR.start(pb.topic); }
      else if (pb.act === "duel") {
        if (!socOn() || !soc.me || !soc.me.enabled || !(soc.me.friends || []).some(function (f) { return f.state === "ok"; })) { toast("Für ein Duell braucht es einen Freund, den die Eltern freigegeben haben."); return; }
        tab = "spielen"; spielSeg = "freunde"; render();
      }
      else if (pb.act === "unitgame") { var ub = document.createElement("button"); ub.hidden = true; ub.setAttribute("data-act", "unitgame"); ub.setAttribute("data-unit", pb.unit); ub.setAttribute("data-arena", pb.gid); view.appendChild(ub); ub.click(); ub.remove(); }
      else { var gb = document.createElement("button"); gb.hidden = true; gb.setAttribute("data-act", pb.act); gb.setAttribute("data-id", pb.gid); view.appendChild(gb); gb.click(); gb.remove(); }
    }
    else if (a === "startplan") {
      var pl = window.WordySync.activePlans().filter(function (x) { return String(x.id) === act.getAttribute("data-id"); })[0];
      if (pl) { var pi = window.WordySync.planInfo(pl); startSession({ minutes: S.goalMin(), scope: pl.units, newMax: Math.max(pi.quota, (st.daily && st.daily.newSeen) || 0), mode: "plan", cls: !!pl.cls }); }
      else if (/^c\d+$/.test(act.getAttribute("data-id"))) { toast("Die Aufgabe wird geladen …"); window.WordySync.pull(true).then(function () { if (window.WordySync.activePlans().some(function (x) { return String(x.id) === act.getAttribute("data-id"); })) act.click(); else toast("Die Aufgabe ist nicht mehr aktiv."); }); }
    }
    else if (a === "syncpair") {
      var inp = $("#syncCode"), txt = inp ? inp.value : ""; act.disabled = true; act.textContent = "Verbinde …";
      window.WordySync.pair(txt).then(function (r) {
        if (r.error) { toast(r.error); act.disabled = false; act.textContent = "Verbinden"; return; }
        afterPair(r);
      });
    }
    else if (a === "pairask") {
      act.disabled = true; pairStop();
      window.WordySync.pairStart(playerName()).then(function (r) {
        act.disabled = false;
        if (r.error) { toast(r.error); return; }
        pairReq = r; pairDraw(); pairTimer = setInterval(pairTick, 3000);
      });
    }
    else if (a === "paircancel") { pairStop(); pairDraw(); }
    else if (a === "pairshare" && pairReq) {
      var ptxt = "Wordy: Bitte gib meinen Code " + pairReq.code + " frei: " + window.WordySync.pairServer + "/f/?koppeln=" + pairReq.code.replace("-", "");
      if (navigator.share) navigator.share({ text: ptxt }).catch(function () {});
      else if (navigator.clipboard) navigator.clipboard.writeText(ptxt).then(function () { toast("Kopiert. Schick es deinen Eltern."); });
      else prompt("Text kopieren:", ptxt);
    }
    else if (a === "restoreopen") {
      var box = $("#restoreBox"); if (box) box.innerHTML = '<p class="small muted">Lade …</p>';
      window.WordySync.stateList().then(function (l) {
        if (!box) return;
        if (!l.length) { box.innerHTML = '<p class="small muted">Auf dem Server liegt noch keine Sicherung.</p>'; return; }
        box.innerHTML = '<label class="small muted">Sicherung wählen</label><select id="restoreDay" style="width:100%;margin:4px 0 8px">' + l.map(function (x) {
          return '<option value="' + esc(x.day) + '">' + esc(x.day.split("-").reverse().join(".")) + ' · ' + x.words + ' Wörter · ' + x.coins + ' Münzen</option>';
        }).join("") + '</select><button class="btn soft wide" data-act="restorego">Diese Sicherung wiederherstellen</button>' +
          '<p class="small muted" style="margin:6px 0 0">Der jetzige Stand auf diesem Gerät wird dabei ersetzt. Eine Kopie bleibt als „vor Wiederherstellung“ erhalten.</p>';
      });
    }
    else if (a === "restorego") {
      var sel = $("#restoreDay"), dayv = sel ? sel.value : "";
      if (!dayv || !confirm("Lernstand vom " + dayv.split("-").reverse().join(".") + " wiederherstellen? Der Stand auf diesem Gerät wird ersetzt.")) return;
      act.disabled = true; act.textContent = "Stelle wieder her …";
      window.WordySync.restore(dayv).then(function (r) { if (r.error) { toast(r.error); act.disabled = false; act.textContent = "Diese Sicherung wiederherstellen"; return; } toast("Lernstand wiederhergestellt."); render(); });
    }
    else if (a === "syncnow") {
      var Wn = window.WordySync;
      Wn.snapshot().then(function () { return Wn.flush(); }).then(function () { return Wn.pushState(true); })
        .then(function (ok) { toast(ok ? (Wn.info().hidden ? "Gesichert." : "Gesendet.") : "Server gerade nicht erreichbar oder keine Änderung zu sichern."); render(); });
    }
    else if (a === "syncoff") { if (confirm("Verbindung für Auto-Save / Lernfortschritt trennen? Bereits gesendete Daten bleiben beim Server, es wird nichts Neues mehr gesendet.")) { window.WordySync.disconnect(); toast("Getrennt."); render(); } }
    else if (a === "buy") {
      var r = S.buy(act.getAttribute("data-id"));
      toast(r.error || ("Gekauft: " + r.item.label));
      if (r.ok) { var nw = S.takeNews(); if (nw && nw.sets.length) { S.save(true); openSetReveal(nw.sets); } }
      if (r.ok) { var rect = act.getBoundingClientRect(); global.VTC.burst("confetti", rect.left + rect.width / 2, rect.top, 26, 1.4); }
      renderHeader(); render();
    }
    else if (a === "passsel") { var pn = act.getAttribute("data-n"); passSel = pn === "fin" ? "fin" : +pn; render(); }
    else if (a === "passtier") { var tr = S.claimPassTier(+act.getAttribute("data-n"), act.getAttribute("data-k")); if (tr.error) toast(tr.error); else { try { if (S.state.settings.audio) global.VTC.sound(S.state.profile.snd, true); var rc = act.getBoundingClientRect(); global.VTC.burst("stars", rc.left + rc.width / 2, rc.top, 12, 1); } catch (e) {} toast("+" + tr.coins + " 🪙 " + ({ bronze: "Bronze", silber: "Silber", gold: "Gold" })[tr.k]); renderHeader(); render(); } }
    else if (a === "passcrew") { var cr2 = S.claimPassCrew(+act.getAttribute("data-n")); if (cr2.error) toast(cr2.error); else { toast("👥 Crew-Bonus! +" + cr2.coins + " 🪙"); renderHeader(); render(); } }
    else if (a === "passshare") { sharePass(); }
    else if (a === "passclaim") { openPassReward(act.getAttribute("data-n")); }
    else if (a === "sritem") { srModal(act.getAttribute("data-id")); }
    else if (a === "hhdance") {
      var hp = S.state.profile, hn = DANCE_NUM[hp.dance] || 1, hb = $("#hhBub"), CH = ["Yeah! 💪", "Weiter so, Champion! 🏆", "Heute knacken wir ein Wort mehr!", "Ich tanze nur für dich 💃", "Wörter sammeln macht stark!"];
      var hf = $("#hhFig"); if (!hf) return;
      var hsp = $("#hwSp");   // Halloween: Figur schlägt die Spinne mit dem Baseballschläger weg
      if (hsp && seasonNow() === "halloween" && global.VTS && global.VTS.whack && !hsp.classList.contains("gone")) {
        hsp.classList.add("gone"); var hb0 = hb ? hb.textContent : "";
        var onHit = function (mode) {   // Sprechblase erst nach dem Treffer
          if (!hb) return; var TX = { weg: ["Homerun! 🏏", "Und raus! 💥", "Weg mit dir! ⚾"], loop: ["Looping! 🌀", "Ab durch die Mitte! 🎢"], pinball: ["Flipper! 🎯", "Bing, bing, bing! 🔔"], splat: ["Platsch! 💚", "Ups, direkt ans Fenster! 🪟"] }[mode] || ["Homerun! 🏏"];
          hb.textContent = TX[Math.floor(Math.random() * TX.length)]; setTimeout(function () { var b2 = $("#hhBub"); if (b2 && b2.textContent !== hb0) b2.textContent = hb0; }, 3600);
        };
        if (global.VTS.whack(hf, hsp, function () { var s2 = $("#hwSp"); if (s2) { s2.classList.add("back"); s2.classList.remove("gone"); setTimeout(function () { s2.classList.remove("back"); }, 1600); } }, S.state.settings.audio === false, onHit)) return;
        hsp.classList.remove("gone");
      }
      hf.innerHTML = heroHtml(hp.avatar, hn); if (hb) hb.textContent = CH[Math.floor(Math.random() * CH.length)];
      try { global.VTC.burst("stars", hf.getBoundingClientRect().left + 55, hf.getBoundingClientRect().top + 40, 10, .9); } catch (e) {}
      clearTimeout(hhT); hhT = setTimeout(function () { var h2 = $("#hhFig"); if (h2) h2.innerHTML = heroHtml(S.state.profile.avatar, 0); }, 4200);
    }
    else if (a === "narrtest") { speak("Hallo Magnus! Ich bin dein Erzähler. Heute zeige ich dir, wie man Wörter knackt – ohne Schweiß, aber mit Style.", null, "de", true); }
    else if (a === "soccopy") { try { navigator.clipboard.writeText(soc.me.code); toast("Code kopiert"); } catch (e) { toast(soc.me.code); } }
    else if (a === "socshare") { var stx = "Spiel mit mir Wordy! Mein Freundescode: " + soc.me.code; if (navigator.share) navigator.share({ text: stx }).catch(function () {}); else { try { navigator.clipboard.writeText(stx); toast("Text kopiert"); } catch (e) {} } }
    else if (a === "socadd") {
      var sc = ($("#socCode") || {}).value || "", sm = $("#socMsg"); if (!sc.trim()) return;
      global.WordySync.social("POST", "/friends", { code: sc }).then(function (r) { soc.ts = 0; toast("Anfrage an " + r.name + " ist raus. Jetzt müssen eure Eltern zustimmen."); socLoad(true); }).catch(function (e) { if (sm) sm.textContent = e.message; });
    }
    else if (a === "socdel") { if (confirm("Diesen Freund entfernen?")) global.WordySync.social("DELETE", "/friends/" + act.getAttribute("data-id")).then(function () { socLoad(true); }).catch(function (e) { toast(e.message); }); }
    else if (a === "socchallenge") { var fr = (soc.me.friends || []).filter(function (f) { return String(f.id) === act.getAttribute("data-id"); })[0]; if (fr) duelSheet(fr); }
    else if (a === "socaccept") { var ch = (soc.inbox.open || []).filter(function (c) { return String(c.id) === act.getAttribute("data-id"); })[0]; if (ch) acceptDuel(ch); }
    else if (a === "socreact") { global.WordySync.social("POST", "/challenges/" + act.getAttribute("data-id") + "/react", { emoji: act.getAttribute("data-e") }).then(function () { socLoad(true); }).catch(function (e) { toast(e.message); }); }
    else if (a === "crewpick") { crewUi.emoji = +act.getAttribute("data-i"); crewUi.adj = +(($("#crAdj") || {}).value || crewUi.adj); crewUi.noun = +(($("#crNoun") || {}).value || crewUi.noun); render(); }
    else if (a === "crewmake") { crewUi.adj = +$("#crAdj").value; crewUi.noun = +$("#crNoun").value; crewDo("/crew", { adj: crewUi.adj, noun: crewUi.noun, emoji: crewUi.emoji }, function () { toast("Deine Crew steht! Lade jetzt Freunde ein."); }); }
    else if (a === "crewjoin") { crewDo("/crew/answer", { crew: +act.getAttribute("data-id"), accept: act.getAttribute("data-a") === "1" }, function () { if (act.getAttribute("data-a") === "1") toast("Willkommen in der Crew! 🛡️"); }); }
    else if (a === "crewinvite") { crewDo("/crew/invite", { to: +act.getAttribute("data-id") }, function () { toast("Einladung ist raus."); }); }
    else if (a === "crewcheer") { crewDo("/crew/cheer", { to: +act.getAttribute("data-id"), emoji: act.getAttribute("data-e") }, function () { toast("Angefeuert " + act.getAttribute("data-e")); }); }
    else if (a === "clsjoin") { var cc = $("#clsCode"); if (cc && cc.value.trim()) clsDo("/class/join", { code: cc.value }, function (r) { toast("Anfrage an " + r.name + " gesendet. Jetzt müssen deine Eltern zustimmen."); }); }
    else if (a === "clsleave") { if (confirm("Wirklich aus der Klasse austreten?")) clsDo("/class/leave", {}, function () { toast("Du bist nicht mehr in der Klasse."); }); }
    else if (a === "setdesign") { st.settings.design = act.getAttribute("data-d"); S.save(true); global.VTC.applyLook(st.profile, st.settings.themeMode, st.settings.design, seasonNow()); render(); }
    else if (a === "setseason") { st.settings.season = act.getAttribute("data-v"); S.save(true); heard = true; renderHeader(); render(); }
    else if (a === "seasonsound") { st.settings.seasonSound = st.settings.seasonSound === false; S.save(true); heard = true; ambientSync(); render(); }
    else if (a === "crewleave") { if (confirm("Crew wirklich verlassen?")) crewDo("/crew/leave", {}, function () { toast("Du hast die Crew verlassen."); }); }
    else if (a === "crewclaim") {
      var rect = act.getBoundingClientRect();
      crewDo("/crew/claim", { quest: act.getAttribute("data-q"), tier: +act.getAttribute("data-t") }, function (r) { var got = S.crewReward(r.coins, r.tier); renderHeader(); toast("🥇 " + r.tier + " bei " + r.quest + "! +" + got + " 🪙", 3600); try { global.VTC.burst("stars", rect.left + rect.width / 2, rect.top, 22, 1.2); } catch (e) {} });
    }
    else if (a === "socmode") { soc.boardMode = act.getAttribute("data-m"); render(); }
    else if (a === "howto") howtoSheet();
    else if (a === "duelcloud" || a === "duelx") {
      var did = act.getAttribute("data-id"), dk2 = act.getAttribute("data-kind"), dcl = act.closest(".newscloud"), pfd = S.state.profile;
      if (dcl) dcl.remove();
      if (dk2 === "crew") { duelHide["c" + did] = 1; if (a === "duelcloud") { tab = "spielen"; spielSeg = "crew"; render(); } }
      else if (dk2 === "res" || dk2 === "wait") { (pfd.duelSeen || (pfd.duelSeen = {}))[(dk2 === "wait" ? "w" : "") + did] = 1; S.save(true); if (a === "duelcloud") { tab = "spielen"; spielSeg = "freunde"; render(); } }
      else if (a === "duelx") duelHide[did] = 1;
      else { var dch = ((soc.inbox && soc.inbox.open) || []).filter(function (c) { return String(c.id) === did; })[0]; if (dch) acceptDuel(dch); else { tab = "spielen"; spielSeg = "freunde"; render(); } }
    }
    else if (a === "newscloud" || a === "newsx") {
      var nid = act.getAttribute("data-id"), pfc = S.state.profile; (pfc.cloudSeen || (pfc.cloudSeen = {}))[nid] = 1; if (pfc.cloudForce) delete pfc.cloudForce[nid]; S.save(true);
      var cl = act.closest(".newscloud"); if (cl) cl.remove();
      var nn = NEWS.filter(function (x) { return x.id === nid; })[0];
      if (a === "newscloud" && nn && nn.shop) { tab = "beute"; beuteSeg = "shop"; shopTab = nn.shop; render(); view.scrollTop = 0; }
      else if (a === "newscloud" && global.VTG) global.VTG.start(nid);
    }
    else if (a === "film") {
      global.VTFILM.play(act.getAttribute("data-id"), { audio: S.state.settings.audio, speak: function (t) { speak(t, null, "de"); }, voice: function () { var n = S.state.settings.narrator || "auto"; return n === "dev" ? null : n === "m" ? "m" : "f"; }, onGo: function (g) {
        var b = document.createElement("button"); b.hidden = true;
        if (g.tab) { tab = "lernen"; lernSeg = g.tab; uebenSeg = g.tab === "units" ? "units" : "modi"; detailUnit = null; render(); view.scrollTop = 0; return; }
        if (g.game) { b.setAttribute("data-act", "wgame"); b.setAttribute("data-id", g.game); }
        else if (g.gram) { b.setAttribute("data-act", "gramstart"); b.setAttribute("data-id", g.gram); }
        else if (g.arena) { b.setAttribute("data-act", "arena"); b.setAttribute("data-id", g.arena); }
        else { b.setAttribute("data-act", "start"); b.setAttribute("data-mode", g.mode); if (g.focus) b.setAttribute("data-focus", g.focus); b.setAttribute("data-min", S.goalMin()); }
        view.appendChild(b); b.click(); b.remove();
      } });
    }
    else if (a === "srfavhint") { toast("Tippe ein Stück im Schrank an und wähle „Als Favorit“ ⭐"); }
    else if (a === "gotab") { tab = act.getAttribute("data-t"); render(); view.scrollTop = 0; }
    else if (a === "srdance") {
      var owned = S.SHOP.filter(function (x) { return x.kind === "dance" && S.owns(x); }).map(function (x) { return DANCE_NUM[x.val]; }).filter(Boolean), k = owned.indexOf(srDn);
      srDn = owned[(k + 1) % owned.length] || 1; srHero(true);
    }
    else if (a === "srswap") {
      var figs = S.SHOP.filter(function (x) { return x.kind === "avatar" && S.owns(x); }).map(function (x) { return x.val; }), j = figs.indexOf(srAv);
      srAv = figs[(j + 1) % figs.length]; srHero(srDn != null); }
    else if (a === "srwear") { var fi = S.SHOP.filter(function (x) { return x.kind === "avatar" && x.val === srAv; })[0]; if (fi) { S.equip(fi.id); toast("Neuer Avatar: " + fi.label); renderHeader(); srHero(srDn != null); } }
    else if (a === "buyset") {
      var bs = S.buySet();
      toast(bs.error || ("Gekauft: " + bs.items.join(", ") + (bs.locked && bs.locked.length ? ". Noch offen: " + bs.locked.join(", ") : "")), bs.error || (bs.locked && bs.locked.length) ? 5200 : 3200);
      if (bs.ok) { var rc = act.getBoundingClientRect(); global.VTC.burst("stars", rc.left + rc.width / 2, rc.top, 30, 1.6); var nw2 = S.takeNews(); if (nw2 && nw2.sets.length) { S.save(true); openSetReveal(nw2.sets); } }
      renderHeader(); render();
    }
    else if (a === "buyslot") {
      var rs = S.buySlot();
      toast(rs.error || ("Sticker-Platz " + rs.slots + " freigeschaltet. Jetzt kannst du " + rs.slots + " Sticker aufkleben."));
      if (rs.ok) { var rc = act.getBoundingClientRect(); global.VTC.burst("confetti", rc.left + rc.width / 2, rc.top, 26, 1.4); }
      renderHeader(); render();
    }
    else if (a === "equip") {
      var re = S.equip(act.getAttribute("data-id")); if (re.error) return toast(re.error);
      if (re.item.kind === "sticker") toast(re.on ? "Aufgeklebt: " + re.item.label : "Abgelöst: " + re.item.label);
      renderHeader(); render();
    }
    else if (a === "dancetry") { var dit = S.SHOP.filter(function (x) { return x.id === act.getAttribute("data-id"); })[0]; if (dit) { var pf = S.state.profile; global.VTC.dance({ av: pf.avatar, avatar: avatarHtml(pf.avatar), outfit: (dit.kind === "outfit" || dit.kind === "kit") ? dit.val : pf.outfit, dance: dit.kind === "dance" ? dit.val : (pf.dance || "wackler"), title: dit.label }); } }
    else if (a === "vforms") { S.state.settings.verbForms = act.getAttribute("data-k") === "past" ? "past" : "all"; S.save(true); render(); }
    else if (a === "shopview") { shopView = act.getAttribute("data-k"); render(); }
    else if (a === "lockinfo") { var li = S.itemById(act.getAttribute("data-id")); if (li) { var need = S.minXp(li) - S.state.xp, sw = S.shopSoon(li); toast("🔒 " + (sw ? "Geheimes Stück" : li.label) + (sw ? ": kommt in " + sw + (sw === 1 ? " Woche" : " Wochen") + " in den Shop" : "") + (li.rank ? ": ab Rang " + li.rank : "") + (need > 0 ? " · noch " + need.toLocaleString("de-DE") + " XP" : "") + (li.cost && !sw ? " · " + li.cost + " 🪙" : ""), 4200); } }
    else if (a === "shoptab") { shopTab = act.getAttribute("data-k"); render(); }
    else if (a === "checkupdate") {
      if (!navigator.serviceWorker) return toast("Dieses Gerät kennt keine App-Updates. Seite einfach neu laden.");
      toast("Suche nach Updates …");
      navigator.serviceWorker.getRegistration().then(function (reg) {
        if (!reg) return toast("Keine installierte Version gefunden. Seite neu laden.");
        return reg.update().then(function () {
          setTimeout(function () {
            if (reg.installing || reg.waiting) toast("Update gefunden – die App lädt gleich neu.");
            else toast("Du hast die neueste Version (" + (global.WORDY_VERSION || "–") + ").");
          }, 1500);
        });
      }).catch(function () { toast("Keine Verbindung. Versuch es später noch einmal."); });
    }
    else if (a === "clearcache") {
      if (!confirm("App-Cache leeren und neu laden? Dein Lernstand bleibt erhalten.")) return;
      var done = function () { global.location.reload(); };
      Promise.resolve(global.caches ? global.caches.keys().then(function (ks) { return Promise.all(ks.map(function (k) { return global.caches.delete(k); })); }) : 0)
        .then(function () { return navigator.serviceWorker ? navigator.serviceWorker.getRegistrations().then(function (rs) { return Promise.all(rs.map(function (r) { return r.unregister(); })); }) : 0; })
        .then(done, done);
    }
    else if (a === "wish") { var rw2 = S.setWish(act.getAttribute("data-id")); toast(rw2.error || (rw2.on ? "Wunsch: " + rw2.item.label : "Wunsch entfernt")); render(); }
    else if (a === "goshop") { tab = "shop"; shopSeg = "shop"; render(); var shopEl = view.querySelector(".shopitem"); if (shopEl) shopEl.scrollIntoView({ block: "center" }); }
    else if (a === "albuminfo") {
      var ai = S.SHOP.filter(function (x) { return x.id === act.getAttribute("data-id"); })[0];
      if (ai) toast(S.minXp(ai) > S.state.xp ? ai.label + ": erst ab Rang " + ai.rank + " (" + ai.cost + " Münzen)." : ai.label + ": " + ai.cost + " Münzen.");
    }
    else if (a === "padd") {
      var nm = $("#newPlayer").value; S.addProfile(nm);
      try { global.sessionStorage.setItem("wordy.picked", "1"); } catch (er) {}
      global.location.reload();
    }
    else if (a === "pswitch") {
      S.switchProfile(act.getAttribute("data-id"));
      try { global.sessionStorage.setItem("wordy.picked", "1"); } catch (er) {}
      global.location.reload();
    }
    else if (a === "pren") {
      var nn = prompt("Neuer Name:"); if (nn) { S.renameProfile(act.getAttribute("data-id"), nn); render(); }
    }
    else if (a === "pdel") {
      if (confirm("Diesen Spieler samt Lernstand wirklich löschen?")) {
        S.deleteProfile(act.getAttribute("data-id"));
        try { global.sessionStorage.removeItem("wordy.picked"); } catch (er) {}
        global.location.reload();
      }
    }
    else if (a === "csvimport") {
      var res = S.parseCsv($("#csvText").value, $("#csvTitle").value.trim() || "Eigene Liste");
      if (res.error) return toast(res.error);
      toast(res.count + " Wörter übernommen" + (res.skipped ? " (" + res.skipped + " Zeilen übersprungen)" : ""));
      render();
    }
    else if (a === "delcustom") { S.removeCustom(act.getAttribute("data-id")); toast("Liste entfernt."); render(); }
    else if (a === "exp") {
      var box = $("#expBox"); box.hidden = false;
      box.value = act.getAttribute("data-kind") === "csv" ? S.exportCsv() : S.exportProgress();
      box.select();
      try {
        navigator.clipboard.writeText(box.value).then(function () { toast("In die Zwischenablage kopiert."); },
          function () { toast("Markiert – jetzt kopieren."); });
      } catch (err) { toast("Markiert – jetzt kopieren."); }
    }
    else if (a === "impopen") { $("#impWrap").hidden = false; $("#impBox").focus(); }
    else if (a === "impdo") {
      var ri = S.importProgress($("#impBox").value);
      if (ri.error) return toast(ri.error);
      toast("Lernstand eingespielt."); renderHeader(); render();
    }
    else if (a === "restore") {
      if (confirm("Den aktuellen Stand durch diese Sicherung ersetzen? Der aktuelle Stand bleibt als „vor letzter Änderung“ erhalten.")) {
        var rr = S.restoreBackup(act.getAttribute("data-slot"));
        if (rr.error) return toast(rr.error);
        toast("Sicherung geladen."); renderHeader(); render();
      }
    }
    else if (a === "reset") {
      if (confirm("Wirklich den gesamten Fortschritt löschen? Eigene Wortlisten bleiben erhalten.")) {
        S.resetProgress(); toast("Fortschritt zurückgesetzt."); renderHeader(); render();
      }
    }
  });

  document.addEventListener("click", function (e) {
    var b = e.target.closest("button[data-tab]"); if (!b) return;
    stopReading(); tab = b.getAttribute("data-tab"); detailUnit = null; render(); view.scrollTop = 0;
  });

  function render() {
    S.rollDay();
    if (!SS) flushNews();
    if (TABMAP[tab]) {   // frühere Reiter leben als Unterbereiche der neuen Hauptreiter weiter
      if (tab === "ueben") lernSeg = uebenSeg === "units" ? "units" : "ueben"; else if (tab === "stats") lernSeg = "stats"; else beuteSeg = tab;
      tab = TABMAP[tab];
    }
    document.documentElement.setAttribute("data-tab", tab);   // für Saison-Looks (z. B. Spinne nur auf der Startseite)
    spiderSync();
    $$("#tabs button").forEach(function (b) { b.setAttribute("aria-current", b.getAttribute("data-tab") === tab); });
    renderHeader();
    if (tab === "home") viewHome();
    else if (tab === "lernen") viewLernen();
    else if (tab === "spielen") viewSpielen();
    else if (tab === "beute") viewBeute();
    else viewParent();
  }

  var hStkEl = $("#hStk");
  if (hStkEl) hStkEl.addEventListener("click", function () { if (SS) return; tab = "beute"; beuteSeg = "shop"; shopTab = "sticker"; render(); view.scrollTop = 0; });
  global.VTUI = {
    speechText: speechClean,
    speak: function (t) { speak(t); },
    leave: leaveAsk,
    toast: toast,
    refreshHeader: renderHeader,
    afterArena: function () { render(); },
    bossFinish: bossFinish,
    danceWin: danceWin,
    openChest: openChest,
    arenaScore: function (mode, score) { if (socOn() && /^(match|blitz|survival)$/.test(mode)) global.WordySync.social("POST", "/score", { mode: mode, score: score }).catch(function () {}); }
  };

  S.load();
  /* früher frei eingetragener Name wird zum Spielernamen */
  (function () {
    var d = S.profiles(), nm = S.state.profile.name;
    if (nm && /^Spieler \d+$/.test(playerName())) S.renameProfile(d.active, nm);
    if (nm) { S.state.profile.name = ""; S.save(true); }
  })();
  render();
  (function () { var bt = document.getElementById("boot"); if (bt) setTimeout(function () { bt.classList.add("off"); setTimeout(function () { if (bt.parentNode) bt.parentNode.removeChild(bt); }, 600); }, 350); })();
  pickPlayer();
  setTimeout(function () { try { openWelcome(); } catch (e) {} }, 900);
  setTimeout(function () { if (window.WordySync && sessionEl.hidden && (tab === "home" || tab === "lernen")) render(); }, 300);   // sync.js lädt nach app.js: Verbindung und Pläne erst jetzt sichtbar
  /* Verbindungslink der Eltern (#verbinden=<Adresse#Code>): nach Bestätigung automatisch verbinden */
  (function () {
    var m = String(location.hash || "").match(/^#verbinden=(.+)$/); if (!m) return;
    var code = ""; try { code = decodeURIComponent(m[1]); } catch (e) {}
    try { history.replaceState(null, "", location.pathname + location.search); } catch (e) {}
    if (!code) return;
    setTimeout(function () {
      if (!window.WordySync) return;
      if (window.WordySync.connected()) { toast("Dieses Gerät ist schon verbunden. Einen neuen Link brauchst du nur auf einem anderen Gerät."); return; }
      if (!confirm("Dieses Gerät mit dem Lernfortschritt deiner Eltern verbinden?\n\nDeine Eltern sehen dann, wie du lernst, und dein Lernstand wird gesichert.")) return;
      window.WordySync.pair(code).then(function (r) {
        if (r.error) { toast(r.error); return; }
        toast("Verbunden als " + r.name + ".");
        if (r.backups && r.backups.length) {
          var b0 = r.backups[0], dt = new Date(b0.ts);
          if (confirm("Auf dem Server liegt ein gesicherter Lernstand von " + r.name + " (" + dt.toLocaleDateString("de-DE") + ", " + b0.words + " Wörter, " + b0.coins + " Münzen). Wiederherstellen?")) { window.WordySync.restore(b0.day).then(function (rr) { toast(rr.error || "Lernstand wiederhergestellt."); render(); }); return; }
        }
        render();
      });
    }, 1500);
  })();
  S.keepStorage(function () { if (tab === "parent") render(); });
  setInterval(function () { if (sessionEl.hidden) { S.regenHearts(); renderHeader(); } }, 30000);
})(window);
