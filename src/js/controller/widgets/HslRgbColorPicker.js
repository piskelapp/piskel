(function () {
  var ns = $.namespace('pskl.controller.widgets');

  ns.HslRgbColorPicker = function (container, colorUpdatedCallback) {
    this.container = container;
    this.colorUpdatedCallback = colorUpdatedCallback;
  };

  ns.HslRgbColorPicker.prototype.init = function () {
    this.container.addEventListener('input', this.onPickerInput_.bind(this));

    this.spectrumEl = this.container.querySelector('.color-picker-spectrum');

    $(this.spectrumEl).spectrum({
        flat: true,
        showInput: true,
        showButtons: false,
        move : this.setColor.bind(this),
        change : this.setColor.bind(this)
    });

    this.setColor("#000000");
  };


  ns.HslRgbColorPicker.prototype.onPickerInput_ = function (evt) {
    var target = evt.target;

    var model = target.dataset.model;
    var dimension = target.dataset.dimension;

    var value = parseInt(target.value, 10);
    if (dimension === 'v' || dimension === 's') {
      value = value/100;
    }

    var color;
    if (model === 'rgb') {
      color = this.tinyColor.toRgb();
    } else if (model === 'hsv') {
      color = this.hsvColor;
    }

    if (isNaN(value)) {
      value = color[dimension];
    } else {
      color[dimension] = value;
    }

    this.setColor(color);
  };

  ns.HslRgbColorPicker.prototype.setColor = function (inputColor) {
    if (!this.unplugged) {
      this.unplugged = true;

      this.hsvColor = this.toHsvColor_(inputColor);
      this.tinyColor = this.toTinyColor_(inputColor);

      this.updateInputs();
      $(".color-picker-spectrum").spectrum("set", this.tinyColor);

      this.colorUpdatedCallback(this.tinyColor);

      this.unplugged = false;
    }
  };

  ns.HslRgbColorPicker.prototype.toTinyColor_ = function (color) {
    if (typeof color == "object" && color.hasOwnProperty("_tc_id")) {
      return color;
    } else {
      return window.tinycolor(JSON.parse(JSON.stringify(color)));
    }
  };

  ns.HslRgbColorPicker.prototype.toHsvColor_ = function (color) {
    var isHsvColor = ['h','s','v'].every(color.hasOwnProperty.bind(color));
    if (isHsvColor) {
      return {
        h : Math.max(0, Math.min(255, color.h)),
        s : Math.max(0, Math.min(1, color.s)),
        v : Math.max(0, Math.min(1, color.v))
      };
    } else {
      return this.toTinyColor_(color).toHsv();
    }
  };

  ns.HslRgbColorPicker.prototype.updateInputs = function () {
    var inputs = this.container.querySelectorAll('input');
    var rgb = this.tinyColor.toRgb();


    for (var i = 0 ; i < inputs.length ; i++) {
      var input = inputs[i];
      var dimension = input.dataset.dimension;
      var model = input.dataset.model;

      if (model === 'rgb') {
        input.value = rgb[dimension];
      } else if (model === 'hsv') {
        var value = this.hsvColor[dimension];
        if (dimension === 'v' || dimension === 's') {
          value = 100 * value;
        }
        input.value = Math.round(value);
      }

      if (input.getAttribute('type') === 'range') {
        this.updateSliderBackground(input);
      }
    }
  };

  ns.HslRgbColorPicker.prototype.updateSliderBackground = function (slider) {
    var dimension = slider.dataset.dimension;
    var model = slider.dataset.model;

    var start, end;
    var isHueSlider = dimension === 'h';
    if (!isHueSlider) {
      if (model === 'hsv') {
        start = JSON.parse(JSON.stringify(this.hsvColor));
        start[dimension] = 0;

        end = JSON.parse(JSON.stringify(this.hsvColor));
        end[dimension] = 1;
      } else {
        start = this.tinyColor.toRgb();
        start[dimension] = 0;

        end = this.tinyColor.toRgb();
        end[dimension] = 255;
      }
      var colorStart = window.tinycolor(start).toRgbString();
      var colorEnd = window.tinycolor(end).toRgbString();
      slider.style.backgroundImage = "linear-gradient(to right, " + colorStart + " 0, " + colorEnd + " 100%)";
    }
  };
})();