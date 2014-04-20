(function () {
  var ns = $.namespace('pskl.controller.piskel');

  ns.PublicPiskelController = function (piskelController) {
    this.piskelController = piskelController;
    pskl.utils.wrap(this, this.piskelController);
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
    this.raiseSaveStateEvent_(this.piskelController.addFrameAt, [index]);
    $.publish(Events.PISKEL_RESET);
  };

  ns.PublicPiskelController.prototype.removeFrameAt = function (index) {
    this.piskelController.removeFrameAt(index);
    this.raiseSaveStateEvent_(this.piskelController.removeFrameAt, [index]);
    $.publish(Events.PISKEL_RESET);
  };

  ns.PublicPiskelController.prototype.duplicateCurrentFrame = function () {
    this.piskelController.duplicateFrameAt(this.getCurrentFrameIndex());
  };

  ns.PublicPiskelController.prototype.raiseSaveStateEvent_ = function (fn, args) {
    $.publish(Events.PISKEL_SAVE_STATE, {
      type : 'REPLAY',
      scope : this,
      replay : {
        fn : fn,
        args : args
      }
    });
  };

  ns.PublicPiskelController.prototype.replay = function (frame, replayData) {
    replayData.fn.apply(this.piskelController, replayData.args);
  };

  ns.PublicPiskelController.prototype.duplicateFrameAt = function (index) {
    this.piskelController.duplicateFrameAt(index);
    this.raiseSaveStateEvent_(this.piskelController.duplicateFrameAt, [index]);
    $.publish(Events.PISKEL_RESET);
  };

  ns.PublicPiskelController.prototype.moveFrame = function (fromIndex, toIndex) {
    this.piskelController.moveFrame(fromIndex, toIndex);
    this.raiseSaveStateEvent_(this.piskelController.moveFrame, [fromIndex, toIndex]);
    $.publish(Events.PISKEL_RESET);
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
    this.raiseSaveStateEvent_(this.piskelController.renameLayerAt, [index, name]);
  };

  ns.PublicPiskelController.prototype.createLayer = function (name) {
    this.piskelController.createLayer(name);
    this.raiseSaveStateEvent_(this.piskelController.createLayer, [name]);
    $.publish(Events.PISKEL_RESET);
  };

  ns.PublicPiskelController.prototype.moveLayerUp = function () {
    this.piskelController.moveLayerUp();
    this.raiseSaveStateEvent_(this.piskelController.moveLayerUp, []);
    $.publish(Events.PISKEL_RESET);
  };

  ns.PublicPiskelController.prototype.moveLayerDown = function () {
    this.piskelController.moveLayerDown();
    this.raiseSaveStateEvent_(this.piskelController.moveLayerDown, []);
    $.publish(Events.PISKEL_RESET);
  };

  ns.PublicPiskelController.prototype.removeCurrentLayer = function () {
    this.piskelController.removeCurrentLayer();
    this.raiseSaveStateEvent_(this.piskelController.removeCurrentLayer, []);
    $.publish(Events.PISKEL_RESET);
  };

  ns.PublicPiskelController.prototype.getCurrentLayerIndex = function () {
    return this.piskelController.currentLayerIndex;
  };

  ns.PublicPiskelController.prototype.getCurrentFrameIndex = function () {
    return this.piskelController.currentFrameIndex;
  };

  ns.PublicPiskelController.prototype.getPiskel = function () {
    return this.piskelController.piskel;
  };

})();