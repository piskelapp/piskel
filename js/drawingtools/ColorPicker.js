/*
 * @provide pskl.drawingtools.ColorPicker
 *
 * @require pskl.utils
 */
(function() {
	var ns = $.namespace("pskl.drawingtools");

	ns.ColorPicker = function() {
		this.toolId = "tool-colorpicker";
		this.helpText = "Color picker";
	};

	pskl.utils.inherit(ns.ColorPicker, ns.BaseTool);
	
	/**
	 * @override
	 */
	ns.ColorPicker.prototype.applyToolAt = function(col, row, color, frame, overlay) {
		if (frame.containsPixel(col, row)) {
			var sampledColor = frame.getPixel(col, row);
			$.publish(Events.PRIMARY_COLOR_SELECTED, [sampledColor]);
		}
	};
})();
