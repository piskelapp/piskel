//TODO(thejohncrafter): planePreviewShortcut ?

(function () {
  var ns = $.namespace('pskl.controller');

  //var TOGGLE_PLANE_SHORTCUT = 'alt+L';

  ns.PlanesListController = function (piskelController) {
    this.piskelController = piskelController;
    //this.planePreviewShortcut = pskl.service.keyboard.Shortcuts.MISC.PLANE_PREVIEW  ;
  };

  ns.PlanesListController.prototype.init = function () {
    this.planeItemTemplate_ = pskl.utils.Template.get('plane-item-template');
    this.rootEl = document.querySelector('.planes-list-container');
    this.planesListEl = document.querySelector('.planes-list');
    this.togglePlanePreviewEl = document.querySelector('.planes-toggle-preview');

    this.rootEl.addEventListener('click', this.onClick_.bind(this));
    this.togglePlanePreviewEl.addEventListener('click', this.togglePlanePreview_.bind(this));

    this.initTogglePlanePreview_();

    this.renderPlaneList_();
    this.updateTogglePlanePreview_();

    $.subscribe(Events.PISKEL_RESET, this.renderPlaneList_.bind(this));
    $.subscribe(Events.USER_SETTINGS_CHANGED, $.proxy(this.onUserSettingsChange_, this));
  };

  ns.PlanesListController.prototype.renderPlaneList_ = function () {
    this.planesListEl.innerHTML = '';
    var planes = this.piskelController.getPlanes();
    planes.forEach(this.addPlaneItem.bind(this));
    this.updateButtonStatus_();
  };

  ns.PlanesListController.prototype.initTogglePlanePreview_ = function () {
    var descriptors = [{description : 'Opacity defined in PREFERENCES'}];
    var helpText = 'Preview all planes';

    //pskl.app.shortcutService.registerShortcut(this.planePreviewShortcut, this.togglePlanePreview_.bind(this));
    var tooltip = pskl.utils.TooltipFormatter.format(helpText, false/*this.planePreviewShortcut*/, descriptors);
    this.togglePlanePreviewEl.setAttribute('title', tooltip);
  };

  ns.PlanesListController.prototype.updateButtonStatus_ = function () {
    var planes = this.piskelController.getPlanes();
    var currentPlane = this.piskelController.getCurrentPlane();
    var index = this.piskelController.getCurrentPlaneIndex();

    var isLast = index === 0;
    var isOnly = planes.length === 1;
    var isFirst = index === planes.length - 1;

    this.toggleButtonDisabledState_('up', isFirst);
    this.toggleButtonDisabledState_('down', isLast);
    this.toggleButtonDisabledState_('delete', isOnly);
  };

  ns.PlanesListController.prototype.toggleButtonDisabledState_ = function (buttonAction, isDisabled) {
    var button = document.querySelector('.planes-button[data-action="' + buttonAction + '"]');
    if (isDisabled) {
      button.setAttribute('disabled', 'disabled');
      // Disabled/focused buttons consume key events on Firefox, so make sure to blur.
      button.blur();
    } else {
      button.removeAttribute('disabled');
    }
  };

  ns.PlanesListController.prototype.updateTogglePlanePreview_ = function () {
    var enabledClassname = 'planes-toggle-preview-enabled';
    if (pskl.UserSettings.get(pskl.UserSettings.PLANE_PREVIEW)) {
      this.togglePlanePreviewEl.classList.add(enabledClassname);
    } else {
      this.togglePlanePreviewEl.classList.remove(enabledClassname);
    }
  };

  ns.PlanesListController.prototype.onUserSettingsChange_ = function (evt, name, value) {
    if (name == pskl.UserSettings.PLANE_PREVIEW) {
      this.updateTogglePlanePreview_();
    }
  };

  ns.PlanesListController.prototype.addPlaneItem = function (plane, index) {
    var isSelected = this.piskelController.getCurrentPlane() === plane;
    var planeItemHtml = pskl.utils.Template.replace(this.planeItemTemplate_, {
      'planename' : plane.getName(),
      'planeindex' : index,
      'isselected:current-plane-item' : isSelected,
      'offset': plane.getOffset()
    });
    var planeItem = pskl.utils.Template.createFromHTML(planeItemHtml);
    this.planesListEl.insertBefore(planeItem, this.planesListEl.firstChild);
  };

  ns.PlanesListController.prototype.onClick_ = function (evt) {
    var el = evt.target || evt.srcElement;
    var index;
    if (el.classList.contains('button')) {
      this.onButtonClick_(el);
    } else if (el.classList.contains('plane-item')) {
      index = el.dataset.planeIndex;
      this.piskelController.setCurrentPlaneIndex(parseInt(index, 10));
    } else if (el.classList.contains('plane-item-offset')) {
      index = pskl.utils.Dom.getData(el, 'planeIndex');
      var plane = this.piskelController.getPlaneAt(parseInt(index, 10));
      var offset = window.prompt('Set plane offset (can be a floating point number !)', plane.getOffset());
      this.piskelController.setPlaneOffsetAt(index, offset);
    }
  };

  ns.PlanesListController.prototype.renameCurrentPlane_ = function () {
    var plane = this.piskelController.getCurrentPlane();
    var name = window.prompt('Please enter the plane name', plane.getName());
    if (name) {
      var index = this.piskelController.getCurrentPlaneIndex();
      this.piskelController.renamePlaneAt(index, name);
      this.renderPlaneList_();
    }
  };

  ns.PlanesListController.prototype.onButtonClick_ = function (button) {
    var action = button.getAttribute('data-action');
    if (action == 'up') {
      this.piskelController.movePlaneUp();
    } else if (action == 'down') {
      this.piskelController.movePlaneDown();
    } else if (action == 'add') {
      this.piskelController.createPlane();
    } else if (action == 'delete') {
      this.piskelController.removeCurrentPlane();
    } else if (action == 'edit') {
      this.renameCurrentPlane_();
    }
  };

  ns.PlanesListController.prototype.togglePlanePreview_ = function () {
    var currentValue = pskl.UserSettings.get(pskl.UserSettings.PLANE_PREVIEW);
    var currentPlaneOpacity = pskl.UserSettings.get(pskl.UserSettings.PLANE_OPACITY);

    var showPlanePreview = !currentValue;
    pskl.UserSettings.set(pskl.UserSettings.PLANE_PREVIEW, showPlanePreview);

    if (showPlanePreview && currentPlaneOpacity === 0) {
      pskl.UserSettings.set(pskl.UserSettings.PLANE_OPACITY, Constants.DEFAULT.PLANE_OPACITY);
    }
  };
})();
