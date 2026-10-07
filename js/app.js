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
  /* Wärmt die Ausgabe mit einem echten, aber unhörbaren Wort an (Lautstärke fast 0; bei exakt 0 überspringen
     manche Stimmen die Ausgabe). done() läuft, sobald es fertig ist oder spätestens nach maxMs. */
  function primeSpeech(done, maxMs) {
    var synth = window.speechSynthesis, fired = false;
    function fin() { if (fired) return; fired = true; if (done) setTimeout(done, 40); }
    if (!synth) return fin();
    try {
      var w = new SpeechSynthesisUtterance("Okay");
      w.volume = 0.001; w.rate = 3;
      w.onend = fin; w.onerror = fin;
      synth.speak(w);
      setTimeout(fin, maxMs || 500);
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
  function speak(text, rate, lang, forceCold, onEnd) {
    if (!S.state.settings.audio || !window.speechSynthesis) return false;
    try {
      var synth = window.speechSynthesis, now = Date.now();
      var busy = synth.speaking || synth.pending, cold = !busy && (forceCold || now - lastSpoke > 8000);
      if (busy) synth.cancel();
      var de = lang === "de";
      var u = new SpeechSynthesisUtterance(de ? String(text) : speechClean(String(text)).replace(/^to\s+/i, ""));
      if (!voicesReady) pickVoice();
      var vo = de ? narratorVoice() : voice, tune = de ? narratorTune() : null;
      if (vo) u.voice = vo;
      u.lang = (vo && vo.lang) || (de ? "de-DE" : "en-GB");
      u.rate = rate || (de ? tune.rate : 0.92); if (de) u.pitch = tune.pitch;
      if (onEnd) { u.onend = onEnd; u.onerror = onEnd; }
      lastSpoke = now;
      var lead = speechLead();
      if (busy) setTimeout(function () { synth.speak(u); }, 150);
      else if (cold && lead > 0) primeSpeech(function () { synth.speak(u); }, lead);
      else synth.speak(u);
      return true;
    } catch (e) { return false; }
  }
  /* Beim ersten Tippen die Sprachausgabe unhörbar anwerfen, damit schon der erste Satz vollständig kommt. */
  document.addEventListener("pointerdown", function warm() {
    document.removeEventListener("pointerdown", warm);
    if (S.state.settings.audio && window.speechSynthesis) { try { primeSpeech(null, 300); lastSpoke = Date.now(); } catch (e) {} }
  }, { passive: true });
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
  function renderHeader() {
    var st = S.state, r = S.rankOf(st.xp);
    $("#hAvatar").innerHTML = avatarHtml(st.profile.avatar);
    $("#hAvatar").className = ("avatar " + global.VTC.frameClass(st.profile)).trim();
    var pd = S.profiles(); var pn = pd.list.filter(function (x) { return x.id === pd.active; })[0];
    $("#hAvatar").title = pn ? pn.name : "";
    $("#hRank").textContent = r.rank.n + (st.profile.title ? " · " + st.profile.title : "");
    $("#hXp").textContent = st.xp;
    $("#hCoins").textContent = st.coins;
    $("#hStreak").textContent = st.streak.count;
    var hEl = $("#hHearts");
    if (!st.settings.hearts) { hEl.textContent = "∞"; hEl.title = "Ohne Herzen"; }
    else { S.regenHearts(); hEl.innerHTML = "<span style='color:var(--bad)'>" + "♥".repeat(st.hearts) + "</span><span style='color:var(--line)'>" + "♥".repeat(5 - st.hearts) + "</span>"; }
    global.VTC.applyLook(st.profile, st.settings.themeMode);
    var hb = $("#hBoost");
    if (hb) {
      var bs = st.path && st.path.boost, on = !!(bs && bs.on && bs.left > 0);
      hb.hidden = !on; if (on) hb.textContent = "⚡×2 " + Math.floor(bs.left / 60) + ":" + ("0" + (bs.left % 60)).slice(-2);
    }
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
  /* ---------- Unregelmäßige Verben: Karte, Liste ---------- */
  function verbCard() {
    var vs = S.verbStats(), vp = S.verbPools(), due = vp.box.length + vp.due.length;
    return '<section class="card"><div class="row"><div style="flex:1 1 auto"><div class="eyebrow">Unregelmäßige Verben</div>' +
      '<h2 style="font-size:19px">' + vs.seen + ' von ' + vs.total + ' geübt · ' + vs.mastered + ' sitzen</h2>' +
      '<p class="small muted" style="margin:4px 0 0">' + (due ? due + " " + plural(due, "Verb ist", "Verben sind") + " zur Wiederholung dran. " : "") +
      'Go – went – gone: alle Formen, die man in der Schule braucht. In normalen Runden kommen sie immer wieder zwischendurch.</p></div></div>' +
      '<div class="row wrap" style="margin-top:12px;gap:8px"><button class="btn" data-act="start" data-mode="verbs" data-min="5">Verben üben</button>' +
      '<button class="btn soft" data-act="start" data-mode="verbs" data-vtype="1" data-min="5">Nur Tippen</button>' +
      '<button class="btn ghost" data-act="verblist">Alle Verben ansehen</button></div>' +
      '<p class="small muted" style="margin:8px 0 0">„Verben üben“ mischt Einführung, Lückenaufgabe und Tippen. „Nur Tippen“ fragt immer beide Formen zum Schreiben ab.</p></section>';
  }
  function viewVerbList() {
    var vs = S.verbStats(), list = S.verbs();
    var rows = list.map(function (v) {
      var lv = S.levelOf(v.id), r = S.state.w[v.id];
      return '<div class="wordrow" data-act="vtoggle" style="cursor:pointer">' +
        (audioAvailable() ? '<button class="mini-speak" data-act="say" data-text="' + esc(v.en) + '" aria-label="' + esc(v.inf) + ' anhören">🔊</button>' : '') +
        '<span class="vchev" aria-hidden="true">▸</span>' +
        '<span class="en" style="flex:1 1 auto">' + esc(v.inf) + ' – ' + esc(v.past) + ' – ' + esc(v.pp) + '<br><span class="small muted">' + esc(v.de) + '</span></span>' +
        (r && r.no ? '<span class="pill" title="Fehler">✗ ' + r.no + '</span>' : '') +
        '<span class="pill l' + lv + '">' + esc(S.LEVELS[lv].n) + '</span></div>' +
        '<div class="vsent stack" hidden style="gap:8px;padding:0 0 12px">' + verbSentCards(v, true) +
        '<button class="btn soft" data-act="start" data-mode="verbs" data-vtype="1" data-verb="' + esc(v.id) + '" style="align-self:flex-start">✍️ Dieses Verb tippen</button></div>';
    }).join("");
    view.innerHTML = '<div class="stack">' +
      '<button class="btn ghost" data-act="back" style="align-self:flex-start">← Zurück</button>' +
      '<section class="card"><div class="eyebrow">Unregelmäßige Verben</div>' +
      '<h1 style="font-size:24px">Verbenliste</h1>' +
      '<p class="small muted" style="margin:6px 0 0">' + vs.total + ' Verben · ' + vs.seen + ' geübt · ' + vs.mastered + ' gemeistert. Infinitiv – Simple Past (Präteritum) – Past Participle (Partizip Perfekt).</p>' +
      '<div class="row wrap" style="margin-top:12px;gap:8px"><button class="btn" data-act="start" data-mode="verbs" data-min="5">Verben üben</button>' +
      '<button class="btn soft" data-act="start" data-mode="verbs" data-vtype="1" data-min="5">Nur Tippen</button></div></section>' +
      '<section class="card"><div class="eyebrow">Alle Verben · Zeile antippen = Beispielsätze</div>' + rows + '</section></div>';
  }

  /* ================= START ================= */

  /* ---------- Ziele und Lernpläne der Eltern (Startseite) ---------- */
  function parentCards(skipPlans) {
    var W = window.WordySync; if (!W || !W.connected()) return "";
    var h = "", goals = W.currentGoals(), plans = W.activePlans(), st = S.state;
    (skipPlans || skipPlans === "goals" ? [] : plans).forEach(function (pl) {
      var i = W.planInfo(pl), done = st.goalsDone && st.goalsDone["p" + pl.id];
      var when = i.days > 1 ? "in " + i.days + " Tagen" : i.days === 1 ? "morgen" : "heute";
      var newToday = (st.daily && st.daily.newSeen) || 0, left = Math.max(0, i.quota - newToday);
      h += '<section class="card"><div class="eyebrow">📅 Lernplan</div>' +
        '<div style="margin-top:6px"><b>' + esc(pl.title) + '</b> <span class="small muted">· Arbeit ' + when + '</span></div>' +
        '<div class="bar" style="margin:10px 0 6px"><i style="width:' + i.pct + '%"></i></div>' +
        '<p class="small muted" style="margin:0 0 10px">' + i.pct + ' % sicher (' + i.ok + ' von ' + i.total + ' Wörtern)' +
        (done ? ' · ✅ Ziel erreicht' : pl.coins ? ' · Bonus ' + pl.coins + ' Münzen bei 90 %' : '') + '</p>' +
        (i.total - i.ok > 0 ? '<p class="small" style="margin:0 0 10px">Heute dran: ' + (left > 0 ? '<b>' + left + ' neue ' + plural(left, "Wort", "Wörter") + '</b> und ' : '') + 'Wiederholung.</p>' : '') +
        '<button class="btn wide" data-act="startplan" data-id="' + esc(pl.id) + '">Lernplan üben</button></section>';
    });
    if (goals.length && skipPlans !== "plans") {
      h += '<section class="card"><div class="eyebrow">🎯 Deine persönlichen Wochenziele</div><div style="margin-top:8px">' + goals.map(function (g) {
        var pr = W.progress(g), done = st.goalsDone && st.goalsDone["g" + g.id];
        return '<div style="padding:8px 0;border-top:1px solid var(--line)"><div class="row"><b class="small" style="flex:1 1 auto">' + (done ? "✅ " : "") + esc(g.title) + '</b>' +
          '<span class="pill tnum">' + Math.min(pr.cur, g.target) + ' / ' + g.target + (g.kind === "unit" ? " %" : "") + '</span></div>' +
          '<div class="bar" style="margin-top:6px"><i style="width:' + (done ? 100 : pr.pct) + '%"></i></div>' +
          '<div class="row" style="margin-top:6px;gap:8px">' + (g.coins ? '<div class="small muted" style="flex:1 1 auto">' + (done ? 'Geschafft, ' + g.coins + ' Münzen sind gutgeschrieben.' : 'Belohnung: 🪙 ' + g.coins) + '</div>' : '<span style="flex:1 1 auto"></span>') +
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
    }).join("") + '</div>';
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
        '<div class="small" style="margin:8px 0 0">' + (s.finale.coins ? "+" + s.finale.coins + " 🪙 " : "") + (s.finale.slot ? "· +1 Stickerplatz" : "") + '</div>' +
        (info.fin.ready ? '<button class="btn wide lg" data-act="passclaim" data-n="fin" style="margin-top:10px">🎁 Finale abholen</button>' : info.fin.claimed ? '<p class="small muted" style="margin:10px 0 0">Schon abgeholt. Stark!</p>' : '') + '</div>';
    } else {
      var w = info.weeks[sel - 1] || info.weeks[0];
      var dayDots = w.days.map(function (d, i) { return '<span class="dd ' + (d.ok ? "ok" : d.today ? "now" : d.future ? "fut" : "miss") + '"><i>' + (d.ok ? "✓" : d.today ? "▶" : d.future ? "○" : "·") + '</i>' + ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"][(new Date(d.k + "T00:00:00Z").getUTCDay() + 6) % 7] + '</span>'; }).join("");
      det = '<div class="pdet"><b>Woche ' + w.n + ': ' + esc(w.title) + '</b><p class="small" style="margin:4px 0 6px">Schaffe an <b>' + w.need + ' Tagen</b> dein Tagesziel: <b class="tnum">' + w.cnt + ' / ' + w.need + '</b>' +
        (w.state === "cur" && w.left != null ? ' · noch ' + w.left + ' ' + plural(w.left, "Tag", "Tage") : w.state === "missed" ? ' · Zeit abgelaufen' : "") + '</p>' +
        '<div class="ddays">' + dayDots + '</div><div class="rcards" style="margin-top:10px">' + w.items.map(function (id) { var it = S.itemById(id), x = rcard(id, !w.claimed && w.state !== "ready"); return x + (it && it.kind === "avatar" && S.itemById("st:" + id.slice(3)) ? rcard("st:" + id.slice(3), !w.claimed && w.state !== "ready") : ""); }).join("") +
        (w.slot ? '<div class="rcard extra"><span class="ri em">🏷️</span><b>+1 Sticker-Platz</b></div>' : "") + (w.coins ? '<div class="rcard extra"><span class="ri em">🪙</span><b>+' + w.coins + ' Münzen</b></div>' : "") + '</div>' +
        (w.state === "ready" ? '<button class="btn wide lg" data-act="passclaim" data-n="' + w.n + '" style="margin-top:10px">🎁 Set abholen</button>' : w.claimed ? '<p class="small muted" style="margin:10px 0 0">Schon abgeholt. 🎉</p>' : "") + '</div>';
    }
    return '<section class="card passc"><div class="row"><div class="eyebrow" style="flex:1 1 auto">❄️ ' + esc(s.title) + '</div><span class="pill tnum">' + head + '</span></div>' +
      '<div class="ptiles">' + tiles + '</div>' + det + '</section>';
  }
  /* ---------- Showroom (Trophäenschrank) ---------- */
  var DANCE_NUM = { wackler: 1, huepfer: 2, drehung: 3, roboter: 4, moonwalk: 5, sieg: 6, eislauf: 7 };
  var RAR_NAME = { common: "Gewöhnlich", rare: "Selten", epic: "Episch", legend: "Legendär" };
  var RAR_GLOW = { common: "rgba(150,200,130,.7)", rare: "rgba(70,160,255,.8)", epic: "rgba(190,110,255,.85)", legend: "rgba(255,200,70,.95)" };
  var MED_COL = { common: ["#9bd48a", "#4f9a46"], rare: ["#7fd0ff", "#2f8cff"], epic: ["#d79bff", "#a855f7"], legend: ["#ffe58a", "#ffb61e"] };
  var SHIRTS = { natur: ["#b9c9de", "#b9c9de", ""], shirt: ["#35c6ff", "#35c6ff", ""], hoodie: ["#7a63f0", "#7a63f0", ""], trikot: [["#e53935", "#fff"], "#e53935", "7"], held: ["#2b6fe0", "#c62828", "★"], raum: ["#dfe6ee", "#dfe6ee", "★"], rock: ["#ffd23d", "#ffd23d", "♪"], polar: ["#3f9bff", "#3f9bff", "❄"],
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
    var m = /^md:(\w+?)(?:p(\d)|cup)?$/.exec(id) || [], k = id.slice(3), T = { boss1: ["common", "⚔"], boss5: ["rare", "⚔"], boss10: ["epic", "⚔"], serie7: ["rare", "7"], serie30: ["epic", "30"], serie100: ["legend", "100"], w25: ["rare", "25"], w100: ["epic", "100"] };
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
    var h = '<div class="stack srv"><div><h1 style="font-size:22px">🏆 Mein Showroom</h1><p class="small muted" style="margin:2px 0 0">Alles, was du gesammelt, gekauft und erspielt hast. Tippe auf ein Stück.</p></div>' + passCard() +
      '<section class="srtop"><div class="srring" style="--p:' + c.pct + '"><b>' + c.pct + '%</b></div><div class="srcups">' + c.cups.map(function (t) { var col = { Bronze: ["#e0975a", "#8a4a1e"], Silber: ["#eef2fa", "#8794ad"], Gold: ["#ffd24a", "#c8780a"], Platin: ["#c9efff", "#7a8fff"] }[t.n]; return '<div class="srcup' + (t.done ? "" : " lock") + '">' + svgCup(col[0], col[1]) + '<b>' + t.n + '</b><small>ab ' + t.pct + '%</small></div>'; }).join("") + '</div></section>' +
      '<div class="srrar">' + ["common", "rare", "epic", "legend"].map(function (r) { return '<span class="' + r + '"><b>' + c.rar[r] + '</b>' + RAR_NAME[r] + '</span>'; }).join("") + '</div>' +
      '<section class="srstage"><div class="srray"></div><div class="srfloor"></div><div class="srfav">' + favHtml + '</div><div class="srlbl">Favoriten</div><div class="srpod"><i></i></div><div class="srhero" id="srHero"></div>' +
      '<div class="srname" id="srName"></div><div class="srbtns"><button class="sbtn" data-act="srdance">💃 Tanzen</button><button class="sbtn b2" data-act="srswap">🔄 Wechseln</button></div></section>' +
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
    var nm = $("#srName"); if (nm) nm.innerHTML = '<b>' + esc(it ? it.label : "Fuchs") + '</b>' + (same ? ' · aktiv' : ' · <button class="chip" data-act="srwear">Als Avatar tragen</button>');
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
      else if (mm === "pass") { ov.remove(); tab = "home"; render(); view.scrollTop = 0; }
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
      (r.slot ? '<div class="rcard big extra" id="rcs"><span class="ri em">🏷️</span><b>+1 Sticker-Platz</b></div>' : "") + (r.coins ? '<div class="rcard big extra" id="rcc"><span class="ri em">🪙</span><b>+' + r.coins + ' Münzen</b></div>' : "");
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
      '<div class="pmap" style="height:' + H + 'px"><svg viewBox="0 0 100 ' + H + '" preserveAspectRatio="none" aria-hidden="true">' +
      '<path d="' + d + '" fill="none" stroke="#fff" stroke-opacity=".85" stroke-width="16" stroke-linecap="round" vector-effect="non-scaling-stroke"/>' +
      '<path d="' + dDone + '" fill="none" stroke="#2e7d4f" stroke-width="6" stroke-linecap="round" stroke-dasharray="1 12" vector-effect="non-scaling-stroke"/></svg>';
    sec.forEach(function (s, k) {
      var pt = pts[k], state = s.index < p.pos ? "done" : s.index === p.pos ? "cur" : "lock", stars = p.stars[s.id] || 0;
      var tip = (s.last ? "Boss-Runde: " + BOSS_NAMES[s.bossMode] + " (Ziel " + s.bossNeed + " richtig)" : "Station " + s.n + " von " + s.of + (s.verbIds ? " (mit unregelmäßigen Verben)" : "")) + " · " + s.sectionTitle +
        (state === "done" ? " · " + "★".repeat(stars) + "☆".repeat(3 - stars) + " · antippen zum Wiederholen" : state === "cur" ? " · jetzt dran" : " · noch gesperrt");
      h += '<button class="pnode ' + state + (s.last ? " boss" : "") + '" style="left:' + pt.x + '%;top:' + pt.y + 'px" data-tip="' + esc(tip) + '" title="' + esc(tip) + '" data-act="' + (state === "lock" ? "pathlocked" : state === "cur" ? "pathgo" : "pathreplay") + '" data-id="' + esc(s.id) + '" aria-label="' + esc(tip) + '">' +
        (state === "done" ? "✓" : state === "cur" ? (s.last ? "⚔️" : "▶") : s.last ? "⚔️" : "🔒") + '</button>';
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
      '<div class="small muted">' + (finished ? "Du kannst jede Station und jeden Boss noch einmal spielen." : "Station " + cur.n + " von " + cur.of + (cur.last ? " · Boss-Runde: " + BOSS_NAMES[cur.bossMode] : "")) + '</div>';
    // alle Abschnitte, der erste unten, der aktuelle wird in den Blick gescrollt
    var blocks = "", coords = null;
    for (var k = secIds.length - 1; k >= 0; k--) {
      var r = pathSectionHtml(bySec[secIds[k]], k + 1, secIds.length, p, finished ? null : cur);
      if (!finished && secIds[k] === cur.section) coords = r;
      blocks += r.html;
    }
    h += '<div class="pscroll" id="pscroll" tabindex="0" aria-label="Lernpfad, scrollbar">' + blocks + '</div>';
    if (p.pending.length) h += '<button class="btn wide lg" data-act="openchest" style="background:var(--gold,#f2b33d);color:#2b1d00;margin-bottom:8px">💰 Truhe öffnen' + (p.pending.length > 1 ? ' (' + p.pending.length + ')' : '') + '</button>';
    if (!finished) h += '<button class="btn wide lg" data-act="pathgo" data-id="' + esc(cur.id) + '">' + (cur.last ? "Boss-Runde starten ⚔️" : "Los geht’s – Station " + cur.n + " ▶") + '</button>' +
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
  function viewHome() {
    var st = S.state, r = S.rankOf(st.xp);
    var goalSec = S.goalMin() * 60, pct = Math.min(100, Math.round(st.daily.sec * 100 / goalSec));
    var toNext = r.next ? (r.next.xp - st.xp) : 0;
    var pn = playerName(), greet = pn && !/^Spieler \d+$/.test(pn) ? "Hallo " + esc(pn) : "Willkommen zurück";
    var hour = new Date().getHours();
    var biz = st.settings.track === "business";
    var tip = pct >= 100 ? "Tagesziel geschafft. Alles Weitere ist Bonus."
      : st.daily.sec > 0 ? "Noch " + fmtMin(goalSec - st.daily.sec) + " bis zum Tagesziel."
      : biz ? (hour < 12 ? "Fünf Minuten vor dem ersten Termin?" : "Eine kurze Runde zwischen zwei Meetings.")
      : hour < 12 ? "Eine kurze Runde vor der Schule?" : "Fünf Minuten reichen für heute.";
    var rec = lastRec = recommend(), mins = startMin || S.goalMin();

    var pf = S.state.profile, sky = hour >= 5 && hour < 11 ? "m" : hour < 17 ? "d" : hour < 21 ? "e" : "n";
    var cheer = pct >= 100 ? "Tagesziel geschafft! 🎉" : biz ? "Bereit für die nächste Runde?" : "Tipp mich an – ich tanze!";
    var rn = r.rank ? r.rank.n : "", xpPct = r.next ? Math.min(100, Math.round(r.into * 100 / Math.max(1, r.span))) : 100;
    var html = '<div class="stack">';
    html += '<section class="hh sky-' + sky + '"><div class="hhsky"><i class="hhsun"></i><i class="hhcl c1"></i><i class="hhcl c2"></i><i class="hhst"></i></div>' +
      (S.stickers().length ? '<div class="stk-corner">' + placedStickers(46) + '</div>' : "") +
      '<div class="hhtop"><div class="hhdate">' + esc(S.today().split("-").reverse().join(".")) + ' · ' + (biz ? "Business English" : "Schule") + '</div>' +
      '<h1>' + greet + '</h1><p class="hhtip">' + esc(tip) + '</p></div>' +
      '<div class="hhgoal"><div class="hhring" style="--p:' + pct + '"><b class="tnum">' + pct + '%</b></div><small>Tagesziel</small></div>' +
      '<div class="hhbubble" id="hhBub">' + esc(cheer) + '</div>' +
      '<div class="hhpod"><i></i></div><button class="hhfig" id="hhFig" data-act="hhdance" aria-label="Figur antippen">' + heroHtml(pf.avatar, 0) + '</button>' +
      '<div class="hhbar"><div class="hhrank"><b>' + esc(rn) + '</b><div class="hhxp"><i style="width:' + xpPct + '%"></i></div><small class="tnum">' + (r.next ? toNext + ' XP bis ' + esc(r.next.n) : "Höchster Rang") + '</small></div>' +
      '<div class="hhchips"><span class="hhc">🔥 <b class="tnum">' + st.streak.count + '</b></span><span class="hhc">🪙 <b class="tnum">' + st.coins + '</b></span></div></div>' +
      '</section>';

    html += pathCard();

    html += parentCards("plans");

    var wish = S.wish();
    var chDone = S.challengeDone();
    html += '<section class="card"><div class="eyebrow">Heute</div><div style="margin-top:6px">' +
      '<div class="mission' + (chDone ? " done" : "") + '"><div class="tick">' + (chDone ? "✓" : "🏆") + '</div><div class="txt"><div class="small" style="font-weight:600">Daily Challenge</div>' +
      '<div class="row" style="margin-top:4px;gap:8px"><span class="small muted" style="flex:1 1 auto">' + (chDone ? "Bonus geholt. Weitere Runden sind Zusatz-Runden." : "Bunte Runde aus allem, was dran ist.") + '</span><button class="chip" style="white-space:nowrap" data-act="start" data-mode="mix" data-min="' + S.goalMin() + '">' + (chDone ? "Zusatz →" : "Los →") + '</button></div></div>' +
      '<div class="pill nowrap">' + (chDone ? "✓" : "🪙 10") + '</div></div>' +
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
  }

  /* ================= ÜBEN: Spielmodi und Einheiten ================= */
  function modiHtml() {
    var st = S.state, p = S.pools(), stt = S.stats(), mins = startMin || S.goalMin(), biz = st.settings.track === "business", few = p.all.length < 8;
    var nW = S.itemsFor(mins), nS = Math.max(5, Math.round(mins * 60 / 16)), nV = Math.max(5, Math.round(mins * 60 / 20));
    function cnt(n) { return " · ≈ " + n + " " + plural(n, "Aufgabe", "Aufgaben"); }
    var W = window.WordySync, plans = (W && W.connected()) ? W.activePlans() : [], aud = audioAvailable();
    var learn = tile("🏆", 'Daily Challenge <span style="color:var(--gold)">★</span>', (S.challengeDone() ? "Bonus heute geholt ✓ · Zusatz-Runde" : "🎁 +10 🪙 Tagesbonus") + " · bunter Mix" + cnt(nW), 'data-act="start" data-min="' + mins + '"') +
      tile("✨", "Neue Wörter", S.newBlocked() ? "Erst die " + S.newBlocked() + " fälligen wiederholen" : p.fresh.length ? p.fresh.length + " warten auf dich" + cnt(Math.min(nW, p.fresh.length)) : "Alles schon gesehen", 'data-act="start" data-mode="new" data-min="' + mins + '"' + (p.fresh.length && !S.newBlocked() ? "" : " disabled")) +
      tile("♻️", "Fehlerkartei", p.box.length ? p.box.length + " " + plural(p.box.length, "Wort", "Wörter") + " üben" + cnt(Math.min(nW, p.box.length)) : "Leer, sehr gut!", 'data-act="start" data-mode="box" data-min="' + mins + '"' + (p.box.length ? "" : " disabled")) +
      tile("💬", "Sätze", stt.sent.total ? stt.sent.seen + " von " + stt.sent.total + " geübt" + cnt(Math.min(nS, stt.sent.total)) : "Für diesen Bereich noch keine", 'data-act="start" data-mode="sent" data-min="' + mins + '"' + (stt.sent.total ? "" : " disabled")) +
      (biz ? "" : tile("🔀", "Verben", "Unregelmäßige Verben" + cnt(nV), 'data-act="start" data-mode="verbs" data-min="' + mins + '"')) +
      plans.map(function (pl) {
        var pi = W.planInfo(pl);
        return tile("📅", esc(pl.title), (pi.days > 1 ? "in " + pi.days + " Tagen" : pi.days === 1 ? "morgen" : pi.days === 0 ? "heute" : "vorbei") + " · " + pi.pct + " %", 'data-act="startplan" data-id="' + esc(pl.id) + '"');
      }).join("");
    var modes = global.ARENA ? global.ARENA.MODES : [];
    var play = modes.map(function (m) {
      var b = global.ARENA.best(m.id);
      return tile(esc(m.icon), esc(m.name), esc(m.tag), 'data-act="arena" data-id="' + esc(m.id) + '"' + (few ? " disabled" : ""), b.best ? '<span class="pill tnum">Bestwert ' + b.best + '</span>' : "");
    }).join("");
    var plays = 0, arena = st.arena || {};
    for (var k in arena) plays += arena[k].plays || 0;
    var focusT = [["👂", "Hören", "Wort hören und finden", "listen", !aud], ["⌨️", "Tippen", "Wort selbst schreiben", "type"], ["🧩", "Lücken", "Satz vervollständigen", "gap"], ["🔗", "Zuordnen", "Paare verbinden", "match"]];
    var films = global.VTFILM ? '<section class="card"><div class="row"><div class="eyebrow" style="flex:1 1 auto">🎬 Erklärfilme</div><span class="pill">neu</span></div>' +
      '<p class="small muted" style="margin:6px 0 10px">Bruno, Pingo, Robbi und Eisi erklären jeden Modus in 30 Sekunden.</p><div class="fmlist">' +
      global.VTFILM.list.map(function (f) { return '<button class="fmcard" data-act="film" data-id="' + f.id + '"><span>' + f.icon + '</span><b>' + esc(f.title) + '</b><i>▶</i></button>'; }).join("") + '</div></section>' : "";
    return '<section class="card"><div class="eyebrow">Lernen</div>' +
      '<div class="row wrap" style="margin-top:8px"><span class="small muted">Dauer</span>' + [3, 5, 10, 15].map(function (m2) { return '<button class="chip" data-act="setmin" data-min="' + m2 + '" aria-pressed="' + (mins === m2) + '">' + m2 + ' Min</button>'; }).join("") + '</div>' +
      '<div class="tiles">' + learn + '</div></section>' +
      '<section class="card"><div class="eyebrow">Spielen</div>' +
      (few ? '<p class="small muted" style="margin:6px 0 0">Für die Spiele brauchst du mindestens acht Wörter im gewählten Bereich. Schalte unter „Lernbereich“ ein weiteres Schuljahr dazu.</p>' : '') +
      '<div class="tiles">' + play + '</div>' +
      '<details style="margin-top:12px"><summary class="small" style="cursor:pointer;font-weight:700">Wie die Spiele zählen</summary>' +
      '<p class="small muted" style="margin:8px 0 0">Ein Treffer unter Zeitdruck wird als sichere, aber flache Wiederholung gewertet. Er schiebt ein Wort eine Stufe weiter, ersetzt aber nicht das ruhige Training. Ein Fehlgriff landet sofort in der Fehlerkartei. Die Zeit läuft aufs Tagesziel.' + (plays ? ' Bisher ' + plays + ' ' + plural(plays, "Runde", "Runden") + ' gespielt.' : '') + '</p></details></section>' +
      films + '<section class="card"><div class="row"><div class="eyebrow" style="flex:1 1 auto">Gezielt üben</div><span class="pill">neu</span></div>' +
      '<p class="small muted" style="margin:6px 0 0">Eine Aufgabenform üben, mit Wörtern, die dran sind (≈ ' + nW + ' ' + plural(nW, "Aufgabe", "Aufgaben") + ').</p><div class="tiles">' +
      focusT.map(function (f) { return tile(f[0], f[1], f[2], 'data-act="start" data-mode="focus" data-focus="' + f[3] + '" data-min="' + mins + '"' + (f[4] ? " disabled" : "")); }).join("") + '</div></section>';
  }
  function viewUeben() {
    if (detailUnit === "__verbs") return viewVerbList();
    if (detailUnit) return viewUnitDetail(detailUnit);
    view.innerHTML = '<div class="stack">' + segBar("ueben", uebenSeg, [["modi", "🎮 Spielmodi"], ["units", "📚 Lernbereich"]]) +
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
    html += '<section class="card"><div class="eyebrow">Lernbereich</div><div style="margin-top:8px">' + trackSwitch() + '</div></section>';
    html += '<section class="card">' +
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
      html += '<details class="grp" data-k="__verbs"' + (openGroups.__verbs ? " open" : "") + '><summary><span class="chev">▸</span><span style="flex:1 1 auto;min-width:0"><b>🔀 Unregelmäßige Verben</b>' +
        '<span class="small muted" style="display:block">' + vs0.seen + ' von ' + vs0.total + ' geübt · ' + vs0.mastered + ' sitzen</span></span></summary>' +
        verbCard().replace(/^<section class="card"[^>]*>(<div class="row"><div style="flex:1 1 auto"><div class="eyebrow">[^<]*<\/div>)/, '<div class="row"><div style="flex:1 1 auto">').replace(/<\/section>$/, "") + '</details>';
    }
    var byGroup = {}, order = [];
    stt.perUnit.forEach(function (u) {
      if (u.track !== "eigen" && sel.indexOf(u.k) < 0) return;   // nur die gewählten Stufen bzw. Jahrgänge
      var key = String(u.k);
      if (!byGroup[key]) { byGroup[key] = []; order.push(key); }
      byGroup[key].push(u);
    });
    order.sort(function (a, b) { var ia = groups.indexOf(/^\d+$/.test(a) ? +a : a), ib = groups.indexOf(/^\d+$/.test(b) ? +b : b); return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib); });
    order.forEach(function (k) {
      var title = k === "0" ? "✏️ Eigene Vokabeln" : k === "Headlight 2" ? "📕 Headlight 2 (Schulbuch)" : groupLabel(byGroup[k][0].k);
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
        '<div>' + rest.map(unitRow).join("") + '</div>' +
        (books.length ? bookTile(BOOKS.filter(function (b) { return books[0].id.indexOf(b.pre) === 0; })[0], books) + books.map(unitRow).join("") : "") + '</details>';
    });
    return html;
  }
  /* Buchkachel: selbst gezeichnetes Cover über den Einheiten eines Schulbuchs */
  var BOOKS = [{ pre: "H2-", name: "HEADLIGHT", no: "2", sub: "Schulbuch · Unit 1–6" }];
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
      (audioAvailable() ? '<button class="btn ghost" data-act="readall" data-id="' + esc(u.id) + '">🔊 Alle vorlesen</button>' : '') + '</div>' +
      '<div class="eyebrow" style="margin-top:14px">Wie möchtest du üben?</div><div class="row wrap" style="margin-top:8px;gap:8px">' +
      [["👂", "Hören", "listen", !audioAvailable()], ["⌨️", "Tippen", "type"], ["🧩", "Lücken", "gap"], ["🔗", "Zuordnen", "match"]].map(function (f) {
        return f[3] ? "" : '<button class="chip" data-act="start" data-unit="' + esc(u.id) + '" data-focus="' + f[2] + '" data-min="5">' + f[0] + ' ' + f[1] + '</button>';
      }).join("") + '</div>' +
      (audioAvailable() ? '<p class="small muted" style="margin:10px 0 0">Tippe auf 🔊 neben einem Wort, um nur dieses zu hören.</p>' : '') + '</section>' +
      '<section class="card"><div class="eyebrow">Wortliste</div>' + rows + '</section></div>';
  }


  /* ---------- Auto-Save / Lernfortschritt: Verbindung zum Server ---------- */
  {   // sync.js wird nach app.js geladen und ruft diese Hooks auf
    window.WordyHooks = {};
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
      toast("🎉 " + (list[0].kind === "plan" ? "Lernplan geschafft" : list[0].kind === "week" ? "Wochenplan geschafft" : "Wochenziel geschafft") + ": " + list[0].title + (c ? " · +" + c + " Münzen" : ""), 6000);
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
      '<button class="btn soft wide" data-act="syncpair" style="margin-top:8px">Verbinden</button>';
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
      '• <b>Boss-Truhen</b> 30 bis 60, manchmal mit Überraschung · <b>Rangaufstieg</b> 50 plus 10 je Rang und ein Geschenk<br>' +
      '• <b>Erste Woche</b> ×1,5 Münzen · jeden Tag ein <b>Tagesangebot</b> mit 20 % Rabatt<br>' +
      '<span class="muted">Jedes Wort zahlt höchstens einmal pro Tag und nur, wenn es zur Wiederholung dran war. Immer dieselben Wörter zu üben bringt nichts – neue Einheiten und fällige Wörter schon. Missionen, Tagesziel und Serien werden am Ende der Runde gutgeschrieben.</span></div></details></section>';
  }
  /* ---------- Ränge und XP: Übersicht ---------- */
  function ranksCard() {
    var st = S.state, cur = S.rankOf(st.xp);
    var rows = S.RANKS.map(function (r, i) {
      var reached = st.xp >= r.xp, isCur = r.n === cur.rank.n, next = S.RANKS[i + 1];
      var unlocks = S.SHOP.filter(function (x) { return x.rank === r.n && x.kind !== "sticker"; }).map(function (x) { return x.label; });
      var pc = isCur && next ? Math.round(cur.into * 100 / cur.span) : 0;
      return '<div class="rank-i' + (isCur ? " cur" : reached ? "" : " off") + '"><div class="row" style="gap:10px;align-items:center">' +
        '<span style="width:22px;text-align:center">' + (isCur ? "▶" : reached ? "✓" : "🔒") + '</span>' +
        '<b style="flex:1 1 auto">' + esc(r.n) + '</b><span class="small muted tnum">ab ' + r.xp.toLocaleString("de-DE") + ' XP</span></div>' +
        (isCur && next ? '<div class="bar" style="margin:6px 0 2px 32px"><i style="width:' + pc + '%"></i></div><div class="small muted" style="margin-left:32px">Noch ' +
          (next.xp - st.xp).toLocaleString("de-DE") + ' XP bis ' + esc(next.n) + '</div>' : "") +
        (unlocks.length ? '<div class="small muted" style="margin:3px 0 0 32px">🔓 ' + esc(unlocks.join(", ")) + ' <span title="Sticker gibt es auch">(+ Sticker)</span></div>' : "") + '</div>';
    }).join("");
    return '<section class="card"><div class="eyebrow">Alle Ränge</div>' +
      '<p class="small muted" style="margin:6px 0 8px">Dein Stand: <b>' + st.xp.toLocaleString("de-DE") + ' XP</b> · ' + esc(cur.rank.n) + '. Das schaltest du mit jedem Rang im Shop frei.</p>' + rows +
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
  var shopTab = "avatar";
  var THEME_DOT = { paper: "#1E6273", mint: "#2E7357", plum: "#6A3D70", amber: "#8A5A1B" };
  function shopIcon(it) {
    switch (it.kind) {
      case "avatar": return avatarHtml(it.val);
      case "sticker": return stickerHtml(it, 38);
      case "theme": return '<span class="dot" style="background:' + (THEME_DOT[it.val] || "#1E6273") + '"></span>';
      case "frame": return '<span class="avatar fr-' + it.val + '" style="width:26px;height:26px;font-size:14px">' + (it.val === "none" ? "—" : "🙂") + '</span>';
      case "title": return "🏷️";
      case "bg": return it.val === "stars" ? "✨" : it.val === "clouds" ? "☁️" : it.val === "space" ? "🌌" : "▫️";
      case "fx": return it.val === "confetti" ? "🎊" : it.val === "stars" ? "⭐" : it.val === "sparks" ? "⚡" : it.val === "firework" ? "🎆" : it.val === "snow" ? "❄️" : "▫️";
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
    var list = S.SHOP.filter(function (x) { return x.kind === "sticker" && (set ? x.set === set : !x.set); });
    var have = list.filter(function (x) { return S.owns(x); }).length;
    return '<section class="card"><div class="row"><div class="eyebrow" style="flex:1 1 auto">' + (set ? "Fortnite-Stickerbuch" : "Stickerbuch") + '</div><span class="pill tnum">' + have + ' / ' + list.length + '</span></div>' +
      '<p class="small muted" style="margin:6px 0 10px">Sammle Sticker im Shop und klebe bis zu drei davon auf deine Startseite und dein Profil. Antippen klebt auf oder löst ab.</p>' +
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
    var st = S.state, list = S.SHOP.filter(function (x) { return x.kind === "avatar" && (set ? x.set === set : !x.set); });
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
  /* Sticker-Plätze: nacheinander freischalten (Platz 2: 100, Platz 3 bis 5: je 150 Münzen) */
  function slotsHtml() {
    var n = S.stickerSlots(), st = S.state, next = n < 5 ? S.SLOT_COST[n] : 0, h = '<div class="shopitem" style="flex-wrap:wrap;gap:8px"><span style="flex:1 1 100%"><b class="small">Sticker-Plätze auf deinem Profil</b><br><span class="small muted">' +
      n + ' von 5 freigeschaltet. So viele Sticker kannst du gleichzeitig aufkleben.</span></span><span class="row" style="gap:6px;flex:1 1 auto">';
    for (var i = 1; i <= 5; i++) h += '<span class="pill" style="' + (i <= n ? "background:var(--accent-soft);font-weight:700" : "opacity:.55") + '">' + (i <= n ? "✓ " : "🔒 ") + i + '</span>';
    h += '</span>';
    if (n < 5) h += '<button class="btn soft" data-act="buyslot"' + (st.coins < next ? ' aria-disabled="true" style="opacity:.6"' : "") + '>Platz ' + (n + 1) + ' freischalten · 🪙 ' + next + '</button>';
    return h + '</div>';
  }
  function tierOf(c) { return c <= 120 ? "Gewöhnlich" : c <= 350 ? "Selten" : c <= 800 ? "Episch" : "Legendär"; }
  function untilMidnight() {
    var n = new Date(), m = new Date(n.getFullYear(), n.getMonth(), n.getDate() + 1), mins = Math.max(1, Math.round((m - n) / 60000));
    return Math.floor(mins / 60) + " Std. " + (mins % 60) + " Min.";
  }
  /* Seltenheits-Karte im Shop: Farbe, Glanz und Etikett nach Seltenheit; gleiche Aktionen wie die Listenzeile */
  function shopTile(it, wishId) {
    var own = S.owns(it), act = S.isActive(it), locked = !own && lockNote(it), price = S.priceOf(it), deal = price !== it.cost, rar = S.rarityOf(it), c = MED_COL[rar] || MED_COL.common;
    var setName = it.reward ? (S.SETS.filter(function (s) { return s.reward === it.id; })[0] || {}).name : "";
    var star = '<button class="rwish" data-act="wish" data-id="' + esc(it.id) + '" aria-pressed="' + (wishId === it.id) + '" aria-label="Wunsch">⭐</button>';
    var action = own ? '<button class="rbtn' + (act ? " on" : "") + '" data-act="equip" data-id="' + esc(it.id) + '">' + (act ? "✓ aktiv" : "Auswählen") + '</button>'
      : it.pass ? '<span class="rpill">🎁 ' + esc(it.pass) + '-Pass</span>' : it.reward ? '<span class="rpill">🎁 ' + esc(setName) + '</span>'
      : locked ? '<span class="rpill">🔒 ab ' + esc(it.rank) + '</span>'
      : '<button class="rbtn buy" data-act="buy" data-id="' + esc(it.id) + '">🪙 ' + (deal ? '<s>' + it.cost + '</s> ' : "") + price + '</button>';
    var sub = KIND_NAME[it.kind] + (it.bundle ? " · ❄️ Eis-Set" : "") + (it.rank && !own && !locked ? " · ab " + esc(it.rank) : "");
    var prev = (it.kind === "dance" || it.kind === "outfit" || it.kind === "kit") ? '<button class="rprev" data-act="dancetry" data-id="' + esc(it.id) + '" aria-label="Vorschau">▶︎</button>' : "";
    return '<div class="rtile ' + rar + (own ? " own" : "") + (locked ? " lock" : "") + '" style="--c1:' + c[0] + ';--c2:' + c[1] + ';--g:' + RAR_GLOW[rar] + '">' +
      '<span class="rtag">' + RAR_NAME[rar] + '</span>' + (own || it.pass || it.reward || locked ? "" : star) + (own ? '<span class="rown">✓</span>' : "") +
      '<div class="rico">' + srIcon({ kind: it.kind, val: it.val, rar: rar, it: it }) + prev + '</div>' +
      '<b class="rname">' + esc(it.label) + '</b><span class="rsub">' + sub + '</span><div class="ract">' + action + '</div></div>';
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
    html += '<div class="rgrid">' + S.SHOP.filter(function (it) { return shopTab === "fn" ? it.set === "fn" : it.kind === shopTab && !it.set; }).map(function (it) { return shopTile(it, wishId); }).join("") + '</div>';
    return html + '</section>';
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
    else if (statsSeg === "verlauf") html += weekPlanCard() + parentCards("goals") + secDays + secSent;
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
      ["📚", "Einheiten", "Unter <b>Üben → Lernbereich</b> wählst du Schule oder Business, Schuljahr oder Stufe und öffnest eine Einheit. Dort kannst du nur diese Einheit üben, anhören oder gezielt eine Aufgabenform trainieren."],
      ["🧩", "Aufgaben", "Wortkarte, Auswahl, Hören, Lückentext, Schreiben, Zuordnen und Satzbau. Eine falsche Antwort kostet ein Herz (unter Setup abschaltbar) und kommt später wieder."],
      ["✍️", "Unregelmäßige Verben", "<b>Üben → Spielmodi → Verben</b> (Einführung, Lückenaufgabe, Tippen). Die Verbenliste mit Beispielsätzen findest du unter <b>Üben → Lernbereich</b>."],
      ["⚡", "Arena", "Vier Zeitmodi unter <b>Spielen</b>: <b>Match-Rausch</b> (Paare in 60 Sekunden), <b>Blitzrunde</b> (Zeit sammeln), <b>Letztes Herz</b> (ein Fehler beendet), <b>Fehlerjagd</b> (Kartei leeren)."],
      ["📈", "Fortschritt", "Drei Ansichten: <b>Übersicht</b> (Wo stehe ich?), <b>Wörter</b> (schwierigste Wörter, Fehlerkartei, Verben) und <b>Verlauf</b> (die letzten 14 Tage, Satzbau)."],
      ["🪙", "Münzen & Shop", "Münzen gibt es für Fortschritt, Missionen und das Tagesziel. Im <b>Shop</b> kaufst du Figuren, Rahmen, Farben und mehr. Mit dem ⭐ setzt du einen Wunsch, auf den du sparst."],
      ["⭐", "Sammlung & Abzeichen", "<b>Shop → Sammlung</b>: Tier-Album und Stickerbuch (Sticker antippen klebt sie auf, bis zu drei). <b>Abzeichen</b> und <b>Ränge</b> haben eigene Reiter im Shop."],
      ["⚙️", "Setup", "Das Zahnrad ⚙️ oben rechts: Spieler wechseln, Tagesziel und Ton einstellen, Auto-Save, eigene Vokabeln und Updates."]
    ];    return '<details class="how"><summary class="how-sum"><span class="chev" aria-hidden="true">▸</span><span style="flex:1 1 auto"><b>So funktioniert Wordy</b>' +
      '<span class="small muted" style="display:block">Kurz erklärt in zehn Schritten</span></span></summary>' +
      '<ol class="how-list">' + steps.map(function (x) {
        return '<li><span class="hi">' + x[0] + '</span><div><b>' + x[1] + '</b><div class="small muted">' + x[2] + '</div></div></li>';
      }).join("") + '</ol></details>';
  }
  function viewParent() {
    var st = S.state, s = S.stats();
    var html = '<div class="stack">';
    html += howToCard();
    function unCard(h) { return h.replace(/^<section class="card"[^>]*>(<div class="eyebrow"[^>]*>[^<]*<\/div>)?/, "").replace(/<\/section>$/, ""); }
    function fold(key, icon, title, sub, inner) {
      return '<details class="fold" data-f="' + key + '"' + (openFolds[key] ? " open" : "") + '><summary><span class="chev">▸</span><span style="flex:1 1 auto;min-width:0"><b>' + icon + " " + title + '</b>' +
        (sub ? '<span class="small muted" style="display:block">' + sub + '</span>' : "") + '</span></summary><div class="fbody">' + inner + '</div></details>';
    }
    html += fold("spieler", "👤", "Spieler &amp; Lernbereich", "Wer lernt, Schule oder Business", unCard(playersCard()) +
      '<div class="eyebrow" style="margin-top:16px">Lernbereich</div>' + trackSwitch() +
      '<p class="small muted" style="margin:12px 0 0">Schule und Business haben getrennte Wortschätze, Sätze und Statistiken. Der Fortschritt bleibt in beiden Bereichen erhalten.</p>');
    html += fold("lernen", "🎓", "Lernen", "Tagesziel, neue Wörter, Herzen",
      '<label class="row" style="margin-top:4px"><span style="flex:1 1 auto">Tagesziel</span>' +
      '<select id="setGoal" style="width:auto">' + [5, 10, 15, 20, 30].map(function (m) {
        return '<option value="' + m + '"' + (st.settings.goalMin === m ? " selected" : "") + '>' + m + ' Minuten</option>';
      }).join("") + '</select></label>' +
      '<label class="row" style="margin-top:10px"><span style="flex:1 1 auto">Neue Wörter pro Tag</span>' +
      '<select id="setNew" style="width:auto">' + [6, 12, 20, 30].map(function (m) {
        return '<option value="' + m + '"' + (st.settings.newPerDay === m ? " selected" : "") + '>' + m + '</option>';
      }).join("") + '</select></label>' +
      '<label class="row" style="margin-top:10px"><span style="flex:1 1 auto">Pause nach der Antwort<br><span class="small muted">Die Lösung bleibt kurz stehen. Bei Fehlern wird sie vorgelesen und das Wort einmal abgeschrieben</span></span>' +
      '<input type="checkbox" id="setPause" ' + (st.settings.pause !== false ? "checked" : "") + ' style="width:auto"></label>' +
      '<label class="row" style="margin-top:10px"><span style="flex:1 1 auto">Lernpfad auf dem Start-Tab<br><span class="small muted">Stationen und Truhen. Aus = nur die Empfehlung</span></span>' +
      '<input type="checkbox" id="setPathOn" ' + (st.settings.pathOn !== false ? "checked" : "") + ' style="width:auto"></label>' +
      '<label class="row" style="margin-top:10px"><span style="flex:1 1 auto">Arena als Tagesmission<br><span class="small muted">Ab und zu ist eine Arena-Runde eine der drei Tagesmissionen</span></span>' +
      '<input type="checkbox" id="setArenaM" ' + (st.settings.arenaMissions !== false ? "checked" : "") + ' style="width:auto"></label>' +
      '<label class="row" style="margin-top:10px"><span style="flex:1 1 auto">Herzen benutzen<br><span class="small muted">Aus = Üben ohne Abbruch</span></span>' +
      '<input type="checkbox" id="setHearts" ' + (st.settings.hearts ? "checked" : "") + ' style="width:auto"></label>' +
      '<p class="small muted" style="margin:10px 0 0">Gelernt wird als <b>' + esc(playerName()) + '</b>. Den Namen änderst du unter „Spieler“.</p>');
    html += fold("ton", "🔊", "Ton &amp; Aussehen", "Vorlesen, Hell oder Dunkel",
      '<label class="row" style="margin-top:4px"><span style="flex:1 1 auto">Aussprache vorlesen<br><span class="small muted">Nutzt die englische Stimme des Geräts</span></span>' +
      '<input type="checkbox" id="setAudio" ' + (st.settings.audio ? "checked" : "") + ' style="width:auto"></label>' +
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
      '<label class="row" style="margin-top:10px"><span style="flex:1 1 auto">Erzählerstimme (Erklärfilme)<br><span class="small muted">Frau: warm, Mann: tief und ruhig</span></span>' +
      '<select id="setNarr" style="width:auto">' + [["auto", "Automatisch"], ["f", "Frau"], ["m", "Mann"]].map(function (o) {
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
    html += fold("about", "ℹ️", "Über Wordy", "Version " + esc(global.WORDY_VERSION || "–") + ", Updates, Installieren", unCard(installCard()) + '<hr class="sep" style="margin:14px 0">' + aboutHtml);
    html += '</div>';
    view.innerHTML = html;
    $$("details.fold").forEach(function (d) { d.addEventListener("toggle", function () { openFolds[d.getAttribute("data-f")] = d.open; }); });

    $("#setGoal").onchange = function () { st.settings.goalMin = +this.value; S.save(true); renderHeader(); };
    $("#setNew").onchange = function () { st.settings.newPerDay = +this.value; S.save(true); };
    $("#setAudio").onchange = function () { st.settings.audio = this.checked; S.save(true); };
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
    return v.s.map(function (x, i) {
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
    var lines = v.s.map(function (x) {
      return '<span class="cmp">' + (audioAvailable() ? '<button class="mini-speak" data-act="say" data-text="' + esc(x.en) + '" aria-label="Satz anhören">🔊</button>' : "") + sentHtml(x) + '</span>';
    }).join("");
    return { id: v.id, en: v.en, de: v.de + (v.alt ? " (alle Formen: " + v.past + " · " + v.pp + ")" : ""), ex: v.ex, exHtml: lines };
  }
  /* Unregelmäßige Verben als Lückenaufgabe: Form wählen, die zum Zeitwort passt */
  function regularForm(inf) {
    if (/^(be|have|do)$/.test(inf)) return null;
    return /e$/.test(inf) ? inf + "d" : /[^aeiou]y$/.test(inf) ? inf.slice(0, -1) + "ied" : inf + "ed";
  }
  function verbGapOptions(v) {
    var seen = {}, opts = [];
    v.s.map(function (x) { return x.form; }).concat([regularForm(v.inf)]).forEach(function (f, i) {
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
      out.push(gap && easy && !typeOnly ? { type: "verbgap", v: v, idx: Math.floor(Math.random() * 3) } : { type: "verb", v: v });
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
    S.rollDay(); S.regenHearts();
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
      retry: [], mode: opts.mode || "mix", ended: false, planned: list.length
    };
    snapStart();
    sessionEl.hidden = false; document.body.style.overflow = "hidden";
    renderTask();
  }
  function startPathStation(id) {
    S.rollDay(); S.regenHearts();
    var st = S.pathStations().filter(function (x) { return x.id === id; })[0]; if (!st) return;
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
    var rw = S.finishSession({ items: SS.items, correct: SS.correct, sec: sec, maxChain: SS.maxChain, newSeen: SS.newSeen, deep: SS.deep || 0, daily: SS.mode === "mix", boxSolved: SS.boxSolved, mastered: SS.mastered, sentOk: SS.sentOk });
    var st = S.state, acc = SS.items ? Math.round(SS.correct * 100 / SS.items) : 0;
    var head = reason === "hearts" ? "Kurze Pause" : SS.correct === SS.items && SS.items > 3 ? "Fehlerfrei!" : "Runde geschafft";
    var msg = reason === "hearts"
      ? "Die Herzen sind alle. Dein Fortschritt ist gespeichert – die Herzen füllen sich von selbst wieder auf."
      : acc >= 90 ? "Das saß. Weiter so." : acc >= 70 ? "Solide Runde. Die Wackelkandidaten kommen bald wieder." : "Schwierige Wörter dabei – die landen jetzt in der Fehlerkartei und kommen häufiger dran.";
    var good = reason !== "hearts";
    var perfect = good && SS.correct === SS.items && SS.items > 3;
    var stars = !good ? 0 : acc >= 90 ? 3 : acc >= 70 ? 2 : 1;
    var pr = SS.station && reason === "done" ? S.pathComplete(SS.station.id, stars) : null;
    var xp0 = SS.xp0 == null ? st.xp : SS.xp0, gain = Math.max(0, st.xp - xp0), coinGain = Math.max(0, st.coins - (SS.coins0 == null ? st.coins : SS.coins0));
    if (window.WordySync) { window.WordySync.sessionEnd({ sec: sec, items: SS.items, correct: SS.correct, mode: SS.mode || "mix", coins: coinGain, xp: gain, reason: reason }); window.WordySync.ctx = null; }
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
    if (rw.challenge) html += '<section class="card" style="border-color:var(--gold)"><div class="eyebrow" style="color:var(--gold)">🎁 Daily Challenge geschafft</div><p style="margin:6px 0 0">Tagesbonus: <b>+' + rw.challenge + ' 🪙</b>. Morgen wartet die nächste Challenge.</p></section>';
    if (rw.goalReached) html += '<section class="card"><div class="eyebrow" style="color:var(--good)">Tagesziel erreicht</div>' + (rw.streakUp ? '<div class="fin-flame">🔥</div>' : "") + '<p style="margin:6px 0 0">' + (rw.streakUp ? "Streak steht bei " + st.streak.count + " " + plural(st.streak.count, "Tag", "Tagen") + "." : "Schon erledigt heute.") + '</p></section>';
    if (rw.missions.length) html += '<section class="card"><div class="eyebrow">Missionen erfüllt</div>' + rw.missions.map(function (m) { return '<div class="mission done"><div class="tick">✓</div><div class="txt small">' + esc(m.n) + '</div><span class="pill">🪙 ' + m.coins + '</span></div>'; }).join("") + '</section>';
    if (rw.badges.length) html += '<section class="card"><div class="eyebrow">Neue Abzeichen</div><div class="badges" style="margin-top:8px">' + rw.badges.map(function (b) { return '<div class="badge"><div class="g">🏅</div><b>' + esc(b.n) + '</b></div>'; }).join("") + '</div></section>';
    if (pr) html += '<section class="card"><div class="eyebrow">Lernpfad</div><p style="margin:6px 0 0"><b>Station geschafft</b> · ' + "★".repeat(stars) + "☆".repeat(3 - stars) + (pr.advanced ? "" : " (Wiederholung)") + '</p>' +
      (pr.chest ? '<p class="small" style="margin:6px 0 0">💰 Abschnitt geschafft – eine Truhe wartet auf dich!</p>' : pr.finished ? '<p class="small" style="margin:6px 0 0">🏆 Du hast den ganzen Pfad geschafft!</p>' : "") + '</section>';
    if (SS.station) html += '<div class="row" style="gap:8px">' + (pr && pr.chest ? '<button class="btn wide lg" data-act="openchest">💰 Truhe öffnen</button>' : '<button class="btn wide lg" data-act="close">' + (pr ? "Weiter auf dem Pfad" : "Zurück zum Pfad") + '</button>') + '</div></div></div>';
    else html += '<div class="row" style="gap:8px"><button class="btn wide" data-act="again">' + (SS.mode === "mix" && S.challengeDone() ? "Zusatz-Runde" : "Noch eine Runde") + '</button>' +
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
        '<div><div class="prompt">' + esc(w.en) + '</div><div class="sub" style="margin-top:4px">' + esc(w.de) + '</div></div></div>' +
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
      body.innerHTML = '<div class="stack" style="padding-top:8px"><div class="eyebrow">Was passt nicht?</div>' +
        '<h2 style="font-size:20px">Drei Wörter gehören zum Thema „' + esc(topic) + '“.</h2>' +
        optionList(opts) + '</div>';
      foot.innerHTML = footCheck();
    },
    verbintro: function (t, body, foot) {
      var v = t.v, w = verbWord(v);
      body.innerHTML = '<div class="stack" style="padding-top:8px">' +
        '<div class="eyebrow">Neues unregelmäßiges Verb</div>' +
        '<div class="row" style="gap:14px;align-items:center">' + (audioAvailable() ? speakBtn(w.en, true) : "") +
        '<div><div class="prompt">' + esc(v.inf) + '</div><div class="sub" style="margin-top:4px">' + esc(v.de) + '</div></div></div>' +
        '<div class="card" style="background:var(--card-2);box-shadow:none"><div class="eyebrow">Die drei Formen</div>' +
        '<p style="margin:6px 0 0;font-family:Newsreader,serif;font-size:22px">' + esc(v.inf) + ' – ' + esc(v.past) + ' – ' + esc(v.pp) + '</p></div>' +
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
    },
    verb: function (t, body, foot) {
      var v = t.v;
      body.innerHTML = '<div class="stack" style="padding-top:8px"><div class="eyebrow">Unregelmäßiges Verb</div>' +
        '<div class="row" style="gap:12px;align-items:center">' + (audioAvailable() ? speakBtn(v.inf) : "") +
        '<div><div class="prompt">' + esc(v.inf) + '</div><div class="sub" style="margin-top:4px">' + esc(v.de) + '</div></div></div>' +
        '<label class="small muted" for="vPast" style="margin-bottom:-6px">Simple Past (Präteritum, 2. Form)</label>' +
        '<input id="vPast" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" enterkeyhint="next" placeholder="z. B. went">' +
        '<label class="small muted" for="vPp" style="margin-bottom:-6px">Past Participle (Partizip Perfekt, 3. Form)</label>' +
        '<input id="vPp" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" enterkeyhint="done" placeholder="z. B. gone">' +
        inlineCheck() +
        '<p class="small muted" style="margin:0">Beides muss stimmen. Kleine Tippfehler zählen halb.</p></div>';
      foot.innerHTML = "";
      var a = $("#vPast"), b = $("#vPp"), btn = $("#inlineCheck");
      function upd() { btn.disabled = !(a.value.trim() && b.value.trim()); }
      a.addEventListener("input", upd); b.addEventListener("input", upd);
      a.addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); b.focus(); } });
      b.addEventListener("keydown", function (e) { if (e.key === "Enter" && !btn.disabled) check(); });
      [a, b].forEach(function (el) { el.addEventListener("focus", function () { setTimeout(function () { btn.scrollIntoView({ block: "nearest" }); }, 300); }); });
      setTimeout(function () { a.focus(); }, 60);
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
        '<p class="small muted" style="margin:0">Tipp auf einen Buchstaben, um davor oder danach etwas einzufügen.</p>' +
        '<div class="tiles" id="tiles">' + letters.map(function (l, i) {
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
      var cur = t.cursor == null ? t.built.length : Math.min(t.cursor, t.built.length), h = "", k;
      for (k = 0; k < t.built.length; k++) {
        if (k === cur) h += '<i class="caret"></i>';
        h += '<span class="sl" data-i="' + k + '">' + (t.built[k] === " " ? "&nbsp;" : esc(t.built[k])) + '</span>';
      }
      if (cur >= t.built.length) h += '<i class="caret"></i>';
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
      if (!ok) speak(w.en);   // die richtige Lösung wird vorgelesen
    }
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
    if (ok || pauseOn()) speak(x.en, 0.9);
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
      var ga = judgeTyped($("#vPast").value, v.past), gb = judgeTyped($("#vPp").value, v.pp);
      var gv = ga === 0 || gb === 0 ? 0 : (ga === 2 && gb === 2 ? 2 : 1);
      SS.answered = true;
      var rv = applyGrade(vw, gv);
      if (gv === 0) SS.retry.push({ type: "verb", v: v });
      verdict(gv > 0, vw, rv, gv === 1 ? "fast – achte auf die Schreibweise"
        : gv === 0 ? "Deine Antwort: " + ($("#vPast").value.trim() || "–") + " / " + ($("#vPp").value.trim() || "–") : null);
      $("#vPast").disabled = true; $("#vPp").disabled = true;
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
    if (ok && (t.type === "listen" || t.type === "mc_en_de")) speak(w.en);
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
    else if (a === "quit") { if (SS && SS.items) endSession("quit"); else closeSession(); }
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
    var chips = $$("#slot .sw");
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
      if (d.fromSlot) {
        var wd = t.built.splice(d.idx, 1)[0], tl = t.usedTiles.splice(d.idx, 1)[0];
        if (over) { if (at > d.idx) at--; t.built.splice(at, 0, wd); t.usedTiles.splice(at, 0, tl); }
        else if (tl) tl.classList.remove("used");   // aus der Reihe gezogen: zurück in die Auswahl
      } else if (over) {
        t.built.splice(at, 0, d.el.getAttribute("data-ch")); t.usedTiles.splice(at, 0, d.el); d.el.classList.add("used");
      }
      $("#mainBtn").disabled = t.built.length !== t.target.length;
    }
    if (SS && SS.tasks[SS.i] === t) paintSlot(t, true);
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
    paintSlot(d.t, true, over ? dropIndex(e.clientX, e.clientY) : null, d.fromSlot ? d.idx : null);
  }
  function dragUp(e) { dragEnd(true, e); }
  function dragCancel(e) { dragEnd(false, e); }
  sessionEl.addEventListener("pointerdown", function (e) {
    var t = SS && SS.tasks[SS.i]; if (!t || t.type !== "build" || SS.answered || e.button > 0) return;
    var el = e.target.closest(".sw, .tile.word"); if (!el || el.classList.contains("used")) return;
    drag = { el: el, t: t, fromSlot: el.classList.contains("sw"), idx: +(el.getAttribute("data-i") || 0), x0: e.clientX, y0: e.clientY, moved: false, ghost: null };
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
    else if (a === "startplan") {
      var pl = window.WordySync.activePlans().filter(function (x) { return String(x.id) === act.getAttribute("data-id"); })[0];
      if (pl) { var pi = window.WordySync.planInfo(pl); startSession({ minutes: S.goalMin(), scope: pl.units, newMax: Math.max(pi.quota, (st.daily && st.daily.newSeen) || 0), mode: "plan" }); }
    }
    else if (a === "syncpair") {
      var inp = $("#syncCode"), txt = inp ? inp.value : ""; act.disabled = true; act.textContent = "Verbinde …";
      window.WordySync.pair(txt).then(function (r) {
        if (r.error) { toast(r.error); act.disabled = false; act.textContent = "Verbinden"; return; }
        toast(window.WordySync.info().hidden ? "Verbunden. Dein Lernstand wird gesichert." : "Verbunden. Deine Eltern sehen jetzt deinen Lernfortschritt.");
        if (r.backups && r.backups.length) {
          var b0 = r.backups[0], dt = new Date(b0.ts);
          if (confirm("Auf dem Server liegt ein gesicherter Lernstand von " + r.name + " (" + dt.toLocaleDateString("de-DE") + ", " + b0.words + " Wörter, " + b0.coins + " Münzen). Wiederherstellen?")) {
            window.WordySync.restore(b0.day).then(function (rr) { toast(rr.error || "Lernstand wiederhergestellt."); render(); });
            return;
          }
        }
        render();
      });
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
    else if (a === "passclaim") { openPassReward(act.getAttribute("data-n")); }
    else if (a === "sritem") { srModal(act.getAttribute("data-id")); }
    else if (a === "hhdance") {
      var hp = S.state.profile, hn = DANCE_NUM[hp.dance] || 1, hb = $("#hhBub"), CH = ["Yeah! 💪", "Weiter so, Champion! 🏆", "Heute knacken wir ein Wort mehr!", "Ich tanze nur für dich 💃", "Wörter sammeln macht stark!"];
      var hf = $("#hhFig"); if (!hf) return;
      hf.innerHTML = heroHtml(hp.avatar, hn); if (hb) hb.textContent = CH[Math.floor(Math.random() * CH.length)];
      try { global.VTC.burst("stars", hf.getBoundingClientRect().left + 55, hf.getBoundingClientRect().top + 40, 10, .9); } catch (e) {}
      clearTimeout(hhT); hhT = setTimeout(function () { var h2 = $("#hhFig"); if (h2) h2.innerHTML = heroHtml(S.state.profile.avatar, 0); }, 4200);
    }
    else if (a === "narrtest") { speak("Hallo Magnus! Ich bin dein Erzähler. Heute zeige ich dir, wie man Wörter knackt – ohne Schweiß, aber mit Style.", null, "de", true); }
    else if (a === "film") {
      global.VTFILM.play(act.getAttribute("data-id"), { audio: S.state.settings.audio, speak: function (t) { speak(t, null, "de"); }, onGo: function (g) {
        var b = document.createElement("button"); b.hidden = true;
        if (g.arena) { b.setAttribute("data-act", "arena"); b.setAttribute("data-id", g.arena); }
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
    $$("#tabs button, #hGear").forEach(function (b) { b.setAttribute("aria-current", b.getAttribute("data-tab") === tab); });
    renderHeader();
    if (tab === "home") viewHome();
    else if (tab === "ueben") viewUeben();
    else if (tab === "stats") viewStats();
    else if (tab === "showroom") viewShowroom();
    else if (tab === "shop") viewShop();
    else viewParent();
  }

  global.VTUI = {
    speechText: speechClean,
    toast: toast,
    refreshHeader: renderHeader,
    afterArena: function () { render(); },
    bossFinish: bossFinish,
    danceWin: danceWin,
    openChest: openChest
  };

  S.load();
  /* früher frei eingetragener Name wird zum Spielernamen */
  (function () {
    var d = S.profiles(), nm = S.state.profile.name;
    if (nm && /^Spieler \d+$/.test(playerName())) S.renameProfile(d.active, nm);
    if (nm) { S.state.profile.name = ""; S.save(true); }
  })();
  render();
  pickPlayer();
  S.keepStorage(function () { if (tab === "parent") render(); });
  setInterval(function () { if (sessionEl.hidden) { S.regenHearts(); renderHeader(); } }, 30000);
})(window);
