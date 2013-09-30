(function () {
  var ns = $.namespace('pskl.controller');

  ns.LayersListController = function (piskelController) {
    this.piskelController = piskelController;
  };

  ns.LayersListController.prototype.init = function () {
    this.layerItemTemplate_ = pskl.utils.Template.get('layer-item-template');
    this.rootEl = document.querySelectorAll('.layers-list-container')[0];
    this.layersListEl = document.querySelectorAll('.layers-list')[0];

    this.rootEl.addEventListener('click', this.onClick_.bind(this));

    $.subscribe(Events.PISKEL_RESET, this.renderLayerList_.bind(this));

    this.renderLayerList_();
  };

  ns.LayersListController.prototype.renderLayerList_ = function () {
    this.layersListEl.innerHTML = '';
    var layers = this.piskelController.getLayers();
    layers.forEach(this.addLayerItem.bind(this));
  };

  ns.LayersListController.prototype.addLayerItem = function (layer) {
    var layerItemHtml = pskl.utils.Template.replace(this.layerItemTemplate_, {
      layername : layer.getName()
    });
    var layerItem = pskl.utils.Template.createFromHTML(layerItemHtml);
    if (this.piskelController.getCurrentLayer() === layer) {
      layerItem.classList.add('current-layer-item');
    }
    this.layersListEl.insertBefore(layerItem, this.layersListEl.firstChild);
  };

  ns.LayersListController.prototype.onClick_ = function (evt) {
    var el = evt.target || evt.srcElement;
    if (el.nodeName == 'BUTTON') {
      this.onButtonClick_(el);
    } else if (el.nodeName == 'LI') {
      var layerName = el.getAttribute('data-layer-name');
      this.piskelController.selectLayerByName(layerName);
    }
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
    }
  };
})();