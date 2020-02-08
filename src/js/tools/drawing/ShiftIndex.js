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
		this.helpText = 'Shift Palette Color Index Brush';
		this.shortcut = pskl.service.keyboard.Shortcuts.TOOL.SHIFT_INDEX;

		this.tooltipDescriptors = [
			{ 
				description: 'Changes the color of pixels which are in the current palette. ' + 
					'For each pixel it touches, the next or previous color within the palette will be used. ' + 
					'Use the primary and secondary colors in the palette to set ' +
					'cell shade range boundaries. For example if your palette has: ' +
					'- light red, dark red, light blue, dark blue - ' +
					'you would want to set the primary colour to light red and secondary to dark red. ' +
					'This will prevent the brush from cycling red to blue'
			},
			{ key: 'ctrl', description: 'Shift Index backwards' },
		];
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
		var pixelColor = frame.getPixel(col, row);
		var isTransparent = pixelColor === pskl.utils.colorToInt(Constants.TRANSPARENT_COLOR);
		if (isTransparent) {
		// Ignore transparent pixels.
		return Constants.TRANSPARENT_COLOR;
		}

		var overlayColor = overlay.getPixel(col, row);
		var isPixelModified = overlayColor !== pskl.utils.colorToInt(Constants.TRANSPARENT_COLOR);
		if (isPixelModified) {
		// This pixel was already updated by the tool, reuse the current color 
		// buffered in the overlay.
		return overlayColor;
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
