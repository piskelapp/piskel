(function () {
  var ns = $.namespace('pskl.controller.piskel');

  ns.PublicPiskelController = function (piskelController) {
    this.piskelController = piskelController;
  };

  ns.PublicPiskelController.prototype.init = function () {
    pskl.app.shortcutService.addShortcut('up', this.selectPreviousFrame.bind(this));
    pskl.app.shortcutService.addShortcut('down', this.selectNextFrame.bind(this));
    pskl.app.shortcutService.addShortcut('n', this.addFrameAtCurrentIndex.bind(this));
    pskl.app.shortcutService.addShortcut('shift+n', this.duplicateCurrentFrame.bind(this));
  };

  ns.PublicPiskelController.prototype.setPiskel = function (piskel) {
    this.piskelController.setPiskel(piskel);

    $.publish(Events.FRAME_SIZE_CHANGED);
    $.publish(Events.PISKEL_RESET);
    $.publish(Events.PISKEL_SAVE_STATE, {
      type : 'FULL'
    });
  };

  ns.PublicPiskelController.prototype.addFrame = function () {
    this.addFrameAt(this.piskelController.getFrameCount());
  };

  ns.PublicPiskelController.prototype.addFrameAtCurrentIndex = function () {
    this.addFrameAt(this.getCurrentFrameIndex());
  };

  ns.PublicPiskelController.prototype.addFrameAt = function (index) {
    this.piskelController.addFrameAt(index);

    $.publish(Events.PISKEL_SAVE_STATE, {
      type : 'ADD_FRAME',
      index : index
    });

    $.publish(Events.PISKEL_RESET);
  };

  ns.PublicPiskelController.prototype.removeFrameAt = function (index) {
    this.piskelController.removeFrameAt(index);

    $.publish(Events.PISKEL_SAVE_STATE, {
      type : 'DELETE_FRAME',
      index : index
    });
    $.publish(Events.PISKEL_RESET);
  };

  ns.PublicPiskelController.prototype.duplicateCurrentFrame = function () {
    this.piskelController.duplicateFrameAt(this.getCurrentFrameIndex());
  };

  ns.PublicPiskelController.prototype.duplicateFrameAt = function (index) {
    this.piskelController.duplicateFrameAt(index);

    $.publish(Events.PISKEL_SAVE_STATE, {
      type : 'DUPLICATE_FRAME',
      index : index
    });

    $.publish(Events.PISKEL_RESET);
  };

  ns.PublicPiskelController.prototype.moveFrame = function (fromIndex, toIndex) {
    this.piskelController.moveFrame(fromIndex, toIndex);

    $.publish(Events.PISKEL_SAVE_STATE, {
      type : 'MOVE_FRAME',
      from : fromIndex,
      to : toIndex
    });
    $.publish(Events.PISKEL_RESET);
  };

  ns.PublicPiskelController.prototype.getFrameCount = function () {
    return this.piskelController.getFrameCount();
  };

  ns.PublicPiskelController.prototype.setCurrentFrameIndex = function (index) {
    this.piskelController.setCurrentFrameIndex(index);
    $.publish(Events.PISKEL_RESET);
  };

  ns.PublicPiskelController.prototype.selectNextFrame = function () {
    this.piskelController.selectNextFrame();
    $.publish(Events.PISKEL_RESET);
  };

  ns.PublicPiskelController.prototype.selectPreviousFrame = function () {
    this.piskelController.selectPreviousFrame();
    $.publish(Events.PISKEL_RESET);
  };

  ns.PublicPiskelController.prototype.setCurrentLayerIndex = function (index) {
    this.piskelController.setCurrentLayerIndex(index);
    $.publish(Events.PISKEL_RESET);
  };

  ns.PublicPiskelController.prototype.selectLayer = function (layer) {
    this.piskelController.selectLayer(layer);
    $.publish(Events.PISKEL_RESET);
  };

  ns.PublicPiskelController.prototype.renameLayerAt = function (index, name) {
    this.piskelController.renameLayerAt(index, name);
    $.publish(Events.PISKEL_SAVE_STATE, {
      type : 'RENAME_LAYER',
      index : index,
      name : name
    });
  };

  ns.PublicPiskelController.prototype.getLayerByIndex = function (index) {
    return this.piskelController.getLayerByIndex(index);
  };

  ns.PublicPiskelController.prototype.createLayer = function (name) {
    this.piskelController.createLayer(name);
    $.publish(Events.PISKEL_SAVE_STATE, {
      type : 'CREATE_LAYER',
      name : name
    });
    $.publish(Events.PISKEL_RESET);
  };

  ns.PublicPiskelController.prototype.moveLayerUp = function () {
    this.piskelController.moveLayerUp();
    $.publish(Events.PISKEL_SAVE_STATE, {
      type : 'LAYER_UP'
    });
    $.publish(Events.PISKEL_RESET);
  };

  ns.PublicPiskelController.prototype.moveLayerDown = function () {
    this.piskelController.moveLayerDown();
    $.publish(Events.PISKEL_SAVE_STATE, {
      type : 'LAYER_DOWN'
    });
    $.publish(Events.PISKEL_RESET);
  };

  ns.PublicPiskelController.prototype.removeCurrentLayer = function () {
    this.piskelController.removeCurrentLayer();
    $.publish(Events.PISKEL_SAVE_STATE, {
      type : 'REMOVE_LAYER'
    });
    $.publish(Events.PISKEL_RESET);
  };

  ns.PublicPiskelController.prototype.serialize = function (compressed) {
    return this.piskelController.serialize(compressed);
  };

  ns.PublicPiskelController.prototype.getHeight = function () {
    return this.piskelController.getHeight();
  };

  ns.PublicPiskelController.prototype.getWidth = function () {
    return this.piskelController.getWidth();
  };

  ns.PublicPiskelController.prototype.getFPS = function () {
    return this.piskelController.getFPS();
  };

  ns.PublicPiskelController.prototype.getLayers = function () {
    return this.piskelController.getLayers();
  };

  ns.PublicPiskelController.prototype.getCurrentLayer = function () {
    return this.piskelController.getCurrentLayer();
  };

  ns.PublicPiskelController.prototype.getCurrentLayerIndex = function () {
    return this.piskelController.currentLayerIndex;
  };

  ns.PublicPiskelController.prototype.getLayerAt = function (index) {
    return this.piskelController.getLayerAt(index);
  };

  ns.PublicPiskelController.prototype.getCurrentFrame = function () {
    return this.piskelController.getCurrentFrame();
  };

  ns.PublicPiskelController.prototype.getCurrentFrameIndex = function () {
    return this.piskelController.currentFrameIndex;
  };

  ns.PublicPiskelController.prototype.getPiskel = function () {
    return this.piskelController.piskel;
  };

  ns.PublicPiskelController.prototype.getFrameAt = function (index) {
    return this.piskelController.getFrameAt(index);
  };

  ns.PublicPiskelController.prototype.hasFrameAt = function (index) {
    return this.piskelController.hasFrameAt(index);
  };

})();