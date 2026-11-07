#!/usr/bin/env python3
"""Holt Wörterbucheinträge aus dem englischen Wiktionary über kaikki.org (Wiktextract, CC BY-SA 4.0).
   Aufruf: python3 tools/wikt_lookup.py <wort> [<wort> ...]   oder   python3 tools/wikt_lookup.py --file liste.txt
   Ergebnisse werden in private/raw/wikt/ zwischengespeichert (nicht im Repository). Nichts wird erraten: ein Wort, das es
   dort nicht gibt, bleibt „nicht gefunden“."""
import sys, os, re, json, html, time, zlib, urllib.parse, urllib.request
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CACHE = os.path.join(ROOT, 'private', 'raw', 'wikt'); os.makedirs(CACHE, exist_ok=True)
BASE = 'https://kaikki.org/dictionary/English/meaning/'
def slug(w): return re.sub(r'[^A-Za-z0-9]+', '_', w).strip('_')[:80] + '_' + str(zlib.crc32(w.encode('utf-8')) % 100000)
def urls(w):   # kaikki.org legt Seiten nach erstem Zeichen und ersten zwei Zeichen ab (Groß-/Kleinschreibung wie im Stichwort)
    return [BASE + urllib.parse.quote(w[0]) + '/' + urllib.parse.quote(w[:2]) + '/' + urllib.parse.quote(w) + '.html']
def fetch(url):
    req = urllib.request.Request(url, headers={'User-Agent': 'wordy-vocab-check/1.0 (Wiktionary via kaikki.org; contact: Betreiber)'})
    with urllib.request.urlopen(req, timeout=40) as r: return r.read().decode('utf-8', 'replace')
def parse(page):
    u = html.unescape(page); dec = json.JSONDecoder(); ents = []
    for m in re.finditer(r'\n\{\n', u):
        try: o, _ = dec.raw_decode(u[m.start() + 1:])
        except Exception: continue
        if isinstance(o, dict) and 'senses' in o and o.get('lang_code') == 'en': ents.append(o)
    # derselbe Eintrag erscheint mehrfach (mit/ohne Übersetzungen): zusammenführen
    best = {}
    for o in ents:
        k = (o.get('word'), o.get('pos'), o.get('etymology_number'))
        if k not in best: best[k] = dict(o)
        else:
            for key, val in o.items():
                if key == 'translations': best[k]['translations'] = best[k].get('translations', []) + [t for t in val if t not in best[k].get('translations', [])]
                elif key not in best[k] or (isinstance(val, list) and len(val) > len(best[k][key])): best[k][key] = val
    return list(best.values())
def lookup(w):
    f = os.path.join(CACHE, slug(w) + '.json')
    if os.path.exists(f): return json.load(open(f, encoding='utf-8'))
    res = {'word': w, 'found': False, 'entries': []}
    for u in urls(w):
        try: page = fetch(u)
        except urllib.error.HTTPError as e:
            if e.code == 404: continue
            time.sleep(1); continue
        except Exception: time.sleep(1); continue
        ents = parse(page)
        if ents:
            res = {'word': w, 'found': True, 'url': u, 'entries': [{'word': e.get('word'), 'pos': e.get('pos'), 'translations': [t for t in e.get('translations', []) if t.get('lang_code') == 'de'],
                'senses': [{'glosses': s.get('glosses', []), 'tags': s.get('tags', []), 'examples': [x for x in s.get('examples', []) if x.get('type') == 'example' and 'ref' not in x][:3]} for s in e.get('senses', [])]} for e in ents]}
            break
    json.dump(res, open(f, 'w', encoding='utf-8'), ensure_ascii=False); time.sleep(0.15); return res
if __name__ == '__main__':
    a = sys.argv[1:]
    words = [l.strip() for l in open(a[1], encoding='utf-8') if l.strip()] if a[:1] == ['--file'] else a
    for w in words:
        r = lookup(w); print(w, '->', 'gefunden' if r['found'] else 'NICHT gefunden', [(e['pos'], len(e['translations'])) for e in r['entries']])
