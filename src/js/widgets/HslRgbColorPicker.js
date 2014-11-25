(function () {
  var ns = $.namespace('pskl.widgets');

  ns.HslRgbColorPicker = function (container, colorUpdatedCallback) {
    this.container = container;
    this.colorUpdatedCallback = colorUpdatedCallback;
    this.lastInputTimestamp_ = 0;
  };

  ns.HslRgbColorPicker.prototype.init = function () {
    var isChromeOrFirefox = pskl.utils.UserAgent.isChrome || pskl.utils.UserAgent.isFirefox;
    var changeEvent = isChromeOrFirefox ? 'input' : 'change';
    this.container.addEventListener(changeEvent, this.onPickerChange_.bind(this));
    this.container.addEventListener('keydown', this.onKeydown_.bind(this));

    this.spectrumEl = this.container.querySelector('.color-picker-spectrum');

    $(this.spectrumEl).spectrum({
        flat: true,
        showInput: true,
        showButtons: false,
        move : this.setColor.bind(this),
        change : this.setColor.bind(this),
        preferredFormat: 'hex'
    });

    this.setColor("#000000");
  };

  ns.HslRgbColorPicker.prototype.destroy = function () {
    this.container = null;
    this.spectrumEl = null;
  };

  ns.HslRgbColorPicker.prototype.onPickerChange_ = function (evt) {
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

  ns.HslRgbColorPicker.prototype.onKeydown_ = function (evt) {
    var target = evt.target;

    if (target.getAttribute('type').toLowerCase() === 'text') {
      var value = parseInt(target.value, 10);
      var dimension = target.dataset.dimension;

      var key = pskl.service.keyboard.KeycodeTranslator.toChar(evt.keyCode);
      if (key === 'up') {
        value = value + 1;
      } else if (key === 'down') {
        value = value - 1;
      }

      value = this.normalizeDimension_(value, dimension);

      target.value = value;
      this.onPickerChange_(evt);
    }
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
      var colors = this.getSliderBackgroundColors_(model, dimension);
      slider.style.backgroundImage = "linear-gradient(to right, " + colors.start + " 0, " + colors.end + " 100%)";
    }
  };

  ns.HslRgbColorPicker.prototype.getSliderBackgroundColors_ = function (model, dimension) {
    var start, end;
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

    return {
      start : window.tinycolor(start).toRgbString(),
      end : window.tinycolor(end).toRgbString()
    };
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
        h : Math.max(0, Math.min(359, color.h)),
        s : Math.max(0, Math.min(1, color.s)),
        v : Math.max(0, Math.min(1, color.v))
      };
    } else {
      return this.toTinyColor_(color).toHsv();
    }
  };

  ns.HslRgbColorPicker.prototype.normalizeDimension_ = function (value, dimension) {
    var ranges = {
      'h' : [0, 359],
      's' : [0, 100],
      'v' : [0, 100],
      'r' : [0, 255],
      'g' : [0, 255],
      'b' : [0, 255]
    };
    var range = ranges[dimension];
    return Math.max(range[0], Math.min(range[1], value));
  } ;


})();