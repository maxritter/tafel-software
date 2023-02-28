"use strict";

const fs = require("fs");       // Dateizugriffe

var kundenFrom, kundenTo;

kundenFrom = read(process.argv[2]);
kundenTo = {aktiv: {}, inaktiv: {}};
//console.log(kundenFrom);

var kunde;
kundenFrom.forEach(obj => {
    /*kunde = kundenFrom.aktiv[id];
    Object.keys(cfgFrom.spalten).forEach(key => {
        let i = cfgFrom.spalten[key];
        let k = cfgTo.spalten[key];
        neu[k] = kunde[i];
    });
    kundenTo.aktiv[id] = neu;*/
    let neu = [];
    let val = obj.Name;
    let ix = val.lastIndexOf(" ");
    if (ix > 0) {
      val = val.substring(0, ix).trim() + ", " + val.substring(ix + 1).trim();
    }
    neu.push(val);

    val = obj.Straße.trim() + ", " + obj.Ort.trim();
    neu.push(val);
    neu.push(obj.Er1);
    neu.push(obj.Ki1);
    neu.push("A");
    neu.push(obj.Fa);
    val = obj.bis;
    neu.push(val.substring(6) + "-" + val.substring(3,5) + "-" + val.substring(0,2));
    val = obj.besuch;
    if (val == "") neu.push("");
    else neu.push(val.substring(6) + "-" + val.substring(3,5) + "-" + val.substring(0,2));
    neu.push("");
    neu.push("");
    neu.push("");
    neu.push("");
    neu.push("");
    neu.push("");
    neu.push(obj.Anmerkungen);
    neu.push(obj.Bescheid);

    //console.log(neu);
    val = obj["Kunde seit"];
    if (val == "") val = obj.ID;
    else val = val.substring(8,10) + val.substring(3,5) + val.substring(0,2) + "010";
    for (;;) {
      if (kundenTo.aktiv[val] == undefined) break;
      val = (parseInt(val) + 10) + "";
      console.log(val);
    }
    kundenTo.aktiv[val] = neu;
  });
  try {
    fs.writeFileSync(process.argv[3], JSON.stringify(kundenTo, null, ' '));
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
  