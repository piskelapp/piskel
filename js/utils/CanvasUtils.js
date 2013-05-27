(function () {
	var ns = $.namespace("pskl");

	ns.CanvasUtils = {
		createCanvas : function (width, height, classList) {
			var canvas = document.createElement("canvas");
			canvas.setAttribute("width", width);
			canvas.setAttribute("height", height);

			if (typeof classList == "string") {
				classList = [classList];
			}
			if (Array.isArray(classList)) {
				for (var i = 0 ; i < classList.length ; i++) {
					canvas.classList.add(classList[i]);
				}
			}
			
			return canvas;
		}
	};
})();