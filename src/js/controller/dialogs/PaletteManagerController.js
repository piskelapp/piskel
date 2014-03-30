(function () {
  var ns = $.namespace('pskl.controller.dialogs');

  var tinycolor = window.tinycolor;

  var SELECTED_CLASSNAME = 'selected';
  var NEW_COLOR_CLASS = 'palette-manager-new-color';
  var CLOSE_ICON_CLASS = 'palette-manager-delete-card';
  var EDIT_NAME_CLASS = 'palette-manager-details-head-edit-icon';

  ns.PaletteManagerController = function (piskelController) {
    this.piskelController = piskelController;
    this.palettes = this.retrieveUserPalettes();
    this.originalPalettes = this.retrieveUserPalettes();
    this.selectedPaletteId = null;
  };

  ns.PaletteManagerController.prototype.init = function () {
    this.palettesList = document.querySelector('.palette-manager-list');
    this.paletteBody = document.querySelector('.palette-manager-details-body');
    this.paletteHead = document.querySelector('.palette-manager-details-head');
    this.createButton = document.querySelector('.palette-manager-actions-button[data-action="create"]');
    this.saveAllButton = document.querySelector('.palette-manager-actions-button[data-action="save-all"]');
    this.closeButton = document.querySelector('.palette-manager-close');

    this.colorCardTemplate = pskl.utils.Template.get('palette-color-card-template');
    this.newColorTemplate = pskl.utils.Template.get('palette-new-color-template');
    this.paletteHeadTemplate = pskl.utils.Template.get('palette-details-head-template');

    // Events
    this.palettesList.addEventListener('click', this.onPaletteListClick.bind(this));
    // Delegated event listener for events repeated on all cards
    this.paletteBody.addEventListener('click', this.delegatedPaletteBodyClick.bind(this));
    this.paletteHead.addEventListener('click', this.delegatedPaletteHeadClick.bind(this));
    this.createButton.addEventListener('click', this.createPalette.bind(this));
    this.saveAllButton.addEventListener('click', this.saveAll.bind(this));
    this.closeButton.addEventListener('click', this.closeDialog.bind(this));

    // Init markup
    this.createPaletteListMarkup();
    if (this.palettes.length > 0) {
      this.selectPalette(this.palettes[0].id);
    } else {
      console.error('[PaletteManagerController] >>> Implement fallback screen when no palette can be retrieved');
    }
  };

  ns.PaletteManagerController.prototype.closeDialog = function () {
    $.publish(Events.DIALOG_HIDE);
  };

  ns.PaletteManagerController.prototype.createPalette = function () {
    var name = window.prompt('Please enter a name for your palette', 'New palette');
    if (name) {
      var palette = this.createPaletteObject(name);
      this.palettes.push(palette);
      this.createPaletteListMarkup();
      this.selectPalette(palette.id);
    }
  };

  ns.PaletteManagerController.prototype.createPaletteObject = function (name) {
    return {
      id : 'palette-' + Date.now() + '-' + Math.floor(Math.random()*1000),
      name : name,
      colors : []
    };
  };

  ns.PaletteManagerController.prototype.selectPalette = function (paletteId) {
    this.deselectCurrentPalette();
    var paletteListItem = this.palettesList.querySelector('[data-palette-id='+paletteId+']');
    if (paletteListItem) {
      this.selectedPaletteId = paletteId;
      paletteListItem.classList.add(SELECTED_CLASSNAME);
      this.refreshPaletteDetails();
    }
  };

  ns.PaletteManagerController.prototype.refreshPaletteDetails = function () {
    this.createPaletteHeadMarkup();
    this.createPaletteBodyMarkup();
    this.initPaletteDetailsEvents();
    this.initPaletteCardsSpectrum();
  };

  ns.PaletteManagerController.prototype.createPaletteListMarkup = function () {
    var html = this.palettes.map(function (palette) {
      var paletteCopy = {
        id : palette.id,
        name : this.isPaletteModified(palette) ? palette.name + " *" : palette.name
      };
      return pskl.utils.Template.replace('<li data-palette-id="{{id}}">{{name}}</li>', paletteCopy);
    }.bind(this)).join('');
    this.palettesList.innerHTML = html;
  };

  /**
   * Fill the palette body container with color cards for the selected palette
   */
  ns.PaletteManagerController.prototype.createPaletteHeadMarkup = function () {
    var palette = this.getSelectedPalette();
    var dict = {
      'name' : palette.name,
      'save:disabled' : !this.isPaletteModified(palette),
      'revert:disabled' : !this.isPaletteModified(palette),
      'delete:disabled' : this.palettes.length < 2
    };
    var html = pskl.utils.Template.replace(this.paletteHeadTemplate, dict);

    this.paletteHead.innerHTML = html;
  };

  ns.PaletteManagerController.prototype.isPaletteModified = function (palette) {
    var isModified = false;
    var originalPalette = this.getPaletteById(palette.id, this.originalPalettes);
    if (originalPalette) {
      var differentName = originalPalette.name !== palette.name;
      var differentColors = palette.colors.join('') !== originalPalette.colors.join('');
      isModified = differentName || differentColors;
    } else {
      isModified = true;
    }
    return isModified;
  };

  /**
   * Fill the palette body container with color cards for the selected palette
   */
  ns.PaletteManagerController.prototype.createPaletteBodyMarkup = function () {
    var palette = this.getSelectedPalette();

    var html = this.getColorCardsMarkup(palette.colors);
    html += pskl.utils.Template.replace(this.newColorTemplate, {classname : NEW_COLOR_CLASS});

    this.paletteBody.innerHTML = html;
  };

  ns.PaletteManagerController.prototype.initPaletteDetailsEvents = function () {
    // New Card click event
    var newCard = this.paletteBody.querySelector('.' + NEW_COLOR_CLASS);
    newCard.addEventListener('click', this.onNewCardClick.bind(this));

    if (this.palettes.length < 2) {
      var deleteButton = this.paletteHead.querySelector('.palette-manager-palette-button[data-action="delete"]');
      deleteButton.setAttribute("disabled", "disabled");
    }
  };

  ns.PaletteManagerController.prototype.onNewCardClick = function () {
    var color;
    var palette = this.getSelectedPalette();
    if (palette && palette.colors.length > 0) {
      color = palette.colors[palette.colors.length-1];
    } else {
      color = '#FFFFFF';
    }
    this.addColorInSelectedPalette(color);
  };

  ns.PaletteManagerController.prototype.delegatedPaletteBodyClick = function (event) {
    var target = event.target;
    if (target.classList.contains(CLOSE_ICON_CLASS)) {
      var colorId = parseInt(target.parentNode.dataset.colorId, 10);
      this.removeColorInSelectedPalette(colorId);
    }
  };

  ns.PaletteManagerController.prototype.delegatedPaletteHeadClick = function (event) {
    var target = event.target;
    if (target.classList.contains(EDIT_NAME_CLASS)) {
      this.renameSelectedPalette();
    } else if (target.classList.contains('palette-manager-palette-button')) {
      var action = target.dataset.action;
      if (action === 'save') {
        this.savePaletteAndRedraw(this.getSelectedPalette().id);
      } else if (action === 'revert') {
        this.revertChanges();
      } else if (action === 'delete') {
        this.deleteSelectedPalette();
      }
    }
  };

  ns.PaletteManagerController.prototype.initPaletteCardsSpectrum = function () {
    var oSelf = this;
    var colorSquares = $(':not(.' + NEW_COLOR_CLASS + ')>.palette-manager-color-square');
    colorSquares.spectrum({
      clickoutFiresChange : true,
      showInput: true,
      showButtons: false,
      change : function (color) {
        var target = this;
        var colorId = parseInt(target.parentNode.dataset.colorId, 10);
        oSelf.updateColorInSelectedPalette(colorId, color);
      },
      beforeShow : function() {
        var target = this;
        var colorId = parseInt(target.parentNode.dataset.colorId, 10);
        var palette = oSelf.getSelectedPalette();
        var color = palette.colors[colorId];
        colorSquares.spectrum("set", color);
      }
    });
  };

  ns.PaletteManagerController.prototype.updateColorInSelectedPalette = function (colorId, color) {
    var palette = this.getSelectedPalette();
    palette.colors.splice(colorId, 1, '#' + (color.toHex().toUpperCase()));

    this.createPaletteListMarkup();
    this.selectPalette(this.selectedPaletteId);
  };

  ns.PaletteManagerController.prototype.addColorInSelectedPalette = function (color) {
    var selectedPalette = this.getSelectedPalette();
    selectedPalette.colors.push(color);

    this.createPaletteListMarkup();
    this.selectPalette(this.selectedPaletteId);
  };

  ns.PaletteManagerController.prototype.removeColorInSelectedPalette = function (colorId) {
    var palette = this.getSelectedPalette();
    palette.colors.splice(colorId, 1);

    this.createPaletteListMarkup();
    this.selectPalette(this.selectedPaletteId);
  };

  ns.PaletteManagerController.prototype.renameSelectedPalette = function () {
    var palette = this.getSelectedPalette();
    var name = window.prompt('Please enter a new name for palette "' + palette.name + '"', palette.name);
    if (name) {
      palette.name = name;
      this.createPaletteListMarkup();
      this.selectPalette(palette.id);
    }
  };

  ns.PaletteManagerController.prototype.getSelectedPalette = function () {
    return this.getPaletteById(this.selectedPaletteId, this.palettes);
  };

  ns.PaletteManagerController.prototype.getColorCardsMarkup = function (colors) {
    var html = colors.map(function (color, index) {
      var dict = {
        colorId : index,
        hex : color,
        rgb : tinycolor(color).toRgbString(),
        hsl :  tinycolor(color).toHslString()
      };
      return pskl.utils.Template.replace(this.colorCardTemplate, dict);
    }.bind(this)).join('');
    return html;
  };

  ns.PaletteManagerController.prototype.getPaletteById = function (paletteId, palettes) {
    var match = null;

    palettes.forEach(function (palette) {
      if (palette.id === paletteId) {
        match = palette;
      }
    });

    return match;
  };

  ns.PaletteManagerController.prototype.removePaletteById = function (paletteId, palettes) {
    var palette = this.getPaletteById(paletteId, palettes);
    if (palette) {
      var index = palettes.indexOf(palette);
      palettes.splice(index, 1);
    }
  };

  ns.PaletteManagerController.prototype.deselectCurrentPalette = function () {
    var selectedItem = this.palettesList.querySelector('.' + SELECTED_CLASSNAME);
    if (selectedItem) {
      this.selectedPaletteId = null;
      selectedItem.classList.remove(SELECTED_CLASSNAME);
    }
  };

  ns.PaletteManagerController.prototype.revertChanges = function () {
    var palette = this.getSelectedPalette();
    var originalPalette = this.getPaletteById(palette.id, this.originalPalettes);
    palette.name = originalPalette.name;
    palette.colors = originalPalette.colors.slice(0);

    this.createPaletteListMarkup();
    this.selectPalette(palette.id);
  };

  ns.PaletteManagerController.prototype.deleteSelectedPalette = function () {
    var palette = this.getSelectedPalette();
    if (this.palettes.length > 1) {
      if (window.confirm('Are you sure you want to delete "' + palette.name + '" ?')) {
        this.removePaletteById(palette.id, this.palettes);
        this.removePaletteById(palette.id, this.originalPalettes);

        this.persistToLocalStorage();

        this.createPaletteListMarkup();
        this.selectPalette(this.palettes[0].id);
      }
    }
  };

  ns.PaletteManagerController.prototype.onPaletteListClick = function (event) {
    var target = event.target;
    if (target.dataset.paletteId) {
      this.selectPalette(target.dataset.paletteId);
    }
  };

  ns.PaletteManagerController.prototype.saveAll = function () {
    this.palettes.forEach(function (palette) {
      this.savePalette(palette.id);
    }.bind(this));

    this.createPaletteListMarkup();
    this.selectPalette(this.getSelectedPalette().id);
  };

  ns.PaletteManagerController.prototype.savePalette = function (paletteId) {
    var palette = this.getPaletteById(paletteId, this.palettes);
    var originalPalette = this.getPaletteById(paletteId, this.originalPalettes);
    if (originalPalette) {
      originalPalette.name = palette.name;
      originalPalette.colors = palette.colors;
    } else {
      this.originalPalettes.push(palette);
    }

    this.persistToLocalStorage();
  };

  ns.PaletteManagerController.prototype.savePaletteAndRedraw = function (paletteId) {
    this.savePalette(paletteId);

    this.createPaletteListMarkup();
    this.selectPalette(this.getSelectedPalette().id);
  };


  ns.PaletteManagerController.prototype.persistToLocalStorage = function () {
    window.localStorage.setItem('piskel.palettes', JSON.stringify(this.originalPalettes));
    this.originalPalettes = this.retrieveUserPalettes();
    $.publish(Events.PALETTE_LIST_UPDATED);
  };

  ns.PaletteManagerController.prototype.retrieveUserPalettes = function () {
    var palettesString = window.localStorage.getItem('piskel.palettes');
    return JSON.parse(palettesString) || [this.createPaletteObject('New palette')];
  };

})();