// Detail zum Kunden in neuem Fenster anzeigen
function showKunde(link) {
  var session = sessionGet();
  session.currentID = {id: link.key, aktiv: link.aktiv};
  sessionSave(session);
  sessionGoto("DS");
  return false;
}

// Einen HTML Link hinzufügen
function addLink(link, element) {
  var a = document.createElement("a");
  var linkText = document.createTextNode(link.value);
  a.appendChild(linkText);
  a.href = "#";
  element.appendChild(a);
  if (link.key != link.value) {
    element.appendChild(document.createElement("BR"));
    a.title = "ID=" + link.key;
  }
  if (link.visited) a.classList.add('atoday');
  else if (link.expired) a.classList.add('aexpired');
  return a;
}

// Die Liste der Links erzeugen
function createLinks(fs, legend, obj, action) {
  var lg = document.createElement("legend");
  lg.innerHTML = legend;

  fs.innerHTML = "";
  fs.appendChild(lg);
  obj.forEach(function(link) {
    addLink(link, fs).addEventListener("click", function() { return action(link, this);}, true);
  });
}