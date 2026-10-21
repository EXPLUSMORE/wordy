#!/usr/bin/env python3
"""Erzeugt die Saison-Looks Winter, Weihnachten (Candy) und Spring Break als CSS-Blöcke und schreibt sie zwischen die Marken in index.html.
Aufruf: python3 tools/season_themes.py   (danach node build.js). Grafiken sind eingebettete SVG-Data-URIs. Halloween: tools/season_halloween.py."""
import urllib.parse, re, os
def u(svg): return 'url("data:image/svg+xml,' + urllib.parse.quote(svg.replace("\n", ""), safe="/:=,.;()' ") + '")'
def R(id): return ':root:root:root[data-season="%s"]' % id
OUT = {}

def cta(bg, bd, glow, eb, btn, btnink, btnsh, boxbd, dayok, dayokink, now, ink, sub, dayink):
    return (f"--cta-bg:{bg};--cta-bd:{bd};--cta-ring:{glow};--cta-glow:{glow};--cta-ink:{ink};--cta-sub:{sub};--cta-eb:{eb};--cta-btn:{btn};--cta-btn-ink:{btnink};--cta-btn-sh:{btnsh};"
            f"--cta-box:rgba(255,255,255,.12);--cta-box-bd:{boxbd};--cta-day:rgba(255,255,255,.1);--cta-day-ink:{dayink};--cta-day-ok:{dayok};--cta-day-ok-ink:{dayokink};--cta-day-now:{now};")

MASCOT = """
{S} .hwsp{{position:absolute;left:calc(61% - 7px);top:0;width:44px;height:112px;z-index:6;cursor:pointer;-webkit-tap-highlight-color:transparent;transform-origin:22px 0;background:var(--sp) 50% 100%/38px 38px no-repeat,linear-gradient({th},{th}) 50% 0/1px 100% no-repeat;animation:hwSwing 3.4s ease-in-out infinite alternate;transition:opacity .25s;filter:drop-shadow(0 2px 6px {gl})}}
{S}[data-tab='home'] .hwsp{{animation:hwSwing 3.4s ease-in-out infinite alternate,hwCrawl 24s ease-in-out infinite}}
{S} .hwsp.gone{{opacity:0;pointer-events:none}}
{S} .hwsp.back{{animation:hwBack 1.6s ease-out}}
"""

COMMON = """
.sxBoo{position:fixed;left:50%;top:42%;z-index:9999;pointer-events:none;font:900 60px/1 system-ui,sans-serif;letter-spacing:.04em;transform:translate(-50%,-50%) rotate(-6deg) scale(0);animation:sxBoo 1.5s cubic-bezier(.2,1.6,.4,1) forwards}
@keyframes sxBoo{0%{transform:translate(-50%,-50%) rotate(-6deg) scale(0);opacity:0}15%{transform:translate(-50%,-50%) rotate(-6deg) scale(1.25);opacity:1}30%{transform:translate(-50%,-50%) rotate(-6deg) scale(1)}80%{opacity:1}100%{transform:translate(-50%,-90%) rotate(-6deg) scale(1.05);opacity:0}}
.sxKrack{font-size:44px}
body.sxShake{animation:sxShake .65s cubic-bezier(.36,.07,.19,.97)}@keyframes sxShake{10%,90%{transform:translate(-2px,1px)}20%,80%{transform:translate(4px,-3px)}30%,50%,70%{transform:translate(-8px,4px) rotate(-.4deg)}40%,60%{transform:translate(8px,-4px) rotate(.4deg)}}
body.sxShake2{animation:sxShake2 .32s cubic-bezier(.36,.07,.19,.97)}@keyframes sxShake2{20%{transform:translate(-3px,2px)}40%{transform:translate(4px,-3px)}60%{transform:translate(-2px,1px)}80%{transform:translate(2px,-1px)}}
.hhfig.sxFigSwing{animation:sxFigSwing 1s ease-out}@keyframes sxFigSwing{0%{transform:none}12%{transform:rotate(7deg) translateX(10px)}34%{transform:rotate(-12deg) translateX(-16px) scale(1.07)}60%{transform:rotate(3deg)}100%{transform:none}}
.sx3{position:fixed;left:0;right:0;height:120px;z-index:4;pointer-events:none;perspective:520px;perspective-origin:50% -30%}
.sx3>[data-k]{position:absolute;pointer-events:auto;cursor:pointer;-webkit-tap-highlight-color:transparent}
.sx3g{position:absolute;left:0;right:0;bottom:0;height:34px}
.sxFl{position:fixed;inset:0;z-index:8;pointer-events:none;perspective:700px;perspective-origin:50% 40%;overflow:hidden}
.sxFl>div{position:absolute;left:0;top:0;pointer-events:auto;transform-style:preserve-3d;-webkit-tap-highlight-color:transparent}
.sxFl .bd svg{width:100%;height:100%;display:block}
"""

