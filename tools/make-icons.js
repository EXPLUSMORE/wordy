/* Erzeugt die App-Symbole (Wordy und Dashboard) im Nachtgold-Stil.
   Aufruf: NODE_PATH=$(npm root -g) node tools/make-icons.js   (vorher: node build.js, damit docs/ aktuell ist)
   Wordy → icons/*.png, Dashboard → server/public/app/*.png. Clombo wird aus der App selbst gezeichnet. */
const { chromium } = require("playwright"), { spawn } = require("child_process"), fs = require("fs"), path = require("path");
const ROOT = path.join(__dirname, ".."), PORT = 18700 + Math.floor(Math.random() * 100);
const NAVY = "#0E1320", GOLD = "linear-gradient(#F6CB6A,#D8A445)";
const FONT = "'DM Sans','Nunito',system-ui,'Segoe UI',Arial,sans-serif";
const outline = "filter:drop-shadow(5px 0 0 #fff) drop-shadow(-5px 0 0 #fff) drop-shadow(0 5px 0 #fff) drop-shadow(0 -5px 0 #fff) drop-shadow(4px 4px 0 #fff) drop-shadow(-4px -4px 0 #fff) drop-shadow(4px -4px 0 #fff) drop-shadow(-4px 4px 0 #fff) drop-shadow(0 14px 16px rgba(0,0,0,.5))";
const stars = [[78, 214, 7], [430, 196, 9], [452, 330, 6], [60, 360, 5], [388, 120, 5]].map(([x, y, r]) => `<i style="position:absolute;left:${x}px;top:${y}px;width:${r * 2}px;height:${r * 2}px;background:#FFE7A8;clip-path:polygon(50% 0,62% 38%,100% 50%,62% 62%,50% 100%,38% 62%,0 50%,38% 38%);opacity:.9"></i>`).join("");
const wordy = (svg, k) => `<div style="width:512px;height:512px;position:relative;overflow:hidden;background:radial-gradient(60% 50% at 0% 0%,#5fd6d0,transparent 70%),radial-gradient(70% 60% at 100% 100%,#f060c0,transparent 70%),linear-gradient(150deg,#3aa7e8,#6a5cf0 60%,#a050e0)">
 <div style="position:absolute;inset:0;transform:scale(${k});transform-origin:50% 50%">${stars}
  <div style="position:absolute;left:0;right:0;top:50px;display:flex;justify-content:center;gap:11px">${[..."WORDY"].map((c, i) => `<b style="width:76px;height:80px;border-radius:18px;background:${["#f0587f","#f5a30c","#1fc08f","#2f9bf0","#9a63f0"][i]};color:#fff;font:800 52px/80px ${FONT};text-align:center;border:5px solid #fff;box-sizing:border-box;box-shadow:0 6px 12px rgba(0,0,0,.3);transform:rotate(${[-4, 3, -2, 4, -3][i]}deg)">${c}</b>`).join("")}</div>
  <div style="position:absolute;left:96px;top:150px;width:320px;height:320px;${outline}">${svg}</div></div></div>`;
const dash = k => `<div style="width:512px;height:512px;position:relative;overflow:hidden;background:radial-gradient(70% 60% at 25% 8%,rgba(233,189,98,.38),transparent 62%),radial-gradient(90% 70% at 100% 100%,rgba(14,19,32,.6),transparent 60%),linear-gradient(160deg,#2B8197,#1E6273 45%,#0c3340)">
 <div style="position:absolute;inset:0;transform:scale(${k});transform-origin:50% 50%">
  <div style="position:absolute;left:0;right:0;top:46px;display:flex;justify-content:center;gap:9px">${[..."WORDY"].map((c, i) => `<b style="width:66px;height:70px;border-radius:16px;background:${GOLD};color:#2a1c00;font:800 45px/70px ${FONT};text-align:center;box-shadow:0 6px 0 #9b6f1c,0 10px 16px rgba(0,0,0,.35);transform:rotate(${[-4, 3, -2, 4, -3][i]}deg)">${c}</b>`).join("")}</div>
  <div style="position:absolute;left:56px;top:150px;width:400px;height:306px;border-radius:44px;background:linear-gradient(#FFFDF6,#F6F1E6);box-shadow:0 10px 0 #0f3d4a,0 22px 30px rgba(0,0,0,.35)"></div>
  ${[70, 105, 85, 140, 0, 0, 0].map((h, i) => { const x = 86 + i * 52, tall = [70, 105, 85, 140][i]; return h ? `<b style="position:absolute;left:${x}px;width:40px;top:${420 - tall}px;height:${tall}px;border-radius:12px 12px 6px 6px;background:${i === 3 ? "#D8A445" : ["#9ccbd6", "#5aa3b5", "#1E6273"][i]}"></b>` : `<b style="position:absolute;left:${x}px;width:40px;top:${420 - 46}px;height:46px;border-radius:12px 12px 6px 6px;border:4px dashed #cfc7b2;box-sizing:border-box"></b>`; }).join("")}
  <i style="position:absolute;left:${86 + 3 * 52 - 12}px;top:${420 - 140 - 64}px;width:64px;height:64px;background:linear-gradient(#FFE7A8,#F6CB6A);clip-path:polygon(50% 0,62% 36%,100% 38%,70% 60%,80% 100%,50% 76%,20% 100%,30% 60%,0 38%,38% 36%);filter:drop-shadow(0 5px 0 rgba(0,0,0,.25))"></i></div></div>`;
const face = svg => `<div style="width:32px;height:32px;background:${NAVY};position:relative;overflow:hidden"><div style="position:absolute;left:-2px;top:2px;width:36px;height:36px">${svg}</div></div>`;
(async () => {
  const web = spawn("python3", ["-m", "http.server", String(PORT)], { cwd: path.join(ROOT, "docs"), stdio: "ignore" });
  await new Promise(r => setTimeout(r, 700));
  const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" }), pg = await b.newPage({ viewport: { width: 600, height: 600 } });
  await pg.goto("http://127.0.0.1:" + PORT + "/index.html"); await pg.waitForTimeout(900);
  const svg = (await pg.evaluate(() => VTC.avatarHtml("svg:clombo"))).replace("<svg", '<svg style="width:100%;height:100%;display:block;overflow:visible"');
  const fonts = "https://fonts.googleapis.com/css2?family=DM+Sans:wght@800&display=swap";
  async function shot(html, size, file, scale) {
    await pg.setViewportSize({ width: 600, height: 600 });
    await pg.setContent(`<link rel="stylesheet" href="${fonts}"><body style="margin:0;background:transparent">${html}</body>`); await pg.waitForTimeout(500);
    await pg.evaluate(() => document.fonts && document.fonts.ready);
    const el = await pg.$("body > div"); await el.screenshot({ path: file, omitBackground: true });
    if (size !== 512 && size !== 32) { /* Verkleinern übernimmt der Browser */ }
    if (size < 512) { const png = fs.readFileSync(file).toString("base64"); await pg.setContent(`<body style="margin:0"><img id=i src="data:image/png;base64,${png}" style="width:${size}px;height:${size}px;display:block;image-rendering:auto"></body>`); await (await pg.$("#i")).screenshot({ path: file, omitBackground: true }); }
  }
  const W = path.join(ROOT, "icons"), D = path.join(ROOT, "server", "public", "app"); fs.mkdirSync(D, { recursive: true });
  await shot(wordy(svg, 1), 512, path.join(W, "icon-512.png"));
  await shot(wordy(svg, 1), 192, path.join(W, "icon-192.png"));
  await shot(wordy(svg, 0.8), 512, path.join(W, "icon-maskable-512.png"));
  await shot(wordy(svg, 1), 180, path.join(W, "apple-touch-icon.png"));
  await shot(face(svg), 32, path.join(W, "favicon-32.png"));
  await shot(dash(1), 512, path.join(D, "icon-512.png"));
  await shot(dash(1), 192, path.join(D, "icon-192.png"));
  await shot(dash(0.8), 512, path.join(D, "icon-maskable-512.png"));
  await shot(dash(1), 180, path.join(D, "apple-touch-icon.png"));
  await shot(dash(1), 32, path.join(D, "favicon-32.png"));
  await b.close(); web.kill();
})();
