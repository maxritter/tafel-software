/*
 * Hier liegen alle Methoden zum Zugriff auf die Konfiguration
 */
"use strict";

const fs = require("fs");       // Dateizugriffe

var config;                     // Hier liegt die Konfiguration

// Enthält die Admin Information
class AdminStatus {
  constructor (ready, msg) {
    this.ready = ready;
    this.filename = config.datei;
    this.showstop = config.stop == "show";
    this.statusmessage = msg;
    this.tafel = config.tafel;
    this.logo = config.logo;
    this.zusatz = config.zusatz;
    this.color = config.color;
    this.kuerzel = config.kuerzel;
  }
}

// Liefert die Namen der Spalten und die Indices
exports.getSpaltenUndIndex = function() {
  let result = [[], []];
  result[0] = Object.keys(config.spalten);
  result[0].forEach(key => {
    result[1].push(config.spalten[key]);
  });
  return result;
}

// Separator CSV
exports.getCSVSeparator = function() {
  return config.CSVSeparator == undefined ? '\t' : config.CSVSeparator;
}

// Name der Kunden-Datei
exports.getFileName = function() {
  return config.datei;
}

// Spalte für die dateiHeader
exports.getDateiHeader = function() {
  return config.dateiHeader;
}

// Port
exports.getPort = function() {
  return config.port;
}

// Sortieren
exports.getSortieren = function() {
  return config.sortieren == undefined ? [] : config.sortieren;
}

// Beim Start lesen
exports.readOnStart = function() {
  return config.automatischlesen == true;
}

// Name der Log-Datei
exports.getLog = function() {
  return config.log;
}

// Setzen des Namen der Kunden-Datei
exports.setFileName = function(filename) {
  config.datei = filename;
}

// Abfrage des Status
exports.getAdminStatus = function(ready, msg) {
  return new AdminStatus(ready, msg);
}

// Prüfungen (z.B. die Farbe)
var checks = [];
// Vorgegebene Werte für die Eingabe
var werte = [];

//  Enthält die Information für einen HTML select
class Checks {
  constructor(id, label, options) {
    this.id = id;
    this.label = label;
    this.options = options;
    this.selected = 0;
  }
}

// Liefert die Vorbelegung für die Neuanlage eines Kunden
exports.getNeuKunde = function() {
  return config.neukunde;
}
exports.getNeuId = function() {
  // Default Konfiguration verwenden wenn keine definiert wurde (Kompatibilität zu Version 1)
  if (config.id == undefined) return {vollesjahr: false, tag: 2, unternummer: true};
  return config.id;
}

// Liefert die Namen und Werte der zu prüfenden Spalten
exports.getCheckForSelect = function () {
  let result = [];
  for (let i = 0; i < checks.length; i++) {
    result.push([config.spalten[checks[i].label], checks[i].options[checks[i].selected]]); 
  } 
  return result;
} 

// Liefert die Prüfungen
exports.getChecks = function () {
    return checks;
}

exports.getWerte = function () {
  return werte;
}

// Speichert den ausgewählten Wert
exports.setChecks = function(index, selected) {
  let ch = checks[index];
  ch.selected = ch.options.indexOf(selected);
}

// Prüft einen Kunden
exports.doCheck = function(kunde) {
  let result = [];

  var hatKind = false;
  var count = 0;
  for (let i = 0; i < kunde.labels.length; i++) {
    if (kunde.labels[i].startsWith("Kind ")) {
      hatKind = true;
      if (kunde.bean[i].length > 0) {
        count++;
        var n = Number(kunde.bean[i].substring(0,4));
        if (!isNaN(n)) {
          if (new Date().getFullYear() - n > 16) {
            result.push("17. Geburtstag - Umstellen auf Erwachsen - Neuen Ausweis erstellen");
          }
        }
      }
    }
  }
  if (hatKind) {
    count = count - Number(kunde.bean[4]);
    if (count != 0) {
      result.push("Kinder: " + (count < 0 ? "Es fehlen Geburtsjahre" : "Es sind mehr Geburtsjahre als Kinder"));
    }
  }

  werte.forEach(objChecks => {
    for (let i = 9; i < kunde.labels.length; i++) {
      if (kunde.labels[i].startsWith(objChecks.label)) {
        if (objChecks.options.indexOf(kunde.bean[i]) < 0) {
          result.push("Der Wert ist nicht konfiguriert: \"" + kunde.labels[i] + "\" = \"" + kunde.bean[i] + "\"");
        }
      }
    }
  });
  if (kunde.visited === false) {
    checks.forEach(check => {
      let ix = kunde.labels.indexOf(check.label);
      let exp = check.options[check.selected];
      let act = kunde.bean[ix];
      if (exp != act) {
          result.push(check.label + ': Erwartet wird "' + exp + 
                        '", der Kunde ist aber "' + act +
                        '"!');
      }
    });
  }
  return result;
}

exports.readPackage = function() {
  try {
    let data = fs.readFileSync("tafeljs/package.json");
    return JSON.parse(data);
  } catch (err) {
    console.error(err);
    return "Err:" + err;
  }      
}

// Liest die Konfiguration aus der Konfigurations-Datei
exports.readConfig = function(filename) {
  try {
    let data = fs.readFileSync(filename);
    config = JSON.parse(data);
    let i = 0;
    Object.keys(config.check).forEach(key => {
      checks.push(new Checks('restr' + i, key, config.check[key]));
      i++;
    });
    Object.keys(config.werte).forEach(key => {
      werte.push(new Checks('restr' + i, key, config.werte[key]));
      i++;
    });
  } catch (err) {
    console.error(err);
    process.exit();
  }      
}
