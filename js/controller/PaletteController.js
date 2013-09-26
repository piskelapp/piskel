(function () {
  var ns = $.namespace("pskl.controller");

  ns.PaletteController = function () {};

  /**
   * @public
   */
  ns.PaletteController.prototype.init = function() {
    var transparentColorPalette = $(".palette-color[data-color=TRANSPARENT]");
    transparentColorPalette.mouseup($.proxy(this.onPaletteColorClick_, this));

    $.subscribe(Events.PRIMARY_COLOR_UPDATED, $.proxy(function(evt, color) {
      this.updateColorPicker_(color, $('#color-picker'));
    }, this));

    $.subscribe(Events.SECONDARY_COLOR_UPDATED, $.proxy(function(evt, color) {
      this.updateColorPicker_(color, $('#secondary-color-picker'));
    }, this));

    // Initialize colorpickers:
    var colorPicker = $('#color-picker');
    colorPicker.val(Constants.DEFAULT_PEN_COLOR);
    colorPicker.change({isPrimary : true}, $.proxy(this.onPickerChange_, this));


    var secondaryColorPicker = $('#secondary-color-picker');
    secondaryColorPicker.val(Constants.TRANSPARENT_COLOR);
    secondaryColorPicker.change({isPrimary : false}, $.proxy(this.onPickerChange_, this));

    window.jscolor.install();
  };

  /**
   * @private
   */
  ns.PaletteController.prototype.onPickerChange_ = function(evt, isPrimary) {
    var inputPicker = $(evt.target);
    if(evt.data.isPrimary) {
      $.publish(Events.PRIMARY_COLOR_SELECTED, [inputPicker.val()]);
    } else {
      $.publish(Events.SECONDARY_COLOR_SELECTED, [inputPicker.val()]);
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
})();



