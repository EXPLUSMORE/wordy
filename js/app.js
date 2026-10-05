/* Wordbook – Oberfläche, Übungstypen, Session-Ablauf */
(function (global) {
  "use strict";
  var S = global.VT, view = document.getElementById("view"), tabs = document.getElementById("tabs"),
      sessionEl = document.getElementById("session"), tab = "home", detailUnit = null;

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
  function speak(text, rate, lang, forceCold, onEnd) {
    if (!S.state.settings.audio || !window.speechSynthesis) return false;
    try {
      var synth = window.speechSynthesis, now = Date.now();
      var busy = synth.speaking || synth.pending, cold = !busy && (forceCold || now - lastSpoke > 8000);
      if (busy) synth.cancel();
      var de = lang === "de";
      var u = new SpeechSynthesisUtterance(de ? String(text) : String(text).replace(/^to\s+/i, ""));
      if (!voicesReady) pickVoice();
      var vo = de ? voiceDe : voice;
      if (vo) u.voice = vo;
      u.lang = (vo && vo.lang) || (de ? "de-DE" : "en-GB");
      u.rate = rate || (de ? 1 : 0.92);
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
  }

  function trackSwitch() {
    var t = S.state.settings.track;
    return '<div class="seg" role="group" aria-label="Lernbereich">' +
      '<button data-act="track" data-t="schule" aria-pressed="' + (t === "schule") + '">🎒 Schule</button>' +
      '<button data-act="track" data-t="business" aria-pressed="' + (t === "business") + '">💼 Business</button></div>';
  }
  function groupLabel(k) { return typeof k === "number" ? "Klasse " + k : k; }

  /* ---------- Wunsch ---------- */
  function wishCard() {
    var st = S.state, it = S.wish();
    if (!it) return '<section class="card"><div class="row" style="gap:12px;align-items:center"><div style="font-size:30px">⭐</div>' +
      '<div style="flex:1 1 auto"><b>Was wünschst du dir?</b><p class="small muted" style="margin:2px 0 0">Wähle im Shop einen Wunsch, auf den du Münzen sammelst. Hier siehst du, wie weit du schon bist.</p></div></div>' +
      '<button class="btn soft wide" data-act="goshop" style="margin-top:10px">Zum Shop</button></section>';
    var have = Math.min(st.coins, it.cost), pc = it.cost ? Math.round(have * 100 / it.cost) : 100, left = Math.max(0, it.cost - st.coins);
    var needXp = Math.max(0, S.minXp(it) - st.xp);
    var icon = it.kind === "sticker" ? stickerHtml(it, 46) : it.kind === "avatar" ? '<div class="avatar" style="width:46px;height:46px;font-size:26px">' + avatarHtml(it.val) + '</div>' : shopIcon(it);
    var line = needXp ? "Du brauchst noch " + needXp + " XP bis Rang " + esc(it.rank) + (left ? " und " + left + " 🪙." : ".")
      : left ? "Noch " + left + " 🪙 – das schaffst du." : "Genug Münzen! Jetzt im Shop holen.";
    return '<section class="card"><div class="eyebrow">Dein Wunsch</div><div class="row" style="gap:12px;align-items:center;margin-top:8px"><div style="width:50px;display:grid;place-items:center">' + icon + '</div>' +
      '<div style="flex:1 1 auto;min-width:0"><b>' + esc(it.label) + '</b><div class="bar" style="margin:6px 0 4px"><i style="width:' + pc + '%"></i></div>' +
      '<div class="small muted tnum">' + have + ' / ' + it.cost + ' 🪙 · ' + line + '</div></div></div>' +
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
  function viewHome() {
    var st = S.state, p = S.pools(), stt = S.stats(), r = S.rankOf(st.xp);
    var goalSec = st.settings.goalMin * 60, pct = Math.min(100, Math.round(st.daily.sec * 100 / goalSec));
    var toNext = r.next ? (r.next.xp - st.xp) : 0;
    var pn = playerName(), greet = pn && !/^Spieler \d+$/.test(pn) ? "Hallo " + esc(pn) : "Willkommen zurück";
    var hour = new Date().getHours();
    var biz = st.settings.track === "business";
    var tip = pct >= 100 ? "Tagesziel geschafft. Alles Weitere ist Bonus."
      : st.daily.sec > 0 ? "Noch " + fmtMin(goalSec - st.daily.sec) + " bis zum Tagesziel."
      : biz ? (hour < 12 ? "Fünf Minuten vor dem ersten Termin?" : "Eine kurze Runde zwischen zwei Meetings.")
      : hour < 12 ? "Eine kurze Runde vor der Schule?" : "Fünf Minuten reichen für heute.";

    var html = '<div class="stack">';
    html += '<section class="card hero" style="position:relative">' + (S.stickers().length ? '<div class="stk-corner">' + placedStickers(54) + '</div>' : "") + '<div class="inner"><div class="row" style="align-items:flex-start">' +
      '<div style="flex:1 1 auto;min-width:0"><div class="eyebrow">' + esc(S.today().split("-").reverse().join(".")) +
      ' · ' + (st.settings.track === "business" ? "Business English" : "Schule") + '</div>' +
      '<h1>' + greet + '</h1><p class="muted small" style="margin:6px 0 0">' + esc(tip) + '</p></div>' +
      '<div class="ring" style="--p:' + pct + '"><span class="tnum">' + pct + '%</span></div></div>' +
      '<div class="row wrap small muted" style="margin-top:12px;gap:14px">' +
      '<span>🔥 ' + st.streak.count + ' ' + plural(st.streak.count, "Tag", "Tage") + (st.streak.best > st.streak.count ? ' · Bestwert ' + st.streak.best : '') + '</span>' +
      '<span>🛡️ ' + st.streak.freezes + ' Streak-Schutz</span>' +
      (r.next ? '<span>Noch ' + toNext + ' XP bis ' + esc(r.next.n) + '</span>' : '<span>Höchster Rang erreicht</span>') +
      '</div></div></section>';

    html += '<section class="card"><div class="eyebrow">Wie viel Zeit hast du?</div>' +
      '<div class="quick" style="margin-top:10px">' +
      [3, 5, 10, 15].map(function (m) {
        return '<button data-act="start" data-min="' + m + '">' + m + ' Min<small>' + Math.round(m * 60 / S.SEC_PER_ITEM) + ' Aufgaben</small></button>';
      }).join("") + '</div>' +
      '<button class="btn wide lg" data-act="start" data-min="' + st.settings.goalMin + '" style="margin-top:12px">Weiterlernen</button>' +
      '<p class="small muted" style="margin:10px 0 0">' + (p.due.length ? p.due.length + ' ' + plural(p.due.length, "Wort ist", "Wörter sind") + ' zur Wiederholung dran' : "Keine Wiederholung fällig – du kannst neue Wörter kennenlernen") + '.</p>' +
      '</section>';

    if (p.box.length) {
      html += '<section class="card"><div class="row"><div style="flex:1 1 auto"><div class="eyebrow" style="color:var(--margin)">Fehlerkartei</div>' +
        '<h2 style="font-size:19px">' + p.box.length + ' ' + plural(p.box.length, "Wort macht", "Wörter machen") + ' noch Probleme</h2>' +
        '<p class="small muted" style="margin:4px 0 0">Diese Wörter kommen automatisch häufiger dran.</p></div></div>' +
        '<button class="btn soft wide" data-act="start" data-mode="box" data-min="5" style="margin-top:12px">Fehlerkartei üben</button></section>';
    }

    html += wishCard();
    html += verbCard();
    html += '<section class="card"><div class="eyebrow">Heutige Missionen</div><div style="margin-top:6px">' +
      st.daily.missions.map(function (m) {
        var pc = Math.min(100, Math.round(m.p * 100 / m.goal));
        return '<div class="mission' + (m.done ? " done" : "") + '"><div class="tick">✓</div>' +
          '<div class="txt"><div class="small" style="font-weight:600">' + esc(m.n) + '</div>' +
          '<div class="bar"><i style="width:' + pc + '%"></i></div></div>' +
          '<div class="pill">🪙 ' + m.coins + '</div></div>';
      }).join("") + '</div></section>';

    var sn = stt.sent;
    html += '<section class="card"><div class="row"><div style="flex:1 1 auto"><div class="eyebrow">Satzbau</div>' +
      '<h2 style="font-size:19px">' + sn.seen + ' von ' + sn.total + ' Sätzen geübt</h2>' +
      '<p class="small muted" style="margin:4px 0 0">' + (st.settings.track === "business"
        ? "Wendungen aus Meetings, E-Mails und Verhandlungen – in der richtigen Wortstellung."
        : "Wortstellung, Zeiten und Satzbaumuster aus dem Unterricht.") + '</p></div></div>' +
      '<button class="btn ghost wide" data-act="start" data-mode="sent" data-min="5" style="margin-top:12px">Nur Sätze üben</button></section>';

    var mastered = stt.dist[4], nextMile = Math.ceil((mastered + 1) / 25) * 25;
    html += '<section class="card"><div class="eyebrow">Dein Können</div>' +
      '<div class="row" style="margin-top:8px;gap:16px"><div><div style="font-family:Newsreader,serif;font-size:30px;font-weight:600" class="tnum">' + mastered + '</div>' +
      '<div class="small muted">Wörter sitzen langfristig</div></div>' +
      '<div style="flex:1 1 auto"><div class="bar"><i style="width:' + Math.round(mastered * 100 / Math.max(1, nextMile)) + '%"></i></div>' +
      '<div class="small muted" style="margin-top:6px">Noch ' + (nextMile - mastered) + ' bis zum nächsten Meilenstein (' + nextMile + ')</div></div></div>' +
      '<div class="small muted" style="margin-top:10px">' + stt.dist[0] + ' noch nie geübt · ' + (stt.dist[1] + stt.dist[2]) + ' in Arbeit · ' + stt.dist[3] + ' sitzen gut</div>' +
      '</section>';
    html += '</div>';
    view.innerHTML = html;
  }

  /* ================= ARENA ================= */
  function viewArena() {
    var st = S.state, p = S.pools(), few = p.all.length < 8;
    var html = '<div class="stack">';
    html += '<section class="card hero"><div class="inner">' +
      '<div class="eyebrow">Arena · ' + (st.settings.track === "business" ? "Business English" : "Schule") + '</div>' +
      '<h1 style="font-size:24px">Auf Zeit, nicht auf Ruhe</h1>' +
      '<p class="muted small" style="margin:6px 0 0">Vier kurze Modi für schnelles Wiederholen. Alles, was du hier triffst, zählt für deinen Lernstand mit – und die Zeit läuft aufs Tagesziel.</p>' +
      '</div></section>';
    if (few) html += '<section class="card"><p class="small" style="margin:0">Für die Arena brauchst du mindestens acht Wörter im gewählten Bereich. Schalte unter „Einheiten“ ein weiteres Schuljahr oder eine weitere Stufe dazu.</p></section>';
    html += '<section class="card">' + (global.ARENA ? global.ARENA.MODES : []).map(function (m) {
      var b = global.ARENA.best(m.id);
      return '<button class="mode" data-act="arena" data-id="' + esc(m.id) + '"' + (few ? " disabled" : "") + '>' +
        '<span class="mi">' + esc(m.icon) + '</span>' +
        '<span class="mt"><b>' + esc(m.name) + '</b>' +
        '<span class="claim">' + esc(m.claim) + '</span>' +
        '<span class="desc">' + esc(m.desc) + '</span></span>' +
        '<span class="mr"><b class="tnum">' + (b.best || "–") + '</b><span>' + (b.plays ? "Bestwert" : esc(m.tag)) + '</span></span>' +
        '</button>';
    }).join("") + '</section>';
    var plays = 0, arena = st.arena || {};
    for (var k in arena) plays += arena[k].plays || 0;
    html += '<section class="card"><div class="eyebrow">Wie die Arena zählt</div>' +
      '<p class="small muted" style="margin:8px 0 0">Ein Treffer unter Zeitdruck wird als sichere, aber flache Wiederholung gewertet – er schiebt ein Wort eine Stufe weiter, ersetzt aber nicht das ruhige Training. Ein Fehlgriff landet sofort in der Fehlerkartei.</p>' +
      (plays ? '<p class="small muted" style="margin:10px 0 0">Bisher ' + plays + ' ' + plural(plays, "Runde", "Runden") + ' gespielt.</p>' : "") +
      '</section>';
    html += '</div>';
    view.innerHTML = html;
  }

  /* ================= EINHEITEN ================= */
  function viewUnits() {
    var st = S.state, stt = S.stats();
    if (detailUnit === "__verbs") return viewVerbList();
    if (detailUnit) return viewUnitDetail(detailUnit);
    var biz = st.settings.track === "business";
    var groups = biz ? ["Basis", "Aufbau", "Profi", "Smalltalk", "Redewendungen"] : ["Headlight 2", 6, 7, 8];
    var sel = S.groupsOf();
    var html = '<div class="stack">';
    html += '<section class="card">' + trackSwitch() +
      '<div class="eyebrow" style="margin-top:14px">' + (biz ? "Stufe" : "Schuljahr") + '</div>' +
      '<div class="row wrap" style="margin-top:8px">' +
      groups.map(function (k) {
        return '<button class="chip" data-act="klasse" data-k="' + esc(k) + '" aria-pressed="' + (sel.indexOf(k) >= 0) + '">' + esc(groupLabel(k)) + '</button>';
      }).join("") +
      '</div><p class="small muted" style="margin:10px 0 0">' + (biz
        ? "Basis deckt Büroalltag, Telefon, E-Mail und Geschäftsreise ab. Aufbau geht in Vertrieb, Marketing, Markt, Finanzen und Verhandlung. Profi behandelt Führung, Strategie, Recht, Steuern, IT-Sicherheit und Nachhaltigkeit. Smalltalk ist alles, was zwischen den Terminen gesprochen wird, Redewendungen sind die 180 Wendungen, die man nicht Wort für Wort übersetzen kann. Unten erscheinen nur die gewählten Stufen."
        : "Headlight 2 ist der Stoff aus dem Schulbuch. Die Klassen kannst du optional dazuschalten. Gewählte Auswahl kommt im Training vor und erscheint unten. Einzelne Einheiten kannst du dort gezielt üben.") + '</p></section>';

    if (!biz) html += verbCard();
    var byGroup = {}, order = [];
    stt.perUnit.forEach(function (u) {
      if (u.track !== "eigen" && sel.indexOf(u.k) < 0) return;   // nur die gewählten Stufen bzw. Jahrgänge
      var key = String(u.k);
      if (!byGroup[key]) { byGroup[key] = []; order.push(key); }
      byGroup[key].push(u);
    });
    order.sort(function (a, b) { var ia = groups.indexOf(/^\d+$/.test(a) ? +a : a), ib = groups.indexOf(/^\d+$/.test(b) ? +b : b); return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib); });
    order.forEach(function (k) {
      var title = k === "0" ? "Eigene Listen" : groupLabel(byGroup[k][0].k);
      var books = [], rest = [];
      byGroup[k].forEach(function (u) { (BOOKS.filter(function (b) { return u.id.indexOf(b.pre) === 0; })[0] ? books : rest).push(u); });
      function unitRow(u) {
          var pc = Math.round(u.mastered * 100 / Math.max(1, u.total));
          return '<button class="unit" data-act="unit" data-id="' + esc(u.id) + '">' +
            '<span class="ic">' + esc(u.icon) + '</span><span class="t"><b>' + esc(BOOKS.some(function (b) { return u.id.indexOf(b.pre) === 0; }) ? u.title.replace(/^Headlight 2 · /, "") : u.title) + '</b>' +
            '<span class="bar" style="margin-top:6px;display:block"><i style="width:' + pc + '%"></i></span></span>' +
            '<span class="pill tnum">' + u.mastered + '/' + u.total + '</span></button>';
      }
      html += '<section class="card"><div class="eyebrow">' + esc(title) + '</div><div>' + rest.map(unitRow).join("") + '</div>' +
        (books.length ? bookTile(BOOKS.filter(function (b) { return books[0].id.indexOf(b.pre) === 0; })[0], books) + books.map(unitRow).join("") : "") + '</section>';
    });
    html += '</div>';
    view.innerHTML = html;
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
    if (!u) { detailUnit = null; return viewUnits(); }
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
      (audioAvailable() ? '<p class="small muted" style="margin:10px 0 0">Tippe auf 🔊 neben einem Wort, um nur dieses zu hören.</p>' : '') + '</section>' +
      '<section class="card"><div class="eyebrow">Wortliste</div>' + rows + '</section></div>';
  }

  /* ---------- Münzen: Übersicht und Regeln ---------- */
  function coinsCard() {
    var c = S.coinsToday(), st = S.state, total = c.fortschritt + c.missionen + c.ziel + c.serie + c.arena;
    function row(label, sub, val, done) {
      return '<div class="row" style="gap:10px;align-items:baseline;padding:6px 0;border-top:1px solid var(--line)"><div style="flex:1 1 auto"><b class="small">' + label + '</b>' +
        (sub ? '<div class="small muted">' + sub + '</div>' : "") + '</div><b class="tnum" style="' + (done ? "color:var(--good)" : "") + '">' + val + '</b></div>';
    }
    return '<section class="card"><div class="row"><div class="eyebrow" style="flex:1 1 auto">Münzen heute</div><span class="pill tnum">🪙 ' + st.coins + ' gesamt</span></div>' +
      '<div style="font-family:Newsreader,serif;font-size:30px;font-weight:600;margin:6px 0 4px" class="tnum">+' + total + ' <span class="small muted" style="font-family:Karla,sans-serif;font-weight:400">heute verdient</span></div>' +
      row("Lernfortschritt", "neue Wörter, höhere Stufen, Fehlerkartei, Einheiten", "+" + c.fortschritt) +
      row("Missionen", c.missionenDone + " von " + c.missionenAll + " erfüllt", "+" + c.missionen, c.missionenDone === c.missionenAll && c.missionenAll > 0) +
      row("Tagesziel", c.zielDone ? "geschafft" : "noch offen: " + st.settings.goalMin + " Minuten üben", c.zielDone ? "+" + c.ziel : "+20 möglich", c.zielDone) +
      row("Arena", "Tageslimit 30", c.arena + " / 30", c.arena >= 30) +
      (c.streakNext ? row("Serien-Bonus", "noch " + c.streakDays + " " + plural(c.streakDays, "Tag", "Tage") + " bis zum " + c.streakNext + ". Tag", "+" + c.streakBonus + " möglich") : "") +
      '<details style="margin-top:10px"><summary class="small" style="cursor:pointer;font-weight:700">So verdienst du Münzen</summary>' +
      '<div class="small" style="margin-top:8px;line-height:1.7">' +
      '• <b>Neues Wort</b> +1, <b>höhere Stufe</b> +1 (Gemeistert +4), <b>Wort aus der Fehlerkartei</b> +2<br>' +
      '• <b>Neue Einheit entdeckt</b> +8 (fünf Wörter angefangen), <b>Einheit geschafft</b> +30 (Verben +60)<br>' +
      '• <b>Missionen</b> 10 bis 18, <b>Tagesziel</b> +20, <b>Serien</b> bei 3, 7, 14, 30, 60, 100 Tagen<br>' +
      '• <b>Arena</b> bis 30 pro Tag, +10 bei Rekord<br>' +
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
    { k: "fn", n: "Fortnite" }, { k: "bg", n: "Hintergründe" }, { k: "fx", n: "Effekte" }, { k: "snd", n: "Töne" }, { k: "theme", n: "Farben" }
  ];
  var KIND_NAME = { sticker: "Sticker", avatar: "Figur", frame: "Rahmen", title: "Titel", bg: "Hintergrund", fx: "Effekt", snd: "Ton", theme: "Farbwelt" };
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
      case "fx": return it.val === "confetti" ? "🎊" : it.val === "stars" ? "⭐" : it.val === "sparks" ? "⚡" : it.val === "firework" ? "🎆" : "▫️";
      case "snd": return it.val === "none" ? "🔇" : "🔔";
    }
    return "";
  }
  /* Sticker: Glanz nur für gezeichnete Figuren mit Rangsperre und für Clombo */
  function stickerHtml(it, size, tilt) {
    return global.VTC.stickerHtml(it.val, size, tilt || 0, !!it.rank || /clombo/.test(it.val), esc);
  }
  var TILTS = [-7, 5, -3];
  function placedStickers(size) {
    var ids = S.stickers(); if (!ids.length) return "";
    return '<span class="stk-row">' + ids.map(function (id, i) {
      var it = S.SHOP.filter(function (x) { return x.id === id; })[0];
      return it ? stickerHtml(it, size, TILTS[i % 3]) : "";
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
          '<span class="art">' + stickerHtml(it, 58, own ? TILTS[list.indexOf(it) % 3] : 0) + '</span><small>' + esc(own ? it.label.replace("-Sticker", "") : "???") + '</small>' +
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
  function shopCard() {
    var st = S.state, wishId = (S.wish() || {}).id;
    var html = '<section class="card"><div class="row"><div class="eyebrow" style="flex:1 1 auto">Shop</div><span class="pill">🪙 ' + st.coins + '</span></div>' +
      '<p class="small muted" style="margin:6px 0 10px">Münzen gibt es nur für Aussehen – nie für Lernvorteile.</p>' +
      '<div class="row wrap" style="gap:6px;margin-bottom:6px">' + SHOP_TABS.map(function (t) {
        return '<button class="chip" data-act="shoptab" data-k="' + t.k + '" aria-pressed="' + (shopTab === t.k) + '">' + t.n + '</button>';
      }).join("") + '</div>';
    html += S.SHOP.filter(function (it) { return shopTab === "fn" ? it.set === "fn" : it.kind === shopTab && !it.set; }).map(function (it) {
      var own = S.owns(it), act = S.isActive(it), locked = !own && lockNote(it);
      return '<div class="shopitem"><span class="si">' + shopIcon(it) + '</span>' +
        '<span style="flex:1 1 auto"><b class="small">' + esc(it.label) + '</b><br><span class="small muted">' + KIND_NAME[it.kind] +
        (it.rank && !own ? " · ab " + esc(it.rank) : "") + '</span></span>' +
        (own ? '<button class="chip" data-act="equip" data-id="' + esc(it.id) + '" aria-pressed="' + act + '">' + (act ? "aktiv" : "auswählen") + '</button>'
          : locked ? '<span class="pill" title="Erst ab Rang ' + esc(it.rank) + '">🔒 ' + esc(it.rank) + '</span><button class="chip" data-act="wish" data-id="' + esc(it.id) + '" aria-pressed="' + (wishId === it.id) + '" aria-label="Wunsch" style="margin-left:6px">⭐</button>'
          : '<button class="chip" data-act="wish" data-id="' + esc(it.id) + '" aria-pressed="' + (wishId === it.id) + '" aria-label="Wunsch" style="margin-right:6px">⭐</button><button class="btn soft" data-act="buy" data-id="' + esc(it.id) + '">🪙 ' + it.cost + '</button>') + '</div>';
    }).join("");
    return html + '</section>';
  }

  /* ================= FORTSCHRITT ================= */
  function viewStats() {
    var st = S.state, s = S.stats(), r = S.rankOf(st.xp);
    var maxItems = Math.max.apply(null, s.d14.map(function (d) { return d.items; }).concat([1]));
    var html = '<div class="stack">';
    html += '<section class="card"><div class="tiles4">' +
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
    html += '<section class="card"><div class="eyebrow">Wo stehen die ' + s.total + ' Wörter?</div>' +
      '<div class="levelbar" style="margin-top:10px">' + segs + '</div>' +
      '<div class="legend">' + s.dist.map(function (n, i) {
        return '<span><i class="lv' + i + '"></i>' + esc(S.LEVELS[i].n) + ' <b class="tnum">' + n + '</b></span>';
      }).join("") + '</div>' +
      '<p class="small muted" style="margin:10px 0 0">„Gemeistert“ heißt: mindestens drei Wochen Abstand bis zur nächsten Wiederholung.</p></section>';

    html += '<section class="card"><div class="eyebrow">Letzte 14 Tage</div>' +
      '<div class="days" style="margin-top:12px">' + s.d14.map(function (d) {
        var h = d.items ? Math.max(4, Math.round(d.items * 100 / maxItems)) : 3;
        return '<div class="d" title="' + esc(d.date) + ': ' + d.items + ' Aufgaben"><i class="' + (d.items ? "" : "zero") + '" style="height:' + h + '%"></i><small>' + esc(d.label[0]) + '</small></div>';
      }).join("") + '</div>' +
      '<p class="small muted" style="margin:10px 0 0">' + (s.d14.some(function (d) { return d.items; }) ? 'Bester Tag: ' + maxItems + ' ' + plural(maxItems, "Aufgabe", "Aufgaben") + '.' : 'Noch keine Übungen in den letzten 14 Tagen.') + '</p></section>';

    var sn2 = s.sent;
    html += '<section class="card"><div class="eyebrow">Satzbau</div>' +
      '<div class="row" style="margin-top:10px;gap:16px"><div><div style="font-family:Newsreader,serif;font-size:30px;font-weight:600" class="tnum">' + sn2.seen + '</div>' +
      '<div class="small muted">von ' + sn2.total + ' Sätzen geübt</div></div>' +
      '<div style="flex:1 1 auto"><div class="bar"><i style="width:' + Math.round(sn2.seen * 100 / Math.max(1, sn2.total)) + '%"></i></div>' +
      '<div class="small muted" style="margin-top:6px">' + sn2.mastered + ' sitzen langfristig · ' + sn2.ok + ' richtig gebaut</div></div></div></section>';

    var vst = S.verbStats();
    html += '<section class="card"><div class="eyebrow">Unregelmäßige Verben</div>' +
      '<div class="row" style="margin-top:10px;gap:16px"><div><div style="font-family:Newsreader,serif;font-size:30px;font-weight:600" class="tnum">' + vst.seen + '</div>' +
      '<div class="small muted">von ' + vst.total + ' Verben geübt</div></div>' +
      '<div style="flex:1 1 auto"><div class="bar"><i style="width:' + Math.round(vst.seen * 100 / Math.max(1, vst.total)) + '%"></i></div>' +
      '<div class="small muted" style="margin-top:6px">' + vst.mastered + ' sitzen langfristig</div></div></div>' +
      '<button class="btn ghost" data-act="verblist" style="margin-top:10px">Verbenliste öffnen</button></section>';

    html += '<section class="card"><div class="eyebrow">Abzeichen</div><div class="badges" style="margin-top:10px">' +
      S.BADGES.map(function (b) {
        var has = st.badges.indexOf(b.id) >= 0;
        return '<div class="badge' + (has ? "" : " off") + '" title="' + esc(b.d) + '"><div class="g">' + (has ? "🏅" : "🔒") + '</div><b>' + esc(b.n) + '</b></div>';
      }).join("") + '</div></section>';

    html += coinsCard();
    html += ranksCard();
    html += albumCard() + albumCard("fn") + stickerBook() + stickerBook("fn") + shopCard();
    html += '</div>';
    view.innerHTML = html;
  }

  /* ================= ELTERN / LEHRER ================= */
  function playersCard() {
    var d = S.profiles();
    var h = '<section class="card"><div class="eyebrow">Spieler</div>' +
      '<p class="small muted" style="margin:8px 0 10px">Jeder Spieler hat einen eigenen Lernstand auf diesem Gerät. Andere sehen deinen Fortschritt nicht.</p><div class="stack" style="gap:8px">';
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
      ["🚀", "Loslegen", "Auf <b>Start</b> „Weiterlernen“ oder 3, 5, 10, 15 Minuten wählen. Wordy mischt fällige Wörter, neue Wörter, Fehlerkartei, Sätze und Verben selbst."],
      ["📚", "Wörter aussuchen", "Unter <b>Einheiten</b> oben <b>Schule</b> oder <b>Business</b> wählen, dann Jahrgang bzw. Stufe antippen (mindestens eine bleibt an). Darunter erscheinen nur diese Einheiten. Einheit antippen: Wortliste anhören oder „Diese Einheit üben“."],
      ["🧩", "Aufgaben", "Wortkarte, Auswahl, Hören, Lückentext, Schreiben, Zuordnen und Satzbau. Eine falsche Antwort kostet ein Herz (unter Setup abschaltbar) und kommt später wieder."],
      ["🔁", "Fehlerkartei & Sätze", "Falsche Wörter landen in der <b>Fehlerkartei</b> (Start → „Fehlerkartei üben“). „Nur Sätze üben“ trainiert den Satzbau."],
      ["✍️", "Unregelmäßige Verben", "<b>Start</b> oder <b>Einheiten</b> → „Verben üben“ (Einführung, Lückenaufgabe, Tippen) oder „Nur Tippen“. Die Verbenliste zeigt alle Verben mit Beispielsätzen."],
      ["⚡", "Arena", "Vier Zeitmodi: <b>Match-Rausch</b> (Paare in 60 Sekunden), <b>Blitzrunde</b> (Zeit sammeln), <b>Letztes Herz</b> (ein Fehler beendet), <b>Fehlerjagd</b> (Kartei leeren)."],
      ["🪙", "Münzen & Shop", "Münzen gibt es für Fortschritt, Missionen und das Tagesziel. Unter <b>Fortschritt</b> siehst du Ränge, „Münzen heute“ und den Shop. Mit dem ⭐ im Shop setzt du einen Wunsch."],
      ["🎯", "Missionen", "Auf <b>Start</b> stehen jeden Tag drei Missionen, zum Beispiel „15 verschiedene Wörter üben“ oder „10 richtige in Folge“. Sie zählen über den ganzen Tag und werden am Ende einer Runde gutgeschrieben. Jede gibt Münzen."],
      ["⭐", "Sticker & Sammlung", "Im Shop gibt es zu jeder Figur einen <b>Sticker</b>. Unter <b>Fortschritt → Stickerbuch</b> antippen klebt ihn auf (bis zu drei, sie erscheinen auf Start und Profil). Das <b>Fortnite-Album</b> hat Tiere ab Rang Gold II, die Unreal-Stücke gibt es erst ab Unreal."],
      ["⚙️", "Setup", "Spieler anlegen und wechseln, Tagesziel und Ton einstellen, eigene Vokabeln einfügen, Lernstand sichern und übertragen."]
    ];
    return '<details class="how"><summary class="how-sum"><span class="chev" aria-hidden="true">▸</span><span style="flex:1 1 auto"><b>So funktioniert Wordy</b>' +
      '<span class="small muted" style="display:block">Kurz erklärt in zehn Schritten</span></span></summary>' +
      '<ol class="how-list">' + steps.map(function (x) {
        return '<li><span class="hi">' + x[0] + '</span><div><b>' + x[1] + '</b><div class="small muted">' + x[2] + '</div></div></li>';
      }).join("") + '</ol></details>';
  }
  function viewParent() {
    var st = S.state, s = S.stats();
    var html = '<div class="stack">';
    html += howToCard();
    html += installCard();
    html += playersCard();
    html += '<section class="card"><div class="eyebrow">Lernbereich</div>' + trackSwitch() +
      '<p class="small muted" style="margin:12px 0 0">Schule und Business haben getrennte Wortschätze, Sätze und Statistiken. Der Fortschritt bleibt in beiden Bereichen erhalten.</p></section>';

    html += '<section class="card"><div class="eyebrow">Lernstand im Überblick</div>' +
      '<div class="tiles4" style="margin-top:10px">' +
      '<div class="kpi"><b class="tnum">' + Math.round(st.totals.sec / 60) + '</b><span>Minuten gesamt</span></div>' +
      '<div class="kpi"><b class="tnum">' + st.totals.items + '</b><span>Aufgaben</span></div>' +
      '<div class="kpi"><b class="tnum">' + s.acc + '%</b><span>richtig</span></div>' +
      '<div class="kpi"><b class="tnum">' + s.boxSize + '</b><span>in der Fehlerkartei</span></div>' +
      '<div class="kpi"><b class="tnum">' + s.sent.seen + '/' + s.sent.total + '</b><span>Sätze geübt</span></div>' +
      '<div class="kpi"><b class="tnum">' + s.dist[4] + '</b><span>Wörter gemeistert</span></div></div></section>';

    html += '<section class="card"><div class="eyebrow">Einheiten mit dem größten Rückstand</div><div style="margin-top:6px">' +
      (s.perUnit.filter(function (u) { return u.seen > 0; })
        .sort(function (a, b) { return (a.mastered / a.total) - (b.mastered / b.total); }).slice(0, 6)
        .map(function (u) {
          var pc = Math.round(u.mastered * 100 / u.total);
          return '<div class="mission"><div class="txt"><div class="small" style="font-weight:600">' + esc(u.icon + " " + u.title) + '</div>' +
            '<div class="bar"><i style="width:' + pc + '%"></i></div></div><span class="pill tnum">' + pc + '%</span></div>';
        }).join("") || '<p class="small muted">Noch keine Daten – nach der ersten Übungsrunde steht hier etwas.</p>') +
      '</div></section>';

    html += '<section class="card"><div class="eyebrow">Schwierigste Wörter</div><div style="margin-top:6px">' +
      (s.weak.length ? s.weak.slice(0, 12).map(function (x) {
        return '<div class="wordrow"><span class="en">' + esc(x.w.en) + '</span><span class="de">' + esc(x.w.de) + '</span>' +
          '<span class="pill">✗ ' + x.r.no + '</span><span class="pill">✓ ' + x.r.ok + '</span></div>';
      }).join("") : '<p class="small muted">Noch keine Fehler erfasst.</p>') + '</div></section>';

    html += '<section class="card"><div class="eyebrow">Einstellungen</div>' +
      '<label class="row" style="margin-top:12px"><span style="flex:1 1 auto">Tagesziel</span>' +
      '<select id="setGoal" style="width:auto">' + [5, 10, 15, 20, 30].map(function (m) {
        return '<option value="' + m + '"' + (st.settings.goalMin === m ? " selected" : "") + '>' + m + ' Minuten</option>';
      }).join("") + '</select></label>' +
      '<label class="row" style="margin-top:10px"><span style="flex:1 1 auto">Neue Wörter pro Tag</span>' +
      '<select id="setNew" style="width:auto">' + [6, 12, 20, 30].map(function (m) {
        return '<option value="' + m + '"' + (st.settings.newPerDay === m ? " selected" : "") + '>' + m + '</option>';
      }).join("") + '</select></label>' +
      '<label class="row" style="margin-top:10px"><span style="flex:1 1 auto">Aussprache vorlesen<br><span class="small muted">Nutzt die englische Stimme des Geräts</span></span>' +
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
      '<button class="btn ghost" data-act="voicetest" style="margin-top:10px">🔊 Stimme testen</button>' +
      '<label class="row" style="margin-top:10px"><span style="flex:1 1 auto">Herzen benutzen<br><span class="small muted">Aus = Üben ohne Abbruch</span></span>' +
      '<input type="checkbox" id="setHearts" ' + (st.settings.hearts ? "checked" : "") + ' style="width:auto"></label>' +
      '<p class="small muted" style="margin:10px 0 0">Gelernt wird als <b>' + esc(playerName()) + '</b>. Den Namen änderst du oben unter „Spieler“.</p>' +
      '</section>';

    html += '<section class="card"><div class="eyebrow">Eigene Vokabelliste importieren</div>' +
      '<p class="small muted" style="margin:6px 0 10px">Eine Zeile pro Wort: <code>englisch;deutsch;beispielsatz</code>. Semikolon, Komma oder Tabulator funktionieren.</p>' +
      '<input id="csvTitle" placeholder="Name der Liste, z. B. Access 7 Unit 3" style="margin-bottom:8px">' +
      '<textarea id="csvText" rows="4" placeholder="library;die Bibliothek;I borrowed a book from the library."></textarea>' +
      '<div class="row wrap" style="margin-top:10px;gap:8px"><button class="btn" data-act="csvimport">Liste hinzufügen</button>' +
      '<label class="btn ghost" style="position:relative;overflow:hidden">Datei wählen<input type="file" id="csvFile" accept=".csv,.txt" style="position:absolute;inset:0;opacity:0;cursor:pointer"></label></div>' +
      (st.custom.length ? '<div style="margin-top:12px">' + st.custom.map(function (u) {
        return '<div class="shopitem"><span style="flex:1 1 auto"><b class="small">' + esc(u.title) + '</b><br><span class="small muted">' + u.words.length + ' Wörter</span></span>' +
          '<button class="chip" data-act="delcustom" data-id="' + esc(u.id) + '">entfernen</button></div>';
      }).join("") + '</div>' : "") + '</section>';

    var bi = S.backupInfo(), pers = S.isPersisted();
    function ago(t) { var m = Math.round((Date.now() - t) / 60000); return m < 1 ? "gerade eben" : m < 60 ? "vor " + m + " Min." : m < 1440 ? "vor " + Math.round(m / 60) + " Std." : "vor " + Math.round(m / 1440) + " Tg."; }
    html += '<section class="card"><div class="eyebrow">Automatische Sicherung</div>' +
      '<p class="small muted" style="margin:6px 0 10px">Der Lernstand wird nach jeder Antwort und beim Schließen der App auf diesem Gerät gespeichert. Zusätzlich entsteht regelmäßig eine Sicherungskopie.' +
      (pers === true ? ' Der Browser hält den Speicher dauerhaft vor.' : pers === false ? ' Der Browser kann den Speicher bei Platzmangel räumen – sichere den Lernstand gelegentlich unten.' : '') + '</p>' +
      (bi.restored ? '<p class="small" style="margin:0 0 10px;color:var(--bad)">Der Lernstand war beschädigt und wurde aus der Sicherung wiederhergestellt.</p>' : '') +
      '<div class="row wrap" style="gap:8px">' +
      (bi.auto ? '<button class="btn ghost" data-act="restore" data-slot="auto">Sicherung von ' + ago(bi.auto) + ' laden</button>' : '<span class="small muted">Noch keine Sicherungskopie.</span>') +
      (bi.pre ? '<button class="btn ghost" data-act="restore" data-slot="pre">Stand vor letzter Änderung (' + ago(bi.pre) + ') laden</button>' : '') +
      '</div></section>';

    html += '<section class="card"><div class="eyebrow">Sichern &amp; übertragen</div>' +
      '<p class="small muted" style="margin:6px 0 10px">Der Lernstand liegt nur in diesem Browser. Zum Umziehen auf ein anderes Gerät hier kopieren und dort einfügen.</p>' +
      '<div class="row wrap" style="gap:8px"><button class="btn ghost" data-act="exp" data-kind="json">Lernstand kopieren</button>' +
      '<button class="btn ghost" data-act="exp" data-kind="csv">Wortliste als CSV</button>' +
      '<button class="btn ghost" data-act="impopen">Lernstand einspielen</button></div>' +
      '<textarea id="expBox" rows="4" hidden style="margin-top:10px"></textarea>' +
      '<div id="impWrap" hidden style="margin-top:10px"><textarea id="impBox" rows="4" placeholder="Hier den kopierten Lernstand einfügen"></textarea>' +
      '<button class="btn" data-act="impdo" style="margin-top:8px">Einspielen</button></div>' +
      '<hr class="sep" style="margin:14px 0"><button class="btn ghost" data-act="reset" style="color:var(--bad)">Fortschritt zurücksetzen</button></section>';
    html += '<div class="small muted" style="margin:10px 0 0;text-align:center;line-height:1.6"><b>Wordy · Version ' + esc(global.WORDY_VERSION || "–") + '</b>' +
      '<br><span style="font-size:11px">Build ' + esc(global.WORDY_BUILD || "lokal") + '</span>' +
      '<br>© ' + new Date().getFullYear() + ' Magnus, Pummel &amp; Christian</div>' +
      '<div class="row wrap" style="gap:8px;justify-content:center;margin-top:10px"><button class="btn ghost" data-act="checkupdate">Nach Updates suchen</button>' +
      '<button class="btn ghost" data-act="clearcache" title="Lernstand bleibt erhalten">App-Cache leeren</button></div>';
    html += '</div>';
    view.innerHTML = html;

    $("#setGoal").onchange = function () { st.settings.goalMin = +this.value; S.save(true); renderHeader(); };
    $("#setNew").onchange = function () { st.settings.newPerDay = +this.value; S.save(true); };
    $("#setAudio").onchange = function () { st.settings.audio = this.checked; S.save(true); };
    $("#setMode").onchange = function () { st.settings.themeMode = this.value; S.save(true); renderHeader(); };
    $("#setPace").onchange = function () { st.settings.readPace = this.value; S.save(true); };
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
  function pickType(w) {
    var lv = S.levelOf(w.id), c;
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
  function buildTasks(list, sentOnly) {
    var t = [];
    if (!sentOnly) list.forEach(function (w) {
      if (S.levelOf(w.id) === 0 && !(S.state.w[w.id] && S.state.w[w.id].no)) {
        t.push({ type: "intro", w: w }); t.push({ type: "mc_en_de", w: w, isNew: true });
      } else t.push({ type: pickType(w), w: w });
    });
    var want = sentOnly ? Math.max(4, list.length) : Math.round(t.length / 8);
    var sents = S.planSentences(want);
    if (sentOnly) return sents.map(function (x) { return { type: "build", s: x }; });
    sents.forEach(function (x, i) {
      var pos = Math.min(t.length, Math.round((i + 1) * t.length / (sents.length + 1)) + 1);
      t.splice(pos, 0, { type: "build", s: x });
    });
    return t;
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
    var list = sentOnly ? S.planSentences(Math.max(5, Math.round((opts.minutes || 5) * 60 / 16))) : S.planSession(opts);
    if (!list.length) { toast(sentOnly ? "Alle Sätze dieses Bereichs sind gerade erledigt." : "Für diese Auswahl gibt es gerade nichts zu üben."); return; }
    var tasks = buildTasks(list, sentOnly);
    /* Unregelmäßige Verben: in normalen Schulrunden immer wieder eingestreut */
    if (!sentOnly && !opts.unit && opts.mode !== "box" && opts.mode !== "new" && S.state.settings.track === "schule") {
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
      retry: [], mode: opts.mode || "mix", ended: false
    };
    snapStart();
    sessionEl.hidden = false; document.body.style.overflow = "hidden";
    renderTask();
  }
  /* Stand zu Rundenbeginn, damit das Finale zeigen kann, was die Runde gebracht hat */
  function snapStart() { SS.xp0 = S.state.xp; SS.coins0 = S.state.coins; }
  function star(on, i) {
    return '<svg viewBox="0 0 24 24" class="fin-star' + (on ? " on" : "") + '" style="--i:' + i + '" aria-hidden="true"><path d="M12 2.2l2.9 6.2 6.8.8-5 4.7 1.3 6.7L12 17.2 6 20.6l1.3-6.7-5-4.7 6.8-.8z"/></svg>';
  }
  function endSession(reason) {
    if (!SS || SS.ended) return;
    SS.ended = true;
    var sec = Math.round((Date.now() - SS.start) / 1000);
    var rw = S.finishSession({ items: SS.items, correct: SS.correct, sec: sec, maxChain: SS.maxChain, newSeen: SS.newSeen, boxSolved: SS.boxSolved, mastered: SS.mastered, sentOk: SS.sentOk });
    var st = S.state, acc = SS.items ? Math.round(SS.correct * 100 / SS.items) : 0;
    var head = reason === "hearts" ? "Kurze Pause" : SS.correct === SS.items && SS.items > 3 ? "Fehlerfrei!" : "Runde geschafft";
    var msg = reason === "hearts"
      ? "Die Herzen sind alle. Dein Fortschritt ist gespeichert – die Herzen füllen sich von selbst wieder auf."
      : acc >= 90 ? "Das saß. Weiter so." : acc >= 70 ? "Solide Runde. Die Wackelkandidaten kommen bald wieder." : "Schwierige Wörter dabei – die landen jetzt in der Fehlerkartei und kommen häufiger dran.";
    var good = reason !== "hearts";
    var perfect = good && SS.correct === SS.items && SS.items > 3;
    var stars = !good ? 0 : acc >= 90 ? 3 : acc >= 70 ? 2 : 1;
    var xp0 = SS.xp0 == null ? st.xp : SS.xp0, gain = Math.max(0, st.xp - xp0), coinGain = Math.max(0, st.coins - (SS.coins0 == null ? st.coins : SS.coins0));
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
    if (rw.goalReached) html += '<section class="card"><div class="eyebrow" style="color:var(--good)">Tagesziel erreicht</div>' + (rw.streakUp ? '<div class="fin-flame">🔥</div>' : "") + '<p style="margin:6px 0 0">' + (rw.streakUp ? "Streak steht bei " + st.streak.count + " " + plural(st.streak.count, "Tag", "Tagen") + "." : "Schon erledigt heute.") + '</p></section>';
    if (rw.missions.length) html += '<section class="card"><div class="eyebrow">Missionen erfüllt</div>' + rw.missions.map(function (m) { return '<div class="mission done"><div class="tick">✓</div><div class="txt small">' + esc(m.n) + '</div><span class="pill">🪙 ' + m.coins + '</span></div>'; }).join("") + '</section>';
    if (rw.badges.length) html += '<section class="card"><div class="eyebrow">Neue Abzeichen</div><div class="badges" style="margin-top:8px">' + rw.badges.map(function (b) { return '<div class="badge"><div class="g">🏅</div><b>' + esc(b.n) + '</b></div>'; }).join("") + '</div></section>';
    html += '<div class="row" style="gap:8px"><button class="btn wide" data-act="again">Noch eine Runde</button>' +
      '<button class="btn ghost" data-act="close">Fertig</button></div></div></div>';
    sessionEl.innerHTML = html;
    renderHeader();
    global.VTC.runFinale(sessionEl, { pct0: pct(r0), pct1: pct(r1), rankUp: rankUp, coins: coinGain, perfect: perfect,
      ok: good && acc >= 70, fx: st.profile.fx, snd: st.profile.snd, audio: st.settings.audio });
    if (rw.streakUp) { var fl = sessionEl.querySelector(".fin-flame"); if (fl) fl.classList.add("go"); }
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
    sessionEl.innerHTML = head + '<div class="sbody" id="sbody"></div><div class="sfoot" id="sfoot"></div>';
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
        '<p class="small muted" style="margin:0">Kleine Tippfehler zählen halb – die Schreibweise siehst du gleich.</p></div>';
      foot.innerHTML = "";
      var inp = $("#typeIn"), btn = $("#inlineCheck");
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
        '<div class="tiles" id="tiles">' + letters.map(function (l, i) {
          return '<button class="tile" data-tile="' + i + '" data-ch="' + esc(l.ch) + '">' + (l.ch === " " ? "␣" : esc(l.ch)) + '</button>';
        }).join("") + '</div>' +
        '<button class="chip" data-act="undo" style="align-self:flex-start">← Buchstabe zurück</button></div>';
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
        '<button class="chip" data-act="undo" style="align-self:flex-start">← Wort zurück</button></div>';
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

  function paintSlot(t, words) {
    var el = $("#slot"); if (!el) return;
    var rest = Math.max(0, t.target.length - t.built.length);
    if (words || t.type === "build") {
      el.innerHTML = '<span style="font-size:19px">' + esc(t.built.join(" ")) + '</span>' +
        (rest ? '<span style="color:var(--ink-3);font-size:19px;letter-spacing:.1em"> ' + Array(rest + 1).join("··· ") + '</span>' : "") +
        (t.punct ? '<span style="font-size:19px;color:var(--ink-3)">' + esc(t.punct) + '</span>' : "");
    } else {
      el.innerHTML = '<span>' + esc(t.built.join("")) + '</span>' +
        '<span style="color:var(--ink-3);letter-spacing:.18em">' + "·".repeat(rest) + '</span>';
    }
  }

  /* ---------- Antwort prüfen ---------- */
  function applyGrade(w, g, extra) {
    var before = S.levelOf(w.id), wasBox = S.inErrorBox(w.id);
    var res = S.grade(w.id, g);
    SS.items++;
    if (g > 0) {
      SS.correct++; SS.chain++; SS.maxChain = Math.max(SS.maxChain, SS.chain);
      S.addXp(g === 2 ? 10 : 6);
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
    if (ok) speak(x.en, 0.9);
    var b = $("#mainBtn"); if (b) b.focus();
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
      var val = $("#typeIn").value, g = judgeTyped(val, w.en);
      SS.answered = true;
      var res = applyGrade(w, g);
      if (g === 0) SS.retry.push({ type: "mc_en_de", w: w });
      verdict(g > 0, w, res, g === 1 ? "fast – achte auf die Schreibweise" : null);
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
    var tile = e.target.closest(".tile");
    if (tile && t && (t.type === "spell" || t.type === "build") && !SS.answered) {
      tile.classList.add("used"); t.built.push(tile.getAttribute("data-ch"));
      t.usedTiles = (t.usedTiles || []); t.usedTiles.push(tile);
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
    else if (a === "again") { closeSession(); startSession({ minutes: S.state.settings.goalMin }); }
    else if (a === "undo" && t && (t.type === "spell" || t.type === "build") && !SS.answered) {
      if (!t.built.length) return;
      t.built.pop(); var el = t.usedTiles.pop(); if (el) el.classList.remove("used");
      paintSlot(t); $("#mainBtn").disabled = true;
    }
  });
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
      startSession({ minutes: +(act.getAttribute("data-min") || st.settings.goalMin), mode: act.getAttribute("data-mode") || "mix", unit: act.getAttribute("data-unit") || null,
        vtype: act.getAttribute("data-vtype") === "1", verb: act.getAttribute("data-verb") || null });
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
    else if (a === "verblist") { detailUnit = "__verbs"; tab = "units"; render(); view.scrollTop = 0; }
    else if (a === "back") { stopReading(); detailUnit = null; render(); }
    else if (a === "readall") {
      var u = S.units().filter(function (x) { return x.id === act.getAttribute("data-id"); })[0];
      if (u) readAll(u, act);
    }
    else if (a === "buy") {
      var r = S.buy(act.getAttribute("data-id"));
      toast(r.error || ("Gekauft: " + r.item.label));
      if (r.ok) { var rect = act.getBoundingClientRect(); global.VTC.burst("confetti", rect.left + rect.width / 2, rect.top, 26, 1.4); }
      renderHeader(); render();
    }
    else if (a === "equip") {
      var re = S.equip(act.getAttribute("data-id")); if (re.error) return toast(re.error);
      if (re.item.kind === "sticker") toast(re.on ? "Aufgeklebt: " + re.item.label : "Abgelöst: " + re.item.label);
      renderHeader(); render();
    }
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
    else if (a === "goshop") { tab = "stats"; render(); var shopEl = view.querySelector(".shopitem"); if (shopEl) shopEl.scrollIntoView({ block: "center" }); }
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

  tabs.addEventListener("click", function (e) {
    var b = e.target.closest("button[data-tab]"); if (!b) return;
    stopReading(); tab = b.getAttribute("data-tab"); detailUnit = null; render(); view.scrollTop = 0;
  });

  function render() {
    S.rollDay();
    $$("#tabs button").forEach(function (b) { b.setAttribute("aria-current", b.getAttribute("data-tab") === tab); });
    renderHeader();
    if (tab === "home") viewHome();
    else if (tab === "arena") viewArena();
    else if (tab === "units") viewUnits();
    else if (tab === "stats") viewStats();
    else viewParent();
  }

  global.VTUI = {
    toast: toast,
    refreshHeader: renderHeader,
    afterArena: function () { render(); }
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
