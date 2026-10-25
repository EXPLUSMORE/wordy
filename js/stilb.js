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
    none: function () { return ""; },   // Figuren mit eigenem Mund (Zyklop, Golem)
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
    kit: function (sp) {   // Kitty: kein Mund, kleine gelbe Nase, je drei Schnurrhaare
      return '<ellipse cx="110" cy="120" rx="9" ry="6.5" fill="#ffd23d" stroke="' + L + '" stroke-width="3.5"/><ellipse cx="108" cy="118" rx="3" ry="1.8" fill="#fff" opacity=".8"/>' +
        '<path d="M34 100l34 7M30 116l36 2M34 132l34-6M186 100l-34 7M190 116l-36 2M186 132l-34-6" stroke="' + L + '" stroke-width="4" stroke-linecap="round"/>';
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
    if (sp.eyes === "kit") return '<ellipse cx="72" cy="106" rx="7.5" ry="10" fill="' + L + '"/><ellipse cx="148" cy="106" rx="7.5" ry="10" fill="' + L + '"/><ellipse cx="70" cy="102" rx="2.4" ry="3" fill="#fff" opacity=".85"/><ellipse cx="146" cy="102" rx="2.4" ry="3" fill="#fff" opacity=".85"/>';
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
      '<path d="M172 92q-4 34-34 52" stroke="#fff" stroke-width="6" stroke-linecap="round" opacity=".28" fill="none"/>' +
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
  function bolt(x, y, k, c) { return '<path d="M' + (x + 8 * k) + ' ' + (y - 22 * k) + 'l' + (-14 * k) + ' ' + 22 * k + 'h' + 10 * k + 'l' + (-8 * k) + ' ' + 22 * k + 'l' + 22 * k + ' ' + (-28 * k) + 'h' + (-11 * k) + 'z" fill="' + c + '" stroke="' + L + '" stroke-width="3.5" stroke-linejoin="round"/>'; }

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


  /* ---- Kitty-Zubehör (Schleife, Haarreifen, bunte Haare, Glitzer) ---- */
  function bow(x, y, c, k, rot) {
    k = k || 1;
    return '<g transform="translate(' + x + ' ' + y + ') rotate(' + (rot || 0) + ') scale(' + k + ')" stroke="' + L + '" stroke-width="4" stroke-linejoin="round"><path d="M0 0L-30-18Q-36 0-30 18z" fill="' + c + '"/><path d="M0 0L30-18Q36 0 30 18z" fill="' + c + '"/><circle r="9" fill="' + shade(c, 1.12) + '"/><path d="M-22-8l-4 10M22-8l4 10" stroke="#fff" stroke-width="3" opacity=".55" fill="none"/></g>';
  }
  function band(c, gem) {
    return '<path d="M46 86Q110-24 174 86" fill="none" stroke="' + L + '" stroke-width="15" stroke-linecap="round"/><path d="M46 86Q110-24 174 86" fill="none" stroke="' + c + '" stroke-width="8" stroke-linecap="round"/><path d="M62 56Q90 22 124 24" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".6"/>' + (gem || "");
  }
  function fringe(cols) {   // bunter Pony und Strähnen
    var s = "", n = cols.length, i; for (i = 0; i < n; i++) { var x = 66 + i * (88 / (n - 1)); s += '<path d="M' + (x - 11) + ' 40Q' + (x - 14) + ' 70 ' + x + ' 78Q' + (x + 14) + ' 70 ' + (x + 11) + ' 40z" fill="' + cols[i] + '" stroke="' + L + '" stroke-width="3.5" stroke-linejoin="round"/>'; }
    return s;
  }
  function pigtail(cx, cols, dir) {   // Zöpfe seitlich hinter dem Kopf
    return '<g stroke="' + L + '" stroke-width="4.5" stroke-linejoin="round"><ellipse cx="' + cx + '" cy="112" rx="17" ry="38" fill="' + cols[0] + '" transform="rotate(' + (dir * 14) + ' ' + cx + ' 112)"/><ellipse cx="' + (cx + dir * 4) + '" cy="136" rx="13" ry="28" fill="' + cols[1] + '" transform="rotate(' + (dir * 22) + ' ' + cx + ' 136)"/></g>';
  }
  var RB = ["#ff6b8f", "#ffb347", "#ffe066", "#7be08a", "#59c8ff", "#b58cff"];

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
    "svg:pphoenix": ["phoenix", { fur: ["#ffd9a0", "#ffb36b", "#f28a3d"], belly: "#fff0b0", ears: "", face: "beak", cheek: false,
      back: wings("#f2593d", "#ffd34d") + '<path d="M150 244q40 8 54-24q-24 6-30-12q-6 22-24 36z" fill="#ffd34d" stroke="' + L + '" stroke-width="4" stroke-linejoin="round"/>',
      hfront: '<path d="M110 -4q-14 20-2 34q-22-6-24 14q10-6 26-2q16-4 26 2q-2-20-24-14q12-14-2-34z" fill="#ffd34d" stroke="' + L + '" stroke-width="4.5" stroke-linejoin="round"/><path d="M110 12q-6 12 0 22q6-10 0-22z" fill="#f2593d"/>' }, ["#f2593d", "#a31515"]],
    "svg:pgold": ["pgold", { fur: ["#fff6c8", "#ffd65c", "#e8b22b"], belly: "#fffbe0", ears: "round", earIn: "#fff1b0", nose: "#e8b22b", badge: "#fff", defs: HORN_DEF, hfront: HORN + star(52, 38, 10, "#fff") + star(168, 36, 8, "#fff"), under: star(176, 122, 6, "#fff1b0") }, ["#ffb61e", "#c8780a"]],
    "svg:pregen": ["pregen", { fur: ["#ff9fb3", "#ffd27a", "#9be8a8", "#8ed0f8"], belly: "#ffffff", ears: "round", earIn: "#ffd6de", nose: "#ff8fa3", defs: HORN_DEF, hfront: HORN + star(50, 38, 9, "#ffd34d") + star(170, 36, 8, "#8ed0f8"), hback: mane(["#ff8fa3", "#ffd27a", "#8ed0f8", "#c6a4f5"]) }, ["#8f7dff", "#4a35c8"]],
    "svg:pgalaxie": ["galaxie", { fur: ["#8a74e0", "#4b3b8f", "#2b2166"], belly: "#6a55b8", ears: "round", earIn: "#7a63d1", nose: "#ff7fd0", eyes: "big", sclera: "#fff", pupil: "#2b2166", defs: HORN_DEF, hfront: HORN + star(52, 40, 8, "#ffe27a") + star(170, 38, 7, "#59d6f0"),
      under: star(76, 72, 6, "#fff") + star(150, 66, 5, "#ffe27a") + star(172, 112, 5, "#59d6f0"), badge: "#59d6f0" }, ["#ff7fd0", "#a02a90"]],
    "svg:blitzwolf": ["blitzwolf", { fur: ["#7a90e0", "#33448f", "#1b2660"], belly: "#cfe4ff", ears: "point", earIn: "#ffd84a", face: "wolf", cheek: false, eyes: "big", sclera: "#effcff", pupil: "#00b7d4", hand: "#33448f",
      under: bolt(66, 128, .55, "#ffd84a") + bolt(158, 126, .55, "#ffd84a"),
      hback: '<g>' + bolt(30, 78, 1.1, "#ffd84a") + '<animate attributeName="opacity" values="1;.25;1" dur=".9s" repeatCount="indefinite"/></g><g>' + bolt(196, 74, 1.1, "#7be9ff") + '<animate attributeName="opacity" values=".25;1;.25" dur=".9s" repeatCount="indefinite"/></g>',
      hfront: bolt(110, 62, .8, "#ffd84a") + '<path d="M70 22l12-14l8 12l20-22l20 22l8-12l12 14q-40 12-80 0z" fill="#ffd84a" stroke="' + L + '" stroke-width="4.5" stroke-linejoin="round"/>' + star(52, 44, 9, "#7be9ff") + star(170, 40, 8, "#ffd84a"), back: tail("#33448f", "#ffd84a"), badge: "#00e0ff" }, ["#ffd84a", "#c98a00"]],
    "svg:ninja": ["ninja", { fur: ["#7c6bb8", "#2e2358", "#17113a"], belly: "#8d7cc9", ears: "point", earIn: "#e63946", face: "cat", cheek: false, eyes: "big", sclera: "#fff", pupil: "#7a2cff", hand: "#2e2358", pants: "#171733", shoe: "#e63946",
      hfront: '<path d="M44 66Q110 42 176 66L178 90Q110 66 42 90z" fill="#e63946" stroke="' + L + '" stroke-width="5" stroke-linejoin="round"/><rect x="88" y="60" width="44" height="24" rx="6" fill="#d7dee9" stroke="' + L + '" stroke-width="4"/><path d="M110 64l5 8-5 8-5-8z" fill="#6c7890"/>' +
        '<path d="M170 72q28-14 40 4q-16 4-20 18q18 2 20 18q-26 2-40-22z" fill="#e63946" stroke="' + L + '" stroke-width="4.5" stroke-linejoin="round"/>',
      back: tail("#2e2358", "#e63946") + '<path d="M70 168q40 26 80 0l-8 16q-32 14-64 0z" fill="#e63946" stroke="' + L + '" stroke-width="4" stroke-linejoin="round"/>', badge: "#e63946" }, ["#4a4a78", "#171733"]],
    "svg:sdrache": ["sdrache", { fur: ["#9afbe6", "#1fb59a", "#0f6f7f"], belly: "#fff2b8", ears: "", face: "dino", cheek: false, eyes: "big", sclera: "#fff", pupil: "#6a2cff", hand: "#1fb59a",
      under: star(70, 76, 6, "#fff") + star(150, 70, 5, "#ffe27a") + star(172, 116, 5, "#7be9ff") + star(54, 118, 4, "#ffe27a"),
      back: wings("#3a2d8f", "#ffd34d") + tail("#1fb59a", "#ffd34d"),
      hback: '<path d="M54 64L36 0l54 36z" fill="#ffd34d" stroke="' + L + '" stroke-width="5" stroke-linejoin="round"/><path d="M166 64L184 0l-54 36z" fill="#ffd34d" stroke="' + L + '" stroke-width="5" stroke-linejoin="round"/>',
      hfront: '<path d="M78 40q4-26 14-12q4-24 18-34q14 10 18 34q10-14 14 12q-8 8-32 8q-24 0-32-8z" fill="#ffb61e" stroke="' + L + '" stroke-width="4.5" stroke-linejoin="round"/><path d="M96 42q4-14 14-22q10 8 14 22z" fill="#fff1a8"/>' + star(52, 46, 9, "#fff") + star(170, 42, 8, "#ffe27a"), badge: "#ffd34d" }, ["#6a4be0", "#2b1f8f"]],
    "svg:flamingo": ["flamingo", { fur: ["#ffc0dc", "#ff6fa8", "#d63f86"], belly: "#ffe0ef", ears: "", face: "beak", cheek: false, eyes: "big", sclera: "#fff", pupil: "#2b2166", hand: "#ff6fa8", pants: "#7a3cff", shoe: "#ffd34d",
      defs: '<radialGradient id="$Idb" cx=".35" cy=".3" r=".85"><stop offset="0" stop-color="#ffffff"/><stop offset=".6" stop-color="#bfc8e0"/><stop offset="1" stop-color="#7a86b0"/></radialGradient>',
      hfront: '<circle cx="110" cy="16" r="30" fill="url(#$Idb)" stroke="' + L + '" stroke-width="5"/><path d="M82 4h56M80 18h60M84 32h52M110 -14v60M94 -10q-14 30 0 54M126 -10q14 30 0 54" stroke="#fff" stroke-width="2.4" opacity=".75" fill="none"/>' +
        '<g opacity=".95"><rect x="90" y="4" width="8" height="8" fill="#ff6fa8"/><rect x="112" y="18" width="8" height="8" fill="#59c8ff"/><rect x="124" y="-2" width="8" height="8" fill="#ffd34d"/></g>' +
        '<path d="M164 -4l3 8 8 3-8 3-3 8-3-8-8-3 8-3z" fill="#fff"><animate attributeName="opacity" values="1;.15;1" dur="1.2s" repeatCount="indefinite"/></path><path d="M52 6l2 5 5 2-5 2-2 5-2-5-5-2 5-2z" fill="#ffe27a"><animate attributeName="opacity" values=".2;1;.2" dur="1.2s" repeatCount="indefinite"/></path>' +
        '<g stroke="' + L + '" stroke-width="4.5" stroke-linejoin="round"><path d="M80 108c-30-20-34-42-12-46c10-2 12 6 12 10c0-4 2-12 12-10c22 4 18 26-12 46z" fill="#ff2d78"/><path d="M140 108c-30-20-34-42-12-46c10-2 12 6 12 10c0-4 2-12 12-10c22 4 18 26-12 46z" fill="#ff2d78"/><path d="M96 78h28" fill="none"/></g><path d="M64 70q6-6 14-2M124 70q6-6 14-2" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".8" fill="none"/>' +
        '<path d="M70 156q40 38 80 0" fill="none" stroke="#14213d" stroke-width="9"/><path d="M70 156q40 38 80 0" fill="none" stroke="#ffd34d" stroke-width="5" stroke-dasharray="7 4"/><circle cx="110" cy="188" r="13" fill="#ffd34d" stroke="' + L + '" stroke-width="4"/><path d="M106 194v-10l8-2v8" fill="none" stroke="' + L + '" stroke-width="3" stroke-linejoin="round"/>',
      back: wings("#ff8fc0", "#ffd1e6") + tail("#ff6fa8", "#ffd34d"), badge: "#ffd34d" }, ["#7a3cff", "#3a1a9a"]],
    "svg:faultier": ["faultier", { fur: ["#d9b48a", "#a67c52", "#6e4b2c"], belly: "#f2dfc4", ears: "small", face: "muzzle", nose: "#3a2410", cheek: true, hand: "#a67c52", pants: "#6e4b2c", shoe: "#7be08a",
      under: '<path d="M44 92q22-34 50-10q-8 34-40 28z" fill="#5a3b1e"/><path d="M176 92q-22-34-50-10q8 34 40 28z" fill="#5a3b1e"/>',
      hfront: '<g stroke="' + L + '" stroke-width="4.5"><circle cx="80" cy="86" r="21" fill="#f6efe0"/><circle cx="140" cy="86" r="21" fill="#f6efe0"/></g><circle cx="84" cy="94" r="9" fill="' + L + '"/><circle cx="136" cy="94" r="9" fill="' + L + '"/><circle cx="87" cy="90" r="3" fill="#fff"/><circle cx="139" cy="90" r="3" fill="#fff"/>' +
        '<path d="M58 86a22 22 0 0 1 44 0z" fill="#a67c52" stroke="' + L + '" stroke-width="4.5" stroke-linejoin="round"/><path d="M118 86a22 22 0 0 1 44 0z" fill="#a67c52" stroke="' + L + '" stroke-width="4.5" stroke-linejoin="round"/>' +
        '<ellipse cx="110" cy="36" rx="66" ry="26" fill="#ff8fc0" stroke="' + L + '" stroke-width="5"/><ellipse cx="110" cy="36" rx="24" ry="9" fill="#a67c52" stroke="' + L + '" stroke-width="4"/><path d="M60 34q4-18 30-18M130 18q26 0 32 18" stroke="#fff" stroke-width="5" stroke-linecap="round" fill="none" opacity=".6"/>' +
        '<g stroke-width="5" stroke-linecap="round"><path d="M74 28l8 4" stroke="#fff"/><path d="M96 20l6 7" stroke="#7be9ff"/><path d="M130 22l-4 8" stroke="#ffe27a"/><path d="M150 32l8 3" stroke="#fff"/><path d="M84 46l-6 5" stroke="#b58cff"/><path d="M140 46l7 4" stroke="#fff"/></g>' +
        '<text x="168" y="30" font-size="30" font-weight="900" fill="#fff" stroke="' + L + '" stroke-width="2.5" font-family="Arial,sans-serif"><tspan>Z</tspan><animate attributeName="opacity" values="0;1;0" dur="2.4s" repeatCount="indefinite"/></text><text x="190" y="6" font-size="22" font-weight="900" fill="#fff" stroke="' + L + '" stroke-width="2" font-family="Arial,sans-serif"><tspan>z</tspan><animate attributeName="opacity" values="1;0;1" dur="2.4s" repeatCount="indefinite"/></text>',
      back: '<path d="M150 236q32-10 46 12q-26 10-46-2z" fill="#6e4b2c" stroke="' + L + '" stroke-width="4.5" stroke-linejoin="round"/>', badge: "#ff8fc0" }, ["#7be08a", "#2e9a4a"]],
    "svg:cyberfuchs": ["cyberfuchs", { fur: ["#3a4a8c", "#141c45", "#080c26"], belly: "#1d2a5e", ears: "point", earIn: "#00e5ff", face: "muzzle", nose: "#00e5ff", cheek: false, eyes: "big", sclera: "#001a2e", pupil: "#00f0ff", hand: "#141c45", pants: "#0b1233", shoe: "#00e5ff",
      under: '<g stroke="#00e5ff" stroke-width="3.5" stroke-linecap="round" fill="none"><path d="M56 112h22l8 10M164 112h-22l-8 10M70 140h24M126 140h24"/></g><g fill="#00e5ff"><circle cx="56" cy="112" r="4"/><circle cx="164" cy="112" r="4"/></g>',
      hfront: '<path d="M44 58Q110 34 176 58L178 76Q110 52 42 76z" fill="#0b1233" stroke="' + L + '" stroke-width="4.5" stroke-linejoin="round"/><g><circle cx="78" cy="62" r="5" fill="#ff3df0"/><circle cx="110" cy="56" r="5" fill="#00f0ff"/><circle cx="142" cy="62" r="5" fill="#ff3df0"/><animate attributeName="opacity" values="1;.4;1" dur="1.1s" repeatCount="indefinite"/></g>' +
        '<g stroke="' + L + '" stroke-width="4"><path d="M62 30V4M158 30V4" stroke="#7a5cff"/><circle cx="62" cy="4" r="8" fill="#ff3df0"/><circle cx="158" cy="4" r="8" fill="#ff3df0"/></g>',
      back: tail("#141c45", "#00e5ff"), badge: "#00e5ff" }, ["#ff3df0", "#7a1a9a"]],
    "svg:pirat": ["pirat", { fur: ["#ff8a7a", "#e02f3f", "#a31524"], belly: "#ffd34d", ears: "", face: "beak", cheek: false, eyes: "big", sclera: "#fff", pupil: "#1b1230", hand: "#e02f3f", pants: "#2a2a4a", shoe: "#5a3a1a",
      hfront: '<circle cx="80" cy="86" r="23" fill="#14121f" stroke="' + L + '" stroke-width="4.5"/><path d="M60 72L26 52M100 72L166 56" stroke="#14121f" stroke-width="6" stroke-linecap="round"/>' +
        '<path d="M40 56Q110-30 180 56Q110 38 40 56z" fill="#1b1b2f" stroke="' + L + '" stroke-width="5" stroke-linejoin="round"/><path d="M44 54Q110 36 176 54" fill="none" stroke="#ffd34d" stroke-width="5" stroke-linecap="round"/><circle cx="110" cy="14" r="17" fill="#fff" stroke="' + L + '" stroke-width="4"/><circle cx="103" cy="12" r="4" fill="' + L + '"/><circle cx="117" cy="12" r="4" fill="' + L + '"/><path d="M104 24h12" stroke="' + L + '" stroke-width="3.5" stroke-linecap="round"/>' +
        '<circle cx="168" cy="112" r="9" fill="none" stroke="#ffd34d" stroke-width="5"/>',
      back: wings("#3aa0ff", "#ffd34d") + tail("#3aa0ff", "#ffd34d"), badge: "#ffd34d" }, ["#c0392b", "#7a1a1a"]],
    "svg:zauber": ["zauber", { fur: ["#b9a3ff", "#6d4fd8", "#3b2791"], belly: "#e6dcff", ears: "point", earIn: "#ffd34d", face: "beak", cheek: false, eyes: "big", sclera: "#fff7d6", pupil: "#4b2fb8", hand: "#6d4fd8",
      hfront: '<path d="M60 56Q86 22 118 14Q146 8 170 30Q150 28 140 38L152 56z" fill="#3b2791" stroke="' + L + '" stroke-width="5" stroke-linejoin="round"/><ellipse cx="110" cy="56" rx="72" ry="14" fill="#4b2fb8" stroke="' + L + '" stroke-width="5"/><path d="M52 56Q110 70 168 56" fill="none" stroke="#ffd34d" stroke-width="5"/>' + star(106, 38, 11, "#ffe27a") + star(138, 26, 6, "#fff") + star(80, 32, 5, "#fff") +
        '<g><circle cx="184" cy="20" r="6" fill="#b58cff"/><animate attributeName="opacity" values="1;.2;1" dur="1.3s" repeatCount="indefinite"/></g><g><path d="M30 60l2 6 6 2-6 2-2 6-2-6-6-2 6-2z" fill="#ffe27a"/><animate attributeName="opacity" values=".2;1;.2" dur="1.3s" repeatCount="indefinite"/></g>',
      back: wings("#6d4fd8", "#ffe27a") + tail("#6d4fd8", "#ffe27a"), badge: "#ffe27a" }, ["#7a4fff", "#2b1a8f"]],
    "svg:greif": ["greif", { fur: ["#fffdf2", "#f6e7b8", "#d9a94a"], belly: "#fff1c2", ears: "point", earIn: "#e0a53a", face: "beak", cheek: false, eyes: "big", sclera: "#fff7d6", pupil: "#3b2108", hand: "#e0a53a", pants: "#7a4a1a", shoe: "#ffb020", badge: "#ffe27a",
      under: '<path d="M70 66q8 8 16 0M104 54q6 8 12 0M134 66q8 8 16 0M62 84q6 8 12 0M146 84q6 8 12 0" stroke="#d9a94a" stroke-width="3.5" fill="none" stroke-linecap="round"/>',
      back: wings("#e0a53a", "#ffe08a") + tail("#c98a2b", "#fff1c2"),
      hfront: '<path d="M76 46q-8-26 14-38q6 12 10 20q4-20 10-30q6 10 10 30q4-8 10-20q22 12 14 38q-18-12-34-10q-16-2-34 10z" fill="#e0a53a" stroke="' + L + '" stroke-width="4.5" stroke-linejoin="round"/><path d="M96 20q4 10 2 20M124 20q-4 10-2 20" stroke="#fff1c2" stroke-width="3.5" stroke-linecap="round" fill="none"/>' +
        '<path d="M56 72l36 12M164 72l-36 12" stroke="#6b3e0a" stroke-width="6" stroke-linecap="round"/>' }, ["#c98a2b", "#7a4a0a"]],
    "svg:kitsune": ["kitsune", { fur: ["#fff6ea", "#ffc48a", "#f2761a"], belly: "#ffffff", ears: "point", earIn: "#2b1a2a", nose: L, hand: "#2b1a2a", pants: "#7a1030", shoe: "#ffffff", badge: "#59d6ff",
      defs: '<linearGradient id="$Ikf" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#2f7bff"/><stop offset=".6" stop-color="#59d6ff"/><stop offset="1" stop-color="#e6fbff"/></linearGradient>',
      back: (function () {   // neun Schweife: einer in der Mitte, je vier links und rechts, Spitzen mit blauem Geisterfeuer
        function one(r, k) {
          return '<g transform="rotate(' + r + ' 110 250)"><path d="M110 250C124 200 148 158 196 120C204 168 192 220 152 252C136 260 120 258 110 250Z" fill="' + (k % 2 ? "#ffd2a0" : "#ffb36b") + '" stroke="' + L + '" stroke-width="5" stroke-linejoin="round"/><path d="M196 122C202 150 196 172 184 188C186 160 190 140 196 122Z" fill="#fff" opacity=".85"/><path d="M196 122q-12-12-2-34q13 20 2 34z" fill="url(#$Ikf)" stroke="' + L + '" stroke-width="3"><animate attributeName="opacity" values="1;.5;1" dur="' + (1 + k * .13) + 's" repeatCount="indefinite"/></path></g>';
        }
        var rs = [50, 28, 6, -16], out = "", k;
        for (k = 0; k < 4; k++) out += '<g transform="translate(220 0) scale(-1 1)">' + one(rs[k], k) + '</g>' + one(rs[k], k + 1);
        return out + one(-34, 2);
      })(),
      hfront: '<path d="M110 22q-14 14-4 30q-12-6-10 8q14-6 14-4q14-2 14 4q2-14-10-8q10-16-4-30z" fill="url(#$Ikf)" stroke="' + L + '" stroke-width="4" stroke-linejoin="round"><animate attributeName="opacity" values="1;.6;1" dur="1.2s" repeatCount="indefinite"/></path>' +
        '<path d="M74 70q-12 12-8 28M146 70q12 12 8 28M88 56l-6-8M132 56l6-8" stroke="#e8123c" stroke-width="5.5" fill="none" stroke-linecap="round"/>' +
        '<g fill="url(#$Ikf)" stroke="' + L + '" stroke-width="3"><path d="M40 36q-6 8-1 14q5-4 1-14z"/><path d="M180 50q-6 8-1 14q5-4 1-14z"/></g>' }, ["#e8123c", "#8e0a24"]],
    "svg:pegasus": ["pegasus", { fur: ["#ffffff", "#f4f8ff", "#c9d8f2"], belly: "#ffe0f0", ears: "point", earIn: "#ffc4de", face: "small", nose: "#ff8fb8", hand: "#c9d8f2", pants: "#2a4f9a", shoe: "#ffffff", badge: "#ffd34d",
      defs: '<linearGradient id="$Ipm" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#6fc3ff"/><stop offset=".5" stop-color="#b78cff"/><stop offset="1" stop-color="#ff9ec9"/></linearGradient>',
      hback: mane(["#6fc3ff", "#b78cff", "#ff9ec9", "#6fc3ff"]), back: wings("#ffffff", "#bfe4ff") + tail("#6fc3ff", "#ff9ec9"),
      hfront: '<path d="M66 60Q74 6 126 14Q164 22 156 66Q134 32 112 46Q92 24 66 60z" fill="url(#$Ipm)" stroke="' + L + '" stroke-width="4.5" stroke-linejoin="round"/><path d="M96 24q14 6 20 18" stroke="#fff" stroke-width="3.5" stroke-linecap="round" opacity=".7" fill="none"/>' + star(110, 30, 11, "#ffd34d") + star(52, 40, 6, "#fff") + star(170, 36, 7, "#ffe27a") }, ["#59c8ff", "#1f7fd0"]],
    "svg:zyklop": ["zyklop", { fur: ["#b6f7df", "#5fd3b0", "#1f8f6a"], belly: "#d8fff0", ears: "round", earIn: "#4cbf9c", face: "none", eyes: "frog", hand: "#5fd3b0", pants: "#4b3bb0", shoe: "#ffd34d", badge: "#ffb020",
      hback: '<path d="M66 64L44 4L100 44z" fill="#fff3c9" stroke="' + L + '" stroke-width="5" stroke-linejoin="round"/><path d="M154 64L176 4L120 44z" fill="#fff3c9" stroke="' + L + '" stroke-width="5" stroke-linejoin="round"/><path d="M58 40l12 4M162 40l-12 4" stroke="#c9a24a" stroke-width="3" stroke-linecap="round"/>',
      hfront: '<circle cx="110" cy="82" r="35" fill="#fff" stroke="' + L + '" stroke-width="5"/><circle cx="112" cy="84" r="21" fill="#ffb020" stroke="' + L + '" stroke-width="3"/><circle cx="112" cy="84" r="11" fill="#2b1a00"/><circle cx="118" cy="76" r="5" fill="#fff"/><circle cx="105" cy="92" r="2.4" fill="#fff"/>' +
        '<path d="M66 50q44-26 88 0" stroke="' + L + '" stroke-width="9" stroke-linecap="round" fill="none"/>' +
        '<path d="M70 124q40 24 80 0q-4 30-40 30q-36 0-40-30z" fill="#7a1630" stroke="' + L + '" stroke-width="5" stroke-linejoin="round"/><path d="M80 128l9 22l9-20z" fill="#fff3c9" stroke="' + L + '" stroke-width="3" stroke-linejoin="round"/><path d="M140 128l-9 22l-9-20z" fill="#fff3c9" stroke="' + L + '" stroke-width="3" stroke-linejoin="round"/><ellipse cx="110" cy="146" rx="15" ry="6" fill="#ff6f8e"/>' }, ["#ff7a3d", "#c2400a"]],
    "svg:sphinx": ["sphinx", { fur: ["#ffe9a8", "#f2c14e", "#b88a1f"], belly: "#fff3c9", ears: "", face: "cat", eyes: "big", sclera: "#fff", pupil: "#1b1230", cheek: false, hand: "#f2c14e", pants: "#173f8f", shoe: "#ffd34d", badge: "#2f7be8",
      defs: '<linearGradient id="$Isp" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#2f7be8"/><stop offset=".5" stop-color="#ffd34d"/><stop offset="1" stop-color="#2f7be8"/></linearGradient>',
      hback: '<path d="M64 44Q16 70 26 154L84 132L78 72z" fill="url(#$Isp)" stroke="' + L + '" stroke-width="5" stroke-linejoin="round"/><path d="M156 44Q204 70 194 154L136 132L142 72z" fill="url(#$Isp)" stroke="' + L + '" stroke-width="5" stroke-linejoin="round"/><path d="M34 90l40 8M32 108l44 6M32 126l46 4M186 90l-40 8M188 108l-44 6M188 126l-46 4" stroke="' + L + '" stroke-width="3" opacity=".55"/>',
      back: wings("#ffe9a8", "#2f7be8") + tail("#f2c14e", "#2f7be8"),
      hfront: '<path d="M50 70Q52 12 110 8Q168 12 170 70Q142 40 110 40Q78 40 50 70z" fill="url(#$Isp)" stroke="' + L + '" stroke-width="5" stroke-linejoin="round"/><path d="M70 50l10 12M96 30l6 14M124 30l-6 14M150 50l-10 12" stroke="' + L + '" stroke-width="3" opacity=".5"/>' +
        '<path d="M110 6q-14 7-10 22q10-3 10-10q0 7 10 10q4-15-10-22z" fill="#ffd34d" stroke="' + L + '" stroke-width="4" stroke-linejoin="round"/><circle cx="106" cy="16" r="2" fill="' + L + '"/>' +
        '<path d="M50 90q16-8 32 2M170 90q-16-8-32 2M44 98l14 6M176 98l-14 6" stroke="' + L + '" stroke-width="5" stroke-linecap="round" fill="none"/>' +
        '<path d="M92 146Q110 188 128 146L124 192Q110 204 96 192z" fill="url(#$Isp)" stroke="' + L + '" stroke-width="4.5" stroke-linejoin="round"/>' }, ["#2f7be8", "#173f8f"]],
    "svg:golem": ["golem", { fur: ["#aab0c6", "#6b7088", "#3c4055"], belly: "#4a4f66", ears: "small", face: "none", eyes: "frog", cheek: false, hand: "#4a4f66", pants: "#2b2f45", shoe: "#3a3f55", badge: "#ff8a1f",
      hback: '<path d="M64 62L46 8L98 44z" fill="#5a5f73" stroke="' + L + '" stroke-width="5" stroke-linejoin="round"/><path d="M156 62L174 8L122 44z" fill="#5a5f73" stroke="' + L + '" stroke-width="5" stroke-linejoin="round"/>',
      under: '<g fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M70 52l12 18-8 12 14 14M146 56l-12 16l10 10M104 34l-4 14l10 12" stroke="' + L + '" stroke-width="9"/><path d="M70 52l12 18-8 12 14 14M146 56l-12 16l10 10M104 34l-4 14l10 12" stroke="#ff8a1f" stroke-width="5"/><path d="M70 52l12 18-8 12 14 14M146 56l-12 16l10 10M104 34l-4 14l10 12" stroke="#ffe08a" stroke-width="1.8"/></g>',
      hfront: '<ellipse cx="80" cy="90" rx="17" ry="14" fill="#ff8a1f" stroke="' + L + '" stroke-width="4.5"><animate attributeName="fill" values="#ff8a1f;#ffc04d;#ff8a1f" dur="1.6s" repeatCount="indefinite"/></ellipse><ellipse cx="140" cy="90" rx="17" ry="14" fill="#ff8a1f" stroke="' + L + '" stroke-width="4.5"><animate attributeName="fill" values="#ff8a1f;#ffc04d;#ff8a1f" dur="1.6s" repeatCount="indefinite"/></ellipse><ellipse cx="80" cy="90" rx="7" ry="6" fill="#fff3b0"/><ellipse cx="140" cy="90" rx="7" ry="6" fill="#fff3b0"/>' +
        '<path d="M76 128l14 10l10-12l10 12l10-12l14 10" fill="none" stroke="' + L + '" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/><path d="M76 128l14 10l10-12l10 12l10-12l14 10" fill="none" stroke="#ff8a1f" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>' +
        '<ellipse cx="152" cy="50" rx="22" ry="9" fill="#7bcb5a" stroke="' + L + '" stroke-width="3.5"/><circle cx="160" cy="40" r="5" fill="#ff8fb8" stroke="' + L + '" stroke-width="2.5"/>' }, ["#ff8a1f", "#b3360a"]],
    "svg:prisma": ["prisma", { fur: ["#ff9fb3", "#ffd27a", "#9be8a8", "#8ed0f8"], belly: "#ffffff", ears: "", face: "dino", cheek: false, hand: "#9be8a8", pants: "#7a5fe0", shoe: "#ffffff", badge: "#ffffff", under: FACETS,
      back: wings("#cfeaff", "#ffffff") + tail("#9be8a8", "#ffd27a"),
      hback: '<path d="M60 64L42 6L92 42z" fill="#e8fbff" stroke="' + L + '" stroke-width="5" stroke-linejoin="round"/><path d="M160 64L178 6L128 42z" fill="#e8fbff" stroke="' + L + '" stroke-width="5" stroke-linejoin="round"/>',
      hfront: crystals(["#bff4ff", "#ffffff"], false) + star(48, 44, 8, "#fff") + star(176, 40, 9, "#ffe27a") + star(40, 120, 6, "#fff") }, ["#8f7dff", "#4a2fd0"]],
    "svg:nebelwal": ["nebelwal", { fur: ["#7f9bff", "#4660e8", "#1f2a8f"], belly: "#dfe9ff", ears: "", face: "small", nose: "#ff8fb8", hand: "#4660e8", pants: "#1f2a8f", shoe: "#cfe0ff", badge: "#ffe27a",
      under: '<g fill="#fff"><circle cx="64" cy="78" r="3"/><circle cx="160" cy="70" r="4"/><circle cx="80" cy="50" r="2.6"/><circle cx="144" cy="44" r="3"/><circle cx="172" cy="104" r="2.6"/><circle cx="52" cy="108" r="3"/></g>' + star(150, 84, 7, "#ffe27a") + star(70, 62, 5, "#fff"),
      back: '<path d="M148 244Q196 252 206 196Q184 206 176 222Q172 196 150 200z" fill="#4660e8" stroke="' + L + '" stroke-width="5" stroke-linejoin="round"/><path d="M62 178q-50-30-52 22q4 20 48 20z" fill="#3b4fd0" stroke="' + L + '" stroke-width="5" stroke-linejoin="round"/>',
      hfront: '<path d="M110 44Q84 22 110 0Q136 22 110 44z" fill="#bff4ff" stroke="' + L + '" stroke-width="4.5" stroke-linejoin="round"><animate attributeName="opacity" values="1;.6;1" dur="1.6s" repeatCount="indefinite"/></path><g fill="#bff4ff" stroke="' + L + '" stroke-width="3"><circle cx="84" cy="14" r="5"/><circle cx="138" cy="10" r="4"/><circle cx="96" cy="-6" r="3.4"/></g>' }, ["#5c7cff", "#1f2a8f"]],
    "svg:donnervogel": ["donnervogel", { fur: ["#5a6cff", "#2b3a8f", "#141c5e"], belly: "#9fb0ff", ears: "", face: "beak", cheek: false, eyes: "big", sclera: "#fff6b0", pupil: "#14213d", hand: "#2b3a8f", pants: "#141c5e", shoe: "#ffe04a", badge: "#ffe04a",
      back: wings("#ffe04a", "#fff3a0") + bolt(190, 250, 2.4, "#ffe04a"),
      under: '<path d="M52 92l14-6-6 14l14-6M168 92l-14-6 6 14l-14-6" fill="none" stroke="#ffe04a" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>',
      hfront: '<path d="M70 52l12-44l8 22l12-34l12 34l8-22l12 44z" fill="#ffe04a" stroke="' + L + '" stroke-width="4.5" stroke-linejoin="round"/><path d="M98 20l6 14M122 20l-6 14" stroke="#fff3a0" stroke-width="3.5" stroke-linecap="round"/>' }, ["#ffe04a", "#c99a00"]],
    "svg:sonnenloewe": ["sonnenloewe", { fur: ["#ffe27a", "#ffc24a", "#e08a0a"], belly: "#fff3c9", ears: "round", earIn: "#ff9a3d", face: "cat", cheek: false, hand: "#ffc24a", pants: "#c2400a", shoe: "#ffd34d", badge: "#fff3a0",
      hback: '<path d="M110,2 L128,24 L153,12 L160,39 L188,39 L182,66 L207,78 L190,100 L207,122 L182,134 L188,161 L160,161 L153,188 L128,176 L110,198 L92,176 L67,188 L60,161 L32,161 L38,134 L13,122 L30,100 L13,78 L38,66 L32,39 L60,39 L67,12 L92,24z" fill="#ff9a1f" stroke="' + L + '" stroke-width="5" stroke-linejoin="round"/><circle cx="110" cy="100" r="78" fill="#ffc24a" stroke="' + L + '" stroke-width="4"/>',
      back: tail("#ffc24a", "#ff7a1f"),
      hfront: '<path d="M92 50q4-32 18-50q14 18 18 50q-18-8-36 0z" fill="#ffe27a" stroke="' + L + '" stroke-width="4.5" stroke-linejoin="round"><animate attributeName="opacity" values="1;.7;1" dur="1.3s" repeatCount="indefinite"/></path>' + star(60, 40, 7, "#fff3a0") + star(164, 44, 7, "#fff3a0") }, ["#ffb32e", "#c2400a"]],
    "svg:athene": ["athene", { fur: ["#fff1c2", "#f2e2b4", "#c9a24a"], belly: "#fff8dc", ears: "point", earIn: "#e8c06a", face: "beak", cheek: false, eyes: "big", sclera: "#fff7d6", pupil: "#2b1a00", hand: "#e8c06a", pants: "#7a4a1a", shoe: "#ffd34d", badge: "#ffd34d",
      back: wings("#ffd34d", "#fff3a0") + tail("#c98a2b", "#fff1c2"),
      hfront: '<path d="M52 84Q50 18 110 14Q170 18 168 84Q140 58 110 58Q80 58 52 84z" fill="#ffd34d" stroke="' + L + '" stroke-width="5" stroke-linejoin="round"/><path d="M64 40Q110 26 156 40" stroke="#fff3a0" stroke-width="5" fill="none" opacity=".85" stroke-linecap="round"/><path d="M70 24Q110-34 150 24Q130 8 110 30Q90 8 70 24z" fill="#e8123c" stroke="' + L + '" stroke-width="5" stroke-linejoin="round"/><path d="M104 58h12v32l-6 8l-6-8z" fill="#ffd34d" stroke="' + L + '" stroke-width="4" stroke-linejoin="round"/>' }, ["#ffd34d", "#b8860b"]],
    "svg:goldkrake": ["goldkrake", { fur: ["#fff0a0", "#ffc83a", "#e8a81e"], belly: "#fff3c9", ears: "", face: "small", nose: "#ff8fb8", eyes: "big", sclera: "#fff", pupil: "#3b2108", hand: "#ffc83a", cheek: true,
      hback: '<ellipse cx="110" cy="46" rx="58" ry="48" fill="url(#$If)" stroke="' + L + '" stroke-width="5"/>',
      legs: '<g stroke="' + L + '" stroke-width="5" stroke-linejoin="round" fill="#ffc83a"><path d="M70 226q-16 30 6 46q12-6 8-16q-4-14 6-30z"/><path d="M96 232q-4 34 14 40q16-6 6-40z"/><path d="M124 232q-10 34 6 40q18-6 14-40z"/><path d="M150 226q16 30-6 46q-12-6-8-16q4-14-6-30z"/></g><g fill="#fff3a0" opacity=".9"><circle cx="76" cy="258" r="3"/><circle cx="108" cy="262" r="3"/><circle cx="136" cy="262" r="3"/><circle cx="150" cy="256" r="3"/></g>',
      hfront: '<path d="M68 54l-4-36l30 22l16-40l16 40l30-22l-4 36q-42 12-84 0z" fill="#fff3a0" stroke="' + L + '" stroke-width="5" stroke-linejoin="round"/><circle cx="110" cy="22" r="6" fill="#e8123c" stroke="' + L + '" stroke-width="3"/><circle cx="82" cy="36" r="4.4" fill="#59c8ff" stroke="' + L + '" stroke-width="3"/><circle cx="138" cy="36" r="4.4" fill="#59c8ff" stroke="' + L + '" stroke-width="3"/>' }, ["#e8a81e", "#8a5a00"]],
    "svg:fenrir": ["fenrir", { fur: ["#f4f7ff", "#b8c4d8", "#6d7a94"], belly: "#ffffff", ears: "point", earIn: "#6d7a94", face: "wolf", cheek: false, eyes: "big", sclera: "#dff7ff", pupil: "#1b8fb8", hand: "#b8c4d8", pants: "#3a4560", shoe: "#cfd8ea", badge: "#59d6ff",
      hback: mane(["#ffffff", "#b8c4d8", "#d9e4f5", "#ffffff"]), back: tail("#b8c4d8", "#ffffff"),
      hfront: '<path d="M52 68Q110 40 168 68L170 86Q110 60 50 86z" fill="#b8c4d8" stroke="' + L + '" stroke-width="5" stroke-linejoin="round"/><path d="M110 30l12 16l-12 16l-12-16z" fill="#59d6ff" stroke="' + L + '" stroke-width="4.5" stroke-linejoin="round"><animate attributeName="opacity" values="1;.55;1" dur="1.4s" repeatCount="indefinite"/></path><path d="M150 76l14 30" stroke="#6d7a94" stroke-width="6" stroke-linecap="round"/>' }, ["#b8c4d8", "#4a5570"]],
    "svg:mondhase": ["mondhase", { fur: ["#ffffff", "#eef2ff", "#b8c4e8"], belly: "#ffffff", ears: "long", earIn: "#ffc4de", face: "bunny", cheek: true, hand: "#eef2ff", pants: "#4b3bb0", shoe: "#ffe27a", badge: "#ffd34d",
      back: '<circle cx="170" cy="240" r="24" fill="#fff" stroke="' + L + '" stroke-width="5"/>',
      hfront: '<path d="M120 28a28 28 0 1 0 0 52a22 22 0 1 1 0-52z" fill="#ffd34d" stroke="' + L + '" stroke-width="5" stroke-linejoin="round"><animate attributeName="opacity" values="1;.75;1" dur="2.2s" repeatCount="indefinite"/></path>' + star(150, 40, 7, "#fff3a0") + star(64, 52, 6, "#fff3a0") + star(170, 96, 5, "#ffe27a") }, ["#7a63f0", "#3a2da8"]],
    "svg:zeitschildi": ["zeitschildi", { fur: ["#bff3e4", "#8ee0c8", "#4fa89a"], belly: "#d9f7ec", ears: "", face: "small", nose: "#2e8a7a", cheek: true, hand: "#8ee0c8", pants: "#3a4a6e", shoe: "#ffd34d", badge: "#ffd34d",
      back: '<g stroke="' + L + '" stroke-width="5" stroke-linejoin="round"><ellipse cx="110" cy="196" rx="100" ry="88" fill="#6d7fa6"/><ellipse cx="110" cy="196" rx="82" ry="72" fill="#9aa8c4"/></g><g stroke="' + L + '" stroke-width="4" stroke-linecap="round" opacity=".55"><path d="M110 124v-4M110 268v4M28 196h-4M192 196h4"/></g><circle cx="34" cy="150" r="11" fill="none" stroke="#ffd34d" stroke-width="6" stroke-dasharray="7 4"><animateTransform attributeName="transform" type="rotate" from="0 34 150" to="360 34 150" dur="6s" repeatCount="indefinite"/></circle><circle cx="188" cy="236" r="9" fill="none" stroke="#ffd34d" stroke-width="5" stroke-dasharray="6 3"><animateTransform attributeName="transform" type="rotate" from="360 188 236" to="0 188 236" dur="5s" repeatCount="indefinite"/></circle>',
      hfront: '<circle cx="110" cy="46" r="26" fill="#fff" stroke="' + L + '" stroke-width="5"/><g stroke="' + L + '" stroke-width="3" stroke-linecap="round"><path d="M110 24v6M110 62v6M88 46h6M126 46h6"/></g><g stroke="' + L + '" stroke-width="4.5" stroke-linecap="round"><path d="M110 46v-16"/><path d="M110 46l12 8"><animateTransform attributeName="transform" type="rotate" from="0 110 46" to="360 110 46" dur="6s" repeatCount="indefinite"/></path></g><circle cx="110" cy="46" r="3.6" fill="#e8123c"/>' }, ["#5a6ccf", "#2a3a8f"]],
    "svg:kristallhirsch": ["kristallhirsch", { fur: ["#ffffff", "#f2f8ff", "#9cc4f0"], belly: "#dcefff", ears: "small", face: "small", nose: "#2b3a8f", cheek: false, eyes: "big", sclera: "#fff", pupil: "#2b3a8f", hand: "#f2f8ff", pants: "#3e7fc8", shoe: "#bff4ff", badge: "#bff4ff", under: FACETS,
      hback: '<g stroke="' + L + '" stroke-width="4.5" stroke-linejoin="round" fill="#bfe9ff"><path d="M74 66L38 26L52 20L44 -6L68 14L76 -14L90 22L100 58z"/><path d="M146 66L182 26L168 20L176 -6L152 14L144 -14L130 22L120 58z"/></g><path d="M52 24l10 14M70 8l4 16M168 24l-10 14M150 8l-4 16" stroke="#fff" stroke-width="3.5" stroke-linecap="round" opacity=".8"/>',
      back: tail("#f2f8ff", "#bfe9ff"),
      hfront: '<path d="M110 30l12 16l-12 16l-12-16z" fill="#bff4ff" stroke="' + L + '" stroke-width="4.5" stroke-linejoin="round"/>' + star(58, 60, 7, "#fff") + star(166, 56, 7, "#bff4ff") }, ["#6fc3ff", "#1f6fd0"]],
    "svg:nebelpanther": ["nebelpanther", { fur: ["#8a4fd8", "#3a2a7a", "#14123a"], belly: "#4b3a9a", ears: "point", earIn: "#ff7fd0", face: "cat", cheek: false, eyes: "big", sclera: "#aaf8ff", pupil: "#14213d", hand: "#3a2a7a", pants: "#14123a", shoe: "#00e5ff", badge: "#ff7fd0",
      under: '<g fill="#fff"><circle cx="62" cy="70" r="3"/><circle cx="158" cy="64" r="3.6"/><circle cx="84" cy="48" r="2.6"/><circle cx="138" cy="44" r="3"/><circle cx="170" cy="100" r="2.6"/><circle cx="50" cy="104" r="3"/><circle cx="110" cy="40" r="2.4"/></g>' + star(150, 80, 6, "#ffe27a") + star(70, 56, 5, "#fff"),
      back: tail("#3a2a7a", "#00e5ff"),
      hfront: '<path d="M56 62q22-16 42 0M122 62q22-16 42 0" stroke="#00e5ff" stroke-width="6" fill="none" stroke-linecap="round"><animate attributeName="opacity" values="1;.5;1" dur="1.5s" repeatCount="indefinite"/></path>' }, ["#8a4fd8", "#3a1f8f"]],
    "svg:qilin": ["qilin", { fur: ["#7df0c0", "#46e0a4", "#1f9c74"], belly: "#fff3c9", ears: "", face: "small", nose: "#ffb84d", cheek: false, hand: "#46e0a4", pants: "#b8300f", shoe: "#ffd34d", badge: "#ffd34d",
      hback: mane(["#ff6a3d", "#ffb347", "#ff6a3d", "#ffd34d"]) + '<path d="M80 60L58 12L74 20L72-6L92 28z" fill="#ffd34d" stroke="' + L + '" stroke-width="4.5" stroke-linejoin="round"/><path d="M140 60L162 12L146 20L148-6L128 28z" fill="#ffd34d" stroke="' + L + '" stroke-width="4.5" stroke-linejoin="round"/>',
      back: tail("#ff6a3d", "#ffd34d"),
      under: '<g fill="#7df0c0" opacity=".8" stroke="#1f9c74" stroke-width="2"><path d="M54 96q8-8 16 0q-8 8-16 0zM150 96q8-8 16 0q-8 8-16 0zM72 66q8-8 16 0q-8 8-16 0zM132 66q8-8 16 0q-8 8-16 0z"/></g>',
      hfront: '<circle cx="110" cy="54" r="11" fill="#fff3a0" stroke="' + L + '" stroke-width="4"><animate attributeName="opacity" values="1;.7;1" dur="1.8s" repeatCount="indefinite"/></circle><path d="M60 122q-30 4-44 24M160 122q30 4 44 24" stroke="' + L + '" stroke-width="10" stroke-linecap="round" fill="none"/><path d="M60 122q-30 4-44 24M160 122q30 4 44 24" stroke="#ffd34d" stroke-width="5" stroke-linecap="round" fill="none"/>' }, ["#ff6a3d", "#b8300f"]],
    "svg:unreallama": ["unreallama", { fur: ["#ff8fd0", "#8f7dff", "#37c6e8", "#ffd66b"], belly: "#ffffff", ears: "llama", face: "small", nose: "#ff8fb8", cheek: true, hand: "#8f7dff", pants: "#6a4be0", shoe: "#ffd34d", badge: "#fff3a0", under: FACETS,
      defs: '<radialGradient id="$Iau" cx=".5" cy=".5" r=".5"><stop offset=".55" stop-color="#fff3a0" stop-opacity=".0"/><stop offset=".8" stop-color="#fff3a0" stop-opacity=".75"/><stop offset="1" stop-color="#ff8fd0" stop-opacity="0"/></radialGradient>',
      hback: '<circle cx="110" cy="100" r="104" fill="url(#$Iau)"><animate attributeName="opacity" values=".5;1;.5" dur="2.2s" repeatCount="indefinite"/></circle>' + crystals(["#ff8fd0", "#37c6e8"], true),
      back: wings("#ff8fd0", "#ffd66b") + '<g fill="#fff"><circle cx="24" cy="170" r="3.5"><animate attributeName="opacity" values="1;.2;1" dur="1.2s" repeatCount="indefinite"/></circle><circle cx="198" cy="160" r="3.5"><animate attributeName="opacity" values=".2;1;.2" dur="1.2s" repeatCount="indefinite"/></circle><circle cx="20" cy="230" r="3"/><circle cx="202" cy="236" r="3"/></g>',
      hfront: '<ellipse cx="110" cy="20" rx="44" ry="11" fill="none" stroke="' + L + '" stroke-width="12"/><ellipse cx="110" cy="20" rx="44" ry="11" fill="none" stroke="#ffe27a" stroke-width="6"><animate attributeName="opacity" values="1;.7;1" dur="1.6s" repeatCount="indefinite"/></ellipse><path d="M70 62l8-30l22 22l10-32l10 32l22-22l8 30q-40 12-80 0z" fill="#ffd34d" stroke="' + L + '" stroke-width="5" stroke-linejoin="round"/><circle cx="110" cy="34" r="6" fill="#e8123c" stroke="' + L + '" stroke-width="3"/><circle cx="84" cy="46" r="4" fill="#59c8ff" stroke="' + L + '" stroke-width="3"/><circle cx="136" cy="46" r="4" fill="#59c8ff" stroke="' + L + '" stroke-width="3"/>' + star(50, 70, 8, "#fff") + star(172, 66, 9, "#ffe27a") }, ["#8f7dff", "#4a2fd0"]],
    "svg:gepard": ["gepard", { fur: ["#ffe27a", "#f6b73c", "#c27a14"], belly: "#fff3c9", ears: "round", earIn: "#3b2410", face: "cat", cheek: false, eyes: "big", sclera: "#fff", pupil: "#2b1a00", hand: "#f6b73c", pants: "#2b2f45", shoe: "#ff5a36",
      under: '<g fill="#3b2410"><circle cx="70" cy="140" r="4"/><circle cx="150" cy="140" r="4"/><circle cx="82" cy="170" r="4.5"/><circle cx="138" cy="170" r="4.5"/><circle cx="110" cy="196" r="4"/></g>',
      hfront: '<g fill="#3b2410"><circle cx="76" cy="38" r="4"/><circle cx="144" cy="38" r="4"/><circle cx="60" cy="70" r="3.5"/><circle cx="160" cy="70" r="3.5"/><circle cx="98" cy="24" r="3"/><circle cx="122" cy="24" r="3"/></g><path d="M80 98q-6 14-2 26M140 98q6 14 2 26" fill="none" stroke="#3b2410" stroke-width="5" stroke-linecap="round"/>' +
        '<path d="M44 52Q110 28 176 52L178 70Q110 46 42 70z" fill="#ff5a36" stroke="' + L + '" stroke-width="4.5" stroke-linejoin="round"/><g stroke="' + L + '" stroke-width="4.5"><circle cx="82" cy="58" r="17" fill="#7be9ff" fill-opacity=".7"/><circle cx="138" cy="58" r="17" fill="#7be9ff" fill-opacity=".7"/></g><path d="M72 52l9-5M128 52l9-5" stroke="#fff" stroke-width="4" stroke-linecap="round"/>' +
        '<path d="M22 112h30M14 128h36M198 112h-30M206 128h-36" stroke="#ffffff" stroke-width="5" stroke-linecap="round" opacity=".9"/>',
      back: tail("#f6b73c", "#3b2410"), badge: "#ff5a36" }, ["#ff5a36", "#a8260c"]],
    "svg:yeti": ["yeti", { fur: ["#ffffff", "#e4f1ff", "#b6d4f2"], belly: "#a9d6ff", ears: "small", face: "muzzle", nose: "#2b4a8a", cheek: true, hand: "#e4f1ff", pants: "#2e5fb8", shoe: "#2e5fb8",
      hback: '<g stroke="' + L + '" stroke-width="5"><ellipse cx="44" cy="104" rx="28" ry="46" fill="#e4f1ff"/><ellipse cx="176" cy="104" rx="28" ry="46" fill="#e4f1ff"/></g>',
      under: '<path d="M40 96l14 8M180 96l-14 8M44 124l14-4M176 124l-14-4" stroke="#b6d4f2" stroke-width="5" stroke-linecap="round"/>',
      hfront: '<g stroke="' + L + '" stroke-width="4.5" stroke-linejoin="round"><path d="M70 50l-12-44l36 30z" fill="#cff6ff"/><path d="M96 40L110-14l14 54z" fill="#9fefff"/><path d="M126 36l32-30l-8 44z" fill="#cff6ff"/></g>' + star(52, 66, 8, "#fff") + star(170, 62, 7, "#9fefff"),
      badge: "#9fefff" }, ["#7fb8ff", "#2e5fb8"]],
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
    "svg:fnrakete": ["raketenlama", { fur: ["#ffe08a", "#ff9a3d", "#f0503a", "#b8262e"], belly: "#ffd7a8", ears: "llama", face: "small", nose: "#ff8fb8", cheek: true,
      hfront: '<g stroke="' + L + '" stroke-width="3.5" stroke-linejoin="round"><path d="M80 42q4 18 12 6q4 14 12-2q6 14 12 0q8 12 12-2q6 12 12-6q6 8 8-4q-4-26-34-26q-30 0-34 28z" fill="#ff3d2e"/><path d="M92 40q4-12 12-4q6-14 14-2q8-10 14 4" fill="none" stroke="#ffd34d" stroke-width="4" stroke-linecap="round"/><path d="M88 34q2-8 8-10" fill="none" stroke="#ff9a3d" stroke-width="3.5" stroke-linecap="round"/></g>' +
        '<path d="M44 62Q110 38 176 62L178 78Q110 54 42 78z" fill="#5a3a29" stroke="' + L + '" stroke-width="4.5" stroke-linejoin="round"/><g stroke="' + L + '" stroke-width="4.5"><circle cx="82" cy="70" r="20" fill="#7be9ff" fill-opacity=".6"/><circle cx="138" cy="70" r="20" fill="#7be9ff" fill-opacity=".6"/></g><path d="M70 62l10-6M126 62l10-6" stroke="#fff" stroke-width="4" stroke-linecap="round"/>',
      back: '<g stroke="' + L + '" stroke-width="5" stroke-linejoin="round"><rect x="22" y="156" width="30" height="74" rx="15" fill="#c9d2e0"/><rect x="168" y="156" width="30" height="74" rx="15" fill="#aeb9cc"/><path d="M22 176h30M168 176h30M22 214h30M168 214h30" stroke="#e0453a" stroke-width="7" stroke-linecap="round"/></g>' +
        '<path d="M37 228q-16 22-4 52q4-14 8 0q12-30-4-52z" fill="#ffd34d" stroke="' + L + '" stroke-width="3"><animate attributeName="opacity" values="1;.55;1" dur=".35s" repeatCount="indefinite"/></path><path d="M183 228q-16 24-4 56q4-16 8 0q12-32-4-56z" fill="#ff7a2d" stroke="' + L + '" stroke-width="3"><animate attributeName="opacity" values=".6;1;.6" dur=".3s" repeatCount="indefinite"/></path>', badge: "#ffd34d" }, ["#ff6a3d", "#b8262e"]],
    "svg:fngold": ["goldkristalllama", { fur: ["#fff6c0", "#ffd34d", "#f0a820", "#9fefff"], belly: "#fffbe0", ears: "llama", face: "small", nose: "#ff8fb8", cheek: false, under: FACETS,
      hfront: '<g stroke="' + L + '" stroke-width="3.5" stroke-linejoin="round"><path d="M78 44l-4-36l22 18l14-34l14 34l22-18l-4 36q-30 10-60 0z" fill="url(#$Ihg)"/></g><path d="M96 38l8-22M124 38l-8-22" stroke="#fff" stroke-width="3.5" stroke-linecap="round" opacity=".85"/>' + star(52, 44, 9, "#fff") + star(170, 40, 8, "#9fefff"),
      defs: '<linearGradient id="$Ihg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff6c0"/><stop offset=".5" stop-color="#ffd34d"/><stop offset="1" stop-color="#9fefff"/></linearGradient><linearGradient id="$Iht" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffe27a"/><stop offset=".55" stop-color="#ffd34d"/><stop offset="1" stop-color="#9fefff"/></linearGradient>',
      hback: '<g stroke="' + L + '" stroke-width="5" stroke-linejoin="round"><path d="M150 36q64-30 62 52q-2 56-34 80q10-52-14-82q6-34-14-50z" fill="url(#$Iht)"/><path d="M196 96l12 10l-6 14zM190 130l12 6l-8 12z" fill="#9fefff" stroke-width="3.5"/></g><path d="M180 60q18 16 14 52" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".55" fill="none"/>' + crystals(["#ffe27a", "#9fefff"], true),
      back: '<circle cx="176" cy="238" r="18" fill="#ffd34d" stroke="' + L + '" stroke-width="5"/>', badge: "#9fefff" }, ["#ffd34d", "#b8780a"]],
    "svg:fnkristall": ["kristalllama", { fur: ["#ffffff", "#9fefff", "#7fa8ff", "#b58cff"], belly: "#f2fcff", ears: "llama", face: "small", nose: "#ff8fb8", cheek: false, under: FACETS,
      hfront: '<g stroke="' + L + '" stroke-width="3.5" stroke-linejoin="round"><path d="M80 42q4 18 12 6q4 14 12-2q6 14 12 0q8 12 12-2q6 12 12-6q6 8 8-4q-4-26-34-26q-30 0-34 28z" fill="#9fefff"/></g><path d="M90 36q10-10 20-6q10-6 20 4" fill="none" stroke="#b58cff" stroke-width="4.5" stroke-linecap="round"/>' + star(50, 40, 9, "#fff") + star(172, 38, 7, "#fff"), back: '<circle cx="176" cy="238" r="18" fill="#9fefff" stroke="' + L + '" stroke-width="5"/>', badge: "#fff" }, ["#b58cff", "#6a3fd0"]],
    "svg:fnelite": ["elite", { fur: ["#b8efff", "#5b8cff", "#7b4dff"], belly: "#d0ecff", ears: "", face: "gem", cheek: false, eyes: "big", sclera: "#fff", under: FACETS, hback: crystals(["#7be0ff", "#c9a7ff"]), badge: "#7be0ff" }, ["#7b4dff", "#3a1fb0"]],
    "svg:kitty1": ["kitty", { fur: ["#ffffff", "#fbf7fb", "#e8dfe8"], belly: "#ffffff", ears: "point", earIn: "#ffd0e0", face: "kit", eyes: "kit", cheek: false, hand: "#ffffff", pants: "#2a56c8", shoe: "#ff3b4f",
      hfront: bow(148, 50, "#ff3b4f", 1.25, 12) }, ["#4f8cff", "#1f4fb8"]],
    "svg:kitty2": ["kittyregenbogen", { fur: ["#fff2f8", "#ffd6e8", "#f5a6c8"], belly: "#fff9fc", ears: "point", earIn: "#ff9cc6", face: "kit", eyes: "kit", cheek: false, hand: "#fff2f8", pants: "#9a7bff", shoe: "#ffe066",
      hback: pigtail(44, ["#ff9ec9", "#b58cff"], -1) + pigtail(176, ["#59c8ff", "#7be08a"], 1),
      hfront: band("#b58cff", star(110, 20, 9, "#ffe066")) + fringe(["#ff6b8f", "#ffb347", "#ffe066", "#7be08a", "#59c8ff"]) + bow(156, 56, "#ffe066", .9, 16) }, ["#b58cff", "#6a3fd0"]],
    "svg:kitty3": ["kittyprinzessin", { fur: ["#ffffff", "#f6eefc", "#d9c8f0"], belly: "#ffffff", ears: "point", earIn: "#e4c4ff", face: "kit", eyes: "kit", cheek: false, hand: "#ffffff", pants: "#ff6fa8", shoe: "#ffd0e8", badge: "#ff8fd0",
      defs: '<linearGradient id="$Ihb" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#ff6b8f"/><stop offset=".25" stop-color="#ffb347"/><stop offset=".5" stop-color="#ffe066"/><stop offset=".75" stop-color="#59c8ff"/><stop offset="1" stop-color="#b58cff"/></linearGradient>',
      hback: pigtail(40, ["#ff8fd0", "#ffb347"], -1) + pigtail(180, ["#59c8ff", "#b58cff"], 1) + '<path d="M54 100Q44 160 70 200Q64 150 74 112z" fill="#ff8fd0" stroke="' + L + '" stroke-width="3.5"/><path d="M166 100Q176 160 150 200Q156 150 146 112z" fill="#59c8ff" stroke="' + L + '" stroke-width="3.5"/>',
      hfront: band("url(#$Ihb)", '<path d="M110 8l9 14l-9 12l-9-12z" fill="#7be0ff" stroke="' + L + '" stroke-width="3.5" stroke-linejoin="round"/>') + fringe(RB) + bow(154, 54, "#ff4d9d", 1.05, 14) + star(48, 46, 8, "#ffe066") + star(176, 118, 7, "#fff") + star(44, 124, 6, "#ffe066"),
      back: '<g stroke="' + L + '" stroke-width="4" stroke-linejoin="round"><path d="M62 180q-52-30-48 22q6 26 50 22z" fill="#ffe0f0" opacity=".9"/><path d="M158 180q52-30 48 22q-6 26-50 22z" fill="#d8ecff" opacity=".9"/></g>' }, ["#ff6fa8", "#c02a7a"]],
    "svg:kitty4": ["kittysterne", { fur: ["#ffffff", "#fff8e0", "#ffe6a0"], belly: "#ffffff", ears: "point", earIn: "#ffd0f0", face: "kit", eyes: "kit", cheek: false, hand: "#ffffff", pants: "#6a4be0", shoe: "#ffd34d", badge: "#7be0ff",
      defs: '<linearGradient id="$Ihb" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#ffe066"/><stop offset="1" stop-color="#ffb61e"/></linearGradient>',
      hback: '<g stroke="' + L + '" stroke-width="4.5" stroke-linejoin="round"><path d="M56 70Q16 110 40 190Q50 150 70 130z" fill="#ff8fd0"/><path d="M164 70Q204 110 180 190Q170 150 150 130z" fill="#59c8ff"/><path d="M46 100Q22 150 42 210Q54 165 62 135z" fill="#b58cff"/><path d="M174 100Q198 150 178 210Q166 165 158 135z" fill="#7be08a"/></g>',
      hfront: band("url(#$Ihb)", star(110, 14, 15, "#fff") + '<g stroke="' + L + '" stroke-width="3.5"><circle cx="74" cy="40" r="7" fill="#ff6bb0"/><circle cx="146" cy="40" r="7" fill="#59c8ff"/></g>') + fringe(RB) + bow(156, 58, "#ff4d9d", 1.1, 16) + star(40, 40, 10, "#ffe066") + star(182, 34, 9, "#7be0ff") + star(34, 128, 8, "#fff") + star(186, 124, 7, "#ffe066"),
      back: wings("#fff3b8", "#ffe066") + '<g fill="#fff" opacity=".9"><circle cx="30" cy="176" r="3"/><circle cx="196" cy="168" r="3"/></g>' }, ["#ffd34d", "#e08a0a"]],
    "svg:fnchamp": ["champ", { fur: ["#ffffff", "#cfe9ff", "#b9a6ff"], belly: "#ffffff", ears: "", face: "gem", cheek: false, eyes: "big", sclera: "#fff", under: FACETS, hback: crystals(["#ffffff", "#ffe58a"], true), hfront: star(60, 42, 8, "#ffd24a") + star(160, 42, 8, "#ffd24a"), badge: "#b9a6ff" }, ["#ffd24a", "#c8780a"]],
    "svg:fnunreal": ["unreal", { fur: ["#ff8fd0", "#8f7dff", "#37c6e8", "#ffd66b"], belly: "#ffffff", ears: "", face: "gem", cheek: false, eyes: "big", sclera: "#fff", under: FACETS, hback: crystals(["#ff8fd0", "#37c6e8"], true), hfront: star(54, 46, 9, "#fff") + star(166, 44, 9, "#fff"), badge: "#ff8fd0" }, ["#37c6e8", "#1a7fa0"]],
    "svg:clombo": ["clombo", { fur: ["#d9a8ee", "#b063cc", "#8e48ae"], belly: "#e8c8f5", ears: "small", earIn: "#8e48ae", face: "none", eyes: "frog", cheek: false, hand: "#b063cc", pants: "#5a2d82", shoe: "#37c6e8", badge: "#37c6e8",
      defs: '<linearGradient id="pmCl$I" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#ff8fd0"/><stop offset=".55" stop-color="#8f7dff"/><stop offset="1" stop-color="#37c6e8"/></linearGradient>',
      hback: '<path d="M64 66L60 16L74 40L85 6L98 38L110 4L122 38L135 6L146 40L160 16L156 66z" fill="url(#pmCl$I)" stroke="' + L + '" stroke-width="5" stroke-linejoin="round"/>',
      hfront: '<circle cx="78" cy="86" r="23" fill="#8fe4f7" stroke="#37c6e8" stroke-width="4"/><circle cx="142" cy="86" r="23" fill="#8fe4f7" stroke="#37c6e8" stroke-width="4"/><circle cx="78" cy="86" r="23" fill="none" stroke="' + L + '" stroke-width="2"/><circle cx="142" cy="86" r="23" fill="none" stroke="' + L + '" stroke-width="2"/>' +
        '<circle cx="80" cy="88" r="12" fill="#1b1230"/><circle cx="144" cy="88" r="12" fill="#1b1230"/><circle cx="85" cy="82" r="4.6" fill="#fff"/><circle cx="149" cy="82" r="4.6" fill="#fff"/>' +
        '<path d="M72 122q38 12 76 0q-2 30-38 30q-36 0-38-30z" fill="#7a1630" stroke="' + L + '" stroke-width="4" stroke-linejoin="round"/>' +
        '<path d="M80 124l6 12 6-9 6 12 6-9 6 12 6-9 6 12 6-9 6 12 6-8 5 8" fill="none"/><path d="M78 124l7 14 7-12zM94 127l7 14 7-13zM110 129l7 13 7-13zM126 127l7 13 6-12z" fill="#fff1d6" stroke="' + L + '" stroke-width="1.5" stroke-linejoin="round"/>' +
        '<ellipse cx="110" cy="144" rx="14" ry="6" fill="#ff6f8e"/><path d="M110 138v10" stroke="#d84a6c" stroke-width="1.6" stroke-linecap="round"/>' }, ["#7c5cff", "#3d2a9c"]]
  };
  /* Kitty-Outfits: Schleife, Haarreifen, bunter Pony und Glitzer für jede Figur (Siegertanz, Avatar) */
  var RBD = '<defs><linearGradient id="kofrb" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#ff6b8f"/><stop offset=".25" stop-color="#ffb347"/><stop offset=".5" stop-color="#ffe066"/><stop offset=".75" stop-color="#59c8ff"/><stop offset="1" stop-color="#b58cff"/></linearGradient></defs>';
  A.outfit("kitty1", ["#4f8cff", "#1f4fb8"], { head: bow(148, 50, "#ff3b4f", 1.25, 12) });
  A.outfit("kitty2", ["#b58cff", "#6a3fd0"], { head: band("#b58cff", star(110, 20, 9, "#ffe066")) + fringe(["#ff6b8f", "#ffb347", "#ffe066", "#7be08a", "#59c8ff"]) + bow(156, 56, "#ffe066", .9, 16) });
  A.outfit("kitty3", ["#ff6fa8", "#c02a7a"], { head: RBD + band("url(#kofrb)", '<path d="M110 8l9 14l-9 12l-9-12z" fill="#7be0ff" stroke="' + L + '" stroke-width="3.5" stroke-linejoin="round"/>') + fringe(RB) + bow(154, 54, "#ff4d9d", 1.05, 14) + star(48, 46, 8, "#ffe066") + star(176, 118, 7, "#fff") + star(44, 124, 6, "#ffe066"),
    back: '<g stroke="' + L + '" stroke-width="4" stroke-linejoin="round"><path d="M62 180q-52-30-48 22q6 26 50 22z" fill="#ffe0f0" opacity=".9"/><path d="M158 180q52-30 48 22q-6 26-50 22z" fill="#d8ecff" opacity=".9"/></g>' });
  A.outfit("kitty4", ["#ffd34d", "#e08a0a"], { head: '<defs><linearGradient id="kofgd" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#ffe066"/><stop offset="1" stop-color="#ffb61e"/></linearGradient></defs>' + band("url(#kofgd)", star(110, 14, 15, "#fff")) + fringe(RB) + bow(156, 58, "#ff4d9d", 1.1, 16) + star(40, 40, 10, "#ffe066") + star(182, 34, 9, "#7be0ff") + star(34, 128, 8, "#fff") + star(186, 124, 7, "#ffe066"),
    back: wings("#fff3b8", "#ffe066") });
  /* Verkleidungen (Drop 5): Jackenfarbe plus Kopfschmuck bzw. Umhang */
  var OST = 'stroke="' + L + '" stroke-width="5" stroke-linejoin="round"';
  A.outfit("skater", ["#ff8a3d", "#c2490a"], { head: '<path d="M46 74Q44 4 110 4Q176 4 174 74Q110 58 46 74z" fill="#ff7a2d" ' + OST + '/><path d="M50 60Q110 44 170 60M52 48Q110 32 168 48" stroke="#ffd34d" stroke-width="6" fill="none"/><circle cx="110" cy="2" r="13" fill="#fff" ' + OST + '/>' });
  A.outfit("cowboy", ["#9a6a35", "#4a2d12"], { head: '<path d="M40 66Q14 62 8 78Q60 98 110 90Q160 98 212 78Q206 62 180 66Q170 20 110 22Q50 20 40 66z" fill="#b07a3c" ' + OST + '/><path d="M52 62Q110 78 168 62" stroke="#5a3a1a" stroke-width="9" fill="none"/>' + star(110, 70, 8, "#ffd34d") });
  A.outfit("ninja", ["#3a3a5c", "#14142b"], { head: '<path d="M44 66Q110 42 176 66L178 90Q110 66 42 90z" fill="#e63946" ' + OST + '/><rect x="88" y="62" width="44" height="22" rx="6" fill="#d7dee9" ' + OST + '/><path d="M170 72q28-14 40 4q-16 4-20 18q18 2 20 18q-26 2-40-22z" fill="#e63946" ' + OST + '/>' });
  A.outfit("chef", ["#ffffff", "#c3c9d9"], { head: '<path d="M62 62Q38 42 62 24Q70-2 110 6Q150-2 158 24Q182 42 158 62z" fill="#fff" ' + OST + '/><rect x="62" y="56" width="96" height="16" rx="5" fill="#f1f3f8" ' + OST + '/>' });
  A.outfit("pirat", ["#c0392b", "#7a1a1a"], { head: '<path d="M36 64Q110-30 184 64Q110 44 36 64z" fill="#1b1b2f" ' + OST + '/><path d="M42 62Q110 42 178 62" stroke="#ffd34d" stroke-width="6" fill="none"/><circle cx="110" cy="14" r="17" fill="#fff" ' + OST + '/><circle cx="103" cy="12" r="4" fill="' + L + '"/><circle cx="117" cy="12" r="4" fill="' + L + '"/><path d="M104 24h12" stroke="' + L + '" stroke-width="3.5" stroke-linecap="round"/>' });
  A.outfit("ritter", ["#d0d8e8", "#7a869e"], { head: '<path d="M46 86Q42 14 110 12Q178 14 174 86z" fill="#cfd6e4" ' + OST + '/><path d="M60 62h100v14H60z" fill="#7a869e" ' + OST + '/><path d="M110 12Q96-24 140-20Q122-4 128 14z" fill="#e63946" ' + OST + '/><path d="M110 12v50" stroke="' + L + '" stroke-width="4"/>' });
  A.outfit("dj", ["#ffd34d", "#b8780a"], { head: '<path d="M44 96Q40 -4 110 -2Q180 -4 176 96" fill="none" stroke="#14213d" stroke-width="14"/><path d="M44 96Q40 -4 110 -2Q180 -4 176 96" fill="none" stroke="#ff3df0" stroke-width="7"/><rect x="26" y="78" width="30" height="46" rx="12" fill="#ff3df0" ' + OST + '/><rect x="164" y="78" width="30" height="46" rx="12" fill="#ff3df0" ' + OST + '/>' });
  A.outfit("zauberer", ["#7a4fff", "#2b1a8f"], { head: '<path d="M60 56Q86 22 118 14Q146 8 170 30Q150 28 140 38L152 56z" fill="#3b2791" ' + OST + '/><ellipse cx="110" cy="56" rx="72" ry="14" fill="#4b2fb8" ' + OST + '/><path d="M52 56Q110 70 168 56" fill="none" stroke="#ffd34d" stroke-width="5"/>' + star(106, 38, 11, "#ffe27a") + star(138, 26, 6, "#fff"), back: '<path d="M60 170Q20 260 60 296Q110 250 160 296Q200 260 160 170z" fill="#4b2fb8" ' + OST + '/>' });
  A.outfit("koenig", ["#d12036", "#6b0a15"], { head: '<path d="M62 52l-8-40l30 22l26-38l26 38l30-22l-8 40q-48 12-96 0z" fill="#ffd34d" ' + OST + '/><circle cx="84" cy="30" r="6" fill="#e63946"/><circle cx="136" cy="30" r="6" fill="#59c8ff"/><circle cx="110" cy="8" r="7" fill="#fff"/>', back: '<path d="M52 168Q4 250 40 296H180Q216 250 168 168z" fill="#b01a2e" ' + OST + '/><path d="M40 296H180" stroke="#fff" stroke-width="8" stroke-dasharray="14 8"/>' });
  Object.keys(D).forEach(function (av) {
    var d = D[av], sp = d[1], c = d[2];
    A.register(av, d[0], function (jc, jd) { return critter(sp, jc, jd); }, c);
  });
})(window);
