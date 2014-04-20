(function () {
  var ns = $.namespace('pskl.service');

  var SNAPSHOT_PERIOD = 50;
  var LOAD_STATE_INTERVAL = 50;

  ns.HistoryService = function (piskelController) {
    this.piskelController = piskelController;
    this.stateQueue = [];
    this.currentIndex = -1;
    this.saveState__b = this.saveState.bind(this);

    this.lastLoadState = -1;
  };

  ns.HistoryService.prototype.init = function () {

    $.subscribe(Events.PISKEL_SAVE_STATE, this.saveState__b);

    pskl.app.shortcutService.addShortcut('ctrl+Z', this.undo.bind(this));
    pskl.app.shortcutService.addShortcut('ctrl+Y', this.redo.bind(this));
  };

  ns.HistoryService.prototype.saveState = function (evt, actionInfo) {
    this.stateQueue = this.stateQueue.slice(0, this.currentIndex + 1);
    this.currentIndex = this.currentIndex + 1;

    var state = {
      action : actionInfo,
      frameIndex : this.piskelController.currentFrameIndex,
      layerIndex : this.piskelController.currentLayerIndex
    };

    if (actionInfo.type === 'FULL' || this.currentIndex % SNAPSHOT_PERIOD === 0) {
      state.piskel = this.piskelController.serialize(false);
    }

    this.stateQueue.push(state);
  };

  ns.HistoryService.prototype.undo = function () {
    this.loadState(this.currentIndex - 1);
  };

  ns.HistoryService.prototype.redo = function () {
    this.loadState(this.currentIndex + 1);
  };

  ns.HistoryService.prototype.loadState = function (index) {
    if (this.isLoadStateAllowed_(index)) {
      this.lastLoadState = Date.now();

      var snapshotIndex = this.getPreviousSnapshotIndex_(index);
      if (snapshotIndex < 0) {
        throw 'Could not find previous SNAPSHOT saved in history stateQueue';
      }

      var serializedPiskel = this.stateQueue[snapshotIndex].piskel;

      if (typeof serializedPiskel === "string") {
        this.stateQueue[snapshotIndex].piskel = JSON.parse(serializedPiskel);
        serializedPiskel = this.stateQueue[snapshotIndex].piskel;
      }

      this.loadPiskel(serializedPiskel, this.onPiskelLoadedCallback.bind(this, index, snapshotIndex));
    }
  };

  ns.HistoryService.prototype.isLoadStateAllowed_ = function (index) {
    var timeOk = (Date.now() - this.lastLoadState) > LOAD_STATE_INTERVAL;
    var indexInRange = index >= 0 && index < this.stateQueue.length;
    return timeOk && indexInRange;
  };

  ns.HistoryService.prototype.getPreviousSnapshotIndex_ = function (index) {
    while (this.stateQueue[index] && !this.stateQueue[index].piskel) {
      index = index - 1;
    }
    return index;
  };

  ns.HistoryService.prototype.onPiskelLoadedCallback = function (index, snapshotIndex, piskel) {
    for (var i = snapshotIndex + 1 ; i <= index ; i++) {
      var state = this.stateQueue[i];
      this.setupState(state);
      this.replayState(state);
    }

    var lastState = this.stateQueue[index];
    this.setupState(lastState);
    this.currentIndex = index;
    $.publish(Events.PISKEL_RESET);
  };

  ns.HistoryService.prototype.setupState = function (state) {
    this.piskelController.setCurrentFrameIndex(state.frameIndex);
    this.piskelController.setCurrentLayerIndex(state.layerIndex);
  };

  ns.HistoryService.prototype.loadPiskel = function (piskel, callback) {
    var descriptor = this.piskelController.piskel.getDescriptor();
    pskl.utils.serialization.Deserializer.deserialize(piskel, function (piskel) {
      piskel.setDescriptor(descriptor);
      this.piskelController.setPiskel(piskel);
      callback(piskel);
    }.bind(this));
  };

  ns.HistoryService.prototype.replayState = function (state) {
    var action = state.action;
    var type = action.type;
    var layer = this.piskelController.getLayerAt(state.layerIndex);
    var frame = layer.getFrameAt(state.frameIndex);
    action.scope.replay(frame, action.replay);
  };

})();