# ---------------- WINTER ----------------
def winter():
    S = R("winter"); o = [COMMON]
    icicle = "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 60 24' preserveAspectRatio='none'><defs><linearGradient id='i' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#fff'/><stop offset='1' stop-color='#7FD8FF' stop-opacity='.85'/></linearGradient></defs><path fill='url(#i)' d='M0 0H60V3L55 3L52 18L49 3L40 3L37 12L34 3L22 3L19 22L16 3L8 3L5 10L2 3L0 3z'/></svg>"
    drift = "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 120 24' preserveAspectRatio='none'><path fill='#EAF7FF' d='M0 24V14C10 6 22 6 32 12S52 18 64 10S88 4 98 11S112 14 120 9V24z'/><path fill='#fff' opacity='.9' d='M0 24V17C12 11 24 11 34 15S56 20 68 14S90 9 102 15S114 17 120 14V24z'/></svg>"
    snowcap = "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 12' preserveAspectRatio='none'><path fill='#fff' d='M0 0H40V5C37 5 37 11 33 11S30 5 26 5 23 9 19 9 15 4 12 4 8 10 5 10 3 5 0 5z'/></svg>"
    frost = "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' fill='none' stroke='#BFF4FF' stroke-width='1.6' stroke-linecap='round'><path d='M100 0L22 78M100 0L50 40M78 22L60 20M78 22L80 40M58 42L40 36M58 42L60 60M40 60L22 52M40 60L42 78M100 0L100 70M100 0L30 0M78 0L76 14M56 0L54 14M100 22L86 22M100 44L86 44'/><circle cx='100' cy='0' r='3' fill='#fff'/></svg>"
    o.append(f"{S}{{color-scheme:dark;--paper:#0A1030;--card:#142050;--card-2:#1B2B66;--ink:#EAF6FF;--ink-2:#B9D4F2;--ink-3:#8FA9D6;--rule:#3A5AA8;--line:#24397A;--accent:#5CE1FF;--accent-ink:#04202E;--accent-soft:#12406A;--gold:#BFF4FF;--bar:linear-gradient(90deg,#5CE1FF,#B28CFF);--eyebrow:#9FE9FF;--btn-sh:#1B8FB8;--shadow:0 10px 30px rgba(0,0,40,.5);"
             + cta("linear-gradient(165deg,#1B2B66,#0A1030)", "rgba(92,225,255,.6)", "rgba(92,225,255,.3)", "#9FE9FF", "linear-gradient(#9FEFFF,#2FB8E8)", "#04202E", "#1B8FB8", "rgba(92,225,255,.55)", "rgba(92,225,255,.22)", "#DFF8FF", "#5CE1FF", "#EAF6FF", "#B9D4F2", "#8FA9D6") + "}")
    o.append(f"{S} body{{background:radial-gradient(circle at 12% 6%,rgba(61,255,176,.20),transparent 38%),radial-gradient(circle at 88% 4%,rgba(178,140,255,.26),transparent 42%),radial-gradient(circle at 50% 110%,rgba(92,225,255,.16),transparent 50%),linear-gradient(#0B1238,#050A22)!important;background-attachment:fixed}}")
    o.append(f"{S} body::before{{content:'';position:fixed;left:-20%;top:-6%;width:140%;height:34%;pointer-events:none;z-index:0;background:linear-gradient(100deg,transparent 10%,rgba(61,255,176,.32) 28%,rgba(92,225,255,.28) 44%,rgba(178,140,255,.34) 62%,transparent 80%);filter:blur(26px);mix-blend-mode:screen;animation:sxAurora 16s ease-in-out infinite alternate}}")
    o.append("@keyframes sxAurora{0%{transform:translateX(-6%) skewX(-8deg);opacity:.75}50%{opacity:1}100%{transform:translateX(7%) skewX(10deg);opacity:.8}}")
    o.append(f"{S} header#top{{position:relative;background:rgba(10,16,48,.86);border-bottom:2px solid #5CE1FF;box-shadow:0 4px 20px rgba(92,225,255,.3)}}")
    o.append(f"{S} header#top::after{{content:'';position:absolute;left:0;right:0;top:100%;height:24px;pointer-events:none;z-index:2;background:{u(icicle)} 0 0/60px 24px repeat-x;filter:drop-shadow(0 3px 4px rgba(0,0,40,.4))}}")
    o.append(f"{S} nav#tabs{{position:relative;background:rgba(10,16,48,.92);border-top:2px solid #5CE1FF;box-shadow:0 -4px 20px rgba(92,225,255,.3)}}")
    o.append(f"{S} nav#tabs::before{{content:'';position:absolute;left:0;right:0;top:-22px;height:22px;pointer-events:none;z-index:2;background:{u(drift)} 0 100%/120px 22px repeat-x}}")
    o.append(f"{S} nav#tabs button[aria-current='true']{{color:#04202E;background:#5CE1FF;box-shadow:0 0 16px rgba(92,225,255,.7)}}")
    o.append(f"{S} .card{{position:relative;border:1px solid rgba(92,225,255,.4);box-shadow:0 10px 28px rgba(0,0,40,.5),inset 0 0 40px rgba(92,225,255,.06)}}")
    o.append(f"{S} .card::before{{content:'';position:absolute;left:14px;right:14px;top:-5px;height:11px;pointer-events:none;z-index:0;background:{u(snowcap)} 0 0/40px 11px repeat-x}}")
    o.append(f"{S} .card::after{{content:'';position:absolute;right:0;top:0;width:96px;height:96px;pointer-events:none;border-top-right-radius:inherit;background:{u(frost)} 0 0/100% 100% no-repeat;opacity:.5;animation:sxFrost 5s ease-in-out infinite alternate}}")
    o.append("@keyframes sxFrost{from{opacity:.32}to{opacity:.7}}")
    o.append(f"{S} .btn:not(.ghost):not(.soft){{background:linear-gradient(#9FEFFF,#2FB8E8);color:#04202E;border-color:#2FB8E8;box-shadow:0 4px 0 #1B8FB8,0 0 20px rgba(92,225,255,.5)}}")
    o.append(f"{S} .hh{{border-color:#5CE1FF;background:linear-gradient(#0F2A6B,#3B2E9A 60%,#7CE0FF 140%)!important;box-shadow:0 0 28px rgba(92,225,255,.45)}}")
    o.append(f"{S} .hh::before{{content:'';position:absolute;inset:0;pointer-events:none;z-index:0;background:linear-gradient(105deg,transparent 20%,rgba(61,255,176,.25) 40%,rgba(178,140,255,.3) 60%,transparent 80%);filter:blur(14px);mix-blend-mode:screen;animation:sxAurora 12s ease-in-out infinite alternate}}")
    o.append(f"{S} .eyebrow{{color:#9FE9FF}}")
    o.append(MASCOT.format(S=S, th="#DFF6FF", gl="rgba(92,225,255,.8)"))
    # 3D-Szene
    o.append(f"{S}.sx3g{{}}")
    o.append(".sx3-winter .sx3g{background:linear-gradient(transparent,#EAF7FF 80%);opacity:.95}")
    o.append(".sxp{bottom:14px;width:var(--w);height:var(--h);transform-style:preserve-3d;transform:translateZ(var(--z)) rotateY(-12deg);animation:sxSway 6s ease-in-out infinite alternate;animation-delay:var(--dl)}@keyframes sxSway{to{transform:translateZ(var(--z)) rotateY(14deg)}}")
    o.append(".sxp b{position:absolute;left:0;right:0;height:46%;clip-path:polygon(50% 0,100% 100%,0 100%);background:linear-gradient(#3FA27A,#1A5C44)}.sxp b:nth-child(1){top:0;left:25%;right:25%;transform:translateZ(0)}.sxp b:nth-child(2){top:20%;left:14%;right:14%;transform:translateZ(-4px)}.sxp b:nth-child(3){top:40%;left:6%;right:6%;transform:translateZ(-8px)}.sxp b:nth-child(4){top:58%;left:0;right:0;transform:translateZ(-12px)}.sxp u{position:absolute;left:44%;right:44%;bottom:0;height:12%;background:#5A3A1E;transform:translateZ(-6px)}")
    o.append(".sxp::after{content:'';position:absolute;left:30%;right:30%;top:2%;height:10%;background:#fff;clip-path:polygon(50% 0,100% 100%,0 100%);transform:translateZ(2px);opacity:.95}")
    o.append(".sxp.act{animation:sxWob 1s ease-out}@keyframes sxWob{0%{transform:translateZ(var(--z)) rotateZ(0)}15%{transform:translateZ(var(--z)) rotateZ(-10deg)}35%{transform:translateZ(var(--z)) rotateZ(9deg)}55%{transform:translateZ(var(--z)) rotateZ(-5deg)}100%{transform:translateZ(var(--z)) rotateZ(0)}}")
    o.append(".sxs{bottom:12px;width:var(--w);height:var(--h);animation:sxBob 3s ease-in-out infinite alternate;animation-delay:var(--dl)}@keyframes sxBob{to{transform:translateY(-4px)}}")
    o.append(".sxs .sb{position:absolute;left:50%;border-radius:50%;background:radial-gradient(circle at 35% 30%,#fff,#DDF1FF 55%,#8FB8E0);box-shadow:inset -4px -4px 8px rgba(80,120,170,.35)}.sxs .b1{width:74%;height:42%;bottom:0;margin-left:-37%}.sxs .b2{width:56%;height:34%;bottom:34%;margin-left:-28%}.sxs .b3{width:40%;height:26%;bottom:60%;margin-left:-20%}")
    o.append(".sxs u{position:absolute;left:26%;right:26%;top:2%;height:12%;background:#222;border-radius:2px;box-shadow:0 5px 0 -1px #222}.sxs u::after{content:'';position:absolute;left:-18%;right:-18%;bottom:-3px;height:4px;background:#222;border-radius:2px}.sxs em{position:absolute;left:48%;top:30%;width:20%;height:6%;background:#FF9F1C;clip-path:polygon(0 0,100% 50%,0 100%)}.sxs b{position:absolute;left:30%;right:30%;top:48%;height:7%;background:#E8123C;border-radius:3px}.sxs s{position:absolute;left:44%;top:68%;width:6%;height:6%;border-radius:50%;background:#222;box-shadow:0 8px 0 #222}")
    o.append(".sxs.act{animation:sxHop 1s ease-out}@keyframes sxHop{0%{transform:none}25%{transform:translateY(-34px) rotate(-8deg)}50%{transform:translateY(0) scale(1.1,.88)}70%{transform:translateY(-12px) rotate(5deg)}100%{transform:none}}.sxs.act u{animation:sxHat 1s ease-out}@keyframes sxHat{30%{transform:translateY(-22px) rotate(-30deg)}100%{transform:none}}")
    o.append(".sxc{bottom:20px;width:var(--w);height:var(--h);transform-style:preserve-3d;animation:sxSpin 9s linear infinite;animation-delay:var(--dl);filter:drop-shadow(0 0 8px rgba(92,225,255,.9))}@keyframes sxSpin{to{transform:rotateY(360deg)}}")
    o.append(".sxc i{position:absolute;inset:0;background:var(--cr) center/contain no-repeat}.sxc i:nth-child(2){transform:rotateY(60deg)}.sxc i:nth-child(3){transform:rotateY(120deg)}.sxc.act{animation:sxSpin .9s ease-in-out}")
    # Flieger: Pinguine
    o.append(".sxf-winter{width:44px;height:52px}.sxf-winter .bd{width:100%;height:100%;animation:sxFlapP .22s ease-in-out infinite alternate;filter:drop-shadow(0 0 6px rgba(92,225,255,.6))}@keyframes sxFlapP{from{transform:rotate(-7deg) scaleX(1)}to{transform:rotate(7deg) scaleX(.92)}}")
    OUT["WINTER"] = "\n".join(o)

