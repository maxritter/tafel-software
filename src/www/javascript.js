var speicherName = "session";
var displayederror;

function showmessage(message) {
  var displayederror = '<!DOCTYPE html>\n<html><head><meta charset="utf-8">'
             + '<meta name="viewport" content="width=device-width, initial-scale=1.0"></head><body>'
             + message + '</body></html>';
  var myWindow = window.open("", "_self");
  myWindow.document.write(displayederror);
}

function showerror(message) {
  showmessage('<p>FATAL ERROR</p><pre>' + message + '</pre><br><br><a href="PageLoad.html">Neustart</a>');
}

function url(type, obj) {
  var url = "svc/" + type;
  if (obj == undefined)
    return url;
  return url+"?json="+encodeURIComponent(JSON.stringify(obj));
}

function fetchCall(mthd, type, obj, callback) {
  var request = new XMLHttpRequest();
  request.open(mthd, url(type, obj));
  request.addEventListener('load', function(event) {
    if (request.status >= 200 && request.status < 300) {
      var res = request.response;
      var type = request.getResponseHeader('content-type');
      if (type.indexOf('application/json') >= 0) callback(JSON.parse(res));
      else showerror(res);
    } else {
      showerror(request.statusText);
    }
  });
  request.send();
}

/*
 * Zu einem HTML table eine Zeile mit 2 Spalten hinzufügen.
 * Für beide Spalten können Werte übergeben werden, Spalte 2
 * wird zurückgegeben.
 */
function addrow(table, val1, val2) {
  var row = document.getElementById(table).insertRow(-1);

  var cell1 = row.insertCell(0);
  cell1.innerHTML = val1;
  cell1.classList.add("c0");

  var cell2 = row.insertCell(1);
  if (val2 != undefined) cell2.innerHTML = val2;
  cell2.classList.add("c1");
  return cell2;
}

/*
 * Datum in den Kundendaten ist yyyy-mm-tt. Hier
 * wird es für die Ausgabe in dd.mm.yyyy umgewandelt.
 */
function dateToPrint(datestring) {
  if (typeof datestring != 'string') return '';
  if (isDateFormat(datestring)) {
      return  datestring.substring(8, 10) + "." + 
              datestring.substring(5, 7) + "." +
              datestring.substring(0, 4);
  }
  return datestring;
}

/*
 * Prüft, ob das Datum nnnn-nn-nn formatiert ist
*/
function isDateFormat(datestring) {
  return datestring == datestring.match(/[0-9]{4}-[0-9]{2}-[0-9]{2}/);
}

// This function creates one <select> with its <option>s 
function createSelect(id, options, selected) {
  var select = document.createElement("select");
  select.setAttribute("id",id);

  for (var i=0; i < options.length; i++) {
    var option = document.createElement("option");
    select.appendChild(option);
    option.value = options[i];
    if (i == 0 && options[i] == "" && selected != 0) option.text = "löschen"
    else option.text = options[i];
  }

  select.selectedIndex = selected;
  return select;
}

// Seite zum Eingeben eines neuen Kunden öffnen
function neuerKunde() {
  var session = sessionGet();
  session.currentID = {};
  sessionGoto("DI", session);
}

/*
 * Funktionen zum Öffnen eines Dialogs, der mit Ja oder Nein beantwortet werden
 * muss
 */
function openYesNo(question, element, callBackYes, callBackNo) {
  element.parentNode.disabled = true;
  var div = document.createElement("div");
  div.setAttribute("style", "position:absolute;width:100%;max-width:inherit;top:100px;text-align:center;");

  var article = document.createElement("article");
  article.setAttribute("style", "background-color:#f0f0f0;margin:0 auto;display:inline-block;");

  var p = document.createElement("p");
  p.innerHTML=question;
  article.appendChild(p);

  article.appendChild(createInput("Ja", div, callBackYesNo, element, callBackYes));
  article.appendChild(document.createTextNode(' '));
  article.appendChild(createInput("Nein", div, callBackYesNo, element, callBackNo));
  div.appendChild(article);
  document.body.appendChild(div);
}

