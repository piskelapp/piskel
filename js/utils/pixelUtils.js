(function () {
	var ns = $.namespace("pskl");

	ns.PixelUtils = {

		getRectanglePixels : function (x0, y0, x1, y1) {
			var rectangle = this.getOrderedRectangleCoordinates(x0, y0, x1, y1);
			var pixels = [];

			for(var x = rectangle.x0; x <= rectangle.x1; x++) {
				for(var y = rectangle.y0; y <= rectangle.y1; y++) {
					pixels.push({"col": x, "row": y});
				}
			}
			
			return pixels;		
		},

		getBoundRectanglePixels : function (x0, y0, x1, y1) {
			var rectangle = this.getOrderedRectangleCoordinates(x0, y0, x1, y1);
			var pixels = [];
			// Creating horizontal sides of the rectangle:
			for(var x = rectangle.x0; x <= rectangle.x1; x++) {
				pixels.push({"col": x, "row": rectangle.y0});
				pixels.push({"col": x, "row": rectangle.y1});
			}

			// Creating vertical sides of the rectangle:
			for(var y = rectangle.y0; y <= rectangle.y1; y++) {
				pixels.push({"col": rectangle.x0, "row": y});
				pixels.push({"col": rectangle.x1, "row": y});
			}
			
			return pixels;	
		},

		/**
		 * Return an object of ordered rectangle coordinate.
		 * In returned object {x0, y0} => top left corner - {x1, y1} => bottom right corner 
		 * @private
		 */
		getOrderedRectangleCoordinates : function (x0, y0, x1, y1) {
			return {
				x0 : Math.min(x0, x1), y0 : Math.min(y0, y1),
				x1 : Math.max(x0, x1), y1 : Math.max(y0, y1),
			};
		} 
	};
})();