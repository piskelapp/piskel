
$.namespace("pskl");

pskl.FrameSheetModel = (function() {
    
    var inst;
    var frames = [];
    var width;
    var height;

    /**
     * @private
     */
    var requestLocalStorageSave_ = function() {
    	
    };

	return {
		validate: function() {
			return true; // I'm always right dude
		},

		getUsedColors: function() {
			var colors = {};
			for (var frameIndex=0; frameIndex < frames.length; frameIndex++) {
				var frame = frames[frameIndex];
				for (var i = 0, width = frame.getWidth(); i < width  ; i++) {
					var line = frame[i];
					for (var j = 0, height = frame.getHeight() ; j < height ; j++) {
						var pixel = frame.getPixel(i, j);
						colors[pixel] = pixel;
					}
				}
			}
			return colors;
		},

		// Could be used to pass around model using long GET param (good enough for simple models) and 
		// do some temporary locastorage
		serialize: function() {
			return JSON.stringify(frames);
		},

		/**
		 * Load a framesheet from a string that might have been persisted in db / localstorage
		 * Overrides existing frames.
		 * @param {String} serialized
		 */
		deserialize : function (serialized) {
			try {
				frames = JSON.parse(serialized);
				$.publish(Events.FRAMESHEET_RESET);
			} catch (e) {
				throw "Could not load serialized framesheet." + e.message
			}	
		},
		
		addEmptyFrame : function () {
			this.addFrame(pskl.rendering.Frame.createEmpty(width, height));
		},

		addFrame: function(frame) {
			frames.push(frame);
		},

		getFrameCount: function() {
			return frames.length;
		},

		getFrameByIndex: function(index) {
			if (isNaN(index)) {
				throw "Bad argument value for getFrameByIndex method: <" + index + ">";
			} else if (index < 0 || index > frames.length) {
				throw "Out of bound index for frameSheet object.";
			}

			return frames[index];
		},

		removeFrameByIndex: function(index) {
		  if(index < 0 || index > inst.getFrameCount()) {
		  	throw "Bad index value for removeFrameByIndex.";
		  }
		  frames.splice(index, 1);
		},

		duplicateFrameByIndex: function(index) {
			var frame = inst.getFrameByIndex(index);
			frames.splice(index + 1, 0, frame.clone());
		},
        
		getInstance: function(width_, height_) {
			if (isNaN(width_) || isNaN(height_)) {
				throw "Bad FrameSheetModel initialization in getInstance method.";
			}

			inst = this;

			width = width_;
			height = height_;

			return inst;
		}
	}
})();