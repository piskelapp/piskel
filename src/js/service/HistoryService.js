(function () {
  var ns = $.namespace('pskl.service');

  var SNAPSHOT_PERIOD = 5;

  ns.HistoryService = function (piskelController) {
    this.piskelController = piskelController;
    this.stateQueue = [];
    this.currentIndex = -1;
    this.saveState__b = this.saveState.bind(this);

    this.lastEvent = -1;
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
    var now = Date.now();
    if ((Date.now() - this.lastEvent) > 50 && this.currentIndex > 0) {
      this.currentIndex = this.currentIndex - 1;
      this.loadState(this.currentIndex);
      this.lastEvent = Date.now();
    }
  };

  ns.HistoryService.prototype.redo = function () {
    var now = Date.now();
    if ((Date.now() - this.lastEvent) > 50 && this.currentIndex < this.stateQueue.length - 1) {
      this.currentIndex = this.currentIndex + 1;
      this.loadState(this.currentIndex);
      this.lastEvent = Date.now();
    }
  };

  ns.HistoryService.prototype.loadState = function (index) {
    $.unsubscribe(Events.PISKEL_SAVE_STATE, this.saveState__b);
    this.piskelController.silence();

    // get nearest snaphot index
    var snapshotIndex = -1;
    for (var i = index ; i >= 0 ; i--) {
      if (this.stateQueue[i].piskel) {
        snapshotIndex = i;
        break;
      }
    }

    if (snapshotIndex === -1) {
      throw 'Could not find previous SNAPSHOT saved in history stateQueue';
    }

    var serializedPiskel = this.stateQueue[snapshotIndex].piskel;
    var targetState = this.stateQueue[index];

    if (typeof serializedPiskel === "string") {
      this.stateQueue[snapshotIndex].piskel = JSON.parse(serializedPiskel);
      serializedPiskel = this.stateQueue[snapshotIndex].piskel;
    }

    this.loadPiskel(serializedPiskel, this.onPiskelLoadedCallback.bind(this, index, snapshotIndex));
  };

  ns.HistoryService.prototype.onPiskelLoadedCallback = function (index, snapshotIndex, piskel) {
    for (var i = snapshotIndex + 1 ; i <= index ; i++) {
      var state = this.stateQueue[i];
      this.setupState(state);
      this.replayState(state);
    }

    var lastState = this.stateQueue[index];
    this.setupState(lastState);

    this.piskelController.voice();
    $.subscribe(Events.PISKEL_SAVE_STATE, this.saveState__b);
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
      pskl.app.piskelController.setPiskel(piskel);
      callback(piskel);
    });
  };

  ns.HistoryService.prototype.replayState = function (state) {
    var type = state.action.type;
    if (type === 'DELETE_FRAME') {
      this.piskelController.removeFrameAt(state.action.index);
    } else if (type === 'ADD_FRAME') {
      this.piskelController.addFrameAt(state.action.index);
    } else if (type === 'DUPLICATE_FRAME') {
      this.piskelController.duplicateFrameAt(state.action.index);
    } else if (type === 'CREATE_LAYER') {
      this.piskelController.createLayer(state.action.name);
    } else if (type === 'REMOVE_LAYER') {
      this.piskelController.removeCurrentLayer();
    } else if (type === 'LAYER_UP') {
      this.piskelController.moveLayerUp();
    } else if (type === 'LAYER_DOWN') {
      this.piskelController.moveLayerUp();
    } else if (type === 'RENAME_LAYER') {
      this.piskelController.renameLayerAt(state.action.index, state.action.name);
    } else if (type === 'MOVE_FRAME') {
      this.piskelController.moveFrame(state.action.from, state.action.to);
    } else if (type === 'CREATE_LAYER') {
      this.piskelController.createLayer();
    } else if (type === 'TOOL') {
      var action = state.action;
      var layer = this.piskelController.getLayerAt(state.layerIndex);
      var frame = layer.getFrameAt(state.frameIndex);
      action.tool.replay(frame, action.replay);
    }
  };

})();