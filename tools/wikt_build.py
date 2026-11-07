#!/usr/bin/env python3
"""Baut Wörter aus Wiktionary-Abfragen (nur was dort steht): Stichwort, Wortart, deutsche Übersetzung (mit Artikel aus dem Geschlechts-Tag),
   Beispielsatz (nur Beispiele ohne Quellenangabe). Aufruf als Modul: build(candidates, found) -> (words, report)."""
import re, json, sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import wikt_lookup as W
POSMAP = {'noun': 'noun', 'verb': 'verb', 'adj': 'adj', 'adv': 'adv'}
def art(t):
    tags = set(t.get('tags') or [])
    w = t['word'].strip()
    if 'plural' in tags and not ({'masculine', 'feminine', 'neuter'} & tags): return 'die ' + w
    if 'masculine' in tags: return 'der ' + w
    if 'feminine' in tags: return 'die ' + w
    if 'neuter' in tags: return 'das ' + w
    return w
def toks(s): return set(re.findall(r"[a-zäöüß]{3,}", s.lower()))
def pick(en, hintde, hintpos, v):
    r = W.lookup(v)
    ents = [e for e in r['entries'] if e['translations']]
    if not ents: return None, 'keine deutsche Übersetzung in Wiktionary'
    want = POSMAP.get(hintpos)
    ents.sort(key=lambda e: 0 if (want and e['pos'] == want) else 1)
    e = ents[0]
    groups = {}
    for t in e['translations']:
        if t.get('word') and not t.get('note') or t.get('word'): groups.setdefault(t.get('sense', ''), []).append(t)
    hint = toks(hintde)
    def score(g):
        sc = 0
        for t in g[1]:
            if toks(t['word']) & hint: sc += 2
        return sc
    gl = list(groups.items())
    best = max(gl, key=score) if gl else None
    if best is None: return None, 'keine deutsche Übersetzung'
    sense, tr = best
    matched = score(best) > 0
    de = []
    for t in tr:
        a = art(t)
        if a not in de: de.append(a)
        if len(de) == 2: break
    # Beispielsatz: aus der Bedeutung, die zur Übersetzung passt, sonst aus irgendeiner des Eintrags
    st = toks(sense); ex = None; exok = False
    senses = e['senses']
    scored = sorted(senses, key=lambda s: -len(st & toks(' '.join(s['glosses']))))
    for s in scored:
        for x in s['examples']:
            n = len(x['text'].split())
            if 3 <= n <= 14 and '\n' not in x['text']: ex = x['text'].strip(); exok = (len(st & toks(' '.join(s['glosses']))) > 0); break
        if ex: break
    head = e['word']
    disp = ('to ' + head) if (e['pos'] == 'verb' and ' ' not in head.strip() or e['pos'] == 'verb') else head
    return {'en': disp, 'head': head, 'de': ' / '.join(de), 'pos': e['pos'], 'ex': ex, 'sense': sense, 'matched': matched, 'exmatch': exok, 'url': r.get('url')}, None
