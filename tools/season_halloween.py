#!/usr/bin/env python3
"""Erzeugt den Halloween-Look (Saison-Aufsatz) und schreibt ihn zwischen die Marken in index.html.
Aufruf: python3 tools/season_halloween.py   (danach node build.js). Grafiken sind eingebettete SVG-Data-URIs, keine Dateien."""
import urllib.parse, re, os
def u(svg): return 'url("data:image/svg+xml,' + urllib.parse.quote(svg.replace("\n", ""), safe="/:=,.;()' ") + '")'
INK = "#0A0510"
def bat(c): return f"<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 20'><path fill='{c}' d='M20 6c-2-3-5-4-8-2C9 2 5 3 0 8c4-1 6 0 8 3 1-2 3-3 5-1 1-3 4-3 5-1l2 3 2-3c1-2 4-2 5 1 2-2 4-1 5 1 2-3 4-4 8-3-5-5-9-6-12-4-3-2-6-1-8 2z'/></svg>"
def web(c): return f"<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' fill='none' stroke='{c}' stroke-width='1.4' stroke-linecap='round'><path d='M100 0L0 0M100 0L8 40M100 0L30 80M100 0L66 100M100 0L100 100'/><path d='M76 0Q74 22 100 24M52 0Q48 36 100 48M28 0Q22 52 100 72M10 0Q4 66 100 96'/></svg>"
def spider(c, t, eye): return f"<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 30 80'><path d='M15 0V54' stroke='{t}' stroke-width='1'/><g stroke='{c}' stroke-width='2' fill='none' stroke-linecap='round'><path d='M10 62L1 55L0 64M10 66L2 70L3 78M20 62L29 55L30 64M20 66L28 70L27 78'/></g><ellipse cx='15' cy='64' rx='7.5' ry='9' fill='{c}'/><circle cx='15' cy='57' r='4.5' fill='{c}'/><circle cx='13' cy='56' r='1.4' fill='{eye}'/><circle cx='17' cy='56' r='1.4' fill='{eye}'/></svg>"
def spider_body(c, eye): return f"<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 48 30 32'><g stroke='{c}' stroke-width='2' fill='none' stroke-linecap='round'><path d='M10 62L1 55L0 64M10 66L2 70L3 78M20 62L29 55L30 64M20 66L28 70L27 78'/></g><ellipse cx='15' cy='64' rx='7.5' ry='9' fill='{c}'/><circle cx='15' cy='57' r='4.5' fill='{c}'/><circle cx='13' cy='56' r='1.4' fill='{eye}'/><circle cx='17' cy='56' r='1.4' fill='{eye}'/></svg>"
def pumpkin(): return "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 56'><path d='M30 10c0-6 4-9 9-9-1 5-3 7-6 9z' fill='#2E8B2E'/><ellipse cx='32' cy='34' rx='29' ry='21' fill='#FF8A1F'/><ellipse cx='20' cy='34' rx='12' ry='20' fill='#FF9E3D' opacity='.6'/><ellipse cx='44' cy='34' rx='12' ry='20' fill='#E86E00' opacity='.55'/><path d='M17 28l7 3-8 3zM47 28l-7 3 8 3zM32 36l-4 6h8z' fill='#FFE08A'/><path d='M16 44q16 9 32 0l-3 4q-13 6-26 0z' fill='#FFE08A'/></svg>"
def tombs(c): return f"""<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 260 46' preserveAspectRatio='none'><g fill='{c}'>
<path d='M8 46V24C8 10 32 10 32 24V46z'/><path d='M52 46V26h-8v-7h8v-9h8v9h8v7h-8v20z'/><path d='M82 46V30L92 14L102 30V46z'/>
<path d='M120 46V22C120 8 146 8 146 22V46z'/><path d='M168 46V28h-6v-5h6v-8h6v8h6v5h-6v18z'/><path d='M196 46V26C196 14 216 14 216 26V46z'/>
<path d='M228 46V30l5-3 3 5 5-5 2 4 5-2V46z'/>
<path d='M104 46C104 34 108 30 110 22C112 30 114 36 118 46z'/>
<path d='M0 46V40C20 36 40 44 70 40S120 36 150 41 210 37 260 41V46z'/></g></svg>"""
def tree(c): return f"<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 60 70'><g stroke='{c}' stroke-linecap='round' fill='none'><path d='M30 70V34M30 46L14 30M30 40L46 24M14 30L8 18M14 30L22 20M46 24L54 12M46 24L38 14M30 34L30 14' stroke-width='5'/><path d='M8 18L3 10M22 20L24 8M54 12L58 6M38 14L36 4M30 14L26 5' stroke-width='2.5'/></g></svg>"
def mist(): return "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 60' preserveAspectRatio='none'><defs><radialGradient id='g'><stop offset='0' stop-color='#C9B5FF' stop-opacity='.5'/><stop offset='1' stop-color='#C9B5FF' stop-opacity='0'/></radialGradient></defs><ellipse cx='60' cy='38' rx='90' ry='20' fill='url(#g)'/><ellipse cx='210' cy='30' rx='110' ry='24' fill='url(#g)'/><ellipse cx='340' cy='40' rx='80' ry='18' fill='url(#g)'/></svg>"

