/*
 * Hier liegen alle Methoden zum Zugriff auf
 * die Kundendaten
 */
"use strict";

const fs = require("fs");        // Dateizugriffe
const os = require("os");

var kundenDB = null;             // Die Datenbank enthält alle Daten
var besucheHeute = {};                // Die Besucher heute
var besucheHeuteDate = today();
var spaltenNamen, spaltenIndex;

// Spalten 
var ColGueltig, ColBesuch, ColName, ColErwachsene, ColKinder, ColAB, ColFarbe;

setInterval( () => {
  if (besucheHeuteDate == today()) return;
  besucheHeuteDate = today();
  besucheHeute = {};
  }, 60000);

// Liefert true wenn die Datenbank bereit ist
exports.isDatenbankReady = function() {
    return kundenDB != null;
}

// Stellt die Informationen für einen HTML Link bereit
class Link {
  constructor(key, value, aktiv) {
    this.key = key;
    this.value = value;
    this.aktiv = aktiv;
    this.visited = besucheHeute[key] != undefined;
    this.expired = false;
    let g = kundenDB.aktiv[key];
    if (g != undefined) {
      let d = g[ColGueltig];
      if (d == undefined) d = '';
      else if (typeof d == 'string') d = d.trim();
      if (!isDateFormat(d) || d < today())
        this.expired = true;
    }
  }
}

// Lesen der Kundendaten aus einer Datei
exports.readDatenbank = function(dateiname, spaltenNamenUndIndex) {
  spaltenNamen = spaltenNamenUndIndex[0];
  spaltenIndex = spaltenNamenUndIndex[1];
  ColName = spaltenIndex[0];
  ColErwachsene = spaltenIndex[2];
  ColKinder = spaltenIndex[3];
  ColAB = spaltenIndex[4];
  ColFarbe = spaltenIndex[5];
  ColGueltig = spaltenIndex[6];
  ColBesuch = spaltenIndex[7];
  kundenDB = null;
  besucheHeute = {};
  let data;
  try {
    data = fs.readFileSync(dateiname);
  } catch (err) {
    return 'Datei nicht vorhanden';
  }
  try {
    kundenDB = JSON.parse(data);
  } catch (err) {
    console.error(err);
    return 'Ungültiges Format';
  }

  if (kundenDB.changed == undefined) kundenDB.changed = [];
  let date = today();
  Object.keys(kundenDB.aktiv).forEach(key => {
    let cust = kundenDB.aktiv[key];
    if (date == cust[ColBesuch])
      besucheHeute[key] = true;
  });
  return null;
}

// Schreibt die Datenbank in die Datei zurück
exports.writeDatenbank = function(dateiname) {
  try {
    fs.writeFileSync(dateiname, JSON.stringify(kundenDB, null, ' '));
  } catch (err) {
    console.error(err);
    return "Fehler beim Schreiben der Kundendatei";
  }
}

exports.resetChanged = function() {
  kundenDB.changed = [];
}

// Liefert Tabell mit allen Kunden
exports.getKundenAsTable = function() {
  let table = [];
  getAsTable(kundenDB.aktiv, table);
  let lastAktive = table.length;
  getAsTable(kundenDB.inaktiv, table);
  for(let ix = 0; ix < table.length; ix++) {
    table[ix].push(ix < lastAktive ? "A" : "G");
  }
  return table;
}

function getAsTable(hashMap, result) {
  // Alle Kunden anhängen
  Object.keys(hashMap).forEach(id => {
    result.push(splitAdresse(prepareValues(id, hashMap[id])));
  });
}

// Ersetzt die Adresse im Array durch Straße, PLZ und Ort
function splitAdresse(arr) {
  let s = arr[2];
  let v1 = "", v2 = "", v3 = "";
  if (typeof s == 'string') {
    let ix = s.indexOf(',');
    if (ix >= 0) {
      v1 = s.substring(0, ix).trim(); // Straße
      v3 = s.substring(ix + 1).trim();  // Ort oder PLZ Ort
      if (v3.search(/[0-9]{5}/) == 0) {
        v2 = v3.substring(0, 5); // PLZ 
        v3 = v3.substring(5).trim();  // Nur der Ort
      }
    } else {
      v1 = s; // Keine PLZ und kein Ort
    }
  }
  arr.splice(2, 1, v1, v2, v3);
  return arr;
}

