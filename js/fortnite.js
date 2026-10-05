/* Wordy – Fortnite-Sammlung: eigene Zeichnungen im App-Stil (Fan-Art, keine Originalgrafiken).
   Wird nach cosmetics.js geladen und ergänzt VTC.ART; Katalog und Preise stehen in engine.js (SHOP, set: "fn"). */
(function (global) {
  "use strict";
  var V = '<svg viewBox="0 0 64 64" width="1.25em" height="1.25em" style="display:block" aria-hidden="true">';
  var E = '</svg>';
  function eye(x, y, r, pupil) {
    return '<circle cx="' + x + '" cy="' + y + '" r="' + r + '" fill="#fff"/><circle cx="' + (x + r * .15) + '" cy="' + y + '" r="' + (pupil || r * .5) + '" fill="#1B1230"/>' +
      '<circle cx="' + (x - r * .1) + '" cy="' + (y - r * .25) + '" r="' + (r * .18) + '" fill="#fff"/>';
  }
  /* Facetten für Kristalle: Dreiecke mit heller/dunkler Tönung */
  function facets(list) {
    return list.map(function (f) { return '<path d="' + f[0] + '" fill="' + f[1] + '" opacity="' + (f[2] == null ? 1 : f[2]) + '"/>'; }).join("");
  }
  var STRAP = '#5B3A29';

  /* Lama (Piñata): kräftige Verlaufsfarben von Rosa über Lila zu Blau, Dreiecksschuppen, Zaumzeug */
  function llama(o) {
    var g = o.id, c = o.cols;
    return V + '<defs><linearGradient id="' + g + '" gradientUnits="userSpaceOnUse" x1="0" y1="8" x2="0" y2="56">' +
      '<stop offset="0" stop-color="' + c[0] + '"/><stop offset=".38" stop-color="' + c[1] + '"/><stop offset=".7" stop-color="' + c[2] + '"/><stop offset="1" stop-color="' + c[3] + '"/></linearGradient></defs>' +
      '<g transform="translate(3.2 3.4) scale(.9)">' +
      '<ellipse cx="32" cy="61.5" rx="21" ry="2.6" fill="#000" opacity=".16"/>' +
      '<g fill="' + c[3] + '" stroke="' + o.edge + '" stroke-width="1.3" stroke-linejoin="round"><rect x="13" y="50" width="7" height="11" rx="2.5"/><rect x="22" y="50" width="7" height="11" rx="2.5"/>' +
      '<rect x="35" y="50" width="7" height="11" rx="2.5"/><rect x="44" y="50" width="7" height="11" rx="2.5"/></g>' +
      '<path d="M52 42q8-2 9 6" fill="none" stroke="' + o.edge + '" stroke-width="3.2" stroke-linecap="round"/><path d="M52 42q8-2 9 6" fill="none" stroke="' + c[2] + '" stroke-width="1.6" stroke-linecap="round"/>' +
      '<path d="M11 54V42Q11 32 24 30V17H41V30Q54 32 54 42V54Z" fill="url(#' + g + ')" stroke="' + o.edge + '" stroke-width="1.4" stroke-linejoin="round"/>' +
      '<path d="M17 38l4 5h-8zM27 36l4 5h-8zM38 38l4 5h-8zM47 40l4 5h-8zM19 48l4 5h-8zM30 47l4 5h-8zM41 48l4 5h-8z" fill="#fff" opacity=".2"/>' +
      '<path d="M24 9l-2-9 7 8zM41 9l1-9-7 8z" fill="' + o.ear + '" stroke="' + o.edge + '" stroke-width="1" stroke-linejoin="round"/>' +
      '<rect x="22" y="8" width="23" height="17" rx="5" fill="' + o.head + '" stroke="' + o.edge + '" stroke-width="1.4"/>' +
      '<rect x="19" y="16" width="13" height="9" rx="3.5" fill="' + o.snout + '" stroke="' + o.edge + '" stroke-width="1.2"/>' +
      '<path d="M21 20.5h9" stroke="' + STRAP + '" stroke-width="1.8" stroke-linecap="round"/><path d="M26 20.5L38 26" stroke="' + STRAP + '" stroke-width="1.6" stroke-linecap="round"/>' +
      '<circle cx="20.8" cy="20" r="1" fill="' + o.edge + '"/>' +
      '<circle cx="39" cy="14.5" r="4" fill="#FFF3D6" stroke="' + o.edge + '" stroke-width="1.1"/><circle cx="39.4" cy="14.6" r="1.7" fill="#1B1230"/>' +
      (o.extra || "") + '</g>' + E;
  }

  var ART = {
    fnllama: llama({ id: "fnL1", cols: ["#FF7EC7", "#B05CF0", "#4F7CF5", "#3BC4F2"], edge: "#4B2A8A", ear: "#C06CF5", head: "#B05CF0", snout: "#D79BFF" }),

    fnkristall: llama({ id: "fnL2", cols: ["#FFFFFF", "#9FEFFF", "#7FA8FF", "#B58CFF"], edge: "#3E5BB8", ear: "#CFF6FF", head: "#BFE9FF", snout: "#F2FCFF",
      extra: '<path d="M11 54V44l10-5v-8l10 6 10-6v8l13 5v10z" fill="#fff" opacity=".18"/><path d="M26 17l6 10 6-10z" fill="#fff" opacity=".45"/>' +
        '<path d="M8 22l2 4 4 2-4 2-2 4-2-4-4-2 4-2zM56 38l1.6 3.4 3.4 1.6-3.4 1.6L56 48l-1.6-3.4-3.4-1.6 3.4-1.6z" fill="#fff"/>' }),

    fnhuhn: V + '<ellipse cx="32" cy="61" rx="15" ry="2.4" fill="#000" opacity=".15"/>' +
      '<path d="M26 56l-3 6M38 56l3 6" stroke="#F59E0B" stroke-width="2.4" stroke-linecap="round"/>' +
      '<ellipse cx="32" cy="38" rx="23" ry="19" fill="#FFFDF5" stroke="#E8DFC8" stroke-width="1.4"/>' +
      '<circle cx="25" cy="14" r="5" fill="#EF4444"/><circle cx="32" cy="11" r="5.5" fill="#EF4444"/><circle cx="39" cy="14" r="5" fill="#EF4444"/>' +
      '<ellipse cx="14" cy="42" rx="7" ry="11" fill="#F1E8D0" transform="rotate(14 14 42)"/><ellipse cx="50" cy="42" rx="7" ry="11" fill="#F1E8D0" transform="rotate(-14 50 42)"/>' +
      eye(23, 32, 4.4) + eye(41, 32, 4.4) +
      '<path d="M26 39h12l-6 8z" fill="#F59E0B" stroke="#D97706" stroke-width="1" stroke-linejoin="round"/><path d="M32 47q-3 5 0 8q3-3 0-8z" fill="#EF4444"/>' +
      '<ellipse cx="16" cy="40" rx="4" ry="2.6" fill="#FFB4C0" opacity=".8"/><ellipse cx="48" cy="40" rx="4" ry="2.6" fill="#FFB4C0" opacity=".8"/>' + E,

    fnschwein: V + '<ellipse cx="32" cy="61" rx="18" ry="2.6" fill="#000" opacity=".16"/>' +
      '<path d="M10 22l4-12 9 9zM54 22l-4-12-9 9z" fill="#7A4A2E" stroke="#4E2D1A" stroke-width="1.2" stroke-linejoin="round"/>' +
      '<ellipse cx="32" cy="38" rx="26" ry="21" fill="#9A6240" stroke="#4E2D1A" stroke-width="1.4"/>' +
      '<path d="M14 24l4 5 3-6 4 6 3-7 3 7 4-6 3 6 4-5 3 6" fill="none" stroke="#5E361F" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>' +
      '<ellipse cx="32" cy="46" rx="13" ry="9.5" fill="#E7B197" stroke="#B9806A" stroke-width="1.2"/><ellipse cx="27.6" cy="46" rx="2.2" ry="3" fill="#6B3B2B"/><ellipse cx="36.4" cy="46" rx="2.2" ry="3" fill="#6B3B2B"/>' +
      '<path d="M20 52l-3-7 6 3zM44 52l3-7-6 3z" fill="#FFF7E0" stroke="#D8C9A3" stroke-width="1" stroke-linejoin="round"/>' +
      '<circle cx="21" cy="32" r="3.4" fill="#1B1230"/><circle cx="43" cy="32" r="3.4" fill="#1B1230"/><circle cx="22" cy="31" r="1.1" fill="#fff"/><circle cx="44" cy="31" r="1.1" fill="#fff"/>' +
      '<path d="M16 28l7 2M48 28l-7 2" stroke="#4E2D1A" stroke-width="2" stroke-linecap="round"/>' + E,

    fnwolf: V + '<ellipse cx="32" cy="61" rx="17" ry="2.5" fill="#000" opacity=".16"/>' +
      '<path d="M12 28L14 4l14 14zM52 28L50 4L36 18z" fill="#7C879C" stroke="#444E63" stroke-width="1.3" stroke-linejoin="round"/><path d="M16 22l1-10 7 7zM48 22l-1-10-7 7z" fill="#E7A9B8"/>' +
      '<path d="M5 40l9-3-3 8zM59 40l-9-3 3 8z" fill="#9AA5BA" stroke="#444E63" stroke-width="1.1" stroke-linejoin="round"/>' +
      '<ellipse cx="32" cy="37" rx="24" ry="21" fill="#9AA5BA" stroke="#444E63" stroke-width="1.4"/>' +
      '<path d="M32 18l-6 10h12z" fill="#7C879C"/>' +
      '<path d="M14 40Q20 30 32 36Q44 30 50 40Q44 56 32 58Q20 56 14 40z" fill="#F4F6FA" stroke="#C5CBD8" stroke-width="1"/>' +
      '<ellipse cx="32" cy="44" rx="5" ry="3.6" fill="#1F2430"/><path d="M32 47.5v4M26 52q6 4 12 0" fill="none" stroke="#1F2430" stroke-width="1.8" stroke-linecap="round"/>' +
      '<path d="M18 33l9 3-9 3z" fill="#FDE047" stroke="#444E63" stroke-width="1"/><path d="M46 33l-9 3 9 3z" fill="#FDE047" stroke="#444E63" stroke-width="1"/>' +
      '<circle cx="23.5" cy="36" r="1.7" fill="#1B1230"/><circle cx="40.5" cy="36" r="1.7" fill="#1B1230"/>' + E,

    fnfrosch: V + '<ellipse cx="32" cy="61" rx="18" ry="2.6" fill="#000" opacity=".16"/>' +
      '<ellipse cx="14" cy="55" rx="9" ry="4.5" fill="#3FA83F"/><ellipse cx="50" cy="55" rx="9" ry="4.5" fill="#3FA83F"/>' +
      '<ellipse cx="32" cy="40" rx="26" ry="19" fill="#5CCB5C" stroke="#2F7D2F" stroke-width="1.4"/>' +
      '<ellipse cx="32" cy="48" rx="17" ry="9" fill="#C8F5B0"/>' +
      '<circle cx="21" cy="19" r="10" fill="#5CCB5C" stroke="#2F7D2F" stroke-width="1.4"/><circle cx="43" cy="19" r="10" fill="#5CCB5C" stroke="#2F7D2F" stroke-width="1.4"/>' +
      '<circle cx="21" cy="19" r="7" fill="#fff"/><circle cx="43" cy="19" r="7" fill="#fff"/><circle cx="22" cy="20" r="3.8" fill="#1B1230"/><circle cx="42" cy="20" r="3.8" fill="#1B1230"/>' +
      '<circle cx="23.2" cy="18.4" r="1.3" fill="#fff"/><circle cx="43.2" cy="18.4" r="1.3" fill="#fff"/>' +
      '<path d="M14 40Q32 56 50 40" fill="none" stroke="#2F7D2F" stroke-width="2.4" stroke-linecap="round"/><circle cx="29" cy="35" r="1" fill="#2F7D2F"/><circle cx="35" cy="35" r="1" fill="#2F7D2F"/>' +
      '<circle cx="14" cy="42" r="3" fill="#3FA83F" opacity=".7"/><circle cx="50" cy="42" r="3" fill="#3FA83F" opacity=".7"/><circle cx="32" cy="30" r="2" fill="#3FA83F" opacity=".6"/>' + E,

    fnraptor: V + '<ellipse cx="32" cy="61" rx="17" ry="2.5" fill="#000" opacity=".16"/>' +
      '<path d="M26 4l3 11-8-3zM36 2l1 12-7-1zM46 6l-3 10-6-5z" fill="#F97316" stroke="#B45309" stroke-width="1" stroke-linejoin="round"/>' +
      '<ellipse cx="32" cy="38" rx="25" ry="21" fill="#86C23A" stroke="#4C7A1C" stroke-width="1.4"/>' +
      '<path d="M16 22q16-10 32 0" fill="none" stroke="#F97316" stroke-width="3" stroke-linecap="round"/><path d="M18 28q14-7 28 0" fill="none" stroke="#F97316" stroke-width="2" stroke-linecap="round" opacity=".8"/>' +
      '<path d="M12 44Q32 36 52 44Q50 58 32 59Q14 58 12 44z" fill="#FFF0C8" stroke="#D9C58A" stroke-width="1"/>' +
      '<path d="M15 45Q32 39 49 45" fill="none" stroke="#6B1E2E" stroke-width="2.6" stroke-linecap="round"/>' +
      '<path d="M19 46l2 4 2-4zM26 45l2 5 2-5zM34 45l2 5 2-5zM41 46l2 4 2-4z" fill="#fff" stroke="#D9C58A" stroke-width=".6" stroke-linejoin="round"/>' +
      '<ellipse cx="28" cy="38" rx="1.5" ry="1" fill="#4C7A1C"/><ellipse cx="36" cy="38" rx="1.5" ry="1" fill="#4C7A1C"/>' +
      '<ellipse cx="21" cy="28" rx="5.5" ry="5" fill="#FDE047" stroke="#4C7A1C" stroke-width="1"/><ellipse cx="43" cy="28" rx="5.5" ry="5" fill="#FDE047" stroke="#4C7A1C" stroke-width="1"/>' +
      '<ellipse cx="21.5" cy="28" rx="1.6" ry="3.6" fill="#1B1230"/><ellipse cx="43.5" cy="28" rx="1.6" ry="3.6" fill="#1B1230"/>' + E,

    /* Rang-Kristalle: Elite (blau, Stern), Champion (Eis-Krone), Unreal (Regenbogen mit glühendem Kern) */
    fnelite: V + '<defs><linearGradient id="fnE1" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#9FE7FF"/><stop offset=".5" stop-color="#5B8CFF"/><stop offset="1" stop-color="#7B4DFF"/></linearGradient></defs>' +
      '<ellipse cx="32" cy="60" rx="15" ry="2.2" fill="#000" opacity=".16"/>' +
      '<path d="M32 2l7 12 14-1-8 11 11 10-14 2-4 14-6-9-6 9-4-14-14-2 11-10-8-11 14 1z" fill="#1E2A6B" stroke="#0F1740" stroke-width="1.2" stroke-linejoin="round"/>' +
      '<path d="M32 10l16 20-16 24-16-24z" fill="url(#fnE1)" stroke="#E6F7FF" stroke-width="1.4" stroke-linejoin="round"/>' +
      facets([["M32 10l16 20H32z", "#fff", .38], ["M32 10L16 30h16z", "#C9F1FF", .45], ["M16 30l16 24V30z", "#2B3CC9", .35], ["M48 30L32 54V30z", "#5B2FD8", .3]]) +
      '<path d="M32 18l5 12-5 14-5-14z" fill="#fff" opacity=".55"/>' + E,

    fnchamp: V + '<defs><linearGradient id="fnC1" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFFFFF"/><stop offset=".5" stop-color="#CFE9FF"/><stop offset="1" stop-color="#B9A6FF"/></linearGradient></defs>' +
      '<ellipse cx="32" cy="60" rx="17" ry="2.2" fill="#000" opacity=".16"/>' +
      '<path d="M6 56l4-30 12 14 10-34 10 34 12-14 4 30z" fill="url(#fnC1)" stroke="#5B54C8" stroke-width="1.6" stroke-linejoin="round"/>' +
      facets([["M32 6l10 34H32z", "#fff", .5], ["M32 6L22 40h10z", "#9CB8FF", .35], ["M10 26l12 14-6 16z", "#8F7BFF", .35], ["M54 26L42 40l6 16z", "#C8B6FF", .45]]) +
      '<path d="M6 56h52l-3 4H9z" fill="#5B54C8"/><circle cx="32" cy="34" r="3.2" fill="#A78BFA" stroke="#fff" stroke-width="1"/>' + E,

    fnunreal: V + '<defs><linearGradient id="fnU1" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FF8FD0"/><stop offset=".33" stop-color="#8F7DFF"/><stop offset=".66" stop-color="#37C6E8"/><stop offset="1" stop-color="#FFD66B"/></linearGradient>' +
      '<radialGradient id="fnU2"><stop offset="0" stop-color="#FFF4C2"/><stop offset=".5" stop-color="#FF9B4A"/><stop offset="1" stop-color="#C2410C"/></radialGradient></defs>' +
      '<ellipse cx="32" cy="60" rx="18" ry="2.3" fill="#000" opacity=".18"/>' +
      '<path d="M10 14l10-4 12-9 12 9 10 4 4 16-4 16-10 6-12 8-12-8-10-6-4-16z" fill="#2A1759" stroke="#12082E" stroke-width="1.2" stroke-linejoin="round"/>' +
      '<path d="M32 4l22 10 4 17-6 18-20 11-20-11-6-18 4-17z" fill="none" stroke="url(#fnU1)" stroke-width="3" stroke-linejoin="round"/>' +
      '<path d="M2 36l8-4 6 14-6 6zM62 36l-8-4-6 14 6 6z" fill="#BFE7FF" stroke="#5B8CFF" stroke-width="1.2" stroke-linejoin="round"/>' +
      '<path d="M16 22l8 18-14-6zM48 22l-8 18 14-6z" fill="#E6F3FF" stroke="#7B8CFF" stroke-width="1.2" stroke-linejoin="round"/>' +
      '<path d="M32 6l9 24-9 24-9-24z" fill="url(#fnU1)" stroke="#fff" stroke-width="1.5" stroke-linejoin="round"/>' +
      facets([["M32 6l9 24H32z", "#fff", .45], ["M32 6l-9 24h9z", "#fff", .15], ["M32 54L23 30h9z", "#3B2A9E", .35]]) +
      '<path d="M32 22l5.5 8-5.5 10-5.5-10z" fill="url(#fnU2)" stroke="#FFE8A8" stroke-width="1" stroke-linejoin="round"/>' +
      '<path d="M52 12l1.2 2.8 2.8 1.2-2.8 1.2L52 20l-1.2-2.8-2.8-1.2 2.8-1.2z" fill="#fff"/>' + E
  };
  if (global.VTC && global.VTC.ART) { Object.keys(ART).forEach(function (k) { global.VTC.ART[k] = ART[k]; }); }
})(window);
