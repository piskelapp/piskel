(function () {
  var ns = $.namespace('pskl.controller');

  var PRIMARY_COLOR_CLASSNAME = 'palettes-list-primary-color';
  var SECONDARY_COLOR_CLASSNAME = 'palettes-list-secondary-color';

  var HAS_SCROLL_CLASSNAME = 'palettes-list-has-scrollbar';
  // well ... I know that if there are more than 20 colors, a scrollbar will be displayed
  // It's linked to the max-height: 160px; defined in toolbox-palette-list.css !
  // I apologize to my future self for this one.
  var NO_SCROLL_MAX_COLORS = 20;


  ns.PalettesListController = function (paletteController, usedColorService) {
    this.usedColorService = usedColorService;
    this.paletteService = pskl.app.paletteService;
    this.paletteController = paletteController;
  };

  ns.PalettesListController.prototype.init = function () {
    this.paletteColorTemplate_ = pskl.utils.Template.get('palette-color-template');

    this.colorListContainer_ = document.querySelector('.palettes-list-colors');
    this.colorPaletteSelect_ = document.querySelector('.palettes-list-select');

    var createPaletteButton_ = document.querySelector('.create-palette-button');
    var paletteActions = document.querySelector('.palette-actions');

    this.colorPaletteSelect_.addEventListener('change', this.onPaletteSelected_.bind(this));
    this.colorListContainer_.addEventListener('mouseup', this.onColorContainerMouseup.bind(this));
    this.colorListContainer_.addEventListener('contextmenu', this.onColorContainerContextMenu.bind(this));

    createPaletteButton_.addEventListener('click', this.onCreatePaletteClick_.bind(this));
    paletteActions.addEventListener('click', this.onPaletteActionsClick_.bind(this));


    $.subscribe(Events.PALETTE_LIST_UPDATED, this.onPaletteListUpdated.bind(this));
    $.subscribe(Events.CURRENT_COLORS_UPDATED, this.fillColorListContainer.bind(this));
    $.subscribe(Events.PRIMARY_COLOR_SELECTED, this.highlightSelectedColors.bind(this));
    $.subscribe(Events.SECONDARY_COLOR_SELECTED, this.highlightSelectedColors.bind(this));
    $.subscribe(Events.USER_SETTINGS_CHANGED, $.proxy(this.onUserSettingsChange_, this));

    this.fillPaletteList();
    this.updateFromUserSettings();
    this.fillColorListContainer();
  };

  ns.PalettesListController.prototype.fillPaletteList = function () {
    var palettes = [{
      id : Constants.CURRENT_COLORS_PALETTE_ID,
      name : 'Current colors'
    }];
    palettes = palettes.concat(this.paletteService.getPalettes());

    var html = palettes.map(function (palette) {
      return pskl.utils.Template.replace('<option value="{{id}}">{{name}}</option>', palette);
    }).join('');
    this.colorPaletteSelect_.innerHTML = html;
  };

  ns.PalettesListController.prototype.fillColorListContainer = function () {
    var colors = this.getSelectedPaletteColors_();

    var html = colors.map(function (color) {
      return pskl.utils.Template.replace(this.paletteColorTemplate_, {color : color});
    }.bind(this)).join('');
    this.colorListContainer_.innerHTML = html;

    this.highlightSelectedColors();

    var hasScrollbar = colors.length > NO_SCROLL_MAX_COLORS;
    if (hasScrollbar && !pskl.utils.UserAgent.isChrome) {
      this.colorListContainer_.classList.add(HAS_SCROLL_CLASSNAME);
    } else {
      this.colorListContainer_.classList.remove(HAS_SCROLL_CLASSNAME);
    }
  };

  ns.PalettesListController.prototype.getSelectedPaletteColors_ = function () {
    var colors = [];
    var paletteId = pskl.UserSettings.get(pskl.UserSettings.SELECTED_PALETTE);
    if (paletteId === Constants.CURRENT_COLORS_PALETTE_ID) {
      colors = this.usedColorService.getCurrentColors();
    } else {
      var palette = this.paletteService.getPaletteById(paletteId);
      if (palette) {
        colors = palette.colors;
      }
    }

    if (colors.length > Constants.MAX_CURRENT_COLORS_DISPLAYED) {
      colors = colors.slice(0, Constants.MAX_CURRENT_COLORS_DISPLAYED);
    }

    return colors;
  };

  ns.PalettesListController.prototype.selectPalette = function (paletteId) {
    pskl.UserSettings.set(pskl.UserSettings.SELECTED_PALETTE, paletteId);
  };

  ns.PalettesListController.prototype.onUserSettingsChange_ = function (evt, name, value) {
    if (name == pskl.UserSettings.SELECTED_PALETTE) {
      this.updateFromUserSettings();
    }
  };

  ns.PalettesListController.prototype.updateFromUserSettings = function () {
    var paletteId = pskl.UserSettings.get(pskl.UserSettings.SELECTED_PALETTE);
    this.fillColorListContainer();
    this.colorPaletteSelect_.value = paletteId;
  };

  ns.PalettesListController.prototype.onPaletteSelected_ = function (evt) {
    var paletteId = this.colorPaletteSelect_.value;
    this.selectPalette(paletteId);
  };

  ns.PalettesListController.prototype.onCreatePaletteClick_ = function (evt) {
    $.publish(Events.DIALOG_DISPLAY, 'create-palette');
  };

  ns.PalettesListController.prototype.onPaletteActionsClick_ = function (evt) {
    var classList = evt.target.classList;
    if (classList.contains('palette-action-edit')) {
      this.editSelectedPalette_();
    } else if (classList.contains('palette-action-delete')) {
      this.deleteSelectedPalette_();
    } else if (classList.contains('palette-action-download')) {
      this.downloadSelectedPalette_();
    }
  };

  ns.PalettesListController.prototype.editSelectedPalette_ = function () {
    var paletteId = this.colorPaletteSelect_.value;
    $.publish(Events.DIALOG_DISPLAY, {
      dialogId : 'create-palette',
      initArgs : paletteId
    });
  };

  ns.PalettesListController.prototype.deleteSelectedPalette_ = function () {
    var paletteId = this.colorPaletteSelect_.value;
    var palette = this.paletteService.getPaletteById(paletteId);
    if (window.confirm('Are you sure you want to delete palette ' + palette.name)) {
      this.paletteService.deletePaletteById(palette.id);
      this.selectPalette(Constants.CURRENT_COLORS_PALETTE_ID);
    }
  };

  ns.PalettesListController.prototype.downloadSelectedPalette_ = function () {
    // getSelectedPalette
    var paletteId = this.colorPaletteSelect_.value;
    var palette = this.paletteService.getPaletteById(paletteId);

    var paletteWriter = new pskl.service.palette.PaletteGplWriter(palette);
    var paletteAsString = paletteWriter.write();

    pskl.utils.BlobUtils.stringToBlob(paletteAsString, function(blob) {
      pskl.utils.FileUtils.downloadAsFile(blob, palette.name + '.gpl');
    }.bind(this), "application/json");
  };

  ns.PalettesListController.prototype.onColorContainerContextMenu = function (event) {
    event.preventDefault();
  };

  ns.PalettesListController.prototype.onColorContainerMouseup = function (event) {
    var target = event.target;
    var color = target.dataset.color;

    if (color) {
      if (event.button == Constants.LEFT_BUTTON) {
        $.publish(Events.SELECT_PRIMARY_COLOR, [color]);
      } else if (event.button == Constants.RIGHT_BUTTON) {
        $.publish(Events.SELECT_SECONDARY_COLOR, [color]);
      }
    }
  };

  ns.PalettesListController.prototype.highlightSelectedColors = function () {
    this.removeClass_(PRIMARY_COLOR_CLASSNAME);
    this.removeClass_(SECONDARY_COLOR_CLASSNAME);

    var colorContainer = this.getColorContainer_(this.paletteController.getSecondaryColor());
    if (colorContainer) {
      colorContainer.classList.remove(PRIMARY_COLOR_CLASSNAME);
      colorContainer.classList.add(SECONDARY_COLOR_CLASSNAME);
    }

    colorContainer = this.getColorContainer_(this.paletteController.getPrimaryColor());
    if (colorContainer) {
      colorContainer.classList.remove(SECONDARY_COLOR_CLASSNAME);
      colorContainer.classList.add(PRIMARY_COLOR_CLASSNAME);
    }
  };

  ns.PalettesListController.prototype.getColorContainer_ = function (color) {
    return this.colorListContainer_.querySelector('.palettes-list-color[data-color="'+color+'"]');
  };

  ns.PalettesListController.prototype.removeClass_ = function (cssClass) {
    var element = document.querySelector('.' + cssClass);
    if (element) {
      element.classList.remove(cssClass);
    }
  };

  ns.PalettesListController.prototype.onPaletteListUpdated = function () {
    this.fillPaletteList();
    this.updateFromUserSettings();
  };
})();