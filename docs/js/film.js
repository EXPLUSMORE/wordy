/* Wordy – Erklärfilme: kurze, witzige Trickfilme zu den Lernmodi.
   Gespielt wird live aus Szenen (Figuren aus stila.js, Emoji-Requisiten, Sprechblasen), nichts Vorgerendertes.
   Eine Szene: { bg, cast:[{av, x, dance, say, flip}], props:[{e, x, y, s, a}], nar }  (nar = Erzählertext, wird untertitelt und optional vorgelesen) */
(function (global) {
  "use strict";
  var B = "svg:eisbaer", P = "svg:eispingu", R = "svg:eisrobbe", K = "svg:eiskoenig";

  /* go: was „Jetzt ausprobieren“ startet */
  var FILMS = [
    { id: "mix", icon: "🏆", title: "Daily Challenge", go: { mode: "mix" }, scenes: [
      { bg: "day", cast: [{ av: B, x: 30, dance: 1, say: "Was soll ich üben?!" }], props: [{ e: "🤯", x: 30, y: 24, s: 54, a: "shake" }], nar: "Bruno hat 500 Wörter und null Plan." },
      { bg: "day", cast: [{ av: P, x: 68, dance: 0, say: "Daily Challenge antippen. Fertig." }, { av: B, x: 28, dance: 0, say: "…das war’s?" }], props: [{ e: "🧠", x: 52, y: 20, s: 60, a: "bob" }], nar: "Die Daily Challenge mischt alles, was jetzt dran ist: Neues, Fälliges, Fehler." },
      { bg: "day", cast: [{ av: R, x: 50, dance: 2, say: "Mix wie im Smoothie!" }], props: [{ e: "🍓", x: 25, y: 30, s: 40, a: "spin" }, { e: "🍌", x: 72, y: 36, s: 40, a: "spin" }, { e: "🥝", x: 50, y: 14, s: 40, a: "bob" }], nar: "Es kommt nie zweimal dasselbe hintereinander. Dein Gehirn bleibt wach." },
      { bg: "gold", cast: [{ av: K, x: 50, dance: 6, say: "Tagesbonus! Und morgen wieder!" }], props: [{ e: "🪙", x: 24, y: 22, s: 44, a: "fly" }, { e: "🪙", x: 76, y: 26, s: 44, a: "fly" }], nar: "Die erste Challenge am Tag gibt 10 Bonus-Münzen. Dazu Münzen fürs Behalten, nicht fürs Durchklicken." }
    ] },
    { id: "new", icon: "✨", title: "Neue Wörter", go: { mode: "new" }, scenes: [
      { bg: "night", cast: [{ av: P, x: 50, dance: 3, say: "Ein neues Wort! Hallo!" }], props: [{ e: "✨", x: 28, y: 22, s: 44, a: "pop" }, { e: "🆕", x: 72, y: 26, s: 50, a: "bob" }], nar: "Neue Wörter kommen erst in Ruhe als Karte." },
      { bg: "night", cast: [{ av: B, x: 50, dance: 0, say: "Hören, lesen, merken." }], props: [{ e: "🔊", x: 26, y: 24, s: 48, a: "pop" }, { e: "👀", x: 74, y: 24, s: 48, a: "bob" }], nar: "Erst hören, dann lesen, dann sagst du es dir selbst vor." },
      { bg: "night", cast: [{ av: R, x: 30, dance: 0, say: "Schon gelernt!" }, { av: K, x: 72, dance: 0, say: "Nope. Morgen wieder." }], props: [{ e: "🌙", x: 50, y: 14, s: 50, a: "bob" }], nar: "Wichtig: Ein neues Wort ist erst gelernt, wenn du es morgen noch weißt." },
      { bg: "gold", cast: [{ av: B, x: 50, dance: 6, say: "Morgen sitzt’s! 🏆" }], props: [{ e: "🪙", x: 26, y: 24, s: 44, a: "fly" }], nar: "Die Münzen bekommst du, wenn es wirklich sitzt." }
    ] },
    { id: "box", icon: "♻️", title: "Fehlerkartei", go: { mode: "box" }, scenes: [
      { bg: "ice", cast: [{ av: B, x: 50, dance: 0, say: "Autsch. Schon wieder falsch." }], props: [{ e: "❌", x: 28, y: 24, s: 46, a: "shake" }, { e: "❌", x: 72, y: 30, s: 40, a: "shake" }], nar: "Fehler sind kein Drama. Sie wandern in die Fehlerkartei." },
      { bg: "ice", cast: [{ av: P, x: 50, dance: 1, say: "Die Kartei ist mein Werkzeugkasten!" }], props: [{ e: "🗃️", x: 50, y: 16, s: 64, a: "bob" }], nar: "Dort liegen genau die Wörter, die dich ärgern. Nur die." },
      { bg: "ice", cast: [{ av: R, x: 50, dance: 2, say: "Zweimal richtig = raus!" }], props: [{ e: "✅", x: 30, y: 22, s: 46, a: "pop" }, { e: "✅", x: 70, y: 22, s: 46, a: "pop" }], nar: "Sitzt ein Wort zweimal, fliegt es aus der Kartei. Und du bekommst Münzen." },
      { bg: "gold", cast: [{ av: K, x: 50, dance: 6, say: "Kartei leer. Ich bin ein Genie." }], props: [{ e: "🏆", x: 50, y: 14, s: 60, a: "bob" }], nar: "Ziel: die Kartei leer machen. Das schaffen die wenigsten!" }
    ] },
    { id: "sent", icon: "💬", title: "Sätze", go: { mode: "sent" }, scenes: [
      { bg: "day", cast: [{ av: P, x: 50, dance: 0, say: "Apple. Banana. Ich kann Englisch!" }], props: [{ e: "🍎", x: 28, y: 26, s: 44, a: "bob" }, { e: "🍌", x: 72, y: 26, s: 44, a: "bob" }], nar: "Einzelne Wörter reichen nicht. Man redet in Sätzen." },
      { bg: "day", cast: [{ av: B, x: 30, dance: 0, say: "I … has … hungry?" }, { av: R, x: 72, dance: 0, say: "Nein! I AM hungry!" }], props: [{ e: "🍕", x: 50, y: 18, s: 54, a: "bob" }], nar: "Sätze üben heißt: Wörter richtig zusammenbauen." },
      { bg: "day", cast: [{ av: K, x: 50, dance: 2, say: "Baustein für Baustein." }], props: [{ e: "🧱", x: 26, y: 24, s: 44, a: "pop" }, { e: "🧱", x: 50, y: 14, s: 44, a: "pop" }, { e: "🧱", x: 74, y: 24, s: 44, a: "pop" }], nar: "Du ordnest die Satzteile. Falsch gebaut? Dann fällt der Turm kurz um." },
      { bg: "gold", cast: [{ av: B, x: 50, dance: 6, say: "I am a champion!" }], props: [{ e: "⭐", x: 26, y: 22, s: 40, a: "spin" }, { e: "⭐", x: 74, y: 22, s: 40, a: "spin" }], nar: "Sätze bringen die meisten XP. Gut für den Rang." }
    ] },
    { id: "verbs", icon: "🔀", title: "Unregelmäßige Verben", go: { mode: "verbs" }, scenes: [
      { bg: "night", cast: [{ av: B, x: 50, dance: 0, say: "Go, goed, goed? Oder?" }], props: [{ e: "🤔", x: 50, y: 18, s: 54, a: "bob" }], nar: "Manche Verben machen einfach, was sie wollen." },
      { bg: "night", cast: [{ av: P, x: 50, dance: 1, say: "go – went – gone!" }], props: [{ e: "🚶", x: 24, y: 28, s: 44, a: "bob" }, { e: "🏃", x: 50, y: 22, s: 44, a: "bob" }, { e: "🏁", x: 76, y: 28, s: 44, a: "bob" }], nar: "Drei Formen: heute, gestern, schon passiert." },
      { bg: "night", cast: [{ av: R, x: 50, dance: 2, say: "Immer wieder kurz. Nie lang." }], props: [{ e: "⏱️", x: 50, y: 18, s: 54, a: "spin" }], nar: "Verben sitzen, wenn du sie oft kurz übst. Fünf Minuten reichen." },
      { bg: "gold", cast: [{ av: K, x: 50, dance: 6, say: "I have won! (nicht winned)" }], props: [{ e: "🏅", x: 50, y: 16, s: 56, a: "bob" }], nar: "Pro Abschnitt kommen sie einmal im Lernpfad vor." }
    ] },
    { id: "listen", icon: "👂", title: "Hören", go: { mode: "focus", focus: "listen" }, scenes: [
      { bg: "ice", cast: [{ av: B, x: 50, dance: 0, say: "Psst … was hat er gesagt?" }], props: [{ e: "👂", x: 50, y: 18, s: 60, a: "bob" }], nar: "Beim Hören siehst du kein Wort. Du hörst es nur." },
      { bg: "ice", cast: [{ av: P, x: 50, dance: 3, say: "Tap tap tap!" }], props: [{ e: "🔊", x: 26, y: 22, s: 50, a: "pop" }, { e: "🎧", x: 74, y: 22, s: 50, a: "bob" }], nar: "Du hörst das Wort und tippst die richtige Karte an." },
      { bg: "ice", cast: [{ av: R, x: 50, dance: 1, say: "Meine Ohren sind jetzt Profis." }], props: [{ e: "🦻", x: 50, y: 18, s: 54, a: "bob" }], nar: "Das trainiert dein Ohr für echtes Englisch. Zum Beispiel im Urlaub." },
      { bg: "gold", cast: [{ av: K, x: 50, dance: 6, say: "I hear you!" }], props: [{ e: "🪙", x: 50, y: 14, s: 44, a: "fly" }], nar: "Tipp: Kopfhörer auf, dann klappt’s am besten." }
    ] },
    { id: "type", icon: "⌨️", title: "Tippen", go: { mode: "focus", focus: "type" }, scenes: [
      { bg: "day", cast: [{ av: P, x: 50, dance: 0, say: "Wie schreibt man das?!" }], props: [{ e: "⌨️", x: 50, y: 18, s: 60, a: "bob" }], nar: "Beim Tippen schreibst du das Wort selbst." },
      { bg: "day", cast: [{ av: B, x: 50, dance: 1, say: "ele … phant? elefant?" }], props: [{ e: "🐘", x: 50, y: 14, s: 58, a: "bob" }], nar: "Kein Raten zwischen Antworten. Du musst es wirklich wissen." },
      { bg: "day", cast: [{ av: K, x: 50, dance: 0, say: "Ein Buchstabe falsch? Zeig ich dir!" }], props: [{ e: "🔍", x: 28, y: 22, s: 50, a: "pop" }], nar: "Ein Fehler wird gezeigt, du siehst genau, wo er war." },
      { bg: "gold", cast: [{ av: R, x: 50, dance: 6, say: "elephant. Perfekt!" }], props: [{ e: "✅", x: 50, y: 16, s: 50, a: "pop" }], nar: "Tippen bringt Wörter am besten ins Langzeitgedächtnis." }
    ] },
    { id: "gap", icon: "🧩", title: "Lücken", go: { mode: "focus", focus: "gap" }, scenes: [
      { bg: "night", cast: [{ av: B, x: 50, dance: 0, say: "Da fehlt was im Satz!" }], props: [{ e: "🧩", x: 50, y: 18, s: 60, a: "bob" }], nar: "Im Satz ist ein Wort verschwunden. Findest du es?" },
      { bg: "night", cast: [{ av: P, x: 50, dance: 1, say: "I ___ a dog." }, { av: R, x: 76, dance: 0, say: "have!" }], props: [{ e: "🐶", x: 24, y: 24, s: 50, a: "bob" }], nar: "Du denkst nach: Was passt hier grammatisch und inhaltlich?" },
      { bg: "night", cast: [{ av: K, x: 50, dance: 2, say: "Lücken lehren Grammatik – heimlich." }], props: [{ e: "🕵️", x: 50, y: 16, s: 54, a: "bob" }], nar: "So lernst du nebenbei, wie Sätze funktionieren." },
      { bg: "gold", cast: [{ av: B, x: 50, dance: 6, say: "Lücke geschlossen!" }], props: [{ e: "🎉", x: 50, y: 16, s: 54, a: "pop" }], nar: "Wenn alles passt, gibt es XP und gute Laune." }
    ] },
    { id: "match", icon: "🔗", title: "Zuordnen", go: { mode: "focus", focus: "match" }, scenes: [
      { bg: "ice", cast: [{ av: P, x: 50, dance: 0, say: "Links Englisch, rechts Deutsch." }], props: [{ e: "🇬🇧", x: 24, y: 22, s: 46, a: "bob" }, { e: "🇩🇪", x: 76, y: 22, s: 46, a: "bob" }], nar: "Zuordnen: Verbinde jedes Wort mit seiner Übersetzung." },
      { bg: "ice", cast: [{ av: B, x: 50, dance: 1, say: "Cat … Katze! Zack!" }], props: [{ e: "🐱", x: 28, y: 26, s: 44, a: "pop" }, { e: "🔗", x: 50, y: 18, s: 44, a: "spin" }], nar: "Tipp ein Wort an, dann sein Gegenstück. Passt es, verschwindet das Paar." },
      { bg: "ice", cast: [{ av: R, x: 50, dance: 2, say: "Alle weg? Dann bin ich fertig." }], props: [{ e: "✨", x: 50, y: 14, s: 44, a: "pop" }], nar: "Ein guter Aufwärmer, bevor es richtig losgeht." },
      { bg: "gold", cast: [{ av: K, x: 50, dance: 6, say: "Alle Paare gefunden!" }], props: [{ e: "🏅", x: 50, y: 16, s: 54, a: "bob" }], nar: "Kurz, knackig, perfekt für zwischendurch." }
    ] },
    { id: "arena-match", icon: "⚡", title: "Match-Rausch", go: { arena: "match" }, scenes: [
      { bg: "arena", cast: [{ av: B, x: 50, dance: 3, say: "60 Sekunden. Los!" }], props: [{ e: "⏱️", x: 50, y: 16, s: 60, a: "spin" }], nar: "Match-Rausch: Fünf gegen fünf, so schnell du kannst." },
      { bg: "arena", cast: [{ av: P, x: 50, dance: 1, say: "Paar! Paar! Paar!" }], props: [{ e: "⚡", x: 26, y: 22, s: 50, a: "pop" }, { e: "⚡", x: 74, y: 22, s: 50, a: "pop" }], nar: "Jedes Paar, das sitzt, macht Platz für ein neues." },
      { bg: "arena", cast: [{ av: K, x: 50, dance: 0, say: "Falsch gegriffen? Zwei Sekunden weg." }], props: [{ e: "💥", x: 50, y: 18, s: 54, a: "shake" }], nar: "Ein Fehlgriff kostet zwei Sekunden. Also lieber kurz hinschauen." },
      { bg: "gold", cast: [{ av: R, x: 50, dance: 6, say: "Neuer Bestwert!" }], props: [{ e: "🏆", x: 50, y: 14, s: 58, a: "bob" }], nar: "Dein Bestwert wird gespeichert. Schlag ihn morgen!" }
    ] },
    { id: "arena-blitz", icon: "🔥", title: "Blitzrunde", go: { arena: "blitz" }, scenes: [
      { bg: "arena", cast: [{ av: B, x: 50, dance: 0, say: "Nur 40 Sekunden?!" }], props: [{ e: "🔥", x: 50, y: 16, s: 60, a: "bob" }], nar: "Blitzrunde: Du startest mit 40 Sekunden auf der Uhr." },
      { bg: "arena", cast: [{ av: P, x: 50, dance: 3, say: "Richtig = Zeit geschenkt!" }], props: [{ e: "⏳", x: 26, y: 24, s: 48, a: "spin" }, { e: "➕", x: 74, y: 24, s: 48, a: "pop" }], nar: "Jede richtige Antwort bringt 1,5 Sekunden zurück." },
      { bg: "arena", cast: [{ av: K, x: 50, dance: 0, say: "Falsch kostet drei. Autsch." }], props: [{ e: "💣", x: 50, y: 18, s: 54, a: "shake" }], nar: "Falsch kostet drei Sekunden. Schnell und sicher ist das Rezept." },
      { bg: "gold", cast: [{ av: R, x: 50, dance: 6, say: "Ich bin ein Blitz!" }], props: [{ e: "⚡", x: 50, y: 14, s: 56, a: "bob" }], nar: "Die Runde endet, wenn die Uhr leer ist." }
    ] },
    { id: "arena-survival", icon: "💠", title: "Letztes Herz", go: { arena: "survival" }, scenes: [
      { bg: "arena", cast: [{ av: B, x: 50, dance: 0, say: "Nur ein Leben. Wirklich." }], props: [{ e: "💠", x: 50, y: 16, s: 60, a: "bob" }], nar: "Letztes Herz: Ein einziger Fehler beendet die Runde." },
      { bg: "arena", cast: [{ av: P, x: 50, dance: 1, say: "Der Balken läuft ab!" }], props: [{ e: "📉", x: 50, y: 18, s: 54, a: "bob" }], nar: "Pro Wort läuft ein kurzer Balken. Alle fünf Treffer wird er schneller." },
      { bg: "arena", cast: [{ av: K, x: 50, dance: 2, say: "Konzentration, Leute!" }], props: [{ e: "🧘", x: 50, y: 18, s: 54, a: "bob" }], nar: "Hier zählt Ruhe mehr als Tempo." },
      { bg: "gold", cast: [{ av: R, x: 50, dance: 6, say: "Rekord! 25 am Stück!" }], props: [{ e: "🏆", x: 50, y: 14, s: 58, a: "bob" }], nar: "Wie weit kommst du ohne Patzer?" }
    ] },
    { id: "arena-hunt", icon: "🎯", title: "Fehlerjagd", go: { arena: "hunt" }, scenes: [
      { bg: "arena", cast: [{ av: B, x: 50, dance: 0, say: "Ich jage meine Fehler!" }], props: [{ e: "🎯", x: 50, y: 16, s: 60, a: "spin" }], nar: "Fehlerjagd: nur die Wörter, die dich bisher geärgert haben." },
      { bg: "arena", cast: [{ av: P, x: 50, dance: 1, say: "Zweimal sitzt = erledigt!" }], props: [{ e: "✅", x: 30, y: 22, s: 46, a: "pop" }, { e: "✅", x: 70, y: 22, s: 46, a: "pop" }], nar: "Jedes Wort muss zweimal sitzen, dann ist es aus der Kartei." },
      { bg: "arena", cast: [{ av: K, x: 50, dance: 3, say: "90 Sekunden. Jagd eröffnet!" }], props: [{ e: "⏱️", x: 50, y: 16, s: 56, a: "spin" }], nar: "Du hast 90 Sekunden. Schaffst du die Kartei leer?" },
      { bg: "gold", cast: [{ av: R, x: 50, dance: 6, say: "Kartei: leer!" }], props: [{ e: "🏅", x: 50, y: 16, s: 56, a: "bob" }], nar: "Super Training für die kniffligen Wörter." }
    ] }
  ];

  function byId(id) { return FILMS.filter(function (f) { return f.id === id; })[0]; }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function dur(sc) { var n = (sc.nar || "").length; (sc.cast || []).forEach(function (c) { n += (c.say || "").length * .6; }); return Math.max(4200, Math.round(n * 75) + 1600); }

  function sceneHtml(sc) {
    var h = '<div class="fmbg ' + sc.bg + '"></div><div class="fmfloor"></div>';
    (sc.props || []).forEach(function (p, i) {
      h += '<i class="fmprop fm-' + (p.a || "bob") + '" style="left:' + p.x + '%;top:' + p.y + '%;font-size:' + p.s + 'px;animation-delay:' + (i * 0.25) + 's">' + p.e + '</i>';
    });
    (sc.cast || []).forEach(function (c, i) {
      var fig = global.VTA ? global.VTA.dancer(c.av, null, c.dance || 0) : "";
      if (!c.dance) fig = fig.replace('class="afig a0"', 'class="afig"');
      h += '<div class="fmc" style="left:' + c.x + '%;animation-delay:' + (i * .35) + 's"><div class="fmfig">' + fig + '</div>' +
        (c.say ? '<div class="fmsay" style="animation-delay:' + (.5 + i * .6) + 's">' + esc(c.say) + '</div>' : "") + '</div>';
    });
    return h;
  }

  /* Aufgenommene Sprecherstimme (audio/film/*.mp3, erzeugt mit tools/film-voice.js). Der Dateiname enthält Stimme und Textprüfsumme,
     index.json listet, was es gibt. Fehlt eine Datei, spricht die Gerätestimme (opts.speak). */
  function hash(s) { var x = 2166136261, i; for (i = 0; i < s.length; i++) { x ^= s.charCodeAt(i); x = Math.imul(x, 16777619) >>> 0; } return ("00000000" + x.toString(16)).slice(-8); }
  var audIdx = null, audLoad = null, aud = null, ptok = 0;
  function loadIndex() {
    if (audLoad) return audLoad;
    audLoad = fetch("audio/film/index.json").then(function (r) { return r.ok ? r.json() : []; }).catch(function () { return []; }).then(function (a) { audIdx = {}; (a || []).forEach(function (f) { audIdx[f] = 1; }); });
    return audLoad;
  }
  function playRec(text, v) {
    var n = v + "-" + hash(text) + ".mp3"; if (!v || !audIdx || !audIdx[n]) return false;
    var tk = ++ptok;
    fetch("audio/film/" + n).then(function (r) { return r.blob(); }).then(function (b) {
      if (tk !== ptok || !ov) return;
      var url = URL.createObjectURL(b), a = new Audio(url); aud = a;
      a.onended = function () { URL.revokeObjectURL(url); };
      a.onloadedmetadata = function () {   // länger als geplant: Szene bleibt, bis die Stimme fertig ist
        var need = Math.round(a.duration * 1000) + 700;
        if (!paused && need > left - (Date.now() - t0)) { clearTimeout(timer); left = need; t0 = Date.now(); var i0 = idx; timer = setTimeout(function () { show(i0 + 1); }, need); }
      };
      a.play().catch(function () {});
    }).catch(function () { if (tk === ptok && opts && opts.speak) { try { opts.speak(text); } catch (e) {} } });
    return true;
  }
  var ov = null, timer = null, idx = 0, film = null, paused = false, voice = false, opts = null, t0 = 0, left = 0;
  function stop() { clearTimeout(timer); ptok++; try { if (aud) { aud.pause(); aud = null; } } catch (e) {} try { if (global.speechSynthesis) global.speechSynthesis.cancel(); } catch (e) {} }
  function close() { stop(); if (ov) ov.remove(); ov = null; }
  function show(i) {
    stop(); idx = i;
    if (i >= film.scenes.length) return end();
    var sc = film.scenes[i], stage = ov.querySelector(".fmstage");
    stage.innerHTML = sceneHtml(sc) + '<div class="fmcap"><span>' + esc(sc.nar) + '</span></div>';
    stage.classList.remove("in"); void stage.offsetWidth; stage.classList.add("in");
    ov.querySelectorAll(".fmseg i").forEach(function (b, k) { b.className = k < i ? "done" : k === i ? "cur" : ""; b.style.animationDuration = dur(sc) + "ms"; });
    ov.querySelector(".fmttl").textContent = film.icon + " " + film.title + " · " + (i + 1) + "/" + film.scenes.length;
    if (voice && opts) { var rv = opts.voice ? opts.voice() : null; if (!(rv && playRec(sc.nar, rv)) && opts.speak) { try { opts.speak(sc.nar); } catch (e) {} } }
    left = dur(sc); t0 = Date.now();
    if (!paused) timer = setTimeout(function () { show(i + 1); }, left);
  }
  function end() {
    stop();
    var stage = ov.querySelector(".fmstage"), go = film.go;
    stage.innerHTML = '<div class="fmbg gold"></div><div class="fmfloor"></div><div class="fmc" style="left:50%"><div class="fmfig">' + (global.VTA ? global.VTA.dancer(K, null, 6) : "") + '</div></div>' +
      '<div class="fmend"><h3>Das war’s! 🎬</h3><button class="fmbtn" data-fm="go">Jetzt ausprobieren ▶</button><button class="fmbtn b2" data-fm="again">Nochmal ansehen</button></div>';
    ov.querySelectorAll(".fmseg i").forEach(function (b) { b.className = "done"; });
    ov.querySelector(".fmttl").textContent = film.icon + " " + film.title;
  }
  function play(id, o) {
    var f = byId(id); if (!f) return;
    close(); film = f; opts = o || {}; paused = false; voice = !!((opts.speak || opts.voice) && opts.audio !== false);
    ov = document.createElement("div"); ov.className = "fmov";
    ov.innerHTML = '<div class="fmwrap"><div class="fmtop"><div class="fmseg">' + f.scenes.map(function () { return "<i></i>"; }).join("") + '</div>' +
      '<div class="fmbar"><span class="fmttl"></span><span><button class="fmic" data-fm="voice" aria-label="Ton">' + (voice ? "🔊" : "🔇") + '</button><button class="fmic" data-fm="pause" aria-label="Pause">⏸</button><button class="fmic" data-fm="x" aria-label="Schließen">✕</button></span></div></div>' +
      '<div class="fmstage"></div></div>';
    document.body.appendChild(ov);
    ov.addEventListener("click", function (e) {
      var b = e.target.closest("[data-fm]"), a = b && b.getAttribute("data-fm");
      if (a === "x" || e.target === ov) return close();
      if (a === "voice") { voice = !voice; b.textContent = voice ? "🔊" : "🔇"; if (!voice) stop(); else show(idx); return; }
      if (a === "pause") { paused = !paused; b.textContent = paused ? "▶" : "⏸"; ov.classList.toggle("paused", paused); if (paused) { clearTimeout(timer); try { if (aud) aud.pause(); global.speechSynthesis.pause(); } catch (x) {} } else { try { if (aud) aud.play(); global.speechSynthesis.resume(); } catch (x) {} var rest = Math.max(600, left - (Date.now() - t0)); left = rest; t0 = Date.now(); timer = setTimeout(function () { show(idx + 1); }, rest); } return; }
      if (a === "again") return show(0);
      if (a === "go") { var g = film.go, cb = opts.onGo; close(); if (cb) cb(g); return; }
      if (e.target.closest(".fmstage") && !(ov.querySelector(".fmend"))) { if (e.clientX > global.innerWidth / 2) show(idx + 1); else show(Math.max(0, idx - 1)); }
    });
    Promise.race([loadIndex(), new Promise(function (r) { setTimeout(r, 800); })]).then(function () { if (ov) show(0); });
  }
  global.VTFILM = { list: FILMS, play: play, close: close, hash: hash };
})(window);
