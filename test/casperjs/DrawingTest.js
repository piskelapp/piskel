(function () {
  var tests = require('../drawing/DrawingTests.casper.js').tests;

  var baseUrl = casper.cli.get('baseUrl')+"?debug";
  var resultSelector = '#drawing-test-result';


  casper.test.begin('Drawing Tests', tests.length, function(test) {
    casper.start();

    var runTest = function (index) {
      var currentTest = 'drawing/tests/' + tests[index];

      casper.open(baseUrl + "&test-run=" + currentTest);

      casper.then(function () {
        this.echo('Running test : ' + currentTest);
        this.echo('... Waiting for test result : ' + resultSelector);
        this.waitForSelector(resultSelector, function () {
          // then
          var result = this.getHTML(resultSelector);
          this.echo('... Test finished : ' + result);
          test.assertEquals(result, 'OK');
        }, function () {
          // onTimeout
          test.fail('Test timed out');
        }, 30 * 1000);
      })
      .run(function () {
        if (tests[index+1]) {
          runTest(index+1);
        } else {
          test.done();
        }
      });
    };

    runTest(0);
  });
})();
