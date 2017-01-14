(function () {
  var ns = $.namespace('pskl.controller.piskel');

  /**
   * The PublicPiskelController is a decorator on PiskelController, provides the same API
   * but will fire RESET/SAVE events when appropriate so that other objects get notified
   * when important changes are made on the current Piskel.
   * @param {PiskelController} piskelController the wrapped PiskelController
   */
  ns.PublicPiskelController = function (piskelController) {
    this.piskelController = piskelController;
    pskl.utils.wrap(this, this.piskelController);
  };

  ns.PublicPiskelController.prototype.init = function () {
    // DECORATED WITH RESET
    this.resetWrap_('setCurrentFrameIndex');
    this.resetWrap_('selectNextFrame');
    this.resetWrap_('selectPreviousFrame');
    this.resetWrap_('setCurrentLayerIndex');
    this.resetWrap_('selectLayer');
    // DECORATED WITH SAVE, NO RESET
    this.saveWrap_('renameLayerAt', false);
    // DECORATED WITH SAVE, WITH RESET
    this.saveWrap_('removeCurrentLayer', true);
    this.saveWrap_('addFrame', true);
    this.saveWrap_('addFrameAtCurrentIndex', true);
    this.saveWrap_('addFrameAt', true);
    this.saveWrap_('removeFrameAt', true);
    this.saveWrap_('duplicateCurrentFrame', true);
    this.saveWrap_('duplicateFrameAt', true);
    this.saveWrap_('moveFrame', true);
    this.saveWrap_('createLayer', true);
    this.saveWrap_('mergeDownLayerAt', true);
    this.saveWrap_('moveLayerUp', true);
    this.saveWrap_('moveLayerDown', true);
    this.saveWrap_('removeCurrentLayer', true);
    this.saveWrap_('setLayerOpacityAt', true);

    var shortcuts = pskl.service.keyboard.Shortcuts;
    pskl.app.shortcutService.registerShortcut(shortcuts.MISC.PREVIOUS_FRAME, this.selectPreviousFrame.bind(this));
    pskl.app.shortcutService.registerShortcut(shortcuts.MISC.NEXT_FRAME, this.selectNextFrame.bind(this));
    pskl.app.shortcutService.registerShortcut(shortcuts.MISC.NEW_FRAME, this.addFrameAtCurrentIndex.bind(this));
    pskl.app.shortcutService.registerShortcut(shortcuts.MISC.DUPLICATE_FRAME, this.duplicateCurrentFrame.bind(this));
  };

  ns.PublicPiskelController.prototype.getWrappedPiskelController = function () {
    return this.piskelController;
  };

  ns.PublicPiskelController.prototype.setPiskel = function (piskel, preserveState) {
    this.piskelController.setPiskel(piskel, preserveState);

    $.publish(Events.FRAME_SIZE_CHANGED);
    $.publish(Events.PISKEL_RESET);
    $.publish(Events.PISKEL_SAVE_STATE, {
      type : pskl.service.HistoryService.SNAPSHOT
    });
  };

  ns.PublicPiskelController.prototype.resetWrap_ = function (methodName) {
    this[methodName] = function () {
      this.piskelController[methodName].apply(this.piskelController, arguments);
      $.publish(Events.PISKEL_RESET);
    };
  };

  ns.PublicPiskelController.prototype.saveWrap_ = function (methodName, reset) {
    this[methodName] = reset ? function () {
      var stateInfo = this.getStateInfo_();
      this.piskelController[methodName].apply(this.piskelController, arguments);
      this.raiseSaveStateEvent_(this.piskelController[methodName], arguments, stateInfo);
      $.publish(Events.PISKEL_RESET);
    } : function () {
      var stateInfo = this.getStateInfo_();
      this.piskelController[methodName].apply(this.piskelController, arguments);
      this.raiseSaveStateEvent_(this.piskelController[methodName], arguments, stateInfo);
    };
  };

  ns.PublicPiskelController.prototype.getStateInfo_ = function () {
    var stateInfo = {
      frameIndex : this.piskelController.currentFrameIndex,
      layerIndex : this.piskelController.currentLayerIndex
    };
    return stateInfo;
  };

  ns.PublicPiskelController.prototype.raiseSaveStateEvent_ = function (fn, args, stateInfo) {
    $.publish(Events.PISKEL_SAVE_STATE, {
      type : pskl.service.HistoryService.REPLAY,
      scope : this,
      replay : {
        fn : fn,
        args : args
      },
      state : stateInfo
    });
  };

  ns.PublicPiskelController.prototype.replay = function (frame, replayData) {
    replayData.fn.apply(this.piskelController, replayData.args);
  };
})();
