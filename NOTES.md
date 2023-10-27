# Notizen


## Bugs
- [x] User-Policies: Domain-Tab nicht schließbar, nach hinzufügen von Policy


## TODO
TODO's nach Kategorie.

### Infoseite
- [ ] Infopage kürzen/überarbeiten **lets go**
  > das ist vor dem nächsten interview wichtig

### Konfigurationsseite
- [ ] Problem: Schnittmenge zwischen zwei CA-Sets. Wie löst man das?
  Warnhinweis + Default niedrigeres Level nehmen?
- [ ] Widersprechende Policies gibt es glaube ich nicht, generell sollten
  spezifischere Policies (example.com ist spezifischer als *.com) allgemeinere
  überschreiben. Das muss auch so sein, wenn die default policy standard trust
  für alle cas bei domain "*" ist..
- [ ] User Policies nach Domain sortieren
- [ ] Filter für User Policies (also für domains) könnte bei vielen Policies
  später sinnvoll sein
- [ ] Suchoption für Policies, wo man mit wildcards suchen kann und einem dann
  nurnoch die Policies angezeigt werden, die für diese suche angewandt werden
  (*.de --> amazon.de und google.de und * .. oder so)
  - [ ] Das könnte eine Interviewaufgabe werden. Bei unübersichtlicher
    Policy-Lage, eine änderung durchführen
- [ ] Die Policies für eine Domain könnten eigentlich direkt mit den Policies
  der darüberliegenden Domain initialisiert werden. Das ändert nichts, aber
  macht die Funktionsweise expliziter
- [ ] Popup bei versuch, doppelte domain hinzuzufügen
- [ ] Reset/Save Changes Buttons sollten überall funktionieren
- [ ] Was passiert wenn man ein CA-Set löscht, das verwendet wird?
  - [ ] Verwendende Policies können eigentlich nicht in der Config bleiben, weil
    es sonst probleme geben wird, wenn der Setname in der internen Logik
    aufgelöst werden soll.
- [ ] Predefined CA Sets
#### Preferences
- [ ] einzelne CAs auswählbar machen
#### Trust Levels
- [ ] Was passiert, wenn man ein Trust-Level löscht, das aber in Policies
  verwendet wird?
  > In Interviews fragen: ist blöd und nicht wirklich zu lösen, nicht löschbar,
  > mit hinweis für den benutzer
#### CA-Sets
- [ ] Custom CAs vllt. persistent hinzufügbar machen, damit man sie dann auch
  einfach anklicken kann
- [ ] ca-set name verbieten, wenn er gleich einem distinguished name in dem
  trust store ist, weil diese Setnamen im hintergrund für einzelne CAs gebraucht
  werden, die auch in den trust preferences konfigurierbar sein sollen

### Design
- [ ] Delete Buttons rötlich
- [ ] Color-coded Trust level
  - [ ] für default levels
  - [ ] dynamischer farbverlauf für selber hinzugefügte levels:  
        Untrusted: rot  
        lower trust: orange-range  
        standard: white/very light green  
        higher trust: green-range
- [ ] Toggle button für `*` Domain muss mit `v` initialisiert werden
- [ ] Sortierung der Domains, vllt sogar schachtelung..?  Kennzeichen:
  dunkelgrauer balken links
- [ ] reset/save changes sollte zum anfang der section zurückscrollen
- [ ] user policies zu viele farben, domain einfach grau?


## DONE
Als Erinnnerung später.

### Konfigurationsseite
- [x] Keine doppelten Präferenzen zulassen, also zumindest nicht zwei
  verschiedene Einträge für dasselbe CA-Set unter derselben Domain
- [x] Info bei custom CAs: die müssen auch im browser trust-store hinzugefügt
  werden, sonst wird es nicht klappen!
- [x] Trust-Level muss schon `onChange` in (lokale) config übernommen werden,
  sonst wird das beim hinzufügen einer neuen preference sofort zurückgesetzt
- [x] Info-Icons bei Trust-Levels `Untrusted` und `Standard Trust`.
- [x] JSON-Config könnte wahrscheinlich mit in normale Settings (am Ende),
  genauso wie Trust-Levels
- [x] Info "Popup" implementieren, damit ich mit den Info-Boxen weitermachen
  kann, wenn mir etwas einfällt 
  - nurnoch als class statt als id machen, dann ist fertign
- [x] CA-Set Filter on change machen
- [x] Custom CAs in Set Builder wirklich übernehmen
- [x] Live übertrag in Config (onChange) von User Policies
  - [x] Levels: Problem ist eigentlich, dass in der config mehrere Werte zu
    mgleichen überhaupt gespcichert werden können
  - [x] Neue config zu ende in javascript übernehmen
  - [x] Hinzufügen neuer policy muss eine der übrigen CA-Sets nehmen
  - [x] Selects dürfen immer nur aktuelle value + die unconfigured casets haben
    als optionen
  - [x] delete klappt nicht mehr aktuell
  - [x] add policy klappt nicht mehr bei neuen domains...
- [x] delete domains statt ausklappen an der seite  
  - [x] erstmal ausklappen über domainheader..
- [x] trust level richtig laden
- [x] wenn das caset beim hinzufügen leer ist, dann wird irgendwie noch eins mit
  namen "" hinzugefügt, ausirgendwinnem grund (zmndst als erstes hinzufügen..)
  > scheint gefixt, aber erstmal weiter beobachten..
- [x] on hcnage ca set, nicht alles schließen (wie bei change trust level
  machen)
- [x] `Trust Preferences` anstatt `User Policies`?!
#### CA Sets
- [ ] `select all` button für wenn man schon gefiltert hat
- [ ] `modify set` option, wo das dann vielleich in den set builder nochmal
  reingeladen wird
#### Trust Levels
- [x] Trust Levels nach Rank sortieren
- [x] Add trust level functionality

### Design
- [x] userpolicies domain über ganze breite und toggle einfach indem man auf die
  domain klickt
  > delete ist noch daneben aber ansonsten