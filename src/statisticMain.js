async function run() {
  let promise = require('./statisticXLSX.js').makeXLSX(".", "Fürstenfeldbruck");
  if (promise != null) await promise;
}

run();