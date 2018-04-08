(function () {
  var ns = $.namespace('pskl.controller');

  /**
   * The PaletteController is responsible for handling the two color picker
   * widgets found in the left column, below the tools.
   */
  ns.PaletteController = function () {};

  /**
   * @public
   */
  ns.PaletteController.prototype.init = function() {
    $.subscribe(Events.SELECT_PRIMARY_COLOR, this.onColorSelected_.bind(this, {isPrimary : true}));
    $.subscribe(Events.SELECT_SECONDARY_COLOR, this.onColorSelected_.bind(this, {isPrimary : false}));

    var shortcuts = pskl.service.keyboard.Shortcuts;
    pskl.app.shortcutService.registerShortcut(shortcuts.COLOR.SWAP, this.swapColors.bind(this));
    pskl.app.shortcutService.registerShortcut(shortcuts.COLOR.RESET, this.resetColors.bind(this));

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
    colorPicker.change({isPrimary : true}, this.onPickerChange_.bind(this));
    this.setTitleOnPicker_(Constants.DEFAULT_PEN_COLOR, colorPicker.get(0));

    var secondaryColorPicker = $('#secondary-color-picker');
    secondaryColorPicker.spectrum($.extend({color: Constants.TRANSPARENT_COLOR}, spectrumCfg));
    secondaryColorPicker.change({isPrimary : false}, this.onPickerChange_.bind(this));
    this.setTitleOnPicker_(Constants.TRANSPARENT_COLOR, secondaryColorPicker.get(0));

    var swapColorsIcon = document.querySelector('.swap-colors-button');
    swapColorsIcon.addEventListener('click', this.swapColors.bind(this));
  };

  /**
   * @private
   */
  ns.PaletteController.prototype.onPickerChange_ = function(evt) {
    var inputPicker = evt.target;
    var color = inputPicker.value;

    if (color != Constants.TRANSPARENT_COLOR) {
      // Unless the color is TRANSPARENT_COLOR, format it to hexstring, as
      // expected by the rest of the application.
      color = window.tinycolor(color).toHexString();
    }

    if (evt.data.isPrimary) {
      this.setPrimaryColor_(color);
    } else {
      this.setSecondaryColor_(color);
    }
  };

  /**
   * @private
   */
  ns.PaletteController.prototype.onColorSelected_ = function(args, evt, color) {
    if (args.isPrimary) {
      this.setPrimaryColor_(color);
    } else {
      this.setSecondaryColor_(color);
    }
  };

  ns.PaletteController.prototype.setPrimaryColor_ = function (color) {
    this.updateColorPicker_(color, document.querySelector('#color-picker'));
    $.publish(Events.PRIMARY_COLOR_SELECTED, [color]);
  };

  ns.PaletteController.prototype.setSecondaryColor_ = function (color) {
    this.updateColorPicker_(color, document.querySelector('#secondary-color-picker'));
    $.publish(Events.SECONDARY_COLOR_SELECTED, [color]);
  };

  ns.PaletteController.prototype.swapColors = function () {
    var primaryColor = pskl.app.selectedColorsService.getPrimaryColor();
    this.setPrimaryColor_(pskl.app.selectedColorsService.getSecondaryColor());
    this.setSecondaryColor_(primaryColor);
  };

  ns.PaletteController.prototype.resetColors = function () {
    this.setPrimaryColor_(Constants.DEFAULT_PEN_COLOR);
    this.setSecondaryColor_(Constants.TRANSPARENT_COLOR);
  };

  /**
   * @private
   */
  ns.PaletteController.prototype.updateColorPicker_ = function (color, colorPicker) {
    var jqueryColorPicker = $(colorPicker);
    if (color == Constants.TRANSPARENT_COLOR) {
      // We can set the current palette color to transparent.
      // You can then combine this transparent color with an advanced
      // tool for customized deletions.
      // Eg: bucket + transparent: Delete a colored area
      //     Stroke + transparent: hollow out the equivalent of a stroke

      // The colorpicker can't be set to a transparent state.
      // We set its background to white and insert the
      // string "TRANSPARENT" to mimic this state:
      jqueryColorPicker.spectrum('set', Constants.TRANSPARENT_COLOR);
      colorPicker.value = Constants.TRANSPARENT_COLOR;
    } else {
      jqueryColorPicker.spectrum('set', color);
    }
    this.setTitleOnPicker_(color, colorPicker);
  };

  ns.PaletteController.prototype.setTitleOnPicker_ = function (title, colorPicker) {
    var parent = colorPicker.parentNode;
    title = parent.dataset.initialTitle + '<br/>' + title;
    parent.dataset.originalTitle = title;
  };
})();
