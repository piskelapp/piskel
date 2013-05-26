casper
.start(casper.cli.get('baseUrl'))
.then(function () {
	this.test.assertExists('#drawing-canvas-container canvas', 'Check if drawing canvas element is created');
})
.run(function () {
	this.test.done();
});