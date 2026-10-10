/* Grammatik-Themen (Gerüst). Reihenfolge und Inhalt orientieren sich an Headlight 2 (Klasse 6, Realschule).
   Aufgabentypen:
   choice: q mit ____, opts (erste Antwort ist richtig, wird beim Spielen gemischt)
   type:   q mit ____ (Verb), a = erlaubte Antworten, full = ganzer Satz
   order:  w = Wörter in richtiger Reihenfolge (werden gemischt)
   error:  s = Satz, bad = Nummer des falschen Wortes (ab 0), fix = Verbesserungen (erste ist richtig)
   [[…]] hebt Teile in Beispielen hervor. IDs der Themen nie ändern (Lernstand hängt daran). */
window.GRAMMAR = [
  { id: "past1", icon: "⏪", title: "Simple Past: Das ist passiert", book: "Headlight 2 · Unit 1",
    short: "-ed, unregelmäßige Verben, was/were",
    explain: {
      lead: "Mit dem Simple Past erzählst du, was <b>vorbei</b> ist.",
      points: [
        "Typische Signalwörter: <b>yesterday, last week, two days ago, in 2020</b>.",
        "Regelmäßige Verben bekommen <b>-ed</b>: play → played, climb → climbed.",
        "Unregelmäßige Verben haben eine eigene Form, die man lernt: go → <b>went</b>, have → <b>had</b>, make → <b>made</b>, see → <b>saw</b>.",
        "To be: I / he / she / it <b>was</b>, we / you / they <b>were</b>."
      ],
      examples: [
        { en: "Last summer we [[climbed]] a high mountain.", de: "Letzten Sommer sind wir auf einen hohen Berg gestiegen." },
        { en: "I [[went]] to summer camp with my cousin.", de: "Ich bin mit meinem Cousin ins Ferienlager gefahren." },
        { en: "The weather [[was]] warm and we [[were]] happy.", de: "Das Wetter war warm und wir waren glücklich." }
      ],
      merk: "Vorbei ist vorbei: Das Verb steht in der zweiten Form."
    },
    items: [
      { t: "choice", q: "Last summer we ____ a high mountain.", opts: ["climbed", "climb", "climbing", "climbs"], why: "Regelmäßiges Verb, vorbei (last summer): climb + -ed." },
      { t: "choice", q: "I ____ to summer camp with my cousin.", opts: ["went", "gone", "go", "goes"], why: "go ist unregelmäßig: go – went (nicht „goed“)." },
      { t: "choice", q: "She ____ a new bike yesterday.", opts: ["bought", "brought", "buys", "buy"], why: "buy ist unregelmäßig: buy – bought." },
      { t: "choice", q: "It ____ cold and rainy last night.", opts: ["was", "were", "is", "be"], why: "Vergangenheit von to be: it was (Einzahl)." },
      { t: "choice", q: "We ____ at the lake two days ago.", opts: ["were", "was", "are", "is"], why: "Vergangenheit von to be: we were (Mehrzahl)." },
      { t: "choice", q: "They ____ a barbecue because the weather was warm.", opts: ["had", "have", "has", "having"], why: "have ist unregelmäßig: have – had." },
      { t: "type", q: "Yesterday I ____ (play) football with my friends.", a: ["played"], full: "Yesterday I played football with my friends.", why: "Regelmäßig: play + -ed = played." },
      { t: "type", q: "My dad ____ (make) a big breakfast on Sunday.", a: ["made"], full: "My dad made a big breakfast on Sunday.", why: "make ist unregelmäßig: make – made." },
      { t: "type", q: "We ____ (see) a film last weekend.", a: ["saw"], full: "We saw a film last weekend.", why: "see ist unregelmäßig: see – saw." },
      { t: "type", q: "The children ____ (walk) to school an hour ago.", a: ["walked"], full: "The children walked to school an hour ago.", why: "Regelmäßig: walk + -ed = walked." },
      { t: "order", w: ["We", "visited", "our", "grandma", "last", "week."], why: "Reihenfolge: Subjekt, Verb (Past), Objekt, Zeitangabe." },
      { t: "order", w: ["She", "ate", "pizza", "for", "dinner", "yesterday."], why: "eat ist unregelmäßig: eat – ate. Die Zeitangabe steht am Ende." },
      { t: "error", s: "Yesterday we goed to the cinema.", bad: 2, fix: ["went", "go", "gone", "goes"], why: "go ist unregelmäßig: go – went." },
      { t: "error", s: "She buyed a new T-shirt last week.", bad: 1, fix: ["bought", "buy", "buys", "buying"], why: "buy ist unregelmäßig: buy – bought." },
      { t: "error", s: "We was very tired after the trip.", bad: 1, fix: ["were", "is", "are", "be"], why: "Zu we gehört were, nicht was." }
    ]
  },
  { id: "past2", icon: "❓", title: "Simple Past: Fragen und Verneinung", book: "Headlight 2 · Unit 1",
    short: "did / didn't + Grundform",
    explain: {
      lead: "Fragen und Verneinung im Simple Past bildest du mit <b>did</b>.",
      points: [
        "Frage: <b>Did</b> + Person + Grundform: <b>Did</b> you meet new friends?",
        "Verneinung: <b>didn't</b> + Grundform: She <b>didn't</b> want to stay.",
        "Nach did / didn't steht <b>immer die Grundform</b>, nie -ed und nie die zweite Form.",
        "Mit Fragewort: Where <b>did</b> you go? What <b>did</b> she buy?",
        "Ausnahme to be: <b>Was</b> she tired? She <b>wasn't</b> tired. (ohne did)"
      ],
      examples: [
        { en: "[[Did]] you meet new friends at camp?", de: "Hast du im Lager neue Freunde getroffen?" },
        { en: "She [[didn't]] want to stay alone at the lake.", de: "Sie wollte nicht allein am See bleiben." },
        { en: "Where [[did]] you go last summer?", de: "Wohin bist du letzten Sommer gefahren?" }
      ],
      merk: "Did trägt die Vergangenheit, das Verb bleibt ganz brav in der Grundform."
    },
    items: [
      { t: "choice", q: "Did you ____ new friends at camp?", opts: ["meet", "met", "meets", "meeting"], why: "Nach did steht die Grundform: meet." },
      { t: "choice", q: "She ____ want to stay alone at the lake.", opts: ["didn't", "doesn't", "don't", "wasn't"], why: "Verneinung im Simple Past: didn't + Grundform." },
      { t: "choice", q: "____ you play football yesterday?", opts: ["Did", "Do", "Does", "Are"], why: "Frage im Simple Past: Did + Person + Grundform." },
      { t: "choice", q: "We didn't ____ the bus this morning.", opts: ["miss", "missed", "misses", "missing"], why: "Nach didn't steht die Grundform: miss." },
      { t: "choice", q: "What ____ you do last weekend?", opts: ["did", "do", "does", "were"], why: "Fragewort + did + Person + Grundform." },
      { t: "choice", q: "He ____ know the answer.", opts: ["didn't", "not", "doesn't", "wasn't"], why: "Verneinung: didn't + Grundform (know)." },
      { t: "type", q: "I didn't ____ (go) to school on Sunday.", a: ["go"], full: "I didn't go to school on Sunday.", why: "Nach didn't steht die Grundform: go (nicht went)." },
      { t: "type", q: "Where ____ (do) you meet your friends?", a: ["did"], full: "Where did you meet your friends?", why: "Fragewort + did + Person + Grundform." },
      { t: "type", q: "She didn't ____ (eat) her sandwich.", a: ["eat"], full: "She didn't eat her sandwich.", why: "Nach didn't steht die Grundform: eat (nicht ate)." },
      { t: "type", q: "Did they ____ (come) to the party?", a: ["come"], full: "Did they come to the party?", why: "Nach did steht die Grundform: come (nicht came)." },
      { t: "order", w: ["Did", "you", "see", "the", "film", "yesterday?"], why: "Frage: Did + Person + Grundform, die Zeitangabe steht am Ende." },
      { t: "order", w: ["We", "didn't", "go", "to", "the", "park."], why: "Verneinung: Person + didn't + Grundform." },
      { t: "error", s: "Did you went to the cinema?", bad: 2, fix: ["go", "going", "goes", "gone"], why: "Nach did steht die Grundform: go." },
      { t: "error", s: "I didn't saw the film.", bad: 2, fix: ["see", "seen", "sees", "seeing"], why: "Nach didn't steht die Grundform: see." },
      { t: "error", s: "He didn't liked the book.", bad: 2, fix: ["like", "likes", "liking", "to like"], why: "Nach didn't steht die Grundform: like, ohne -ed." }
    ]
  },
  /* Folgende Themen sind geplant und erscheinen als „bald“ (Reihenfolge nach Headlight 2) */
  { id: "modal1", soon: true, icon: "💪", title: "have to, should, can / could", book: "Headlight 2 · Unit 3–4", short: "müssen, sollen, können" },
  { id: "will1", soon: true, icon: "🔮", title: "will, going to, I'll", book: "Headlight 2 · Unit 4–5", short: "Zukunft, Pläne, Versprechen" },
  { id: "comp1", soon: true, icon: "📈", title: "Steigerung", book: "Headlight 2 · Unit 5", short: "-er, more, the most" },
  { id: "quant1", soon: true, icon: "🍎", title: "some, any, there is / there are", book: "Headlight 2 · Unit 2–4", short: "Mengen und Orte" },
  { id: "if1", soon: true, icon: "🔀", title: "If-Sätze (Typ 1)", book: "Headlight 2 · Unit 6", short: "wenn …, dann …" }
];
