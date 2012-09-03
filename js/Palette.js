/*
 * @provide pskl.Palette
 *
 * @require Constants
 * @require Events
 */
$.namespace("pskl");

pskl.Palette = (function() {
	
	var paletteRoot,
		paletteColors = [];

	/**
	 * @private
	 */
	 var onPickerChange_ = function(evt) {
        var inputPicker = $(evt.target);
        $.publish(Events.COLOR_SELECTED, [inputPicker.val()]);
	 };

	 /**
	  * @private
	  */
	 var createPalette_ = function (colors) {
	 	// Always adding transparent color
	 	paletteRoot.html('<span class="palette-color transparent-color" data-color="TRANSPARENT" title="Transparent"></span>');
	 	for(var color in colors) {
	 		if(color != Constants.TRANSPARENT_COLOR) {
	 			addColorToPalette_(color);
	 		}
	 	}
	 };

	 /**
	  * @private
	  */
	 var addColorToPalette_ = function (color) {
      if (paletteColors.indexOf(color) == -1) {
      	var colorEl = document.createElement("li");    
        colorEl.className = "palette-color";
        colorEl.setAttribute("data-color", color);
        colorEl.setAttribute("title", color);
        colorEl.style.background = color;
        paletteRoot[0].appendChild(colorEl);
        paletteColors.push(color);
      }
    };

    /**
     * @private
     */
    var onPaletteColorClick_ = function (event) {
      var selectedColor = $(event.target).data("color");
      var colorPicker = $('#color-picker');
      if (selectedColor == Constants.TRANSPARENT_COLOR) {
        // We can set the current palette color to transparent.
        // You can then combine this transparent color with an advanced
        // tool for customized deletions. 
        // Eg: bucket + transparent: Delete a colored area
        //     Stroke + transparent: hollow out the equivalent of a stroke

        // The colorpicker can't be set to a transparent state.
        // We set its background to white and insert the
        // string "TRANSPARENT" to mimic this state:
        colorPicker[0].color.fromString("#fff");
        colorPicker.val("TRANSPARENT");
      } else {
        colorPicker[0].color.fromString(selectedColor);
      }
      $.publish(Events.COLOR_SELECTED, [selectedColor])
    };

	return {
		init: function(framesheet) {
			
			paletteRoot = $("#palette");

			// Initialize palette:
			createPalette_(framesheet.getUsedColors());

      		$.subscribe(Events.FRAMESHEET_RESET, function(evt) {
      			createPalette_(framesheet.getUsedColors());
      		});

      		paletteRoot.click(onPaletteColorClick_);
      		$.subscribe(Events.COLOR_USED, function(evt, color) {
      			addColorToPalette_(color);
      		});

      		// Initialize colorpicker:
      		var colorPicker = $('#color-picker');
      		colorPicker.val(Constants.DEFAULT_PEN_COLOR);
      		colorPicker.change(onPickerChange_);

		}
	};
})();



