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
    if(evt.data.isPrimary) {
      $.publish(Events.PRIMARY_COLOR_SELECTED, [inputPicker.val()]);
    }
    else {
      $.publish(Events.SECONDARY_COLOR_SELECTED, [inputPicker.val()]);
    }
  };
  
  /**
   * @private
   */
  ns.PaletteController.prototype.addColorToPalette_ = function (color) {
    if (this.paletteColors.indexOf(color) == -1 && color != Constants.TRANSPARENT_COLOR) {
      this.paletteColors.push(color);
    }
  };

  /**
   * @private
   */
  ns.PaletteController.prototype.addColorsToPalette_ = function (colors) {
    for(var color in colors) {
      this.addColorToPalette_(color);
    }
  };

  /**
   * @private
   */
  ns.PaletteController.prototype.onPaletteColorClick_ = function (event) {
    var selectedColor = $(event.target).data("color");
    var isLeftClick = (event.which == 1);
    var isRightClick = (event.which == 3);
    if (isLeftClick) {
      $.publish(Events.PRIMARY_COLOR_SELECTED, [selectedColor]);
    } else if (isRightClick) {
      $.publish(Events.SECONDARY_COLOR_SELECTED, [selectedColor]);
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
    this.addColorsToPalette_(this.framesheet.getUsedColors());

    $.subscribe(Events.FRAMESHEET_RESET, $.proxy(function(evt) {
      this.addColorsToPalette_(this.framesheet.getUsedColors());
    }, this));

    this.paletteRoot.mouseup($.proxy(this.onPaletteColorClick_, this));
    
    $.subscribe(Events.PRIMARY_COLOR_UPDATED, $.proxy(function(evt, color) {
      this.updateColorPicker_(color, $('#color-picker'));
      this.addColorToPalette_(color);
    }, this));

    $.subscribe(Events.SECONDARY_COLOR_UPDATED, $.proxy(function(evt, color) {
      this.updateColorPicker_(color, $('#secondary-color-picker'));
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



