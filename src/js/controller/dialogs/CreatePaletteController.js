(function () {
  var ns = $.namespace('pskl.controller.dialogs');

  ns.CreatePaletteController = function (piskelController) {
    this.tinyColor = null;
    this.hsvColor = {h:0,s:0,v:0};
    this.palette = [];
    this.selectedIndex = -1;
  };

  pskl.utils.inherit(ns.CreatePaletteController, ns.AbstractDialogController);

  ns.CreatePaletteController.prototype.init = function () {
    this.superclass.init.call(this);

    this.colorsList = document.querySelector('.colors-list');
    this.colorPickerContainer = document.querySelector('.color-picker-container');
    this.colorPreviewEl = document.querySelector('.color-preview');

    this.colorsList.addEventListener('click', this.onColorContainerClick_.bind(this));

    this.hslRgbColorPicker = new pskl.controller.widgets.HslRgbColorPicker(this.colorPickerContainer, this.onColorUpdated_.bind(this));
    this.hslRgbColorPicker.init();

    this.refresh_();
  };

  ns.CreatePaletteController.prototype.onColorUpdated_ = function (color) {
    this.colorPreviewEl.style.background = color.toRgbString();
    this.palette[this.selectedIndex] = color.toRgbString();
    this.refresh_();
  };

  ns.CreatePaletteController.prototype.onColorContainerClick_ = function (evt) {
    var target = evt.target;
    if (target.dataset.paletteIndex) {
      this.selectColor_(target.dataset.paletteIndex);
    } else if (target.classList.contains('add-color-button')) {
      this.palette.push(this.palette[this.selectedIndex] || "#000000");
      this.refresh_();
      this.selectColor_(this.palette.length-1);
    }
  };

  ns.CreatePaletteController.prototype.selectColor_ = function (index) {
    this.selectedIndex = index;

    var previous = this.colorsList.querySelector('.selectedColor');
    if (previous) {
      previous.classList.remove('selected');
    }

    var next = this.colorsList.querySelector('[data-palette-index="'+index+'"]');
    next.classList.add('selected');

    this.hslRgbColorPicker.setColor(this.palette[index]);
  };

  ns.CreatePaletteController.prototype.refresh_ = function () {
    var html = "";
    var tpl = '<div data-palette-index="{{index}}" data-palette-color="{{color}}" style="height:40px;width:40px;float:left; margin:10px;background:{{color}}"></div>';
    this.palette.forEach(function (color, index) {
      html += pskl.utils.Template.replace(tpl, {color:color, index:index});
    });

    html += '<div class=add-color-button style="height:40px;width:40px;margin:10px;float:left; background:gold">ADD</div>';

    this.colorsList.innerHTML = html;
  };
})();