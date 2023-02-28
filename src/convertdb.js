"use strict";

const fs = require("fs");       // Dateizugriffe

var cfgFrom, cfgTo, kundenFrom, kundenTo;

cfgFrom = read(process.argv[2]);
cfgTo = read(process.argv[3]);
kundenFrom = read(process.argv[4]);
kundenTo = {aktiv: {}, inaktiv: {}};
//console.log(kundenFrom);

var kunde;
Object.keys(kundenFrom.aktiv).forEach(id => {
    kunde = kundenFrom.aktiv[id];
    let neu = [];
    Object.keys(cfgFrom.spalten).forEach(key => {
        let i = cfgFrom.spalten[key];
        let k = cfgTo.spalten[key];
        neu[k] = kunde[i];
    });
    kundenTo.aktiv[id] = neu;
    //console.log(neu);
  });
  try {
    fs.writeFileSync(process.argv[5], JSON.stringify(kundenTo, null, ' '));
  } catch (err) {
    console.error(err);
    return "Fehler beim Schreiben der Kundendatei";
  }


function read(filename) {
    try {
      let data = fs.readFileSync(filename);
      return JSON.parse(data);
    } catch (err) {
      console.error(err);
      process.exit();
    }      
  }
  