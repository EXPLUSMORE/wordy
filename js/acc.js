/* Zubehör für Figuren (Brillen, Mützen, Kopfhörer, Schals …): einmal kaufen, jeder Figur einzeln anziehen.
   Zeichnung im Raum der Figuren (viewBox 0 0 220 300, Kopf = Ellipse um 110/100). Je Eintrag: slot (head | face | ears | neck) und SVG-Markup.
   Kopf-, Gesichts- und Ohren-Teile liegen über dem Kopf (bewegen sich mit), Hals-Teile zwischen Körper und Kopf. Katalog (Preise): ACC in engine.js. */
(function (global) {
  "use strict";
  var A = global.VTA; if (!A || !A.setAcc) return;
  var L = "#14213d", O = ' stroke="' + L + '" stroke-width="5" stroke-linejoin="round"';
  function flower(x, y, c) { var s = ""; for (var k = 0; k < 5; k++) { var a = k * 72 * Math.PI / 180; s += '<circle cx="' + (x + Math.cos(a) * 7).toFixed(1) + '" cy="' + (y + Math.sin(a) * 7).toFixed(1) + '" r="5.4" fill="' + c + '" stroke="' + L + '" stroke-width="2.4"/>'; } return s + '<circle cx="' + x + '" cy="' + y + '" r="4.6" fill="#ffe066" stroke="' + L + '" stroke-width="2.4"/>'; }
  var ACCS = {
    /* ---- Kopf ---- */
    beanie: ['<path d="M48 64Q50 6 110 4Q170 6 172 64Q110 50 48 64z" fill="#e8123c"' + O + '/><rect x="44" y="56" width="132" height="22" rx="10" fill="#fff"' + O + '/><path d="M62 60v14M80 60v14M98 60v14M116 60v14M134 60v14M152 60v14" stroke="#ffd2da" stroke-width="3"/><circle cx="110" cy="2" r="15" fill="#fff"' + O + '/>'],
    party: ['<path d="M110-34L74 54Q110 66 146 54z" fill="#b58cff"' + O + '/><path d="M98-6l-14 34M120-6l14 34" stroke="#ffe066" stroke-width="6" stroke-linecap="round"/><circle cx="110" cy="-34" r="11" fill="#ff6b8f" stroke="' + L + '" stroke-width="4"/>'],
    zylinder: ['<ellipse cx="110" cy="48" rx="76" ry="14" fill="#2b2f45"' + O + '/><path d="M68 48L74-26h72L152 48z" fill="#2b2f45"' + O + '/><path d="M70 34h80" stroke="#ffd34d" stroke-width="10"/>'],
    prop: ['<path d="M52 60Q56 14 110 12Q164 14 168 60Q110 48 52 60z" fill="#59c8ff"' + O + '/><path d="M110 12V-2" stroke="' + L + '" stroke-width="6"/><g transform="translate(110 -4)"><g class="acc-spin"><path d="M0 0Q-40-18 -44-2Q-20-4 0 0zM0 0Q40 18 44 2Q20 4 0 0z" fill="#ff6b8f" stroke="' + L + '" stroke-width="4" stroke-linejoin="round"/></g></g><circle cx="110" cy="-4" r="6" fill="#ffd34d" stroke="' + L + '" stroke-width="3"/>'],
    cap: ['<path d="M54 68Q56 22 110 20Q164 22 166 68Q110 56 54 68z" fill="#e8123c"' + O + '/><path d="M148 62Q198 58 204 76Q172 82 140 72z" fill="#b01030"' + O + '/><circle cx="110" cy="20" r="7" fill="#fff" stroke="' + L + '" stroke-width="3.5"/><path d="M84 40q26-8 52 0" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".7" fill="none"/>'],
    stroh: ['<ellipse cx="110" cy="56" rx="98" ry="20" fill="#f2cf6b"' + O + '/><path d="M60 56Q62 10 110 10Q158 10 160 56Q110 66 60 56z" fill="#f7dc86"' + O + '/><path d="M60 50Q110 62 160 50" stroke="#c0392b" stroke-width="9" fill="none"/><path d="M40 54q10 6 22 6M180 54q-10 6-22 6M78 28l10 8M100 20l6 10M124 20l-4 10M146 30l-10 8" stroke="#c99a2e" stroke-width="3" stroke-linecap="round"/>'],
    blumen: [(function () { var s = '<path d="M52 82Q110 4 168 82" fill="none" stroke="#3aa357" stroke-width="9" stroke-linecap="round"/>', cols = ["#ff6b8f", "#fff", "#ffb347", "#b58cff", "#ff6b8f", "#fff", "#59c8ff"], k; for (k = 0; k < 7; k++) { var t = k / 6, a = Math.PI * (1 - t), x = 110 + Math.cos(a) * 58, y = 82 - Math.sin(a) * 70 + 4; s += flower(Math.round(x), Math.round(y), cols[k]); } return s; })()],
    heiligen: ['<ellipse cx="110" cy="18" rx="44" ry="11" fill="none" stroke="' + L + '" stroke-width="12"/><ellipse cx="110" cy="18" rx="44" ry="11" fill="none" stroke="#ffe27a" stroke-width="6" class="acc-pulse"/>'],
    hasen: ['<g' + O + '><ellipse cx="80" cy="-6" rx="14" ry="40" fill="#fff" transform="rotate(-10 80 -6)"/><ellipse cx="140" cy="-6" rx="14" ry="40" fill="#fff" transform="rotate(10 140 -6)"/></g><ellipse cx="80" cy="-2" rx="6" ry="28" fill="#ffc4de" transform="rotate(-10 80 -2)"/><ellipse cx="140" cy="-2" rx="6" ry="28" fill="#ffc4de" transform="rotate(10 140 -2)"/><path d="M54 66Q110 32 166 66" fill="none" stroke="' + L + '" stroke-width="12" stroke-linecap="round"/><path d="M54 66Q110 32 166 66" fill="none" stroke="#ff8fb8" stroke-width="6" stroke-linecap="round"/>'],
    teufel: ['<g' + O + '><path d="M60 62Q44 36 56 10Q80 24 84 56z" fill="#e8123c"/><path d="M160 62Q176 36 164 10Q140 24 136 56z" fill="#e8123c"/></g><path d="M62 40q6-10 12-14M158 40q-6-10-12-14" stroke="#ff8a8a" stroke-width="3.5" stroke-linecap="round" opacity=".8"/>'],
    eishut: ['<path d="M76 58L110 138L144 58z" fill="none"/><circle cx="92" cy="40" r="26" fill="#ff9ec9"' + O + '/><circle cx="128" cy="38" r="26" fill="#7de8c8"' + O + '/><circle cx="110" cy="14" r="24" fill="#fff3a0"' + O + '/><path d="M96 54q14 10 28 0" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity=".7" fill="none"/><circle cx="110" cy="-12" r="9" fill="#e8123c"' + O + '/><path d="M110-20q8-14 20-12" stroke="#2e8a35" stroke-width="4" fill="none" stroke-linecap="round"/>'],
    pizza: ['<path d="M56 62Q110 18 164 62L110 -16z" fill="#ffd34d"' + O + '/><path d="M56 62Q110 18 164 62" stroke="#d9822b" stroke-width="12" fill="none" stroke-linecap="round"/><g fill="#e8123c" stroke="' + L + '" stroke-width="3"><circle cx="110" cy="14" r="9"/><circle cx="92" cy="40" r="8"/><circle cx="130" cy="38" r="8"/></g><path d="M104 -2l4 6M96 28l5 4M134 26l-5 4" stroke="#fff" stroke-width="2.6" stroke-linecap="round" opacity=".8"/>'],
    krone: ['<path d="M56 62l-8-46l34 26l28-46l28 46l34-26l-8 46q-54 14-108 0z" fill="#ffd34d"' + O + '/><circle cx="110" cy="6" r="7" fill="#e8123c" stroke="' + L + '" stroke-width="3.5"/><circle cx="62" cy="22" r="5" fill="#59c8ff" stroke="' + L + '" stroke-width="3"/><circle cx="158" cy="22" r="5" fill="#59c8ff" stroke="' + L + '" stroke-width="3"/><path d="M74 52q36 8 72 0" stroke="#fff3a0" stroke-width="4" stroke-linecap="round" opacity=".8" fill="none"/>'],
    /* ---- Gesicht ---- */
    sonne: ['<g stroke="' + L + '" stroke-width="5" stroke-linejoin="round"><rect x="54" y="68" width="48" height="34" rx="13" fill="#14213d"/><rect x="118" y="68" width="48" height="34" rx="13" fill="#14213d"/><path d="M102 80h16" fill="none"/></g><path d="M62 76l14-4M126 76l14-4" stroke="#7be9ff" stroke-width="4" stroke-linecap="round"/><path d="M54 82L38 76M166 82l16-6" stroke="' + L + '" stroke-width="5" stroke-linecap="round"/>'],
    nerd: ['<g stroke="#2b2f45" stroke-width="6"><circle cx="78" cy="88" r="23" fill="#bfe9ff" fill-opacity=".35"/><circle cx="142" cy="88" r="23" fill="#bfe9ff" fill-opacity=".35"/><path d="M101 86q9-6 18 0" fill="none"/></g><path d="M66 76q6-6 14-6" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".8"/>'],
    mono: ['<circle cx="140" cy="86" r="30" fill="#bfe9ff" fill-opacity=".25" stroke="#ffd34d" stroke-width="7"/><path d="M162 108q12 30 4 70" stroke="#ffd34d" stroke-width="3.5" fill="none"/><path d="M126 70q8-8 20-8" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity=".8"/>'],
    brille3d: ['<g stroke="' + L + '" stroke-width="5" stroke-linejoin="round"><rect x="52" y="70" width="50" height="34" rx="6" fill="#ff4d4d" fill-opacity=".75"/><rect x="118" y="70" width="50" height="34" rx="6" fill="#35c6ff" fill-opacity=".75"/><path d="M102 82h16" fill="none"/></g><path d="M52 80L38 76M168 80l14-4" stroke="' + L + '" stroke-width="5" stroke-linecap="round"/>'],
    herz: ['<g stroke="' + L + '" stroke-width="5" stroke-linejoin="round"><path d="M80 106q-30-18-24-36q14-8 24 6q10-14 24-6q6 18-24 36z" fill="#ff5e8f" fill-opacity=".85"/><path d="M142 106q-30-18-24-36q14-8 24 6q10-14 24-6q6 18-24 36z" fill="#ff5e8f" fill-opacity=".85"/><path d="M104 80h14" fill="none"/></g><path d="M66 78q4-6 10-4M128 78q4-6 10-4" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".8"/>'],
    schnurr: ['<path d="M110 120q-10-12-30-8q-16 4-14 16q16-6 28-2q10 2 16-6q6 8 16 6q12-4 28 2q2-12-14-16q-20-4-30 8z" fill="#3b2418"' + O.replace('5"', '4"') + '/><path d="M84 118q10-4 20 2" stroke="#6b4a32" stroke-width="3" stroke-linecap="round" fill="none"/>'],
    clown: ['<circle cx="110" cy="116" r="13" fill="#e8123c"' + O.replace('5"', '4"') + '/><ellipse cx="105" cy="111" rx="4.4" ry="3" fill="#fff" opacity=".8"/>'],
    ski: ['<path d="M44 84q66-22 132 0v14q-66-18-132 0z" fill="#ff8a1f"' + O + '/><path d="M54 74Q110 56 166 74Q172 104 150 108Q110 96 70 108Q48 104 54 74z" fill="#7be9ff" fill-opacity=".7"' + O + '/><path d="M66 78q20-8 44-6" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".8" fill="none"/>'],
    /* ---- Ohren ---- */
    kopf: ['<path d="M44 100Q40 6 110 6Q180 6 176 100" fill="none" stroke="' + L + '" stroke-width="17" stroke-linecap="round"/><path d="M44 100Q40 6 110 6Q180 6 176 100" fill="none" stroke="#ff3df0" stroke-width="9" stroke-linecap="round"/><g stroke="' + L + '" stroke-width="5"><rect x="28" y="78" width="30" height="48" rx="12" fill="#14213d"/><rect x="162" y="78" width="30" height="48" rx="12" fill="#14213d"/></g><rect x="33" y="86" width="8" height="32" rx="4" fill="#00e5ff"/><rect x="179" y="86" width="8" height="32" rx="4" fill="#00e5ff"/>'],
    waerme: ['<path d="M50 92Q50 20 110 20Q170 20 170 92" fill="none" stroke="' + L + '" stroke-width="12" stroke-linecap="round"/><path d="M50 92Q50 20 110 20Q170 20 170 92" fill="none" stroke="#ff9ec9" stroke-width="6" stroke-linecap="round"/><g' + O + '><circle cx="44" cy="102" r="26" fill="#ffc4de"/><circle cx="176" cy="102" r="26" fill="#ffc4de"/></g><g fill="#fff" opacity=".85"><circle cx="38" cy="96" r="5"/><circle cx="50" cy="108" r="4"/><circle cx="170" cy="96" r="5"/><circle cx="182" cy="108" r="4"/></g>'],
    ohrring: ['<g stroke="' + L + '" stroke-width="3.5"><circle cx="44" cy="128" r="9" fill="#ffd34d"/><circle cx="176" cy="128" r="9" fill="#ffd34d"/><circle cx="44" cy="146" r="6" fill="#59c8ff"/><circle cx="176" cy="146" r="6" fill="#59c8ff"/></g>'],
    /* ---- Hals ---- */
    schal: ['<path d="M54 158Q110 194 166 158L170 182Q110 218 50 182z" fill="#2f7be8"' + O + '/><path d="M80 176l4 22M104 184l2 24M128 184l-2 24M152 174l-4 22" stroke="#ffd34d" stroke-width="7"/><path d="M146 186l14 56l-26 6l-4-48z" fill="#2f7be8"' + O + '/><path d="M142 214l22-4M139 232l22-5" stroke="#ffd34d" stroke-width="6"/>'],
    fliege: ['<g' + O + '><path d="M110 176L72 158Q64 176 72 194z" fill="#e8123c"/><path d="M110 176L148 158Q156 176 148 194z" fill="#e8123c"/></g><circle cx="110" cy="176" r="9" fill="#b01030" stroke="' + L + '" stroke-width="4"/><path d="M82 166l14 6M138 166l-14 6" stroke="#ff8a8a" stroke-width="3" stroke-linecap="round" opacity=".8"/>'],
    kette: ['<path d="M62 160Q110 206 158 160" fill="none" stroke="' + L + '" stroke-width="9" stroke-linecap="round"/><path d="M62 160Q110 206 158 160" fill="none" stroke="#ffd34d" stroke-width="4.5" stroke-linecap="round" stroke-dasharray="7 3"/><circle cx="110" cy="198" r="15" fill="#ffd34d"' + O + '/><path d="M110 189l3 7 7 1-5 5 1 7-6-4-6 4 1-7-5-5 7-1z" fill="#fff3a0"/>'],
    tuch: ['<path d="M58 158Q110 188 162 158L110 220z" fill="#e8123c"' + O + '/><g fill="#fff"><circle cx="90" cy="172" r="4"/><circle cx="130" cy="172" r="4"/><circle cx="110" cy="188" r="4"/><circle cx="110" cy="206" r="3.4"/></g>'],
    bosskette: ['<path d="M56 154Q110 216 164 154" fill="none" stroke="' + L + '" stroke-width="19" stroke-linecap="round"/><path d="M56 154Q110 216 164 154" fill="none" stroke="#ffc21f" stroke-width="12.5" stroke-linecap="round"/><path d="M56 154Q110 216 164 154" fill="none" stroke="#b8730a" stroke-width="12.5" stroke-dasharray="2.4 11" stroke-linecap="butt"/><path d="M60 151Q110 208 160 151" fill="none" stroke="#fff3a0" stroke-width="3" stroke-dasharray="7 13" stroke-linecap="round" opacity=".9"/><circle cx="110" cy="187" r="7.5" fill="#ffd34d" stroke="' + L + '" stroke-width="4"/><g fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M130 205C130 192 91 191 91 207C91 222 130 216 130 233C130 250 90 249 90 235M110 190V252" stroke="' + L + '" stroke-width="21"/><path d="M130 205C130 192 91 191 91 207C91 222 130 216 130 233C130 250 90 249 90 235M110 190V252" stroke="#ffcf2e" stroke-width="12"/><path d="M121 199C112 194 97 195 97 205M104 196V244" stroke="#fff6b0" stroke-width="3.4" opacity=".9"/></g>'],
    mkette: ['<path d="M56 154Q110 216 164 154" fill="none" stroke="' + L + '" stroke-width="19" stroke-linecap="round"/><path d="M56 154Q110 216 164 154" fill="none" stroke="#ffc21f" stroke-width="12.5" stroke-linecap="round"/><path d="M56 154Q110 216 164 154" fill="none" stroke="#b8730a" stroke-width="12.5" stroke-dasharray="2.4 11" stroke-linecap="butt"/><path d="M60 151Q110 208 160 151" fill="none" stroke="#fff3a0" stroke-width="3" stroke-dasharray="7 13" stroke-linecap="round" opacity=".9"/><circle cx="110" cy="187" r="7.5" fill="#ffd34d" stroke="' + L + '" stroke-width="4"/><g fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M86 250V196L110 226L134 196V250" stroke="' + L + '" stroke-width="22"/><path d="M86 250V196L110 226L134 196V250" stroke="#ffcf2e" stroke-width="13"/><path d="M92 244V205L110 228" stroke="#fff6b0" stroke-width="3.4" opacity=".9"/></g>'],
    medaille: ['<path d="M80 158l16 38M140 158l-16 38" stroke="' + L + '" stroke-width="12" stroke-linecap="round"/><path d="M80 158l16 38M140 158l-16 38" stroke="#2f7be8" stroke-width="6" stroke-linecap="round"/><circle cx="110" cy="206" r="19" fill="#ffd34d"' + O + '/><path d="M110 192l4 9 10 1-7 7 2 10-9-5-9 5 2-10-7-7 10-1z" fill="#fff3a0" stroke="' + L + '" stroke-width="2.4" stroke-linejoin="round"/>']
  };
  var over = null;   // { av, lo } nur während die Anprobe gezeichnet wird
  var VB = { head: "30 -50 160 130", face: "40 56 140 64", ears: "20 -6 180 150", neck: "40 148 140 110" };
  function slotOf(val) { var it = global.VT && global.VT.itemById("ac:" + val); return it ? it.slot : "head"; }
  /* Zubehör einer Figur als Markup: { head, neck } */
  function build(loadout) {
    var out = { head: "", neck: "" }, any = false;
    ["ears", "face", "head"].forEach(function (sl) { var v = loadout[sl]; if (v && ACCS[v]) { out.head += ACCS[v][0]; any = true; } });
    if (loadout.neck && ACCS[loadout.neck]) { out.neck = ACCS[loadout.neck][0]; any = true; }
    return any ? out : null;
  }
  /* lo = fremdes Zubehör (Freunde): nur Werte, die zum Platz passen */
  A.setAcc(function (av, lo) {
    var VT = global.VT, l = {}; if (!VT || !VT.accOf) return null;
    if (!lo && over && over.av === av) lo = over.lo;   // Anprobe: Vorschau mit nicht gekauften Teilen
    if (lo) { Object.keys(lo).forEach(function (k) { var it = VT.itemById("ac:" + lo[k]); if (it && it.slot === k) l[k] = lo[k]; }); } else l = VT.accOf(av);
    return Object.keys(l).length ? build(l) : null;
  });
  /* kleines Bild eines Zubehörs (Shop, Showroom) */
  function thumb(val) {
    var a = ACCS[val]; if (!a) return ""; var sl = slotOf(val);
    return '<svg viewBox="' + VB[sl] + '" xmlns="http://www.w3.org/2000/svg" style="display:block;width:100%;height:100%;overflow:hidden">' + a[0] + '</svg>';
  }
  /* Propeller: per Skript gedreht (rotate-Attribut), weil iOS-Safari weder SMIL noch CSS-Animationen in diesen Sticker-SVGs zuverlässig zeichnet */
  if (global.document && global.requestAnimationFrame) {
    var calm = global.matchMedia && global.matchMedia("(prefers-reduced-motion: reduce)");
    (function tick(t) {
      if (!(calm && calm.matches) && !global.document.hidden) {
        var els = global.document.getElementsByClassName("acc-spin"), a = ((t || 0) % 500) / 500 * 360;
        for (var i = 0; i < els.length; i++) els[i].setAttribute("transform", "rotate(" + a.toFixed(1) + ")");
      }
      global.requestAnimationFrame(tick);
    })();
  }
  global.VTACC = { setOver: function (o) { over = o; }, thumb: thumb, has: function (v) { return !!ACCS[v]; } };
})(window);
