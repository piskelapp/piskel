/* eslint-disable indent */
/**
 * @provide pskl.tools.drawing.ShiftIndex
 *
 * @require Constants
 * @require pskl.utils
 */
(function() {
	var ns = $.namespace('pskl.tools.drawing');

	ns.ShiftIndex = function() {
		this.superclass.constructor.call(this);

		this.toolId = 'tool-shift-index';
		this.helpText = 'ShiftIndex';
		this.shortcut = pskl.service.keyboard.Shortcuts.TOOL.SHIFT_INDEX;

		this.tooltipDescriptors = [{ key: 'ctrl', description: 'Shift Index backwards' }];
	};

	pskl.utils.inherit(ns.ShiftIndex, ns.SimplePen);

	/**
	 * @Override
	 */
	ns.ShiftIndex.prototype.applyToolAt = function(col, row, frame, overlay, event) {
		if (row !== this.previousRow || col !== this.previousCol) {
			var penSize = pskl.app.penSizeService.getPenSize();
			var points = pskl.PixelUtils.resizePixel(col, row, penSize);
			points.forEach(
				function(point) {
					var modifiedColor = this.getModifiedColor_(point[0], point[1], frame, overlay, event);
					this.draw(modifiedColor, point[0], point[1], frame, overlay);
				}.bind(this)
			);
		}
		this.previousCol = col;
		this.previousRow = row;
	};

	ns.ShiftIndex.prototype.getModifiedColor_ = function(col, row, frame, overlay, event) {
		var overlayColor = overlay.getPixel(col, row);
		var frameColor = frame.getPixel(col, row);

		var isPixelModified = overlayColor !== pskl.utils.colorToInt(Constants.TRANSPARENT_COLOR);
		var pixelColor = isPixelModified ? overlayColor : frameColor;

		var isTransparent = pixelColor === pskl.utils.colorToInt(Constants.TRANSPARENT_COLOR);
		if (isTransparent) {
			return Constants.TRANSPARENT_COLOR;
		}

		if (isPixelModified) {
			return pixelColor;
		}
		var backward = pskl.utils.UserAgent.isMac ? event.metaKey : event.ctrlKey;

		var color = pskl.utils.intToHex(pixelColor);
		var colorPalette = pskl.app.palettesListController.getSelectedPaletteColors_();
		var startPoint = colorPalette.indexOf(pskl.app.selectedColorsService.getPrimaryColor());
		colorPalette.splice(0,startPoint);
		var index = colorPalette.indexOf(color);
		var range = colorPalette.indexOf(pskl.app.selectedColorsService.getSecondaryColor()) + 1;
		startPoint = index - (index % range);
		var colorsInCycleRange = colorPalette.slice(startPoint, startPoint + range);
		index = colorsInCycleRange.indexOf(color);
		if (index !== -1) {
			if (backward) {
				index -= 1;
			} else {
				index += 1;
			}
			if (index < 0) {
				index = 0;
			} else if (index > colorsInCycleRange.length - 1) {
				index = colorsInCycleRange.length - 1;
			}
			color = colorsInCycleRange[index];
		}
		return color;
	};
})();
