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

    var serializeFrame_ = function (frame) {
    	var buffer = [];
    	for (var i = 0 ; i < frame.length ; i++) {
    		var serializedLine = "";
    		for(var j = 0 ; j < frame[i].length ; j++) {
    			if (typeof frame[i][j] == 'undefined' || frame[i][j] == 'tc') {
    				serializedLine += "0"
    			} else {
    				serializedLine += "1"
    			}
    		}
    		buffer.push(parseInt(serializedLine, 2).toString(36));

    	}
    	return buffer.join(",");
    };

	return {
		validate: function() {
			return true; // I'm always right dude
		},

		// Could be use to pass around model using long GET param (good enough for simple models) and 
		// do some temporary locastorage
		serialize: function() {
			var buffer = [];
			for (var i = 0 ; i < frames.length ; i++) {
				buffer.push(serializeFrame_(frames[i]));
			}
			return buffer.join("+");
			//throw "FrameSheet.serialize Not implemented"
		},
		
		addEmptyFrame: function() {
			this.addFrame(createEmptyFrame_());
		},

		addFrame : function (frame) {
			frames.push(frame);
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