"use strict";

const fs = require("fs");        // Dateizugriffe
const os = require("os");
const st = require("./statistic.js");

// Liest Statistikdateien und schreibt die Summe
function schreibeSumme(path, year, SEP) {
  let table = st.readStatistics(path, year);
  if (table == null) return false;
  let sum = getSum(table);
  let avg = getAvg(sum);
  
  // Je Woche einen Satz erzeugen
  let csv = '';
  for (let i = 0; i < table.length; i++) {
    let result = table[i];
    if (result[0] != 0) {
      csv += result[0];
      for (let k = 1; k < 7; k++) {
        csv += SEP + result[k];
      }
      csv += os.EOL;
    }
  }
  csv += os.EOL;

  // Summensatz erzeugen
  csv += SEP + SEP + SEP + SEP + sum[4] + SEP + sum[5] + SEP + sum[6]; 
  csv += os.EOL;

  // Mittelwerte erzeugen
  csv += SEP + avg[1] + SEP + avg[2] + SEP + avg[3] + SEP + avg[4] + SEP + avg[5] + SEP + avg[6];
  csv += os.EOL;
  
  // Datei schreiben
  let fn = year + "-summen.csv";
  try {
    fs.writeFileSync(fn, csv);
  } catch (err) {
    console.error(err);
    console.log("Fehler beim Schreiben der Statistikdatei " + fn);
  }
  return true;
}

function getSum(table) {
  // Je Woche einen Satz erzeugen
  let sum  = [0, 0, 0, 0, 0, 0, 0];
  for (let i = 0; i < table.length; i++) {
    let result = table[i];
    if (result[0] != 0) {
      sum[0]++;
      for (let k = 1; k < 7; k++) {
        sum[k] += result[k];
      }
      result[0] = i + 1;  // Anzahl Tage mit Woche überschreiben
    }
  }
  return sum;
}

function getAvg(sum) {
  let avg = [0, 0, 0, 0, 0, 0, 0];
  // Mittelwerte erzeugen
  for (let k = 1; k < 7; k++) {
    avg[k] = Math.round(sum[k] / sum[0]);
  }
  return avg;
}

exports.statisticCSV = function(SEP) {
  let today = new Date();

  let year = today.toISOString().substring(0, 4);
  if (schreibeSumme(".", year, SEP)) return;

  year = (Number(year) - 1) + "";
  schreibeSumme(".", year, SEP);
}

exports.createStatisticsFolder = (folderPath) => {
  try {
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath);
      console.log(`Der Ordner '${folderPath}' wurde erstellt.`);
    } else {
      console.log(`Der Ordner '${folderPath}' wurde gefunden.`);
    }
  } catch (err) {
    console.error(`Error: ${err.message}`);
  }
}

