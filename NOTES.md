# Notizen


## Bugs
- [x] User-Policies: Domain-Tab nicht schließbar, nach hinzufügen von Policy


## TODO
TODO's nach Kategorie.

### Generell
- [x] Beim Laden und Speichern der Config, von/nach Format konvertieren, dass
  von der Extension intern verwendet werden kann.  
  > meine config muss aber auch irgendwo persistens gespeichert werden, weil
  > sonst bleiben z.B. die description eines CA-Sets nicht erhalten.  
  > Kann man vllt. alles irgendwie in das andere Format auch kriegen???
  - [X] Converter geschrieben, jetzt muss das nurnoch jedes mal passieren, wenn
    an der config was geändert und gespeichert wird.
    1. in neuem format auch im backend speichern
    2. jedes mal automatisch die original config updaten
  - [x] reset Config
  - [x] get config from background
    - [x] config-page.js ohne config.js umbauen
  - [x] post config to background
  - [x] wie werden die beiden configs initialisiert?
    - [x] scheint zu klappen, aber default muss noch angepasst werden!
- [ ] div-class machen, wo unten ein pfeil angezeigt wird und wenn man drauf
  klickt, expanded sich das div. für lange listen, damit die inicht immer per
  default komplett angezeigt werden müssen

### Infoseite
- [ ] Infopage verfeinern, vllt. geopolitik usecase mit einbauen
  > das ist vor dem nächsten interview wichtig

### Konfigurationsseite
- [ ] Problem: Schnittmenge zwischen zwei CA-Sets. Wie löst man das?
  Warnhinweis + Default niedrigeres Level nehmen?
  > per default wird das höhste level genommen.  
  > für mich würde es erstmal reichen, einfach einen hinweis anzuzeigen, wenn es
  > solche einstellungen gibt, die möglicherweise nicht den gewünschten effekt
  > haben.  
  > hier ist dann auch das problem mit low trust, das kann ja garnicht
  > funktionieren bisher. allerdings, einfach mit low trust anfangen überall,
  > bringt auch nichts, weil den fall, dass man ein paar cas ausschließen will
  > von einem anderen höheren trust level, wird es wohl immer irgendwie geben.  
  > oder könnte es was bringen, nicht mit einem deafult trust level zu arbeiten?  
  - [ ] Mail an Cyrill geschrieben. Antwort steht aus.
- [ ] Widersprechende Policies gibt es glaube ich nicht, generell sollten
  spezifischere Policies (example.com ist spezifischer als *.com) allgemeinere
  überschreiben. Das muss auch so sein, wenn die default policy standard trust
  für alle cas bei domain "*" ist..
  > hängt mit punkt ein drüber zusammen.. mal schauen.
- [x] User Policies nach Domain sortieren
  > alphabatisch sortiert erstmal
- [ ] Filter für User Policies (also für domains) könnte bei vielen Policies
  später sinnvoll sein
  > aber erstmal nicht so wichtig. ich soll scheinbar im kleinen rahmen denken
- [ ] Suchoption für Policies, wo man mit wildcards suchen kann und einem dann
  nurnoch die Policies angezeigt werden, die für diese suche angewandt werden
  (*.de --> amazon.de und google.de und * .. oder so)
  - [ ] Das könnte eine Interviewaufgabe werden. Bei unübersichtlicher
    Policy-Lage, eine änderung durchführen
    > oder einfach erkennen, was konfiguriert wird durch die policies. wär zB
    > für die oben interessant zu wissen, wie benutzer das erwarten würden.  
    > das geht allerdings schon langsam in ne richtung wo man ne richtige
    > umfrage machen könnte zu.
- [x] Die Policies für eine Domain könnten eigentlich direkt mit den Policies
  der darüberliegenden Domain initialisiert werden. Das ändert nichts, aber
  macht die Funktionsweise expliziter
  > ja irgendwie sowas, vllt. auch ausgegraut oder so, solange man nichts dran
  > ändert (mit hinweis von welcher domain die kommen jeweils)
- [ ] Reset/Save Changes Buttons sollten überall funktionieren
  - [x] ..und ein feedback (z.B. popup) geben.
- [x] Reset config button mit popup vorher 
#### Preferences
- [x] Wenn eine preference geändert wird, müssen eigentlich alle domain-contents
  neu geladen werden, weil vllt erbt einer davon, dann wäre das nicht mehr
  aktuell!!
  > am geilsten wär ne datenstruktur im hintergrund und immer wenn daran was
  > geändert wird, werden automatisch die relevanten teile des DOMs geupdated
