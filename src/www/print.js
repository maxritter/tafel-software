'use strict'

function getPrintHTML(tafel, image, zusatz, kunde) {
  var html = 
    '<div class="d2"><span class="fonts">' + tafel.replace(/\n/g, '<br>') + '</span></div>' +
    '<div class="d11">' +
      '<img src="' + image + '">' +
      '<svg width="38" height="38" style="float: right; margin: 0;">' +
        '<circle cx="19" cy="19" r="15" stroke="black" stroke-width="3" fill="' + kunde[6] + '"/>' +
      '</svg>' +
      '<div class="d3">';
  var s1 = kunde[1];
  if (typeof s1 != 'string') s1 = "-";
  var s2 = '-';
  var ix = s1.indexOf(',');
  if (ix > 0) {
    s2 = s1.substring(ix + 1).trim();
    s1 = s1.substring(0, ix);
  }
  html += '<span class="fontl">' + s1 + '</span><br>' + 
            '<span class="fontm">' + s2 + '<br>';
  /* s1 = kunde[2];
  if (typeof s1 != 'string') s1 = "-";
  s2 = '-';
  ix = s1.indexOf(',');
  if (ix > 0) {
    s2 = s1.substring(ix + 1).trim();
    s1 = s1.substring(0, ix);
  }
  html += s1 + '<br>' + s2 + '</span>'; */
  html += '</div>';
  html += '<svg id="ID' + kunde[0] + '"></svg>' +
          '<div class="d31">';
  if (typeof zusatz == "string") html += zusatz;
  html += '</div><div class="d4">' +
            '<span class="fontl">' + kunde[3] + '</span><span class="fonts"> Erw. </span>';
  html +=   '<span class="fontl">' + kunde[4] + '</span><span class="fonts"> Kinder </span>';
  html +=   '<span class="fontl">' + kunde[5] + '</span></div>';
  html += '</div>';

  return html;
}
