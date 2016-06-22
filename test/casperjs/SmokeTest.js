casper
  .start(casper.cli.get('baseUrl') + '?debug&test=true')
  .then(function () {
    this.wait(casper.cli.get('delay'));
  })
  .then(function () {
    // test=true : used by PreviewController to do no instantiate ThreeJs.
    this.echo(casper.cli.get('baseUrl') + '?debug&test=true');
    // If there was a JS error after the page load, casper won't perform asserts
    this.test.assertExists('html', 'Casper JS cannot assert DOM elements. A JS error has probably occured.');

    //this.test.assertExists('#drawing-canvas-container canvas', 'Check if drawing canvas element is created');
    this.echo('Waiting for #drawing-canvas-container - 60s timeout !');
    this.waitForSelector('#drawing-canvas-container canvas', function () {
      this.test.pass('Canvas found.');
    }, function () {
      // onTimeout
      this.test.fail('Test timed out');
    }, 60 * 1000);
  })
  .run(function () {
    this.test.done();
  });
