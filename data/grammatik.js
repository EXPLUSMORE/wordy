/* Grammatik-Themen (Gerüst). Reihenfolge und Inhalt orientieren sich an Headlight 2 (Klasse 6, Realschule).
   Aufgabentypen:
   choice: q mit ____, opts (erste Antwort ist richtig, wird beim Spielen gemischt)
   type:   q mit ____ (Verb), a = erlaubte Antworten, full = ganzer Satz
   order:  w = Wörter in richtiger Reihenfolge (werden gemischt)
   error:  s = Satz, bad = Nummer des falschen Wortes (ab 0), fix = Verbesserungen (erste ist richtig)
   [[…]] hebt Teile in Beispielen hervor. IDs der Themen nie ändern (Lernstand hängt daran). */
window.GRAMMAR = [
  { id: "pres1", icon: "🕒", title: "Simple Present und Present Progressive", book: "Headlight 2 · Wiederholung",
    short: "immer vs. gerade jetzt",
    explain: {
      lead: "Das <b>Simple Present</b> beschreibt, was immer oder regelmäßig passiert. Das <b>Present Progressive</b>, was gerade passiert.",
      points: [
        "Simple Present: Gewohnheiten und Tatsachen. Signalwörter: <b>always, usually, every day, on Mondays</b>. Bei he / she / it kommt ein <b>-s</b>: She plays.",
        "Fragen und Verneinung mit <b>do / does</b>: Does she like pizza? I don't know.",
        "Present Progressive: <b>am / is / are + -ing</b>. Signalwörter: <b>now, at the moment, Look! Listen!</b>",
        "Verneinung: <b>am not / isn't / aren't</b> + -ing."
      ],
      examples: [
        { en: "My dad [[goes]] to work by bus every day.", de: "Mein Vater fährt jeden Tag mit dem Bus zur Arbeit." },
        { en: "Look! The dog [[is running]] in the garden.", de: "Schau! Der Hund rennt im Garten." },
        { en: "She [[usually drinks]] tea in the morning.", de: "Sie trinkt morgens meistens Tee." }
      ],
      merk: "every day / usually = Simple Present. now / Look! / at the moment = Present Progressive."
    },
    items: [
      { t: "choice", q: "My dad ____ to work by bus every day.", opts: ["goes", "go", "is going", "going"], why: "every day: Simple Present mit -es." },
      { t: "choice", q: "Look! The dog ____ in the garden.", opts: ["is running", "runs", "run", "running"], why: "Look! zeigt: gerade jetzt." },
      { t: "choice", q: "We ____ English on Mondays.", opts: ["have", "has", "are having", "having"], why: "Regelmäßig: Simple Present, bei we ohne -s." },
      { t: "choice", q: "Be quiet! The baby ____.", opts: ["is sleeping", "sleeps", "sleep", "sleeping"], why: "Jetzt gerade: is sleeping." },
      { t: "choice", q: "____ you like pizza?", opts: ["Do", "Does", "Are", "Is"], why: "Simple Present Frage zu you: Do." },
      { t: "choice", q: "She ____ her homework at the moment.", opts: ["is doing", "does", "do", "doing"], why: "at the moment: Present Progressive." },
      { t: "type", q: "He ____ (play) football every Saturday.", a: ["plays"], full: "He plays football every Saturday.", why: "every Saturday: Simple Present, he + -s." },
      { t: "type", q: "I ____ (not watch) TV right now.", a: ["am not watching", "'m not watching"], full: "I am not watching TV right now.", why: "right now: am not + -ing." },
      { t: "type", q: "Where ____ (do) your cousin live?", a: ["does"], full: "Where does your cousin live?", why: "Frage im Simple Present: does." },
      { t: "type", q: "Listen! The children ____ (sing).", a: ["are singing"], full: "Listen! The children are singing.", why: "Listen!: are + -ing." },
      { t: "order", w: ["She", "usually", "drinks", "tea", "in", "the", "morning."], why: "usually steht vor dem Verb." },
      { t: "order", w: ["The", "boys", "are", "playing", "in", "the", "park", "now."], why: "are + -ing für jetzt." },
      { t: "error", s: "He play the guitar every day.", bad: 1, fix: ["plays", "playing", "played", "is play"], why: "he + Verb mit -s." },
      { t: "error", s: "Look! It rains.", bad: 2, fix: ["is raining", "raining", "are raining", "rained"], why: "Look! = jetzt: is raining." },
      { t: "error", s: "We are go to school now.", bad: 2, fix: ["going", "goes", "went", "gone"], why: "are + -ing: going." }
    ]
  },
  { id: "past1", unit: "H2-1b", icon: "⏪", title: "Simple Past: Das ist passiert", book: "Headlight 2 · Unit 1",
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
  { id: "past2", unit: "H2-1c", icon: "❓", title: "Simple Past: Fragen und Verneinung", book: "Headlight 2 · Unit 1",
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
  { id: "modal1", unit: "H2-4b", icon: "💪", title: "have to, should, can / could", book: "Headlight 2 · Unit 3–4",
    short: "müssen, sollen, können",
    explain: {
      lead: "Mit <b>can, could, should</b> und <b>have to</b> sagst du, was möglich, erlaubt, nötig oder ratsam ist.",
      points: [
        "<b>can</b> = können / dürfen, <b>could</b> = konnte (Vergangenheit): I <b>could</b> swim when I was five.",
        "<b>have to</b> = müssen: He <b>has to</b> wait. Vergangenheit: <b>had to</b>.",
        "<b>don't have to</b> = nicht müssen (es ist nicht nötig): We <b>don't have to</b> wear a uniform.",
        "<b>should</b> = sollte (ein Rat): You <b>should</b> drink more water. Verneinung: <b>shouldn't</b>.",
        "Nach can, could und should steht immer die <b>Grundform ohne to</b>."
      ],
      examples: [
        { en: "I [[could]] swim when I was five.", de: "Ich konnte schwimmen, als ich fünf war." },
        { en: "She [[has to]] wear a helmet on her bike.", de: "Sie muss auf dem Rad einen Helm tragen." },
        { en: "You [[should]] eat more fruit.", de: "Du solltest mehr Obst essen." }
      ],
      merk: "can / should + Grundform, have to = müssen. Und: don't have to heißt nicht „nicht dürfen“, sondern „nicht müssen“."
    },
    items: [
      { t: "choice", q: "You ____ do your homework before you play.", opts: ["have to", "has to", "must to", "having to"], why: "Zu you gehört have to (müssen)." },
      { t: "choice", q: "She ____ wear a helmet when she rides her bike.", opts: ["has to", "have to", "must to", "has"], why: "Bei he / she / it heißt es has to." },
      { t: "choice", q: "You ____ eat so much sugar. It isn't healthy.", opts: ["shouldn't", "don't should", "shouldn't to", "not should"], why: "Rat: shouldn't + Grundform." },
      { t: "choice", q: "When I was five, I ____ swim.", opts: ["couldn't", "can't", "didn't can", "couldn't to"], why: "Vergangenheit von can ist could, verneint couldn't." },
      { t: "choice", q: "We ____ go to school on Sundays.", opts: ["don't have to", "haven't to", "don't must", "doesn't have to"], why: "Es ist nicht nötig: don't have to." },
      { t: "choice", q: "____ I open the window, please?", opts: ["Can", "Do", "Am", "Have"], why: "Bitte oder Erlaubnis: Can I …?" },
      { t: "type", q: "My brother ____ (have to) clean his room every Saturday.", a: ["has to"], full: "My brother has to clean his room every Saturday.", why: "Bei he / she / it: has to." },
      { t: "type", q: "Yesterday we ____ (have to) wait for an hour.", a: ["had to"], full: "Yesterday we had to wait for an hour.", why: "Vergangenheit von have to ist had to." },
      { t: "type", q: "I ____ (can) play the guitar when I was ten.", a: ["could"], full: "I could play the guitar when I was ten.", why: "Vergangenheit von can ist could." },
      { t: "type", q: "Tom is ill. He ____ (should) see a doctor.", a: ["should"], full: "Tom is ill. He should see a doctor.", why: "Rat: should + Grundform, ohne -s." },
      { t: "order", w: ["You", "should", "drink", "more", "water."], why: "should + Grundform ohne to." },
      { t: "order", w: ["We", "don't", "have", "to", "wear", "a", "uniform."], why: "don't have to = nicht müssen." },
      { t: "error", s: "She have to do her homework.", bad: 1, fix: ["has", "having", "had", "is"], why: "Bei she heißt es has to." },
      { t: "error", s: "You shoulds go to the doctor.", bad: 1, fix: ["should", "must to", "shoulding", "to should"], why: "should bekommt nie ein -s." },
      { t: "error", s: "Yesterday I can't find my keys.", bad: 2, fix: ["couldn't", "can", "couldn", "can't to"], why: "Gestern = Vergangenheit: couldn't." }
    ]
  },
  { id: "will1", unit: "H2-6a", icon: "🔮", title: "will, going to, I'll", book: "Headlight 2 · Unit 4–6",
    short: "Zukunft, Pläne, Versprechen",
    explain: {
      lead: "Über die Zukunft sprichst du mit <b>will</b> oder mit <b>going to</b>.",
      points: [
        "<b>will</b> (I'll, won't) für spontane Entscheidungen, Versprechen und Vermutungen: I <b>will</b> help you. It <b>will</b> be sunny.",
        "<b>going to</b> für Pläne und für Dinge, die man schon kommen sieht: We <b>are going to</b> visit Rome. Look at the clouds! It <b>is going to</b> rain.",
        "Verneinung: <b>won't</b> (will not) und <b>am / isn't / aren't going to</b>.",
        "Nach will steht die <b>Grundform</b> ohne to: She will come."
      ],
      examples: [
        { en: "Don't worry. I [[will]] help you.", de: "Keine Sorge. Ich helfe dir." },
        { en: "We [[are going to]] visit our cousins in July.", de: "Wir werden im Juli unsere Cousins besuchen." },
        { en: "Look at the sky! It [[is going to]] rain.", de: "Schau in den Himmel! Es wird regnen." }
      ],
      merk: "will = spontan oder Versprechen, going to = Plan oder Anzeichen. Nach will immer die Grundform."
    },
    items: [
      { t: "choice", q: "Look at the dark clouds! It ____ rain.", opts: ["is going to", "will to", "goes to", "is going"], why: "Man sieht es kommen: going to." },
      { t: "choice", q: "The phone is ringing. I ____ answer it.", opts: ["will", "am going", "goes to", "would to"], why: "Spontan entschieden: I will." },
      { t: "choice", q: "I ____ visit my grandma next weekend. I've already bought the ticket.", opts: ["am going to", "will to", "go to", "am go to"], why: "Der Plan steht schon: going to." },
      { t: "choice", q: "I promise I ____ be late again.", opts: ["won't", "don't", "am not", "doesn't"], why: "Versprechen verneint: won't." },
      { t: "choice", q: "We ____ have a party on Friday. Mum has planned everything.", opts: ["are going to", "will to", "goes to", "are go to"], why: "Geplant: are going to." },
      { t: "choice", q: "Tomorrow ____ sunny and warm, I think.", opts: ["will be", "will is", "are", "be"], why: "Vermutung: will be." },
      { t: "type", q: "I'm tired. I ____ (go to bed) now.", a: ["will go to bed"], full: "I'm tired. I will go to bed now.", why: "Spontane Entscheidung: will + Grundform." },
      { t: "type", q: "Look! That boy ____ (fall) off his bike.", a: ["is going to fall"], full: "Look! That boy is going to fall off his bike.", why: "Man sieht es kommen: is going to." },
      { t: "type", q: "I ____ (not tell) anybody your secret.", a: ["won't tell", "will not tell"], full: "I won't tell anybody your secret.", why: "Versprechen: won't + Grundform." },
      { t: "type", q: "Next summer we ____ (visit) London.", a: ["are going to visit", "'re going to visit"], full: "Next summer we are going to visit London.", why: "Plan: are going to + Grundform." },
      { t: "order", w: ["I", "will", "help", "you", "with", "your", "homework."], why: "Subjekt, will, Grundform." },
      { t: "order", w: ["She", "is", "going", "to", "be", "a", "doctor."], why: "is going to + Grundform." },
      { t: "error", s: "It will rains tomorrow.", bad: 2, fix: ["rain", "raining", "rained", "to rain"], why: "Nach will steht die Grundform." },
      { t: "error", s: "I going to play football after school.", bad: 1, fix: ["am going", "is going", "are going", "go"], why: "Bei I gehört am going to dazu." },
      { t: "error", s: "She will goes to school by bus tomorrow.", bad: 2, fix: ["go", "going", "gone", "to go"], why: "Nach will steht die Grundform ohne -es." }
    ]
  },
  { id: "comp1", unit: "H2-5a", icon: "📈", title: "Steigerung", book: "Headlight 2 · Unit 5",
    short: "-er, more, the most",
    explain: {
      lead: "Mit der <b>Steigerung</b> vergleichst du Dinge und Personen.",
      points: [
        "Kurze Adjektive: <b>-er than</b> und <b>the -est</b>: tall – tall<b>er</b> than – the tall<b>est</b>.",
        "Merke: big – bigger – the biggest (Verdopplung), happy – happier – the happiest (y wird i).",
        "Lange Adjektive: <b>more … than</b> und <b>the most …</b>: interesting – <b>more</b> interesting – <b>the most</b> interesting.",
        "Unregelmäßig: good – <b>better</b> – <b>the best</b>, bad – <b>worse</b> – <b>the worst</b>.",
        "Vergleich mit <b>than</b>, nicht mit that oder then: He is taller <b>than</b> me."
      ],
      examples: [
        { en: "My brother is [[taller than]] me.", de: "Mein Bruder ist größer als ich." },
        { en: "This is [[the most interesting]] book.", de: "Das ist das interessanteste Buch." },
        { en: "Her phone is [[better than]] mine.", de: "Ihr Handy ist besser als meins." }
      ],
      merk: "Kurz: -er / -est. Lang: more / most. Unregelmäßig: better, best, worse, worst. Nie beides zugleich."
    },
    items: [
      { t: "choice", q: "My brother is ____ than me.", opts: ["taller", "more tall", "tallest", "tall"], why: "Kurzes Adjektiv: -er than." },
      { t: "choice", q: "This is the ____ film I have ever seen.", opts: ["most interesting", "more interesting", "interestingest", "most interested"], why: "Langes Adjektiv: the most." },
      { t: "choice", q: "Maths is ____ than English for me.", opts: ["more difficult", "difficulter", "most difficult", "difficult"], why: "Langes Adjektiv: more … than." },
      { t: "choice", q: "Today is the ____ day of the year.", opts: ["hottest", "hotest", "most hot", "hoter"], why: "hot verdoppelt das t: the hottest." },
      { t: "choice", q: "Her new phone is ____ than my old one.", opts: ["better", "gooder", "more good", "best"], why: "good ist unregelmäßig: better." },
      { t: "choice", q: "Our team is the ____ in the school.", opts: ["best", "better", "goodest", "most good"], why: "good – better – the best." },
      { t: "type", q: "A mouse is ____ (small) than a cat.", a: ["smaller"], full: "A mouse is smaller than a cat.", why: "Kurzes Adjektiv: small + er." },
      { t: "type", q: "This is the ____ (happy) day of my life.", a: ["happiest"], full: "This is the happiest day of my life.", why: "y wird i: the happiest." },
      { t: "type", q: "Is the book ____ (exciting) than the film?", a: ["more exciting"], full: "Is the book more exciting than the film?", why: "Langes Adjektiv: more exciting." },
      { t: "type", q: "Today the weather is ____ (bad) than yesterday.", a: ["worse"], full: "Today the weather is worse than yesterday.", why: "bad – worse – the worst." },
      { t: "order", w: ["Lisa", "is", "the", "fastest", "runner", "in", "our", "class."], why: "the fastest = der Schnellste." },
      { t: "order", w: ["My", "bag", "is", "bigger", "than", "your", "bag."], why: "bigger than = größer als." },
      { t: "error", s: "He is tallest than his father.", bad: 2, fix: ["taller", "more tall", "tall", "the tallest"], why: "Vergleich mit than: taller." },
      { t: "error", s: "My cat is gooder than your dog.", bad: 3, fix: ["better", "best", "more good", "good"], why: "good wird unregelmäßig gesteigert: better." },
      { t: "error", s: "This book is more interesting that that one.", bad: 5, fix: ["than", "then", "as", "so"], why: "Vergleich mit than." }
    ]
  },
  { id: "quant1", unit: "H2-2b", icon: "🍎", title: "some, any, there is / there are", book: "Headlight 2 · Unit 2–4",
    short: "Mengen und Orte",
    explain: {
      lead: "Mit <b>there is / there are</b> sagst du, was es gibt. <b>some</b> und <b>any</b> nennen Mengen.",
      points: [
        "<b>There is</b> + Einzahl oder nicht Zählbares: There is a park. There is some milk.",
        "<b>There are</b> + Mehrzahl: There are two cinemas.",
        "<b>some</b> in Aussagen und Angeboten: I'd like <b>some</b> tea. Would you like <b>some</b> cake?",
        "<b>any</b> in Verneinung und Fragen: We haven't got <b>any</b> eggs. Is there <b>any</b> cheese?",
        "Verneinung: There <b>isn't</b> … und There <b>aren't</b> …"
      ],
      examples: [
        { en: "There [[is]] a bank near here.", de: "Es gibt eine Bank hier in der Nähe." },
        { en: "There [[are]] some apples on the table.", de: "Auf dem Tisch liegen einige Äpfel." },
        { en: "We haven't got [[any]] milk.", de: "Wir haben keine Milch." }
      ],
      merk: "Einzahl: there is, Mehrzahl: there are. Aussage: some. Verneinung und Frage: any."
    },
    items: [
      { t: "choice", q: "There ____ a park near my house.", opts: ["is", "are", "be", "have"], why: "Einzahl: there is." },
      { t: "choice", q: "There ____ two cinemas in our town.", opts: ["are", "is", "be", "has"], why: "Mehrzahl: there are." },
      { t: "choice", q: "I'd like ____ milk, please.", opts: ["some", "any", "a", "an"], why: "Angebot und Wunsch: some." },
      { t: "choice", q: "We haven't got ____ eggs.", opts: ["any", "some", "a", "an"], why: "Verneinung: any." },
      { t: "choice", q: "Is there ____ cheese in the fridge?", opts: ["any", "some", "a", "an"], why: "Frage: any." },
      { t: "choice", q: "There ____ any people in the shop.", opts: ["aren't", "isn't", "not", "hasn't"], why: "people ist Mehrzahl: there aren't." },
      { t: "type", q: "There ____ (be) a lot of books on the shelf.", a: ["are"], full: "There are a lot of books on the shelf.", why: "a lot of books ist Mehrzahl: are." },
      { t: "type", q: "Have you got ____ (some / any) brothers or sisters?", a: ["any"], full: "Have you got any brothers or sisters?", why: "Frage: any." },
      { t: "type", q: "There ____ (not be) any milk left.", a: ["isn't"], full: "There isn't any milk left.", why: "milk ist nicht zählbar: there isn't." },
      { t: "type", q: "She wants ____ (some / any) apples.", a: ["some"], full: "She wants some apples.", why: "Aussage: some." },
      { t: "order", w: ["There", "are", "some", "apples", "on", "the", "table."], why: "There are + Mehrzahl." },
      { t: "order", w: ["Is", "there", "a", "bank", "near", "here?"], why: "Frage mit Is there …?" },
      { t: "error", s: "There is three dogs in the garden.", bad: 1, fix: ["are", "be", "am", "been"], why: "Mehrzahl: there are." },
      { t: "error", s: "Would you like any tea?", bad: 3, fix: ["some", "a", "an", "the"], why: "Bei einem Angebot steht some." },
      { t: "error", s: "There aren't some good restaurants here.", bad: 2, fix: ["any", "a", "an", "the"], why: "Verneinung: any." }
    ]
  },
  { id: "if1", unit: "H2-6b", icon: "🔀", title: "If-Sätze (Typ 1)", book: "Headlight 2 · Unit 6",
    short: "wenn …, dann …",
    explain: {
      lead: "Mit <b>if</b> beschreibst du, was passiert, wenn etwas Bestimmtes eintritt.",
      points: [
        "Bildung: <b>if</b> + Simple Present, <b>will</b> + Grundform: If it rains, we <b>will</b> stay at home.",
        "Im if-Teil steht <b>kein will</b>: If you <b>study</b> hard, you will pass.",
        "Verneinung: <b>won't</b> im Hauptsatz oder <b>don't / doesn't</b> im if-Teil.",
        "Steht der if-Teil vorn, setzt du ein <b>Komma</b>. Steht er hinten, entfällt das Komma."
      ],
      examples: [
        { en: "If it rains, we [[will]] stay at home.", de: "Wenn es regnet, bleiben wir zu Hause." },
        { en: "I will call you if I [[have]] time.", de: "Ich rufe dich an, wenn ich Zeit habe." },
        { en: "If she is late, we [[won't]] wait.", de: "Wenn sie zu spät kommt, warten wir nicht." }
      ],
      merk: "if + Simple Present, will + Grundform. Im if-Teil nie will."
    },
    items: [
      { t: "choice", q: "If it rains tomorrow, we ____ at home.", opts: ["will stay", "stayed", "would stay", "staying"], why: "Hauptsatz: will + Grundform." },
      { t: "choice", q: "If you ____ hard, you will pass the test.", opts: ["study", "will study", "studied", "studying"], why: "Im if-Teil steht Simple Present." },
      { t: "choice", q: "I will call you if I ____ time.", opts: ["have", "will have", "had", "having"], why: "Im if-Teil steht Simple Present." },
      { t: "choice", q: "If she ____ late, we won't wait for her.", opts: ["is", "will be", "would be", "was"], why: "Im if-Teil: is, nicht will be." },
      { t: "choice", q: "We ____ go to the beach if the weather is nice.", opts: ["will", "would", "are", "did"], why: "Hauptsatz mit will." },
      { t: "choice", q: "If you don't hurry, you ____ the bus.", opts: ["will miss", "missed", "would miss", "missing"], why: "Hauptsatz: will + Grundform." },
      { t: "type", q: "If I ____ (see) him, I will tell him.", a: ["see"], full: "If I see him, I will tell him.", why: "Im if-Teil: Simple Present." },
      { t: "type", q: "If it is sunny, we ____ (go) swimming.", a: ["will go"], full: "If it is sunny, we will go swimming.", why: "Hauptsatz: will + Grundform." },
      { t: "type", q: "She ____ (be) happy if you visit her.", a: ["will be"], full: "She will be happy if you visit her.", why: "Hauptsatz: will be." },
      { t: "type", q: "If they ____ (not come), we will start without them.", a: ["don't come", "do not come"], full: "If they don't come, we will start without them.", why: "Verneinung im if-Teil: don't + Grundform." },
      { t: "order", w: ["If", "you", "help", "me,", "I", "will", "help", "you."], why: "if-Teil mit Komma, dann will + Grundform." },
      { t: "order", w: ["We", "will", "play", "outside", "if", "it", "doesn't", "rain."], why: "Hauptsatz zuerst, dann if-Teil ohne Komma." },
      { t: "error", s: "If it rains, we would stay at home.", bad: 4, fix: ["will", "did", "were", "had"], why: "Hauptsatz: will." },
      { t: "error", s: "If he come, I will be happy.", bad: 2, fix: ["comes", "coming", "came", "will come"], why: "Bei he: comes, im if-Teil kein will." },
      { t: "error", s: "You will be tired if you doesn't sleep.", bad: 6, fix: ["don't", "didn't", "isn't", "aren't"], why: "Zu you gehört don't." }
    ]
  }
];
