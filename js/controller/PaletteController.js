(function () {
  var ns = $.namespace("pskl.controller");

  ns.PaletteController = function () {
    this.paletteRoot = null;
    this.paletteColors = [];
  };

  /**
   * @private
   */
  ns.PaletteController.prototype.onPickerChange_ = function(evt, isPrimary) {
    var inputPicker = $(evt.target);
    $.publish(Events.COLOR_SELECTED, [inputPicker.val(), evt.data.isPrimary]);
  };

   /**
   * @private
   */
  ns.PaletteController.prototype.createPalette_ = function (colors) {
    // Always adding transparent color
    this.paletteRoot.html('<span class="palette-color transparent-color" data-color="TRANSPARENT" title="Transparent"></span>');
    for(var color in colors) {
      if(color != Constants.TRANSPARENT_COLOR) {
        this.addColorToPalette_(color);
      }
    }
  };

  /**
   * @private
   */
  ns.PaletteController.prototype.addColorToPalette_ = function (color) {
    if (this.paletteColors.indexOf(color) == -1 && color != Constants.TRANSPARENT_COLOR) {
      var colorEl = document.createElement("li");    
      colorEl.className = "palette-color";
      colorEl.setAttribute("data-color", color);
      colorEl.setAttribute("title", color);
      colorEl.style.background = color;
      this.paletteRoot.append(colorEl);
      this.paletteColors.push(color);
    }
  };

  /**
   * @private
   */
  ns.PaletteController.prototype.onPaletteColorClick_ = function (event) {
    var selectedColor = $(event.target).data("color");
    if (event.which == 1) { // left button 
      this.updateColorPicker_(selectedColor, $('#color-picker'));
      $.publish(Events.COLOR_SELECTED, [selectedColor, true]);
    } else if (event.which == 3) { // right button
      this.updateColorPicker_(selectedColor, $('#secondary-color-picker'));
      $.publish(Events.COLOR_SELECTED, [selectedColor, false]);
    }
  };

  /**
   * @private
   */
  ns.PaletteController.prototype.updateColorPicker_ = function (color, colorPicker) {
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

  /**
   * @public
   */
  ns.PaletteController.prototype.init = function(framesheet) {
      
    this.paletteRoot = $("#palette");
    this.framesheet = framesheet;

    // Initialize palette:
    this.createPalette_(this.framesheet.getUsedColors());

    $.subscribe(Events.FRAMESHEET_RESET, $.proxy(function(evt) {
      this.createPalette_(this.framesheet.getUsedColors());
    }, this));

    this.paletteRoot.mouseup($.proxy(this.onPaletteColorClick_, this));
    
    $.subscribe(Events.COLOR_SELECTED, $.proxy(function(evt, color) {
      this.addColorToPalette_(color);
    }, this));

    // Initialize colorpickers:
    var colorPicker = $('#color-picker');
    colorPicker.val(Constants.DEFAULT_PEN_COLOR);
    colorPicker.change({isPrimary : true}, $.proxy(this.onPickerChange_, this));


    var secondaryColorPicker = $('#secondary-color-picker');
    secondaryColorPicker.val(Constants.TRANSPARENT_COLOR);
    secondaryColorPicker.change({isPrimary : false}, $.proxy(this.onPickerChange_, this));

  };
})();



