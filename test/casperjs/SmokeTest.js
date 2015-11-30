casper
  .start(casper.cli.get('baseUrl')+"?debug")
  .then(function () {
    this.wait(casper.cli.get('delay'));
  })
  .then(function () {
    this.echo(casper.cli.get('baseUrl')+"?debug");
    // If there was a JS error after the page load, casper won't perform asserts
    this.test.assertExists('html', 'Casper JS cannot assert DOM elements. A JS error has probably occured.');

    this.test.assertExists('#drawing-canvas-container canvas', 'Check if drawing canvas element is created');
  })
  .run(function () {
    this.test.done();
  });