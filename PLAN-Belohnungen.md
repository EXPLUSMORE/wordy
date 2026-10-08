# Plan: Belohnungen und Shop (vor dem Go-live festlegen)

Stand: 8.10.2026. Entwurf zur Abstimmung, noch nicht umgesetzt. Die Leitplanken stammen vom Betreiber und stehen auch in `CLAUDE.md`.

## 1. Leitplanken (verbindlich)

1. **Vier Stufen überall:** gewöhnlich, selten, episch, legendär, in **jedem** Bereich (Figuren, Tänze, Outfits/Trikots, Rahmen, Effekte, Titel, Hintergründe, Sounds, Sticker, Fortnite-Reihe).
2. **Gleich viele Artikel je Stufe**, besonders in den oberen zwei Stufen (heute: viel gewöhnlich/selten, kaum episch/legendär).
3. **Sortierung immer:** gewöhnlich → selten → episch → legendär (danach nach Preis). *Umgesetzt in 2.53.6 (Shop und Showroom).*
4. **Kleiner Start, dann Nachschub:** zum Go-live ein bewusst kleiner Shop. Jede Woche/jeden Monat kommen neue Figuren, Rahmen, Tänze usw. dazu oder ganz neue Bereiche.
5. **Vor dem Go-live planen:** Katalog, Preise und Drop-Kalender stehen vorher fest.
6. Münzen gibt es nur für Aussehen, nie für Lernvorteile. Extramünzen verteilt nur der Betreiber.

## 2. Ausgangslage (Code, 2.53.5)

- 104 Artikel mit Preis (6 davon gibt es nur über den Pass, 98 sind frei kaufbar), Summe 34.880 🪙. Seltenheit wird heute **aus dem Preis** berechnet (bis 120 / 350 / 800 / darüber). Dadurch hängen Stufe und Preis zusammen.
- Verteilung heute (ohne Gratis- und Pass-Artikel): gewöhnlich 45, selten 34, episch 12, legendär 7 (nur 9 Artikel über 800 🪙).
- Ohne epische **und** legendäre Artikel: Rahmen, Hintergründe, Effekte, Outfits, Trikots, Sounds, Farbwelten. Titel und Tänze haben je nur 1 epischen, aber keinen legendären Artikel.
- Verdienst pro Woche (Rechnung): schwach etwa 140, mittel etwa 610, top etwa 1.380 🪙.

## 3. Zielkatalog zum Start (44 Artikel statt 104)

Je Stufe gleich viele. Sticker werden als „Begleiter“ der Figuren geführt.

| Bereich | gewöhnlich | selten | episch | legendär | Summe |
|---|---|---|---|---|---|
| Figuren | 2 | 2 | 2 | 2 | 8 |
| Tänze | 1 | 1 | 1 | 1 | 4 |
| Outfits/Trikots | 1 | 1 | 1 | 1 | 4 |
| Rahmen | 1 | 1 | 1 | 1 | 4 |
| Effekte | 1 | 1 | 1 | 1 | 4 |
| Titel | 1 | 1 | 1 | 1 | 4 |
| Hintergründe | 1 | 1 | 1 | 1 | 4 |
| Sounds | 1 | 1 | 1 | 1 | 4 |
| Sticker (zu den Figuren) | 2 | 2 | 2 | 2 | 8 |
| **Gesamt** | | | | | **44** |

Die übrigen etwa 60 vorhandenen Artikel werden **nicht gestrichen**, sondern auf die vier Stufen neu verteilt und als Nachschub zurückgehalten. Das ergibt etwa 15 Wochen Inhalt ohne neue Grafiken. Wer einen Artikel schon besitzt (z. B. Magnus), behält ihn und sieht ihn in der Sammlung.

## 4. Preise je Stufe (Vorschlag)

Seltenheit wird künftig **fest je Artikel** gesetzt (`rar`), nicht mehr aus dem Preis abgeleitet. Ziel: Wie lange braucht wer bis zum Kauf?

| Stufe | Preis (Figuren) | Preis (übrige Bereiche) | schwach (140/Wo.) | mittel (610/Wo.) | top (1.380/Wo.) |
|---|---|---|---|---|---|
| gewöhnlich | 60–100 | 40–70 | unter 1 Woche | wenige Tage | Stunden |
| selten | 180–300 | 120–200 | 1–2 Wochen | unter ½ Woche | 1 Tag |
| episch | 500–800 | 300–450 | 4–6 Wochen | etwa 1 Woche | 2–3 Tage |
| legendär | 1.400–2.500 | 800–1.400 | 10 Wochen und mehr | 2–4 Wochen | 1–2 Wochen |

