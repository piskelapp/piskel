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
    $.subscribe(Events.SELECT_PRIMARY_COLOR, this.onColorSelected_.bind(this, {isPrimary:true}));
    $.subscribe(Events.SELECT_SECONDARY_COLOR, this.onColorSelected_.bind(this, {isPrimary:false}));

    pskl.app.shortcutService.addShortcut('X', this.swapColors.bind(this));
    pskl.app.shortcutService.addShortcut('D', this.resetColors.bind(this));

    var spectrumCfg = {
      showPalette: true,
      showButtons: false,
      showInput: true,
      palette: [
        ['rgba(0,0,0,0)']
      ],
      clickoutFiresChange : true,

      beforeShow : function(tinycolor) {
        tinycolor.setAlpha(1);
      }
    };

    // Initialize colorpickers:
    var colorPicker = $('#color-picker');
    colorPicker.spectrum($.extend({color: Constants.DEFAULT_PEN_COLOR}, spectrumCfg));
    colorPicker.change({isPrimary : true}, $.proxy(this.onPickerChange_, this));
    this.setTitleOnPicker_(Constants.DEFAULT_PEN_COLOR, colorPicker);

    var secondaryColorPicker = $('#secondary-color-picker');
    secondaryColorPicker.spectrum($.extend({color: Constants.TRANSPARENT_COLOR}, spectrumCfg));
    secondaryColorPicker.change({isPrimary : false}, $.proxy(this.onPickerChange_, this));
    this.setTitleOnPicker_(Constants.TRANSPARENT_COLOR, secondaryColorPicker);

    var swapColorsIcon = $('.swap-colors-icon');
    swapColorsIcon.click(this.swapColors.bind(this));
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
    $.publish(Events.PRIMARY_COLOR_SELECTED, [color]);
  };

  ns.PaletteController.prototype.setSecondaryColor = function (color) {
    this.secondaryColor = color;
    this.updateColorPicker_(color, $('#secondary-color-picker'));
    $.publish(Events.SECONDARY_COLOR_SELECTED, [color]);
  };

  ns.PaletteController.prototype.getPrimaryColor = function () {
    return this.primaryColor;
  };

  ns.PaletteController.prototype.getSecondaryColor = function () {
    return this.secondaryColor;
  };

  ns.PaletteController.prototype.swapColors = function () {
    var primaryColor = this.getPrimaryColor();
    this.setPrimaryColor(this.getSecondaryColor());
    this.setSecondaryColor(primaryColor);
  };

  ns.PaletteController.prototype.resetColors = function () {
    this.setPrimaryColor(Constants.DEFAULT_PEN_COLOR);
    this.setSecondaryColor(Constants.TRANSPARENT_COLOR);
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
      colorPicker.spectrum("set", Constants.TRANSPARENT_COLOR);
      colorPicker.val(Constants.TRANSPARENT_COLOR);
    } else {
      colorPicker.spectrum("set", color);
    }
    this.setTitleOnPicker_(color, colorPicker);
  };

  ns.PaletteController.prototype.setTitleOnPicker_ = function (title, colorPicker) {
    var spectrumInputSelector = '.sp-replacer';
    colorPicker.next(spectrumInputSelector).attr('title', title);
  };
})();



