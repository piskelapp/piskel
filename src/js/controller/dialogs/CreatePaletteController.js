(function () {
  var ns = $.namespace('pskl.controller.dialogs');

  ns.CreatePaletteController = function (piskelController) {
    this.paletteService = pskl.app.paletteService;
    this.paletteImportService = pskl.app.paletteImportService;
    this.selectedIndex = -1;
    this.mode = null;
  };

  pskl.utils.inherit(ns.CreatePaletteController, ns.AbstractDialogController);

  ns.CreatePaletteController.prototype.init = function (paletteId) {
    this.superclass.init.call(this);

    this.colorsList = document.querySelector('.colors-list');
    this.colorPreviewEl = document.querySelector('.color-preview');
    this.hiddenFileInput = document.querySelector('.create-palette-import-input');
    this.nameInput = document.querySelector('input[name="palette-name"]');

    var buttonsContainer = document.querySelector('.create-palette-actions');
    var deleteButton = document.querySelector('.create-palette-delete');
    var downloadButton = document.querySelector('.create-palette-download-button');
    var importFileButton = document.querySelector('.create-palette-import-button');

    this.colorsList.addEventListener('click', this.onColorContainerClick_.bind(this));
    this.nameInput.addEventListener('input', this.onNameInputChange_.bind(this));
    this.hiddenFileInput.addEventListener('change', this.onFileInputChange_.bind(this));

    buttonsContainer.addEventListener('click', this.onButtonClick_.bind(this));
    downloadButton.addEventListener('click', this.onDownloadButtonClick_.bind(this));
    importFileButton.addEventListener('click', this.onImportFileButtonClick_.bind(this));

    $('.colors-list').sortable({
      placeholder: 'colors-list-drop-proxy',
      update: this.onColorDrop_.bind(this),
      items: '.create-palette-color'
    });

    var colorPickerContainer = document.querySelector('.color-picker-container');
    this.hslRgbColorPicker = new pskl.controller.widgets.HslRgbColorPicker(colorPickerContainer, this.onColorUpdated_.bind(this));
    this.hslRgbColorPicker.init();

    var palette;
    var isCurrentColorsPalette = paletteId == Constants.CURRENT_COLORS_PALETTE_ID;
    if (paletteId && !isCurrentColorsPalette) {
      var paletteObject = this.paletteService.getPaletteById(paletteId);
      palette = pskl.model.Palette.fromObject(paletteObject);
      importFileButton.style.display = 'none';
      this.setTitle('Edit Palette');
    } else {
      if (isCurrentColorsPalette) {
        var currentColorsPalette = this.paletteService.getPaletteById(Constants.CURRENT_COLORS_PALETTE_ID);
        var colors = currentColorsPalette.getColors();
        if (!colors.length) {
          colors = ['#000000'];
        }
        palette = new pskl.model.Palette(pskl.utils.Uuid.generate(), 'Current colors clone', colors);
      } else {
        palette = new pskl.model.Palette(pskl.utils.Uuid.generate(), 'New palette', ['#000000']);
      }
      downloadButton.style.display = 'none';
      deleteButton.style.display = 'none';
      this.setTitle('Create Palette');
    }

    this.setPalette_(palette);
  };

  ns.CreatePaletteController.prototype.setPalette_ = function (palette) {
    this.palette = palette;
    this.nameInput.value = pskl.utils.unescapeHtml(this.palette.name);
    this.selectColor_(0);
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
    if (this.palette) {
      this.palette.set(this.selectedIndex, rgbColor);
      this.refreshColorElement_(this.selectedIndex);
    }
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

  ns.CreatePaletteController.prototype.onButtonClick_ = function (evt) {
    var target = evt.target;
    if (target.dataset.action === 'submit') {
      this.saveAndSelectPalette_(this.palette);
      this.closeDialog();
    } else if (target.dataset.action === 'cancel') {
      this.closeDialog();
    } else if (target.dataset.action === 'delete') {
      if (window.confirm('Are you sure you want to delete palette ' + this.palette.name)) {
        this.paletteService.deletePaletteById(this.palette.id);
        pskl.UserSettings.set(pskl.UserSettings.SELECTED_PALETTE, Constants.CURRENT_COLORS_PALETTE_ID);
        this.closeDialog();
      }
    }
  };

  ns.CreatePaletteController.prototype.saveAndSelectPalette_ = function (palette) {
    this.paletteService.savePalette(palette);
    pskl.UserSettings.set(pskl.UserSettings.SELECTED_PALETTE, palette.id);
  };

  ns.CreatePaletteController.prototype.onDownloadButtonClick_ = function () {
    var paletteWriter = new pskl.service.palette.PaletteGplWriter(this.palette);
    var paletteAsString = paletteWriter.write();

    pskl.utils.BlobUtils.stringToBlob(paletteAsString, function(blob) {
      pskl.utils.FileUtils.downloadAsFile(blob, this.palette.name + '.gpl');
    }.bind(this), "application/json");
  };

  ns.CreatePaletteController.prototype.onImportFileButtonClick_ = function () {
    this.hiddenFileInput.click();
  };

  ns.CreatePaletteController.prototype.onFileInputChange_ = function (evt) {
    var files = this.hiddenFileInput.files;
    if (files.length == 1) {
      this.paletteImportService.read(files[0], this.setPalette_.bind(this));
    }
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
    var colors = this.palette.getColors();

    colors.forEach(function (color, index) {
      var isSelected = (index === this.selectedIndex);

      html += pskl.utils.Template.replace(tpl, {
        'color':color, index:index,
        ':selected':isSelected,
        ':light-color':this.isLight_(color)
      });
    }.bind(this));

    html += '<li class="create-palette-new-color">+</li>';

    this.colorsList.innerHTML = html;
  };

  ns.CreatePaletteController.prototype.isLight_ = function (color) {
    var rgb = window.tinycolor(color).toRgb();
    return rgb.r+rgb.b+rgb.g > 128*3;
  };


  ns.CreatePaletteController.prototype.onColorDrop_ = function (evt, drop) {
    var colorElement = drop.item.get(0);

    var oldIndex = parseInt(colorElement.dataset.paletteIndex, 10);
    var newIndex = $('.create-palette-color').index(drop.item);
    this.palette.move(oldIndex, newIndex);

    this.selectedIndex = newIndex;

    this.refresh_();
  };
})();