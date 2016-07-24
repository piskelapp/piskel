(function () {
  var ns = $.namespace('pskl.controller');

  var TOGGLE_LAYER_SHORTCUT = 'alt+L';

  ns.LayersListController = function (piskelController) {
    this.piskelController = piskelController;
    this.layerPreviewShortcut = pskl.service.keyboard.Shortcuts.MISC.LAYER_PREVIEW  ;
  };

  ns.LayersListController.prototype.init = function () {
    this.layerItemTemplate_ = pskl.utils.Template.get('layer-item-template');
    this.rootEl = document.querySelector('.layers-list-container');
    this.layersListEl = document.querySelector('.layers-list');
    this.toggleLayerPreviewEl = document.querySelector('.layers-toggle-preview');

    this.rootEl.addEventListener('click', this.onClick_.bind(this));
    this.toggleLayerPreviewEl.addEventListener('click', this.toggleLayerPreview_.bind(this));

    this.initToggleLayerPreview_();

    this.renderLayerList_();
    this.updateToggleLayerPreview_();

    $.subscribe(Events.PISKEL_RESET, this.renderLayerList_.bind(this));
    $.subscribe(Events.USER_SETTINGS_CHANGED, $.proxy(this.onUserSettingsChange_, this));
  };

  ns.LayersListController.prototype.renderLayerList_ = function () {
    this.layersListEl.innerHTML = '';
    var layers = this.piskelController.getLayers();
    layers.forEach(this.addLayerItem.bind(this));
    this.updateButtonStatus_();

    // Ensure the currently the selected layer is visible.
    var currentLayerEl = this.layersListEl.querySelector('.current-layer-item');
    if (currentLayerEl) {
      currentLayerEl.scrollIntoView();
    }
  };

  ns.LayersListController.prototype.initToggleLayerPreview_ = function () {
    var descriptors = [{description : 'Opacity defined in PREFERENCES'}];
    var helpText = 'Preview all layers';

    pskl.app.shortcutService.registerShortcut(this.layerPreviewShortcut, this.toggleLayerPreview_.bind(this));
    var tooltip = pskl.utils.TooltipFormatter.format(helpText, this.layerPreviewShortcut, descriptors);
    this.toggleLayerPreviewEl.setAttribute('title', tooltip);
  };

  ns.LayersListController.prototype.updateButtonStatus_ = function () {
    var layers = this.piskelController.getLayers();
    var currentLayer = this.piskelController.getCurrentLayer();
    var index = this.piskelController.getCurrentLayerIndex();

    var isLast = index === 0;
    var isOnly = layers.length === 1;
    var isFirst = index === layers.length - 1;

    this.toggleButtonDisabledState_('up', isFirst);
    this.toggleButtonDisabledState_('down', isLast);
    this.toggleButtonDisabledState_('merge', isLast);
    this.toggleButtonDisabledState_('delete', isOnly);
  };

  ns.LayersListController.prototype.toggleButtonDisabledState_ = function (buttonAction, isDisabled) {
    var button = document.querySelector('.layers-button[data-action="' + buttonAction + '"]');
    if (isDisabled) {
      button.setAttribute('disabled', 'disabled');
      // Disabled/focused buttons consume key events on Firefox, so make sure to blur.
      button.blur();
    } else {
      button.removeAttribute('disabled');
    }
  };

  ns.LayersListController.prototype.updateToggleLayerPreview_ = function () {
    var enabledClassname = 'layers-toggle-preview-enabled';
    if (pskl.UserSettings.get(pskl.UserSettings.LAYER_PREVIEW)) {
      this.toggleLayerPreviewEl.classList.add(enabledClassname);
    } else {
      this.toggleLayerPreviewEl.classList.remove(enabledClassname);
    }
  };

  ns.LayersListController.prototype.onUserSettingsChange_ = function (evt, name, value) {
    if (name == pskl.UserSettings.LAYER_PREVIEW) {
      this.updateToggleLayerPreview_();
    }
  };

  ns.LayersListController.prototype.addLayerItem = function (layer, index) {
    var isSelected = this.piskelController.getCurrentLayer() === layer;
    var layerItemHtml = pskl.utils.Template.replace(this.layerItemTemplate_, {
      'layername' : layer.getName(),
      'layerindex' : index,
      'isselected:current-layer-item' : isSelected,
      'opacity': layer.getOpacity()
    });
    var layerItem = pskl.utils.Template.createFromHTML(layerItemHtml);
    this.layersListEl.insertBefore(layerItem, this.layersListEl.firstChild);
  };

  ns.LayersListController.prototype.onClick_ = function (evt) {
    var el = evt.target || evt.srcElement;
    var index;
    if (el.classList.contains('button')) {
      this.onButtonClick_(el);
    } else if (el.classList.contains('layer-item')) {
      index = el.dataset.layerIndex;
      this.piskelController.setCurrentLayerIndex(parseInt(index, 10));
    } else if (el.classList.contains('layer-item-opacity')) {
      index = pskl.utils.Dom.getData(el, 'layerIndex');
      var layer = this.piskelController.getLayerAt(parseInt(index, 10));
      var opacity = window.prompt('Set layer opacity (value between 0 and 1)', layer.getOpacity());
      this.piskelController.setLayerOpacityAt(index, opacity);
    }
  };

  ns.LayersListController.prototype.renameCurrentLayer_ = function () {
    var layer = this.piskelController.getCurrentLayer();
    var name = window.prompt('Please enter the layer name', layer.getName());
    if (name) {
      var index = this.piskelController.getCurrentLayerIndex();
      this.piskelController.renameLayerAt(index, name);
      this.renderLayerList_();
    }
  };

  ns.LayersListController.prototype.mergeDownCurrentLayer_ = function () {
    var index = this.piskelController.getCurrentLayerIndex();
    this.piskelController.mergeDownLayerAt(index);
    this.renderLayerList_();
  };

  ns.LayersListController.prototype.onButtonClick_ = function (button) {
    var action = button.getAttribute('data-action');
    if (action == 'up') {
      this.piskelController.moveLayerUp();
    } else if (action == 'down') {
      this.piskelController.moveLayerDown();
    } else if (action == 'add') {
      this.piskelController.createLayer();
    } else if (action == 'delete') {
      this.piskelController.removeCurrentLayer();
    } else if (action == 'merge') {
      this.mergeDownCurrentLayer_();
    } else if (action == 'edit') {
      this.renameCurrentLayer_();
    }
  };

  ns.LayersListController.prototype.toggleLayerPreview_ = function () {
    var currentValue = pskl.UserSettings.get(pskl.UserSettings.LAYER_PREVIEW);
    var currentLayerOpacity = pskl.UserSettings.get(pskl.UserSettings.LAYER_OPACITY);

    var showLayerPreview = !currentValue;
    pskl.UserSettings.set(pskl.UserSettings.LAYER_PREVIEW, showLayerPreview);

    if (showLayerPreview && currentLayerOpacity === 0) {
      pskl.UserSettings.set(pskl.UserSettings.LAYER_OPACITY, Constants.DEFAULT.LAYER_OPACITY);
    }
  };
})();
