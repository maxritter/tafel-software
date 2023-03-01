"use strict";

const fs = require("fs");        // Dateizugriffe

// Liest Statistikdateien und gibt einen Satz pro Woche zurück
exports.readStatistics = function(path, year) {
  let table = [];
  let result ;
  
  // Dateinamen lesen
	let fileNames = fs.readdirSync(path);
	fileNames.forEach(name => {
		let res = name.match(/[0-9]{4}-[0-9]{2}-[0-9]{2}-statistik.csv/);
		if (res != null) {
      // Es ist eine Statistikdatei
			if (name.startsWith(year)) {
        // Sie ist für das geforderte Jahr
        let data = fs.readFileSync(name).toString();
        let arr = data.match(/[0-9]+/g);
        let week = getWeek(new Date(name.substring(0,10)));
        // console.log(week + " " + name);
        while (week > table.length) {
          table.push(newRow());
        }
        result = table[week-1];
        result[0]++;
        for (let i = 1; i < 7; i++) {
          result[i] += Number(arr[i+2]);
        }
      }
    }
	});
  if (table.length == 0) return null;

  // Die Anzahl der Bezugsberechtigten wird als Mittelwert ermittelt
  for (let i = 0; i < table.length; i++) {
    result = table[i];
    if (result[0] == 0) continue;
    for (let k = 1; k < 4; k++) {
      result[k] = Math.round(result[k] / result[0]);
    }
  }
  // console.log(table);
  
  // Je Woche einen Satz erzeugen
  for (let i = 0; i < table.length; i++) {
    result = table[i];
    if (result[0] != 0) {
      result[0] = toISOweek(year,i + 1);  // Anzahl Tage mit Woche nach ISO überschreiben
    }
  }
  return table;
}

function newRow() {
  return [0, 0, 0, 0, 0, 0, 0];
}

// Liefert die Woche im Jahr
// Der 1. Januar liegt in Woche 1
function getWeek(date) {
  let januar_1 = new Date(date.getFullYear() + "-01-01");
  let dayInYear = (date - januar_1) / 86400000;
  let dayInWeek = [6,0,1,2,3,4,5][januar_1.getDay()];
  return parseInt((dayInYear + dayInWeek) / 7) + 1;
}

// Rechnet die Woche im Jahr auf die Woche nach ISO 8601 um
// Die erste Woche kann 1, 52 oder 53 sein
function toISOweek(year, week) {
  let date = new Date(year + "-01-01");
  if (date.getDay() > 0 && date.getDay() < 5)
    return week; // 1. Januar ist Mo, Di, Mi, Do 
  if (week == 1) {
    if (date.getDay() == 5)
      return 53;
    if (date.getDay() == 6) {
      let py = parseInt(year) - 1; // Vorjahr
      let pyd = new Date(py + "-01-01");
      if (pyd.getDay() == 4)
        return 53;
    }
    return 52;
  }
  return week - 1;
}
