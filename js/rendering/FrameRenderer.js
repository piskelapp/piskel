(function () {
	var ns = $.namespace("pskl.rendering");

	this.dpi = null;
	this.canvas = null;

	ns.FrameRenderer = function (container, renderingOptions, className) {
		if(container == undefined) {
			throw "Bad FrameRenderer initialization. <container> undefined.";
		}
		this.container = container;

		if(renderingOptions == undefined || renderingOptions.dpi == undefined || isNaN(dpi)) {
			throw "Bad FrameRenderer initialization. <dpi> not well defined.";
		}

		this.displayGrid = !!renderingOptions.displayGrid;
		this.dpi = renderingOptions.dpi;
		this.className = className;

		// Flag to know if the config was altered
		this.canvasConfigDirty = true;
	};

	ns.FrameRenderer.prototype.init = function (frame) {
		this.render(frame);
	};

	ns.FrameRenderer.prototype.updateDPI = function (newDPI) {
		this.dpi = newDPI;
		this.canvasConfigDirty = true;
	};

	ns.FrameRenderer.prototype.render = function (frame) {
		for(var col = 0, width = frame.getWidth(); col < width; col++) {
			for(var row = 0, height = frame.getHeight(); row < height; row++) {
				this.drawPixel(col, row, frame, this.getCanvas_(frame), this.dpi);
			}
		}
	};

	ns.FrameRenderer.prototype.drawPixel = function (col, row, frame) {
		var context = this.getCanvas_(frame).getContext('2d');
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
		var canvas = this.getCanvas_(frame)
		canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
	};

	/**
	 * @private
	 */
	ns.FrameRenderer.prototype.getCanvas_ = function (frame) {
		if(this.canvasConfigDirty) {
			$(this.canvas).remove();
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
			this.container.appendChild(this.canvas);

			this.canvasConfigDirty = false;
		}
		return this.canvas;
	};
})();