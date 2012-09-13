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
		}
	};
})();