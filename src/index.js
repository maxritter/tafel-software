/*
 * Dieses Script ist das Startscript. Es liest die Konfiguration und
 * startet den WebServer. Alle Zugriffe erfolgen über diesen Code
 */
"use strict";

const kunden = require('./kunden.js');  // Kunden-Datenbank
const config = require('./config.js');  // Konfiguration
const datei = require('./datei.js');  // Konfiguration

const http = require('http')            // WebServer
const express = require('express')      // WebServer Zusatzmodule

// Express initialisieren
const app = express()

// Lesen der Konfiguration
let configDatei = 'conf/config.json';
if (process.argv.length > 2) configDatei = process.argv[2];
console.log(`Die Konfigurationsdatei ${process.cwd()}/${configDatei} wird gelesen...`);
config.readConfig(configDatei);
console.log("...abgeschlossen");

// Statement zum Anzeigen der HTML-Seiten, der Scripts und des Stylesheets.
// Dies enthält alle Funktionen des WebServers zum Anzeigen von WebSeiten.
app.use(express.static(__dirname + "/www", { index : 'PageLoad.html', extensions : 'html' }));

process.on('SIGINT', endServer);
process.on('SIGHUP', endServer);
process.on('SIGTERM', endServer);

if (config.readOnStart()) {
  let fn = config.getFileName();
  if (fn.indexOf("/") < 0 && fn.indexOf("\\" < 0)) fn = process.cwd() + "/" + fn;
  console.log(`Die Kunden-Datei ${fn} wird geladen...`);
  let returnCode = kunden.readDatenbank(config.getFileName(), config.getSpaltenUndIndex());
  if (returnCode != null)
    console.log("Fehler beim Lesen der Kunden-Datei: " + returnCode);
  else
  console.log("...abgeschlossen");
}

app.get('/svc/package', (req, res) => {
  res.send(config.readPackage());
});

// Abfrage des Status
app.get('/svc/SvcAdmin', (req, res) => {
  res.json(config.getAdminStatus(kunden.isDatenbankReady(), ''));
});

// Einlesen der Kundendaten
app.post('/svc/SvcAdmin', (req, res) => {
  let filename = JSON.parse(req.query.json).filename;
  config.setFileName(filename);
  let returnCode = kunden.readDatenbank(filename, config.getSpaltenUndIndex());
  if (returnCode != null)
    res.json(config.getAdminStatus(false, returnCode));
  else
    res.json(config.getAdminStatus(true, 'Die Datei wurde geladen'));
});

// Abfrage der Statistik
app.get('/svc/SvcStatistik', (req, res) => {
  proc(req, res, () => {
    res.json(kunden.statistik());
  });
});

// Abfrage der checks
app.get('/svc/SvcCheck', (req, res) => {
  proc(req, res, (param) => {
    let result = {};
    result.selects = config.getChecks();
    result.sortieren = config.getSortieren();
    if (param.links == true) result.links = kunden.getNameFor(config.getCheckForSelect());
    if (param.werte == true) result.selects = result.selects.concat(config.getWerte());
    res.json(result);
  });
});

// Selects für die speziellen Spalten (checks) wurden geändert
app.post('/svc/SvcCheck', (req, res) => {
  proc(req, res, (param) => {
    let ix = param[0].substring(5);
    config.setChecks(ix, param[1]);
    res.json(kunden.getNameFor(config.getCheckForSelect()));
  });
});

// Die Liste mit den IDs der geänderten Ausweise löschen
app.post('/svc/SvcChanged', (req, res) => {
  proc(req, res, (param) => {
    kunden.resetChanged();
    let result = kunden.writeDatenbank(config.getFileName());
    if (result == null) res.json('');
    else res.send(result);
  });
});

// Erzeugt eine HTML Table mit allen Kunden und Daten
app.get('/datei', (req, res) => {
  proc(req, res, (param) => {
    res.send(datei.getAllAsTable());
  });
});

// Kunden anzeigen
app.get('/svc/SvcKunde', (req, res) => {
  proc(req, res, (param) => {
    let kunde;
    if (param.id == undefined) kunde = kunden.getKundeNeu(config.getNeuKunde(), config.getNeuId());
    else if (param.aktiv == false) kunde = kunden.getKundeInaktiv(param.id);
    else kunde = getKunde(param.id);
    res.json(kunde);
  });
});

// Besuch vermerken oder Kunden löschen
app.post('/svc/SvcKunde', (req, res) => {
  proc(req, res, (param) => {
    let result;
    if (param.type == 'visit') {
      result = kunden.setVisited(param.id, config.getLog(), config.getCSVSeparator());
    } else if (param.type == 'delete') {
      result = kunden.delete(param.id);
    } else if (param.type == 'change') {
      result = kunden.change(param.oldid, param.bean);
      if (result != null) {
        res.json({message: result});
        return;
      }
    } else {
      result = "Bad call to SvcKunde, type=" + param.type;
    }
    if (result == null) result = kunden.writeDatenbank(config.getFileName());
    if (result == null) res.json('');
    else res.send(result);
  });
});

// Ausweis verlängern
app.post('/svc/SvcProlong', (req, res) => {
  proc(req, res, (param) => {
    let result = kunden.setNewDate(param.id, param.date);
    if (result == null) result = kunden.writeDatenbank(config.getFileName());
    if (result == null) res.json(getKunde(param.id));
    else res.send(result);
  });
});

// Suchen von Kunden über die ID ober den Anfangsbuchstaben
app.get('/svc/SvcSearch', (req, res) => {
  proc(req, res, (param) => {
    if (param.type == "ID") res.json(kunden.getIds());
    else if (param.type == "changed") res.json(kunden.getIdsChanged());
    else res.json(kunden.getName(param.type, param.weeks));
  });
});

// server beenden - Antwort noch senden
app.post('/svc/SvcStopServer', (req, res) => {
  setTimeout(endServer, 1000);
  res.json('');
});

function makeHtml(str) {
  if (str == undefined) return '';
  if (typeof str == 'string') return str.replace('>', '&gt;').replace('<', '&lt;');
  return str;
}

// Den WebServer aus der Express-App erzeugen
const server = http.createServer(app);
// Den WebServer starten
server.listen(config.getPort(), () => console.log(`Warte auf Anfragen auf Port ${config.getPort()}!`));

// Grundprüfung und Auffangen von Fehlern
function proc(req, res, handler) {
  if (!kunden.isDatenbankReady()) {
    res.send("Starten Sie die Anwendung neu");
    return;
  }
  res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
  try {
    // Alle Werte werden als JSON mit dem Parameter 'json' in der URL übergeben
    let param = req.query.json;
    if (param != undefined) param = JSON.parse(param);
    handler(param);
  } catch (err) {
    console.error(err);
    res.send(err);
  }
}

// Liefert einen Kunden und bereitet die Meldungen auf
function getKunde(id) {
  let kunde = kunden.getKunde(id);
  if (kunde.bean != undefined) {
    let result = config.doCheck(kunde);
    result.forEach(message => {
      if (kunde.message.length > 0) kunde.message += '<br>';
      kunde.message += message;
    });
  }
  return kunde;
}

// server exit
async function endServer() {
  let SEP = config.getCSVSeparator();
  if (kunden.isDatenbankReady()) kunden.statistik(true, SEP);
  let kuerzel = config.getAdminStatus(false, '').kuerzel;
  if (kuerzel != undefined) {
    try {
      let promise = require('./statisticXLSX.js').makeXLSX(".", kuerzel);
      if (promise != null) await promise;
    } catch (err) {
      console.error(err);
    }
  }
  process.exit();
}
