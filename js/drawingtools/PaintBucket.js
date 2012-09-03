/*
 * @provide pskl.drawingtools.PaintBucket
 *
 * @require pskl.utils
 */
(function() {
	var ns = $.namespace("pskl.drawingtools");

	ns.PaintBucket = function() {
		this.toolId = "tool-paint-bucket"
	};

	pskl.utils.inherit(ns.PaintBucket, ns.BaseTool);

	/**
	 * @override
	 */
	ns.PaintBucket.prototype.applyToolAt = function(col, row, frame, color, canvas, dpi) {

		// Change model:
		var targetColor = pskl.utils.normalizeColor(frame[col][row]);
		//this.recursiveFloodFill_(frame, col, row, targetColor, color);
		this.queueLinearFloodFill_(frame, col, row, targetColor, color);
		
		// Draw in canvas:
		// TODO: Remove that when we have the centralized redraw loop
		this.drawFrameInCanvas(frame, canvas, dpi);
	};

	/**
	 *  Flood-fill (node, target-color, replacement-color):
	 *	 1. Set Q to the empty queue.
	 *	 2. If the color of node is not equal to target-color, return.
	 *	 3. Add node to Q.
	 *	 4. For each element n of Q:
	 *	 5.     If the color of n is equal to target-color:
	 *	 6.         Set w and e equal to n.
	 *	 7.         Move w to the west until the color of the node to the west of w no longer matches target-color.
	 *	 8.         Move e to the east until the color of the node to the east of e no longer matches target-color.
	 *	 9.         Set the color of nodes between w and e to replacement-color.
	 *	10.         For each node n between w and e:
	 *	11.             If the color of the node to the north of n is target-color, add that node to Q.
	 *	12.             If the color of the node to the south of n is target-color, add that node to Q.
	 *	13. Continue looping until Q is exhausted.
	 *	14. Return.
     *
     * @private
	 */
	ns.PaintBucket.prototype.queueLinearFloodFill_ = function(frame, col, row, targetColor, replacementColor) {

		var queue = [];
		var dy = [-1, 0, 1, 0];
	    var dx = [0, 1, 0, -1];

	 	try {
			if(frame[col][row] == replacementColor) {
		 		return;
		 	}
		} catch(e) {
			// Frame out of bound exception.
		}

		var isInFrameBound = function(frame_, col_, row_) {
			if( col_ < 0 ||
		 		col_ >= frame_.length ||
		 		row_ < 0 ||
		 		row_ >= frame_[0].length) {
		 		return false;
		 	}
		 	return true;
		}

	 	queue.push({"col": col, "row": row});
	 	var loopCount = 0;
	 	var cellCount = frame.length * frame[0].length;
	 	while(queue.length > 0) {
			loopCount ++;

	 		var currentItem = queue.pop();
	 		frame[currentItem.col][currentItem.row] = replacementColor;
	 		
	 		for (var i = 0; i < 4; i++) {
	 			var nextCol = currentItem.col + dx[i]
	            var nextRow = currentItem.row + dy[i]
				try {
		            if (isInFrameBound(frame, nextCol, nextRow)  && frame[nextCol][nextRow] == targetColor) {
		                queue.push({"col": nextCol, "row": nextRow });
		            }
		        } catch(e) {
		        	// Frame out of bound exception.
		        }
	        }

	 		// Security loop breaker:
			if(loopCount > 10 * cellCount) {
				console.log("loop breaker called")
	 			break;			
	 		}
	 	}
	};

	/**
	 * Basic Flood-fill implementation (Stack explosion !):
	 * Flood-fill (node, target-color, replacement-color):
	 *	1. If the color of node is not equal to target-color, return.
	 *	2. Set the color of node to replacement-color.
	 *	3. Perform Flood-fill (one step to the west of node, target-color, replacement-color).
	 *	   Perform Flood-fill (one step to the east of node, target-color, replacement-color).
	 *     Perform Flood-fill (one step to the north of node, target-color, replacement-color).
	 *     Perform Flood-fill (one step to the south of node, target-color, replacement-color).
	 *	4. Return.
	 *
	 *  @private
	 */
	ns.PaintBucket.prototype.recursiveFloodFill_ = function(frame, col, row, targetColor, replacementColor) {
	 	
	 	// Step 1:
	 	if( col < 0 ||
	 		col >= frame.length ||
	 		row < 0 ||
	 		row >= frame[0].length ||
	  		frame[col][row] != targetColor) {
	 		return;
	 	}

	 	// Step 2:
	 	frame[col][row] = replacementColor;
	 	
	 	//Step 3:
	 	this.simpleFloodFill(frame, col - 1, row, targetColor, replacementColor);
	 	this.simpleFloodFill(frame, col + 1, row, targetColor, replacementColor);
	 	this.simpleFloodFill(frame, col, row - 1, targetColor, replacementColor);
	 	this.simpleFloodFill(frame, col, row + 1, targetColor, replacementColor);

	 	return;
	};

})();













