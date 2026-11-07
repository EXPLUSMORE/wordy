"""Erzeugt Suchvarianten für einen Kandidaten (nur Schreibweisen, nichts Neues): ohne „to“, ohne Klammern, UK/US getrennt, Anfang klein, ohne Artikel."""
import re
def variants(en):
    t = re.sub(r'\([^)]*\)', ' ', en)
    parts = [p.strip() for p in re.split(r'\s+/\s+', t) if p.strip()] or [t.strip()]
    out = []
    for p in parts:
        p = re.sub(r'\s*(…|\.\.\.)\s*', ' ', p).strip(); p = re.sub(r'[.!?]+$', '', p).strip()
        base = [p]
        if p.startswith('to '): base.append(p[3:])
        for b in list(base):
            if b[:1].isupper() and not b.isupper(): base.append(b[:1].lower() + b[1:])
            m = re.match(r'^(a|an|the)\s+(.*)$', b, re.I)
            if m: base.append(m.group(2))
            if 'your ' in b: base.append(b.replace('your ', "one's ")); base.append(b.replace('your ', "someone's "))
            if re.search(r"\bsomeone'?s?\b", b): pass
        for b in base:
            if b and b not in out: out.append(b)
    return out
