"use strict";

const st = require("./statistic.js");
const Excel = require("exceljs");

const border = {
  top: {style:'thin'},
  left: {style:'thin'},
  bottom: {style:'thin'},
  right: {style:'thin'}
};

// Gibt eine Promise zurück
exports.makeXLSX = function(path, kuerzel) {
  try {
    let today = new Date();

    let year = today.toISOString().substring(0, 4);
    let table = st.readStatistics(path, year);
    if (table == null) return null;

    return schreibe(table, path, kuerzel, year);
  } catch (err) {
    console.error("ERR:" + err.message);
  }
}

function schreibe(table, path, kuerzel, year) {
  // table enthält die Werte für das Excel
  let tafel, f7tag, f7formula;
  if (Array.isArray(kuerzel)) {
    tafel = kuerzel[0];
    f7tag = kuerzel[1];
    f7formula = kuerzel[2];
  } else {
    tafel = kuerzel;
    f7tag = "Anzahl der Ausgabewochen";
    f7formula = "COUNTA(A9:A62)";
  }

  // Workbook mit einem Sheet anlegen
  let workbook = new Excel.Workbook();
  workbook.creator = 'Tafel Software';
  workbook.created = new Date();
  workbook.properties.date1904 = true;

  // Force workbook calculation on load
  workbook.calcProperties.fullCalcOnLoad = true;

  // Sheet mit A4 Größe anlegen
  let sheet = workbook.addWorksheet(tafel + ' ' + year, {
                pageSetup:{paperSize: 9}
              });
  
  // Sheet füllen
  addTitel(sheet, tafel, year);
  addHeader(sheet, f7tag);

  // Data einfügen
  addData(sheet, table);

  // Formeln einfügen
  addFormula(sheet, f7formula);

  // Formatieren  
  format(sheet);

  // Rausschreiben
  return workbook.xlsx.writeFile(year + "-summen.xlsx")
    .then(function() {
    })
    .catch(err => {
      console.log(err);
    });
}

// Titel einfügen
function addTitel(sheet, tafel, year) {
  sheet.addRow([]);
  sheet.addRow(["Kundenstatistik " + year]);
  sheet.addRow(["Tafel: " + tafel]);
}

// Überschriften einfügen
function addHeader(sheet, f7tag) {
  sheet.addRow(["Woche", 
     "Bezugsberechtigte Ausweise", "Bezugsberechtigte Erwachsene", "Bezugsberechtigte Kinder",
     "Bezugsberechtigte Personen Gesamt",
     "",
     "Abholer", "Versorgte Erwachsene", "Versorgte Kinder",
     "Versorgte Personen Gesamt"]);
  sheet.addRow(["Summe"]);
  sheet.addRow(["Mittelwert"]);
  sheet.addRow([f7tag]);
  sheet.addRow([]);
 
  return sheet;
}

// Daten einfügen
function addData(sheet, table) {
  table.forEach( week => {
    if (week[0] != 0) {
      // Woche anpassen
      week[0] = "KW " + week[0];
      
      // Eine leere Spalte einfügen
      week.splice(4, 0, "", "");
      sheet.addRow(week);
    }
  });
}

// Formel hinzufügen
function addFormula(sheet, f7formula) {
  let lastDataRow = sheet.rowCount;
  
  // Zellen mit Summen für die Gesamtpersonenzahl einfügen
  for (let rn = 9; rn <= lastDataRow; rn++) {
    sheet.getCell('E' + rn).value = { formula: 'C' + rn + '+D' + rn };
    sheet.getCell('J' + rn).value = { formula: 'H' + rn + '+I' + rn };
  }
  
  // Summenzeile
  ['G', 'H', 'I', 'J'].forEach( c => {
    let fx = 'SUM(' + c + '9:' + c + lastDataRow + ')';
    let cell = sheet.getCell(c + '5');
    cell.value = { formula: fx };
    cell.numFmt = '#,##0'
  });

  // Mittelwertzeile
  ['B', 'C', 'D', 'E', 'G', 'H', 'I', 'J'].forEach( c => {
	  // Mittelwert
    let fx = 'AVERAGE(' + c + '9:' + c + lastDataRow + ')';
    let cell = sheet.getCell(c + '6');
    cell.value = { formula: fx };
    // Anzeige ohne Nachkommastellen
    cell.numFmt = '0';
  });

  // Anzahl Wochen
  sheet.getCell("F7").value = { formula: f7formula };
 
}

// Zellen formatieren
function format(sheet) {
  // Header in Zeile 2 und 3 mit großem Font und fett
  let row = sheet.getRow(2);
  row.font = { bold: true, size: 14 };
  row = sheet.getRow(3);
  row.font = { bold: true, size: 14 };
  
  // Überschriften in Zeile 4 fett
  row = sheet.getRow(4);
  row.font = { bold: true };
  
  // Zeile 4 höher
  row.height = 130;

  // Text mit den Überschriften in Zeile 4 drehen und zentrieren
  let cellF = { wrapText: true, textRotation: 90, horizontal: 'center', vertical: 'middle' };
  ['A4', 'B4', 'C4', 'D4', 'E4', 'F4', 'G4', 'H4', 'I4', 'J4'].forEach( c => {
    sheet.getCell(c).alignment = cellF;
  });
  
  // Breite der Spalten festlegen, Spalte 1 ist breiter
  sheet.getColumn(1).width = 15.5;
  for (let i = 2; i < 8; i++) sheet.getColumn(i).width = 7;

  // Letzte Zeile ist höher und Text inSpalte 1 umbrechen
  sheet.getRow(7).height = 25;
  sheet.getCell("A7").alignment = { wrapText: true };

  // Ränder für alle Zeilen ab 4 definieren
  for (let rn = 4; rn <= sheet.rowCount; rn++) {
    ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'].forEach( c => {
      sheet.getCell(c + rn).border = border;
    })
  };
}
