
var FrameSheetModel = (function() {
    
    var inst;
    var frames = [];
    var width;
    var height;

    var createEmptyFrame_ = function() {
    	var emptyFrame = new Array(width);
		for (var columnIndex=0; columnIndex < width; columnIndex++) {
			emptyFrame[columnIndex] = new Array(height);
    	}
        return emptyFrame;
    };

	return {
		validate: function() {
			return true; // I'm always right dude
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
		deserializeFramesheet : function (serialized) {
			try {
				frames = JSON.parse(serialized);
			} catch (e) {
				throw "Could not load serialized framesheet." + e.message()
			}	
		},
		
		addEmptyFrame: function() {
			frames.push(createEmptyFrame_());
		},

		getFrameCount: function() {
			return frames.length;
		},

		getFrameByIndex: function(index) {
			if (isNaN(index)) {
				throw "Bad argument value for getFrameByIndex method: <" + index + ">"
			} else if (index < 0 || index > frames.length) {
				throw "Out of bound index for frameSheet object."
			}

			return frames[index];
		},

		removeFrameByIndex: function(index) {
		  if(index < 0 || index > inst.getFrameCount()) {
		  	throw "Bad index value for removeFrameByIndex.";
		  }
		  frames.splice(index, 1);
		},

		duplicateFrameByIndex: function(frameToDuplicateIndex) {
			var frame = inst.getFrameByIndex(frameToDuplicateIndex);
			var clonedFrame = [];
			for(var i=0, l=frame.length; i<l; i++) {
				clonedFrame.push(frame[i].slice(0));
			}
			frames.splice(frameToDuplicateIndex + 1, 0, clonedFrame);
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