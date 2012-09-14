(function () {
	var ns = $.namespace("pskl");

	ns.PixelUtils = {

		getRectanglePixels : function (x0, y0, x1, y1) {
			var pixels = [];
			var swap;
			
			if(x0 > x1) {
				swap = x0;
				x0 = x1;
				x1 = swap;
			}
			if(y0 > y1) {
				swap = y0;
				y0 = y1;
				y1 = swap;
			}

			for(var x = x0; x <= x1; x++) {
				for(var y = y0; y <= y1; y++) {
					pixels.push({"col": x, "row": y});
				}
			}
			
			return pixels;		
		},

		getBoundRectanglePixels : function (x0, y0, x1, y1) {
			var pixels = [];
			var swap;
			
			if(x0 > x1) {
				swap = x0;
				x0 = x1;
				x1 = swap;
			}
			if(y0 > y1) {
				swap = y0;
				y0 = y1;
				y1 = swap;
			}

			// Creating horizontal sides of the rectangle:
			for(var x = x0; x <= x1; x++) {
				pixels.push({"col": x, "row": y0});
				pixels.push({"col": x, "row": y1});
			}

			// Creating vertical sides of the rectangle:
			for(var y = y0; y <= y1; y++) {
				pixels.push({"col": x0, "row": y});
				pixels.push({"col": x1, "row": y});	
			}
			
			return pixels;	
		},

		getSimilarConnectedPixelsFromFrame: function(frame, col, row) {
			/**
			 *  Queue linear Flood-fill (node, target-color, replacement-color):
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
			var pixels = [];
			frame = frame.clone();
			var replacementColor = "sdfsdfsdf"

			var queue = [];
			var dy = [-1, 0, 1, 0];
		    var dx = [0, 1, 0, -1];
		    try {
		    	var targetColor = frame.getPixel(col, row);
			} catch(e) {
				// Frame out of bound exception.
			}
		 	
			if(targetColor == replacementColor) {
		 		return;
		 	}
			

		 	queue.push({"col": col, "row": row});
		 	var loopCount = 0;
		 	var cellCount = frame.getWidth() * frame.getHeight();
		 	while(queue.length > 0) {
				loopCount ++;

		 		var currentItem = queue.pop();
		 		frame.setPixel(currentItem.col, currentItem.row, replacementColor);
		 		pixels.push({"col": currentItem.col, "row": currentItem.row });
		 		
		 		for (var i = 0; i < 4; i++) {
		 			var nextCol = currentItem.col + dx[i]
		            var nextRow = currentItem.row + dy[i]
					try {
			            if (frame.containsPixel(nextCol, nextRow)  && frame.getPixel(nextCol, nextRow) == targetColor) {
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
		 	return pixels;
		},

		paintSimilarConnectedPixelsFromFrame: function(frame, col, row, replacementColor) {
			/**
			 *  Queue linear Flood-fill (node, target-color, replacement-color):
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
			var queue = [];
			var dy = [-1, 0, 1, 0];
		    var dx = [0, 1, 0, -1];
		    try {
		    	var targetColor = frame.getPixel(col, row);
			} catch(e) {
				// Frame out of bound exception.
			}
		 	
			if(targetColor == replacementColor) {
		 		return;
		 	}
			

		 	queue.push({"col": col, "row": row});
		 	var loopCount = 0;
		 	var cellCount = frame.getWidth() * frame.getHeight();
		 	while(queue.length > 0) {
				loopCount ++;

		 		var currentItem = queue.pop();
		 		frame.setPixel(currentItem.col, currentItem.row, replacementColor);
		 		
		 		for (var i = 0; i < 4; i++) {
		 			var nextCol = currentItem.col + dx[i]
		            var nextRow = currentItem.row + dy[i]
					try {
			            if (frame.containsPixel(nextCol, nextRow)  && frame.getPixel(nextCol, nextRow) == targetColor) {
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
		}
	};
})();