# ---------------- WEIHNACHTEN CANDY ----------------
def xmas():
    S = R("xmas"); o = [COMMON]
    bulbs_a = "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 120 20' preserveAspectRatio='none'><path d='M0 2Q15 12 30 2T60 2T90 2T120 2' stroke='#2E7D4F' stroke-width='2' fill='none'/><g><ellipse cx='15' cy='12' rx='4.4' ry='6.6' fill='#FF4D79'/><ellipse cx='45' cy='12' rx='4.4' ry='6.6' fill='#7DF0C0'/><ellipse cx='75' cy='12' rx='4.4' ry='6.6' fill='#FF4D79'/><ellipse cx='105' cy='12' rx='4.4' ry='6.6' fill='#7DF0C0'/></g></svg>"
    bulbs_b = "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 120 20' preserveAspectRatio='none'><g><ellipse cx='30' cy='9' rx='4.4' ry='6.6' fill='#FFD34D'/><ellipse cx='60' cy='9' rx='4.4' ry='6.6' fill='#6EC8FF'/><ellipse cx='90' cy='9' rx='4.4' ry='6.6' fill='#FFD34D'/><ellipse cx='120' cy='9' rx='4.4' ry='6.6' fill='#6EC8FF'/></g></svg>"
    bow = "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 60 40'><path d='M30 22C14 2 2 6 4 20C6 32 22 28 30 22zM30 22C46 2 58 6 56 20C54 32 38 28 30 22z' fill='#E8123C' stroke='#9E0C2C' stroke-width='2'/><path d='M30 22L18 38M30 22L42 38' stroke='#E8123C' stroke-width='6' stroke-linecap='round'/><circle cx='30' cy='22' r='6' fill='#FF5C7A' stroke='#9E0C2C' stroke-width='2'/></svg>"
    o.append(f"{S}{{color-scheme:light;--paper:#FFF0F5;--card:#FFFFFF;--card-2:#FFE3EE;--ink:#4A0E2B;--ink-2:#7A2748;--ink-3:#A25B78;--rule:#F5B6CE;--line:#FAD0E0;--accent:#E8123C;--accent-ink:#FFFFFF;--accent-soft:#FFD3DF;--gold:#E0A100;--bar:linear-gradient(90deg,#E8123C,#FF8FB8);--eyebrow:#C2185B;--btn-sh:#9E0C2C;--shadow:0 10px 24px rgba(232,18,60,.18);"
             + cta("linear-gradient(165deg,#FFFFFF,#FFE3EE)", "rgba(232,18,60,.6)", "rgba(232,18,60,.18)", "#C2185B", "linear-gradient(#FF4D6D,#E8123C)", "#FFFFFF", "#9E0C2C", "rgba(232,18,60,.45)", "rgba(46,158,99,.2)", "#1E6B44", "#E8123C", "#4A0E2B", "#7A2748", "#A25B78") + "--cta-box:rgba(232,18,60,.06);--cta-day:rgba(232,18,60,.08);}")
    o.append(f"{S} body{{background:radial-gradient(circle,#fff 2px,transparent 3px) 0 0/44px 44px,radial-gradient(circle,rgba(232,18,60,.25) 2px,transparent 3px) 22px 22px/44px 44px,linear-gradient(#FFF0F5,#FFD0E0)!important;background-attachment:fixed}}")
    o.append(f"{S} header#top{{position:relative;background:#FFF0F5;border-bottom:7px solid transparent;border-image:repeating-linear-gradient(45deg,#E8123C 0 12px,#fff 12px 24px) 7;box-shadow:0 6px 16px rgba(232,18,60,.25)}}")
    o.append(f"{S} header#top::before{{content:'';position:absolute;left:0;right:0;top:100%;margin-top:3px;height:20px;pointer-events:none;z-index:2;background:{u(bulbs_a)} 0 0/120px 20px repeat-x;animation:sxBlinkA 1.2s steps(1) infinite}}")
    o.append(f"{S} header#top::after{{content:'';position:absolute;left:0;right:0;top:100%;margin-top:3px;height:20px;pointer-events:none;z-index:2;background:{u(bulbs_b)} 0 0/120px 20px repeat-x;animation:sxBlinkB 1.2s steps(1) infinite}}")
    o.append("@keyframes sxBlinkA{0%{opacity:1}50%{opacity:.35}}@keyframes sxBlinkB{0%{opacity:.35}50%{opacity:1}}")
    o.append(f"{S} nav#tabs{{position:relative;background:#FFF0F5;border-top:7px solid transparent;border-image:repeating-linear-gradient(-45deg,#E8123C 0 12px,#fff 12px 24px) 7;box-shadow:0 -6px 16px rgba(232,18,60,.2)}}")
    o.append(f"{S} nav#tabs button{{color:#7A2748}}{S} nav#tabs button[aria-current='true']{{color:#fff;background:repeating-linear-gradient(45deg,#E8123C 0 9px,#FF4D6D 9px 18px);box-shadow:0 0 14px rgba(232,18,60,.55),inset 0 0 0 2px #fff}}")
    o.append(f"{S} .card{{position:relative;border:2px solid #F5B6CE;box-shadow:0 8px 0 rgba(232,18,60,.12),0 14px 24px rgba(232,18,60,.12)}}")
    o.append(f"{S} .card::before{{content:'';position:absolute;left:0;right:0;top:0;height:8px;pointer-events:none;border-radius:inherit;border-bottom-left-radius:0;border-bottom-right-radius:0;background:repeating-linear-gradient(45deg,#E8123C 0 10px,#fff 10px 20px);opacity:.9}}")
    o.append(f"{S} .card::after{{content:'';position:absolute;right:10px;top:-14px;width:46px;height:31px;pointer-events:none;background:{u(bow)} 0 0/100% 100% no-repeat;transform-origin:50% 70%;animation:sxBow 3s ease-in-out infinite alternate;filter:drop-shadow(0 2px 2px rgba(0,0,0,.2))}}")
    o.append("@keyframes sxBow{from{transform:rotate(-5deg)}to{transform:rotate(5deg)}}")
    o.append(f"{S} .btn:not(.ghost):not(.soft){{background:linear-gradient(#FF4D6D,#E8123C);color:#fff;border-color:#E8123C;box-shadow:0 4px 0 #9E0C2C,0 0 16px rgba(232,18,60,.4),inset 0 2px 0 rgba(255,255,255,.35)}}")
    o.append(f"{S} .hh{{border-color:#fff;background:linear-gradient(#FF8FB8,#E8123C 70%,#9E0C2C 140%)!important;box-shadow:0 0 0 4px #E8123C,0 10px 24px rgba(232,18,60,.4)}}")
    o.append(f"{S} .hh::before{{content:'';position:absolute;inset:0;pointer-events:none;z-index:0;background:repeating-linear-gradient(45deg,rgba(255,255,255,.1) 0 14px,transparent 14px 28px)}}")
    o.append(f"{S} .eyebrow{{color:#C2185B}}")
    o.append(MASCOT.format(S=S, th="#C99A2E", gl="rgba(232,18,60,.6)"))
    o.append(".sx3-xmas .sx3g{background:linear-gradient(transparent,rgba(255,255,255,.95) 80%)}")
    o.append(".sxt{bottom:14px;width:var(--w);height:var(--h);transform-style:preserve-3d;transform:rotateY(-12deg);animation:sxSway 6s ease-in-out infinite alternate;animation-delay:var(--dl)}@keyframes sxSway{to{transform:rotateY(14deg)}}")
    o.append(".sxt b{position:absolute;left:0;right:0;height:42%;clip-path:polygon(50% 0,100% 100%,0 100%);background:linear-gradient(#2FB36D,#16754A)}.sxt b:nth-child(1){top:6%;left:26%;right:26%}.sxt b:nth-child(2){top:22%;left:15%;right:15%;transform:translateZ(-4px)}.sxt b:nth-child(3){top:40%;left:6%;right:6%;transform:translateZ(-8px)}.sxt b:nth-child(4){top:58%;left:0;right:0;transform:translateZ(-12px)}")
    o.append(".sxt s{position:absolute;left:42%;top:-4%;width:16%;height:15%;background:#FFD34D;clip-path:polygon(50% 0,62% 36%,100% 38%,70% 60%,82% 100%,50% 76%,18% 100%,30% 60%,0 38%,38% 36%);transform:translateZ(2px);animation:sxStar 1.6s ease-in-out infinite alternate;filter:drop-shadow(0 0 5px #FFD34D)}@keyframes sxStar{to{transform:translateZ(2px) scale(1.25) rotate(14deg)}}")
    o.append(".sxt u{position:absolute;inset:0;transform:translateZ(3px);pointer-events:none}.sxt u i{position:absolute;width:7%;height:6%;border-radius:50%;animation:sxLight 1s ease-in-out infinite alternate}.sxt u i:nth-child(1){left:48%;top:26%;background:#FF4D79}.sxt u i:nth-child(2){left:36%;top:44%;background:#FFD34D;animation-delay:.2s}.sxt u i:nth-child(3){left:58%;top:46%;background:#6EC8FF;animation-delay:.4s}.sxt u i:nth-child(4){left:26%;top:66%;background:#FF4D79;animation-delay:.1s}.sxt u i:nth-child(5){left:48%;top:62%;background:#7DF0C0;animation-delay:.5s}.sxt u i:nth-child(6){left:68%;top:68%;background:#FFD34D;animation-delay:.3s}.sxt u i:nth-child(7){left:16%;top:82%;background:#6EC8FF;animation-delay:.6s}.sxt u i:nth-child(8){left:78%;top:84%;background:#FF4D79;animation-delay:.15s}@keyframes sxLight{from{opacity:.35;box-shadow:none}to{opacity:1;box-shadow:0 0 8px currentColor,0 0 12px rgba(255,255,255,.8)}}")
    o.append(".sxt.act{animation:sxWob 1s ease-out}@keyframes sxWob{0%{transform:rotateZ(0)}15%{transform:rotateZ(-8deg)}35%{transform:rotateZ(7deg)}55%{transform:rotateZ(-4deg)}100%{transform:rotateZ(0)}}.sxt.act u i{animation:sxLight .15s ease-in-out infinite alternate}")
    o.append(".sxg{bottom:14px;width:var(--w);height:var(--h);transform-style:preserve-3d}.sxg .cb{position:absolute;inset:0;transform-style:preserve-3d;animation:sxSpin 12s linear infinite;animation-delay:var(--dl)}@keyframes sxSpin{to{transform:rotateY(360deg)}}")
    o.append(".sxg .cb f{position:absolute;display:block;background:linear-gradient(90deg,transparent 42%,var(--c2) 42% 58%,transparent 58%),var(--c1);box-shadow:inset 0 0 6px rgba(0,0,0,.2)}.sxg .fr{inset:0;transform:translateZ(calc(var(--w)*.5))}.sxg .bk{inset:0;transform:rotateY(180deg) translateZ(calc(var(--w)*.5))}.sxg .lf{top:0;bottom:0;left:calc(50% - var(--w)*.5);width:var(--w);transform:rotateY(-90deg) translateZ(calc(var(--w)*.5))}.sxg .rt{top:0;bottom:0;left:calc(50% - var(--w)*.5);width:var(--w);transform:rotateY(90deg) translateZ(calc(var(--w)*.5))}.sxg .tp{left:0;right:0;top:calc(var(--w)*-.5 + var(--h)*0);height:var(--w);transform:rotateX(90deg) translateZ(calc(var(--w)*.5));background:linear-gradient(90deg,transparent 42%,var(--c2) 42% 58%,transparent 58%),linear-gradient(0deg,transparent 42%,var(--c2) 42% 58%,transparent 58%),var(--c1)}")
    o.append(".sxg .ld{position:absolute;left:-6%;right:-6%;top:-14%;height:20%;background:linear-gradient(90deg,transparent 42%,var(--c2) 42% 58%,transparent 58%),var(--c1);border-radius:3px;transform:translateZ(2px);transition:transform .4s;box-shadow:0 2px 4px rgba(0,0,0,.25)}.sxg .ld::after{content:'';position:absolute;left:34%;right:34%;top:-70%;height:80%;background:radial-gradient(circle at 25% 60%,var(--c2) 0 38%,transparent 40%),radial-gradient(circle at 75% 60%,var(--c2) 0 38%,transparent 40%)}")
    o.append(".sxg.act .ld{animation:sxLid 1.2s ease-out}@keyframes sxLid{0%{transform:translateZ(2px)}25%{transform:translateY(-46px) translateZ(2px) rotate(-28deg)}70%{transform:translateY(-46px) translateZ(2px) rotate(-28deg)}100%{transform:translateZ(2px)}}")
    o.append(".sxm{bottom:14px;width:var(--w);height:var(--h);animation:sxDance 1.2s ease-in-out infinite alternate;animation-delay:var(--dl)}.sxm svg{width:100%;height:100%;display:block}@keyframes sxDance{from{transform:rotate(-7deg) translateY(0)}to{transform:rotate(7deg) translateY(-5px)}}.sxm.act{animation:sxHop 1s ease-out}@keyframes sxHop{0%{transform:none}25%{transform:translateY(-40px) rotate(-14deg)}50%{transform:translateY(0) scale(1.12,.86)}75%{transform:translateY(-14px) rotate(9deg)}100%{transform:none}}")
    o.append(".sxk{bottom:12px;width:var(--w);height:var(--h);transform-origin:50% 100%;animation:sxCane 4s ease-in-out infinite alternate}.sxk svg{width:100%;height:100%;display:block}@keyframes sxCane{from{transform:rotate(-3deg)}to{transform:rotate(3deg)}}.sxk.act{animation:sxWob 1s ease-out}")
    o.append(".sxf-xmas{width:96px;height:42px}.sxf-xmas .bd{width:100%;height:100%;animation:sxBob2 1.6s ease-in-out infinite alternate;filter:drop-shadow(0 0 8px rgba(255,211,77,.8))}@keyframes sxBob2{from{transform:translateY(-3px) rotate(-3deg)}to{transform:translateY(3px) rotate(3deg)}}")
    OUT["XMAS"] = "\n".join(o)

