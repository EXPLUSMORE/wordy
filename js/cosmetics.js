/* Wordy – Sammelobjekte: gezeichnete Figuren, Rahmen, Hintergründe, Effekte, Töne.
   Der Katalog (Preise, Namen) steht in engine.js; hier steht nur, wie etwas aussieht und klingt. */
(function (global) {
  "use strict";

  /* ---------- Pummelfiguren ---------- */
  /* Gemeinsame Form: runder Körper, Füße, Augen, Bäckchen, Mund. Varianten ergänzen Ohren und Besonderheiten. */
  function pummel(o) {
    var eye = o.eye || "#3B2A4A", pupil = o.pupil || "#fff";
    var s = '<svg viewBox="0 0 64 64" width="1.25em" height="1.25em" style="display:block" aria-hidden="true">';
    if (o.defs) s += '<defs>' + o.defs + '</defs>';
    s += (o.behind || "");
    s += '<ellipse cx="22" cy="58" rx="7" ry="4" fill="' + o.shade + '"/><ellipse cx="42" cy="58" rx="7" ry="4" fill="' + o.shade + '"/>';
    s += (o.ears || "");
    s += '<ellipse cx="32" cy="39" rx="25" ry="20" fill="' + o.body + '"/>';
    s += (o.front || "");
    if (!o.ownFace) {   // Figuren mit eigenem Gesicht (z. B. Clombo) zeichnen Augen, Wangen und Mund selbst
      s += '<circle cx="23" cy="37" r="3.6" fill="' + eye + '"/><circle cx="41" cy="37" r="3.6" fill="' + eye + '"/>';
      s += '<circle cx="24.2" cy="35.8" r="1.2" fill="' + pupil + '"/><circle cx="42.2" cy="35.8" r="1.2" fill="' + pupil + '"/>';
      s += '<ellipse cx="15" cy="44" rx="4.5" ry="3" fill="#FF8FB8" opacity=".8"/><ellipse cx="49" cy="44" rx="4.5" ry="3" fill="#FF8FB8" opacity=".8"/>';
      s += (o.face || '<path d="M27 46q5 5 10 0" fill="none" stroke="#3B2A4A" stroke-width="2" stroke-linecap="round"/>');
    }
    return s + '</svg>';
  }
  function star(x, y, r, c) {
    return '<path d="M' + x + ' ' + (y - r) + 'l' + (r * .3) + ' ' + (r * .7) + 'l' + (r * .7) + ' ' + (r * .3) + 'l-' + (r * .7) + ' ' + (r * .3) +
      'l-' + (r * .3) + ' ' + (r * .7) + 'l-' + (r * .3) + '-' + (r * .7) + 'l-' + (r * .7) + '-' + (r * .3) + 'l' + (r * .7) + '-' + (r * .3) + 'z" fill="' + c + '"/>';
  }
  var HORN = '<path d="M32 2l-6 19h12z" fill="#FFD34D" stroke="#E0A800" stroke-width="1.5" stroke-linejoin="round"/>';
  var MOUTH_CAT = '<path d="M28 45q2 3 4 0q2 3 4 0" fill="none" stroke="#3B2A4A" stroke-width="1.8" stroke-linecap="round"/>';

  var ART = {
    pummel: pummel({
      body: "#FFC9E3", shade: "#F7A8CF",
      ears: '<circle cx="16" cy="21" r="7" fill="#FFC9E3"/><circle cx="48" cy="21" r="7" fill="#FFC9E3"/><circle cx="16" cy="22" r="3.5" fill="#FF9CC6"/><circle cx="48" cy="22" r="3.5" fill="#FF9CC6"/>',
      front: HORN + '<circle cx="22" cy="23" r="5" fill="#8ED8F8"/><circle cx="32" cy="21" r="5" fill="#B9F0B4"/><circle cx="42" cy="23" r="5" fill="#C9A7F5"/>'
    }),
    eisbaer: pummel({
      body: "#F4F8FC", shade: "#C9DCEE",
      ears: '<circle cx="14" cy="21" r="7" fill="#F4F8FC"/><circle cx="50" cy="21" r="7" fill="#F4F8FC"/><circle cx="14" cy="22" r="3.4" fill="#BFD6EC"/><circle cx="50" cy="22" r="3.4" fill="#BFD6EC"/>',
      front: '<ellipse cx="32" cy="46" rx="10.5" ry="7.5" fill="#FFFFFF"/><ellipse cx="32" cy="42.6" rx="3.6" ry="2.5" fill="#2B2F45"/><path d="M12 30q-2-6 2-8M52 30q2-6-2-8" fill="none" stroke="#DCEBF8" stroke-width="2" stroke-linecap="round"/>',
      face: '<path d="M28 48.5q4 3.5 8 0" fill="none" stroke="#2B2F45" stroke-width="1.8" stroke-linecap="round"/>',
      eye: "#2B2F45"
    }),
    pbaer: pummel({
      body: "#D9A877", shade: "#B98557",
      ears: '<circle cx="14" cy="19" r="8" fill="#D9A877"/><circle cx="50" cy="19" r="8" fill="#D9A877"/><circle cx="14" cy="20" r="4" fill="#F1C9A0"/><circle cx="50" cy="20" r="4" fill="#F1C9A0"/>',
      front: '<ellipse cx="32" cy="46" rx="10" ry="7" fill="#F6DDBF"/><ellipse cx="32" cy="43" rx="3.4" ry="2.4" fill="#3B2A4A"/>',
      face: '<path d="M28 48q4 3.5 8 0" fill="none" stroke="#3B2A4A" stroke-width="1.8" stroke-linecap="round"/>'
    }),
    phase: pummel({
      body: "#F4F2FA", shade: "#DAD6EA",
      ears: '<ellipse cx="22" cy="12" rx="6" ry="15" fill="#F4F2FA"/><ellipse cx="42" cy="12" rx="6" ry="15" fill="#F4F2FA"/><ellipse cx="22" cy="13" rx="3" ry="10" fill="#FFB8D4"/><ellipse cx="42" cy="13" rx="3" ry="10" fill="#FFB8D4"/>',
      front: '<ellipse cx="32" cy="43" rx="3" ry="2.2" fill="#FF8FB8"/>',
      face: '<path d="M27 46q5 4.5 10 0" fill="none" stroke="#3B2A4A" stroke-width="1.8" stroke-linecap="round"/><rect x="29.6" y="47" width="2.4" height="4" rx="1" fill="#fff" stroke="#DAD6EA" stroke-width=".6"/><rect x="32" y="47" width="2.4" height="4" rx="1" fill="#fff" stroke="#DAD6EA" stroke-width=".6"/>'
    }),
    pkatze: pummel({
      body: "#FFD9A8", shade: "#F2B676",
      ears: '<path d="M9 28L13 6l17 12z" fill="#FFD9A8"/><path d="M55 28L51 6L34 18z" fill="#FFD9A8"/><path d="M14 22l1.5-10 8 6z" fill="#FF9CB8"/><path d="M50 22l-1.5-10-8 6z" fill="#FF9CB8"/>',
      front: '<path d="M27 22v6M32 21v7M37 22v6" stroke="#E59A4B" stroke-width="2.4" stroke-linecap="round"/><path d="M30 41h4l-2 2.6z" fill="#FF7FA6"/>' +
        '<path d="M8 43l9 1.5M8 48l9-1M56 43l-9 1.5M56 48l-9-1" stroke="#fff" stroke-width="1.2" stroke-linecap="round" opacity=".9"/>',
      face: MOUTH_CAT
    }),
    pdrache: pummel({
      body: "#9EE6A8", shade: "#6FCB86",
      behind: '<ellipse cx="7" cy="38" rx="8" ry="11" fill="#7FD895" transform="rotate(-18 7 38)"/><ellipse cx="57" cy="38" rx="8" ry="11" fill="#7FD895" transform="rotate(18 57 38)"/>',
      ears: '<path d="M16 22L12 6l12 10z" fill="#FFB84D"/><path d="M48 22L52 6L40 16z" fill="#FFB84D"/>',
      front: '<ellipse cx="32" cy="48" rx="12" ry="8" fill="#C9F5CD"/><path d="M26 22l3-7 3 6 3-6 3 7" fill="#6FCB86"/><circle cx="29" cy="44" r="1" fill="#6FCB86"/><circle cx="35" cy="44" r="1" fill="#6FCB86"/>'
    }),
    /* Clombo-artiges Fantasiewesen: lila Körper, Rückenstacheln, große blaue Augen, riesiges Maul */
    clombo: pummel({
      defs: '<linearGradient id="pmCl" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#FF8FD0"/><stop offset=".55" stop-color="#8F7DFF"/><stop offset="1" stop-color="#37C6E8"/></linearGradient>',
      body: "#B063CC", shade: "#8E48AE",
      behind: '<path d="M54 40q10-4 8-14q-8 2-12 10z" fill="#8E48AE"/><path d="M54 40q8-2 8-12" fill="none" stroke="#FF8FD0" stroke-width="1.5" stroke-linecap="round"/>' +
        '<path d="M13 22l3-15 7 11 4-14 6 13 5-13 4 14 7-11 3 15z" fill="url(#pmCl)" stroke="#6E3C97" stroke-width="1" stroke-linejoin="round"/>',
      ears: '<circle cx="21" cy="62" r="1.6" fill="#37C6E8"/><circle cx="43" cy="62" r="1.6" fill="#37C6E8"/>',
      front: '<circle cx="20" cy="27" r="7" fill="#8FE4F7" stroke="#37C6E8" stroke-width="1.5"/><circle cx="44" cy="27" r="7" fill="#8FE4F7" stroke="#37C6E8" stroke-width="1.5"/>' +
        '<circle cx="21" cy="28" r="3.6" fill="#1B1230"/><circle cx="45" cy="28" r="3.6" fill="#1B1230"/><circle cx="22.4" cy="26.4" r="1.3" fill="#fff"/><circle cx="46.4" cy="26.4" r="1.3" fill="#fff"/>' +
        '<path d="M12 40q20 6 40 0q-2 20-20 20q-18 0-20-20z" fill="#7A1630"/>' +
        '<path d="M12 40q20 6 40 0" fill="none" stroke="#FFF1D6" stroke-width="2.4" stroke-linecap="round"/>' +
        '<path d="M17 42l3 6 3-4 3 6 3-5 3 6 3-5 3 6 3-4 3 5 3-5" fill="none"/>' +
        '<path d="M17 41.5l2.6 6.5 2.6-5.6zM25 43l2.6 7 2.6-6zM33 43.5l2.6 7 2.6-6.4zM41 43l2.6 6.6 2.4-6zM46 41.5l2 5 2.4-5z" fill="#FFF1D6"/>' +
        '<ellipse cx="32" cy="55" rx="9.5" ry="4.8" fill="#FF6F8E"/><path d="M32 51v8" stroke="#D84A6C" stroke-width="1.2" stroke-linecap="round"/>',
      ownFace: true
    }),
    pphoenix: pummel({
      body: "#FFB36B", shade: "#F28A3D",
      behind: '<path d="M2 40q4-18 16-14l-3 14z" fill="#F2593D"/><path d="M62 40q-4-18-16-14l3 14z" fill="#F2593D"/>',
      ears: '',
      front: '<path d="M32 3q-5 8-1 12q-8-2-9 6q4-3 10-1q6-2 10 1q-1-8-9-6q4-4-1-12z" fill="#FFD34D"/><path d="M32 8q-2 5 0 9q2-4 0-9z" fill="#F2593D"/><path d="M29 41l3 5 3-5z" fill="#FFD34D" stroke="#E0A800" stroke-width="1" stroke-linejoin="round"/>',
      face: ''
    }),
    pgold: pummel({
      body: "#FFD65C", shade: "#E8B22B",
      ears: '<circle cx="16" cy="21" r="7" fill="#FFD65C"/><circle cx="48" cy="21" r="7" fill="#FFD65C"/><circle cx="16" cy="22" r="3.5" fill="#FFF1B0"/><circle cx="48" cy="22" r="3.5" fill="#FFF1B0"/>',
      front: '<path d="M32 2l-6 19h12z" fill="#FFF8D6" stroke="#E8B22B" stroke-width="1.5" stroke-linejoin="round"/><circle cx="22" cy="23" r="5" fill="#FFF8D6"/><circle cx="32" cy="21" r="5" fill="#FFFFFF"/><circle cx="42" cy="23" r="5" fill="#FFF8D6"/>' +
        star(10, 14, 4, "#FFF") + star(55, 12, 3, "#FFF") + star(56, 50, 3.5, "#FFF1B0")
    }),
    pregen: pummel({
      defs: '<linearGradient id="pmRb" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FF8FA3"/><stop offset=".25" stop-color="#FFD27A"/><stop offset=".5" stop-color="#9BE8A8"/><stop offset=".75" stop-color="#8ED0F8"/><stop offset="1" stop-color="#C6A4F5"/></linearGradient>',
      body: "url(#pmRb)", shade: "#B9A3E8",
      ears: '<circle cx="16" cy="21" r="7" fill="#FF8FA3"/><circle cx="48" cy="21" r="7" fill="#C6A4F5"/><circle cx="16" cy="22" r="3.5" fill="#FFD6DE"/><circle cx="48" cy="22" r="3.5" fill="#E7DAFB"/>',
      front: HORN + star(10, 16, 4, "#FFD34D") + star(55, 14, 3.5, "#8ED0F8") + star(55, 52, 3, "#FF8FA3")
    }),
    flamingo: pummel({
      defs: '<radialGradient id="pmDb" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#fff"/><stop offset=".6" stop-color="#BFC8E0"/><stop offset="1" stop-color="#7A86B0"/></radialGradient>',
      body: "#FF6FA8", shade: "#D63F86", eye: "#2B2166",
      front: '<circle cx="32" cy="9" r="10" fill="url(#pmDb)" stroke="#5A6796" stroke-width="1"/><path d="M23 6h18M22 11h20M32 -1v20M27 0q-4 9 0 18M37 0q4 9 0 18" stroke="#fff" stroke-width=".8" opacity=".7" fill="none"/>' + star(40, 4, 2.6, "#FFE27A") +
        '<path d="M28 41l4 7 4-7z" fill="#FFB84D" stroke="#E08A0A" stroke-width="1" stroke-linejoin="round"/><path d="M13 33c-5-5-3-9 1.4-9c2 0 2.6 1.6 2.6 2.6c0-1 .6-2.6 2.6-2.6c4.4 0 6.4 4 1.4 9l-4 4z" fill="#FF2D78" stroke="#8A0F44" stroke-width=".9"/><path d="M33 33c-5-5-3-9 1.4-9c2 0 2.6 1.6 2.6 2.6c0-1 .6-2.6 2.6-2.6c4.4 0 6.4 4 1.4 9l-4 4z" fill="#FF2D78" stroke="#8A0F44" stroke-width=".9" transform="translate(8 0)"/>',
      face: ''
    }),
    faultier: pummel({
      body: "#A67C52", shade: "#6E4B2C", eye: "#2B1A0C",
      ears: '<circle cx="15" cy="24" r="6" fill="#A67C52"/><circle cx="49" cy="24" r="6" fill="#A67C52"/>',
      front: '<ellipse cx="32" cy="45" rx="11" ry="7.5" fill="#F2DFC4"/><ellipse cx="32" cy="42.4" rx="3.2" ry="2.2" fill="#3A2410"/><path d="M14 33q9-8 16 2q-6 8-14 4z" fill="#5A3B1E"/><path d="M50 33q-9-8-16 2q6 8 14 4z" fill="#5A3B1E"/>' +
        '<ellipse cx="32" cy="9" rx="17" ry="7" fill="#FF8FC0" stroke="#C23A7A" stroke-width="1.2"/><ellipse cx="32" cy="9" rx="6" ry="2.4" fill="#2B1A0C" opacity=".6"/><path d="M22 7l2 1M40 6l-2 1.4M28 12l1-2M36 12l-1-2" stroke="#fff" stroke-width="1.4" stroke-linecap="round"/><path d="M26 5l1 2M37 10l-2-1" stroke="#7BE9FF" stroke-width="1.4" stroke-linecap="round"/>',
      face: '<path d="M18.5 37a4.6 4.6 0 0 1 9.2 0z" fill="#A67C52" stroke="#2B1A0C" stroke-width=".9"/><path d="M36.5 37a4.6 4.6 0 0 1 9.2 0z" fill="#A67C52" stroke="#2B1A0C" stroke-width=".9"/><path d="M28 48q4 3 8 0" fill="none" stroke="#3A2410" stroke-width="1.8" stroke-linecap="round"/>'
    }),
    cyberfuchs: pummel({
      body: "#141C45", shade: "#080C26", eye: "#00F0FF", pupil: "#fff",
      ears: '<path d="M8 32L10 4l18 14z" fill="#141C45"/><path d="M56 32L54 4L36 18z" fill="#141C45"/><path d="M13 24l1.5-13 8 6z" fill="#00E5FF"/><path d="M51 24l-1.5-13-8 6z" fill="#00E5FF"/><path d="M11 6V0" stroke="#FF3DF0" stroke-width="1.4"/><circle cx="11" cy="0" r="2" fill="#FF3DF0"/><path d="M53 6V0" stroke="#FF3DF0" stroke-width="1.4"/><circle cx="53" cy="0" r="2" fill="#FF3DF0"/>',
      front: '<ellipse cx="32" cy="46" rx="11" ry="7.4" fill="#1D2A5E"/><ellipse cx="32" cy="42.6" rx="3.4" ry="2.4" fill="#00E5FF"/><path d="M12 30h10l3 4M52 30H42l-3 4M20 52h8M36 52h8" stroke="#00E5FF" stroke-width="1.3" stroke-linecap="round" fill="none"/><circle cx="12" cy="30" r="1.6" fill="#00E5FF"/><circle cx="52" cy="30" r="1.6" fill="#00E5FF"/>' +
        '<path d="M10 25q22-9 44 0v5q-22-8-44 0z" fill="#0B1233" stroke="#00E5FF" stroke-width="1"/><circle cx="20" cy="25.5" r="1.3" fill="#FF3DF0"/><circle cx="32" cy="24.2" r="1.3" fill="#00F0FF"/><circle cx="44" cy="25.5" r="1.3" fill="#FF3DF0"/>',
      face: '<path d="M28 49q4 3.4 8 0" fill="none" stroke="#00E5FF" stroke-width="1.6" stroke-linecap="round"/>'
    }),
    pirat: pummel({
      body: "#E02F3F", shade: "#A31524", eye: "#1B1230", pupil: "#fff",
      front: '<path d="M26 41l6 9 6-9z" fill="#FFB84D" stroke="#E08A0A" stroke-width="1" stroke-linejoin="round"/>' +
        '<circle cx="23" cy="37" r="5.6" fill="#14121f"/><path d="M17 33L10 24M27 33L40 24" stroke="#14121f" stroke-width="1.2" stroke-linecap="round"/>' +
        '<path d="M8 27Q32-14 56 27Q32 18 8 27z" fill="#1B1B2F" stroke="#FFD34D" stroke-width="1.3" stroke-linejoin="round"/><circle cx="32" cy="12" r="4.4" fill="#fff"/><circle cx="30.4" cy="11.4" r="1" fill="#1B1B2F"/><circle cx="33.6" cy="11.4" r="1" fill="#1B1B2F"/><path d="M30.4 15h3.2" stroke="#1B1B2F" stroke-width="1"/>' +
        '<circle cx="10" cy="44" r="3.4" fill="none" stroke="#FFD34D" stroke-width="1.5"/>',
      face: ''
    }),
    zauber: pummel({
      body: "#6D4FD8", shade: "#3B2791", eye: "#4B2FB8", pupil: "#fff",
      ears: '<path d="M9 28L13 6l17 12z" fill="#6D4FD8"/><path d="M55 28L51 6L34 18z" fill="#6D4FD8"/><path d="M14 22l1.5-10 8 6z" fill="#FFD34D"/><path d="M50 22l-1.5-10-8 6z" fill="#FFD34D"/>',
      front: '<ellipse cx="32" cy="45" rx="10" ry="7" fill="#E6DCFF"/><path d="M28 41l4 8 4-8z" fill="#FFD34D" stroke="#E08A0A" stroke-width="1" stroke-linejoin="round"/>' +
        '<path d="M10 27Q30 22 54 27Q44 24 40 14Q36 -6 30 0Q24 10 20 22z" fill="#3B2791" stroke="#FFD34D" stroke-width="1.2" stroke-linejoin="round"/><ellipse cx="32" cy="26.5" rx="25" ry="3.4" fill="#4B2FB8" stroke="#FFD34D" stroke-width="1"/>' + star(31, 12, 4, "#FFE27A") + star(43, 20, 2.4, "#fff"),
      face: ''
    }),
    gepard: pummel({
      body: "#F6B73C", shade: "#C27A14", eye: "#2B1A00", pupil: "#fff",
      ears: '<circle cx="14" cy="20" r="8" fill="#F6B73C"/><circle cx="50" cy="20" r="8" fill="#F6B73C"/><circle cx="14" cy="21" r="4" fill="#3B2410"/><circle cx="50" cy="21" r="4" fill="#3B2410"/>',
      front: '<ellipse cx="32" cy="46" rx="11" ry="7.4" fill="#FFF3C9"/><path d="M31 42h2l-1 2z" fill="#3B2410"/>' +
        '<g fill="#3B2410"><circle cx="19" cy="30" r="1.5"/><circle cx="14" cy="38" r="1.4"/><circle cx="45" cy="30" r="1.5"/><circle cx="50" cy="38" r="1.4"/><circle cx="27" cy="21" r="1.4"/><circle cx="37" cy="21" r="1.4"/></g>' +
        '<path d="M22 37q-2 6 1 10M42 37q2 6-1 10" fill="none" stroke="#3B2410" stroke-width="1.8" stroke-linecap="round"/>' +
        '<path d="M9 25q23-12 46 0v6q-23-10-46 0z" fill="#FF5A36" stroke="#8E2410" stroke-width="1"/><circle cx="21" cy="27" r="5.6" fill="#7BE9FF" fill-opacity=".75" stroke="#14213D" stroke-width="1.6"/><circle cx="43" cy="27" r="5.6" fill="#7BE9FF" fill-opacity=".75" stroke="#14213D" stroke-width="1.6"/>' +
        '<path d="M4 40h8M3 45h9M60 40h-8M61 45h-9" stroke="#FFFFFF" stroke-width="1.6" stroke-linecap="round" opacity=".85"/>',
      face: '<path d="M28 50q4 3 8 0" fill="none" stroke="#3B2410" stroke-width="1.8" stroke-linecap="round"/>'
    }),
    yeti: pummel({
      body: "#E4F1FF", shade: "#B6D4F2", eye: "#1B2A5A", pupil: "#fff",
      ears: '<circle cx="14" cy="22" r="7" fill="#E4F1FF"/><circle cx="50" cy="22" r="7" fill="#E4F1FF"/>',
      front: '<path d="M32 22q-12 0-18 12q-2 12 6 18q12 8 24 0q8-6 6-18q-6-12-18-12z" fill="#A9D6FF" stroke="#7FB8E8" stroke-width="1"/><ellipse cx="32" cy="43" rx="3.4" ry="2.4" fill="#2B4A8A"/>' +
        '<path d="M22 14l-3-10 8 7zM32 11l0-11 5 10zM42 14l4-10 3 11z" fill="#CFF6FF" stroke="#7FB8E8" stroke-width="1" stroke-linejoin="round"/><path d="M10 38l-4 2M54 38l4 2" stroke="#fff" stroke-width="2" stroke-linecap="round"/>',
      face: '<path d="M27 48q5 5 10 0" fill="none" stroke="#2B4A8A" stroke-width="1.8" stroke-linecap="round"/>'
    }),
    blitzwolf: pummel({
      body: "#33448F", shade: "#1B2660", eye: "#00D4F0", pupil: "#fff",
      ears: '<path d="M8 32L10 4l18 14z" fill="#33448F"/><path d="M56 32L54 4L36 18z" fill="#33448F"/><path d="M13 24l1.5-13 8 6z" fill="#FFD84A"/><path d="M51 24l-1.5-13-8 6z" fill="#FFD84A"/>',
      front: '<ellipse cx="32" cy="46" rx="11" ry="7.6" fill="#CFE4FF"/><ellipse cx="32" cy="42.6" rx="3.6" ry="2.5" fill="#0E1538"/>' +
        '<path d="M33 18l-7 10h5l-3 8 9-12h-5z" fill="#FFD84A" stroke="#C98A00" stroke-width="1" stroke-linejoin="round"/>' +
        '<path d="M9 36l6-6-1.6 5h4l-6 8 1.6-5.4z" fill="#FFD84A"/><path d="M55 36l-6-6 1.6 5h-4l6 8-1.6-5.4z" fill="#FFD84A"/>' + star(9, 16, 3, "#FFD84A") + star(55, 14, 3.4, "#7BE9FF"),
      face: '<path d="M28 49q4 3.4 8 0" fill="none" stroke="#0E1538" stroke-width="1.8" stroke-linecap="round"/>'
    }),
    ninja: pummel({
      body: "#2E2358", shade: "#17113A", eye: "#9A4CFF", pupil: "#fff",
      ears: '<path d="M9 28L13 6l17 12z" fill="#2E2358"/><path d="M55 28L51 6L34 18z" fill="#2E2358"/><path d="M14 22l1.5-10 8 6z" fill="#E63946"/><path d="M50 22l-1.5-10-8 6z" fill="#E63946"/>',
      front: '<path d="M8 27q24-9 48 0v8q-24-9-48 0z" fill="#E63946" stroke="#9E1B28" stroke-width="1"/><rect x="26" y="25.5" width="12" height="7" rx="1.6" fill="#D7DEE9" stroke="#6C7890" stroke-width="1"/><path d="M32 27.4l1 2-1 2-1-2z" fill="#6C7890"/>' +
        '<path d="M55 29l8-3-2 5 5 4-9-.4z" fill="#E63946" stroke="#9E1B28" stroke-width=".8" stroke-linejoin="round"/>' +
        '<path d="M30 42h4l-2 2.6z" fill="#E63946"/><path d="M8 44l9 1.5M8 49l9-1M56 44l-9 1.5M56 49l-9-1" stroke="#B9A8F0" stroke-width="1.2" stroke-linecap="round" opacity=".9"/>',
      face: '<path d="M28 46q2 3 4 0q2 3 4 0" fill="none" stroke="#B9A8F0" stroke-width="1.8" stroke-linecap="round"/>'
    }),
    sdrache: pummel({
      defs: '<linearGradient id="pmSd" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9AFBE6"/><stop offset="1" stop-color="#1FB59A"/></linearGradient>',
      body: "url(#pmSd)", shade: "#0F6F7F", eye: "#6A2CFF", pupil: "#fff",
      behind: '<ellipse cx="6" cy="36" rx="8" ry="12" fill="#3A2D8F" transform="rotate(-18 6 36)"/><ellipse cx="58" cy="36" rx="8" ry="12" fill="#3A2D8F" transform="rotate(18 58 36)"/>' + star(5, 30, 2.4, "#FFE27A") + star(59, 40, 2.4, "#7BE9FF"),
      ears: '<path d="M14 26L6 3l17 12z" fill="#FFD34D" stroke="#E0A800" stroke-width="1.2" stroke-linejoin="round"/><path d="M50 26L58 3L41 15z" fill="#FFD34D" stroke="#E0A800" stroke-width="1.2" stroke-linejoin="round"/>',
      front: '<path d="M22 22q2-12 5-6q1-9 5-12q4 3 5 12q3-6 5 6z" fill="#FFB61E" stroke="#E0780A" stroke-width="1.2" stroke-linejoin="round"/><path d="M28 22q1-6 4-9q3 3 4 9z" fill="#FFF1A8"/>' +
        '<ellipse cx="32" cy="47" rx="12" ry="8" fill="#FFF2B8"/><circle cx="29" cy="44" r="1" fill="#1FB59A"/><circle cx="35" cy="44" r="1" fill="#1FB59A"/>' + star(14, 30, 2.2, "#fff") + star(51, 28, 2.6, "#FFE27A") + star(46, 52, 2, "#7BE9FF"),
      face: '<path d="M27 49q5 4 10 0" fill="none" stroke="#0F6F7F" stroke-width="1.8" stroke-linecap="round"/>'
    }),
    pgalaxie: pummel({
      body: "#4B3B8F", shade: "#3A2D73", eye: "#fff", pupil: "#4B3B8F",
      ears: '<circle cx="16" cy="21" r="7" fill="#4B3B8F"/><circle cx="48" cy="21" r="7" fill="#4B3B8F"/><circle cx="16" cy="22" r="3.5" fill="#7A63D1"/><circle cx="48" cy="22" r="3.5" fill="#7A63D1"/>',
      front: '<path d="M32 2l-6 19h12z" fill="#FFE27A" stroke="#E8B22B" stroke-width="1.5" stroke-linejoin="round"/><circle cx="22" cy="23" r="5" fill="#59D6F0"/><circle cx="32" cy="21" r="5" fill="#FF7FD0"/><circle cx="42" cy="23" r="5" fill="#59D6F0"/>' +
        star(14, 40, 2.2, "#fff") + star(50, 34, 2.6, "#FFE27A") + star(44, 52, 2, "#fff") + star(20, 50, 1.8, "#59D6F0") + star(54, 8, 3, "#fff") + star(9, 12, 2.4, "#FFE27A"),
      face: '<path d="M27 46q5 5 10 0" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round"/>'
    })
  };
  function avatarHtml(v, esc) {
    if (/^svg:/.test(v)) return ART[v.slice(4)] || ART.pummel;
    if (ART[v]) return ART[v];   // Emoji-Figuren, die als gezeichnete Figur vorliegen
    return esc ? esc(v) : String(v);
  }

  /* ---------- Rahmen und Hintergründe: Aussehen steht als CSS in index.html, hier nur die Auswahl ---------- */
  function frameClass(p) { var f = (p && p.frame) || "none"; return f === "none" ? "" : "fr-" + f; }
  /* mode: "auto" (folgt dem Gerät), "light" oder "dark" */
  var DESIGNS = [["gold", "Nachtgold", "Dunkelblau mit Gold, hell auch cremefarben", "linear-gradient(135deg,#0E1320 40%,#E9BD62)"], ["sun", "Sonnenschein", "Warm, hell und bunt", "linear-gradient(135deg,#FFE9B8,#FF7A3D)"], ["aurora", "Aurora", "Nachthimmel mit Polarlicht", "linear-gradient(135deg,#0A0F2C 30%,#5CF2C0 75%,#9A64FF)"], ["klassisch", "Klassisch", "Das bisherige Papier-Design", "linear-gradient(135deg,#EEF2F8,#1E6273)"]];
  var BAR = { gold: ["#10162A", "#F6F1E6"], sun: ["#FFF4DC"], aurora: ["#0A0F2C"], klassisch: ["#EEF2F8"] };
  function applyLook(p, mode, design, season) {
    var root = document.documentElement;
    if (season) root.setAttribute("data-season", season); else root.removeAttribute("data-season");
    design = design || "gold";
    if (design === "klassisch") { root.removeAttribute("data-design"); root.removeAttribute("data-x"); }
    else { root.setAttribute("data-design", design); root.setAttribute("data-x", "1"); }
    try {   // Farbe der Browserleiste
      var dark = design === "aurora" || (design === "gold" && (mode === "dark" || (mode !== "light" && global.matchMedia && global.matchMedia("(prefers-color-scheme: dark)").matches)));
      var m = document.querySelector('meta[name="theme-color"]'); if (!m) { m = document.createElement("meta"); m.setAttribute("name", "theme-color"); document.head.appendChild(m); }
      m.setAttribute("content", season === "halloween" ? "#180A24" : season === "winter" ? "#0A1636" : season === "xmas" ? "#C81E4B" : season === "spring" ? "#0AA5C8" : season === "aqua" ? "#06406E" : design === "gold" ? (dark ? BAR.gold[0] : BAR.gold[1]) : (BAR[design] || BAR.klassisch)[0]);
    } catch (e) {}
    if (mode === "light" || mode === "dark") root.setAttribute("data-theme", mode); else root.removeAttribute("data-theme");
    root.setAttribute("data-accent", (p && p.theme) || "paper");
    root.setAttribute("data-bg", (p && p.bg) || "none");
  }

  /* ---------- Effekte ---------- */
  var reduce = false;
  try { reduce = global.matchMedia && global.matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (e) {}
  var layer = null;
  function getLayer() {
    if (layer && layer.parentNode) return layer;
    layer = document.createElement("div");
    layer.setAttribute("aria-hidden", "true");
    layer.style.cssText = "position:fixed;inset:0;pointer-events:none;z-index:200;overflow:hidden";
    document.body.appendChild(layer);
    return layer;
  }
  var COLORS = ["#FF6B8B", "#FFC94D", "#6BD99B", "#5BB8FF", "#B58CFF", "#FF9A5C"];
  function particle(kind, x, y, power) {
    var el = document.createElement("span"), a = Math.random() * Math.PI * 2, d = (30 + Math.random() * 70) * power;
    var dx = Math.cos(a) * d, dy = Math.sin(a) * d - 20 * power, c = COLORS[Math.floor(Math.random() * COLORS.length)];
    var size = 6 + Math.random() * 6, life = 650 + Math.random() * 500;
    var css = "position:absolute;left:" + x + "px;top:" + y + "px;display:block;";
    if (kind === "stars") { el.textContent = "★"; css += "color:#FFC94D;font-size:" + (size + 8) + "px;line-height:1;"; }
    else if (kind === "snow") { css += "width:" + (size * .8) + "px;height:" + (size * .8) + "px;border-radius:50%;background:#fff;box-shadow:0 0 6px #bfe9ff;"; }
    else if (kind === "pixel") { var pc = ["#00F0FF", "#FF3DF0", "#7BFF7B", "#FFE27A"][Math.floor(Math.random() * 4)]; css += "width:" + (size * .8) + "px;height:" + (size * .8) + "px;background:" + pc + ";box-shadow:0 0 6px " + pc + ";"; }
    else if (kind === "gold") { css += "width:" + (size + 2) + "px;height:" + (size + 2) + "px;border-radius:50%;background:radial-gradient(circle at 35% 30%,#FFF6B0,#FFC93D 60%,#C8860A);border:1.5px solid #8A5A00;"; }
    else if (kind === "magie") { el.textContent = Math.random() < .5 ? "✦" : "✧"; css += "color:" + ["#B58CFF", "#FFE27A", "#8ED0F8"][Math.floor(Math.random() * 3)] + ";font-size:" + (size + 8) + "px;line-height:1;text-shadow:0 0 8px #B58CFF;"; }
    else if (kind === "sparks") { css += "width:3px;height:" + (size + 6) + "px;border-radius:2px;background:" + c + ";transform:rotate(" + (a * 57.3 + 90) + "deg);"; }
    else { css += "width:" + size + "px;height:" + (size * .6) + "px;background:" + c + ";border-radius:1px;"; }
    el.style.cssText = css;
    getLayer().appendChild(el);
    var rot = (Math.random() - .5) * 720;
    var fall = kind === "confetti" || kind === "stars" || kind === "pixel" || kind === "gold" || kind === "magie" ? 60 * power : kind === "snow" ? 90 * power : 0;
    var an = el.animate([
      { transform: "translate(0,0) rotate(0deg)", opacity: 1 },
      { transform: "translate(" + dx + "px," + (dy + fall) + "px) rotate(" + rot + "deg)", opacity: 0 }
    ], { duration: life, easing: "cubic-bezier(.2,.7,.3,1)" });
    an.onfinish = function () { el.remove(); };
  }
  /* kleiner Effekt bei einer richtigen Antwort; x/y in Bildschirmpixeln */
  function burst(kind, x, y, n, power) {
    if (reduce || !kind || kind === "none") return;
    var k = kind === "firework" ? "sparks" : kind;
    for (var i = 0; i < (n || 14); i++) particle(k, x, y, power || 1);
  }
  /* großer Effekt am Rundenende */
  function finale(kind) {
    if (reduce || !kind || kind === "none") return;
    var w = global.innerWidth, h = global.innerHeight;
    if (kind === "firework") {
      [0, 350, 700, 1100].forEach(function (t, i) {
        setTimeout(function () { burst("firework", w * (.2 + .6 * Math.random()), h * (.2 + .3 * Math.random()), 40, 2.2); }, t);
      });
      return;
    }
    for (var i = 0; i < 6; i++) {
      (function (i) { setTimeout(function () { burst(kind, w * (.1 + .8 * Math.random()), h * .25, 22, 2); }, i * 160); })(i);
    }
  }

  /* ---------- Töne (Web Audio, ohne Dateien) ---------- */
  var ac = null;
  function ctx() {
    if (ac) return ac;
    try { var C = global.AudioContext || global.webkitAudioContext; if (C) ac = new C(); } catch (e) {}
    return ac;
  }
  function tone(freq, t0, dur, type, vol) {
    var a = ctx(); if (!a) return;
    var o = a.createOscillator(), g = a.createGain(), t = a.currentTime + t0;
    o.type = type || "sine"; o.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol || 0.15, t + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(a.destination); o.start(t); o.stop(t + dur + 0.05);
  }
  var SOUNDS = {
    bell:   { ok: [[1319, 0, .35, "sine"], [1760, .09, .5, "sine"]], no: [[330, 0, .3, "sine"], [262, .12, .4, "sine"]] },
    arcade: { ok: [[523, 0, .08, "square"], [784, .08, .08, "square"], [1047, .16, .16, "square"]], no: [[196, 0, .12, "square"], [147, .12, .24, "square"]] },
    harp:   { ok: [[523, 0, .5, "triangle"], [659, .07, .5, "triangle"], [784, .14, .6, "triangle"]], no: [[392, 0, .4, "triangle"], [330, .12, .5, "triangle"]] }
  };
  function sound(kind, ok) {
    var set = SOUNDS[kind]; if (!set) return;
    var a = ctx(); if (!a) return;
    if (a.state === "suspended") { try { a.resume(); } catch (e) {} }
    (ok ? set.ok : set.no).forEach(function (n) { tone(n[0], n[1], n[2], n[3], ok ? .13 : .1); });
  }



  /* Spinnen-Effekt-Ton (zum Antippen der Halloween-Spinne): Knarzen, Windstöße beim Schwingen, steigender Ton beim Sprung, Knall und Trippeln */
  function spiderSound(short) {
    var a = ctx(); if (!a) return; if (a.state === "suspended") { try { a.resume(); } catch (e) {} }
    var t0 = a.currentTime + 0.03, m = a.createGain(); m.gain.value = 0.55; m.connect(a.destination);
    var len = a.sampleRate * 1.2, nb = a.createBuffer(1, len, a.sampleRate), d = nb.getChannelData(0); for (var i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    function noise(t, dur, f0, f1, q, vol, type) {
      var s = a.createBufferSource(), f = a.createBiquadFilter(), g = a.createGain(); s.buffer = nb; f.type = type || "bandpass"; f.Q.value = q;
      f.frequency.setValueAtTime(f0, t); f.frequency.exponentialRampToValueAtTime(f1, t + dur);
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + dur * 0.35); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      s.connect(f); f.connect(g); g.connect(m); s.start(t); s.stop(t + dur + 0.05);
    }
    function osc(t, dur, f0, f1, type, vol) {
      var o = a.createOscillator(), g = a.createGain(); o.type = type; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f1, t + dur);
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + Math.min(0.05, dur / 3)); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g); g.connect(m); o.start(t); o.stop(t + dur + 0.05);
    }
    var hit = short ? 0.2 : 5.05;
    if (!short) {
      osc(t0, 0.5, 90, 70, "sawtooth", 0.025);   // Faden knarzt
      [0.9, 1.9, 2.9, 3.8].forEach(function (x, i) { noise(t0 + x, 0.9, 400 + i * 120, 1500 + i * 300, 1.2, 0.09 + i * 0.03); });   // Luftzug beim Vorbeischwingen
      osc(t0 + 4.45, 0.62, 180, 1500, "sawtooth", 0.05); osc(t0 + 4.45, 0.62, 360, 2300, "square", 0.02);   // Sprung
    }
    osc(t0 + hit, 0.55, 110, 38, "sine", 0.5);   // Knall
    noise(t0 + hit, 0.45, 3000, 300, 0.7, 0.35, "lowpass");
    for (var k = 0; k < 22; k++) { var tt = t0 + hit + 0.12 + Math.random() * 1.5; osc(tt, 0.012, 2200 + Math.random() * 2500, 1800, "square", 0.04); }   // Trippeln
    osc(t0 + hit + 0.1, 0.8, 880, 440, "triangle", 0.05);
  }


  /* Baseballschläger-Ton und kleine Töne der Startseiten-Szene */
  function batSound() {
    var a = ctx(); if (!a) return; if (a.state === "suspended") { try { a.resume(); } catch (e) {} }
    var t0 = a.currentTime + 0.02, m = a.createGain(); m.gain.value = 0.6; m.connect(a.destination);
    var len = a.sampleRate * 0.6, nb = a.createBuffer(1, len, a.sampleRate), d = nb.getChannelData(0); for (var i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    function nz(t, dur, f0, f1, q, vol, type) { var s = a.createBufferSource(), f = a.createBiquadFilter(), g = a.createGain(); s.buffer = nb; f.type = type || "bandpass"; f.Q.value = q; f.frequency.setValueAtTime(f0, t); f.frequency.exponentialRampToValueAtTime(f1, t + dur); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + dur * 0.5); g.gain.exponentialRampToValueAtTime(0.0001, t + dur); s.connect(f); f.connect(g); g.connect(m); s.start(t); s.stop(t + dur + 0.05); }
    function os(t, dur, f0, f1, type, vol) { var o = a.createOscillator(), g = a.createGain(); o.type = type; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f1, t + dur); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + Math.min(0.02, dur / 3)); g.gain.exponentialRampToValueAtTime(0.0001, t + dur); o.connect(g); g.connect(m); o.start(t); o.stop(t + dur + 0.05); }
    var hit = t0 + 1.56;
    os(t0 + 0.05, 0.9, 140, 90, "sawtooth", 0.018);            // Faden knarzt, Spinne gleitet herab
    nz(t0 + 1.0, 0.25, 300, 700, 1.2, 0.06);                    // Ausholen
    nz(t0 + 1.3, 0.28, 500, 2800, 1.1, 0.26);                   // Schwung: Zischen
    nz(hit - 0.01, 0.12, 2500, 900, 0.8, 0.6, "highpass");     // Krack
    os(hit, 0.18, 190, 70, "sine", 0.7);                       // dumpfer Schlag
    os(hit, 0.5, 2300, 2100, "sine", 0.12);                    // heller Ping wie beim Baseball
    os(hit + 0.04, 1.5, 1700, 260, "triangle", 0.07);          // Spinne pfeift davon
    os(hit + 1.75, 0.25, 1800, 2600, "sine", 0.06);            // fernes Plink
  }
  function homeSound(kind) {
    var a = ctx(); if (!a) return; if (a.state === "suspended") { try { a.resume(); } catch (e) {} }
    var t = a.currentTime + 0.01, m = a.createGain(); m.gain.value = 0.5; m.connect(a.destination);
    function os(dt, dur, f0, f1, type, vol, vib) { var o = a.createOscillator(), g = a.createGain(); o.type = type; o.frequency.setValueAtTime(f0, t + dt); o.frequency.exponentialRampToValueAtTime(f1, t + dt + dur); if (vib) { var v = a.createOscillator(), vg = a.createGain(); v.frequency.value = 7; vg.gain.value = vib; v.connect(vg); vg.connect(o.frequency); v.start(t + dt); v.stop(t + dt + dur); } g.gain.setValueAtTime(0.0001, t + dt); g.gain.exponentialRampToValueAtTime(vol, t + dt + Math.min(0.03, dur / 3)); g.gain.exponentialRampToValueAtTime(0.0001, t + dt + dur); o.connect(g); g.connect(m); o.start(t + dt); o.stop(t + dt + dur + 0.05); }
    if (kind === "pk") { os(0, 0.12, 300, 700, "triangle", 0.2); os(0.1, 0.18, 500, 1100, "triangle", 0.15); os(0.22, 0.25, 800, 400, "sine", 0.1); }
    else if (kind === "gs") { os(0, 0.9, 190, 120, "sine", 0.18, 6); os(0.05, 0.9, 285, 180, "sine", 0.07, 8); }
    else if (kind === "ping") { os(0, 0.25, 2600, 2000, "sine", 0.14); os(0, 0.12, 1300, 900, "triangle", 0.1); }
    else if (kind === "splat") { os(0, 0.25, 160, 50, "sine", 0.5); for (var q = 0; q < 6; q++) os(0.03 + q * 0.05, 0.1, 500 - q * 50, 200, "sawtooth", 0.06); os(0.05, 0.3, 900, 150, "triangle", 0.1); }
    else if (kind === "jojo") { for (var j = 0; j < 4; j++) { os(j * 1.05 + 0.3, 0.5, 220, 520 - j * 60, "triangle", 0.12 - j * 0.02, 5); os(j * 1.05 + 0.55, 0.3, 520, 160, "sine", 0.1 - j * 0.015); } os(4.25, 0.25, 300, 1400, "sine", 0.08); }
    else if (kind === "netz") { for (var n = 0; n < 7; n++) os(0.8 + n * 0.07, 0.25, 700 + n * 120, 3200, "sawtooth", 0.035); for (var m = 0; m < 6; m++) os(1.5 + m * 0.22, 0.2, 1500 + m * 160, 2400 + m * 200, "sine", 0.04); for (var s = 0; s < 8; s++) os(3 + s * 0.15, 0.08, 3000 + Math.random() * 1500, 4200, "sine", 0.03); }
    else if (kind === "regen") { for (var r = 0; r < 24; r++) os(0.1 + Math.random() * 1.2, 0.06, 2000 + Math.random() * 2000, 1500, "square", 0.025); os(0.1, 0.8, 600, 180, "triangle", 0.06); os(3.1, 0.7, 200, 900, "triangle", 0.06); }
    else { os(0, 0.07, 3400, 2200, "square", 0.05); os(0.09, 0.07, 3800, 2600, "square", 0.05); os(0.3, 0.3, 900, 200, "triangle", 0.08); }
  }

  /* ---------- Halloween-Klangteppich (Web Audio, leise, ohne Dateien): Brummen, Wind, Spieluhr, ab und zu eine Eule ---------- */
  var amb = null;
  var NOTES = [220, 261.6, 293.7, 329.6, 392, 440, 523.3, 587.3];   // A-Moll-Pentatonik und Terz
  function ambientStart() {
    if (amb) return true;
    var a = ctx(); if (!a) return false;
    if (a.state === "suspended") { try { a.resume(); } catch (e) {} }
    var m = a.createGain(); m.gain.value = 0.0001; m.connect(a.destination);
    m.gain.exponentialRampToValueAtTime(0.5, a.currentTime + 4);
    var echo = a.createDelay(1.2), fb = a.createGain(), wet = a.createGain(); echo.delayTime.value = 0.46; fb.gain.value = 0.38; wet.gain.value = 0.5;
    echo.connect(fb); fb.connect(echo); echo.connect(wet); wet.connect(m);
    var nodes = [], timers = [];
    function osc(f, type, vol, lfoHz, lfoDepth) {
      var o = a.createOscillator(), g = a.createGain(); o.type = type; o.frequency.value = f; g.gain.value = vol; o.connect(g); g.connect(m); o.start(); nodes.push(o);
      if (lfoHz) { var l = a.createOscillator(), lg = a.createGain(); l.frequency.value = lfoHz; lg.gain.value = lfoDepth; l.connect(lg); lg.connect(g.gain); l.start(); nodes.push(l); }
    }
    osc(55, "sine", 0.05, 0.07, 0.025); osc(82.4, "triangle", 0.025, 0.05, 0.015); osc(110.4, "sine", 0.018, 0.09, 0.012);   // dunkles Brummen, atmet langsam
    var len = a.sampleRate * 2, buf = a.createBuffer(1, len, a.sampleRate), d = buf.getChannelData(0); for (var i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    var ns = a.createBufferSource(); ns.buffer = buf; ns.loop = true;
    var bp = a.createBiquadFilter(); bp.type = "bandpass"; bp.frequency.value = 520; bp.Q.value = 1.4;
    var ng = a.createGain(); ng.gain.value = 0.02; ns.connect(bp); bp.connect(ng); ng.connect(m); ns.start(); nodes.push(ns);
    var wl = a.createOscillator(), wg = a.createGain(); wl.frequency.value = 0.08; wg.gain.value = 260; wl.connect(wg); wg.connect(bp.frequency); wl.start(); nodes.push(wl);   // Wind heult langsam auf und ab
    var wl2 = a.createOscillator(), wg2 = a.createGain(); wl2.frequency.value = 0.05; wg2.gain.value = 0.012; wl2.connect(wg2); wg2.connect(ng.gain); wl2.start(); nodes.push(wl2);
    function note(f, t, dur, vol) {   // Spieluhr-Ton mit Echo
      var o = a.createOscillator(), o2 = a.createOscillator(), g = a.createGain(); o.type = "sine"; o2.type = "triangle"; o.frequency.value = f; o2.frequency.value = f * 2.005;
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.012); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g); o2.connect(g); g.connect(m); g.connect(echo); o.start(t); o2.start(t); o.stop(t + dur + .1); o2.stop(t + dur + .1);
    }
    var pos = 3;
    function melody() {
      var t = a.currentTime + 0.05, n = 3 + Math.floor(Math.random() * 3);
      for (var k = 0; k < n; k++) { pos = Math.max(0, Math.min(NOTES.length - 1, pos + [-2, -1, -1, 1, 1, 2][Math.floor(Math.random() * 6)])); note(NOTES[pos], t + k * 0.52, 1.6, 0.03); }
      timers.push(setTimeout(melody, 5500 + Math.random() * 6500));
    }
    function owl() {   // zwei tiefe, wabernde „Huu“
      var t = a.currentTime + 0.05;
      [[330, 0], [294, 0.55]].forEach(function (x) {
        var o = a.createOscillator(), g = a.createGain(), v = a.createOscillator(), vg = a.createGain(); o.type = "sine"; o.frequency.value = x[0]; v.frequency.value = 5; vg.gain.value = 5; v.connect(vg); vg.connect(o.frequency);
        g.gain.setValueAtTime(0.0001, t + x[1]); g.gain.exponentialRampToValueAtTime(0.035, t + x[1] + 0.12); g.gain.exponentialRampToValueAtTime(0.0001, t + x[1] + 0.7);
        o.connect(g); g.connect(m); g.connect(echo); o.start(t + x[1]); v.start(t + x[1]); o.stop(t + x[1] + 0.8); v.stop(t + x[1] + 0.8);
      });
      timers.push(setTimeout(owl, 28000 + Math.random() * 30000));
    }
    timers.push(setTimeout(melody, 2500)); timers.push(setTimeout(owl, 12000 + Math.random() * 9000));
    amb = { m: m, nodes: nodes, timers: timers };
    return true;
  }
  function ambientStop() {
    if (!amb) return; var x = amb, a = ac; amb = null;
    x.timers.forEach(clearTimeout);
    try { x.m.gain.cancelScheduledValues(a.currentTime); x.m.gain.setValueAtTime(Math.max(0.0001, x.m.gain.value), a.currentTime); x.m.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + 1.2); } catch (e) {}
    setTimeout(function () { x.nodes.forEach(function (n) { try { n.stop(); } catch (e) {} }); try { x.m.disconnect(); } catch (e) {} }, 1400);
  }

  /* ---------- Lektionsfinale: Zahlen, Balken, Münzen, Effekte nacheinander ---------- */
  function countUp(el, to, ms, suffix) {
    suffix = suffix || "";
    if (reduce || !global.requestAnimationFrame) { el.textContent = to + suffix; return; }
    var t0 = global.performance.now();
    (function f(t) {
      var k = Math.min(1, (t - t0) / ms); k = 1 - Math.pow(1 - k, 3);
      el.textContent = Math.round(to * k) + suffix;
      if (k < 1) global.requestAnimationFrame(f);
    })(t0);
  }
  function flyCoins(from, to, n) {
    if (reduce || !from || !to) return;
    var a = from.getBoundingClientRect(), b = to.getBoundingClientRect();
    for (var i = 0; i < n; i++) {
      (function (i) {
        var c = document.createElement("span"); c.textContent = "🪙";
        c.style.cssText = "position:fixed;left:" + (a.left + a.width / 2) + "px;top:" + (a.top + a.height / 2) + "px;font-size:22px;z-index:210;pointer-events:none;opacity:0";
        document.body.appendChild(c);
        var dx = b.left + b.width / 2 - (a.left + a.width / 2), dy = b.top + b.height / 2 - (a.top + a.height / 2);
        var an = c.animate([
          { transform: "translate(0,0) scale(.6)", opacity: 0 },
          { transform: "translate(" + dx * .15 + "px," + (dy * .15 - 50) + "px) scale(1.2)", opacity: 1, offset: .25 },
          { transform: "translate(" + dx + "px," + dy + "px) scale(.8)", opacity: 1 }
        ], { duration: 800, delay: i * 90, easing: "cubic-bezier(.4,0,.2,1)", fill: "both" });
        an.onfinish = function () { c.remove(); };
      })(i);
    }
  }
  /* root = Abschlussbildschirm; o = {pct0, pct1, rankUp, coins, perfect, ok, fx, snd, audio} */
  function runFinale(root, o) {
    var secs = root.querySelectorAll(".sbody .stack > section");
    for (var i = 0; i < secs.length; i++) { secs[i].classList.add("fin-in"); secs[i].style.setProperty("--d", (i * 0.2) + "s"); }
    root.querySelectorAll("[data-count]").forEach(function (el) { countUp(el, +el.getAttribute("data-count"), 1000, el.getAttribute("data-suffix") || ""); });
    var bar = root.querySelector(".fin-bar i"), banner = root.querySelector(".fin-rankup");
    if (bar) {
      var set = function (w, anim) { bar.style.transition = anim ? "width 1s cubic-bezier(.2,.8,.2,1)" : "none"; bar.style.width = w + "%"; };
      set(o.pct0, false); void bar.offsetWidth;
      global.setTimeout(function () { set(o.rankUp ? 100 : o.pct1, !reduce); }, 700);
      if (o.rankUp) global.setTimeout(function () {
        set(0, false); void bar.offsetWidth; set(o.pct1, !reduce);
        if (banner) banner.classList.add("show");
        burst("stars", global.innerWidth / 2, global.innerHeight * .3, 24, 1.8);
        if (global.navigator.vibrate) { try { global.navigator.vibrate([30, 50, 30]); } catch (e) {} }
      }, 1900);
    }
    if (o.coins > 0) {
      var chip = root.querySelector(".fin-coin b");
      if (chip) countUp(chip, o.coins, 900, "");
      global.setTimeout(function () { flyCoins(root.querySelector(".fin-xp"), root.querySelector(".fin-coin"), Math.min(9, o.coins)); }, 900);
    }
    if (o.ok) {
      global.setTimeout(function () { finale(o.fx && o.fx !== "none" ? o.fx : "confetti"); }, 500);
      if (o.perfect) global.setTimeout(function () { finale("firework"); }, 1500);
      if (o.snd && o.audio) global.setTimeout(function () { sound(o.snd, true); }, 450);
    }
  }

  /* ---------- Sticker: Stanzrand, Schatten, Glanz ---------- */
  var cutDone = false, maskCache = {};
  function ensureCutFilters() {
    if (cutDone || !document.body) return; cutDone = true;
    var d = document.createElement("div");
    d.setAttribute("aria-hidden", "true"); d.style.cssText = "position:absolute;width:0;height:0;overflow:hidden";
    var f = function (id, r) {
      return '<filter id="' + id + '" x="-25%" y="-25%" width="150%" height="150%"><feMorphology in="SourceAlpha" operator="dilate" radius="' + r + '" result="d"/>' +
        '<feGaussianBlur in="d" stdDeviation="' + (r / 6).toFixed(2) + '" result="db"/><feFlood flood-color="#fff"/><feComposite in2="db" operator="in" result="w"/>' +
        '<feMerge><feMergeNode in="w"/><feMergeNode in="SourceGraphic"/></feMerge></filter>';
    };
    d.innerHTML = '<svg width="0" height="0">' + f("cutS", 2.2) + f("cutL", 5) + '</svg>';
    document.body.appendChild(d);
  }
  function maskUrl(val) {   // Umriss der Figur als Maske, damit der Glanz nur auf der Figur läuft
    if (maskCache[val]) return maskCache[val];
    var svg = ART[/^svg:/.test(val) ? val.slice(4) : val]; if (!svg) return "";
    svg = svg.replace("<svg ", '<svg xmlns="http://www.w3.org/2000/svg" ').replace('width="1.25em" height="1.25em"', 'width="200" height="200"');
    return (maskCache[val] = 'url("data:image/svg+xml,' + encodeURIComponent(svg) + '")');
  }
  /* size in px; shine = Glanz (nur für gezeichnete Figuren); tilt = Neigung in Grad */
  function stickerHtml(val, size, tilt, shine, esc) {
    ensureCutFilters();
    var drawn = /^svg:/.test(val) || !!ART[val], big = size >= 90;
    var inner = drawn ? (ART[/^svg:/.test(val) ? val.slice(4) : val] || ART.pummel) : (esc ? esc(val) : String(val));
    var holo = drawn && shine && size >= 44 ? '<span class="stk-holo" style="-webkit-mask-image:' + maskUrl(val) + ';mask-image:' + maskUrl(val) + '"></span>' : "";
    return '<span class="stk" style="--s:' + size + 'px;--r:' + (tilt || 0) + 'deg;--f:' + (drawn ? 1 : 0.62) + '">' +
      '<span class="stk-cut" style="filter:url(#' + (big ? "cutL" : "cutS") + ')">' + inner + '</span>' + holo + '</span>';
  }

  /* Siegertanz: Figur tanzt kurz auf einer Bühne; Tippen beendet ihn. Bei „Bewegung reduzieren“ nur ein kleiner Hüpfer. */
  function dance(o) {
    var old = document.getElementById("dnOv"); if (old) old.remove();
    var ov = document.createElement("div"); ov.id = "dnOv"; ov.className = "dn-ov" + (reduce ? " dn-reduce" : "");
    var conf = "", cols = ["#ff3d9a", "#35e0ff", "#ffd23d", "#7cff6b", "#fff"], D = { wackler: 1, huepfer: 2, drehung: 3, roboter: 4, moonwalk: 5, sieg: 6, eislauf: 7 };
    if (!reduce && (o.big || o.dance === "sieg")) for (var i = 0; i < 18; i++) conf += '<i style="left:' + (i * 5.5 + Math.random() * 3).toFixed(1) + '%;background:' + cols[i % 5] + ';animation-delay:' + (Math.random() * 1.6).toFixed(2) + 's"></i>';
    var A = global.VTA && global.VTA.has(o.av), fig = A ? global.VTA.dancer(o.av, o.outfit, D[o.dance] || 1) : global.VTFIG.figure(o.av, o.outfit, o.avatar).replace('class="fig ', 'class="fig d' + (D[o.dance] || 1) + ' ');
    ov.innerHTML = '<div class="dn-stage"><div class="dn-beam dn-b1"></div><div class="dn-beam dn-b2"></div><div class="dn-floor"></div><div class="dn-conf">' + conf + '</div>' +
      '<div class="dn-sh"></div><div class="dn-fw' + (A ? " dn-fwa" : "") + '">' + fig + '</div>' + (o.title ? '<div class="dn-title">' + o.title + '</div>' : "") + '</div>';
    document.body.appendChild(ov);
    var done = function () { if (!ov.parentNode) return; ov.classList.add("out"); global.setTimeout(function () { if (ov.parentNode) ov.remove(); }, 300); };
    ov.addEventListener("click", done);
    global.setTimeout(done, reduce ? 1800 : 4200);
  }
  global.VTC = { ctx: ctx, batSound: batSound, homeSound: homeSound, spiderSound: spiderSound, ambientStart: ambientStart, ambientStop: ambientStop, ambientOn: function () { return !!amb; }, dance: dance, stickerHtml: stickerHtml, runFinale: runFinale, avatarHtml: avatarHtml, frameClass: frameClass, applyLook: applyLook, DESIGNS: DESIGNS, burst: burst, finale: finale, sound: sound, ART: ART };
})(window);
