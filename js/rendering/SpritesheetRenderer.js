(function () {

	var ns = $.namespace("pskl.rendering");

	ns.SpritesheetRenderer = function (framesheet) {
		this.framesheet = framesheet;
	};

	ns.SpritesheetRenderer.prototype.renderAsImageDataSpritesheetPNG = function () {
		var canvas = this.createCanvas_();
		for (var i = 0 ; i < this.framesheet.getFrameCount() ; i++) {
			var frame = this.framesheet.getFrameByIndex(i);
			this.drawFrameInCanvas_(frame, canvas, i * this.framesheet.getWidth(), 0);
		}
		return canvas.toDataURL("image/png");
	};

	ns.SpritesheetRenderer.prototype.renderAsImageDataAnimatedGIF = function (fps) {
		var encoder = new GIFEncoder(), dpi = 10;
        encoder.setRepeat(0);
        encoder.setDelay(1000/fps);

        encoder.start();
        encoder.setSize(this.framesheet.getWidth() * dpi, this.framesheet.getHeight() * dpi);
        for (var i = 0 ; i < this.framesheet.frames.length ; i++) {
          var frame = this.framesheet.frames[i];
          var renderer = new pskl.rendering.CanvasRenderer(frame, dpi);
          encoder.addFrame(renderer.render());
        }
        encoder.finish();

        var imageData = 'data:image/gif;base64,' + encode64(encoder.stream().getData());
        return imageData;
	};


	/**
	 * TODO(juliandescottes): Mutualize with code already present in FrameRenderer
	 */
	ns.SpritesheetRenderer.prototype.drawFrameInCanvas_ = function (frame, canvas, offsetWidth, offsetHeight) {
		var context = canvas.getContext('2d');
		for(var col = 0, width = frame.getWidth(); col < width; col++) {
			for(var row = 0, height = frame.getHeight(); row < height; row++) {
				var color = frame.getPixel(col, row);
				if(color != Constants.TRANSPARENT_COLOR) {
					context.fillStyle = color;
					context.fillRect(col + offsetWidth, row + offsetHeight, 1, 1);
				}
			}
		}
	};

	ns.SpritesheetRenderer.prototype.createCanvas_ = function () {
		var frameCount = this.framesheet.getFrameCount();
		if (frameCount > 0){
			var width = frameCount * this.framesheet.getWidth();
			var height = this.framesheet.getHeight();
			return pskl.CanvasUtils.createCanvas(width, height);
		} else {
			throw "Cannot render empty Spritesheet";
		}
	};
})();