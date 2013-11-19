(function () {
  var ns = $.namespace("pskl.controller");

  ns.PaletteController = function () {
    this.primaryColor =  Constants.DEFAULT_PEN_COLOR;
    this.secondaryColor =  Constants.TRANSPARENT_COLOR;
  };

  /**
   * @public
   */
  ns.PaletteController.prototype.init = function() {
    var transparentColorPalette = $(".palette-color[data-color=TRANSPARENT]");
    transparentColorPalette.mouseup($.proxy(this.onPaletteColorClick_, this));

    $.subscribe(Events.SELECT_PRIMARY_COLOR, this.onColorSelected_.bind(this, {isPrimary:true}));
    $.subscribe(Events.SELECT_SECONDARY_COLOR, this.onColorSelected_.bind(this, {isPrimary:false}));
    $.subscribe(Events.SWAP_COLORS, this.onSwapColorsEvent_.bind(this));

    // Initialize colorpickers:
    var colorPicker = $('#color-picker');
    colorPicker.val(this.primaryColor);
    colorPicker.change({isPrimary : true}, $.proxy(this.onPickerChange_, this));


    var secondaryColorPicker = $('#secondary-color-picker');
    secondaryColorPicker.val(this.secondaryColor);
    secondaryColorPicker.change({isPrimary : false}, $.proxy(this.onPickerChange_, this));

    window.jscolor.install();
  };

  /**
   * @private
   */
  ns.PaletteController.prototype.onPickerChange_ = function(evt, isPrimary) {
    var inputPicker = $(evt.target);
    if(evt.data.isPrimary) {
      this.setPrimaryColor(inputPicker.val());
    } else {
      this.setSecondaryColor(inputPicker.val());
    }
  };

  /**
   * @private
   */
  ns.PaletteController.prototype.onColorSelected_ = function(args, evt, color) {
    var inputPicker = $(evt.target);
    if(args.isPrimary) {
      this.setPrimaryColor(color);
    } else {
      this.setSecondaryColor(color);
    }
  };

  ns.PaletteController.prototype.setPrimaryColor = function (color) {
    this.primaryColor = color;
    this.updateColorPicker_(color, $('#color-picker'));
  };

  ns.PaletteController.prototype.setSecondaryColor = function (color) {
    this.secondaryColor = color;
    this.updateColorPicker_(color, $('#secondary-color-picker'));
  };

  ns.PaletteController.prototype.getPrimaryColor = function () {
    return this.primaryColor;
  };

  ns.PaletteController.prototype.getSecondaryColor = function () {
    return this.secondaryColor;
  };

  ns.PaletteController.prototype.onSwapColorsEvent_ = function () {
    var primaryColor = this.getPrimaryColor();
    this.setPrimaryColor(this.getSecondaryColor());
    this.setSecondaryColor(primaryColor);
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
})();



