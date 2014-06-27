(function () {
  var ns = $.namespace('pskl.service');

  ns.SavedStatusService = function (piskelController) {
    this.piskelController = piskelController;
  };

  ns.SavedStatusService.prototype.init = function () {
    $.subscribe(Events.TOOL_RELEASED, this.onToolReleased.bind(this));
    $.subscribe(Events.PISKEL_RESET, this.onPiskelReset.bind(this));

    $.subscribe(Events.PISKEL_SAVED, this.onPiskelSaved.bind(this));
  };

  ns.SavedStatusService.prototype.onPiskelReset = function () {
    var piskel = this.piskelController.getPiskel();
    // A first PISKEL_RESET is triggered during the load of a new Piskel, it should be ignored
    // putting a firstResetDone flag as a nasty workaround for this
    if (piskel.firstResetDone_) {
      this.updateDirtyStatus(true);
    } else {
      piskel.firstResetDone_ = true;
    }
  };

  ns.SavedStatusService.prototype.onToolReleased = function () {
    this.updateDirtyStatus(true);
  };

  ns.SavedStatusService.prototype.onPiskelSaved = function () {
    this.updateDirtyStatus(false);
  };

  ns.SavedStatusService.prototype.updateDirtyStatus = function (status) {
    var piskel = this.piskelController.getPiskel();
    if (piskel.isDirty_ !== status) {
      // Redraw piskel name only if dirty status actually changed
      piskel.isDirty_ = status;
      this.updatePiskelName();
    }
  };

  ns.SavedStatusService.prototype.updatePiskelName = function () {
    var piskel = this.piskelController.getPiskel();
    var name = piskel.getDescriptor().name;
    if (piskel.isDirty_) {
      $('.piskel-name').html(name + ' *');
    } else {
      $('.piskel-name').html(name);
    }
  };

  ns.SavedStatusService.prototype.isDirty = function (evt) {
    var piskel = this.piskelController.getPiskel();
    return piskel.isDirty_;
  };
})();