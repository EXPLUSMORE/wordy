/* Ganze Figuren: jede Figur hat einen eigenen Körper (Farben, Schwanz, Flügel, Panzer, Flossen …), der Kopf ist ihre bekannte Zeichnung.
   Arme, Beine und Schwanz sind einzelne Teile und werden von den Tänzen (CSS, index.html) bewegt. Outfits liegen als Kleidung darüber. */
(function (global) {
  "use strict";
  /* Eintrag: [Typ, Gliedmaßen, Bauch, Füße, Schwanz, Schwanzfarbe, Zusatz, Zusatzfarbe]
     Typ: fur | bird | tent | crys; Schwanz: fox cat dino fish pom rb tuft feat sting – (keiner);  Zusatz: shell fin spikes wings stripes */
  var S = {
    "🦊": ["fur", "#F28A30", "#FFF2E0", "#4A3020", "fox", "#F28A30"],
    "🐼": ["fur", "#2B2B33", "#F6F6F6", "#2B2B33", "pom", "#F6F6F6"],
    "🐢": ["fur", "#7FBF5A", "#EAD99E", "#6AA84A", "", "", "shell", "#3F8F3A"],
    "🦉": ["bird", "#A9743F", "#EBCB9C", "#F2A93D", "feat", "#8A5A2C"],
    "🐙": ["tent", "#B06AD6", "#D9A8EE", "#B06AD6", "", ""],
    "🦕": ["fur", "#5CC27A", "#DDF3B8", "#4AA865", "dino", "#5CC27A", "spikes", "#3E9B5C"],
    "🦈": ["fur", "#6C8FAF", "#E8F0F6", "#5A7B99", "fish", "#5A7B99", "fin", "#5A7B99"],
    "🦄": ["fur", "#F3ECFF", "#FFFFFF", "#C9A7FF", "rb", ""],
    "🐝": ["fur", "#2B2B33", "#FFD23D", "#2B2B33", "sting", "#2B2B33", "wings", "#CDEEFF"],
    "🦁": ["fur", "#E5A33B", "#F7D9A0", "#B87A22", "tuft", "#E5A33B", "", "#8A4B14"],
    "🐧": ["bird", "#2B3A55", "#FFFFFF", "#F59E0B", "pom", "#2B3A55"],
    "🐨": ["fur", "#A9A9B6", "#E9E9F0", "#8E8E9C", "", ""],
    "svg:pummel": ["fur", "#FFC9E3", "#FFF4FA", "#F7A8CF", "rb", ""],
    "svg:eisbaer": ["fur", "#F4F8FC", "#FFFFFF", "#BFD3E6", "pom", "#FFFFFF"],
    "svg:pbaer": ["fur", "#D9A877", "#F6E0C2", "#B98557", "pom", "#F6E0C2"],
    "svg:phase": ["fur", "#F4F2FA", "#FFFFFF", "#DAD6EA", "pom", "#FFFFFF"],
    "svg:pkatze": ["fur", "#FFD9A8", "#FFF1DC", "#F2B676", "cat", "#FFD9A8"],
    "svg:pdrache": ["fur", "#9EE6A8", "#E3F9D9", "#6FCB86", "dino", "#9EE6A8", "spikes", "#6FCB86"],
    "svg:clombo": ["fur", "#B063CC", "#D9A8EE", "#8E48AE", "cat", "#B063CC"],
    "svg:pphoenix": ["bird", "#FFB36B", "#FFE0B0", "#F28A3D", "feat", "#F28A3D"],
    "svg:pgold": ["fur", "#FFD65C", "#FFF0B0", "#E8B22B", "pom", "#FFF0B0"],
    "svg:pregen": ["fur", "#B9A3E8", "#FFFFFF", "#9C86D8", "rb", ""],
    "svg:pgalaxie": ["fur", "#4B3B8F", "#6C5BC0", "#3A2D73", "pom", "#6C5BC0"],
    "svg:fnhuhn": ["bird", "#F1E8D0", "#FFFDF5", "#F59E0B", "feat", "#F1E8D0"],
    "svg:fnschwein": ["fur", "#9A6240", "#E7B197", "#5E361F", "pom", "#E7B197"],
    "svg:fnfrosch": ["fur", "#5CCB5C", "#C8F5B0", "#3FA83F", "", ""],
    "svg:fnwolf": ["fur", "#9AA5BA", "#E7ECF4", "#444E63", "tuft", "#9AA5BA", "", "#E7ECF4"],
    "svg:fnraptor": ["fur", "#86C23A", "#E6F5C0", "#4C7A1C", "dino", "#86C23A", "spikes", "#F97316"],
    "svg:fnllama": ["fur", "#B05CF0", "#FF7EC7", "#4B2A8A", "pom", "#FF7EC7"],
    "svg:fnkristall": ["fur", "#BFE9FF", "#FFFFFF", "#7FA8FF", "pom", "#FFFFFF"],
    "svg:fnelite": ["crys", "#5B8CFF", "#9FE7FF", "#1E2A6B", "", ""],
    "svg:fnchamp": ["crys", "#CFE9FF", "#FFFFFF", "#5B54C8", "", ""],
    "svg:fnunreal": ["crys", "#8F7DFF", "#FFD66B", "#C2410C", "", ""]
  };
  /* Trikots: Farben und Streifen (keine Wappen oder Sponsoren), Rückennummer immer 7. [Shirt-Hintergrund, Ärmel, Hose, Stutzen, Kragen, Nummer, Nummern-Schatten] */
  var KITS = {
    "k-muenchen": ["linear-gradient(#d4151f,#d4151f)", "#d4151f", "#ffffff", "#d4151f", "#ffffff", "#ffffff", "rgba(0,0,0,.35)"],
    "k-barcelona": ["repeating-linear-gradient(90deg,#a50044 0 7px,#004d98 7px 14px)", "#004d98", "#1b2a6b", "#1b2a6b", "#edbb00", "#ffffff", "rgba(0,0,0,.6)"],
    "k-turin": ["repeating-linear-gradient(90deg,#111 0 7px,#fff 7px 14px)", "#111111", "#111111", "#ffffff", "#111111", "#e53935", "#ffffff"],
    "k-deutschland": ["linear-gradient(#ffffff,#f1f1f4)", "#ffffff", "#111111", "#ffffff", "#111111", "#111111", "rgba(255,255,255,.4)"],
    "k-argentinien": ["repeating-linear-gradient(90deg,#74acdf 0 7px,#fff 7px 14px)", "#74acdf", "#111111", "#ffffff", "#111111", "#111111", "#ffffff"],
    "k-portugal": ["linear-gradient(#c1121f,#c1121f)", "#c1121f", "#0b6b3a", "#c1121f", "#0b6b3a", "#f7d117", "rgba(0,0,0,.4)"]
  };
  var EMB = { trikot: "7", held: "★", raum: "★", rock: "♪", polar: "❄" };
  /* Eigene Köpfe für Figuren, deren Emoji/Zeichnung schon ein ganzes Tier zeigt (sonst säße ein Tier auf dem Körper) */
  var V = '<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">';
  function eyes(y, dx, r, c) { return '<circle cx="' + (32 - dx) + '" cy="' + y + '" r="' + r + '" fill="' + (c || "#1B1230") + '"/><circle cx="' + (32 + dx) + '" cy="' + y + '" r="' + r + '" fill="' + (c || "#1B1230") + '"/><circle cx="' + (32 - dx + 1.3) + '" cy="' + (y - 1.3) + '" r="' + r * .35 + '" fill="#fff"/><circle cx="' + (32 + dx + 1.3) + '" cy="' + (y - 1.3) + '" r="' + r * .35 + '" fill="#fff"/>'; }
  var cheeks = '<ellipse cx="17" cy="42" rx="4.5" ry="3" fill="#FF8FA8" opacity=".5"/><ellipse cx="47" cy="42" rx="4.5" ry="3" fill="#FF8FA8" opacity=".5"/>';
  var smile = '<path d="M26 43q6 6 12 0" fill="none" stroke="#1B1230" stroke-width="2.2" stroke-linecap="round"/>';
  var HEAD = {
    "🐢": V + '<ellipse cx="32" cy="36" rx="25" ry="23" fill="#7FBF5A" stroke="#4B8A3A" stroke-width="1.6"/><ellipse cx="32" cy="46" rx="15" ry="9" fill="#B8E08A" opacity=".7"/>' + eyes(30, 10, 4.6) + cheeks + smile + '<circle cx="28" cy="36" r="1" fill="#4B8A3A"/><circle cx="36" cy="36" r="1" fill="#4B8A3A"/></svg>',
    "🐙": V + '<path d="M6 44C4 14 18 4 32 4s28 10 26 40c-4 8-48 8-52 0z" fill="#B06AD6" stroke="#7E3FA3" stroke-width="1.6"/><circle cx="20" cy="16" r="3" fill="#D9A8EE"/><circle cx="46" cy="20" r="2.4" fill="#D9A8EE"/><circle cx="34" cy="11" r="2" fill="#D9A8EE"/>' + eyes(34, 10, 5.4) + cheeks + '<path d="M27 46q5 4 10 0" fill="none" stroke="#1B1230" stroke-width="2.2" stroke-linecap="round"/></svg>',
    "🦕": V + '<path d="M12 22l4-12 7 8 9-12 9 12 7-8 4 12z" fill="#3E9B5C"/><ellipse cx="32" cy="38" rx="24" ry="21" fill="#5CC27A" stroke="#2F7D4A" stroke-width="1.6"/><ellipse cx="32" cy="48" rx="15" ry="9" fill="#DDF3B8"/>' + eyes(32, 11, 4.6) + '<circle cx="28" cy="47" r="1.3" fill="#2F7D4A"/><circle cx="36" cy="47" r="1.3" fill="#2F7D4A"/><path d="M25 53q7 4 14 0" fill="none" stroke="#1B1230" stroke-width="2" stroke-linecap="round"/></svg>',
    "🦈": V + '<path d="M28 18L36 2l6 16z" fill="#5A7B99"/><ellipse cx="32" cy="38" rx="26" ry="21" fill="#6C8FAF" stroke="#44627F" stroke-width="1.6"/><path d="M8 46q24 18 48 0v6q-24 16-48 0z" fill="#E8F0F6"/>' + eyes(32, 12, 4.4) + '<path d="M18 48l3 4 3-4 3 4 3-4 3 4 3-4 3 4 3-4 3 4 3-4" fill="none" stroke="#fff" stroke-width="1.8" stroke-linejoin="round"/><path d="M18 48q14 4 28 0" fill="none" stroke="#1B1230" stroke-width="1.8"/></svg>',
    "🐧": V + '<ellipse cx="32" cy="36" rx="25" ry="24" fill="#2B3A55" stroke="#161F33" stroke-width="1.6"/><path d="M12 38c2-14 12-16 20-10 8-6 18-4 20 10 -2 12-12 18-20 18s-18-6-20-18z" fill="#fff"/>' + eyes(34, 10, 4.2) + '<path d="M26 42h12l-6 8z" fill="#F59E0B" stroke="#D97706" stroke-width="1" stroke-linejoin="round"/>' + cheeks + '</svg>',
    "🐝": V + '<path d="M22 14l-7-10M42 14l7-10" stroke="#2B2B33" stroke-width="2.4" stroke-linecap="round"/><circle cx="14.5" cy="4.5" r="2.6" fill="#2B2B33"/><circle cx="49.5" cy="4.5" r="2.6" fill="#2B2B33"/><ellipse cx="32" cy="38" rx="25" ry="22" fill="#FFD23D" stroke="#C99A00" stroke-width="1.6"/><path d="M9 22q23-8 46 0" fill="none" stroke="#2B2B33" stroke-width="4" stroke-linecap="round" opacity=".85"/>' + eyes(36, 10, 5.2) + cheeks + smile + '</svg>',
    "svg:fnllama": V + '<path d="M16 22L12 2l10 12zM48 22l4-20-10 12z" fill="#C06CF5" stroke="#4B2A8A" stroke-width="1.2" stroke-linejoin="round"/><ellipse cx="32" cy="36" rx="22" ry="25" fill="#B05CF0" stroke="#4B2A8A" stroke-width="1.6"/><ellipse cx="32" cy="46" rx="13" ry="10" fill="#D79BFF" stroke="#4B2A8A" stroke-width="1"/><path d="M18 18q14-9 28 0" fill="none" stroke="#FF7EC7" stroke-width="4" stroke-linecap="round"/>' + eyes(32, 10, 4.2) + '<ellipse cx="28" cy="45" rx="1.5" ry="2" fill="#4B2A8A"/><ellipse cx="36" cy="45" rx="1.5" ry="2" fill="#4B2A8A"/><path d="M27 51q5 3 10 0" fill="none" stroke="#4B2A8A" stroke-width="1.8" stroke-linecap="round"/></svg>',
    "svg:fnkristall": V + '<path d="M16 22L12 2l10 12zM48 22l4-20-10 12z" fill="#CFF6FF" stroke="#3E5BB8" stroke-width="1.2" stroke-linejoin="round"/><ellipse cx="32" cy="36" rx="22" ry="25" fill="#BFE9FF" stroke="#3E5BB8" stroke-width="1.6"/><ellipse cx="32" cy="46" rx="13" ry="10" fill="#F2FCFF" stroke="#3E5BB8" stroke-width="1"/><path d="M26 16l6 10 6-10z" fill="#fff" opacity=".7"/>' + eyes(32, 10, 4.2) + '<ellipse cx="28" cy="45" rx="1.5" ry="2" fill="#3E5BB8"/><ellipse cx="36" cy="45" rx="1.5" ry="2" fill="#3E5BB8"/><path d="M27 51q5 3 10 0" fill="none" stroke="#3E5BB8" stroke-width="1.8" stroke-linecap="round"/></svg>'
  };
  var DEF = ["fur", "#9BB0C8", "#EEF3F8", "#5A6B80", "pom", "#EEF3F8"];
  function figure(av, outfit, headHtml) {
    var d = S[av] || DEF, t = d[0], ex = d[6] || "";
    var st = "--limb:" + d[1] + ";--belly:" + d[2] + ";--feet:" + d[3] + ";--tl:" + d[5] + ";--ex:" + (d[7] || d[1]) + ";--tt:" + (d[7] || "#fff");
    var back = "";
    if (d[4]) back += '<div class="tail t-' + d[4] + '"></div>';
    if (ex === "shell") back += '<div class="shell"></div>';
    if (ex === "fin") back += '<div class="fin"></div>';
    if (ex === "spikes") back += '<div class="spk"></div>';
    if (ex === "wings") back += '<div class="wg wg1"></div><div class="wg wg2"></div>';
    if (t === "tent") back += '<div class="te te1"></div><div class="te te2"></div>';
    back += '<div class="cape"></div>';
    var kit = KITS[outfit], ofc = kit ? " kit of-kit" : " of-" + (outfit || "natur");
    if (kit) st += ";--tb:" + kit[0] + ";--sl:" + kit[1] + ";--pc:" + kit[2] + ";--sk:" + kit[3] + ";--col:" + kit[4] + ";--nc:" + kit[5] + ";--ns:" + kit[6];
    return '<div class="fig k-' + t + (ex === "stripes" ? " stripes" : "") + ofc + '" style="' + st + '">' +
      '<div class="bk">' + back + '</div><div class="ll lg"></div><div class="lr lg"></div><div class="to" data-e="' + (kit ? "7" : (EMB[outfit] || "")) + '"><i></i></div>' +
      '<div class="al ar"></div><div class="arr ar"></div><div class="hd">' + (HEAD[av] || headHtml) + '</div></div>';
  }
  global.VTFIG = { figure: figure };
})(window);