// Einen Button erzeugen für den Yes/No Dialog
// Mit dem Klicken wird der Dialog (das div) entfernt.
function createInput(value, div, callBack, p1, p2) {
  var input = document.createElement("input");
  input.setAttribute("class", "bmid");
  input.setAttribute("type", "button");
  input.value = value;
  input.addEventListener('click', function() {document.body.removeChild(div);callBack(p1, p2);});
  return input;
}

// Seite enablen und den callback ausführen
function callBackYesNo(element, callBack) {
  element.parentNode.disabled = false;
  if (callBack != undefined) callBack();
}

/*
 * Initialisiert die session, liefert true
 * wenn die session bereits existiert hat.
 * 
 * Die Session wird im Browser gesteuert, der Servber führt
 * keine session und kennt den Status des Client nicht.
 * 
 * Die Statusinformation wird im Session Storage des Browsers
 * abgelegt.
 */
function sessionInit(tafel, logo, zusatz) {
  var result = sessionStorage.getItem(speicherName) != undefined;
  sessionSave(
    {
      pages: {
        LD: "PageLoad.html",
        CH: "PageCheck.html",
        SC: "PageScan.html",
        SR: "PageSearch.html",
        TD: "PageToday.html",
        AB: "PageAbsent.html",
        IA: "PageInactive.html",
        DS: "PageResult.html",
        DC: "PageInput.html",
        DI: "PageInput.html",
        AW: "PageAusweise.html"
      },
      history: [],
      current: 'LD',
      tafel: tafel,
      logo: logo,
      zusatz: zusatz,

      currentID: undefined,
      searchCrit: '',
      weeks: ''
    }
  );
  return result;
}

// Information speichern
function sessionSave(session) {
  sessionStorage.setItem(speicherName, JSON.stringify(session));
}

// Information lesen und zurückgeben
function sessionGet() {
  var s = sessionStorage.getItem(speicherName);
  if (s == undefined) {
    window.open("/", "_self");
    return null;
  }
  return JSON.parse(s);
}

// Eine neue Seite öffnen
function sessionGoto(next, s) {
  var session = (s == undefined) ? sessionGet() : s ;
  if (session.current != next) {
    session.history.push(session.current);
    session.current = next;
  }
  sessionOpen(session);
}

function sessionBase(page) {
  var session = sessionGet();
  if (session == null) return null;
  session.history = [];
  session.current = page;
  if (page != 'SR') session.searchCrit = '';
  if (page != 'AB') session.weeks = '';
  sessionSave(session);
  return session;
}

// Webseite öffnen
function sessionOpen(session) {
  sessionSave(session);
  window.open(session.pages[session.current], "_self");
}

// Zur vorherigen Webseite zurückkehren
function sessionBack(s, cameFrom, goVia) {
  var session = (s == undefined) ? sessionGet() : s ;
  if (session.history[session.history.length -1] == cameFrom) {
    session.current = goVia;
  } else {
    session.current = session.history.pop();
  }
  sessionOpen(session);
}

// Korrekten Verlauf prüfen, das direkte ansteuern einer Seite über
// die URL wird hier verhindert.
function sessionVerify(myself) {
  var session = sessionGet();
  if (session == null) return;
  if (session.current != myself) {
    if (myself == session.history[session.history.length - 1]) {
      session.current = session.history[session.history.length - 1];
      session.history.pop();
      sessionSave(session);
    } else {
      sessionOpen(session);
    }
  }
  return session;
}

function makeNavigation(long) {
  var nav = '<li><a href="PageLoad.html">Startseite</a></li>';
  if (long != false) nav +=
    '<li><a href="PageCheck.html">Prüfungen</a></li>' +
    '<li><a href="PageScan.html">Scannen</a></li>' +
    '<li><a href="PageSearch.html">Suchen</a></li>' +
    '<li><a href="#" onClick="neuerKunde();">Neuer Kunde</a></li>' +
    '<li><a href="PageToday.html">Kunden heute</a></li>' +
    '<li><a href="PageInactive.html">Inaktive Kunden</a></li>' +
    '<li><a href="PageAbsent.html">Länger abwesend</a></li>';
    nav += '<li><a href="PageHelp.html">Info</a></li>';
  document.querySelector("ul").innerHTML = nav;
}