// Liefert einen Kunden
exports.getKunde = function(id) {
  let kunde = kundenDB.aktiv[id];
  if (kunde == undefined) return {message: id};
  let result = {visited: besucheHeute[id] != undefined, message: ''};
  if (result.visited) result.message = "Ein Kundenbesuch wurde heute bereits registriert!";
  else {
    if (typeof kunde[ColGueltig] != 'string') {
      result.message = "Kein Gültig bis eingetragen!";
    } else {
      kunde[ColGueltig] = kunde[ColGueltig].trim();
      if (!isDateFormat(kunde[ColGueltig])) {
        result.message = "Bitte beachten: " + kunde[ColGueltig] + "!";
      } else {
        if (kunde[ColGueltig] < today()) {
          result.message = "Die Berechtigung ist abgelaufen!";
          result.dateInvalid = true;
        } else {
          let days = (new Date(kunde[ColGueltig]) - new Date(today()))/ 86400000;
          if (days < 21) {
            let text;
            if (days == 0) text = "heute";
            else if (days == 1) text = "morgen";
            else text = "in " + days + " Tagen";
            result.message = "Die Berechtiging läuft " + text + " ab!";
            result.dateWarn = true;
          }
        }
      }
    }
  }
  result.labels = ["ID"].concat(spaltenNamen);
  result.bean = prepareValues(id, kunde);
  return result;
}

// Liefert einen neuen Kuden
exports.getKundeNeu = function(kunde, cnf) {
  let result = {visited: false, message: '', labels: ["ID"].concat(spaltenNamen)};
  result.bean = [ '' ].concat(kunde);
  for (;result.bean.length <= spaltenNamen.length;) result.bean.push("");

  let ab = {};
  Object.keys(kundenDB.aktiv).forEach(id => {
    let kunde = kundenDB.aktiv[id];
    let v = kunde[ColAB];
    let f = kunde[ColFarbe];
    if (typeof v == 'string' && typeof f == 'string')  {
      let key = v + " " + f;
      if (ab[key] == undefined) ab[key] = 1;
      else ab[key]++;
    }
  });
  result.bean[0] = newId(cnf);
  result.abUndFarbe = ab;
  return result;
}

// Liefert eine neue ID im Format jjmmddnn0 (Jahr Monat Tag Nummer)
// Wenn für den aktuellen Tag keine ID frei ist, dann wird es mit dem
// nächsten Tag versucht
function newId(cnf) {
  return newIdInt(new Date().getTime(), cnf);
}
function newIdInt(ms, cnf) {
  let ids = [];
  let date = todayCompact(cnf.vollesjahr, ms);
  Object.keys(kundenDB.aktiv).forEach(id => {
    if (id.startsWith(date)) ids.push(id);
  })
  Object.keys(kundenDB.inaktiv).forEach(id => {
    if (id.startsWith(date)) ids.push(id);
  })
  if (ids.length == 0) {
    date = date + ["1", "01", "001", "0001"][cnf.tag - 1];
    if (cnf.unternummer) date = date + "0";
    return date;
  }
  ids = ids.sort();
  let maxid = ids[ids.length -1];
  if (cnf.unternummer) maxid = maxid.substring(0, maxid.length - 1);
  //console.log(maxid);
  let newid = parseInt("1" + maxid);
  newid++;
  newid = ("" + newid).substring(1);
  if (cnf.unternummer) newid = newid + "0";
  if (newid.startsWith(date)) return newid;
  return newIdInt(ms + 86400000, cnf); // Einen Tag weiterschalten
}
function todayCompact(longyear, ms) {
  let date = new Date(ms).toISOString();
  return date.substring((longyear ? 0 : 2) , 4) + date.substring(5,7) + date.substring(8,10);
}

// Liefert einen inaktiven Kunden
exports.getKundeInaktiv = function(id) {
  let kunde = kundenDB.inaktiv[id];
  if (kunde == undefined) return {message: id};
  let result = {visited: false, inaktiv: true};
  result.labels = ["ID"].concat(spaltenNamen);
  result.bean = prepareValues(id, kunde);
  return result;
}

// Ändert einen Kunden
exports.change = function(id, bean) {
  if (id == undefined || id != bean[0]) {
    // Neuanlage oder Ändeung der ID
    if (kundenDB.aktiv[bean[0]] != undefined)
      return "Die ID " + bean[0] + " existiert bereits!";
    if (kundenDB.inaktiv[bean[0]] != undefined)
      return "Die ID " + bean[0] + " existiert bereits und ist gelöscht!";
  }
  let kunde = [];
  for (let i = 0; i < spaltenIndex.length; i++) {
    let v = bean[i + 1];
    if (v == undefined) v = '';
    kunde[spaltenIndex[i]] = v;
  }

  determineChanges(bean[0], id, kunde);
  if (id != undefined) {
    delete kundenDB.aktiv[id];
    delete kundenDB.inaktiv[id];
  }
  kundenDB.aktiv[bean[0]] = kunde;

  if (today() == kunde[ColBesuch]) besucheHeute[bean[0]] = true;
  else delete besucheHeute[bean[0]];
  return null;
}