Wert des Start-Katalogs etwa 15.000–17.000 🪙: Top braucht dafür etwa 12 Wochen, mittel etwa 27 Wochen, schwach hat Dauerziele.

Dazu ein mögliches Drosseln der Top-Quellen (Arena-Tageslimit 30 → 20 🪙), siehe Berechnung im Chat.

## 5. Nachschub-Kalender

**Rhythmus:** Montag ist Drop-Tag. Das passt zu Crew-Woche, Wochenpass und Wochenziel.

| Takt | Inhalt | Wert je Drop |
|---|---|---|
| Jede Woche | 4 Artikel: 1 gewöhnlich, 1 selten, 1 episch, jede zweite Woche 1 legendär | etwa 1.500 🪙 |
| Jeden Monat | 1 neue legendäre Figur mit Sticker und Tanz („Monatsstar“) + neuer Wochenpass | Pass-Preis separat |
| Alle 3 Monate | 1 ganz neuer Bereich (z. B. Begleiter-Tiere, Emotes, Namensrahmen) mit allen vier Stufen | 8 Artikel |
| Saisonal | Themenwochen mit Rückkehr im nächsten Jahr | 4–6 Artikel |

Der Wochenwert von etwa 1.500 🪙 entspricht dem, was Top pro Woche verdient. Dann hat Top immer etwas zu kaufen, mittel baut einen Vorrat auf, schwach kauft die gewöhnlichen und seltenen Stücke.

**Erste 12 Wochen (relative Wochen, Datum nach Go-live):**

| Woche | Drop |
|---|---|
| 0 | Start-Katalog (44 Artikel), Willkommens-Set für den ersten Tag |
| 1 | 4 vorhandene Artikel (Bereich Tänze und Rahmen) |
| 2 | 4 vorhandene Artikel + 1 legendär (Figuren) |
| 3 | 4 vorhandene Artikel (Effekte, Hintergründe) |
| 4 | **Monatsstar 1** + neuer Wochenpass |
| 5–7 | je 4 vorhandene Artikel, in Woche 6 ein legendärer |
| 8 | **Monatsstar 2** + Pass |
| 9–11 | je 4 vorhandene Artikel |
| 12 | **Monatsstar 3** + erster neuer Bereich |

**Themenwochen (Kalender):** Halloween (Ende Oktober), Advent und Weihnachten (Dezember), Fasching, Ostern, Sommerferien Hessen, Schulstart. Themen-Artikel kommen im Folgejahr wieder, damit niemand etwas „für immer verpasst“.

## 6. Motivation um den Shop

- **Wunschstern ⭐** bleibt das Sparziel; die Startseite zeigt „Noch X Tage bis …“.
- **Vorschau auf den nächsten Drop** (verdeckte Silhouette, „Kommt Montag“), das nächste Ziel vor Augen.
- **Tagesangebot** bleibt (20 % günstiger), mit Hinweis auf die Stufe.
- **Kein Verpassen-Druck:** nichts verschwindet für immer; limitierte Teile kommen wieder.
- **Prestige ohne Münzen:** Medaillen, Pass und Pokale für die, die schon alles gekauft haben.

## 7. Aufgaben vor dem Go-live

1. Seltenheit je Artikel festlegen (`rar` setzen) und alle Bereiche auf vier Stufen auffüllen. Für die Lücken gibt es zwei Wege: vorhandene Artikel umstufen oder neue anlegen.
2. Preisliste nach Abschnitt 4 festlegen. Preissenkungen zahlen bei Besitzern die Differenz zurück (`OLD_PRICES`/`priceMigrate`), Erhöhungen berühren Besitz nicht.
3. Start-Katalog als Anzeigefilter („freigegeben ab Woche N“) bauen, damit der Rest später erscheint, ohne App-Update.
4. Drop-Kalender als Datenliste (Artikel-ID → Datum). Der Betreiber kann ihn im Dashboard pflegen.
5. Grafiken: pro Monat etwa 1 neue Figur (Eintrag im Katalog `D` in `js/stilb.js`), pro Quartal ein neuer Bereich.
6. Echtmessung: Magnus' tatsächlichen Wochenverdienst (Dashboard) neben die Rechnung legen und Preise nachjustieren.
7. Testlauf mit mindestens zwei Kindern über 2 Wochen, danach Feinschliff.

## 8. Offene Entscheidungen

- Arena-Tageslimit senken (30 → 20)?
- Sticker als eigene Käufe oder als Teil der Figur?
- Gleiche Stufenverteilung auch für Medaillen und Pass-Belohnungen?
- Wann ist Go-live (bestimmt den Kalender)?