- [ ] einzelne CAs auswählbar machen
- [ ] sortieren, sodass subdomains nahe ihren parents zu finden sind
  - [ ] eine art baumstruktur wäre sonst noch eine gute idee
  > das ist nicht ganz so einfach glaube ich, low prio
- [ ] löschen von prefs vllt. auch nochmal bestätigen, aber wenn dann
  unproblematisch, indem zB die row rot hinter/überlegt ist und man dann nochmal
  auf den gleichen button klicken muss, wo diesmal ein haken ist. oder so etwas
- [ ] Den ganzen Info-Text kürzen und auf englisch machen 
- [ ] Eingabefeld `Notizen` bei jeder Domain, optional, damit man sich selber 
  erinnern kann an begründungen für bestimmte einstellungsmöglichkeiten
- [ ] `I2-?`: Manuelles verschieben/sortieren der Preferences möglich machen und
  dadurch die Priorität von Rules selber festlegen (First-match wie bei
  firewall)
#### Trust Levels
- [ ] Was passiert, wenn man ein Trust-Level löscht, das aber in Policies
  verwendet wird?
  > In Interviews fragen: ist blöd und nicht wirklich zu lösen, nicht löschbar,
  > mit hinweis für den benutzer
- [ ] (Idee durch `I2-466`): Standard-Use-Cases über Actions abbilden, mit denen
  man z.B. `CA-Pinning` leichter machen kann, indem man einfach die CAs, die für
  eine bestimmte Domain in Frage kommen, angibt
  - [ ] mal für `CA-Pinning` umsetzten und in Interview abfragen, wie das
    ankommt und ob das für noch mehr UseCases nice wäre.
- [ ] `I2-499`: User zwingen sich mit der Reihenfolge/Priorisiertung von
  Preferences auseinanderzusetzen, indem man die liste sortierbar (per drag and
  drop am besten) macht. (auch `I2-533` und ddazwischen)
  - [ ] Regeln, die garnicht erreicht werden können am ende der liste, könnte
    man dann am besten ausgrauen oder so..
#### CA-Sets
- [ ] Custom CAs vllt. persistent hinzufügbar machen, damit man sie dann auch
  einfach anklicken kann
- [ ] ca-set name verbieten, wenn er gleich einem distinguished name in dem
  trust store ist, weil diese Setnamen im hintergrund für einzelne CAs gebraucht
  werden, die auch in den trust preferences konfigurierbar sein sollen
- [ ] Was passiert wenn man ein CA-Set löscht, das verwendet wird?
  - [ ] Verwendende Policies können eigentlich nicht in der Config bleiben, weil
    es sonst probleme geben wird, wenn der Setname in der internen Logik
    aufgelöst werden soll.
  > ich glaube interview 2 hat gesagt, dass er erwarten würde, dass die entspr.
  > policies einfach gelöscht werden
  - [ ] popup, dass die policies gelöscht werden würden. bestätigung fordern
    oder abbrechen lassen.
- [ ] `select all` button für wenn man schon gefiltert hat
- [ ] `modify set` option, wo das dann vielleich in den set builder nochmal
  reingeladen wird
- [ ] Suche nach bestimmten CAs erleichtern, indem man in Filtern auch Aliase
  berücksichtigt. Die müssten dann wahrscheinlich irgendwo in ner entsprechenden
  Datei gepflegt werden.  
  > Die Frage ist auch, ob man (falls ich es so mache, dass manuell hinzugefügte
  > CAs bald auch in der Liste erscheinen) den Benutzer selber aliase für seine
  > manuell hinzugefügten CAs erstellen lässt.
- [ ] kann ich es so coden, dass ich den teil zum auswählen von CAs einfach
  wiederverwenden kann, um in preferences einzelne cas auszuwählen?
  > das macht auch nur sinn, wenn manuell hinzugefügte cas hier angezeigt
  > werden, sonst muss man die beim hinzufügen einer preference angeben (gut
  > wäre auch eine option..)
- [ ] Liste von existiereneden ca set vllt genauso machen wie die liste
  existierender domains, zum ausklappen und dann stehen da die informationen,
  description und ca liste etc??
