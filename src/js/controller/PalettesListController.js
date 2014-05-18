(function () {
  var ns = $.namespace('pskl.controller');

  var PRIMARY_COLOR_CLASSNAME = 'palettes-list-primary-color';
  var SECONDARY_COLOR_CLASSNAME = 'palettes-list-secondary-color';

  var HAS_SCROLL_CLASSNAME = 'palettes-list-has-scrollbar';
  // well ... I know that if there are more than 20 colors, a scrollbar will be displayed
  // It's linked to the max-height: 160px; defined in toolbox-palette-list.css !
  // I apologize to my future self for this one.
  var NO_SCROLL_MAX_COLORS = 20;

  var MAX_COLORS = 100;

  ns.PalettesListController = function (paletteController, usedColorService) {
    this.usedColorService = usedColorService;
    this.paletteController = paletteController;
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
    $.subscribe(Events.CURRENT_COLORS_UPDATED, this.fillColorListContainer.bind(this));
    $.subscribe(Events.PRIMARY_COLOR_SELECTED, this.highlightSelectedColors.bind(this));
    $.subscribe(Events.SECONDARY_COLOR_SELECTED, this.highlightSelectedColors.bind(this));

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
    var paletteId = this.colorPaletteSelect_.value;
    if (paletteId === Constants.CURRENT_COLORS_PALETTE_ID) {
      colors = this.usedColorService.getCurrentColors();
    } else {
      var palette = this.getPaletteById(paletteId, this.retrievePalettes());
      if (palette) {
        colors = palette.colors;
      }
    }

    if (colors.length > MAX_COLORS) {
      colors = colors.slice(0, MAX_COLORS);
    }

    return colors;
  };

  ns.PalettesListController.prototype.selectPalette = function (paletteId) {
    this.colorPaletteSelect_.value = paletteId;
  };

  ns.PalettesListController.prototype.selectPaletteFromUserSettings = function () {
    this.selectPalette(pskl.UserSettings.get(pskl.UserSettings.SELECTED_PALETTE));
  };

  ns.PalettesListController.prototype.onPaletteSelected_ = function (evt) {
    var paletteId = this.colorPaletteSelect_.value;
    if (paletteId === Constants.MANAGE_PALETTE_ID) {
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