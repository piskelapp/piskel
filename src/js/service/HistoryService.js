(function () {
  var ns = $.namespace('pskl.service');

  ns.HistoryService = function (piskelController, shortcutService, deserializer) {
    this.piskelController = piskelController || pskl.app.piskelController;
    this.shortcutService = shortcutService || pskl.app.shortcutService;
    this.deserializer = deserializer || pskl.utils.serialization.Deserializer;

    this.stateQueue = [];
    this.currentUUID = false;
    this.lastLoadState = -1;
  };

  // Force to save a state as a SNAPSHOT
  ns.HistoryService.SNAPSHOT = 'SNAPSHOT';

  // Default save state
  ns.HistoryService.REPLAY = 'REPLAY';

  // Period (in number of state saved) between two snapshots
  ns.HistoryService.SNAPSHOT_PERIOD = 50;

  // Interval/buffer (in milliseconds) between two state load (ctrl+z/y spamming)
  ns.HistoryService.LOAD_STATE_INTERVAL = 50;

  ns.HistoryService.prototype.init = function () {
    $.subscribe(Events.PISKEL_SAVE_STATE, this.onSaveStateEvent.bind(this));

    var shortcuts = pskl.service.keyboard.Shortcuts;
    this.shortcutService.registerShortcut(shortcuts.MISC.UNDO, this.undo.bind(this));
    this.shortcutService.registerShortcut(shortcuts.MISC.REDO, this.redo.bind(this));

    this.saveState({
      type : ns.HistoryService.SNAPSHOT
    });
  };

  ns.HistoryService.prototype.onSaveStateEvent = function (evt, action) {
    this.saveState(action);
  };

  ns.HistoryService.prototype.saveState = function (action) {
    var state = {
      action : action,
      frameIndex : action.state ? action.state.frameIndex : this.piskelController.currentFrameIndex,
      layerIndex : action.state ? action.state.layerIndex : this.piskelController.currentLayerIndex,
      previousIndex: false,
      nextIndex: false
    };

    var isSnapshot = action.type === ns.HistoryService.SNAPSHOT;
    var isAtAutoSnapshotInterval = (this.stateQueue.length - 1) % ns.HistoryService.SNAPSHOT_PERIOD === 0;
    if (isSnapshot || isAtAutoSnapshotInterval) {
      state.piskel = this.piskelController.serialize(true);
    }

    this.pushNewState_(state);
    $.publish(Events.HISTORY_STATE_SAVED);
  };

  ns.HistoryService.prototype.getCurrentState = function(){
    if(this.currentUUID){
      return this.stateQueue[this.currentUUID];
    }
    else{
      return false;
    }
  };

  ns.HistoryService.prototype.pushNewState_ = function(state){
    // Generate a random UUID (~1e28 combinations)
    var uuid = 'xxxxxx'.replace(/x/g, function(){
      return (Math.random() * 36 << 0).toString(36);
    });

    var currentState = this.getCurrentState();
    if(currentState){
      // Clear unlinked states
      if(currentState.nextIndex){
        this.clearBranchingQueue_(currentState.nextIndex);
      }

      currentState.nextIndex = uuid;
    }

    state.previousIndex = this.currentUUID;
    this.stateQueue[uuid] = state;

    this.currentUUID = uuid;
  };

  ns.HistoryService.prototype.clearBranchingQueue_ = function(index){
    while(this.stateQueue[index]){
      var next = this.stateQueue[index].nextIndex;
      delete(this.stateQueue[index]);
      index = next;
    }
  };

  ns.HistoryService.prototype.undo = function () {
    var currentState = this.getCurrentState();
    if(currentState.previousIndex)
      this.loadState(currentState.previousIndex);
  };

  ns.HistoryService.prototype.redo = function () {
    var currentState = this.getCurrentState();
    if(currentState.nextIndex)
      this.loadState(currentState.nextIndex);
  };

  ns.HistoryService.prototype.isLoadStateAllowed_ = function (index) {
    var timeOk = (Date.now() - this.lastLoadState) > ns.HistoryService.LOAD_STATE_INTERVAL;
    var indexInRange = index && this.stateQueue[index];
    return timeOk && indexInRange;
  };

  ns.HistoryService.prototype.getPreviousSnapshotIndex_ = function (index) {
    while (this.stateQueue[index] && !this.stateQueue[index].piskel) {
      index = this.stateQueue[index].previousIndex;
    }
    return index;
  };

  ns.HistoryService.prototype.loadState = function (index) {
    try {
      if (this.isLoadStateAllowed_(index)) {
        this.lastLoadState = Date.now();

        var snapshotIndex = this.getPreviousSnapshotIndex_(index);
        if (!snapshotIndex) {
          throw 'Could not find previous SNAPSHOT saved in history stateQueue';
        }
        var serializedPiskel = this.getSnapshotFromState_(snapshotIndex);
        var onPiskelLoadedCb = this.onPiskelLoaded_.bind(this, index, snapshotIndex);
        this.deserializer.deserialize(serializedPiskel, onPiskelLoadedCb);
      }
    } catch (error) {
      console.error('[CRITICAL ERROR] : Unable to load a history state.');
      this.logError_(error);
      this.stateQueue = [];
      this.currentUUID = false;
    }
  };

  ns.HistoryService.prototype.logError_ = function (error) {
    if (typeof error === 'string') {
      console.error(error);
    } else {
      console.error(error.message);
      console.error(error.stack);
    }
  };

  ns.HistoryService.prototype.getSnapshotFromState_ = function (stateIndex) {
    var state = this.stateQueue[stateIndex];
    var piskelSnapshot = state.piskel;

    // If the snapshot is stringified, parse it and backup the result for faster access next time
    // FIXME : Memory consumption might go crazy if we keep unpacking big piskels indefinitely
    // ==> should ensure I remove some of them :)
    if (typeof piskelSnapshot === 'string') {
      piskelSnapshot = JSON.parse(piskelSnapshot);
      state.piskel = piskelSnapshot;
    }

    return piskelSnapshot;
  };

  ns.HistoryService.prototype.onPiskelLoaded_ = function (index, snapshotIndex, piskel) {
    var originalSize = this.getPiskelSize_();
    piskel.setDescriptor(this.piskelController.piskel.getDescriptor());
    // propagate save path to the new piskel instance
    piskel.savePath = this.piskelController.piskel.savePath;
    this.piskelController.setPiskel(piskel);

    var walkingIndex = snapshotIndex;
    while(walkingIndex && walkingIndex != index){
      walkingIndex = this.stateQueue[walkingIndex].nextIndex;
      if(walkingIndex){
        var state = this.stateQueue[walkingIndex];
        this.setupState(state);
        this.replayState(state);
      }
    }

    // Should only do this when going backwards
    var next = this.stateQueue[index].nextIndex;
    if (next) {
      this.setupState(this.stateQueue[next]);
    }

    this.currentUUID = index;
    $.publish(Events.PISKEL_RESET);
    $.publish(Events.HISTORY_STATE_LOADED);
    if (originalSize !== this.getPiskelSize_()) {
      $.publish(Events.FRAME_SIZE_CHANGED);
    }
  };

  ns.HistoryService.prototype.getPiskelSize_ = function () {
    return this.piskelController.getWidth() + 'x' + this.piskelController.getHeight();
  };

  ns.HistoryService.prototype.setupState = function (state) {
    this.piskelController.setCurrentFrameIndex(state.frameIndex);
    this.piskelController.setCurrentLayerIndex(state.layerIndex);
  };

  ns.HistoryService.prototype.replayState = function (state) {
    var action = state.action;
    var type = action.type;
    var layer = this.piskelController.getLayerAt(state.layerIndex);
    var frame = layer.getFrameAt(state.frameIndex);
    action.scope.replay(frame, action.replay);
  };

})();