# ---------------- SPRING BREAK ----------------
def spring():
    S = R("spring"); o = [COMMON]
    wave = "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 120 20' preserveAspectRatio='none'><path fill='#00D1C1' d='M0 20V10C10 4 20 4 30 10S50 16 60 10S80 4 90 10S110 16 120 10V20z'/><path fill='#7DE8FF' opacity='.8' d='M0 20V14C10 9 20 9 30 14S50 19 60 14S80 9 90 14S110 19 120 14V20z'/></svg>"
    wave2 = "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 120 14' preserveAspectRatio='none'><path fill='#fff' opacity='.85' d='M0 14V7C10 2 20 2 30 7S50 12 60 7S80 2 90 7S110 12 120 7V14z'/></svg>"
    leaf = "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 80 60'><path d='M80 0C40 4 14 24 0 60C30 44 56 36 80 30z' fill='#2EC27E' opacity='.9'/><path d='M80 0L6 56' stroke='#1A8F5A' stroke-width='2' fill='none'/><path d='M70 10L40 8M62 18L30 22M52 28L22 38M42 38L16 48' stroke='#1A8F5A' stroke-width='1.4' fill='none'/></svg>"
    o.append(f"{S}{{color-scheme:light;--paper:#E9FBFF;--card:#FFFFFF;--card-2:#E0F7FA;--ink:#0F3552;--ink-2:#2D5F7F;--ink-3:#5E8BA6;--rule:#9ED8E8;--line:#C8EEF5;--accent:#FF5E7A;--accent-ink:#FFFFFF;--accent-soft:#FFD9E0;--gold:#FFB300;--bar:linear-gradient(90deg,#FF5E7A,#FFB300,#00D1C1);--eyebrow:#0097A7;--btn-sh:#C23A55;--shadow:0 10px 24px rgba(0,151,167,.18);"
             + cta("linear-gradient(165deg,#FFFFFF,#E0F7FA)", "rgba(0,209,193,.7)", "rgba(0,209,193,.2)", "#0097A7", "linear-gradient(#FF8A5C,#FF5E7A)", "#FFFFFF", "#C23A55", "rgba(0,209,193,.5)", "rgba(0,209,193,.2)", "#00796B", "#FF5E7A", "#0F3552", "#2D5F7F", "#5E8BA6") + "--cta-box:rgba(0,209,193,.08);--cta-day:rgba(15,53,82,.06);}")
    o.append(f"{S} body{{background:radial-gradient(circle at 86% 4%,#FFF3B0 0 22px,rgba(255,214,90,.55) 23px 60px,rgba(255,214,90,.18) 61px 140px,transparent 141px),radial-gradient(ellipse at 20% 12%,rgba(255,255,255,.9) 0 30px,transparent 31px),radial-gradient(ellipse at 34% 9%,rgba(255,255,255,.8) 0 22px,transparent 23px),linear-gradient(#8FE3FF,#D6F6FF 45%,#E9FBFF 70%,#FFF1C9)!important;background-attachment:fixed}}")
    o.append(f"{S} body::before{{content:'';position:fixed;right:-120px;top:-120px;width:360px;height:360px;pointer-events:none;z-index:0;background:repeating-conic-gradient(from 0deg,rgba(255,226,120,.26) 0 8deg,transparent 8deg 24deg);border-radius:50%;animation:sxRays 40s linear infinite;-webkit-mask:radial-gradient(circle,#000 20%,transparent 70%);mask:radial-gradient(circle,#000 20%,transparent 70%)}}")
    o.append("@keyframes sxRays{to{transform:rotate(360deg)}}")
    o.append(f"{S} header#top{{position:relative;background:linear-gradient(90deg,#FFE29A,#FFC1A1 55%,#FF9FC1);border-bottom:3px solid #00D1C1;box-shadow:0 6px 16px rgba(0,151,167,.25)}}")
    o.append(f"{S} header#top::after{{content:'';position:absolute;left:0;right:0;top:100%;margin-top:-1px;height:16px;pointer-events:none;z-index:2;background:{u(wave)} 0 0/120px 16px repeat-x;animation:sxWave 6s linear infinite}}")
    o.append("@keyframes sxWave{to{background-position:120px 0}}")
    o.append(f"{S} nav#tabs{{position:relative;background:#FFE9B8;border-top:3px solid #00D1C1;box-shadow:0 -6px 16px rgba(0,151,167,.2)}}")
    o.append(f"{S} nav#tabs::before{{content:'';position:absolute;left:0;right:0;top:-18px;height:18px;pointer-events:none;z-index:2;background:{u(wave2)} 0 100%/120px 14px repeat-x,{u(wave)} 0 100%/120px 18px repeat-x;animation:sxWave 7s linear infinite}}")
    o.append(f"{S} nav#tabs button{{color:#2D5F7F}}{S} nav#tabs button[aria-current='true']{{color:#fff;background:linear-gradient(#FF8A5C,#FF5E7A);box-shadow:0 0 14px rgba(255,94,122,.6)}}")
    o.append(f"{S} .card{{position:relative;border:2px solid transparent;background:linear-gradient(#fff,#fff) padding-box,linear-gradient(135deg,#FF5E7A,#FFB300,#00D1C1) border-box;box-shadow:0 10px 24px rgba(0,151,167,.2)}}")
    o.append(f"{S} .card::after{{content:'';position:absolute;right:2px;top:-2px;width:64px;height:48px;pointer-events:none;background:{u(leaf)} 0 0/100% 100% no-repeat;transform-origin:100% 0;animation:sxLeaf 4s ease-in-out infinite alternate;opacity:.85}}")
    o.append("@keyframes sxLeaf{from{transform:rotate(-4deg)}to{transform:rotate(5deg)}}")
    o.append(f"{S} .btn:not(.ghost):not(.soft){{background:linear-gradient(#FF8A5C,#FF5E7A);color:#fff;border-color:#FF5E7A;box-shadow:0 4px 0 #C23A55,0 0 16px rgba(255,94,122,.4),inset 0 2px 0 rgba(255,255,255,.35)}}")
    o.append(f"{S} .hh{{border-color:#fff;background:linear-gradient(#4FC8FF,#FF9AC0 62%,#FFC65C 125%)!important;box-shadow:0 0 0 3px #00D1C1,0 10px 24px rgba(0,151,167,.4)}}")
    o.append(f"{S} .hh::before{{content:'';position:absolute;right:-30px;top:-30px;width:120px;height:120px;border-radius:50%;pointer-events:none;z-index:0;background:radial-gradient(circle,#FFF6C0 0 30%,rgba(255,226,120,.6) 32% 55%,transparent 70%);animation:sxSun 4s ease-in-out infinite alternate}}")
    o.append("@keyframes sxSun{to{transform:scale(1.12)}}")
    o.append(f"{S} .eyebrow{{color:#0097A7}}")
    o.append(MASCOT.format(S=S, th="#8B6B3A", gl="rgba(255,179,0,.7)"))
    o.append(".sx3-spring .sx3g{background:linear-gradient(transparent,#FFE9B8 75%)}")
    o.append(".sxl{bottom:14px;width:var(--w);height:var(--h);transform-style:preserve-3d;animation:sxSway 6s ease-in-out infinite alternate;animation-delay:var(--dl)}@keyframes sxSway{from{transform:rotateY(-12deg)}to{transform:rotateY(14deg)}}")
    o.append(".sxl .pt{position:absolute;left:44%;bottom:0;width:14%;height:78%;transform-style:preserve-3d}.sxl .pt i{position:absolute;left:0;right:0;height:21%;border-radius:3px;background:linear-gradient(90deg,#8B5A2B,#C9904F 50%,#7a4a1e)}.sxl .pt i:nth-child(1){bottom:0}.sxl .pt i:nth-child(2){bottom:19%;transform:translateX(2px) rotate(2deg)}.sxl .pt i:nth-child(3){bottom:38%;transform:translateX(5px) rotate(4deg)}.sxl .pt i:nth-child(4){bottom:57%;transform:translateX(8px) rotate(6deg)}.sxl .pt i:nth-child(5){bottom:76%;transform:translateX(12px) rotate(8deg)}")
    o.append(".sxl .lv{position:absolute;left:46%;top:2%;width:0;height:0;transform-style:preserve-3d;transform:translateX(10px)}.sxl .lv b{position:absolute;left:0;top:0;width:calc(var(--w)*.55);height:calc(var(--w)*.2);margin-top:-6%;transform-origin:0 50%;transform:rotateY(calc(var(--i)*51deg)) rotateZ(calc(-18deg + var(--i)*4deg));background:linear-gradient(90deg,#1A8F5A,#2EC27E);border-radius:0 100% 0 100%/0 100% 0 100%;clip-path:polygon(0 40%,100% 0,100% 100%,0 60%);animation:sxLeafF 2.4s ease-in-out infinite alternate;animation-delay:calc(var(--i)*-.3s)}@keyframes sxLeafF{to{filter:brightness(1.18)}}")
    o.append(".sxl s{position:absolute;left:47%;top:11%;width:9%;height:7%;border-radius:50%;background:radial-gradient(circle at 35% 30%,#9A6B3A,#4A2F14);transform:translateZ(6px)}.sxl s+s{left:55%;top:13%}.sxl.act{animation:sxWobP 1s ease-out}@keyframes sxWobP{0%{transform:rotateZ(0)}15%{transform:rotateZ(-8deg)}35%{transform:rotateZ(7deg)}55%{transform:rotateZ(-4deg)}100%{transform:rotateZ(0)}}")
    o.append(".sxb{bottom:12px;width:var(--w);height:var(--w);perspective:300px;animation:sxBounce 1.5s cubic-bezier(.3,.6,.4,1) infinite;animation-delay:var(--dl)}@keyframes sxBounce{0%,100%{transform:translateY(0) scale(1.1,.88)}50%{transform:translateY(-26px) scale(.95,1.06)}}")
    o.append(".sxb .bb{position:absolute;inset:0;transform-style:preserve-3d;animation:sxSpinB 3s linear infinite;animation-delay:var(--dl)}@keyframes sxSpinB{to{transform:rotateY(360deg)}}.sxb .rib{position:absolute;left:14%;width:72%;top:0;bottom:0;border-radius:50%;transform:rotateY(calc(var(--i)*30deg))}.sxb .rib:nth-child(1){background:#FF5E7A}.sxb .rib:nth-child(2){background:#fff}.sxb .rib:nth-child(3){background:#FFD23F}.sxb .rib:nth-child(4){background:#fff}.sxb .rib:nth-child(5){background:#00D1C1}.sxb .rib:nth-child(6){background:#fff}")
    o.append(".sxb .bs{position:absolute;left:6%;right:6%;bottom:-10%;height:12%;background:rgba(0,0,0,.25);filter:blur(3px);border-radius:50%}.sxb.act{animation:sxKick 1s cubic-bezier(.3,.6,.4,1)}@keyframes sxKick{0%{transform:none}20%{transform:scale(1.2,.8)}55%{transform:translateY(-80px) scale(.9,1.1)}85%{transform:translateY(0) scale(1.15,.85)}100%{transform:none}}")
    o.append(".sxf{bottom:12px;width:var(--w);height:var(--h);animation:sxBob 3s ease-in-out infinite alternate}@keyframes sxBob{to{transform:translateY(-5px) rotate(3deg)}}.sxf svg{width:100%;height:100%;display:block}.sxf.act{animation:sxSpinF 1s ease-in-out}@keyframes sxSpinF{to{transform:rotateY(720deg)}}")
    o.append(".sxw{bottom:10px;width:var(--w);height:var(--h);transform-origin:50% 100%;transform:rotate(-8deg);animation:sxBoard 3.5s ease-in-out infinite alternate;animation-delay:var(--dl)}@keyframes sxBoard{to{transform:rotate(7deg)}}.sxw i{position:absolute;inset:0;border-radius:50% 50% 40% 40%/18% 18% 12% 12%;background:linear-gradient(90deg,#FF5E7A,#FFD23F 50%,#00D1C1);box-shadow:inset 0 0 0 2px rgba(255,255,255,.7)}")
    o.append(".sxf-spring{width:54px;height:30px}.sxf-spring .bd{width:100%;height:100%;transform-origin:50% 60%;animation:flapG .3s ease-in-out infinite alternate}@keyframes flapG{from{transform:scaleY(1)}to{transform:scaleY(.55)}}")
    OUT["SPRING"] = "\n".join(o)

winter(); xmas(); spring()
p = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "index.html")
s = open(p, encoding="utf-8").read()
for key, css in OUT.items():
    begin, end = "/* SEASON-%s:BEGIN (erzeugt von tools/season_themes.py, nicht von Hand ändern) */" % key, "/* SEASON-%s:END */" % key
    block = begin + "\n" + css + "\n" + end
    if begin in s: s = re.sub(re.escape(begin) + r".*?" + re.escape(end), lambda m: block, s, flags=re.S)
    else:
        i = s.rindex("</style>"); s = s[:i] + block + "\n" + s[i:]
open(p, "w", encoding="utf-8").write(s)
print("Saison-Looks geschrieben:", {k: len(v) for k, v in OUT.items()})