S = ':root:root:root[data-season="halloween"]'
def cta():
    return ("--cta-bg:linear-gradient(165deg,#2E1349,#140A22);--cta-bd:rgba(255,138,31,.65);--cta-ring:rgba(255,138,31,.12);--cta-glow:rgba(255,138,31,.42);--cta-ink:#FFF3E3;--cta-sub:#EBD3B8;--cta-eb:#FFC857;"
            "--cta-btn:linear-gradient(#FFA23C,#FF6A00);--cta-btn-ink:#2A0F00;--cta-btn-sh:#A83F00;--cta-box:rgba(255,255,255,.05);--cta-box-bd:rgba(255,138,31,.55);--cta-day:rgba(255,255,255,.06);--cta-day-ink:#C9AFA0;--cta-day-ok:rgba(255,138,31,.22);--cta-day-ok-ink:#FFD59A;--cta-day-now:#FF8A1F;")
o = []
a = o.append
a(f"{S}{{color-scheme:dark;--paper:#0E0716;--card:#1C0F2E;--card-2:#271540;--ink:#FFF3E3;--ink-2:#EBD3B8;--ink-3:#B39AA6;--rule:#5B3066;--line:#3F2350;--accent:#FF8A1F;--accent-ink:#2A0F00;--accent-soft:#4D2411;--gold:#FFC857;--bar:linear-gradient(90deg,#FF5E00,#FFC857);--eyebrow:#FFB066;--btn-sh:#A83F00;--shadow:0 10px 30px rgba(0,0,0,.5);{cta()}}}")
a(f"{S} body{{background:radial-gradient(circle at 86% 3%,rgba(255,236,190,.95) 0 20px,rgba(255,190,90,.38) 21px 56px,rgba(255,138,31,.14) 57px 140px,transparent 141px),radial-gradient(circle at 8% 100%,rgba(255,94,0,.18),transparent 46%),radial-gradient(circle at 70% 55%,rgba(155,93,229,.13),transparent 50%),linear-gradient(#1B0C2C,#0A0510)!important;background-attachment:fixed}}")
# Kopfzeile: Rand, Spinne am Faden, Fledermaus
a(f"{S} header#top{{position:relative;background:rgba(24,10,36,.9);border-bottom:2px solid #FF8A1F;box-shadow:0 4px 20px rgba(255,138,31,.3)}}")
a(f"{S} .hwsp{{position:absolute;left:calc(61% - 7px);top:0;width:44px;height:76px;z-index:6;cursor:pointer;-webkit-tap-highlight-color:transparent;transform-origin:22px 0;background:{u(spider_body(INK,'#FF9A2E'))} 50% 100%/30px 32px no-repeat,linear-gradient(#CDB8A5,#CDB8A5) 50% 0/1px 100% no-repeat;animation:hwSwing 3.4s ease-in-out infinite alternate;transition:opacity .25s}}")
a(f"{S}[data-tab='home'] .hwsp{{animation:hwSwing 3.4s ease-in-out infinite alternate,hwCrawl 24s ease-in-out infinite}}")
a(f"{S} .hwsp.gone{{opacity:0;pointer-events:none}}")
a(".hwBoo{position:fixed;left:50%;top:42%;z-index:9999;pointer-events:none;font:900 64px/1 system-ui,sans-serif;color:#FFD166;letter-spacing:.04em;-webkit-text-stroke:3px #2A0F00;text-shadow:0 6px 0 #A83F00,0 0 30px rgba(255,138,31,.9);transform:translate(-50%,-50%) rotate(-6deg) scale(0);animation:hwBoo 1.5s cubic-bezier(.2,1.6,.4,1) forwards}")
a("@keyframes hwBoo{0%{transform:translate(-50%,-50%) rotate(-6deg) scale(0);opacity:0}15%{transform:translate(-50%,-50%) rotate(-6deg) scale(1.25);opacity:1}30%{transform:translate(-50%,-50%) rotate(-6deg) scale(1)}80%{opacity:1}100%{transform:translate(-50%,-90%) rotate(-6deg) scale(1.05);opacity:0}}")
a(".hwWebs{position:fixed;inset:0;z-index:9997;pointer-events:none;animation:hwWebsOut .6s ease 2.3s forwards}.hwWebs i{position:absolute;width:min(44vw,210px);height:min(44vw,210px);filter:drop-shadow(0 0 6px rgba(255,160,60,.7))}.hwWebs svg{width:100%;height:100%}.hwWebs path{stroke-dasharray:1;stroke-dashoffset:1;animation:hwDraw 1.2s ease-out .05s forwards}.hwWebs path+path{animation-delay:.45s}")
a("@keyframes hwDraw{to{stroke-dashoffset:0}}@keyframes hwWebsOut{to{opacity:0}}")
a("body.hwShake{animation:hwShake .65s cubic-bezier(.36,.07,.19,.97)}@keyframes hwShake{10%,90%{transform:translate(-2px,1px)}20%,80%{transform:translate(4px,-3px)}30%,50%,70%{transform:translate(-8px,4px) rotate(-.4deg)}40%,60%{transform:translate(8px,-4px) rotate(.4deg)}}")
a(f"{S} header#top::after{{content:'';position:absolute;left:-50px;top:100%;margin-top:-4px;width:46px;height:24px;pointer-events:none;z-index:7;background:{u(bat('#FFB066'))} 0 0/100% 100% no-repeat;animation:hwFlap 16s linear infinite;filter:drop-shadow(0 0 6px rgba(255,138,31,.7))}}")
# Menüleiste: Friedhof, Baum, Kürbisse, Nebel
a(f"{S} nav#tabs{{position:relative;background:#130A1E;border-top:2px solid #FF8A1F;box-shadow:0 -4px 20px rgba(255,138,31,.3)}}")
a(f"{S} nav#tabs::before{{content:'';position:absolute;left:0;right:0;top:-46px;height:46px;pointer-events:none;z-index:2;background:{u(tree(INK))} 12px 100%/46px 54px no-repeat,{u(tombs(INK))} 0 100%/260px 46px repeat-x}}")
a(f"{S} nav#tabs::after{{content:'';position:absolute;left:0;right:0;top:-52px;height:52px;pointer-events:none;z-index:3;background:{u(pumpkin())} calc(100% - 10px) 100%/58px 51px no-repeat,{u(pumpkin())} 34% 100%/30px 26px no-repeat,{u(pumpkin())} 72% 100%/38px 33px no-repeat;animation:hwFlicker 2.8s ease-in-out infinite}}")
a(f"{S} nav#tabs button[aria-current='true']{{color:#FFC857;background:rgba(255,138,31,.2);text-shadow:0 0 10px #FF8A1F;animation:hwGlow 3s ease-in-out infinite}}")
# Nebel über allem unten
a(f"{S} body::after{{content:'';position:fixed;left:-50%;width:200%;bottom:52px;height:70px;pointer-events:none;z-index:1;background:{u(mist())} 0 100%/50% 100% repeat-x;opacity:.55;animation:hwMist 38s linear infinite}}")
# Karten: großes Spinnennetz, Spinnen
a(f"{S} .card{{position:relative;border:1px solid rgba(255,138,31,.4);box-shadow:0 10px 28px rgba(0,0,0,.5),inset 0 0 40px rgba(255,138,31,.07)}}")
a(f"{S} .card::after{{content:'';position:absolute;right:0;top:0;width:104px;height:104px;pointer-events:none;border-top-right-radius:inherit;background:{u(web('#FFE2BC'))} 0 0/100% 100% no-repeat;opacity:.42;transform-origin:100% 0;animation:hwWeb 6s ease-in-out infinite alternate}}")
a(f"{S} .card:nth-of-type(3n+2)::before{{content:'';position:absolute;right:{{R}}px;top:-52px;width:26px;height:68px;pointer-events:none;z-index:2;transform-origin:13px 0;background:{u(spider(INK,'#CDB8A5','#FF9A2E'))} 0 0/100% 100% no-repeat;animation:hwSwing 3.8s ease-in-out infinite alternate}}".replace("{R}", "58"))
a(f"{S} .card:nth-of-type(3n+3)::before{{content:'';position:absolute;right:{{R}}px;top:-44px;width:22px;height:58px;pointer-events:none;z-index:2;transform-origin:11px 0;background:{u(spider(INK,'#CDB8A5','#FF9A2E'))} 0 0/100% 100% no-repeat;animation:hwSwing 4.6s ease-in-out infinite alternate-reverse}}".replace("{R}", "120"))
a(f"{S} .btn:not(.ghost):not(.soft){{background:linear-gradient(#FFA23C,#FF6A00);color:#2A0F00;border-color:#FF6A00;box-shadow:0 4px 0 #A83F00,0 0 20px rgba(255,138,31,.55)}}")
# Startseite-Bühne
a(f"{S} .hh{{border-color:#FF8A1F;background:linear-gradient(#2C1050,#611F66 55%,#FF7A2D 135%)!important;box-shadow:0 0 28px rgba(255,138,31,.45)}}")
a(f"{S} .hh::before{{content:'';position:absolute;right:0;top:0;width:128px;height:128px;z-index:0;pointer-events:none;background:{u(web('#FFE2BC'))} 0 0/100% 100% no-repeat;opacity:.5;transform-origin:100% 0;animation:hwWeb 6s ease-in-out infinite alternate}}")
a(f"{S} .hh::after{{content:'';position:absolute;left:-40px;top:10px;width:40px;height:20px;z-index:0;pointer-events:none;background:{u(bat('#FFD9A8'))} 0 0/100% 100% no-repeat;animation:hwFlap2 9s linear infinite;filter:drop-shadow(0 0 6px rgba(255,138,31,.8))}}")
a(f"{S} .eyebrow{{color:#FFB066}}")
a("@keyframes hwCrawl{0%,6%{height:76px}30%,52%{height:266px}78%,100%{height:76px}}")
a("@keyframes hwSwing{from{transform:rotate(-8deg)}to{transform:rotate(8deg)}}")
a("@keyframes hwFlap{0%{transform:translate(0,0) scale(1)}25%{transform:translate(30vw,-6px) scaleY(.8)}50%{transform:translate(60vw,3px) scaleY(1)}75%{transform:translate(90vw,-5px) scaleY(.8)}100%{transform:translate(118vw,0) scaleY(1)}}")
a("@keyframes hwFlap2{0%{transform:translate(0,0)}20%{transform:translate(70px,14px) scaleY(.75)}40%{transform:translate(160px,0) scaleY(1)}60%{transform:translate(250px,18px) scaleY(.75)}80%{transform:translate(330px,4px) scaleY(1)}100%{transform:translate(430px,10px)}}")
a("@keyframes hwFlicker{0%,100%{filter:drop-shadow(0 0 7px rgba(255,138,31,.55))}35%{filter:drop-shadow(0 0 14px rgba(255,170,60,.95))}60%{filter:drop-shadow(0 0 9px rgba(255,138,31,.7))}80%{filter:drop-shadow(0 0 16px rgba(255,190,80,1))}}")
a("@keyframes hwGlow{0%,100%{box-shadow:0 0 0 rgba(255,138,31,0)}50%{box-shadow:0 0 14px rgba(255,138,31,.55)}}")
a("@keyframes hwWeb{from{transform:rotate(-1.5deg) scale(1)}to{transform:rotate(1.5deg) scale(1.03)}}")
a("@keyframes hwMist{to{transform:translateX(25%)}}")
a("@media (prefers-reduced-motion:reduce){"+S+" *,"+S+" *::before,"+S+" *::after,"+S+" body::after{animation:none!important}}")
css = "\n".join(o)
begin, end = "/* SEASON-HALLOWEEN:BEGIN (erzeugt von tools/season_halloween.py, nicht von Hand ändern) */", "/* SEASON-HALLOWEEN:END */"
p = os.path.join(os.path.dirname(__file__), "..", "index.html")
s = open(p, encoding="utf-8").read()
block = begin + "\n" + css + "\n" + end
if begin in s:
    s = re.sub(re.escape(begin) + r".*?" + re.escape(end), lambda m: block, s, flags=re.S)
else:
    i = s.rindex("</style>"); s = s[:i] + block + "\n" + s[i:]
open(p, "w", encoding="utf-8").write(s)
print("Halloween-Look geschrieben:", len(css), "Zeichen")
