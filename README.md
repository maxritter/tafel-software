# Tafel-Software
Tafel-Software für den Landkreis Fürstenfeldbruck zur Verwaltung der Kunden und zum Scannen der Ausweise

## Einführung

Diese Anwendung ist als Web-Anwendung geschrieben. Die Oberfläche ist in **HTML5** und **JavaScript** geschrieben und läuft in einem Browser (Firefox, Chromium, Safari, Microsoft Edge). Der Internet Explorer wird nicht unterstützt. Der Web Server ist in **JavaScript** geschrieben und läuft unter **Node.js**. Er nutzt das **Express Framework**. Damit ist die Anwendung mehrbenutzerfähig und sie läuft auf unterschiedlichen Plattformen.

Zur Ausführung wird die neueste Version von Node.js benötigt, welche [hier](https://nodejs.org/de/download/) heruntergeladen werden kann. Im Anschluss müssen die Pakete installiert werden, dies geschieht über die Kommandozeile mit dem Befehl:

```
npm i
```

Anschließend kann das Programm wie folgt gestartet werden, und ist anschließend im Browser unter `localhost:8080` verfügbar:

```
npm run start
```

Das Programm liest die Daten zu den Kunden aus einer Datei im JSON Format. Nach dem Start wird der Dateiname angezeigt und über den Button "Einlesen" wird das Lesen gestartet. Nach dem Lesen wird durch den Button "Scannen starten" die Seite zum Einstellen der Prüfungen geöffnet. Diese wird automatisch geöffnet, wenn das automatische Lesen beim Start konfiguriert ist oder wenn die Datei bereits eingelesen wurde.

Eine vollständige Bedienungsanleitung findet sich unter `docs/Bedienungsanleitung.pdf`.

## Die Konfigurationsdatei

Die Konfigurationsdatei hat den Namen **config.json** und befindet sich unter `conf/config.json`. Sie kann mit jedem Editor bearbeitet werden. Empfehlenswert ist aber die Verwendung eines JSON-Editors wie z.B. https://jsoneditoronline.org/. Definiert werden können die folgenden Parameter:

- **port**: Ist der HTTP Port auf dem der Server wartet. Default ist 80, bei anderen Werten ist der Wert in der URL anzugeben (z.B. http://localhost:8080/ statt nur http://localhost/)

- **datei**: Definiert die zu lesende Kunden-Datei

- **automatischlesen**: Die Kunden-Datei wird beim Start automatisch gelesen, wenn dieser Parameter auf **true** gesetzt wird.

- **log**: Definiert die Datei, in der die Besuche protokolliert werden, und die Spalten die in das Protokoll aufgenommen werden.

- **stop**: Wenn auf **show** gesetzt, dann ist der Stop der Anwendung von der Startseite möglich.

- **dateiHeader**: Definiert die Spaltenüberschriften für die Ansicht "Datei". Wenn nicht angegeben, dann werden die Namen der Spalten verwendet.

- **spalten**: Definiert die Feldnamen und ihre Position in der Kundendatei.

- **sortieren**: Definiert Felder, die beim Speichern sortiert werden sollen. Anzugeben ist der Anfang der zu sortierenden Feldnamen (z.B. "Kind " damit die Spalten Kind 1 bis Kind 6 sortiert werden). Dabei werden leere Felder nach unten sortiert.

- **check**: Definiert die Prüfungen, die beim Scannen durchgeführt werden sollen. Zu definieren sind die Namen der Spalten und die möglichen Werte.

- **werte**: Definiert die Namen von Spalten und die möglichen Werte.

- **neukunde**: Definiert die Werte, mit denen die Felder in der Erfassung vorbelegt werden sollen.

- **id**: Definiert den Aufbau der ID, die bei der Neuerfassung eines Kunden vom System vorgeschlagen wird.

  Der Default für den Aufbau der ID ist jjmmtt nn 0. Dabei ist jjmmtt das Tagesdatum, nn ist eine laufende Nummer von 01 bis 99 für den Tag und 0 ist die Unternummer. Diese kann z.B. manuell hochgezählt werden, wenn für den Kunden ein neuer Ausweis gedruckt werden muss.

- **tafel**: Namen der Tafel für die Ausweise. Die Zeilen sind durch \n zu trennen.

- **kuerzel**: Definiert den Kurznamen der Tafel für die Jahresstatistik. Wenn dieser Werte nicht definiert ist, dann wird keine Jahresstatistik erstellt.

- **logo**: Name der Bilddatei mit dem Logo der Tafel (ca. 1000x300 Bildpunkte).

- **color**: Definiert für jede Farbe den Namen im HTML/CSS (z.B. "blau": "blue"). Diese Definition legt die beim Ausweisdruck verwendeten Farben fest.

- **CSVSeparator**: Definiert den Trenner für CSV-Dateien. Üblich sind Komma (,) Semikolon (;) oder Tab (\n).

## Die Kunden-Datei

Der Dateiname der aktiven Kunden-Datei wird in der Konfigurationsdatei unter `datei` spezifiziert, zum Beispiel `conf/tafelmaisach.json`. Die JSON Datei enthält die Kundendaten getrennt nach aktiven und inaktiven Kunden. Die folgenden Informationen sind immer vorzusehen:

- **ID**: Eine eindeutige ID. Diese wird zum Scannen benötigt und ist der eindeutige Schlüssel in der Kunden-Datei.
- **Name**: Der Name des Kunden (Nachname gefolgt von den Vornamen)
- **Adresse**: Adresse (Straße, Hausnummer, Postleitzahl und Ort)
- **Erwachsene**: Anzahl der versorgten Erwachsenen
- **Kinder**: Anzahl der versorgten Kinden
- **A/B/C**: Die zugeteilte Gruppe
- **Farbe**: Die zugeteilte Farbe
- **Gültig bis**: Datum, bis zu dem der Ausweis gültig ist
- Letzter Besuch: Datum, an dem der Kunde die Tafel zuletzt besucht hat

Die folgenden Informationen sind empfohlen technisch aber nicht erforderlich:

- **Kind 1 ... 6**: Geburtsjahre und Geschlecht der Kinder
- **Anmerkung**: Beliebige Anmerkungen zum Kunden

Weitere Werte können beliebig über die Konfigurationsdatei konfiguriert werden.

## Das Scannen von Ausweisen

Nach dem Starten des Programmes wird der Browser automatisch geöffnet und es wird die Seite zum Einstellen der Auswahlkriterien/Prüfungen angezeigt. Darunter werden die Kunden angezeigt, die der Auswahl entsprechen und deren Besuch erwartet wird. Durch klicken auf einen Namen werden die Details zum Kunden angezeigt.

Aus dem Dialog mit den Auswahlkriterien kann über den Button **Scannen** das Scannen der Kunden-Ausweise gestartet werden. Wenn die gescante **ID** vorhanden ist, dann werden beim Scannen die Details zum Kunden angezeigt. Unter den Details werden Warnungen angezeigt, z.B. dass der Ausweis des Kunden nicht mehr gültig ist. Auf der Detailseite wird dann der Besuch des Kunden vermerkt.

Wenn der Kunde noch nicht registriert ist, dann kann er über den Button **Neuer Kunde** sofort erfasst werden. Nach der Erfassung der Kundendaten wird die Detailseite zum Vermerk des Besuches geöffnet.

## Suchen von Kunden

Das Suchen erfolgt immer in der aktiven Kunden-Datei. Die inaktive Kunden-Datei enthält die gelöschten Kunden.

Alternativ kann aus dem Dialog mit den Auswahlkriterien über den Button **Suchen** die Kundesuche gestartet werden. Ein Kunde kann über die **ID** oder über den Anfangsbuchstaben seines Namen in der Spalte **Name** gesucht werden.

Weiterhin können die Kunden angezeigt werden, die die Tafel heute schon besucht haben. Neben den IDs werden Statistik-Informationen angezeigt. Wenn am aktuellen Tag noch keine Besucher registriert wurden, dann werden Statistik-Informationen zum letzten Öffnungstag angezeigt.

Über die Buttons **Inaktive Kunden** können die gelöschten Kunden bearbeitet werden und über **Neuer Kunde** kann ein Kunde neu angelegt werden.

## Beenden des Programms

Am Ende des Tages kann der WebServer über den Button **Programm beenden..** beendet werden. Alternativ kann das Fenster für den WebServer einfach gschlossen werden.

Beim Beenden des WebServers wird die Statistikdatei geschrieben (siehe unten).

## Anzeige von IDs und Namen in Listen

Wenn Namen angezeigt werden, dann wird beim Positionieren des Mauszeigers über den Namen die dazugehörige ID angezeigt.

Die Einträge in den Listen sind farbig markiert:

- **rot**: Die Berechtigung ist abgelaufen
- **grün**: Der Kunde hat die Tafel heute bereits besucht
- **blau**: Kunde ist berechtigt und hat die Tafel heute noch nicht besucht

## Erfassen eines neuen Kunden

Die Felder im ersten Block sind Pflichtfelder, sie sind in jedem Fall zu erfassen. Im leeren Eingabefeld wird vor der Eingabe das erwartete Format angezeigt. Das Format wird allerdings beim Speichern nicht geprüft.

In der Auswahlliste für die Gruppe und die Farbe kann über den Button "Verteilung der Farben ein-/ausblenden" ein Pop-Up geöffnet werden. Dieses Pop-Up zeigt die Anzahl der Kunden pro Gruppe und Farbe an.

## Prüfungen beim Scannen

Generell wird der Inhalt der Spalte **Gültig bis** gegen das aktuelle Datum geprüft. Es wird eine Warnung angezeigt, wenn der Ausweis in den nächsten 3 Wochen abläuft oder aber bereits abgelaufen ist.

Die Prüfungen können frei konfiguriert werden (siehe die Konfigurationsdatei **config.json**).

## Anzeige der Details zu einem Kunden

Angezeigt werden alle Informationen, die zum Kunden erfasst wurden. Weiterhin werden die Resultate der konfigurierten Prüfungen eingeblendet.

Über den Button **Besuch vermerken** wird das Datum des letzten Besuches auf den aktuellen Tag gesetzt und die Detailanzeige wird geschlossen.

Weiterhin kann der Ausweis verlängert werden, die Kundendaten können geändert werden und der Ausweis kann gelöscht werden. Gelöschte Ausweise können über den Button **Inaktive Kunden** angezeigt werden. Sie können dort endgültig gelöscht werden oder geändert und damit reaktiviert werden.

Alle Änderungen werden sofort in die Kunden-Datei geschrieben.

## Ausweise Drucken

Zur Auswahl der zu druckenden Ausweise zeigt der Dialog die IDs oder Namen an. Durch Klick auf einen Namen oder eine ID wird jeweils ein Ausweise erstellt und angezeigt. Durch Klick auf den Button "Alle drucken" wird für alle ein Ausweis erstellt und angezeigt.

Per Doppelklick auf den Ausweis kann der Ausweis wieder entfernt werden.

Die Ausweise sind 88 mm breit und 58 mm hoch. Es passen somit 2 mal 4 Ausweise auf ein DIN A4 Blatt. In der Druckvorschau (sofern vorhanden) sind schmale Ränder und eine Skalierung von 100% einzustellen.

## Die Statistikdatei

Die Statistikdaten werden beim Beenden des Servers in eine Datei mit dem Namen

```
jjjj-mm-dd-statistik.csv
```

geschrieben. Dabei ist jjjj-mm-dd das Datum des letzten Öffnungstages. Sie enthalten eine Zeile mit folgenden Werten:

- Datum im Format jjjj-mm-dd
- Anzahl der berechtigten Kunden
- Anzahl der berechtigten Erwachsenen
- Anzahl der berechtigten Kinder
- Anzahl der Besucher am Öffnungstag
- Anzahl der versorgten Erwachsenen
- Anzahl der versorgten Kinder

Die Statistikdateien werden zur Erstellung der Jahresstatistik herangezogen.

## Die Jahresstatistik

Beim Beenden liest der Server alle vorhandenen Statistikdateien vom aktuellen Jahr und fasst die Werte in einer Excelliste zusammen. Die Datei hat den Namen

```
jjjj-summen.xlsx
```

Sie wird nur dann erstellt, wenn der Konfigurationsparameter **kuerzel** in der Konfigurationsdatei definiert wurde.