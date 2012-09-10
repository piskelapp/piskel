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
   var onPickerChange_ = function(evt, isPrimary) {
        var inputPicker = $(evt.target);
        $.publish(Events.COLOR_SELECTED, [inputPicker.val(), evt.data.isPrimary]);
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
      if (paletteColors.indexOf(color) == -1 && color != Constants.TRANSPARENT_COLOR) {
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
      if (event.which == 1) { // left button 
        updateColorPicker(selectedColor, $('#color-picker'));
        $.publish(Events.COLOR_SELECTED, [selectedColor, true]);
      } else if (event.which == 3) { // right button
        updateColorPicker(selectedColor, $('#secondary-color-picker'));
        $.publish(Events.COLOR_SELECTED, [selectedColor, false]);
      }
    };

    var updateColorPicker = function (color, colorPicker) {
      if (color == Constants.TRANSPARENT_COLOR) {
        // We can set the current palette color to transparent.
        // You can then combine this transparent color with an advanced
        // tool for customized deletions. 
        // Eg: bucket + transparent: Delete a colored area
        //     Stroke + transparent: hollow out the equivalent of a stroke

        // The colorpicker can't be set to a transparent state.
        // We set its background to white and insert the
        // string "TRANSPARENT" to mimic this state:
        colorPicker[0].color.fromString("#fff");
        colorPicker.val(Constants.TRANSPARENT_COLOR);
      } else {
        colorPicker[0].color.fromString(color);
      }
    };

  return {
    init: function(framesheet) {
      
      paletteRoot = $("#palette");

      // Initialize palette:
      createPalette_(framesheet.getUsedColors());

          $.subscribe(Events.FRAMESHEET_RESET, function(evt) {
            createPalette_(framesheet.getUsedColors());
          });

          paletteRoot.mouseup(onPaletteColorClick_);
          $.subscribe(Events.COLOR_SELECTED, function(evt, color) {
            addColorToPalette_(color);
          });

          // Initialize colorpicker:
          var colorPicker = $('#color-picker');
          colorPicker.val(Constants.DEFAULT_PEN_COLOR);
          colorPicker.change({isPrimary : true}, onPickerChange_);


          var secondaryColorPicker = $('#secondary-color-picker');
          secondaryColorPicker.val(Constants.TRANSPARENT_COLOR);
          secondaryColorPicker.change({isPrimary : false}, onPickerChange_);

    }
  };
})();



