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

  // Die Anzahl der Abholer wird als Mittelwert ermittelt
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
      result[0] = i + 1;  // Anzahl Tage mit Woche überschreiben
    }
  }
  return table;
}

function newRow() {
  return [0, 0, 0, 0, 0, 0, 0];
}

function getWeek(date) {
  let onejan = new Date(date.getFullYear(), 0, 1);
  return Math.ceil( (((date - onejan) / 86400000) + onejan.getDay() + 1) / 7 );
}
