(function () {
  var tests = require('./test/drawing/DrawingTests.casper.js').tests;

  var baseUrl = casper.cli.get('baseUrl')+"?debug";
  var resultSelector = '#drawing-test-result';

  casper.start();

  var runTest = function (index) {
    var test = 'drawing/tests/' + tests[index];

    casper.open(baseUrl + "&test-run=" + test);

    casper.then(function () {
      this.echo('Running test : ' + test);
      this.wait(casper.cli.get('delay'));
    });

    casper.then(function () {
      this.echo('... Waiting for test result : ' + resultSelector);
      this.waitForSelector(resultSelector, function () {
        // then
        var result = this.getHTML(resultSelector);
        this.echo('... Test finished : ' + result);
        this.test.assertEquals(result, 'OK');
      }, function () {
        // onTimeout
        this.test.fail('Test timed out');
      }, 60*1000);
    })
    .run(function () {
      if (tests[index+1]) {
        runTest(index+1);
      } else {
        this.test.done();
      }
    });
  };

  runTest(0);

})();