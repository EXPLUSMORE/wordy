/* Stil A "Fortnite-Cartoon" für alle übrigen Figuren: ein gemeinsamer Körper (Beine, Jacke, Arme, Kopf) mit je Tier eigenen
   Ohren, Gesicht, Zusätzen und Farben. Gezeichnet wird mit denselben Gruppen wie in stila.js (bodyG, armL, armR, headG),
   damit alle Tänze funktionieren. Registriert die Figuren über VTA.register. */
(function (global) {
  "use strict";
  var A = global.VTA; if (!A || !A.register) return;
  var uid = 0, L = '#14213d', OL = 'stroke="' + L + '" stroke-width="5" stroke-linejoin="round"';

  function grad(id, cols, x2, y2) {
    var n = cols.length, s = "";
    cols.forEach(function (c, i) { s += '<stop offset="' + (n === 1 ? 0 : i / (n - 1)) + '" stop-color="' + c + '"/>'; });
    return '<linearGradient id="' + id + '" x1="0" y1="0" x2="' + (x2 == null ? 1 : x2) + '" y2="' + (y2 == null ? 1 : y2) + '">' + s + '</linearGradient>';
  }
  function star(x, y, r, c) {
    return '<path d="M' + x + ' ' + (y - r) + 'l' + r * .3 + ' ' + r * .7 + 'l' + r * .7 + ' ' + r * .3 + 'l-' + r * .7 + ' ' + r * .3 + 'l-' + r * .3 + ' ' + r * .7 + 'l-' + r * .3 + '-' + r * .7 + 'l-' + r * .7 + '-' + r * .3 + 'l' + r * .7 + '-' + r * .3 + 'z" fill="' + c + '" stroke="' + L + '" stroke-width="2.5" stroke-linejoin="round"/>';
  }

  /* ---- Ohren (hinter dem Kopf) ---- */
  function ear(type, f, inn) {
    if (type === "round") return '<circle cx="62" cy="52" r="22" fill="' + f + '" ' + OL + '/><circle cx="64" cy="55" r="11" fill="' + inn + '" stroke="' + L + '" stroke-width="3"/>' +
      '<circle cx="158" cy="52" r="22" fill="' + f + '" ' + OL + '/><circle cx="156" cy="55" r="11" fill="' + inn + '" stroke="' + L + '" stroke-width="3"/>';
    if (type === "small") return '<circle cx="58" cy="56" r="15" fill="' + f + '" ' + OL + '/><circle cx="162" cy="56" r="15" fill="' + f + '" ' + OL + '/>';
    if (type === "point") return '<path d="M48 78L42 8L102 44z" fill="' + f + '" ' + OL + '/><path d="M56 64L54 26L86 46z" fill="' + inn + '"/>' +
      '<path d="M172 78L178 8L118 44z" fill="' + f + '" ' + OL + '/><path d="M164 64L166 26L134 46z" fill="' + inn + '"/>';
    if (type === "long") return '<g transform="rotate(-12 80 50)"><ellipse cx="80" cy="14" rx="17" ry="48" fill="' + f + '" ' + OL + '/><ellipse cx="80" cy="18" rx="8" ry="34" fill="' + inn + '"/></g>' +
      '<g transform="rotate(12 140 50)"><ellipse cx="140" cy="14" rx="17" ry="48" fill="' + f + '" ' + OL + '/><ellipse cx="140" cy="18" rx="8" ry="34" fill="' + inn + '"/></g>';
    if (type === "llama") return '<g transform="rotate(-8 84 50)"><path d="M70 60q-6-50 16-62q14 18 8 62z" fill="' + f + '" ' + OL + '/></g>' +
      '<g transform="rotate(8 136 50)"><path d="M150 60q6-50-16-62q-14 18-8 62z" fill="' + f + '" ' + OL + '/></g>';
    if (type === "floppy") return '<path d="M52 56q-34 6-30 40q22 4 44-22z" fill="' + f + '" ' + OL + '/><path d="M168 56q34 6 30 40q-22 4-44-22z" fill="' + f + '" ' + OL + '/>';
    return "";
  }

  /* ---- Gesichter (nach dem Kopfumriss) ---- */
  function mouthSmile() { return '<path d="M110 116v8M96 128q14 14 28 0" stroke="' + L + '" stroke-width="4" stroke-linecap="round" fill="none"/><path d="M104 134q6 10 12 0" fill="#ff6b8f" stroke="' + L + '" stroke-width="3"/>'; }
  var FACE = {
    muzzle: function (sp) {
      return '<ellipse cx="110" cy="122" rx="34" ry="25" fill="' + sp.belly + '" stroke="' + L + '" stroke-width="4"/>' +
        '<path d="M97 100q13-8 26 0q2 12-13 16q-15-4-13-16z" fill="' + (sp.nose || L) + '" stroke="' + L + '" stroke-width="3.5" stroke-linejoin="round"/><ellipse cx="105" cy="102" rx="4.5" ry="2.4" fill="#fff" opacity=".85"/>' + mouthSmile();
    },
    wolf: function (sp) {
      return '<path d="M66 128q4-34 44-34q40 0 44 34q-4 28-44 28q-40 0-44-28z" fill="' + sp.belly + '" stroke="' + L + '" stroke-width="4"/>' +
        '<path d="M94 98q16-10 32 0q2 14-16 20q-18-6-16-20z" fill="' + L + '"/><ellipse cx="104" cy="101" rx="5" ry="2.6" fill="#fff" opacity=".8"/>' +
        '<path d="M110 118v10M94 132q16 12 32 0" stroke="' + L + '" stroke-width="4" stroke-linecap="round" fill="none"/><path d="M103 138q7 10 14 0" fill="#ff6b8f" stroke="' + L + '" stroke-width="3"/>';
    },
    cat: function (sp) {
      return '<ellipse cx="110" cy="124" rx="30" ry="20" fill="' + sp.belly + '" stroke="' + L + '" stroke-width="4"/>' +
        '<path d="M100 108h20l-10 12z" fill="#ff7fa6" stroke="' + L + '" stroke-width="3.5" stroke-linejoin="round"/>' +
        '<path d="M110 120v6M96 128q7 10 14-2q7 12 14 2" stroke="' + L + '" stroke-width="4" stroke-linecap="round" fill="none"/>' +
        '<path d="M52 118l24 4M52 130l24-2M168 118l-24 4M168 130l-24-2" stroke="' + L + '" stroke-width="3" stroke-linecap="round"/>';
    },
    bunny: function (sp) {
      return '<ellipse cx="110" cy="124" rx="30" ry="20" fill="' + sp.belly + '" stroke="' + L + '" stroke-width="4"/>' +
        '<path d="M102 108q8-6 16 0q0 8-8 10q-8-2-8-10z" fill="#ff8fb8" stroke="' + L + '" stroke-width="3.5" stroke-linejoin="round"/>' +
        '<path d="M110 118v6M98 126q12 10 24 0" stroke="' + L + '" stroke-width="4" stroke-linecap="round" fill="none"/>' +
        '<rect x="102" y="130" width="8" height="12" rx="3" fill="#fff" stroke="' + L + '" stroke-width="3"/><rect x="110" y="130" width="8" height="12" rx="3" fill="#fff" stroke="' + L + '" stroke-width="3"/>';
    },
    beak: function (sp) {
      return '<path d="M90 108q20-16 40 0q-6 26-20 30q-14-4-20-30z" fill="url(#BKG)" stroke="' + L + '" stroke-width="4" stroke-linejoin="round"/><path d="M99 112q11-6 22 0" stroke="#fff" stroke-width="3.5" stroke-linecap="round" opacity=".7" fill="none"/><path d="M96 124q14 6 28 0" stroke="' + L + '" stroke-width="3" stroke-linecap="round" fill="none"/>';
    },
    pig: function (sp) {
      return '<ellipse cx="110" cy="122" rx="32" ry="22" fill="' + sp.belly + '" stroke="' + L + '" stroke-width="4"/><ellipse cx="99" cy="122" rx="5" ry="8" fill="' + L + '"/><ellipse cx="121" cy="122" rx="5" ry="8" fill="' + L + '"/>' +
        '<path d="M82 138l-6 14l14-8zM138 138l6 14l-14-8z" fill="#fff" stroke="' + L + '" stroke-width="3.5" stroke-linejoin="round"/>';
    },
    frog: function (sp) {
      return '<path d="M58 112q52 52 104 0" stroke="' + L + '" stroke-width="5" stroke-linecap="round" fill="' + sp.belly + '"/><path d="M82 128q28 22 56 0" fill="#ff6b8f" opacity=".9"/><circle cx="102" cy="108" r="3" fill="' + L + '"/><circle cx="118" cy="108" r="3" fill="' + L + '"/>';
    },
    dino: function (sp) {
      return '<ellipse cx="110" cy="122" rx="38" ry="26" fill="' + sp.belly + '" stroke="' + L + '" stroke-width="4"/><ellipse cx="98" cy="108" rx="4" ry="5" fill="' + L + '"/><ellipse cx="122" cy="108" rx="4" ry="5" fill="' + L + '"/>' +
        '<path d="M86 128q24 18 48 0" stroke="' + L + '" stroke-width="4" stroke-linecap="round" fill="none"/><path d="M96 132l3 7l4-6M117 132l3 7l4-6" fill="#fff" stroke="' + L + '" stroke-width="2.5" stroke-linejoin="round"/>';
    },
    shark: function (sp) {
      return '<ellipse cx="110" cy="124" rx="40" ry="26" fill="' + sp.belly + '" stroke="' + L + '" stroke-width="4"/>' +
        '<path d="M76 120q34 36 68 0q-34 12-68 0z" fill="#7a1630" stroke="' + L + '" stroke-width="4" stroke-linejoin="round"/>' +
        '<path d="M82 124l5 9l5-7l5 10l6-9l6 10l6-10l5 9l5-9l5 7l4-8" fill="#fff" stroke="' + L + '" stroke-width="2.5" stroke-linejoin="round"/>' +
        '<ellipse cx="98" cy="108" rx="3.5" ry="4.5" fill="' + L + '"/><ellipse cx="122" cy="108" rx="3.5" ry="4.5" fill="' + L + '"/>';
    },
    bigmouth: function (sp) {
      return '<path d="M62 112q48 18 96 0q-4 44-48 44q-44 0-48-44z" fill="#7a1630" stroke="' + L + '" stroke-width="5" stroke-linejoin="round"/>' +
        '<path d="M70 114l6 14l7-12l7 15l7-13l7 15l7-14l7 15l7-14l7 14l6-12l6 12" fill="#fff6dc" stroke="' + L + '" stroke-width="2.5" stroke-linejoin="round"/>' +
        '<ellipse cx="110" cy="146" rx="22" ry="9" fill="#ff6f8e" stroke="' + L + '" stroke-width="3"/>';
    },
    gem: function (sp) {
      return '<path d="M98 124q12 10 24 0" stroke="' + L + '" stroke-width="4.5" stroke-linecap="round" fill="none"/><path d="M104 130q6 9 12 0z" fill="#ff7fa6" stroke="' + L + '" stroke-width="3"/>';
    },
    small: function (sp) {
      return '<ellipse cx="110" cy="124" rx="28" ry="19" fill="' + sp.belly + '" stroke="' + L + '" stroke-width="4"/>' +
        '<path d="M100 106q10-6 20 0q1 9-10 12q-11-3-10-12z" fill="' + (sp.nose || "#ff8fb8") + '" stroke="' + L + '" stroke-width="3.5" stroke-linejoin="round"/>' + mouthSmile().replace("M110 116v8", "M110 118v6");
    }
  };

  /* ---- Augen ---- */
  function eyes(sp) {
    if (sp.eyes === "frog") return "";   // Augen sitzen in den Köpfchen (ears)
    if (sp.eyes === "big") {
      var sc = sp.sclera || "#fff", pu = sp.pupil || L;
      return '<circle cx="80" cy="86" r="21" fill="' + sc + '" stroke="' + L + '" stroke-width="4.5"/><circle cx="140" cy="86" r="21" fill="' + sc + '" stroke="' + L + '" stroke-width="4.5"/>' +
        '<circle cx="82" cy="88" r="11" fill="' + pu + '"/><circle cx="138" cy="88" r="11" fill="' + pu + '"/><circle cx="86" cy="83" r="4.5" fill="#fff"/><circle cx="142" cy="83" r="4.5" fill="#fff"/><circle cx="77" cy="94" r="2" fill="#fff"/><circle cx="133" cy="94" r="2" fill="#fff"/>';
    }
    return '<ellipse cx="82" cy="88" rx="12" ry="16" fill="' + L + '"/><ellipse cx="138" cy="88" rx="12" ry="16" fill="' + L + '"/>' +
      '<circle cx="86" cy="82" r="5.4" fill="#fff"/><circle cx="142" cy="82" r="5.4" fill="#fff"/><circle cx="78" cy="95" r="2.4" fill="#fff"/><circle cx="134" cy="95" r="2.4" fill="#fff"/>' +
      '<path d="M66 66q16-10 32-2M122 64q16-8 32 2" stroke="' + L + '" stroke-width="5" stroke-linecap="round" fill="none"/>';
  }

  /* ---- Figur bauen ---- */
  function critter(sp, jc, jd) {
    var i = "c" + (uid++), f = sp.fur, hand = sp.hand || f[Math.min(1, f.length - 1)], pants = sp.pants || "#2a4f9a", shoe = sp.shoe || "#fff";
    var defs = grad(i + "f", f) + grad(i + "j", [jc, jd]) + grad(i + "m", [shade(sp.belly, 1), shade(sp.belly, 0.82)]) + grad("BKG", ["#ffd23d", "#f27d0c"], 0, 1) +
      (sp.defs || "").replace(/\$I/g, i);
    var back = (sp.back || "").replace(/\$I/g, i), hback = (sp.hback || "").replace(/\$I/g, i), hfront = (sp.hfront || "").replace(/\$I/g, i);
    var legs = sp.legs ||
      '<g stroke="' + L + '" stroke-width="5" stroke-linejoin="round">' +
      '<path d="M76 214h30v44a15 15 0 0 1-15 15a15 15 0 0 1-15-15z" fill="' + pants + '"/><ellipse cx="90" cy="268" rx="24" ry="13" fill="' + shoe + '"/><path d="M78 270q12 5 24 0" fill="none" stroke="#9db9d8" stroke-width="3"/>' +
      '<path d="M114 214h30v44a15 15 0 0 1-15 15a15 15 0 0 1-15-15z" fill="' + pants + '"/><ellipse cx="130" cy="268" rx="24" ry="13" fill="' + shoe + '"/><path d="M118 270q12 5 24 0" fill="none" stroke="#9db9d8" stroke-width="3"/></g>';
    var svg = '<svg class="afs" viewBox="0 0 220 300" xmlns="http://www.w3.org/2000/svg"><defs>' + defs + '</defs>' +
      '<g transform="translate(110 300) scale(.9) translate(-110 -300)"><ellipse cx="110" cy="286" rx="66" ry="9" fill="#000" opacity=".28"/><g class="bodyG">' + back + legs +
      /* Körper */
      '<g stroke="' + L + '" stroke-width="5" stroke-linejoin="round"><path d="M62 168q-4 38 4 62q44 14 88 0q8-24 4-62q-48-14-96 0z" fill="url(#' + i + 'j)"/><path d="M66 230q44 14 88 0v10q-44 14-88 0z" fill="#fff"/></g>' +
      '<path d="M110 160v78" stroke="rgba(10,20,60,.45)" stroke-width="3" fill="none"/><path d="M80 205h20M120 205h20" stroke="rgba(10,20,60,.45)" stroke-width="3" stroke-linecap="round" fill="none"/>' +
      '<path d="M72 176q-4 28 2 48" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity=".45" fill="none"/>' +
      '<circle cx="110" cy="190" r="13" fill="#fff" stroke="' + L + '" stroke-width="4"/>' + star(110, 190, 8, sp.badge || "#ffd24a") +
      /* Kragen */
      '<path d="M58 160q52 30 104 0q8 14-6 20q-46 18-92 0q-14-6-6-20z" fill="url(#' + i + 'm)" stroke="' + L + '" stroke-width="5" stroke-linejoin="round"/>' +
      /* Arme */
      '<g class="armL" stroke="' + L + '" stroke-width="5" stroke-linejoin="round"><path d="M70 164q-34 8-34 40q4 8 16 6q4-22 24-30z" fill="url(#' + i + 'j)" transform="rotate(8 70 168)"/><circle cx="46" cy="214" r="15" fill="' + hand + '"/><path d="M38 220q6 6 14 0" stroke="rgba(10,20,60,.35)" stroke-width="3" fill="none"/></g>' +
      '<g class="armR" stroke="' + L + '" stroke-width="5" stroke-linejoin="round"><path d="M150 164q34 8 34 40q-4 8-16 6q-4-22-24-30z" fill="url(#' + i + 'j)" transform="rotate(-8 150 168)"/><circle cx="174" cy="214" r="15" fill="' + hand + '"/><path d="M166 220q6 6 14 0" stroke="rgba(10,20,60,.35)" stroke-width="3" fill="none"/></g>' +
      /* Kopf */
      '<g class="headG">' + hback + ear(sp.ears, "url(#" + i + "f)", sp.earIn || "#f6b7cc") +
      '<ellipse cx="110" cy="100" rx="66" ry="60" fill="url(#' + i + 'f)" stroke="' + L + '" stroke-width="5"/>' +
      (sp.under || "") +
      '<path d="M52 78q10-30 44-40" stroke="#fff" stroke-width="8" stroke-linecap="round" opacity=".85" fill="none"/><path d="M172 92q-4 34-34 52" stroke="#fff" stroke-width="6" stroke-linecap="round" opacity=".28" fill="none"/>' +
      (sp.cheek === false ? "" : '<ellipse cx="62" cy="118" rx="11" ry="7" fill="#ff8fb0" opacity=".55"/><ellipse cx="158" cy="118" rx="11" ry="7" fill="#ff8fb0" opacity=".55"/>') +
      (FACE[sp.face || "muzzle"](sp)) + eyes(sp) + hfront +
      '</g></g></g></svg>';
    return svg;
  }
  /* helle/dunkle Variante einer #rrggbb-Farbe */
  function shade(hex, k) {
    var m = /^#([0-9a-f]{6})$/i.exec(hex || ""); if (!m) return hex || "#fff";
    var n = parseInt(m[1], 16), r = n >> 16 & 255, g = n >> 8 & 255, b = n & 255;
    return "#" + [r, g, b].map(function (v) { return ("0" + Math.round(v * k).toString(16)).slice(-2); }).join("");
  }

  /* ---- Bausteine ---- */
  var HORN = '<path d="M110 -10l-15 52h30z" fill="url(#$Ih)" stroke="' + L + '" stroke-width="5" stroke-linejoin="round"/><path d="M104 14l12 6M101 26l16 7" stroke="#c8780a" stroke-width="3" stroke-linecap="round"/>';
  var HORN_DEF = '<linearGradient id="$Ih" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff3a0"/><stop offset="1" stop-color="#f0a820"/></linearGradient>';
  function mane(cols) { return '<g stroke="' + L + '" stroke-width="4" stroke-linejoin="round"><ellipse cx="46" cy="70" rx="22" ry="34" fill="' + cols[0] + '" transform="rotate(-18 46 70)"/><ellipse cx="174" cy="70" rx="22" ry="34" fill="' + cols[2] + '" transform="rotate(18 174 70)"/><ellipse cx="86" cy="34" rx="24" ry="22" fill="' + cols[1] + '"/><ellipse cx="134" cy="34" rx="24" ry="22" fill="' + cols[3] + '"/></g>'; }
  function spikes(c, n) {
    var s = "", k; for (k = 0; k < n; k++) { var x = 110 + (k - (n - 1) / 2) * 24; s += '<path d="M' + (x - 11) + ' 48L' + x + ' 2L' + (x + 11) + ' 48z" fill="' + c + '" stroke="' + L + '" stroke-width="4" stroke-linejoin="round"/>'; }
    return s;
  }
  function wings(f, m) { return '<g stroke="' + L + '" stroke-width="5" stroke-linejoin="round"><path d="M62 178q-62-44-56 20q8 34 58 30z" fill="' + f + '"/><path d="M58 190q-34-16-34 14q16 14 40 10z" fill="' + m + '"/><path d="M158 178q62-44 56 20q-8 34-58 30z" fill="' + f + '"/><path d="M162 190q34-16 34 14q-16 14-40 10z" fill="' + m + '"/></g>'; }
  function tail(f, tip) { return '<path d="M148 244q56 12 64-38q-2-24-28-8q6 22-36 28z" fill="' + f + '" stroke="' + L + '" stroke-width="5" stroke-linejoin="round"/>' + (tip ? '<path d="M184 198q-10 6-12 22q22 2 36-14q-4-18-24-8z" fill="' + tip + '" stroke="' + L + '" stroke-width="4" stroke-linejoin="round"/>' : ""); }
  function crystals(cols, big) {
    var h = big ? 64 : 48;
    return '<g stroke="' + L + '" stroke-width="4.5" stroke-linejoin="round"><path d="M84 52L70 ' + (52 - h) + 'L106 40z" fill="' + cols[0] + '"/><path d="M136 52L150 ' + (52 - h) + 'L114 40z" fill="' + cols[0] + '"/><path d="M92 50L110 ' + (50 - h - 18) + 'L128 50z" fill="' + cols[1] + '"/><path d="M110 ' + (50 - h - 18) + 'L110 50" stroke="#fff" stroke-width="3" opacity=".7"/></g>';
  }
  var FACETS = '<path d="M70 70l22-22M128 44l24 24M60 112l18-10M160 112l-16-12" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".65"/>';

  /* ---- Katalog: Avatar-Wert -> [Name, Spezifikation, Standardjacke] ---- */
  var D = {
    "🦊": ["fuchs", { fur: ["#ffc27a", "#f2761a", "#b8480a"], belly: "#ffffff", ears: "point", earIn: "#3b2a2a", nose: L, back: tail("#f2761a", "#fff"), hand: "#3b2a2a" }, ["#35c6ff", "#1a7fd0"]],
    "🐼": ["panda", { fur: ["#ffffff", "#f3f3f6", "#c9ced6"], belly: "#ffffff", ears: "round", earIn: "#2b2f45", hand: "#2b2f45", cheek: false,
      under: '<ellipse cx="82" cy="90" rx="17" ry="21" fill="#2b2f45" transform="rotate(20 82 90)"/><ellipse cx="138" cy="90" rx="17" ry="21" fill="#2b2f45" transform="rotate(-20 138 90)"/>', eyes: "big", sclera: "#fff", nose: L }, ["#7ae068", "#2d9a3a"]],
    "🐢": ["schildi", { fur: ["#b4f08c", "#58be4c", "#2e8a35"], belly: "#effcc0", ears: "", nose: "#2e8a35", cheek: true,
      back: '<g stroke="' + L + '" stroke-width="5" stroke-linejoin="round"><ellipse cx="110" cy="206" rx="80" ry="68" fill="#2f8f3c"/><ellipse cx="110" cy="206" rx="62" ry="52" fill="#4fb24a"/></g><path d="M110 156v100M72 186l76 40M148 186l-76 40" stroke="' + L + '" stroke-width="3.5" opacity=".55"/>' }, ["#ffb347", "#e0661c"]],
    "🦉": ["eule", { fur: ["#d9b88e", "#a2703f", "#6d4724"], belly: "#f6e8cc", ears: "point", earIn: "#6d4724", eyes: "big", sclera: "#fff2b0", face: "beak", cheek: false, hand: "#a2703f",
      under: '<path d="M70 62q40 20 80 0" stroke="' + L + '" stroke-width="3.5" fill="none" opacity=".5"/><path d="M96 56l14 12l14-12" stroke="#6d4724" stroke-width="4" fill="none" stroke-linecap="round"/>' }, ["#7a63f0", "#3a2da8"]],
    "🐙": ["krake", { fur: ["#e3b0ff", "#a458e8", "#6d2fb8"], belly: "#f7dcff", ears: "", eyes: "big", sclera: "#fff", face: "small", nose: "#ff8fb8", hand: "#a458e8",
      hback: '<ellipse cx="110" cy="46" rx="58" ry="48" fill="url(#$If)" stroke="' + L + '" stroke-width="5"/>',
      legs: '<g stroke="' + L + '" stroke-width="5" stroke-linejoin="round" fill="#a458e8"><path d="M70 226q-16 30 6 46q12-6 8-16q-4-14 6-30z"/><path d="M96 232q-4 34 14 40q16-6 6-40z"/><path d="M124 232q-10 34 6 40q18-6 14-40z"/><path d="M150 226q16 30-6 46q-12-6-8-16q4-14-6-30z"/></g><g fill="#f7dcff" stroke="' + L + '" stroke-width="2"><circle cx="76" cy="262" r="3.5"/><circle cx="144" cy="262" r="3.5"/><circle cx="110" cy="262" r="3.5"/></g>' }, ["#35c6ff", "#1a7fd0"]],
    "🦕": ["dino", { fur: ["#a7f08a", "#46b83c", "#277a2c"], belly: "#f7f2b4", ears: "", face: "dino", hfront: spikes("#ff9a3d", 3).replace(/L(\d+) 2L/g, "L$1 8L"), back: tail("#46b83c") }, ["#ffb347", "#e0661c"]],
    "🦈": ["hai", { fur: ["#cfe0f2", "#6f98c4", "#3d5f8c"], belly: "#ffffff", ears: "", face: "shark", cheek: false, hback: '<path d="M84 52Q98-22 142-8Q122 12 134 52z" fill="#4f78a8" stroke="' + L + '" stroke-width="5" stroke-linejoin="round"/>',
      back: '<path d="M150 240q46-6 58-40q4 30-14 52q-10 10-22 6z" fill="#4f78a8" stroke="' + L + '" stroke-width="5" stroke-linejoin="round"/>' }, ["#ff5e5e", "#b82020"]],
    "🦄": ["einhorn", { fur: ["#ffffff", "#f6f0fd", "#d4c8ee"], belly: "#ffe0f0", ears: "point", earIn: "#ffc4de", nose: "#ff8fb8", defs: HORN_DEF, hfront: HORN, hback: mane(["#ff9ec9", "#b78cff", "#6fc3ff", "#ffd27a"]) }, ["#c07bff", "#7a2fd0"]],
    "svg:pbaer": ["pbaer", { fur: ["#e8be92", "#bc8450", "#855a2d"], belly: "#f8e2c8", ears: "round", earIn: "#f1c9a0", nose: L }, ["#e94d4d", "#a31f1f"]],
    "svg:phase": ["phase", { fur: ["#ffffff", "#f5f2fb", "#d6d0ea"], belly: "#ffffff", ears: "long", earIn: "#ffb8d4", face: "bunny" }, ["#ff8fb8", "#d0407a"]],
    "svg:pkatze": ["pkatze", { fur: ["#ffe2b8", "#f8ac52", "#c47a1f"], belly: "#fff3e0", ears: "point", earIn: "#ff9cb8", face: "cat",
      under: '<path d="M96 52v16M110 48v20M124 52v16" stroke="#d98a2e" stroke-width="6" stroke-linecap="round"/>' }, ["#7a63f0", "#3a2da8"]],
    "svg:pummel": ["pummel", { fur: ["#ffeaf4", "#ffc9e3", "#f09cc6"], belly: "#ffffff", ears: "round", earIn: "#ff9cc6", nose: "#ff8fb8", defs: HORN_DEF, hfront: HORN +
      '<circle cx="76" cy="46" r="10" fill="#8ed8f8" stroke="' + L + '" stroke-width="3.5"/><circle cx="144" cy="46" r="10" fill="#c9a7f5" stroke="' + L + '" stroke-width="3.5"/><circle cx="60" cy="68" r="8" fill="#b9f0b4" stroke="' + L + '" stroke-width="3.5"/>' }, ["#35c6ff", "#1a7fd0"]],
    "svg:pdrache": ["pdrache", { fur: ["#d4f9d6", "#9ee6a8", "#5fbf78"], belly: "#effcef", ears: "", face: "dino", back: wings("#7fd895", "#ffe08a") + tail("#9ee6a8"),
      hback: '<path d="M54 64L40 6l46 30z" fill="#ffb84d" stroke="' + L + '" stroke-width="5" stroke-linejoin="round"/><path d="M166 64L180 6l-46 30z" fill="#ffb84d" stroke="' + L + '" stroke-width="5" stroke-linejoin="round"/>',
      hfront: '<path d="M96 46l7-18l7 14l7-14l7 18" fill="#6fcb86" stroke="' + L + '" stroke-width="4" stroke-linejoin="round"/>' }, ["#ff7a3d", "#c2400a"]],
    "svg:clombo": ["clombo", { fur: ["#e6aaf6", "#b063cc", "#783a98"], belly: "#7a1630", ears: "", face: "bigmouth", eyes: "big", sclera: "#8fe4f7", cheek: false,
      defs: '<linearGradient id="$Ir" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#ff8fd0"/><stop offset=".55" stop-color="#8f7dff"/><stop offset="1" stop-color="#37c6e8"/></linearGradient>',
      hback: '<path d="M44 66l8-44l22 24l14-38l18 34l18-34l14 38l22-24l8 44z" fill="url(#$Ir)" stroke="' + L + '" stroke-width="4.5" stroke-linejoin="round"/>', back: tail("#b063cc") }, ["#ff8fd0", "#c0408a"]],
    "svg:pphoenix": ["phoenix", { fur: ["#ffd9a0", "#ffb36b", "#f28a3d"], belly: "#fff0b0", ears: "", face: "beak", cheek: false,
      back: wings("#f2593d", "#ffd34d") + '<path d="M150 244q40 8 54-24q-24 6-30-12q-6 22-24 36z" fill="#ffd34d" stroke="' + L + '" stroke-width="4" stroke-linejoin="round"/>',
      hfront: '<path d="M110 -4q-14 20-2 34q-22-6-24 14q10-6 26-2q16-4 26 2q-2-20-24-14q12-14-2-34z" fill="#ffd34d" stroke="' + L + '" stroke-width="4.5" stroke-linejoin="round"/><path d="M110 12q-6 12 0 22q6-10 0-22z" fill="#f2593d"/>' }, ["#f2593d", "#a31515"]],
    "svg:pgold": ["pgold", { fur: ["#fff6c8", "#ffd65c", "#e8b22b"], belly: "#fffbe0", ears: "round", earIn: "#fff1b0", nose: "#e8b22b", badge: "#fff", defs: HORN_DEF, hfront: HORN + star(52, 38, 10, "#fff") + star(168, 36, 8, "#fff"), under: star(176, 122, 6, "#fff1b0") }, ["#ffb61e", "#c8780a"]],
    "svg:pregen": ["pregen", { fur: ["#ff9fb3", "#ffd27a", "#9be8a8", "#8ed0f8"], belly: "#ffffff", ears: "round", earIn: "#ffd6de", nose: "#ff8fa3", defs: HORN_DEF, hfront: HORN + star(50, 38, 9, "#ffd34d") + star(170, 36, 8, "#8ed0f8"), hback: mane(["#ff8fa3", "#ffd27a", "#8ed0f8", "#c6a4f5"]) }, ["#8f7dff", "#4a35c8"]],
    "svg:pgalaxie": ["galaxie", { fur: ["#8a74e0", "#4b3b8f", "#2b2166"], belly: "#6a55b8", ears: "round", earIn: "#7a63d1", nose: "#ff7fd0", eyes: "big", sclera: "#fff", pupil: "#2b2166", defs: HORN_DEF, hfront: HORN + star(52, 40, 8, "#ffe27a") + star(170, 38, 7, "#59d6f0"),
      under: star(76, 72, 6, "#fff") + star(150, 66, 5, "#ffe27a") + star(172, 112, 5, "#59d6f0"), badge: "#59d6f0" }, ["#ff7fd0", "#a02a90"]],
    "svg:fnhuhn": ["huhn", { fur: ["#ffffff", "#fff4e8", "#e6d0b8"], belly: "#ffffff", ears: "", face: "beak", cheek: true,
      hfront: '<g stroke="' + L + '" stroke-width="4" stroke-linejoin="round" fill="#ff4d4d"><circle cx="94" cy="40" r="12"/><circle cx="110" cy="32" r="14"/><circle cx="126" cy="40" r="12"/></g><path d="M104 138q6 16 12 0z" fill="#ff4d4d" stroke="' + L + '" stroke-width="3.5"/>',
      back: '<path d="M158 238q40-6 46-34q-26 4-38 18z" fill="#fff" stroke="' + L + '" stroke-width="4.5" stroke-linejoin="round"/>', hand: "#ffd23d" }, ["#ffd23d", "#e08a0a"]],
    "svg:fnschwein": ["schwein", { fur: ["#c8946a", "#8f5c35", "#5c3718"], belly: "#efbf9d", ears: "floppy", face: "pig", cheek: false,
      hfront: spikes("#3d2410", 3).replace(/L(\d+) 2L/g, "L$1 14L"), back: '<path d="M150 244q30 2 38-14q-14-4-22 4z" fill="#8f5c35" stroke="' + L + '" stroke-width="4"/>' }, ["#e94d4d", "#a31f1f"]],
    "svg:fnfrosch": ["frosch", { fur: ["#b8ff9a", "#52d44c", "#2c9a32"], belly: "#effec6", ears: "", eyes: "frog", face: "frog", cheek: false,
      hback: '<g stroke="' + L + '" stroke-width="5"><circle cx="72" cy="48" r="26" fill="url(#$If)"/><circle cx="148" cy="48" r="26" fill="url(#$If)"/></g><g><circle cx="72" cy="48" r="17" fill="#fff" stroke="' + L + '" stroke-width="3.5"/><circle cx="148" cy="48" r="17" fill="#fff" stroke="' + L + '" stroke-width="3.5"/><circle cx="75" cy="50" r="9" fill="' + L + '"/><circle cx="145" cy="50" r="9" fill="' + L + '"/><circle cx="78" cy="46" r="3.4" fill="#fff"/><circle cx="148" cy="46" r="3.4" fill="#fff"/></g>' }, ["#ffb347", "#e0661c"]],
    "svg:fnwolf": ["wolf", { fur: ["#e2e8f0", "#a0abbe", "#5d687e"], belly: "#ffffff", ears: "point", earIn: "#5d687e", face: "wolf", cheek: false, hand: "#a0abbe", back: tail("#a0abbe", "#fff") }, ["#e94d4d", "#a31f1f"]],
    "svg:fnraptor": ["raptor", { fur: ["#ffe08a", "#f4a62a", "#b86a0a"], belly: "#fff6d2", ears: "", face: "dino", under: '<path d="M70 58l16 14M96 48l8 18M124 48l-8 18M150 58l-16 14" stroke="#b86a0a" stroke-width="6" stroke-linecap="round"/>',
      hfront: spikes("#e9453c", 3).replace(/L(\d+) 2L/g, "L$1 8L"), back: tail("#f4a62a") }, ["#35c6ff", "#1a7fd0"]],
    "svg:fnllama": ["llama", { fur: ["#ff9ad0", "#b05cf0", "#4f7cf5", "#3bc4f2"], belly: "#e4b6ff", ears: "llama", face: "small", nose: "#ff8fb8", cheek: true,
      hfront: '<g stroke="' + L + '" stroke-width="3.5" stroke-linejoin="round"><path d="M80 42q4 18 12 6q4 14 12-2q6 14 12 0q8 12 12-2q6 12 12-6q6 8 8-4q-4-26-34-26q-30 0-34 28z" fill="#ffd34d"/></g>',
      back: '<circle cx="176" cy="238" r="18" fill="#ff7ec7" stroke="' + L + '" stroke-width="5"/>' }, ["#ffd34d", "#e08a0a"]],
    "svg:fnkristall": ["kristalllama", { fur: ["#ffffff", "#9fefff", "#7fa8ff", "#b58cff"], belly: "#f2fcff", ears: "llama", face: "small", nose: "#ff8fb8", cheek: false, under: FACETS,
      hfront: star(50, 40, 9, "#fff") + star(172, 38, 7, "#fff"), back: '<circle cx="176" cy="238" r="18" fill="#9fefff" stroke="' + L + '" stroke-width="5"/>', badge: "#fff" }, ["#b58cff", "#6a3fd0"]],
    "svg:fnelite": ["elite", { fur: ["#b8efff", "#5b8cff", "#7b4dff"], belly: "#d0ecff", ears: "", face: "gem", cheek: false, eyes: "big", sclera: "#fff", under: FACETS, hback: crystals(["#7be0ff", "#c9a7ff"]), badge: "#7be0ff" }, ["#7b4dff", "#3a1fb0"]],
    "svg:fnchamp": ["champ", { fur: ["#ffffff", "#cfe9ff", "#b9a6ff"], belly: "#ffffff", ears: "", face: "gem", cheek: false, eyes: "big", sclera: "#fff", under: FACETS, hback: crystals(["#ffffff", "#ffe58a"], true), hfront: star(60, 42, 8, "#ffd24a") + star(160, 42, 8, "#ffd24a"), badge: "#b9a6ff" }, ["#ffd24a", "#c8780a"]],
    "svg:fnunreal": ["unreal", { fur: ["#ff8fd0", "#8f7dff", "#37c6e8", "#ffd66b"], belly: "#ffffff", ears: "", face: "gem", cheek: false, eyes: "big", sclera: "#fff", under: FACETS, hback: crystals(["#ff8fd0", "#37c6e8"], true), hfront: star(54, 46, 9, "#fff") + star(166, 44, 9, "#fff"), badge: "#ff8fd0" }, ["#37c6e8", "#1a7fa0"]]
  };
  Object.keys(D).forEach(function (av) {
    var d = D[av], sp = d[1], c = d[2];
    A.register(av, d[0], function (jc, jd) { return critter(sp, jc, jd); }, c);
  });
})(window);
