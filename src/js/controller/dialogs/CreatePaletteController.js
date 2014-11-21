(function () {
  var ns = $.namespace('pskl.controller.dialogs');

  ns.CreatePaletteController = function (piskelController) {
    this.paletteService = pskl.app.paletteService;
    this.paletteImportService = pskl.app.paletteImportService;
  };

  pskl.utils.inherit(ns.CreatePaletteController, ns.AbstractDialogController);

  ns.CreatePaletteController.prototype.init = function (paletteId) {
    this.superclass.init.call(this);

    this.hiddenFileInput = document.querySelector('.create-palette-import-input');
    this.nameInput = document.querySelector('input[name="palette-name"]');

    var buttonsContainer = document.querySelector('.create-palette-actions');
    var deleteButton = document.querySelector('.create-palette-delete');
    var downloadButton = document.querySelector('.create-palette-download-button');
    var importFileButton = document.querySelector('.create-palette-import-button');

    this.nameInput.addEventListener('input', this.onNameInputChange_.bind(this));
    this.hiddenFileInput.addEventListener('change', this.onFileInputChange_.bind(this));

    buttonsContainer.addEventListener('click', this.onButtonClick_.bind(this));
    downloadButton.addEventListener('click', this.onDownloadButtonClick_.bind(this));
    importFileButton.addEventListener('click', this.onImportFileButtonClick_.bind(this));

    var colorsListContainer = document.querySelector('.colors-container');
    this.colorsListWidget = new pskl.widgets.ColorsList(colorsListContainer);

    var palette;
    var isCurrentColorsPalette = paletteId == Constants.CURRENT_COLORS_PALETTE_ID;
    if (paletteId && !isCurrentColorsPalette) {
      importFileButton.style.display = 'none';
      this.setTitle('Edit Palette');

      var paletteObject = this.paletteService.getPaletteById(paletteId);
      palette = pskl.model.Palette.fromObject(paletteObject);
    } else {
      downloadButton.style.display = 'none';
      deleteButton.style.display = 'none';
      this.setTitle('Create Palette');

      var uuid = pskl.utils.Uuid.generate();
      if (isCurrentColorsPalette) {
        palette = new pskl.model.Palette(uuid, 'Current colors clone', this.getCurrentColors_());
      } else {
        palette = new pskl.model.Palette(uuid, 'New palette', []);
      }
    }

    this.setPalette_(palette);
  };

  ns.CreatePaletteController.prototype.getCurrentColors_ = function () {
    var palette = this.paletteService.getPaletteById(Constants.CURRENT_COLORS_PALETTE_ID);
    return palette.getColors();
  };

  ns.CreatePaletteController.prototype.setPalette_ = function (palette) {
    this.palette = palette;
    this.nameInput.value = pskl.utils.unescapeHtml(palette.name);
    this.colorsListWidget.setColors(palette.getColors());
  };

  ns.CreatePaletteController.prototype.destroy = function () {
    this.colorsListWidget.destroy();
    this.nameInput = null;
  };

  ns.CreatePaletteController.prototype.onButtonClick_ = function (evt) {
    var target = evt.target;
    if (target.dataset.action === 'submit') {
      this.saveAndSelectPalette_();
    } else if (target.dataset.action === 'cancel') {
      this.closeDialog();
    } else if (target.dataset.action === 'delete') {
      this.deletePalette_();
    }
  };

  ns.CreatePaletteController.prototype.saveAndSelectPalette_ = function () {
    this.palette.setColors(this.colorsListWidget.getColors());
    this.paletteService.savePalette(this.palette);
    pskl.UserSettings.set(pskl.UserSettings.SELECTED_PALETTE, this.palette.id);
    this.closeDialog();
  };

  ns.CreatePaletteController.prototype.deletePalette_ = function () {
    if (window.confirm('Are you sure you want to delete palette ' + this.palette.name)) {
      this.paletteService.deletePaletteById(this.palette.id);
      pskl.UserSettings.set(pskl.UserSettings.SELECTED_PALETTE, Constants.CURRENT_COLORS_PALETTE_ID);
      this.closeDialog();
    }
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
      this.paletteImportService.read(files[0], this.setPalette_.bind(this), this.displayErrorMessage_.bind(this));
    }
  };

  ns.CreatePaletteController.prototype.displayErrorMessage_ = function (message) {
    message = "Could not import palette : " + message;
    $.publish(Events.SHOW_NOTIFICATION, [{"content": message}]);
    window.setTimeout($.publish.bind($, Events.HIDE_NOTIFICATION), 2000);
  };

  ns.CreatePaletteController.prototype.onNameInputChange_ = function (evt) {
    this.palette.name = pskl.utils.escapeHtml(this.nameInput.value);
  };
})();