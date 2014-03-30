(function () {
  var ns = $.namespace('pskl.controller');

  ns.PalettesListController = function () {

  };

  ns.PalettesListController.prototype.init = function () {
    this.paletteColorTemplate_ = pskl.utils.Template.get('palette-color-template');
    this.colorListContainer_ = document.querySelector('.palettes-list-colors');
    this.colorPaletteSelect_ = document.querySelector('.palettes-list-select');
    this.paletteListOptGroup_ = document.querySelector('.palettes-list-select-group');

    this.colorPaletteSelect_.addEventListener('change', this.onPaletteSelected_.bind(this));
    this.colorListContainer_.addEventListener('mouseup', this.onColorContainerMouseup.bind(this));
    this.colorListContainer_.addEventListener('contextmenu', this.onColorContainerContextMenu.bind(this));

    $.subscribe(Events.PALETTE_LIST_UPDATED, this.onPaletteListUpdated.bind(this));
    $.subscribe(Events.PRIMARY_COLOR_SELECTED, this.onColorUpdated.bind(this, 'primary'));
    $.subscribe(Events.SECONDARY_COLOR_SELECTED, this.onColorUpdated.bind(this, 'secondary'));

    this.fillPaletteList();
    this.selectPaletteFromUserSettings();
    this.fillColorListContainer();
  };

  ns.PalettesListController.prototype.fillPaletteList = function () {
    var palettes = [{
      id : Constants.NO_PALETTE_ID,
      name : 'No palette'
    }];
    palettes = palettes.concat(this.retrievePalettes());

    var html = palettes.map(function (palette) {
      return pskl.utils.Template.replace('<option value="{{id}}">{{name}}</option>', palette);
    }).join('');
    this.paletteListOptGroup_.innerHTML = html;
  };

  ns.PalettesListController.prototype.fillColorListContainer = function () {
    var html = '';

    var palette = this.getSelectedPalette();
    if (palette) {
      html = palette.colors.map(function (color) {
        return pskl.utils.Template.replace(this.paletteColorTemplate_, {color : color});
      }.bind(this)).join('');
    }

    this.colorListContainer_.innerHTML = html;
  };

  ns.PalettesListController.prototype.getSelectedPalette = function (evt) {
    var paletteId = this.colorPaletteSelect_.value;
    var palettes = this.retrievePalettes();
    var palette = this.getPaletteById(paletteId, palettes);
    return palette;
  };

  ns.PalettesListController.prototype.selectPalette = function (paletteId) {
    this.colorPaletteSelect_.value = paletteId;
  };

  ns.PalettesListController.prototype.selectPaletteFromUserSettings = function () {
    this.selectPalette(pskl.UserSettings.get(pskl.UserSettings.SELECTED_PALETTE));
  };

  ns.PalettesListController.prototype.onPaletteSelected_ = function (evt) {
    var paletteId = this.colorPaletteSelect_.value;
    if (paletteId === '__manage-palettes') {
      $.publish(Events.DIALOG_DISPLAY, 'manage-palettes');
      this.selectPaletteFromUserSettings();
    } else {
      pskl.UserSettings.set(pskl.UserSettings.SELECTED_PALETTE, paletteId);
    }

    this.fillColorListContainer();
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

  ns.PalettesListController.prototype.onColorUpdated = function (type, event, color) {
    console.log('[PalettesListController] >>> ', arguments);

    var colorContainer = this.colorListContainer_.querySelector('.palettes-list-color[data-color="'+color+'"]');

    // Color is not in the currently selected palette
    if (!colorContainer) {
      return;
    }

    if (type === 'primary') {
      this.removeClass_('primary', '.palettes-list-color');
      colorContainer.classList.add('primary');
      colorContainer.classList.remove('secondary');
    } else if (type === 'secondary') {
      this.removeClass_('secondary', '.palettes-list-color');
      colorContainer.classList.add('secondary');
      colorContainer.classList.remove('primary');
    }
  };

  ns.PalettesListController.prototype.removeClass_ = function (cssClass, selector) {
    var element = document.querySelector(selector + '.' + cssClass);
    if (element) {
      element.classList.remove(cssClass);
    }
  };

  ns.PalettesListController.prototype.onPaletteListUpdated = function () {
    this.fillPaletteList();
    this.selectPaletteFromUserSettings();
    this.fillColorListContainer();
  };

  ns.PalettesListController.prototype.getPaletteById = function (paletteId, palettes) {
    var match = null;

    palettes.forEach(function (palette) {
      if (palette.id === paletteId) {
        match = palette;
      }
    });

    return match;
  };

  ns.PalettesListController.prototype.retrievePalettes =  function () {
    var palettesString = window.localStorage.getItem('piskel.palettes');
    return JSON.parse(palettesString) || [];
  };
})();