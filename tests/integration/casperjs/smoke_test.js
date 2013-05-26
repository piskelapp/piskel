casper
.start(casper.cli.get('baseUrl'))
.then(function () {
	this.wait(5000, function() {
		this.test.assertExists('#preview-list .preview-tile', 'Check if first frame is created');
		this.test.assertExists('#drawing-canvas-container canvas', 'Check if drawing canvas element is created');
		this.test.assertExists('#preview-canvas-container canvas', 'Check if animation preview canvas is created');
	});
})
.run(function () {
	this.test.done();
});