/* Saison-Looks 2: Winter (Frost), Weihnachten (Candy), Spring Break (Beach), Aquarium (Unterwasser). Gleiche Bausteine wie Halloween (saison.js), aber je Thema eigene Figuren,
   Szenen, Effekte und Töne: Maskottchen am Faden (antippbar, vier Effekte), Figur-Wurf/Schlag gegen das Maskottchen (vier Flüge), 3D-Szene auf der Startseite,
   Wetter-Ebene (Schnee, Zuckerstreusel, Seifenblasen) und leise Klangteppiche. Alles per Canvas/CSS/Web Audio, keine Dateien. */
(function (global) {
  "use strict";
  var running = false, lastTap = "", whacking = false, lastMode = "";
  var TH = null, ART = {};
  function el(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  function ease(x) { return x < 0 ? 0 : x > 1 ? 1 : x * x * (3 - 2 * x); }
  function elastic(x) { if (x <= 0) return 0; if (x >= 1) return 1; return 1 - Math.pow(2, -9 * x) * Math.cos(x * 12); }
  function img(svg) { var im = new Image(); im.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg); return im; }
  function uri(svg) { return "url(\"data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg).replace(/'/g, "%27") + "\")"; }
  function vib(p) { try { if (global.navigator && navigator.vibrate) navigator.vibrate(p); } catch (e) {} }
  function rnd(a, b) { return a + Math.random() * (b - a); }

  /* ================= Figuren (SVG) ================= */
  function snowflake(f, big) {   // Eiskristall: sechs Arme mit Verzweigungen, Glanz in der Mitte
    var arms = "", r = f ? 4 : 0;
    for (var k = 0; k < 6; k++) {
      var a = (k * 60 + r) * Math.PI / 180, ca = Math.cos(a), sa = Math.sin(a);
      function pt(d, o) { var b = a + o; return (60 + Math.cos(b) * d).toFixed(1) + " " + (60 + Math.sin(b) * d).toFixed(1); }
      arms += "<path d='M60 60L" + pt(48, 0) + "M" + pt(22, 0) + "L" + pt(34, -0.62) + "M" + pt(22, 0) + "L" + pt(34, 0.62) + "M" + pt(36, 0) + "L" + pt(45, -0.5) + "M" + pt(36, 0) + "L" + pt(45, 0.5) + "' />";
    }
    return "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 120 120'><defs><radialGradient id='g' cx='.5' cy='.5'><stop offset='0' stop-color='#BFF4FF' stop-opacity='.9'/><stop offset='.5' stop-color='#5CE1FF' stop-opacity='.25'/><stop offset='1' stop-color='#5CE1FF' stop-opacity='0'/></radialGradient><linearGradient id='s' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='#FFFFFF'/><stop offset='1' stop-color='#7FD8FF'/></linearGradient></defs>" +
      "<circle cx='60' cy='60' r='58' fill='url(#g)'/><g stroke='#0B3A66' stroke-width='7.4' stroke-linecap='round' fill='none' opacity='.55'>" + arms + "</g><g stroke='url(#s)' stroke-width='4.6' stroke-linecap='round' fill='none'>" + arms + "</g>" +
      "<polygon points='60,46 72,53 72,67 60,74 48,67 48,53' fill='url(#s)' stroke='#0B3A66' stroke-width='2'/><polygon points='60,52 66,56 66,64 60,68 54,64 54,56' fill='#BFF4FF'/><circle cx='54' cy='53' r='3' fill='#fff' opacity='.9'/></svg>";
  }
  function ornament(f) {   // Christbaumkugel: rot, glänzend, weißer Zickzack, goldene Kappe
    var sh = f ? 6 : 0;
    return "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 120 120'><defs><radialGradient id='b' cx='.35' cy='.3' r='.8'><stop offset='0' stop-color='#FF7A8E'/><stop offset='.45' stop-color='#E8123C'/><stop offset='1' stop-color='#8E0A28'/></radialGradient></defs>" +
      "<path d='M60 8V22' stroke='#C99A2E' stroke-width='3' fill='none'/><circle cx='60' cy='7' r='5' fill='none' stroke='#C99A2E' stroke-width='3'/>" +
      "<rect x='47' y='20' width='26' height='13' rx='4' fill='#FFD34D' stroke='#B8860B' stroke-width='2'/><rect x='51' y='22' width='6' height='9' rx='2' fill='#FFF0A8' opacity='.8'/>" +
      "<circle cx='60' cy='72' r='42' fill='url(#b)'/><path d='M22 66l12 -9 12 9 12 -9 12 9 12 -9 12 9 12 -9' stroke='#fff' stroke-width='6' fill='none' stroke-linecap='round' stroke-linejoin='round' opacity='.92' transform='translate(0,6)'/>" +
      "<ellipse cx='" + (44 + sh) + "' cy='52' rx='11' ry='16' fill='#fff' opacity='.4' transform='rotate(-25 " + (44 + sh) + " 52)'/><circle cx='" + (82 - sh) + "' cy='96' r='5' fill='#fff' opacity='.25'/></svg>";
  }
  function parrot(f) {   // Ara: rot, gelb-blaue Flügel, großer Schnabel, Flügel schlagen
    var w = f ? "M40 66C14 50 12 26 26 16C34 34 44 50 54 60Z" : "M40 70C16 74 6 66 8 50C24 54 40 62 54 66Z";
    var w2 = f ? "M80 66C106 50 108 26 94 16C86 34 76 50 66 60Z" : "M80 70C104 74 114 66 112 50C96 54 80 62 66 66Z";
    return "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 120 120'><path d='M54 84L46 116L58 104L60 118L66 104L74 116L66 84Z' fill='#1E90FF'/><path d='M60 84L58 112L64 100Z' fill='#FFD34D'/>" +
      "<path d='" + w + "' fill='#1E90FF' stroke='#0B3A66' stroke-width='2'/><path d='" + w2 + "' fill='#1E90FF' stroke='#0B3A66' stroke-width='2'/>" +
      "<ellipse cx='60' cy='68' rx='23' ry='30' fill='#E8123C'/><ellipse cx='60' cy='76' rx='13' ry='20' fill='#FF8A5C'/>" +
      "<circle cx='60' cy='38' r='20' fill='#E8123C'/><circle cx='52' cy='34' r='7.5' fill='#fff'/><circle cx='68' cy='34' r='7.5' fill='#fff'/><circle cx='53' cy='35' r='3.6' fill='#111'/><circle cx='67' cy='35' r='3.6' fill='#111'/><circle cx='54' cy='34' r='1.2' fill='#fff'/><circle cx='68' cy='34' r='1.2' fill='#fff'/>" +
      "<path d='M60 38C48 40 46 54 60 62C74 54 72 40 60 38Z' fill='#FFE08A' stroke='#B8860B' stroke-width='1.5'/><path d='M60 46C56 48 56 54 60 58C64 54 64 48 60 46Z' fill='#FFB703'/>" +
      "<path d='M50 20Q60 8 70 20' fill='#FFD34D' stroke='none'/></svg>";
  }
  function penguin() {
    return "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 44 52'><ellipse cx='22' cy='30' rx='13' ry='18' fill='#1B2347'/><ellipse cx='22' cy='33' rx='8.5' ry='13' fill='#fff'/><circle cx='22' cy='14' r='10' fill='#1B2347'/><circle cx='18' cy='12' r='3' fill='#fff'/><circle cx='26' cy='12' r='3' fill='#fff'/><circle cx='18.6' cy='12.4' r='1.4' fill='#111'/><circle cx='26.6' cy='12.4' r='1.4' fill='#111'/><path d='M18 17L22 23L26 17Z' fill='#FF9F1C'/><path d='M14 47l-6 4h10zM30 47l6 4H26z' fill='#FF9F1C'/><path d='M9 26L1 36l9 -2z' fill='#1B2347'/><path d='M35 26L43 36l-9 -2z' fill='#1B2347'/></svg>";
  }
  function sleigh() {
    return "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 120 50'><path d='M58 40Q66 36 88 36L112 24L100 38Q94 46 62 46Z' fill='#E8123C' stroke='#7a0a22' stroke-width='1.6'/><rect x='74' y='24' width='22' height='10' rx='3' fill='#fff' stroke='#7a0a22' stroke-width='1.2'/><circle cx='85' cy='19' r='5.5' fill='#FFD7B0'/><path d='M79 17Q85 8 92 16Z' fill='#E8123C'/><path d='M58 47Q90 50 112 44' stroke='#FFD34D' stroke-width='2.4' fill='none'/>" +
      "<path d='M6 18l9 4 10-5 10 5 10 3' stroke='#7a4a1e' stroke-width='3' fill='none' stroke-linecap='round'/><ellipse cx='22' cy='28' rx='12' ry='7' fill='#A8672B'/><circle cx='11' cy='22' r='5' fill='#A8672B'/><circle cx='7' cy='22' r='2.6' fill='#E8123C'/><path d='M12 17L8 8M16 17l4 -8' stroke='#6B4018' stroke-width='2' stroke-linecap='round'/><path d='M14 33v10M30 33v10' stroke='#6B4018' stroke-width='3' stroke-linecap='round'/><path d='M36 26L58 38' stroke='#C99A2E' stroke-width='1.6'/></svg>";
  }
  function gull() {
    return "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 60 28'><path d='M30 14C24 4 12 2 2 10C14 8 22 12 28 18Z' fill='#fff' stroke='#94A9BD' stroke-width='1'/><path d='M30 14C36 4 48 2 58 10C46 8 38 12 32 18Z' fill='#fff' stroke='#94A9BD' stroke-width='1'/><ellipse cx='30' cy='17' rx='6.5' ry='4.6' fill='#fff' stroke='#94A9BD' stroke-width='1'/><circle cx='36' cy='15' r='2.6' fill='#fff' stroke='#94A9BD' stroke-width='.8'/><path d='M38 15l5 1.6l-5 1z' fill='#FF9F1C'/><circle cx='36.6' cy='14.4' r='.8' fill='#111'/></svg>";
  }
  function fishV(f) {   // Goldfisch am Angelhaken: Maul oben, Schwanzflosse schlägt
    var tl = f ? "M60 90C38 94 24 112 32 118C46 114 56 108 60 100C64 108 74 114 88 118C96 112 82 94 60 90Z" : "M60 90C44 98 36 114 46 118C54 114 58 108 60 100C62 108 68 116 78 118C88 112 78 98 60 90Z";
    var fl = f ? ["M34 54C14 44 6 62 18 74C26 70 31 62 34 54Z", "M86 54C106 44 114 62 102 74C94 70 89 62 86 54Z"] : ["M34 56C16 56 10 74 24 80C29 74 32 66 34 56Z", "M86 56C104 56 110 74 96 80C91 74 88 66 86 56Z"];
    return "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 120 120'><defs><radialGradient id='o' cx='.38' cy='.3' r='.85'><stop offset='0' stop-color='#FFD27A'/><stop offset='.5' stop-color='#FF8A2B'/><stop offset='1' stop-color='#D9480F'/></radialGradient></defs>" +
      "<path d='M60 0V15' stroke='#E8F8FF' stroke-width='2' fill='none'/><path d='M60 14Q69 15 66 24' stroke='#C9D6DE' stroke-width='2.4' fill='none' stroke-linecap='round'/>" +
      "<path d='" + tl + "' fill='#FF6A1F' stroke='#9C3A08' stroke-width='2'/><path d='" + fl[0] + "' fill='#FF9A4D' stroke='#9C3A08' stroke-width='2'/><path d='" + fl[1] + "' fill='#FF9A4D' stroke='#9C3A08' stroke-width='2'/>" +
      "<ellipse cx='60' cy='58' rx='31' ry='38' fill='url(#o)' stroke='#9C3A08' stroke-width='2.2'/>" +
      "<g fill='none' stroke='#C2410C' stroke-width='1.6' opacity='.55'><path d='M44 70q8 6 16 0q8 6 16 0M40 82q10 7 20 0q10 7 20 0M48 58q6 5 12 0q6 5 12 0'/></g>" +
      "<circle cx='46' cy='40' r='10' fill='#fff' stroke='#9C3A08' stroke-width='1.6'/><circle cx='74' cy='40' r='10' fill='#fff' stroke='#9C3A08' stroke-width='1.6'/><circle cx='47' cy='41' r='5' fill='#111'/><circle cx='73' cy='41' r='5' fill='#111'/><circle cx='45' cy='38' r='2' fill='#fff'/><circle cx='71' cy='38' r='2' fill='#fff'/>" +
      "<circle cx='36' cy='54' r='5' fill='#FF5E7A' opacity='.45'/><circle cx='84' cy='54' r='5' fill='#FF5E7A' opacity='.45'/><path d='M54 26Q60 31 66 26' stroke='#9C3A08' stroke-width='2.4' fill='none' stroke-linecap='round'/>" +
      "<ellipse cx='48' cy='28' rx='9' ry='5' fill='#fff' opacity='.35' transform='rotate(-25 48 28)'/></svg>";
  }
  function fishH() {   // schwimmende Fische (Blick nach rechts), je Aufruf eine andere Art: Clownfisch, Doktorfisch, Kaiserfisch, Kugelfisch
    var k = Math.random() * 4 | 0, o = "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 80 50'>";
    if (k === 0) o += "<path d='M12 25L0 12V38Z' fill='#FF7A1A' stroke='#7a2e00' stroke-width='1.4'/><ellipse cx='40' cy='25' rx='28' ry='17' fill='#FF8A2B' stroke='#7a2e00' stroke-width='1.6'/><path d='M30 9Q27 25 30 41M46 8Q43 25 46 42' stroke='#fff' stroke-width='6' fill='none'/><path d='M30 9Q27 25 30 41M46 8Q43 25 46 42' stroke='#222' stroke-width='1.2' fill='none' opacity='.5'/><path d='M26 9Q40 -2 56 11' fill='#FF8A2B' stroke='#7a2e00' stroke-width='1.4'/><circle cx='59' cy='21' r='4.4' fill='#fff'/><circle cx='60' cy='21' r='2.2' fill='#111'/>";
    else if (k === 1) o += "<path d='M12 25L1 11L5 25L1 39Z' fill='#FFD23F' stroke='#7a5a00' stroke-width='1.4'/><ellipse cx='40' cy='25' rx='28' ry='19' fill='#2F8CFF' stroke='#0B2E66' stroke-width='1.6'/><path d='M22 16Q42 8 62 24Q44 18 22 26Z' fill='#0B1E4D'/><path d='M26 8Q40 -3 58 10' fill='#2F8CFF' stroke='#0B2E66' stroke-width='1.4'/><circle cx='60' cy='22' r='4.4' fill='#fff'/><circle cx='61' cy='22' r='2.2' fill='#111'/>";
    else if (k === 2) o += "<path d='M12 25L1 9V41Z' fill='#B65CFF' stroke='#3b1470' stroke-width='1.4'/><ellipse cx='40' cy='25' rx='27' ry='20' fill='#FFC93C' stroke='#3b1470' stroke-width='1.6'/><path d='M30 6Q28 25 30 44M42 5Q40 25 42 45' stroke='#B65CFF' stroke-width='3.4' fill='none'/><path d='M24 8Q40 -4 58 10' fill='#B65CFF' stroke='#3b1470' stroke-width='1.4'/><circle cx='58' cy='21' r='4.4' fill='#fff'/><circle cx='59' cy='21' r='2.2' fill='#111'/>";
    else o += "<path d='M14 25L4 15V35Z' fill='#E6B800' stroke='#6a5200' stroke-width='1.4'/><circle cx='42' cy='25' r='22' fill='#FFE066' stroke='#6a5200' stroke-width='1.6'/><ellipse cx='42' cy='34' rx='15' ry='9' fill='#FFF6C4'/><g stroke='#6a5200' stroke-width='1.8' stroke-linecap='round'><path d='M42 2V-0M60 8L63 5M24 8L21 5M20 22L16 21M64 24L68 24M28 40L25 44M56 40L59 44'/></g><circle cx='54' cy='20' r='5' fill='#fff'/><circle cx='55.5' cy='20.5' r='2.6' fill='#111'/><path d='M62 33Q66 36 70 33' stroke='#6a5200' stroke-width='2' fill='none' stroke-linecap='round'/>";
    return o + "<ellipse cx='36' cy='19' rx='9' ry='4' fill='#fff' opacity='.3'/></svg>";
  }
  function star(c) { return "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 40'><path d='M20 2l5 13h14l-11 9 4 14-12-8-12 8 4-14L1 15h14z' fill='" + c + "' stroke='#fff' stroke-width='1.5'/></svg>"; }

  var THEMES = {
    winter: {
      name: "Winter", boo: "BRRR!", cheer: "Geschafft! Der Eiskristall tanzt mit ❄️🎉", spark: ["#BFF4FF", "#5CE1FF", "#FFFFFF", "#B28CFF"], dim: "rgba(6,12,40,", glow: "rgba(92,225,255,",
      mascot: snowflake, mini: snowflake, flyer: penguin, tool: "snow", bubbles: { weg: ["Volltreffer! ❄️", "Eiskalt erwischt! 🧊", "Schneeball-Profi! ⛄"], loop: ["Eis-Looping! 🌀", "Wirbelwind! 🌬️"], pinball: ["Flipper im Schnee! 🎯", "Pling, pling! 🔔"], splat: ["Platsch! ☃️", "Schneematsch! 💥"] },
      thread: "#DFF6FF", splat: ["#FFFFFF", "#CFEFFF", "#8FD8FF"], hint: "Tipp mich – Schneeball! ❄️", ambient: "winter"
    },
    xmas: {
      name: "Weihnachten", boo: "HO HO HO!", cheer: "Geschafft! Die Kugel feiert mit 🎄🎉", spark: ["#FFD34D", "#FF4D79", "#FFFFFF", "#7DF0C0"], dim: "rgba(60,5,25,", glow: "rgba(255,77,121,",
      mascot: ornament, mini: ornament, flyer: sleigh, tool: "cane", bubbles: { weg: ["Zuckerstangen-Treffer! 🍭", "Ab in den Schnee! 🎄", "Hohoho, weg damit! 🎅"], loop: ["Looping wie der Weihnachtsmann! 🦌", "Wirbel-Kugel! 🌀"], pinball: ["Flipper-Kugel! 🎯", "Bing, bing! 🔔"], splat: ["Zuckerguss! 🍬", "Platsch, Zuckerwatte! 💥"] },
      thread: "#FFE9A8", splat: ["#FF8FB8", "#FFFFFF", "#7DF0C0", "#FFD34D"], hint: "Tipp mich – Zuckerstange! 🍭", ambient: "xmas"
    },
    aqua: {
      name: "Aquarium", boo: "BLUBB!", cheer: "Geschafft! Der Fisch feiert mit 🐠🎉", spark: ["#BFF4FF", "#5CE1FF", "#FFFFFF", "#FFB25C"], dim: "rgba(0,30,64,", glow: "rgba(80,220,255,",
      mascot: fishV, mini: fishV, flyer: fishH, tool: "rod", bubbles: { weg: ["Angel ausgeworfen! 🎣", "Fisch weg! 🐟", "Ab ins Meer! 🌊"], loop: ["Fisch-Looping! 🌀", "Salto im Wasser! 🐬"], pinball: ["Flipper im Becken! 🎯", "Blub, blub! 🫧"], splat: ["Platsch an die Scheibe! 💦", "Blubb! 🫧"] },
      thread: "#E8F8FF", splat: ["#BFF4FF", "#5CE1FF", "#2F9BFF", "#FFFFFF"], hint: "Tipp mich – Fisch an der Angel! 🎣", ambient: "aqua"
    },
    spring: {
      name: "Spring Break", boo: "ALOHA!", cheer: "Geschafft! Der Papagei feiert mit 🌴🎉", spark: ["#FFD23F", "#FF5E7A", "#00D1C1", "#FFFFFF"], dim: "rgba(10,40,70,", glow: "rgba(255,210,63,",
      mascot: parrot, mini: parrot, flyer: gull, tool: "ball", bubbles: { weg: ["Tooor! ⚽🌴", "Ab ins Meer! 🌊", "Strandball-Profi! 🏖️"], loop: ["Surf-Looping! 🏄", "Welle gemacht! 🌊"], pinball: ["Beach-Flipper! 🎯", "Plopp, plopp! 💦"], splat: ["Platsch! 💦", "Wasserbombe! 🎈"] },
      thread: "#FFF3C4", splat: ["#7DE8FF", "#FFFFFF", "#00D1C1", "#FFD23F"], hint: "Tipp mich – Strandball! 🏖️", ambient: "spring"
    }
  };
  function art(id) {
    if (!ART[id]) { var T = THEMES[id]; ART[id] = { m: [img(T.mascot(0)), img(T.mascot(1))], flyer: img(T.flyer()) }; }
    return ART[id];
  }
  function setTheme(id) { TH = THEMES[id] || null; if (TH) TH.id = id; return TH; }

  /* ================= Töne (Web Audio) ================= */
  function AC() { var a = global.VTC && global.VTC.ctx ? global.VTC.ctx() : null; if (a && a.state === "suspended") { try { a.resume(); } catch (e) {} } return a; }
  var PENTA = { winter: [587.3, 659.3, 784, 880, 987.8, 1174.7, 1318.5], xmas: [523.3, 587.3, 659.3, 784, 880, 1046.5], spring: [261.6, 293.7, 329.6, 392, 440, 523.3], aqua: [392, 440, 523.3, 587.3, 659.3, 784] };
  function voice(a, out, f, t, dur, kind, vol, f2) {   // kind: bell | glass | wood | pluck | pad | blip
    var o = a.createOscillator(), g = a.createGain(); o.type = kind === "wood" || kind === "pluck" ? "triangle" : kind === "pad" ? "triangle" : "sine"; o.frequency.setValueAtTime(f, t); if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + dur);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + (kind === "pad" ? dur * 0.3 : 0.012)); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(out); o.start(t); o.stop(t + dur + 0.05);
    if (kind === "bell" || kind === "glass") { var o2 = a.createOscillator(), g2 = a.createGain(); o2.type = "sine"; o2.frequency.setValueAtTime(f * (kind === "bell" ? 2.76 : 2.01), t); g2.gain.setValueAtTime(0.0001, t); g2.gain.exponentialRampToValueAtTime(vol * 0.4, t + 0.01); g2.gain.exponentialRampToValueAtTime(0.0001, t + dur * 0.6); o2.connect(g2); g2.connect(out); o2.start(t); o2.stop(t + dur); }
  }
  function noiseBuf(a, sec) { var n = a.sampleRate * sec, b = a.createBuffer(1, n, a.sampleRate), d = b.getChannelData(0); for (var i = 0; i < n; i++) d[i] = Math.random() * 2 - 1; return b; }
  function noiseHit(a, out, t, dur, f0, f1, q, vol, type) { var s = a.createBufferSource(), f = a.createBiquadFilter(), g = a.createGain(); s.buffer = noiseBuf(a, Math.max(0.3, dur + 0.1)); f.type = type || "bandpass"; f.Q.value = q; f.frequency.setValueAtTime(f0, t); f.frequency.exponentialRampToValueAtTime(f1, t + dur); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + dur * 0.4); g.gain.exponentialRampToValueAtTime(0.0001, t + dur); s.connect(f); f.connect(g); g.connect(out); s.start(t); s.stop(t + dur + 0.05); }
  /* Effekt-Töne je Thema: kind = tap | hit | splat | boing | chime | pop | shoot | rain | whoosh | jojo */
  function fx(kind, delay) {
    var a = AC(); if (!a || !TH) return; var id = TH.id, P = PENTA[id], m = a.createGain(); m.gain.value = 0.5; m.connect(a.destination); var t0 = a.currentTime + 0.02 + (delay || 0);
    var tone = id === "winter" || id === "aqua" ? "glass" : id === "xmas" ? "bell" : "wood";
    if (id === "aqua" && (kind === "pop" || kind === "boing")) { run([[300, 0, .14, "sine", .13, 760], [430, .09, .14, "sine", .1, 980], [620, .17, .12, "sine", .07, 1200]]); return; }   // Blubberblase
    function run(list) { list.forEach(function (n) { voice(a, m, n[0], t0 + n[1], n[2], n[3] || tone, n[4] || 0.12, n[5]); }); }
    if (kind === "chime") run([[P[2], 0, .9], [P[4], .08, .9], [P[6 % P.length], .18, 1.1]]);
    else if (kind === "pop") run([[P[1] * 1.5, 0, .25], [P[3] * 1.5, .07, .35]]);
    else if (kind === "boing") { run([[180, 0, .5, "sine", .16, 520]]); run([[520, .3, .35, "sine", .1, 200]]); }
    else if (kind === "whoosh") noiseHit(a, m, t0, .4, 500, 3000, 1, .16);
    else if (kind === "hit") { voice(a, m, 150, t0, .25, "sine", .5, 50); noiseHit(a, m, t0, .15, 3200, 700, .8, .3, "highpass"); run([[P[3] * 2, .02, .8, tone, .12], [P[5 % P.length] * 2, .06, .8, tone, .08]]); }
    else if (kind === "splat") { voice(a, m, 160, t0, .3, "sine", .45, 50); noiseHit(a, m, t0, .35, 2600, 300, .7, .3, "lowpass"); for (var q = 0; q < 5; q++) run([[500 - q * 60, .04 + q * .05, .1, "wood", .06, 200]]); }
    else if (kind === "shoot") { for (var s = 0; s < 7; s++) noiseHit(a, m, t0 + .8 + s * .07, .22, 700 + s * 120, 3200, 1, .05); for (var r = 0; r < 6; r++) run([[P[(r + 2) % P.length] * 2, 1.5 + r * .22, .5, tone, .05]]); }
    else if (kind === "rain") { for (var k = 0; k < 18; k++) run([[P[k % P.length] * (k % 2 ? 2 : 1), .1 + Math.random() * 1.8, .35, tone, .045]]); }
    else if (kind === "jojo") { for (var j = 0; j < 4; j++) { run([[220 + j * 30, j * 1.05 + .3, .5, "sine", .12 - j * .02, 520]]); run([[520, j * 1.05 + .55, .3, "sine", .09, 160]]); } }
    else if (kind === "tap") { noiseHit(a, m, t0, .5, 300, 1500, 1, .1); run([[P[0], .1, .7], [P[2], .22, .7], [P[4], .34, .9]]); noiseHit(a, m, t0 + 4.4, .6, 400, 3800, 1, .12); voice(a, m, 100, t0 + 5.05, .45, "sine", .5, 36); run([[P[5 % P.length] * 2, 5.1, 1, tone, .14], [P[3] * 2, 5.2, 1, tone, .1]]); for (var z = 0; z < 14; z++) run([[P[z % P.length] * 2, 5.3 + z * .09, .4, tone, .05]]); }
  }
  /* Klangteppich: leise, nur wenn Ton und Saison-Klänge an sind (Steuerung in app.js) */
  var AMB = null;
  function ambientStart(id) {
    if (AMB) return true; var a = AC(); if (!a || !PENTA[id]) return false;
    var m = a.createGain(); m.gain.value = 0.0001; m.connect(a.destination); m.gain.exponentialRampToValueAtTime(0.5, a.currentTime + 4);
    var echo = a.createDelay(1.2), fb = a.createGain(), wet = a.createGain(); echo.delayTime.value = id === "spring" ? 0.32 : 0.45; fb.gain.value = 0.36; wet.gain.value = 0.5; echo.connect(fb); fb.connect(echo); echo.connect(wet); wet.connect(m);
    var nodes = [], timers = [], P = PENTA[id];
    function loopNoise(f0, q, vol, lfoHz, depth, type) { var s = a.createBufferSource(); s.buffer = noiseBuf(a, 2); s.loop = true; var f = a.createBiquadFilter(); f.type = type || "bandpass"; f.frequency.value = f0; f.Q.value = q; var g = a.createGain(); g.gain.value = vol; s.connect(f); f.connect(g); g.connect(m); s.start(); nodes.push(s);
      var l = a.createOscillator(), lg = a.createGain(); l.frequency.value = lfoHz; lg.gain.value = depth; l.connect(lg); lg.connect(g.gain); l.start(); nodes.push(l); }
    function note(f, t, dur, kind, vol) { var o = a.createOscillator(), g = a.createGain(); o.type = kind === "pluck" ? "triangle" : "sine"; o.frequency.value = f; g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.012); g.gain.exponentialRampToValueAtTime(0.0001, t + dur); o.connect(g); g.connect(m); g.connect(echo); o.start(t); o.stop(t + dur + 0.1);
      if (kind === "bell") { var o2 = a.createOscillator(), g2 = a.createGain(); o2.frequency.value = f * 2.76; g2.gain.setValueAtTime(0.0001, t); g2.gain.exponentialRampToValueAtTime(vol * 0.35, t + 0.01); g2.gain.exponentialRampToValueAtTime(0.0001, t + dur * 0.5); o2.connect(g2); g2.connect(m); g2.connect(echo); o2.start(t); o2.stop(t + dur); } }
    var pos = 2;
    if (id === "winter") {
      loopNoise(500, 1.2, 0.02, 0.07, 0.012); loopNoise(2200, 3, 0.004, 0.11, 0.003);   // leiser Wind
      var mel = function () { var t = a.currentTime + .05, n = 2 + (Math.random() * 3 | 0); for (var k = 0; k < n; k++) { pos = Math.max(0, Math.min(P.length - 1, pos + [-2, -1, 1, 2, 1][Math.random() * 5 | 0])); note(P[pos], t + k * .6, 2.4, "bell", .026); } timers.push(setTimeout(mel, 5000 + Math.random() * 6000)); };
      var bells = function () { var t = a.currentTime + .05; for (var k = 0; k < 7; k++) note(2400 + Math.random() * 2600, t + k * .07 + Math.random() * .03, .35, "sine", .012); timers.push(setTimeout(bells, 9000 + Math.random() * 9000)); };
      timers.push(setTimeout(mel, 2000)); timers.push(setTimeout(bells, 6000));
    } else if (id === "xmas") {
      // Jingle Bells (gemeinfrei) als Spieluhr, alle halbe Minute einmal, dazwischen Glöckchen
      var JB = [[5, 1], [5, 1], [5, 2], [5, 1], [5, 1], [5, 2], [5, 1], [7, 1], [3, 1.5], [4, .5], [5, 4], [6, 1], [6, 1], [6, 1.5], [6, .5], [6, 1], [5, 1], [5, 1], [5, .5], [5, .5], [5, 1], [4, 1], [4, 1], [5, 1], [4, 2], [7, 2]];
      var SC = { 3: 261.6, 4: 293.7, 5: 329.6, 6: 349.2, 7: 392 };
      var jb = function () { var t = a.currentTime + .05, off = 0; JB.forEach(function (n) { note(SC[n[0]] * 2, t + off * .36, .9, "bell", .03); off += n[1]; }); timers.push(setTimeout(jb, 32000 + Math.random() * 14000)); };
      var jing = function () { var t = a.currentTime + .05; for (var k = 0; k < 6; k++) note(2800 + Math.random() * 2200, t + k * .06, .3, "sine", .01); timers.push(setTimeout(jing, 5000 + Math.random() * 7000)); };
      var pad = function () { var t = a.currentTime + .05, ch = [[261.6, 329.6, 392], [349.2, 440, 523.3], [392, 493.9, 587.3], [261.6, 329.6, 392]][pos++ % 4]; ch.forEach(function (f) { var o = a.createOscillator(), g = a.createGain(); o.type = "triangle"; o.frequency.value = f / 2; g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.012, t + 2); g.gain.exponentialRampToValueAtTime(0.0001, t + 6); o.connect(g); g.connect(m); o.start(t); o.stop(t + 6.2); }); timers.push(setTimeout(pad, 6000)); };
      timers.push(setTimeout(jb, 3000)); timers.push(setTimeout(jing, 2000)); timers.push(setTimeout(pad, 500));
    } else if (id === "aqua") {
      loopNoise(260, .5, 0.05, 0.06, 0.03, "lowpass"); loopNoise(1400, 2, 0.006, 0.1, 0.004);   // Unterwasser-Rauschen
      var blub = function () { var t = a.currentTime + .05, n = 1 + (Math.random() * 3 | 0); for (var k = 0; k < n; k++) { var o = a.createOscillator(), g = a.createGain(), f0 = 260 + Math.random() * 300, tt = t + k * (.08 + Math.random() * .08); o.type = "sine"; o.frequency.setValueAtTime(f0, tt); o.frequency.exponentialRampToValueAtTime(f0 * 2.2, tt + .09); g.gain.setValueAtTime(0.0001, tt); g.gain.exponentialRampToValueAtTime(0.03, tt + .015); g.gain.exponentialRampToValueAtTime(0.0001, tt + .12); o.connect(g); g.connect(m); g.connect(echo); o.start(tt); o.stop(tt + .15); } timers.push(setTimeout(blub, 700 + Math.random() * 2600)); };
      var whale = function () { var t = a.currentTime + .05, o = a.createOscillator(), g = a.createGain(); o.type = "sine"; o.frequency.setValueAtTime(150, t); o.frequency.exponentialRampToValueAtTime(260, t + 2.2); o.frequency.exponentialRampToValueAtTime(170, t + 4.5); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.03, t + 1.2); g.gain.exponentialRampToValueAtTime(0.0001, t + 4.6); o.connect(g); g.connect(m); g.connect(echo); o.start(t); o.stop(t + 4.8); timers.push(setTimeout(whale, 38000 + Math.random() * 20000)); };
      var apad = function () { var t = a.currentTime + .05, ch = [[261.6, 329.6, 392], [220, 277.2, 329.6], [196, 246.9, 293.7], [233.1, 293.7, 349.2]][pos++ % 4]; ch.forEach(function (f) { var o = a.createOscillator(), g = a.createGain(); o.type = "sine"; o.frequency.value = f; g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.012, t + 3); g.gain.exponentialRampToValueAtTime(0.0001, t + 8); o.connect(g); g.connect(m); o.start(t); o.stop(t + 8.2); }); timers.push(setTimeout(apad, 7000)); };
      timers.push(setTimeout(blub, 1500)); timers.push(setTimeout(whale, 9000)); timers.push(setTimeout(apad, 500));
    } else {
      loopNoise(600, .6, 0.03, 0.13, 0.02, "lowpass"); loopNoise(1800, 1.4, 0.008, 0.09, 0.006);   // sanfte Brandung
      var CH = [[261.6, 329.6, 392, 523.3], [220, 261.6, 329.6, 440], [174.6, 220, 261.6, 349.2], [196, 246.9, 293.7, 392]], ci = 0;
      var strum = function () { var t = a.currentTime + .05, ch = CH[ci++ % 4]; for (var k = 0; k < 4; k++) note(ch[k], t + k * .09, 1.1, "pluck", .035); for (var k2 = 0; k2 < 3; k2++) note(ch[(k2 + 1) % 4] * 2, t + 1.2 + k2 * .3, .8, "pluck", .022); timers.push(setTimeout(strum, 4200 + Math.random() * 1500)); };
      var gulls = function () { var t = a.currentTime + .05, o = a.createOscillator(), g = a.createGain(); o.type = "sine"; o.frequency.setValueAtTime(1500, t); o.frequency.exponentialRampToValueAtTime(900, t + .5); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.012, t + .05); g.gain.exponentialRampToValueAtTime(0.0001, t + .55); o.connect(g); g.connect(m); g.connect(echo); o.start(t); o.stop(t + .6); timers.push(setTimeout(gulls, 14000 + Math.random() * 14000)); };
      timers.push(setTimeout(strum, 1500)); timers.push(setTimeout(gulls, 8000));
    }
    AMB = { m: m, nodes: nodes, timers: timers }; return true;
  }
  function ambientStop() {
    if (!AMB) return; var x = AMB, a = AC(); AMB = null; x.timers.forEach(clearTimeout);
    try { x.m.gain.cancelScheduledValues(a.currentTime); x.m.gain.setValueAtTime(Math.max(0.0001, x.m.gain.value), a.currentTime); x.m.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + 1.2); } catch (e) {}
    setTimeout(function () { x.nodes.forEach(function (n) { try { n.stop(); } catch (e) {} }); try { x.m.disconnect(); } catch (e) {} }, 1400);
  }

  /* ================= Funken (DOM) und Maskottchen ================= */
  function spark(x, y, n, colors) {
    for (var i = 0; i < n; i++) {
      var d = el("i"); d.style.cssText = "position:fixed;left:" + x + "px;top:" + y + "px;width:6px;height:6px;border-radius:50%;pointer-events:none;z-index:9990;background:" + colors[i % colors.length] + ";box-shadow:0 0 8px " + colors[i % colors.length];
      document.body.appendChild(d); var a = Math.random() * 6.283, v = 40 + Math.random() * 90;
      d.animate([{ transform: "translate(0,0) scale(1)", opacity: 1 }, { transform: "translate(" + Math.cos(a) * v + "px," + (Math.sin(a) * v - 40) + "px) scale(.2)", opacity: 0 }], { duration: 650 + Math.random() * 350, easing: "cubic-bezier(.2,.7,.4,1)" }).onfinish = (function (n2) { return function () { n2.remove(); }; })(d);
    }
  }
  function mount(host, id) {   // Maskottchen-Element in der Kopfzeile bekommt sein Bild als CSS-Variable (Faden und Figur übernimmt das Thema-CSS)
    var T = setTheme(id); if (!T || !host) return; host.style.setProperty("--sp", uri(T.mascot(0))); host.setAttribute("data-th", id);
  }

  /* ================= Antipp-Effekte des Maskottchens: pendel, jojo, shoot, rain ================= */
  function tap(id, rect, onEnd, silent) {
    if (running) return false; var T = setTheme(id); if (!T) return false;
    var kinds = ["pendel", "jojo", "shoot", "rain"], k = lastTap; while (k === lastTap) k = kinds[Math.random() * kinds.length | 0]; lastTap = k; running = true;
    var A = art(id), W = global.innerWidth, H = global.innerHeight, dpr = Math.min(2, global.devicePixelRatio || 1), reduce = global.matchMedia && global.matchMedia("(prefers-reduced-motion:reduce)").matches;
    var cv = el("canvas"); cv.width = W * dpr; cv.height = H * dpr; cv.style.cssText = "position:fixed;left:0;top:0;width:100%;height:100%;z-index:9998;touch-action:none"; document.body.appendChild(cv);
    var c = cv.getContext("2d"); c.setTransform(dpr, 0, 0, dpr, 0, 0);
    var px = rect.left + rect.width / 2, L0 = Math.max(50, rect.bottom), DUR = { pendel: 7.6, jojo: 4.6, shoot: 5.4, rain: 5 }[k], t0 = 0, skip = false, done = false, once = {}, extra = [];
    if (reduce) DUR = Math.min(DUR, 3);
    if (!silent) fx(k === "pendel" ? "tap" : k);
    function sp(x, y, sz, rot, f, al, flip, glow) { var im = A.m[f]; if (!im.complete) return; c.save(); c.translate(x, y); c.rotate(rot); c.scale(flip == null ? 1 : flip, 1); c.globalAlpha = al == null ? 1 : al; if (glow) { c.shadowColor = T.glow + ".9)"; c.shadowBlur = glow; } c.drawImage(im, -sz / 2, -sz / 2, sz, sz); c.restore(); c.globalAlpha = 1; }
    function line(x0, y0, x1, y1, w, col, glow) { c.save(); c.strokeStyle = col; c.lineWidth = w; c.lineCap = "round"; if (glow) { c.shadowColor = T.glow + ".9)"; c.shadowBlur = glow; } c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke(); c.restore(); }
    function finish() { if (done) return; done = true; cv.style.transition = "opacity .25s"; cv.style.opacity = "0"; setTimeout(function () { cv.remove(); extra.forEach(function (e) { e.remove(); }); running = false; if (onEnd) onEnd(); }, 300); }
    cv.addEventListener("pointerdown", function () { skip = true; });
    var D = 620, cx = W / 2, cy = H * 0.36, Lm = Math.min(H * 0.55, 380), parts = [], burstDone = false, trail = [];
    function proj(X, Y, Z) { var s = D / (D - Z); return { x: cx + (X - cx) * s, y: cy + (Y - cy) * s, s: s }; }
    function pos(t) { var len = L0 + (Lm - L0) * ease(t / 0.8), amp = (0.2 + 0.9 * ease((t - 0.4) / 3.4)) * (1 - 0.06 * Math.max(0, t - 3.6)), ph = Math.max(0, t - 0.5) * (2.2 + 0.25 * t), th = Math.min(1.05, amp) * (t < 0.5 ? t / 0.5 : 1) * 0.75, pc = px + (cx - px) * ease(t / 1.6); return { X: pc + len * Math.sin(th) * Math.cos(ph) * 0.6, Y: len * Math.cos(th) * 0.9, Z: len * Math.sin(th) * Math.sin(ph) * 1.05, pc: pc }; }
    var TG = [[0, 0.08], [1, 0.08], [0, 0.55], [1, 0.55], [0.5, 0.8], [0.12, 0.8], [0.88, 0.8]].map(function (q) { return { x: q[0] * W, y: 90 + q[1] * (H - 190) }; });
    var Cc = { x: W / 2 + (px - W / 2) * 0.4, y: H * 0.34 }, minis = [];
    if (k === "rain") for (var i = 0; i < 18; i++) minis.push({ x: (i + 0.5) / 18 * W + rnd(-8, 8), d: 0.1 + Math.random() * 0.9, len: 90 + Math.random() * H * 0.55, sz: 22 + Math.random() * 20, ph: Math.random() * 6, rt: 3.1 + Math.random() * 0.5 });
    function strand(x0, y0, x1, y1, p) {   // Strang je Thema: Eisfaden, Lichterkette, Wimpelkette
      var xe = x0 + (x1 - x0) * p, ye = y0 + (y1 - y0) * p; line(x0, y0, xe, ye, id === "winter" ? 2.6 : 2, id === "xmas" ? "#2E7D4F" : id === "spring" ? "#7a5a2e" : "rgba(223,246,255,.95)", id === "winter" ? 12 : 0);
      var n = Math.max(3, Math.round(Math.hypot(x1 - x0, y1 - y0) / (id === "spring" ? 34 : 26)));
      for (var b = 1; b <= n; b++) { var q = b / (n + 1); if (q > p) break; var bx = x0 + (x1 - x0) * q, by = y0 + (y1 - y0) * q + 6;
        if (id === "xmas") { var on = (Math.sin(performance.now() / 160 + b * 1.7) > -0.2); c.save(); c.fillStyle = ["#FF4D79", "#FFD34D", "#7DF0C0", "#6EC8FF"][b % 4]; c.globalAlpha = on ? 1 : 0.35; c.shadowColor = c.fillStyle; c.shadowBlur = on ? 14 : 0; c.beginPath(); c.ellipse(bx, by + 3, 4.5, 7, 0, 0, 6.283); c.fill(); c.restore(); }
        else if (id === "spring") { c.save(); c.fillStyle = ["#FF5E7A", "#FFD23F", "#00D1C1", "#FF9F1C"][b % 4]; c.translate(bx, by); c.rotate(Math.atan2(y1 - y0, x1 - x0)); c.beginPath(); c.moveTo(-9, 0); c.lineTo(9, 0); c.lineTo(0, 17); c.closePath(); c.fill(); c.restore(); }
        else if (id === "aqua") { c.save(); c.strokeStyle = "rgba(220,248,255,.9)"; c.fillStyle = "rgba(190,240,255,.22)"; c.lineWidth = 1.5; c.beginPath(); c.arc(bx + Math.sin(performance.now() / 300 + b) * 3, by - 2, 5 + (b % 3) * 2.2, 0, 6.283); c.fill(); c.stroke(); c.restore(); }
        else { c.save(); c.strokeStyle = "rgba(223,246,255,.9)"; c.lineWidth = 1.4; c.translate(bx, by + 4); for (var a = 0; a < 3; a++) { c.rotate(1.0472); c.beginPath(); c.moveTo(-6, 0); c.lineTo(6, 0); c.stroke(); } c.restore(); } }
    }
    function frame(now) {
      if (done) return; if (!t0) t0 = now; var t = (now - t0) / 1000; c.clearRect(0, 0, W, H);
      if (skip && t < DUR - 0.5) { t0 = now - (DUR - 0.45) * 1000; t = DUR - 0.45; skip = false; }
      var thr = T.thread;
      if (k === "pendel") {
        var T1 = reduce ? 0 : 4.5, T2 = reduce ? 0 : 5.05, END = T2 + 2.5, dark = t < T2 ? Math.min(0.55, t * 0.9) : Math.max(0, 0.55 - (t - T2) * 0.5); c.fillStyle = T.dim + dark + ")"; c.fillRect(0, 0, W, H);
        if (t < T2) {
          var p, sz, rot, w;
          if (t < T1) { w = pos(t); p = proj(w.X, w.Y, w.Z); } else { var kk = ease((t - T1) / (T2 - T1)), w0 = pos(T1), a0 = proj(w0.X, w0.Y, w0.Z), z = w0.Z + (D * 0.9 - w0.Z) * kk * kk; p = { x: a0.x + (cx - a0.x) * kk, y: a0.y + (H * 0.5 - a0.y) * kk, s: D / (D - z) }; }
          sz = 96 * p.s; var pv = proj(t < T1 ? pos(t).pc : cx, 0, 0); rot = t < T1 ? Math.atan2(pv.x - p.x, -(pv.y - p.y)) * 0.6 : 0; trail.push({ x: p.x, y: p.y, s: sz, r: rot }); if (trail.length > 7) trail.shift();
          if (t < T1 + 0.08) line(pv.x, pv.y - 4, p.x + Math.sin(rot) * sz * 0.2, p.y - Math.cos(rot) * sz * 0.4, Math.max(1, 1.6 * Math.min(2.2, p.s)), thr);
          trail.forEach(function (g, i) { if (i < trail.length - 1 && t > 0.8) sp(g.x, g.y, g.s, g.r, 0, 0.05 + 0.03 * i); });
          c.fillStyle = "rgba(0,0,0,.25)"; c.beginPath(); c.ellipse(p.x, H * 0.9, sz * 0.5, sz * 0.12, 0, 0, 6.283); c.fill(); sp(p.x, p.y, sz, rot, (t * 8 | 0) % 2, Math.min(1, 0.3 + p.s * 0.25), 1, 20);
        } else {
          if (!burstDone) { burstDone = true; var n = reduce ? 20 : 70; for (var q = 0; q < n; q++) { var an = Math.random() * 6.283, v = 240 + Math.random() * 620, kind = q % 4 === 0 ? "m" : q % 5 === 0 ? "f" : "s"; parts.push({ k: kind, x: cx, y: H * 0.5, vx: Math.cos(an) * v, vy: Math.sin(an) * v - 260, r: Math.random() * 6.283, vr: rnd(-6, 6), sz: kind === "m" ? rnd(24, 44) : kind === "f" ? rnd(26, 40) : rnd(3, 7), age: 0, life: 1.6 + Math.random() * 1.2, col: T.spark[q % T.spark.length] }); }
            var bx = el("div", "sxBoo", T.boo); document.body.appendChild(bx); extra.push(bx); document.body.classList.add("sxShake"); setTimeout(function () { document.body.classList.remove("sxShake"); }, 650); vib([60, 40, 140]); }
          var f0 = Math.max(0, 1 - (t - T2) * 2.4); if (f0 > 0) { var gr = c.createRadialGradient(cx, H * 0.5, 0, cx, H * 0.5, Math.max(W, H) * 0.8); gr.addColorStop(0, "rgba(255,255,255," + f0 + ")"); gr.addColorStop(0.4, T.glow + f0 * 0.6 + ")"); gr.addColorStop(1, T.glow + "0)"); c.fillStyle = gr; c.fillRect(0, 0, W, H); }
          var dt = 0.016; parts.forEach(function (o) { o.age += dt; if (o.age > o.life) return; o.vy += 900 * dt; o.vx *= 0.985; o.x += o.vx * dt; o.y += o.vy * dt; o.r += o.vr * dt; if (o.y > H - 20 && o.vy > 0) { o.y = H - 20; o.vy *= -0.38; } c.globalAlpha = Math.min(1, (o.life - o.age) * 2.2);
            if (o.k === "s") { c.fillStyle = o.col; c.beginPath(); c.arc(o.x, o.y, o.sz, 0, 6.283); c.fill(); } else if (o.k === "m") { sp(o.x, o.y, o.sz, o.r, 0, c.globalAlpha); } else if (A.flyer.complete) { c.save(); c.translate(o.x, o.y); c.rotate(Math.atan2(o.vy, o.vx) * 0.2); c.drawImage(A.flyer, -o.sz / 2, -o.sz / 2, o.sz, o.sz * (A.flyer.height / A.flyer.width || 0.6)); c.restore(); } });
          c.globalAlpha = 1; if (t > END - 0.4) c.globalAlpha = Math.max(0, (END - t) / 0.4);
        }
      } else if (k === "jojo") {
        var P = 1.05, kj = Math.min(3, t / P | 0), ph = (t % P) / P, amp = [1, 0.82, 0.58, 0.36][kj], Hmax = H * 0.62, y, x = px + (W / 2 - px) * 0.55 * ease(t / 1.2) + Math.sin(t * 2.2) * 6;
        if (t < 4.2) { y = L0 + (Hmax - L0) * amp * Math.pow(Math.sin(Math.PI * ph), 0.7); if (ph > 0.5 && !once[kj]) { once[kj] = 1; spark(x, y, 10, T.spark); vib(22); } } else y = L0 + (Hmax * 0.36 - L0 * 0.36) * Math.max(0, 1 - (t - 4.2) / 0.3) * 0 + L0;
        line(px, 0, x, y - 22, 1.8, thr); c.save(); for (var g = 1; g <= 4; g++) sp(x, y - g * 14 * Math.abs(Math.sin(Math.PI * ph)), 70, 0, 0, 0.18, Math.cos(t * 9)); c.restore(); sp(x, y, 74, 0, (t * 12 | 0) % 2, 1, Math.cos(t * 9), 18);
      } else if (k === "shoot") {
        var e1 = ease(t / 0.8), sx = px + (Cc.x - px) * e1 + Math.sin(t * 3) * 6 * (1 - e1), sy = L0 + (Cc.y - L0) * e1, fade = t > 4.4 ? Math.max(0, 1 - (t - 4.4) / 0.8) : 1;
        if (t < 1.5) line(px, 0, sx, sy - 22, 1.8, thr); c.globalAlpha = fade;
        TG.forEach(function (Tt, i) { var p = ease((t - 0.8 - 0.07 * i) / 0.4); if (p <= 0) return; strand(Cc.x, Cc.y, Tt.x, Tt.y, p); if (p >= 1 && !once["s" + i]) { once["s" + i] = 1; spark(Tt.x, Tt.y, 5, T.spark); } });
        var pts = TG.slice().sort(function (a, b) { return Math.atan2(a.y - Cc.y, a.x - Cc.x) - Math.atan2(b.y - Cc.y, b.x - Cc.x); });
        [0.28, 0.5, 0.72, 0.92].forEach(function (rf, j) { var q = ease((t - 1.5 - 0.25 * j) / 0.5); if (q <= 0) return; c.save(); c.globalAlpha = fade * q; c.strokeStyle = id === "xmas" ? "rgba(255,255,255,.9)" : id === "spring" ? "rgba(255,255,255,.85)" : "rgba(223,246,255,.8)"; c.lineWidth = id === "xmas" ? 3 : 1.6; c.shadowColor = T.glow + ".8)"; c.shadowBlur = 8; c.setLineDash(id === "xmas" ? [10, 8] : id === "spring" ? [2, 7] : []); c.beginPath(); pts.forEach(function (Tt, i) { var X = Cc.x + (Tt.x - Cc.x) * rf, Y = Cc.y + (Tt.y - Cc.y) * rf; if (i === 0) c.moveTo(X, Y); else c.lineTo(X, Y); }); c.stroke(); c.restore(); });
        if (t > 3.0 && t < 4.7) for (var sg = 0; sg < 6; sg++) { var T2b = TG[(sg + (t * 5 | 0)) % TG.length], rr = 0.2 + ((sg * 0.17 + t) % 1) * 0.7; c.fillStyle = "rgba(255,255,255," + (0.5 + 0.5 * Math.sin(t * 20 + sg)) + ")"; c.beginPath(); c.arc(Cc.x + (T2b.x - Cc.x) * rr, Cc.y + (T2b.y - Cc.y) * rr, 2.6, 0, 6.283); c.fill(); }
        c.globalAlpha = 1; var wx, wy; if (t < 1.5) { wx = sx; wy = sy; } else if (t < 4.3) { var ang = t * 1.6, rad = 30 + 40 * Math.abs(Math.sin(t * 0.9)); wx = Cc.x + Math.cos(ang) * rad; wy = Cc.y + Math.sin(ang) * rad * 0.8; } else { var z2 = Math.min(1, (t - 4.3) / 0.5); wx = Cc.x + (px - Cc.x) * ease(z2); wy = Cc.y + (L0 - Cc.y) * ease(z2); line(px, 0, wx, wy - 22, 1.6, thr); }
        sp(wx, wy, 70, 0, (t * 8 | 0) % 2, 1, 1, 16);
      } else {
        c.fillStyle = T.dim + 0.22 * Math.min(1, t / 0.4) * (t > 4.3 ? Math.max(0, 1 - (t - 4.3) / 0.5) : 1) + ")"; c.fillRect(0, 0, W, H);
        minis.forEach(function (m) { var dn = elastic((t - m.d) / 0.8), up = t > m.rt ? ease((t - m.rt) / 0.7) : 0, yy = m.len * dn * (1 - up) + 4; if (t < m.d || yy < 6) return; var xx = m.x + Math.sin(t * 3 + m.ph) * 6 * dn; line(m.x, 0, xx, yy - m.sz * 0.3, 1.3, thr); sp(xx, yy, m.sz * 1.6, Math.sin(t * 3 + m.ph) * 0.25, (t * 9 + m.ph | 0) % 2, 1, 1, 8); });
      }
      if (t >= DUR) { finish(); return; }
      global.requestAnimationFrame(frame);
    }
    global.requestAnimationFrame(frame); return true;
  }

  /* ================= Figur gegen Maskottchen: Zuckerstange (Schwung), Schneeball und Strandball (Wurf) ================= */
  var HIT = { winter: "FLUMP!", xmas: "KLING!", spring: "PLOPP!", aqua: "ZACK!" }, SPLAT = { winter: "FLOCKE!", xmas: "ZUCKERGUSS!", spring: "WASSERBOMBE!", aqua: "PLATSCH!" };
  function cane(c, hand, th, L, ws) {
    c.save(); c.translate(hand.x, hand.y); c.rotate(th); c.shadowColor = "rgba(0,0,0,.4)"; c.shadowBlur = 8; var w = 6.5 * Math.max(0.8, ws * 0.9);
    c.lineCap = "round"; c.lineWidth = w * 2 + 3; c.strokeStyle = "#7a0a22"; c.beginPath(); c.moveTo(0, 6); c.lineTo(0, -L * 0.72); c.arc(-L * 0.16, -L * 0.72, L * 0.16, 0, -Math.PI, true); c.stroke(); c.shadowBlur = 0;
    c.lineWidth = w * 2; c.strokeStyle = "#fff"; c.beginPath(); c.moveTo(0, 6); c.lineTo(0, -L * 0.72); c.arc(-L * 0.16, -L * 0.72, L * 0.16, 0, -Math.PI, true); c.stroke();
    c.strokeStyle = "#E8123C"; c.lineWidth = w * 2; c.setLineDash([9, 14]); c.lineDashOffset = 3; c.beginPath(); c.moveTo(0, 6); c.lineTo(0, -L * 0.72); c.arc(-L * 0.16, -L * 0.72, L * 0.16, 0, -Math.PI, true); c.stroke(); c.setLineDash([]);
    c.strokeStyle = "rgba(255,255,255,.55)"; c.lineWidth = 2; c.beginPath(); c.moveTo(-w * .5, -4); c.lineTo(-w * .5, -L * 0.7); c.stroke(); c.restore();
  }
  function rod(c, hand, th, L, ws) {   // Angelrute: Korkgriff, Rolle, biegsame Spitze, Schnur mit Haken
    c.save(); c.translate(hand.x, hand.y); c.rotate(th); c.lineCap = "round"; c.shadowColor = "rgba(0,0,0,.4)"; c.shadowBlur = 8; var w = Math.max(0.8, ws * 0.9);
    c.strokeStyle = "#7a4a22"; c.lineWidth = 9 * w; c.beginPath(); c.moveTo(0, 8); c.lineTo(0, -L * 0.26); c.stroke(); c.shadowBlur = 0;
    c.strokeStyle = "#C9A06A"; c.lineWidth = 3 * w; for (var k = 0; k < 3; k++) { c.beginPath(); c.moveTo(-4 * w, -k * L * 0.07); c.lineTo(4 * w, -k * L * 0.07 - 4); c.stroke(); }
    c.strokeStyle = "#E0B070"; c.lineWidth = 5 * w; c.beginPath(); c.moveTo(0, -L * 0.26); c.quadraticCurveTo(-L * 0.03, -L * 0.7, -L * 0.2, -L * 1.0); c.stroke();
    c.strokeStyle = "#8a5a2a"; c.lineWidth = 2.2 * w; c.beginPath(); c.moveTo(0, -L * 0.26); c.quadraticCurveTo(-L * 0.03, -L * 0.7, -L * 0.2, -L * 1.0); c.stroke();
    c.fillStyle = "#C9D6DE"; c.strokeStyle = "#5F7381"; c.lineWidth = 1.6; c.beginPath(); c.arc(9 * w, -L * 0.2, 7 * w, 0, 6.283); c.fill(); c.stroke();
    c.strokeStyle = "rgba(240,252,255,.95)"; c.lineWidth = 1.5; c.beginPath(); c.moveTo(-L * 0.2, -L * 1.0); c.quadraticCurveTo(-L * 0.12, -L * 0.75, -L * 0.2, -L * 0.52); c.stroke();
    c.strokeStyle = "#C9D6DE"; c.lineWidth = 2.4; c.beginPath(); c.moveTo(-L * 0.2, -L * 0.52); c.arc(-L * 0.2 + 5, -L * 0.52, 5, Math.PI, Math.PI * 0.2, true); c.stroke(); c.restore();
  }
  function ballDraw(c, id, x, y, r, rot) {
    c.save(); c.translate(x, y); c.rotate(rot);
    if (id === "winter") { var g = c.createRadialGradient(-r * .3, -r * .35, r * .1, 0, 0, r); g.addColorStop(0, "#fff"); g.addColorStop(0.6, "#DDF1FF"); g.addColorStop(1, "#8FC8F0"); c.fillStyle = g; c.shadowColor = "rgba(150,220,255,.9)"; c.shadowBlur = 14; c.beginPath(); c.arc(0, 0, r, 0, 6.283); c.fill(); c.shadowBlur = 0; c.fillStyle = "rgba(120,170,210,.4)"; for (var i = 0; i < 4; i++) { c.beginPath(); c.arc(Math.cos(i * 1.7) * r * .5, Math.sin(i * 1.7) * r * .5, r * .12, 0, 6.283); c.fill(); } }
    else { var cols = ["#FF5E7A", "#FFFFFF", "#FFD23F", "#FFFFFF", "#00D1C1", "#FFFFFF"]; for (var k = 0; k < 6; k++) { c.fillStyle = cols[k]; c.beginPath(); c.moveTo(0, 0); c.arc(0, 0, r, k * 1.0472, (k + 1) * 1.0472); c.closePath(); c.fill(); } var g2 = c.createRadialGradient(-r * .3, -r * .3, r * .05, 0, 0, r); g2.addColorStop(0, "rgba(255,255,255,.65)"); g2.addColorStop(0.5, "rgba(255,255,255,0)"); g2.addColorStop(1, "rgba(0,0,0,.25)"); c.fillStyle = g2; c.beginPath(); c.arc(0, 0, r, 0, 6.283); c.fill(); c.fillStyle = "#fff"; c.beginPath(); c.arc(0, 0, r * .12, 0, 6.283); c.fill(); }
    c.restore();
  }
  function whack(id, figEl, mascotEl, onEnd, silent, onHit) {
    if (running || whacking || !figEl || !mascotEl) return false; var T = setTheme(id); if (!T) return false; whacking = true;
    var A = art(id), W = global.innerWidth, H = global.innerHeight, dpr = Math.min(2, global.devicePixelRatio || 1), fr = figEl.getBoundingClientRect(), sr = mascotEl.getBoundingClientRect();
    var cv = el("canvas"); cv.width = W * dpr; cv.height = H * dpr; cv.style.cssText = "position:fixed;left:0;top:0;width:100%;height:100%;z-index:9996;pointer-events:none"; document.body.appendChild(cv); var c = cv.getContext("2d"); c.setTransform(dpr, 0, 0, dpr, 0, 0);
    var swing = T.tool === "cane" || T.tool === "rod", D = 460, L = 138, DEG = Math.PI / 180, hand = { x: fr.left + fr.width * 0.88, y: fr.top + fr.height * 0.62 }, pivot = { x: sr.left + sr.width / 2, y: 0 };
    var T_WIND = 1.05, T_SW = 1.3, T_HIT = 1.56, PSI_W = -20, PSI_H = 148, PSI_END = 215;
    function tip(psi, yoff) { var r = psi * DEG, z = L * Math.sin(r), sc = D / (D - z); return { x: hand.x + L * Math.cos(r) * sc, y: hand.y + yoff * sc, s: sc }; }
    var TARGET = swing ? tip(PSI_H, -L * 0.2) : { x: Math.max(60, fr.left - 70), y: fr.top + 10 }, S0 = { x: pivot.x, y: Math.max(40, sr.bottom - 18) }, size = 66;
    var MODES = ["weg", "loop", "pinball", "splat"], mode = MODES[Math.random() * 4 | 0]; if (mode === lastMode) mode = MODES[(MODES.indexOf(mode) + 1 + (Math.random() * 3 | 0)) % 4]; lastMode = mode;
    var fl = { x: TARGET.x, y: TARGET.y, vx: -430, vy: -520, z: 0, r: 0, ang: 0, cx: TARGET.x, cy: TARGET.y, n: 0, tr: [], blobs: null }, t0 = 0, last = 0, hit = false, ring = 0, endAt = 0, trail = [], boxes = [];
    setTimeout(function () { figEl.classList.add("sxFigSwing"); setTimeout(function () { figEl.classList.remove("sxFigSwing"); }, 1000); }, T_WIND * 1000 - 60);
    if (!silent) { fx("whoosh", T_SW - 0.05); fx("hit", T_HIT); }
    function done() { cv.remove(); boxes.forEach(function (b) { b.remove(); }); whacking = false; if (onEnd) onEnd(); }
    function sprite(x, y, sz, rot, f, al, glow) { var im = A.m[f]; if (!im.complete) return; c.save(); c.translate(x, y); c.rotate(rot); c.globalAlpha = al; if (glow) { c.shadowColor = T.glow + ".9)"; c.shadowBlur = glow; } c.drawImage(im, -sz / 2, -sz / 2, sz, sz); c.restore(); c.globalAlpha = 1; }
    function flight(tt, dt, tAbs) {
      var f = (tt * 16 | 0) % 2, sc;
      if (mode === "weg") { fl.vy += 260 * dt; fl.x += fl.vx * dt; fl.y += fl.vy * dt; fl.z += 700 * dt; fl.r -= 14 * dt; sc = 1 / (1 + fl.z / 220); if (sc > 0.03) { sprite(fl.x, fl.y, size * 1.5 * sc, fl.r, f, Math.min(1, sc * 3 + 0.3), 16 * sc); c.fillStyle = T.glow + 0.6 * sc + ")"; for (var q = 1; q <= 5; q++) { c.beginPath(); c.arc(fl.x - fl.vx * dt * q * 2, fl.y - fl.vy * dt * q * 2, Math.max(1, 5 * sc - q * 0.6), 0, 6.283); c.fill(); } } else if (!endAt) { endAt = tAbs; spark(fl.x, fl.y, 8, T.spark); } }
      else if (mode === "loop") { fl.ang += 8.5 * dt; fl.cx -= 150 * dt; fl.cy -= 70 * dt; var R = Math.max(0, 95 * (1 - tt / 2.4)); if (tt > 2.0) fl.z += 900 * dt; sc = 1 / (1 + fl.z / 220); var lx = fl.cx + R * Math.cos(fl.ang), ly = fl.cy + R * 0.85 * Math.sin(fl.ang); fl.tr.push({ x: lx, y: ly }); if (fl.tr.length > 14) fl.tr.shift(); for (var i = 0; i < fl.tr.length; i++) { c.fillStyle = T.glow + 0.5 * i / fl.tr.length * sc + ")"; c.beginPath(); c.arc(fl.tr[i].x, fl.tr[i].y, 2 + 4 * i / fl.tr.length, 0, 6.283); c.fill(); } sprite(lx, ly, size * 1.3 * sc, fl.ang + 1.57, f, Math.min(1, sc * 3 + 0.3), 14); if ((sc < 0.04 || lx < -80 || ly < -80) && !endAt) { endAt = tAbs; spark(Math.max(20, lx), Math.max(20, ly), 8, T.spark); } }
      else if (mode === "pinball") { if (!fl.n) { fl.vx = -560; fl.vy = -330; } fl.vy += 220 * dt; fl.x += fl.vx * dt; fl.y += fl.vy * dt; fl.r += (fl.vx > 0 ? 9 : -9) * dt; var he = false; if (fl.x < 30) { fl.x = 30; fl.vx = Math.abs(fl.vx); he = true; } if (fl.x > W - 30) { fl.x = W - 30; fl.vx = -Math.abs(fl.vx); he = true; } if (fl.y < 100) { fl.y = 100; fl.vy = Math.abs(fl.vy) * 0.9; he = true; } if (fl.y > H - 90) { fl.y = H - 90; fl.vy = -Math.abs(fl.vy) * 0.92 - 120; he = true; } if (he) { fl.n++; spark(fl.x, fl.y, 8, T.spark); if (!silent) fx("pop"); vib(18); } if (fl.n >= 4) fl.z += 800 * dt; sc = 1 / (1 + fl.z / 220); fl.tr.push({ x: fl.x, y: fl.y }); if (fl.tr.length > 10) fl.tr.shift(); for (var j = 0; j < fl.tr.length; j++) { c.fillStyle = T.glow + 0.4 * j / fl.tr.length * sc + ")"; c.beginPath(); c.arc(fl.tr[j].x, fl.tr[j].y, 3 + 5 * j / fl.tr.length, 0, 6.283); c.fill(); } sprite(fl.x, fl.y, size * 1.15 * sc, fl.r, f, Math.min(1, sc * 3 + 0.3), 14); if ((sc < 0.04 || tt > 5) && !endAt) { endAt = tAbs; spark(fl.x, fl.y, 8, T.spark); } }
      else { var TT = 0.85, k = Math.min(1, tt / TT), e = k * k; fl.x = TARGET.x + (W / 2 - TARGET.x) * e; fl.y = TARGET.y + (H * 0.42 - TARGET.y) * e;
        if (tt < TT) sprite(fl.x, fl.y, size * (1 + 4.3 * e), tt * 6, f, 1, 20);
        else { if (!fl.blobs) { fl.blobs = []; for (var b = 0; b < 16; b++) { var an = Math.random() * 6.283, d = Math.random() * 95; fl.blobs.push({ x: Math.cos(an) * d, y: Math.sin(an) * d * 0.8, r: 8 + Math.random() * 34, c: T.splat[b % T.splat.length] }); } for (var r2 = 0; r2 < 9; r2++) fl.blobs.push({ x: (Math.random() - .5) * 140, y: 0, r: 4 + Math.random() * 5, drip: 40 + Math.random() * 120, c: T.splat[r2 % T.splat.length] });
            var bx = el("div", "sxBoo sxKrack", SPLAT[id]); bx.style.left = "50%"; bx.style.top = "30%"; document.body.appendChild(bx); boxes.push(bx); spark(fl.x, fl.y, 16, T.splat); if (!silent) fx("splat"); document.body.classList.add("sxShake2"); setTimeout(function () { document.body.classList.remove("sxShake2"); }, 320); vib([50, 20, 80]); }
          var kk = tt - TT, fade = kk > 1.4 ? Math.max(0, 1 - (kk - 1.4) / 0.6) : 1; c.save(); c.globalAlpha = 0.92 * fade; fl.blobs.forEach(function (o) { var yy = o.drip ? o.y + Math.min(o.drip, kk * 90) : o.y; c.fillStyle = o.c; c.beginPath(); c.arc(fl.x + o.x, fl.y + yy, o.r, 0, 6.283); c.fill(); if (o.drip) c.fillRect(fl.x + o.x - o.r * 0.45, fl.y, o.r * 0.9, yy); }); c.restore(); sprite(fl.x, fl.y + 6, size * 1.1, 0.2, 0, 0.9 * fade, 0); if (kk > 2.0) return true; } }
      return !!(endAt && tAbs - endAt > 0.4);
    }
    function frame(now) {
      if (!t0) { t0 = now; last = now; } var t = (now - t0) / 1000, dt = Math.min(0.05, (now - last) / 1000); last = now; c.clearRect(0, 0, W, H);
      if (t < T_HIT) { var ks = Math.min(1, t / T_HIT), es = ks * ks * (3 - 2 * ks), sx = S0.x + (TARGET.x - S0.x) * es + Math.sin(t * 2.6) * 7 * (1 - es * 0.8), sy = S0.y + (TARGET.y - S0.y) * es; c.strokeStyle = T.thread; c.lineWidth = 1.6; c.beginPath(); c.moveTo(pivot.x, pivot.y); c.lineTo(sx, sy - size * 0.3); c.stroke(); sprite(sx, sy, size, Math.sin(t * 3) * 0.1, (t * 5 | 0) % 2, 1, 14); }
      else { if (!hit) { hit = true; ring = t; var b = el("div", "sxBoo sxKrack", HIT[id]); b.style.left = Math.max(80, TARGET.x) + "px"; b.style.top = Math.max(90, TARGET.y - 10) + "px"; document.body.appendChild(b); boxes.push(b); setTimeout(function () { b.remove(); }, 1300); spark(TARGET.x, TARGET.y, 18, T.spark); document.body.classList.add("sxShake2"); setTimeout(function () { document.body.classList.remove("sxShake2"); }, 320); vib([40, 30, 60]); try { if (onHit) onHit(mode); } catch (e) {} }
        var rk = (t - ring) / 0.42; if (rk < 1) { c.strokeStyle = "rgba(255,255,255," + (1 - rk) + ")"; c.lineWidth = 6 * (1 - rk) + 1; c.beginPath(); c.arc(TARGET.x, TARGET.y, 8 + 120 * rk, 0, 6.283); c.stroke(); }
        if (flight(t - T_HIT, dt, t)) { done(); return; } }
      if (swing) { var psi = null, yoff = -L * 0.5; if (t >= T_WIND) { if (t < T_SW) { var kw = (t - T_WIND) / (T_SW - T_WIND); psi = 28 + (PSI_W - 28) * ease(kw); yoff = -L * (0.62 - 0.08 * kw); } else if (t < T_HIT) { var k2 = (t - T_SW) / (T_HIT - T_SW); psi = PSI_W + (PSI_H - PSI_W) * (k2 * k2 * (1.6 - 0.6 * k2)); yoff = -L * (0.54 - 0.34 * k2); } else { var kt = Math.min(1, (t - T_HIT) / 0.3); psi = PSI_H + (PSI_END - PSI_H) * (1 - Math.pow(1 - kt, 2)); yoff = -L * (0.2 + 0.1 * kt); } }
        if (psi != null) { var tp = tip(psi, yoff), dx = tp.x - hand.x, dy = tp.y - hand.y, len = Math.max(26, Math.hypot(dx, dy)), th = Math.atan2(dx, -dy), al = t > T_HIT + 0.5 ? Math.max(0, 1 - (t - T_HIT - 0.5) / 0.3) : 1; trail.push({ x: tp.x, y: tp.y, s: tp.s, t: t }); while (trail.length && t - trail[0].t > 0.14) trail.shift();
          if (t >= T_SW && trail.length > 1) { c.save(); c.lineCap = "round"; for (var i = 1; i < trail.length; i++) { c.strokeStyle = "rgba(255,255,255," + 0.5 * i / trail.length + ")"; c.lineWidth = 5 + 14 * tp.s * i / trail.length; c.beginPath(); c.moveTo(trail[i - 1].x, trail[i - 1].y); c.lineTo(trail[i].x, trail[i].y); c.stroke(); } c.restore(); }
          c.globalAlpha = al; (T.tool === "rod" ? rod : cane)(c, hand, th, len, tp.s); c.globalAlpha = 1; } }
      else if (t > 0.95 && t < T_HIT + 0.05) { var kp = Math.min(1, (t - 0.95) / (T_HIT - 0.95)), bx2 = hand.x + (TARGET.x - hand.x) * kp, by2 = hand.y + (TARGET.y - hand.y) * kp - Math.sin(Math.PI * kp) * 110, rr = 14 + 12 * Math.sin(Math.PI * kp); c.strokeStyle = "rgba(255,255,255,.35)"; c.lineWidth = 4; c.beginPath(); for (var s = 0; s <= 8; s++) { var q = Math.max(0, kp - s * 0.03); c.lineTo(hand.x + (TARGET.x - hand.x) * q, hand.y + (TARGET.y - hand.y) * q - Math.sin(Math.PI * q) * 110); } c.stroke(); ballDraw(c, id, bx2, by2, rr, t * 12); }
      if (t > 7) { done(); return; } global.requestAnimationFrame(frame);
    }
    global.requestAnimationFrame(frame); return true;
  }

  /* ================= Startseite: 3D-Szene, Flieger, Wetter ================= */
  var ART_STAR = "<svg viewBox='0 0 40 40'><path d='M20 2l5.4 12.6L39 15.4l-10.4 8.9L31.8 38 20 30.8 8.2 38l3.2-13.7L1 15.4l13.6-.8z' fill='#FF8A2B' stroke='#9C3A08' stroke-width='1.6' stroke-linejoin='round'/><g fill='#FFD27A'><circle cx='20' cy='11' r='1.6'/><circle cx='20' cy='20' r='2'/><circle cx='11' cy='17' r='1.4'/><circle cx='29' cy='17' r='1.4'/><circle cx='14' cy='29' r='1.4'/><circle cx='26' cy='29' r='1.4'/></g></svg>";
  var ART_SHELL = "<svg viewBox='0 0 50 36'><path d='M25 3C10 3 1 14 3 32H47C49 14 40 3 25 3Z' fill='#FFB8D2' stroke='#B8446E' stroke-width='1.8'/><path d='M25 4V32M14 8L11 32M36 8L39 32M7 17L5 32M43 17L45 32' stroke='#E27AA3' stroke-width='1.6' fill='none'/><path d='M12 12Q22 5 32 8' stroke='#fff' stroke-width='2' fill='none' opacity='.6' stroke-linecap='round'/></svg>";
  var ART_CRAB = "<svg viewBox='0 0 50 34'><g stroke='#9E1B1B' stroke-width='2' fill='none' stroke-linecap='round'><path d='M10 24L2 30M13 27L7 33M40 24L48 30M37 27L43 33'/></g><ellipse cx='25' cy='21' rx='15' ry='10' fill='#FF4D4D' stroke='#9E1B1B' stroke-width='1.8'/><path d='M12 14C3 12 1 3 8 3C13 3 14 9 15 12Z' fill='#FF6B6B' stroke='#9E1B1B' stroke-width='1.6'/><path d='M38 14C47 12 49 3 42 3C37 3 36 9 35 12Z' fill='#FF6B6B' stroke='#9E1B1B' stroke-width='1.6'/><path d='M19 12V7M31 12V7' stroke='#9E1B1B' stroke-width='2'/><circle cx='19' cy='6' r='3.2' fill='#fff' stroke='#9E1B1B' stroke-width='1.2'/><circle cx='31' cy='6' r='3.2' fill='#fff' stroke='#9E1B1B' stroke-width='1.2'/><circle cx='19.6' cy='6.4' r='1.4' fill='#111'/><circle cx='31.6' cy='6.4' r='1.4' fill='#111'/><path d='M21 23Q25 26 29 23' stroke='#9E1B1B' stroke-width='1.6' fill='none'/></svg>";
  var ART_CORAL = "<svg viewBox='0 0 44 54'><g fill='none' stroke-linecap='round'><path d='M22 54V30M22 40L10 28V16M22 34L34 22V10M10 28L4 22M34 22L40 16M22 30V12' stroke='#B8325F' stroke-width='9'/><path d='M22 54V30M22 40L10 28V16M22 34L34 22V10M10 28L4 22M34 22L40 16M22 30V12' stroke='#FF6FA0' stroke-width='5.4'/></g><g fill='#FFC2D6'><circle cx='10' cy='15' r='3'/><circle cx='34' cy='9' r='3'/><circle cx='22' cy='11' r='3'/><circle cx='4' cy='21' r='2.4'/><circle cx='40' cy='15' r='2.4'/></g></svg>";
  var ART_CORAL2 = "<svg viewBox='0 0 40 48'><path d='M6 48C4 30 8 14 12 6C16 18 14 32 18 48ZM18 48C18 34 22 20 28 10C32 22 28 36 34 48Z' fill='#A06BFF' stroke='#5B2FA8' stroke-width='1.8' stroke-linejoin='round'/><g fill='#D7C0FF'><circle cx='12' cy='14' r='2.4'/><circle cx='28' cy='18' r='2.4'/><circle cx='11' cy='28' r='2'/><circle cx='27' cy='32' r='2'/></g></svg>";
  var SC = null, FL = null, WX = null;
  function puff(x, y, cols, n) { spark(x, y, n || 12, cols); }
  function buildScene(id, navH) {
    var W = global.innerWidth, root = el("div", "sx3 sx3-" + id); root.id = "sxScene"; root.style.bottom = navH + "px"; root.appendChild(el("div", "sx3g"));
    function put(cls, x, size, kind, html, extra) { var o = el("div", cls, html); o.style.cssText = "left:" + (x * W - size[0] / 2) + "px;--w:" + size[0] + "px;--h:" + size[1] + "px;" + (extra || ""); o.setAttribute("data-k", kind); root.appendChild(o); return o; }
    if (id === "winter") {
      var cr = uri(snowflake(0));
      [[0.08, 44, 70], [0.3, 38, 58], [0.72, 46, 74], [0.93, 36, 56]].forEach(function (q, i) { put("sxp", q[0], [q[1], q[2]], "tree", "<b></b><b></b><b></b><b></b><u></u>", "--z:" + (i % 2 ? -40 : 20) + "px;--dl:" + (-i * 1.1) + "s"); });
      put("sxs", 0.52, [40, 64], "snow", "<i class='sb b3'></i><i class='sb b2'></i><i class='sb b1'></i><u></u><em></em><b></b><s></s>", "--dl:-.5s");
      [[0.2, 34], [0.62, 44], [0.85, 30]].forEach(function (q, i) { put("sxc", q[0], [q[1], q[1]], "crystal", "<i></i><i></i><i></i>", "--cr:" + cr + ";--dl:" + (-i * 1.7) + "s"); });
    } else if (id === "xmas") {
      put("sxt", 0.14, [60, 86], "tree", "<b></b><b></b><b></b><b></b><s></s><u><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i></u>", "--dl:-.4s");
      var gc = [["#FF4D79", "#FFFFFF"], ["#2E9E63", "#FFD34D"], ["#6EC8FF", "#E8123C"], ["#FFD34D", "#E8123C"]];
      [[0.34, 34, 0], [0.5, 40, 1], [0.78, 32, 2], [0.9, 28, 3]].forEach(function (q, i) { var g = put("sxg", q[0], [q[1], q[1] * 0.86], "gift", "<div class='cb'><f class='fr'></f><f class='bk'></f><f class='lf'></f><f class='rt'></f><f class='tp'></f></div><div class='ld'></div>", "--c1:" + gc[q[2]][0] + ";--c2:" + gc[q[2]][1] + ";--dl:" + (-i * 1.3) + "s"); });
      [[0.62, 28], [0.7, 26]].forEach(function (q, i) { put("sxm", q[0], [q[1], q[1] * 1.15], "ginger", "<svg viewBox='0 0 40 46'><path d='M20 3a7 7 0 1 1 0 14a7 7 0 0 1 0-14zM13 18h14l9-5l3 5l-9 8l2 16h-7l-5-12l-5 12h-7l2-16l-9-8l3-5z' fill='#B9712F' stroke='#7a4a1e' stroke-width='1.6' stroke-linejoin='round'/><circle cx='17' cy='9' r='1.4' fill='#fff'/><circle cx='23' cy='9' r='1.4' fill='#fff'/><path d='M17 13q3 2 6 0' stroke='#fff' stroke-width='1.2' fill='none'/><circle cx='20' cy='22' r='2' fill='#E8123C'/><circle cx='20' cy='29' r='2' fill='#2E9E63'/><path d='M6 14l5 3M34 14l-5 3' stroke='#fff' stroke-width='1.6'/></svg>", "--dl:" + (-i * 0.8) + "s"); });
      [[0.04, 20], [0.97, 20]].forEach(function (q) { put("sxk", q[0], [q[1], 56], "cane", "<svg viewBox='0 0 20 56'><path d='M4 56V18a7 7 0 0 1 14 0' fill='none' stroke='#7a0a22' stroke-width='8.4' stroke-linecap='round'/><path d='M4 56V18a7 7 0 0 1 14 0' fill='none' stroke='#fff' stroke-width='6.4' stroke-linecap='round'/><path d='M4 56V18a7 7 0 0 1 14 0' fill='none' stroke='#E8123C' stroke-width='6.4' stroke-dasharray='5 6' stroke-linecap='butt'/></svg>"); });
    } else if (id === "aqua") {
      var blade = "<b></b><b></b><b></b><b></b>";
      [[0.05, 34, 78], [0.27, 28, 60], [0.9, 36, 84], [0.69, 26, 56]].forEach(function (q, i) { put("sxwd", q[0], [q[1], q[2]], "weed", blade, "--dl:" + (-i * 1.3) + "s;--z:" + (i % 2 ? -30 : 16) + "px"); });
      put("sxco", 0.15, [44, 54], "coral", ART_CORAL, "--dl:-.7s");
      put("sxco", 0.8, [40, 48], "coral", ART_CORAL2, "--dl:-1.9s");
      put("sxst", 0.4, [34, 34], "star", ART_STAR, "--dl:-.4s");
      put("sxst", 0.95, [26, 26], "star", ART_STAR, "--dl:-2.1s;--sc:.8");
      put("sxcl", 0.55, [42, 36], "clam", "<div class='sh bs'>" + ART_SHELL + "</div><i class='pe'></i><div class='sh lid'>" + ART_SHELL + "</div>", "--dl:-1s");
      put("sxcr", 0.28, [40, 28], "crab", "<div class='cw'>" + ART_CRAB + "</div>", "--dl:-3s");
      put("sxch", 0.7, [44, 34], "chest", "<div class='bx'></div><div class='ld2'></div><i class='gl'></i>", "--dl:-.2s");
    } else {
      [[0.1, 56, 96], [0.9, 50, 90]].forEach(function (q, i) { var lv = ""; for (var k = 0; k < 7; k++) lv += "<b style='--i:" + k + "'></b>"; put("sxl", q[0], [q[1], q[2]], "palm", "<div class='pt'><i></i><i></i><i></i><i></i><i></i></div><div class='lv'>" + lv + "</div><s></s><s></s>", "--dl:" + (-i * 1.5) + "s"); });
      [[0.3, 30], [0.52, 40], [0.74, 26]].forEach(function (q, i) { var r = ""; for (var k = 0; k < 6; k++) r += "<i class='rib' style='--i:" + k + "'></i>"; put("sxb", q[0], [q[1], q[1]], "ball", "<div class='bb'>" + r + "</div><span class='bs'></span>", "--dl:" + (-i * 1.2) + "s"); });
      put("sxf", 0.64, [46, 50], "flamingo", "<svg viewBox='0 0 46 50'><ellipse cx='23' cy='42' rx='20' ry='7' fill='#00D1C1' stroke='#009E92' stroke-width='2'/><ellipse cx='23' cy='40' rx='12' ry='3.5' fill='#7DE8FF'/><path d='M26 38C14 36 10 24 18 18C24 14 30 18 28 24C34 14 32 6 26 6C22 6 20 9 22 12' fill='none' stroke='#FF7AA8' stroke-width='5' stroke-linecap='round'/><circle cx='22' cy='8' r='4' fill='#FF7AA8'/><path d='M18 8l-6 3l6 1z' fill='#222'/><circle cx='23' cy='7' r='1' fill='#222'/><path d='M30 24c6 2 8 8 4 12c-4 2-8-2-6-6z' fill='#FF9EC1'/></svg>");
      put("sxw", 0.42, [16, 58], "board", "<i></i>", "--dl:-.9s");
    }
    document.body.appendChild(root);
    root.addEventListener("pointerdown", function (e) {
      var o = e.target.closest("[data-k]"); if (!o) return; var r = o.getBoundingClientRect(), k = o.getAttribute("data-k"), x = r.left + r.width / 2, y = r.top + r.height * 0.35;
      if (o.classList.contains("act")) return; o.classList.add("act"); setTimeout(function () { o.classList.remove("act"); }, k === "gift" ? 1300 : 1000);
      var C = THEMES[id].spark;
      if (k === "tree" && id === "winter") { puff(x, y, ["#fff", "#DFF6FF"], 16); fx("pop"); }
      else if (k === "tree") { puff(x, y, C, 16); fx("chime"); }
      else if (k === "snow") { puff(x, y, ["#fff", "#FF9F1C"], 10); fx("boing"); }
      else if (k === "crystal") { puff(x, y, C, 14); fx("chime"); }
      else if (k === "gift") { puff(x, y, C.concat(["#FF8FB8"]), 22); fx("pop"); setTimeout(function () { fx("chime"); }, 180); }
      else if (k === "ginger") { puff(x, y, ["#fff", "#E8123C", "#FFD34D"], 10); fx("boing"); }
      else if (k === "cane") { puff(x, y, ["#fff", "#E8123C"], 10); fx("chime"); }
      else if (k === "palm") { puff(x, y - 30, ["#7DE86A", "#2E9E63"], 10); fx("pop"); coconut(x, y); }
      else if (k === "ball") { puff(x, y, C, 14); fx("boing"); }
      else if (k === "weed") { bubbles(x, y, 9); puff(x, y, ["#7DF0C0", "#BFF4FF"], 8); fx("pop"); }
      else if (k === "star") { puff(x, y, ["#FFB25C", "#FF7A1A", "#fff"], 12); fx("boing"); }
      else if (k === "clam") { puff(x, y, ["#fff", "#FFD6E8", "#BFF4FF"], 16); bubbles(x, y, 5); fx("chime"); }
      else if (k === "crab") { puff(x, y, ["#FF5E5E", "#fff"], 10); fx("pop"); }
      else if (k === "coral") { bubbles(x, y, 6); puff(x, y, ["#FF7AA8", "#FFB25C"], 10); fx("chime"); }
      else if (k === "chest") { puff(x, y - 10, ["#FFD34D", "#FFF3B0", "#fff"], 24); bubbles(x, y, 8); fx("pop"); setTimeout(function () { fx("chime"); }, 150); }
      else if (k === "flamingo") { puff(x, y, ["#7DE8FF", "#fff", "#00D1C1"], 18); fx("pop"); }
      else { puff(x, y, C, 8); fx("pop"); }
    });
    return root;
  }
  function bubbles(x, y, n) {   // Luftblasen steigen auf und platzen
    for (var i = 0; i < n; i++) {
      var b = el("i"), r = rnd(4, 11); b.style.cssText = "position:fixed;left:" + (x + rnd(-14, 14)) + "px;top:" + y + "px;width:" + r * 2 + "px;height:" + r * 2 + "px;border-radius:50%;pointer-events:none;z-index:9990;border:1.5px solid rgba(230,250,255,.9);background:radial-gradient(circle at 32% 30%,rgba(255,255,255,.85) 0 14%,rgba(190,240,255,.18) 40%,rgba(120,210,255,.08))";
      document.body.appendChild(b); var dx = rnd(-26, 26), dy = -rnd(90, 220);
      b.animate([{ transform: "translate(0,0) scale(.6)", opacity: 0 }, { opacity: 1, offset: .12 }, { transform: "translate(" + dx * .5 + "px," + dy * .6 + "px) scale(1)", opacity: .95, offset: .75 }, { transform: "translate(" + dx + "px," + dy + "px) scale(1.5)", opacity: 0 }], { duration: 1200 + Math.random() * 900, delay: i * 70, easing: "ease-out", fill: "backwards" }).onfinish = function () { this.effect.target.remove(); };
    }
  }
  function coconut(x, y) { var c = el("i"); c.style.cssText = "position:fixed;left:" + x + "px;top:" + y + "px;width:14px;height:14px;border-radius:50%;background:radial-gradient(circle at 35% 30%,#9A6B3A,#4A2F14);z-index:9990;pointer-events:none"; document.body.appendChild(c); c.animate([{ transform: "translateY(0)" }, { transform: "translateY(" + (global.innerHeight - y - 120) + "px)", offset: 0.5, easing: "ease-in" }, { transform: "translateY(" + (global.innerHeight - y - 150) + "px) translateX(14px)", offset: 0.68 }, { transform: "translateY(" + (global.innerHeight - y - 120) + "px) translateX(26px)", offset: 0.85 }, { transform: "translateY(" + (global.innerHeight - y - 128) + "px) translateX(30px)", opacity: 0 }], { duration: 1500 }).onfinish = function () { c.remove(); }; }
  function buildFlyers(id) {
    var lay = el("div", "sxFl"); lay.id = "sxFlyers"; document.body.appendChild(lay); var W = global.innerWidth, H = global.innerHeight, alive = true, timers = [], T = THEMES[id], N = id === "xmas" ? 1 : id === "aqua" ? 6 : 4;
    function mk(i) {
      var b = el("div", "sxf-" + id), svg = T.flyer(); b.innerHTML = "<div class='bd'>" + svg + "</div>"; lay.appendChild(b); var anim = null;
      function fly() {
        if (!alive) return; var dir = Math.random() < 0.5 ? 1 : -1, y0 = 70 + Math.random() * H * 0.4, dur = (id === "xmas" ? 16000 : id === "aqua" ? 10000 : 8000) + Math.random() * 6000, kf = [];
        for (var k = 0; k <= 8; k++) { var f = k / 8, x = dir > 0 ? -90 + (W + 180) * f : W + 90 - (W + 180) * f, z = 330 * Math.sin(f * 6.283 * 1.1 + i) - 40, y = y0 + 34 * Math.sin(f * 14 + i) + 50 * Math.sin(f * 4.2); kf.push({ transform: "translate3d(" + x + "px," + y + "px," + z + "px) rotateY(" + (dir > 0 ? 0 : 180) + "deg) rotateZ(" + 8 * Math.sin(f * 14) + "deg)", offset: f }); }
        anim = b.animate(kf, { duration: dur, easing: "linear" }); anim.onfinish = function () { if (alive) timers.push(setTimeout(fly, id === "xmas" ? 9000 + Math.random() * 12000 : 500 + Math.random() * 2500)); };
      }
      b.addEventListener("pointerdown", function (e) {
        if (b.classList.contains("zap")) return; e.preventDefault(); var r = b.getBoundingClientRect(); b.classList.add("zap"); if (anim) anim.pause(); spark(r.left + r.width / 2, r.top + r.height / 2, 12, T.spark); if (id === "xmas") { for (var g = 0; g < 4; g++) setTimeout(function () { spark(r.left + r.width / 2 + rnd(-30, 30), r.top + r.height / 2 + 10, 8, ["#FF4D79", "#FFD34D", "#7DF0C0"]); }, g * 120); } fx(id === "xmas" ? "chime" : "pop");
        var cur = getComputedStyle(b).transform; b.animate([{ transform: cur, opacity: 1 }, { transform: cur + " rotateZ(" + (id === "xmas" ? 20 : 720) + "deg) scale(1.6)", opacity: 1, offset: .4 }, { transform: cur + " rotateZ(" + (id === "xmas" ? 40 : 1440) + "deg) scale(.1) translateY(260px)", opacity: 0 }], { duration: 900, easing: "ease-in" }).onfinish = function () { b.style.visibility = "hidden"; timers.push(setTimeout(function () { b.style.visibility = ""; b.classList.remove("zap"); fly(); }, 2500)); };
      });
      timers.push(setTimeout(fly, i * 1500 + (id === "xmas" ? 4000 : 0)));
    }
    for (var i = 0; i < N; i++) mk(i);
    return { stop: function () { alive = false; timers.forEach(clearTimeout); lay.remove(); } };
  }
  function home(id, on) {
    if (on && SC && SC.id !== id) home(SC.id, false);
    if (on && !SC && THEMES[id]) { var nav = document.getElementById("tabs"); setTheme(id); SC = { id: id, root: buildScene(id, nav ? nav.offsetHeight : 56), fl: buildFlyers(id) }; }
    else if (!on && SC) { SC.root.remove(); SC.fl.stop(); SC = null; }
  }
  /* Wetter-Ebene auf allen Seiten (nicht in Lernrunden): Schneefall in 3 Tiefen, Zuckerstreusel und Sterne, Seifenblasen und Blütenblätter */
  function weather(id, on) {
    if (!on || !THEMES[id]) { if (WX) { WX.stop(); WX = null; } return; } if (WX && WX.id === id) return; if (WX) { WX.stop(); WX = null; }
    if (global.matchMedia && global.matchMedia("(prefers-reduced-motion:reduce)").matches) return;
    var W = global.innerWidth, H = global.innerHeight, dpr = Math.min(2, global.devicePixelRatio || 1), cv = el("canvas"); cv.id = "sxWeather"; cv.width = W * dpr; cv.height = H * dpr; cv.style.cssText = "position:fixed;left:0;top:0;width:100%;height:100%;pointer-events:none;z-index:7"; document.body.appendChild(cv);
    var c = cv.getContext("2d"); c.setTransform(dpr, 0, 0, dpr, 0, 0); var N = id === "winter" ? 110 : id === "xmas" ? 46 : id === "aqua" ? 44 : 28, P = [], stop = false, t0 = 0, raf = 0;
    for (var i = 0; i < N; i++) P.push({ x: Math.random() * W, y: Math.random() * H, z: Math.random(), ph: Math.random() * 6.28, c: Math.random(), r: Math.random() * 6.28 });
    var COL = ["#FF4D79", "#FFD34D", "#7DF0C0", "#6EC8FF", "#fff", "#FF8FB8"];
    function loop(now) {
      if (stop) return; if (!t0) t0 = now; var t = (now - t0) / 1000; c.clearRect(0, 0, W, H); var gust = Math.sin(t * 0.3) * 0.5 + Math.sin(t * 0.77) * 0.3;
      P.forEach(function (p) {
        if (id === "winter") { var sp = 22 + p.z * 70, r = 1 + p.z * p.z * 4.6; p.y += sp * 0.016; p.x += (Math.sin(t * 0.8 + p.ph) * 10 + gust * 30 * (0.3 + p.z)) * 0.016; if (p.y > H + 8) { p.y = -8; p.x = Math.random() * W; } if (p.x > W + 8) p.x = -8; if (p.x < -8) p.x = W + 8;
          c.globalAlpha = 0.35 + p.z * 0.6; c.fillStyle = "#fff"; if (p.z > 0.85) { c.shadowColor = "rgba(190,235,255,.9)"; c.shadowBlur = 10; } c.beginPath(); c.arc(p.x, p.y, r, 0, 6.283); c.fill(); c.shadowBlur = 0; }
        else if (id === "xmas") { var sp2 = 16 + p.z * 40; p.y += sp2 * 0.016; p.x += Math.sin(t * 0.7 + p.ph) * 0.3; p.r += 0.02; if (p.y > H + 10) { p.y = -10; p.x = Math.random() * W; }
          if (p.c < 0.22) { var tw = 0.5 + 0.5 * Math.sin(t * 3 + p.ph * 3), sz = 5 + 6 * p.z; c.globalAlpha = tw * 0.9; c.fillStyle = "#FFE680"; c.shadowColor = "#FFD34D"; c.shadowBlur = 10; c.beginPath(); c.moveTo(p.x, p.y - sz); c.lineTo(p.x + sz * .22, p.y - sz * .22); c.lineTo(p.x + sz, p.y); c.lineTo(p.x + sz * .22, p.y + sz * .22); c.lineTo(p.x, p.y + sz); c.lineTo(p.x - sz * .22, p.y + sz * .22); c.lineTo(p.x - sz, p.y); c.lineTo(p.x - sz * .22, p.y - sz * .22); c.closePath(); c.fill(); c.shadowBlur = 0; }
          else { c.globalAlpha = 0.85; c.save(); c.translate(p.x, p.y); c.rotate(p.r); c.fillStyle = COL[(p.c * 100 | 0) % COL.length]; c.beginPath(); c.roundRect ? c.roundRect(-5, -2, 10, 4, 2) : c.rect(-5, -2, 10, 4); c.fill(); c.restore(); } }
        else if (id === "aqua") {
          if (p.c < 0.78) { p.y -= (16 + p.z * 46) * 0.016; p.x += Math.sin(t * 1.3 + p.ph) * 0.35; if (p.y < -24) { p.y = H + 14; p.x = Math.random() * W; } var ar = 2.5 + p.z * p.z * 9 + p.c * 2; c.globalAlpha = 0.28 + p.z * 0.5; c.strokeStyle = "rgba(220,248,255,.95)"; c.lineWidth = 1.2; c.fillStyle = "rgba(170,230,255,.10)"; c.beginPath(); c.arc(p.x, p.y, ar, 0, 6.283); c.fill(); c.stroke(); c.fillStyle = "rgba(255,255,255,.85)"; c.beginPath(); c.arc(p.x - ar * 0.36, p.y - ar * 0.36, Math.max(0.8, ar * 0.2), 0, 6.283); c.fill(); }
          else { p.y -= (3 + p.z * 6) * 0.016; p.x += Math.sin(t * 0.5 + p.ph) * 0.25; if (p.y < -6) { p.y = H + 6; p.x = Math.random() * W; } c.globalAlpha = 0.25 + 0.25 * Math.sin(t * 1.6 + p.ph); c.fillStyle = "#E8FBFF"; c.beginPath(); c.arc(p.x, p.y, 0.9 + p.z, 0, 6.283); c.fill(); } }
        else { if (p.c < 0.6) { p.y -= (12 + p.z * 28) * 0.016; p.x += Math.sin(t * 1.1 + p.ph) * 0.4; if (p.y < -20) { p.y = H + 10; p.x = Math.random() * W; } var br = 5 + p.z * 11; c.globalAlpha = 0.55; c.strokeStyle = "rgba(255,255,255,.9)"; c.lineWidth = 1.4; c.fillStyle = "rgba(190,240,255,.18)"; c.beginPath(); c.arc(p.x, p.y, br, 0, 6.283); c.fill(); c.stroke(); c.fillStyle = "rgba(255,255,255,.9)"; c.beginPath(); c.arc(p.x - br * .35, p.y - br * .35, br * .2, 0, 6.283); c.fill(); }
          else { p.y += (14 + p.z * 24) * 0.016; p.x += Math.sin(t * 0.9 + p.ph) * 0.8 + gust * 0.4; p.r += 0.03; if (p.y > H + 10) { p.y = -10; p.x = Math.random() * W; } c.globalAlpha = 0.85; c.save(); c.translate(p.x, p.y); c.rotate(p.r); c.fillStyle = p.c < 0.8 ? "#FF9EC1" : "#FFD23F"; c.beginPath(); c.ellipse(0, 0, 6, 3.2, 0, 0, 6.283); c.fill(); c.restore(); } }
      });
      c.globalAlpha = 1; raf = global.requestAnimationFrame(loop);
    }
    raf = global.requestAnimationFrame(loop); WX = { id: id, stop: function () { stop = true; global.cancelAnimationFrame(raf); cv.remove(); } };
  }

  global.VTS2 = {
    themes: function () { return THEMES; }, theme: function (id) { return THEMES[id] || null; }, mount: mount, tap: tap, whack: whack, home: home, weather: weather,
    ambientStart: ambientStart, ambientStop: ambientStop, ambientOn: function () { return !!AMB; }, busy: function () { return running || whacking; }, whacking: function () { return whacking; }
  };
})(window);
