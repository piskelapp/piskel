(function () {
  var ns = $.namespace('pskl.controller.dialogs');

  ns.CreatePaletteController = function (piskelController) {
    this.paletteService = pskl.app.paletteService;
    this.selectedIndex = -1;
  };

  pskl.utils.inherit(ns.CreatePaletteController, ns.AbstractDialogController);

  ns.CreatePaletteController.prototype.init = function (paletteId) {
    this.superclass.init.call(this);

    if (paletteId) {
      var palette = this.paletteService.getPaletteById(paletteId);
      this.palette = pskl.model.Palette.fromObject(palette);
    } else {
      paletteId =  pskl.utils.Uuid.generate();
      this.palette = new pskl.model.Palette(paletteId, 'New palette', []);
    }

    this.colorsList = document.querySelector('.colors-list');
    this.colorPreviewEl = document.querySelector('.color-preview');
    this.nameInput = document.querySelector('input[name="palette-name"]');
    this.nameInput.value = pskl.utils.unescapeHtml(this.palette.name);

    var submitButton = document.querySelector('.create-palette-submit');
    var cancelButton = document.querySelector('.create-palette-cancel');

    this.colorsList.addEventListener('click', this.onColorContainerClick_.bind(this));
    this.nameInput.addEventListener('input', this.onNameInputChange_.bind(this));

    submitButton.addEventListener('click', this.onSubmitButtonClick_.bind(this));
    cancelButton.addEventListener('click', this.closeDialog.bind(this));

    var colorPickerContainer = document.querySelector('.color-picker-container');
    this.hslRgbColorPicker = new pskl.controller.widgets.HslRgbColorPicker(colorPickerContainer, this.onColorUpdated_.bind(this));
    this.hslRgbColorPicker.init();

    this.refresh_();
  };

  ns.CreatePaletteController.prototype.destroy = function () {
    this.colorsList = null;
    this.colorPreviewEl = null;
    this.nameInput = null;
  };

  ns.CreatePaletteController.prototype.onColorUpdated_ = function (color) {
    var rgbColor = color.toRgbString();
    this.colorPreviewEl.style.background = rgbColor;
    this.palette.set(this.selectedIndex, rgbColor);

    this.refreshColorElement_(this.selectedIndex);
  };

  /**
   * Lightweight refresh only changing the color of one element of the palette color list
   */
  ns.CreatePaletteController.prototype.refreshColorElement_ = function (index) {
    var color = this.palette.get(this.selectedIndex);
    var element = document.querySelector('[data-palette-index="'+index+'"]');
    if (element) {
      element.style.background = color;
      element.classList.toggle('light-color', this.isLight_(color));
    }
  };

  ns.CreatePaletteController.prototype.onColorContainerClick_ = function (evt) {
    var target = evt.target;
    if (target.classList.contains('create-palette-color')) {
      this.onPaletteColorClick_(evt, target);
    } else if (target.classList.contains('create-palette-new-color')) {
      this.onNewColorClick_(evt, target);
    } else if (target.classList.contains('create-palette-remove-color')) {
      this.onRemoveColorClick_(evt, target);
    }
    this.refresh_();
  };

  ns.CreatePaletteController.prototype.onPaletteColorClick_ = function (evt, target) {
    var index = parseInt(target.dataset.paletteIndex,10);
    this.selectColor_(index);
  };

  ns.CreatePaletteController.prototype.onRemoveColorClick_ = function (evt, target) {
    var colorElement = target.parentNode;
    var index = parseInt(colorElement.dataset.paletteIndex,10);
    this.removeColor_(index);
  };

  ns.CreatePaletteController.prototype.onNewColorClick_ = function (evt, target) {
    var newColor = this.palette.get(this.selectedIndex) || '#000000';
    this.palette.add(newColor);
    this.selectColor_(this.palette.size()-1);
  };

  ns.CreatePaletteController.prototype.onSubmitButtonClick_ = function (evt) {
    this.paletteService.savePalette(this.palette);
    this.closeDialog();
  };

  ns.CreatePaletteController.prototype.onNameInputChange_ = function (evt) {
    this.palette.name = pskl.utils.escapeHtml(this.nameInput.value);
  };

  ns.CreatePaletteController.prototype.selectColor_ = function (index) {
    this.selectedIndex = index;
    this.hslRgbColorPicker.setColor(this.palette.get(index));
  };

  ns.CreatePaletteController.prototype.removeColor_ = function (index) {
    this.palette.removeAt(index);
    this.refresh_();
  };

  ns.CreatePaletteController.prototype.refresh_ = function () {
    var html = "";
    var tpl = pskl.utils.Template.get('create-palette-color-template');
    var colors = this.palette.colors;

    colors.forEach(function (color, index) {
      var isSelected = (index === this.selectedIndex);

      html += pskl.utils.Template.replace(tpl, {
        color:color, index:index,
        ':selected':isSelected,
        ':light-color':this.isLight_(color)
      });
    }.bind(this));

    html += '<li class="create-palette-new-color">+</li>';

    this.colorsList.innerHTML = html;

    $('.colors-list').sortable({
      placeholder: 'colors-list-drop-proxy',
      update: this.onDrop_.bind(this),
      items: '.create-palette-color'
    });
  };

  ns.CreatePaletteController.prototype.isLight_ = function (color) {
    var rgb = window.tinycolor(color).toRgb();
    return rgb.r+rgb.b+rgb.g > 128*3;
  };


  ns.CreatePaletteController.prototype.onDrop_ = function (evt, drop) {
    var colorElement = drop.item.get(0);

    var oldIndex = parseInt(colorElement.dataset.paletteIndex, 10);
    var newIndex = $('.create-palette-color').index(drop.item);
    this.palette.move(oldIndex, newIndex);

    this.selectedIndex = newIndex;

    this.refresh_();
  };
})();