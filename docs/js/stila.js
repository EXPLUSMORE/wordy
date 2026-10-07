/* Stil A "Fortnite-Cartoon": ganze Figuren mit Kopf, Körper, Armen, Beinen als Vektor. Gruppen bodyG, armL, armR, headG werden von den Tänzen (CSS) bewegt. */
(function (global) {
  "use strict";
  var uid = 0, O = 'stroke="#14213d" stroke-width="5" stroke-linejoin="round"';
  var CAPE = '<path d="M62 168q-34 70-4 108q52 20 104 0q30-38-4-108q-48-18-96 0z" fill="#7fd0ff" stroke="#14213d" stroke-width="5" stroke-linejoin="round"/><path d="M70 180q-20 50 0 84q40 14 80 0q20-34 0-84" fill="#cbeeff" opacity=".55"/><path d="M58 270q52 22 104 0v10q-52 22-104 0z" fill="#fff" stroke="#14213d" stroke-width="4" stroke-linejoin="round"/><path d="M84 214l4-8l4 8l8 4l-8 4l-4 8l-4-8l-8-4zM130 238l3-6l3 6l6 3l-6 3l-3 6l-3-6l-6-3z" fill="#fff" opacity=".9"/>';
  var SCEPTER = '<rect x="174" y="138" width="9" height="98" rx="4" fill="#ffd24a" stroke="#14213d" stroke-width="4"/><path d="M178 94l14 22l-6 22h-16l-6-22z" fill="#7be0ff" stroke="#14213d" stroke-width="4" stroke-linejoin="round"/><path d="M174 104l6 8" stroke="#fff" stroke-width="3" stroke-linecap="round"/>';
  var CROWN = '<path d="M72 54l-6-40l26 20l18-34l18 34l26-20l-6 40q-38 12-76 0z" fill="#ffd24a" stroke="#14213d" stroke-width="5" stroke-linejoin="round"/><path d="M76 50q34 10 68 0" stroke="#c8780a" stroke-width="5" fill="none"/><circle cx="110" cy="40" r="6" fill="#ff4f6a" stroke="#14213d" stroke-width="3"/><circle cx="90" cy="44" r="4.5" fill="#4be0ff" stroke="#14213d" stroke-width="3"/><circle cx="130" cy="44" r="4.5" fill="#4be0ff" stroke="#14213d" stroke-width="3"/><path d="M82 28q8-8 16-6" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".7" fill="none"/>';
    function figBear(o){o=o||{};var i="b"+(uid++),jc=o.jacket||"#3f9bff",jd=o.jacketD||"#1a5fd0";
return '<svg class="afs" viewBox="0 0 220 300" xmlns="http://www.w3.org/2000/svg">'+
'<defs>'+
'<linearGradient id="'+i+'f" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset=".55" stop-color="#e9f3fc"/><stop offset="1" stop-color="#b9d3ee"/></linearGradient>'+
'<linearGradient id="'+i+'j" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="'+jc+'"/><stop offset="1" stop-color="'+jd+'"/></linearGradient>'+
'<radialGradient id="'+i+'au"><stop offset="0" stop-color="#ffe58a" stop-opacity=".75"/><stop offset="1" stop-color="#ffb61e" stop-opacity="0"/></radialGradient><radialGradient id="'+i+'n" cx=".35" cy=".3"><stop offset="0" stop-color="#5b6b94"/><stop offset="1" stop-color="#1b2540"/></radialGradient>'+
'</defs>'+
(o.king?'<circle class="aura" cx="110" cy="170" r="128" fill="url(#'+i+'au)"/>':'')+'<ellipse cx="110" cy="286" rx="66" ry="9" fill="#000" opacity=".28"/>'+
'<g class="bodyG">'+(o.king?CAPE:'')+
 /* Beine */
 '<g stroke="#14213d" stroke-width="5" stroke-linejoin="round">'+
 '<path d="M76 214h30v44a15 15 0 0 1-15 15a15 15 0 0 1-15-15z" fill="#2a4f9a"/><ellipse cx="90" cy="268" rx="24" ry="13" fill="url(#'+i+'f)"/><path d="M78 270q12 5 24 0" fill="none" stroke="#9db9d8" stroke-width="3"/>'+
 '<path d="M114 214h30v44a15 15 0 0 1-15 15a15 15 0 0 1-15-15z" fill="#2a4f9a"/><ellipse cx="130" cy="268" rx="24" ry="13" fill="url(#'+i+'f)"/><path d="M118 270q12 5 24 0" fill="none" stroke="#9db9d8" stroke-width="3"/></g>'+
 /* Körper */
 '<g stroke="#14213d" stroke-width="5" stroke-linejoin="round">'+
 '<path d="M62 168q-4 38 4 62q44 14 88 0q8-24 4-62q-48-14-96 0z" fill="url(#'+i+'j)"/>'+
 '<path d="M66 230q44 14 88 0v10q-44 14-88 0z" fill="#fff" />'+
 '<path d="M110 160v78" stroke="#0f3a85" stroke-width="3" fill="none"/>'+
 '<path d="M80 205h20M120 205h20" stroke="#0f3a85" stroke-width="3" stroke-linecap="round" fill="none"/>'+
 '</g>'+
 '<path d="M72 176q-4 28 2 48" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity=".45" fill="none"/>'+
 '<circle cx="110" cy="190" r="13" fill="#fff" stroke="#14213d" stroke-width="4"/><path d="M110 182v16M103 186l14 8M117 186l-14 8" stroke="#3f9bff" stroke-width="3" stroke-linecap="round"/>'+
 /* Fellkragen */
 '<path d="M58 160q52 30 104 0q8 14-6 20q-46 18-92 0q-14-6-6-20z" fill="url(#'+i+'f)" stroke="#14213d" stroke-width="5" stroke-linejoin="round"/>'+
 /* Arme */
 '<g class="armL" stroke="#14213d" stroke-width="5" stroke-linejoin="round"><path d="M70 164q-34 8-34 40q4 8 16 6q4-22 24-30z" fill="url(#'+i+'j)" transform="rotate(8 70 168)"/><circle cx="46" cy="214" r="15" fill="url(#'+i+'f)"/><path d="M38 220q6 6 14 0" stroke="#9db9d8" stroke-width="3" fill="none"/></g>'+
 '<g class="armR" stroke="#14213d" stroke-width="5" stroke-linejoin="round">'+(o.king?SCEPTER:'')+'<path d="M150 164q34 8 34 40q-4 8-16 6q-4-22-24-30z" fill="url(#'+i+'j)" transform="rotate(-8 150 168)"/><circle cx="174" cy="214" r="15" fill="url(#'+i+'f)"/><path d="M166 220q6 6 14 0" stroke="#9db9d8" stroke-width="3" fill="none"/></g>'+
 /* Kopf */
 '<g class="headG">'+
 '<g class="earL"><circle cx="62" cy="52" r="22" fill="url(#'+i+'f)" stroke="#14213d" stroke-width="5"/><circle cx="64" cy="55" r="11" fill="#f6b7cc" stroke="#14213d" stroke-width="3"/></g>'+
 '<g class="earR"><circle cx="158" cy="52" r="22" fill="url(#'+i+'f)" stroke="#14213d" stroke-width="5"/><circle cx="156" cy="55" r="11" fill="#f6b7cc" stroke="#14213d" stroke-width="3"/></g>'+
 '<ellipse cx="110" cy="100" rx="66" ry="60" fill="url(#'+i+'f)" stroke="#14213d" stroke-width="5"/>'+
 '<path d="M52 78q10-30 44-40" stroke="#fff" stroke-width="8" stroke-linecap="round" opacity=".9" fill="none"/>'+
 '<path d="M172 92q-4 34-34 52" stroke="#8fd3ff" stroke-width="7" stroke-linecap="round" opacity=".6" fill="none"/>'+
 '<ellipse cx="66" cy="116" rx="12" ry="8" fill="#ff8fb0" opacity=".6"/><ellipse cx="154" cy="116" rx="12" ry="8" fill="#ff8fb0" opacity=".6"/>'+
 '<ellipse cx="110" cy="122" rx="34" ry="25" fill="#fff" stroke="#14213d" stroke-width="4"/>'+
 '<path d="M97 100q13-8 26 0q2 12-13 16q-15-4-13-16z" fill="url(#'+i+'n)" stroke="#14213d" stroke-width="3.5" stroke-linejoin="round"/><ellipse cx="105" cy="102" rx="4.5" ry="2.4" fill="#fff" opacity=".85"/>'+
 '<path d="M110 116v8M96 128q14 14 28 0" stroke="#14213d" stroke-width="4" stroke-linecap="round" fill="none"/><path d="M104 134q6 10 12 0" fill="#ff6b8f" stroke="#14213d" stroke-width="3"/>'+
 '<ellipse cx="82" cy="88" rx="12" ry="16" fill="#14213d"/><ellipse cx="138" cy="88" rx="12" ry="16" fill="#14213d"/>'+
 '<circle cx="86" cy="82" r="5.4" fill="#fff"/><circle cx="142" cy="82" r="5.4" fill="#fff"/><circle cx="78" cy="95" r="2.4" fill="#fff"/><circle cx="134" cy="95" r="2.4" fill="#fff"/>'+
 '<path d="M66 66q16-10 32-2M122 64q16-8 32 2" stroke="#14213d" stroke-width="5" stroke-linecap="round" fill="none"/>'+
 (o.king?CROWN:'')+
 '</g>'+
'</g></svg>'}
  function figPenguin(o) {
    o = o || {};
    var i = "P" + (uid++), sc = o.jacket || "#e8453c", sd = o.jacketD || "#a31515";
    return '<svg class="afs" viewBox="0 0 220 300" xmlns="http://www.w3.org/2000/svg"><defs>' +
      '<linearGradient id="' + i + 'n" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#55679c"/><stop offset="1" stop-color="#1b2447"/></linearGradient>' +
      '<linearGradient id="' + i + 'w" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#cfe0f6"/></linearGradient>' +
      '<linearGradient id="' + i + 'o" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffd23d"/><stop offset="1" stop-color="#f27d0c"/></linearGradient>' +
      '<linearGradient id="' + i + 's" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="' + sc + '"/><stop offset="1" stop-color="' + sd + '"/></linearGradient></defs>' +
      '<ellipse cx="110" cy="288" rx="68" ry="9" fill="#000" opacity=".28"/><g class="bodyG">' +
      '<g ' + O + '><path d="M60 266q-10 16 8 18h34q6-8-2-20z" fill="url(#' + i + 'o)"/><path d="M160 266q10 16-8 18h-34q-6-8 2-20z" fill="url(#' + i + 'o)"/></g>' +
      '<path d="M72 276v8M84 276v8M148 276v8M136 276v8" stroke="#14213d" stroke-width="3" stroke-linecap="round"/>' +
      '<path d="M50 178q-4-52 60-54q64 2 60 54q4 64-60 90q-64-26-60-90z" fill="url(#' + i + 'n)" ' + O + '/>' +
      '<path d="M78 190q-6-36 32-40q38 4 32 40q2 46-32 64q-34-18-32-64z" fill="url(#' + i + 'w)" stroke="#14213d" stroke-width="3.5" stroke-linejoin="round"/>' +
      '<path d="M64 184q-4 34 6 60" stroke="#fff" stroke-width="6" stroke-linecap="round" opacity=".28" fill="none"/>' +
      '<g class="armL" ' + O + '><path d="M58 164q-34 18-28 62q10 10 22-2q2-34 16-50z" fill="url(#' + i + 'n)"/><path d="M40 216q4 8 12 4" stroke="#8fa0cc" stroke-width="3.5" stroke-linecap="round" fill="none"/></g>' +
      '<g class="armR" ' + O + '><path d="M162 164q34 18 28 62q-10 10-22-2q-2-34-16-50z" fill="url(#' + i + 'n)"/><path d="M180 216q-4 8-12 4" stroke="#8fa0cc" stroke-width="3.5" stroke-linecap="round" fill="none"/></g>' +
      '<path d="M58 150q52 26 104 0q8 14-4 22q-48 20-96 0q-12-8-4-22z" fill="url(#' + i + 's)" ' + O + '/><path d="M138 168q20 8 22 44q-12 8-24 0q6-20 2-44z" fill="url(#' + i + 's)" ' + O + '/><path d="M66 158q20 8 44 8" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity=".5" fill="none"/>' +
      '<g class="headG">' +
      '<ellipse cx="110" cy="96" rx="66" ry="58" fill="url(#' + i + 'n)" ' + O + '/>' +
      '<path d="M58 90q10-28 42-36" stroke="#fff" stroke-width="8" stroke-linecap="round" opacity=".4" fill="none"/>' +
      '<path d="M58 106q-2-34 30-36q14 4 22 16q8-12 22-16q32 2 30 36q0 38-52 42q-52-4-52-42z" fill="url(#' + i + 'w)" stroke="#14213d" stroke-width="4" stroke-linejoin="round"/>' +
      '<ellipse cx="86" cy="102" rx="11" ry="15" fill="#14213d"/><ellipse cx="134" cy="102" rx="11" ry="15" fill="#14213d"/><ellipse cx="90" cy="96" rx="5" ry="6" fill="#fff"/><ellipse cx="138" cy="96" rx="5" ry="6" fill="#fff"/><circle cx="82" cy="109" r="2.2" fill="#fff"/><circle cx="130" cy="109" r="2.2" fill="#fff"/>' +
      '<ellipse cx="66" cy="124" rx="11" ry="7" fill="#ff8fb0" opacity=".6"/><ellipse cx="154" cy="124" rx="11" ry="7" fill="#ff8fb0" opacity=".6"/>' +
      '<path d="M92 118q18-12 36 0q-6 22-18 24q-12-2-18-24z" fill="url(#' + i + 'o)" ' + O + '/><path d="M100 120q10-5 20 0" stroke="#fff" stroke-width="3.5" stroke-linecap="round" opacity=".7" fill="none"/><path d="M96 128q14 6 28 0" stroke="#14213d" stroke-width="3" fill="none" stroke-linecap="round"/>' +
      '</g></g></svg>';
  }

  function figSeal(o) {
    o = o || {};
    var i = "S" + (uid++), sc = o.jacket || "#4aa8ff", sd = o.jacketD || "#1a5fd0";
    return '<svg class="afs" viewBox="0 0 220 300" xmlns="http://www.w3.org/2000/svg"><defs>' +
      '<linearGradient id="' + i + 'b" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#c3d3ee"/><stop offset=".55" stop-color="#8aa3cf"/><stop offset="1" stop-color="#5370a6"/></linearGradient>' +
      '<linearGradient id="' + i + 'l" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#d8e5f8"/></linearGradient>' +
      '<linearGradient id="' + i + 's" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="' + sc + '"/><stop offset="1" stop-color="' + sd + '"/></linearGradient></defs>' +
      '<ellipse cx="110" cy="288" rx="70" ry="9" fill="#000" opacity=".28"/><g class="bodyG">' +
      '<g ' + O + '><path d="M76 262q-34 2-40 20q22 10 56-4z" fill="#5d7aae"/><path d="M144 262q34 2 40 20q-22 10-56-4z" fill="#5d7aae"/></g>' +
      '<path d="M52 180q-8 74 58 92q66-18 58-92q-58-26-116 0z" fill="url(#' + i + 'b)" ' + O + '/>' +
      '<path d="M76 200q-2 50 34 66q36-16 34-66q-34-14-68 0z" fill="url(#' + i + 'l)" stroke="#14213d" stroke-width="3.5" stroke-linejoin="round"/>' +
      '<path d="M62 186q-4 36 8 62" stroke="#fff" stroke-width="7" stroke-linecap="round" opacity=".35" fill="none"/>' +
      '<g class="armL" ' + O + '><path d="M60 166q-40 8-38 48q4 14 22 8q8-30 28-40z" fill="url(#' + i + 'b)"/><path d="M26 208q6 10 18 8" stroke="#3e5a90" stroke-width="3.5" stroke-linecap="round" fill="none"/></g>' +
      '<g class="armR" ' + O + '><path d="M160 166q40 8 38 48q-4 14-22 8q-8-30-28-40z" fill="url(#' + i + 'b)"/><path d="M194 208q-6 10-18 8" stroke="#3e5a90" stroke-width="3.5" stroke-linecap="round" fill="none"/></g>' +
      '<path d="M58 154q52 26 104 0q8 14-4 22q-48 20-96 0q-12-8-4-22z" fill="url(#' + i + 's)" ' + O + '/><path d="M64 160l18 8M88 164l16 6M112 166l16 4M136 164l16-4" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity=".7"/>' +
      '<g class="headG">' +
      '<ellipse cx="110" cy="100" rx="66" ry="58" fill="url(#' + i + 'b)" ' + O + '/>' +
      '<path d="M54 84q10-30 44-38" stroke="#fff" stroke-width="9" stroke-linecap="round" opacity=".55" fill="none"/>' +
      '<ellipse cx="110" cy="126" rx="38" ry="26" fill="url(#' + i + 'l)" stroke="#14213d" stroke-width="4"/>' +
      '<path d="M96 108q14-9 28 0q2 12-14 16q-16-4-14-16z" fill="#1b2447" stroke="#14213d" stroke-width="3.5" stroke-linejoin="round"/><ellipse cx="104" cy="109" rx="5" ry="2.5" fill="#fff" opacity=".85"/>' +
      '<path d="M110 123v6M96 132q14 14 28 0" stroke="#14213d" stroke-width="4" stroke-linecap="round" fill="none"/><path d="M104 140q6 9 12 0z" fill="#ff7a9a" stroke="#14213d" stroke-width="3"/>' +
      '<path d="M78 124l-36-8M78 130l-38 2M80 136l-34 13M142 124l36-8M142 130l38 2M140 136l34 13" stroke="#14213d" stroke-width="3.2" stroke-linecap="round"/>' +
      '<g fill="#14213d"><circle cx="96" cy="126" r="2"/><circle cx="90" cy="132" r="2"/><circle cx="124" cy="126" r="2"/><circle cx="130" cy="132" r="2"/></g>' +
      '<ellipse cx="82" cy="92" rx="14" ry="18" fill="#14213d"/><ellipse cx="138" cy="92" rx="14" ry="18" fill="#14213d"/><ellipse cx="87" cy="85" rx="6" ry="7" fill="#fff"/><ellipse cx="143" cy="85" rx="6" ry="7" fill="#fff"/><circle cx="77" cy="100" r="2.6" fill="#fff"/><circle cx="133" cy="100" r="2.6" fill="#fff"/>' +
      '<ellipse cx="62" cy="118" rx="11" ry="7" fill="#ff8fb0" opacity=".6"/><ellipse cx="158" cy="118" rx="11" ry="7" fill="#ff8fb0" opacity=".6"/>' +
      '</g></g></svg>';
  }

  var KIND = { "svg:eisbaer": "bear", "svg:eispingu": "penguin", "svg:eisrobbe": "seal", "svg:eiskoenig": "king" };
  /* Jacke bzw. Schal je Outfit: [hell, dunkel] */
  var OUT = {
    shirt: ["#35c6ff", "#1a7fd0"], hoodie: ["#7a63f0", "#3a2da8"], trikot: ["#e53935", "#a31515"], held: ["#2b6fe0", "#14338f"], raum: ["#dfe6ee", "#8794ad"], rock: ["#ffd23d", "#c8780a"], polar: ["#3f9bff", "#1a5fd0"],
    "k-muenchen": ["#d4151f", "#8a0b12"], "k-barcelona": ["#a50044", "#004d98"], "k-turin": ["#f4f4f4", "#222222"], "k-deutschland": ["#ffffff", "#b9bfd0"], "k-argentinien": ["#74acdf", "#4a88c2"], "k-portugal": ["#c1121f", "#0b6b3a"]
  };
  var DEFC = { bear: ["#3f9bff", "#1a5fd0"], penguin: ["#e8453c", "#a31515"], seal: ["#4aa8ff", "#1a5fd0"], king: ["#ffd24a", "#c8780a"] };
  var EXT = {}, EXTC = {};   // weitere Figuren (stilb.js): kind -> Zeichenfunktion(jacke, jackeDunkel), Standardfarben
  function full(av, outfit) {
    var k = KIND[av]; if (!k) return "";
    var c = (k !== "king" && OUT[outfit]) || DEFC[k] || EXTC[k] || ["#35c6ff", "#1a7fd0"], o = { jacket: c[0], jacketD: c[1] };
    if (EXT[k]) return EXT[k](c[0], c[1]);
    if (k === "king") o.king = true;
    return k === "penguin" ? figPenguin(o) : k === "seal" ? figSeal(o) : figBear(o);
  }
  function artKey(k) { return /^svg:/.test(k) ? k.slice(4) : k; }
  function register(av, kind, fn, def) {
    KIND[av] = kind; EXT[kind] = fn; if (def) EXTC[kind] = def;
    if (global.VTC && global.VTC.ART) global.VTC.ART[artKey(av)] = head(av);
  }
  /* Kopf als Symbol (Avatar, Sticker, Karten) */
  function head(av) { return full(av).replace('class="afs" viewBox="0 0 220 300"', 'class="afs" style="display:block;width:1.25em;height:1.25em" viewBox="22 4 176 176"'); }
  function inner(av, outfit) { return full(av, outfit).replace(/^<svg[^>]*>/, "").replace(/<\/svg>$/, ""); }
  function dancer(av, outfit, n) { return '<div class="afig a' + n + '">' + full(av, outfit) + '</div>'; }
  global.VTA = { register: register, inner: inner, has: function (av) { return !!KIND[av]; }, full: full, head: head, dancer: dancer, get kinds() { return Object.keys(KIND); } };
  if (global.VTC && global.VTC.ART) Object.keys(KIND).forEach(function (k) { global.VTC.ART[artKey(k)] = head(k); });
})(window);
