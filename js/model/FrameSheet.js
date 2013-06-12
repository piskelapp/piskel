(function () {
	var ns = $.namespace("pskl.model");
	ns.FrameSheet = function (height, width) {
		this.width = width;
		this.height = height;
		this.frames = [];
		this.currentFrameIndex = 0;
	};

	ns.FrameSheet.prototype.getHeight = function () {
		return this.height;
	};

	ns.FrameSheet.prototype.getWidth = function () {
		return this.width;
	};

	ns.FrameSheet.prototype.addEmptyFrame = function () {
		this.addFrame(ns.Frame.createEmpty(this.width, this.height));
	};

	ns.FrameSheet.prototype.addFrame = function (frame) {
		this.frames.push(frame);
	};

	ns.FrameSheet.prototype.getFrameCount = function () {
		return this.frames.length;
	};

	ns.FrameSheet.prototype.getCurrentFrame = function () {
		return this.frames[this.currentFrameIndex];
	};

	ns.FrameSheet.prototype.setCurrentFrameIndex = function (index) {
		this.currentFrameIndex = index;
		$.publish(Events.CURRENT_FRAME_SET, [this.getCurrentFrame()]);
		$.publish(Events.FRAMESHEET_RESET);  // Is it no to overkill to have this here ?
	};

	ns.FrameSheet.prototype.getUsedColors = function() {
		var colors = {};
		for (var frameIndex=0; frameIndex < this.frames.length; frameIndex++) {
			var frame = this.frames[frameIndex];
			for (var i = 0, width = frame.getWidth(); i < width  ; i++) {
				var line = frame[i];
				for (var j = 0, height = frame.getHeight() ; j < height ; j++) {
					var pixel = frame.getPixel(i, j);
					colors[pixel] = pixel;
				}
			}
		}
		return colors;
	};

	// Could be used to pass around model using long GET param (good enough for simple models) and 
	// do some temporary locastorage
	ns.FrameSheet.prototype.serialize = function() {
		var serializedFrames = [];
		for (var i = 0 ; i < this.frames.length ; i++) {
			serializedFrames.push(this.frames[i].serialize());
		}
		return '[' + serializedFrames.join(",") + ']';
		//return JSON.stringify(frames);
	};

	/**
	 * Load a framesheet from a model that might have been persisted in db / localstorage
	 * Overrides existing frames.
	 * @param {String} serialized
	 */
	ns.FrameSheet.prototype.deserialize = function (serialized) {
		try {
			this.load(JSON.parse(serialized));
		} catch (e) {
			throw "Could not load serialized framesheet : " + e.message;
		}	
	};


	/**
	 * Load a framesheet from a model that might have been persisted in db / localstorage
	 * Overrides existing frames.
	 * @param {String} serialized
	 */
	ns.FrameSheet.prototype.load = function (framesheet) {
		this.frames = [];
		for (var i = 0 ; i < framesheet.length ; i++) {
			var frameCfg = framesheet[i];
			this.addFrame(new ns.Frame(frameCfg));
		}

		if (this.hasFrameAtIndex(0)) {
			this.height = this.getFrameByIndex(0).getHeight();
			this.width = this.getFrameByIndex(0).getWidth();
			this.setCurrentFrameIndex(0);
			$.publish(Events.FRAME_SIZE_CHANGED);
		}

		$.publish(Events.FRAMESHEET_RESET);
	};

	
	ns.FrameSheet.prototype.hasFrameAtIndex = function(index) {
		return (index >= 0 && index < this.getFrameCount());
	};

	ns.FrameSheet.prototype.getFrameByIndex = function(index) {
		if (isNaN(index)) {
			throw "Bad argument value for getFrameByIndex method: <" + index + ">";
		} 

		if (!this.hasFrameAtIndex(index)) {
			throw "Out of bound index for frameSheet object.";
		}

		return this.frames[index];
	};

	ns.FrameSheet.prototype.removeFrameByIndex = function(index) {
		if(!this.hasFrameAtIndex(index)) {
			throw "Out of bound index for frameSheet object.";
		}
		this.frames.splice(index, 1);

		// Current frame index might not be valid anymore
		if (!this.hasFrameAtIndex(this.currentFrameIndex)) {
			// if not select last frame available
			this.setCurrentFrameIndex(this.getFrameCount() - 1);
		}

		$.publish(Events.FRAMESHEET_RESET);
	};

	ns.FrameSheet.prototype.duplicateFrameByIndex = function(index) {
		var frame = this.getFrameByIndex(index);
		this.frames.splice(index + 1, 0, frame.clone());
	};

	ns.FrameSheet.prototype.moveFrame = function(originIndex, destinationIndex) {
		this.frames.splice(destinationIndex, 0, this.frames.splice(originIndex, 1)[0]);
	};

	ns.FrameSheet.prototype.swapFrames = function(indexFrame1, indexFrame2) {
		if(isNaN(indexFrame1) || isNaN(indexFrame1) ||
			(!this.hasFrameAtIndex(indexFrame1) && !this.hasFrameAtIndex(indexFrame2))) {
			throw "Bad indexes for swapFrames Framesheet function.";
		}
		if(indexFrame1 == indexFrame2) {
			return;
		}
		else {
			var swapFrame = this.frames[indexFrame1];
			this.frames[indexFrame1] = this.frames[indexFrame2];
			this.frames[indexFrame2] = swapFrame;
		}
	};
})();