// Die Änderungen ermitteln und bei Neuerfassung oder
// geänderten Attributen für den Druck die ID in die
// Liste der Änderungen aufnehmen
function determineChanges(idNew, idOld, kundeNew) {
  if (idOld == undefined) {
    // Neuer Eintrage - als geändert vermerken
    addChanged(idNew);
    return;
  }
  if (idOld != idNew) {
    // Alte ID entfernen wenn als geändert vermerkt
    removeChanged(idOld);
    // Neue als geändert hinzufügen
    addChanged(idNew);
  }
  let kundeOld = kundenDB.aktiv[idOld];
  if (kundeOld == undefined) kundeOld = kundenDB.inaktiv[idOld];
  
  if (kundeOld == undefined) {
    // sollte nicht sein - als geändert vermerken
    addChanged(idNew);
    return;
  }
  if (kundeNew[ColName] == kundeOld[ColName] &&
      kundeNew[ColErwachsene] == kundeOld[ColErwachsene] &&
      kundeNew[ColKinder] == kundeOld[ColKinder] &&
      kundeNew[ColAB] == kundeOld[ColAB] &&
      kundeNew[ColFarbe] == kundeOld[ColFarbe]) {
    // sind gleich
    return;
  }
  addChanged(idNew);
}

// ID als Änderung aufnehmen sofern nicht bereits enthalten
function addChanged(id) {
  let ix = kundenDB.changed.indexOf(id);
  if (ix < 0) kundenDB.changed.push(id);
}

// ID aus Änderungen entfernen
function removeChanged(id) {
  let ix = kundenDB.changed.indexOf(id);
  if (ix >= 0) kundenDB.changed.splice(ix, 1);
}

// Einen Kunden löschen
exports.delete = function(id) {
  removeChanged(id);
  let kunde = kundenDB.aktiv[id];
  if (kunde == undefined) {
    delete kundenDB.inaktiv[id];
  } else {
    kundenDB.inaktiv[id] = kunde;
    delete kundenDB.aktiv[id];
    delete besucheHeute[id];
  }
  return null;
}

