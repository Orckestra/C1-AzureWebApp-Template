var path = require('path');
var Builder = require('systemjs-builder');
var spawn = require('child_process').spawn;
function testPhantom(html) {
  return new Promise(function(resolve, reject) {
    spawn(path.resolve('node_modules/.bin/mocha-phantomjs' + (process.platform.match(/^win/) ? '.cmd' : '')), [html], { stdio: 'inherit' })
    .on('close', function(code) {
      if (code !== 0)
        reject(Error('Phantom test failed ' + html + ' failed.'));
      else
        resolve();
    });
  });
}

describe('SVG Plugin', function(){
  it('should bundle svg inline using builder', function(){
    var builder = new Builder('.', 'test/config-svg.js');
    // Directly bundling a resource with ! doesn't work so bundle-def is a wrapper
    return builder.bundle('./test/bundle-def.js', 'test/bundle.js');
  });
  testPhantom('test/test-bundle.html');
  testPhantom('test/test-browser.html');
});