- [ ] irgendwie ne funktion implementieren, die prüfen, welche überschneidungen
  es bei einer liste von ca-sets gibt (also welche ca-sets überschneidungen mit
  welchen anderen haben)
  - [ ] Hinweis, dass eine preference nicht für alle cas übernommen wird immer
    bei der preference und nicht etwa da wo die higher-prio preference ist
- [ ] `I2-391`: Custom-CAs wäre konsistenter, wenn man die irgendwo hinzufügen
  könnte, sodass die dann immer mit in der Liste zum filtern mit drin sind
  - [ ] das ist auch direkt der erste sinnvolle standard-filter: "custom-cas"
- [ ] `I2-371`: Klarer machen, in welchem Format die Custom-CAs hinzuzufügen
  sind und wenn das eingagebelf so bleibt, dass man eine pro zeile angibt
- [ ] `I2-559`: Buttons zm aufklappen solten so aussehen, wie auch bei trust
  preferences.
- [ ] `I2-564`: Löschen von CA-Sets. Hinweis, wenn dadurch preferences entfernt
  werden, aber dann ist das auch ok.
  - [ ] Preferences entfernen dann auch!
- [ ] `I2-610`: Text von Custom-CA Set leeren nach hinzufügen eines sets
- [ ] `I2-618`: Scrolleffekt nach hinzufügen expliziter und evtl hervorheben der
  hinzugfefüten set durch dicken border kurz..
- [ ] `I2-625`: Leere Set-Namen verbieten
#### Import/Export
- [ ] Fragen, ob settings überschrieben werden sollten, oder versucht werden
  soll, die settings automatisch zusammenzuführen (für einfachen fall, wo es
  keine konflikte gibt, könnte ich das schon machen..)
- [ ] `I2-265`: Möglichkeit (für Firmen etc.) Settings von Mitarbeitern über URL
  oder so miteinander zu synchonisieren. (In Firmen müssen die Settings dann 
  ja ggf. auch bei vielen nciht technik affinen menschen eingestellt werden. am 
  besten nicht von denen selber.) 
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

---

## DONE
Als Erinnnerung später.

### Konfigurationsseite
- [x] Keine doppelten Präferenzen zulassen, also zumindest nicht zwei
  verschiedene Einträge für dasselbe CA-Set unter derselben Domain
  > ab wann ist das umgesetzt?? nachgucken!  
  > bei version 1 noch nicht, aber dann in version 2  
  > `all truststore cas` übrigens in version 2 noch kein explizites ca-set, also
  > auch nicht bearbeitbar gewesen, aber schon löschbar..
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
#### Trust Preferences
- [x] mal testen wie es aussieht, wenn man die domains erstmal nur nach alphabet
  sortiert
  > erstmal auch ganz gut
- [x] sortieren der prefs innerhalb einer domain
- [x] sotieren auch der inherited prefs
- [x] info icon für inherited prefs (woher kommen die?)
- [x] `td`s mit attributen versehen, die domain, ausgewähltes ca-set bzw.
  trust-level angeben
- [x] Popup bei versuch, doppelte domain hinzuzufügen
- [x] Delete domain
- [x] Add domain!
- [x] beim saven etc. nicht die öffnungsstruktur des baumes zurücksetzen
- [x] bei speichern und andern etc. auch die data-attr. ändern
- [x] select row am ende jeder domain preferences anzeigen zum hinzufügen  
  (`I2-441` zB): unklar, wie man preferences hinzufügt.
  - [x] onchange wird gespeichert und dann gibt es eine neue select row darunter
    > muss schon sowohl caset als auch level gesetzt sein.
- [x] inherited preferences erstmal kurzübersicht zeigen und ausklappbar dann
  auch die zugegörigkeit zu den domains
  > nimmt sonst zu viel platz weg und braucht man vllt auch nicht immer, wenn
  > man nicht gerade was daran ändern will und wissen muss wo es herkommt.  
  > kann man jetzt per info icon machen
- [x] delete domain button schmaler machen, der sticht viel zu sehr heraus.
#### CA Sets
- [ ] Predefined CA Sets
  > eher weniger wichtig für mich denke ich. aber future work.  
  > in latex file übernommen
#### Trust Levels
- [x] Trust Levels nach Rank sortieren
- [x] Add trust level functionality

### Design
- [x] userpolicies domain über ganze breite und toggle einfach indem man auf die
  domain klickt
  > delete ist noch daneben aber ansonsten