// Setzt das Datum für den letzten Besuch auf heute
exports.setVisited = function(id, log, SEP) {
  let kunde = kundenDB.aktiv[id];
  if (kunde == undefined) return {message: "Unbekannte ID: " + id};
  kunde[ColBesuch] = today();
  besucheHeute[id] = true;
  if (log.file == undefined || log.file == "") return;
  try {
    let data = '"' + new Date().toLocaleString() + '"';
    let value;
    log.columns.forEach(column => {
      if (column == "ID") value = id;
      else value = kunde[column];
      if (value == undefined) value = '';
      if (typeof value === 'number' || value.match(/[0-9]+/)) data += SEP + value;
      else {
        value = value.replace(/"/g, '""');
        value = value.replace(/\n/g, '\\n');
        data += SEP + '"' + value + '"';
      }
    });
    data += os.EOL;
    fs.appendFileSync(log.file, data);
    return null;
  } catch (err) {
    console.error(err);
    return "Fehler beim Schreiben der Logdatei";
  }
}

// Setzt neues Gültig bis
exports.setNewDate = function(id, date) {
  let kunde = kundenDB.aktiv[id];
  if (kunde == undefined) return "ID existiert nicht mehr: " + id;
  kunde[ColGueltig] = new Date(date).toISOString().substring(0, 10);
  return null;
}

// Liefert alle IDs
exports.getIds = function() {
  return macheLinks(Object.keys(kundenDB.aktiv), false);
}

// Liefert alle IDs
exports.getIdsChanged = function() {
  return macheLinks(kundenDB.changed, false);
}

// Erzeugt die Links aus einer List von IDs
function macheLinks(liste, mitName) {
  let result = [];
  let name;
  liste.forEach(key => {
    if (mitName) name = kundenDB.aktiv[key][ColName];
    else name = key;
    result.push(new Link(key, name, true));
  });
  return sortLinks(result);
}

// Liefer Links für die gelöschten Kunden
function getInaktive() {
  let result = [];
  let name;
  Object.keys(kundenDB.inaktiv).forEach(key => {
    name = kundenDB.inaktiv[key][ColName];
    result.push(new Link(key, name, false));
  });
  return sortLinks(result);
}

// Liefer Links für Kunden die länger nicht in der Tafel waren
function getAbsent(weeks) {
  let result = [];
  let name;
  Object.keys(kundenDB.aktiv).forEach(key => {
    let absent = false;
    let d = kundenDB.aktiv[key][ColBesuch];
    if (d == undefined) d = '';
    else if (typeof d == 'string') d = d.trim();
    if (!isDateFormat(d)) {
      absent = true;
    } else {
      let days = (new Date(today()) - new Date(d))/ 86400000;
      if (days > weeks * 7) {
        absent = true;
      }
    }
    if (absent) {
      name = kundenDB.aktiv[key][ColName];
      result.push(new Link(key, name, true));
    }
  });
  return sortLinks(result);
}

// Liefert die Links für die Besucher heute, die gelöschten oder einen Buchstaben
exports.getName = function(letter, option) {
  if (letter == 'scanned') return macheLinks(Object.keys(besucheHeute), true);
  if (letter == "Inaktiv") return getInaktive();
  if (letter == "Absent") return getAbsent(option);

  var include = includeLetter;
  if (letter == 'rest') include = includeRest;
  else if (letter == 'name') include = function() { return true };
  let result = [];
  Object.keys(kundenDB.aktiv).forEach(key => {
    let name = kundenDB.aktiv[key][ColName];
    if (name == null) name = ' ';
    if (include(name.substring(0, 1).toUpperCase(), letter))
      result.push(new Link(key, name, true));
  });
  return sortLinks(result);
}

// Liefert die Links für die aktuelle erwarteten Kunden
exports.getNameFor = function(checks) {
  let result = [];
  Object.keys(kundenDB.aktiv).forEach(key => {
    let kunde = kundenDB.aktiv[key];
    if (includeCheck(kunde, checks)) {
      let name = kunde[ColName];
      result.push(new Link(key, name, true));
    }
  });
  return sortLinks(result);
}

// Sortiert die Links nach dem Wert
function sortLinks(array) {
  array.sort( (a, b) => {
    if (a.value > b.value) return 1;
    if (a.value < b.value) return -1;
    return 0;
  });
  return array;
}

function includeCheck(kunde, checks) {
  for (let i = 0; i < checks.length; i++) {
    if (kunde[checks[i][0]] != checks[i][1])
      return false;
  }
  return true;
} 

function includeLetter(chara, letter) {
  if (chara == letter) return true;
  if (letter == 'A' && chara == 'Ä') return true;
  if (letter == 'O' && chara == 'Ö') return true;
  if (letter == 'U' && chara == 'Ü') return true;
  return false;
}

function includeRest(chara) {
  return !'AÄBCDEFGHIJKLMNOÖPQRSTUÜVWXYZ'.includes(chara);
}

// Kopiert die Werte und bereitet sie auf
function prepareValues(id, inarray) {
  var array = [id];
  for (let i = 0; i < spaltenIndex.length; i++) {
    let index = spaltenIndex[i];
    if (inarray[index] == undefined) array.push("");
    else  array.push(inarray[index]);
  }
  return array;
}

// Liefert die Statistik für den letzten Öffnungstag
exports.statistik = function(schreibeFile, SEP) {
  let ids = Object.keys(kundenDB.aktiv);
  let datum = "0000-00-00";
  let besucher = 0, besucherE = 0, besucherK = 0, erwachsene = 0, kinder = 0;
  ids.forEach(id => {
    let kunde = kundenDB.aktiv[id];
    let letzterbesuch = kunde[ColBesuch];
    let e = parseInt(kunde[ColErwachsene]);
    if (isNaN(e)) e = 1;
    erwachsene += e;
    let k = parseInt(kunde[ColKinder]);
    if (isNaN(k)) k = 0;
    kinder += k;
    if (letzterbesuch == datum) {
      besucher++;
      besucherE += e;
      besucherK += k;
    } else if (letzterbesuch > datum) {
      if (isDateFormat(letzterbesuch)) {
        besucher = 1;
        datum = letzterbesuch;
        besucherE = e;
        besucherK = k;
      }
    }
  });
  if (schreibeFile === true) {
    let csv = '"' + datum + '"' + SEP +
              ids.length + SEP + erwachsene + SEP + kinder + SEP +
              besucher + SEP + besucherE + SEP + besucherK + os.EOL;
    let fn = datum + "-statistik.csv";
    try {
      fs.writeFileSync(fn, csv);
    } catch (err) {
      console.error(err);
      console.log("Fehler beim Schreiben der Statistikdatei " + fn);
    }
    return null;
  }
  return { datum: datum,
            berechtigte: ids.length, erwachsene: erwachsene, kinder: kinder,
            besucher: besucher, besucherE: besucherE, besucherK: besucherK};
}

function isDateFormat(datestring) {
  return datestring == datestring.match(/[0-9]{4}-[0-9]{2}-[0-9]{2}/);
}

function today() {
  return new Date().toISOString().substring(0, 10);
}
