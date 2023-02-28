"use strict";

const kunden = require("./kunden.js");
const config = require('./config.js');  // Konfiguration


const html1 = '<!DOCTYPE html>\n' +
                '<html>\n<head><meta charset="utf-8">' +
                '<style>\nth, td { border: 1px solid black;}</style>\n' +
                '<script src="datei.js"></script>\n' +
                '</head>\n' +
                '<body><table><tbody>\n';
const html2 =   '</tbody></table>\n' +
                '<script>window.onLoad = startDatei();</script></body>\n';

// Liefert ein HTML Dokument. Dies enthält eine Tabelle mit allen Kunden
exports.getAllAsTable = function () {

  let result = html1;  // HTML Header
     
  // Headerzeile für die Tabelle
  result += '<tr title="Zum sortieren clicken">';
  getHeadings().forEach(name => {
    result += '<th onClick="sort(this)">' + name + "</th>";
  });
  result += "</tr>\n";
  
  // Alle Kunden anhängen
  kunden.getKundenAsTable().forEach(line => {
    result += "<tr>";
    line.forEach(value => {
      result += "<td>" + makeHtml(value) + "</td>";
    })
    result += "</tr>\n";
  })
  
  result += html2;  // Tabelle und HTML abschließen
  return result;
}

// Text für HTML aufbereiten
function makeHtml(str) {
  if (str == undefined) return '';
  if (typeof str == 'string') return str.replace('>', '&gt;').replace('<', '&lt;');
  return str;
}

// Gibt die Kopzeile zurück
function getHeadings() {
  let header = config.getDateiHeader();
  let spaltenNamen = config.getSpaltenUndIndex()[0];

  let headings = ["ID"];
  if (header == undefined) {
    headings = headings.concat(spaltenNamen);
    headings.splice(3, 0, "PLZ", "Ort");
  } else {
    headings = headings.concat(header);
  }
  headings[spaltenNamen.length + 3] = "A/G";
  return headings;
}
