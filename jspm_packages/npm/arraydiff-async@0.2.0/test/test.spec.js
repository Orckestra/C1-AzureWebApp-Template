
  var InsertDiff, MoveDiff, RemoveDiff, applyDiff, arrayDiff, expect, insert, move, randomArray, randomWhole, remove, testDiff;


  expect = require('unexpected').clone();
  const originalArrayDiff = require('arraydiff');

  arrayDiff = require('../index');

  InsertDiff = arrayDiff.InsertDiff, RemoveDiff = arrayDiff.RemoveDiff, MoveDiff = arrayDiff.MoveDiff;

  insert = function(array, index, values) {
    return array.splice.apply(array, [index, 0].concat(values));
  };

  remove = function(array, index, howMany) {
    return array.splice(index, howMany);
  };

  move = function(array, from, to, howMany) {
    var values;
    values = remove(array, from, howMany);
    return insert(array, to, values);
  };

  applyDiff = function(before, diff) {
    var item, out, _i, _len;
    out = before.slice();
    for (_i = 0, _len = diff.length; _i < _len; _i++) {
      item = diff[_i];
      if (item instanceof arrayDiff.InsertDiff || item instanceof originalArrayDiff.InsertDiff) {
        insert(out, item.index, item.values);
      } else if (item instanceof RemoveDiff || item instanceof originalArrayDiff.RemoveDiff) {
        remove(out, item.index, item.howMany);
      } else if (item instanceof MoveDiff || item instanceof originalArrayDiff.MoveDiff) {
        move(out, item.from, item.to, item.howMany);
      }
    }
    return out;
  };

  randomWhole = function(max) {
    return Math.floor(Math.random() * (max + 1));
  };

  randomArray = function(maxLength, maxValues) {
    var i;
    if (maxLength == null) {
      maxLength = 20;
    }
    if (maxValues == null) {
      maxValues = maxLength;
    }
    i = randomWhole(maxLength);
    return ((function() {
      var _results;
      _results = [];
      while (i--) {
        _results.push(randomWhole(maxValues));
      }
      return _results;
    })());
  };

  testDiff = function(before, after, equalFn) {
    var called = 0;
    return expect.promise(function (resolve, reject) {
      arrayDiff(before, after, equalFn, function (result) {
        called += 1;
        setTimeout(function () {

          if (called !== 1) {
            return reject('Callback called more than once');
          }
          resolve(result);
        }, 10);
      });
    }).then(diff => {

      var expected = applyDiff(before, diff);
          expect(expected, 'to equal', after);
    });
  };

  const arrayDiffPromise = function (before, after, equalFn) {
    return expect.promise((resolve, reject) =>  {
      arrayDiff(before, after, equalFn, diff => resolve(diff));
    });
  };

  expect.addAssertion('<array> to match diffs against <array>', (expect, subject, value) => {

    expect.errorMode = 'bubble';
    return arrayDiffPromise(subject, value).then(diff => {
      const diffFromOriginalVersion = originalArrayDiff(subject, value);
      expect(diff, 'to satisfy', diffFromOriginalVersion);
    });
  });


  describe('arrayDiff', function() {

    it('returns an empty diff for an identical array', () => {

      return arrayDiffPromise([ 1, 2, 3 ], [ 1, 2, 3], (a, b, indexA, indexB, callback) => callback(a === b))
        .then(diff => {
          expect(diff, 'to equal', []);
        });
    });

    it('returns a single insert for an item on the end', () => {

      return arrayDiffPromise([ 1, 2 ], [ 1, 2, 3], (a, b, indexA, indexB, callback) => callback(a === b))
          .then(diff => {
            expect(diff[0].toJSON(), 'to equal', { type: 'insert', index: 2, values: [ 3 ] });
            expect(diff, 'to have length', 1)
          });
    });

    it('returns a single remove for an item removed from the end', () => {

      return arrayDiffPromise([ 1, 2, 3 ], [ 1, 2 ], (a, b, indexA, indexB, callback) => callback(a === b))
          .then(diff => {
            expect(diff[0].toJSON(), 'to equal', { type: 'remove', index: 2, howMany: 1 });
            expect(diff, 'to have length', 1)
          });
    });

    it('returns a insert for an item inserted in the middle', () => {

      return arrayDiffPromise([ 1, 3 ], [ 1, 2, 3 ], (a, b, indexA, indexB, callback) => callback(a === b))
          .then(diff => {
            expect(diff[0].toJSON(), 'to equal', { type: 'insert', index: 1, values: [ 2 ] });
            expect(diff, 'to have length', 1)
          });
    });


    it('returns a remove for an item removed from the middle', () => {

      return arrayDiffPromise([ 1, 2, 3 ], [ 1, 3 ], (a, b, indexA, indexB, callback) => callback(a === b))
          .then(diff => {
            expect(diff[0].toJSON(), 'to equal', { type: 'remove', index: 1, howMany: 1 });
            expect(diff, 'to have length', 1)
          });
    });

    it('returns a remove and an insert when first item is different', () => {

      return arrayDiffPromise([ 1, 2, 3 ], [ 4, 2, 3 ], (a, b, indexA, indexB, callback) => callback(a === b))
          .then(diff => {
            expect(diff[0].toJSON(), 'to equal', { type: 'remove', index: 0, howMany: 1 });
            expect(diff[1].toJSON(), 'to equal', { type: 'insert', index: 0, values: [ 4 ] });
            expect(diff, 'to have length', 2)
          });
    });



    it('returns a set of move for a reverse array', () => {

      return arrayDiffPromise([ 3, 2, 1 ], [ 1, 2, 3 ], (a, b, indexA, indexB, callback) => callback(a === b))
          .then(diff => {
            expect(diff[0].toJSON(), 'to equal', { type: 'move', from: 1, to: 0, howMany: 1 });
            expect(diff[1].toJSON(), 'to equal', { type: 'move', from: 2, to: 0, howMany: 1 });
            expect(diff, 'to have length', 2)
          });
    });

    it('diffs with a repeated element', () => {
      return expect([32], 'to match diffs against', [32, 32, 32]);
    });

    it('diffs a known array', () => {
      // This particular array was found to cause an issue, mostly due to `diffs with a repeated element`, found later
      // Leaving this test here to check
      const before = [15,16,31,0,32,10,5,23,2,18,50,34,32,49,47,49,20];
      const after = [49,20,16,34,32,5,23,15,50,31,18,0,47,32,10,2,49];
      return arrayDiffPromise(before, after).then(diff => {

        const origDiff = originalArrayDiff(before, after);
        const result = applyDiff(before, origDiff);

        expect(diff, 'to satisfy', origDiff);
        expect (result, 'to equal', after);
      });
    });

    it('diffs a long array', () => {

      var long = randomArray(400);

      var after = long.slice().sort(function () {
        return Math.random() - 0.5;
      });

      return expect(after, 'to match diffs against', long);
    });

    // From the original test suite
    it('diffs randomly rearranged arrays of numbers', function() {

      var after, before;
      before = randomArray(50);
      after = before.slice().sort(function() {
        return Math.random() - 0.5;
      });

      return testDiff(before, after);
    });

  });

