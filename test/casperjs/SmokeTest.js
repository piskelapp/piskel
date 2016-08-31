casper.test.begin('Smoke Test', 1, function(test) {
  casper
    .start(casper.cli.get('baseUrl')+"/?debug")
    .then(function () {
      this.echo(casper.cli.get('baseUrl')+"/?debug");
      this.waitForSelector('#drawing-canvas-container canvas', function() {
        test.assertExists('#drawing-canvas-container canvas', 'Check if drawing canvas element is created');
      }, function () {
        test.fail('Test timed out');
      }, 10000);
    })
    .run(function () {
      test.done();
    });
});