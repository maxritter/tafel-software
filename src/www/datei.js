'use strict'

var currentCol = -1;
var ascending = true;

// Sortiert eine HTML Tabelle
function sort(th) {
  // In der Headerzeilen den Spaltenindex ermitteln
  var tb = document.querySelector("table");
  var cells = tb.rows[0].cells;
  var index = 0;
  for (; index < cells.length; index++) {
    if (cells[index] === th) break;
  }
  //var t1 = new Date();
  // nun die Zeilen ueber die Spalt e sortieren
  sortTable(tb.rows, index);
  //alert(new Date() - t1);
}

// Sortiert Zeilen aus einer HTML Tabelle
// Es wird angenommen, dass die erste Zeile der Header ist
function sortTable(rows, index) {
  var i1, i2, x, y, rowL = rows.length - 1, parent;
  if (currentCol == index) {
    ascending = !ascending;
  } else {
    currentCol = index;
    ascending = true;
  }
  x = rows[1].cells[index];
  y = rows[2].cells[index];
  parent = rows[1].parentNode;
  for (i1 = 1, i2 = 2; i1 < rowL;) {
    // Zwei aufeinanderfolgende Zeilen vergleichen
    if (ascending ? x.innerHTML > y.innerHTML : x.innerHTML < y.innerHTML) {
      i1--; // Mit dem vorherigen vergleichen
      if (i1 > 0) {
        x = rows[i1].cells[index];
        continue;
      }
    }
    if (i2 - i1 > 1) {
      //console.log(i2);
      parent.insertBefore(rows[i2], rows[i1 + 1]);
      i1 = i2; // Das war der 1., weiter beim 2.
      i2++;
      if (i1 < rowL) {
        x = rows[i1].cells[index];
        y = rows[i2].cells[index];
      }
      continue;
    }
    i1++; // Weiter mit den naechsten
    i2++;
    x = y;
    y = rows[i1 + 1].cells[index];
  }
}

function startDatei() {
  var body = document.querySelector("body");
  var form = document.createElement("form");
  form.addEventListener("submit", searchValue);
  body.insertBefore(form, body.childNodes[0]);
  
  var ip = document.createElement("input");
  form.appendChild(ip);
  ip.type = "Text";
  ip.placeholder = "Suchmuster eingeben";
  ip.focus();

  form.appendChild(document.createTextNode('\u00A0'));;

  ip = document.createElement("input");
  form.appendChild(ip);
  ip.type = "checkbox";
  ip.id = "gk";

  form.appendChild(document.createTextNode("Groß-/Kleinschreibung"));
  form.appendChild(document.createTextNode('\u00A0'));
  
  ip = document.createElement("input");
  form.appendChild(ip);
  ip.type = "submit";
  ip.value = "Angezeigte Zeilen einschränken";
  
  form.appendChild(document.createTextNode('\u00A0'));;

  ip = document.createElement("span");
  form.appendChild(ip);
  ip.id = "message";
}

function searchValue(event) {
  event.preventDefault();
  var pattern = new RegExp(document.querySelector("input").value, document.querySelector("#gk").checked ? "" : "i");
  var rows = document.querySelector("table").rows;
  var counter = 0;
  for (var i = 1; i < rows.length; i++) {
    if (rows[i].innerHTML.search(pattern) >= 0) {
      rows[i].style.display = "";
      counter++;
    } else {
      rows[i].style.display = "none";
    }
  }
  document.querySelector("#message").innerHTML = "Es werden " + counter + " Zeilen angezeigt";
  return false;
}

// Alternative Sortiermethode
function sortTable2(rows, index) {
  var i, j, x, y;
  var rowsL = rows.length;
  var pNode = rows[1].parentNode;
  for (i = 1; i < (rowsL - 1); i++) {
    for (j = i + 1; j < rowsL; j++) {
      x = rows[i].cells[index];
      y = rows[j].cells[index];
      if (x.innerHTML > y.innerHTML) {
        pNode.insertBefore(rows[i], rows[j]);
        pNode.insertBefore(rows[j], rows[i]);
      }
    }
  }
}
