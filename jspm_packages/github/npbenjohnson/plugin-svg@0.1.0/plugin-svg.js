
exports.translate = function(load) {
  var loader = 'function() {\nvar doc; \ntry{\ndoc = (new DOMParser().parseFromString( ' + JSON.stringify(load.source) + ', "image/svg+xml"));\n} \ncatch (ex) { \ndoc = undefined; \n} \nif(!doc || !doc.documentElement || doc.getElementsByTagName("parsererror").length){ \nconsole.warn("Error Loading Svg: ' + load.name.split('!')[0] + '"); \nreturn;\n} \nreturn doc.documentElement;\n}';
  if (System.transpiler === false) {
    load.metadata.format = 'amd';
    var script = 'define(' + loader + ');';
  }
  
  load.metadata.format = 'esm';
  return 'export default (' + loader + ')();';
}