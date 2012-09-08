(function () {
	var ns = $.namespace("pskl.rendering");

	this.dpi = null;
	this.canvas = null;

	ns.FrameRenderer = function (container, dpi, className) {
		if(container == undefined) {
			throw "Bad FrameRenderer initialization. <container> undefined.";
		}

		if(dpi == undefined || isNaN(dpi)) {
			throw "Bad FrameRenderer initialization. <dpi> not well defined.";
		}

		this.container = container;
		this.dpi = dpi;
		this.className = className;
	};

	ns.FrameRenderer.prototype.init = function (frame) {
		
		this.createCanvas_(frame);
		this.render(frame);
	};

	ns.FrameRenderer.prototype.render = function (frame) {
		for(var col = 0, width = frame.getWidth(); col < width; col++) {
			for(var row = 0, height = frame.getHeight(); row < height; row++) {
				this.drawPixel(col, row, frame, this.canvas, this.dpi);
			}
		}
	};

	ns.FrameRenderer.prototype.drawPixel = function (col, row, frame) {
		var context = this.canvas.getContext('2d');
		var color = frame.getPixel(col, row);
		if(color == Constants.TRANSPARENT_COLOR) {
			context.clearRect(col * this.dpi, row * this.dpi, this.dpi, this.dpi);   
		} 
		else {
			if(color != Constants.SELECTION_TRANSPARENT_COLOR) {
				// TODO(vincz): Found a better design to update the palette, it's called too frequently.
				$.publish(Events.COLOR_USED, [color]);
			}
			context.fillStyle = color;
			context.fillRect(col * this.dpi, row * this.dpi, this.dpi, this.dpi);
		}
	};

	ns.FrameRenderer.prototype.clear = function (col, row, frame) {
		this.canvas.getContext("2d").clearRect(0, 0, this.canvas.width, this.canvas.height);
	};

	/**
	 * @private
	 */
	ns.FrameRenderer.prototype.createCanvas_ = function (frame) {
		if(this.canvas == undefined) {
			var width = frame.getWidth(),
				height = frame.getHeight();

			var canvas = document.createElement("canvas");
			canvas.setAttribute("width", width * this.dpi);
			canvas.setAttribute("height", height * this.dpi);
			
			var canvasClassname =  "canvas";
			if(this.className) {
				canvasClassname += " " + this.className;	
			}
			canvas.setAttribute("class", canvasClassname);
			
			this.canvas = canvas;
		}
		this.container.appendChild(this.canvas);
	};
})();