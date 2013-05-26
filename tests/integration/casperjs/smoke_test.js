casper
.start(casper.cli.get('baseUrl'))
.then(function () {
	this.test.assertExists('#drawing-canvas-container', 'Check if the balance is set');
})
.run(function () {
	this.test.done();
});