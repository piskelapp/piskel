(function () {
  var ns = $.namespace('pskl.service');

  ns.SavedStatusService = function (piskelController) {
    this.piskelController_ = piskelController;
  };

  ns.SavedStatusService.prototype.init = function () {
    $.subscribe(Events.TOOL_RELEASED, this.onToolReleased.bind(this));
    $.subscribe(Events.PISKEL_RESET, this.onPiskelReset.bind(this));

    $.subscribe(Events.PISKEL_SAVED, this.onPiskelSaved.bind(this));

    window.addEventListener("beforeunload", this.onBeforeUnload.bind(this));
  };

  ns.SavedStatusService.prototype.onPiskelReset = function () {
    var piskel = this.piskelController_.piskel;
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
    var piskel = this.piskelController_.piskel;
    if (piskel.isDirty_ !== status) {
      piskel.isDirty_ = status;
      this.updatePiskelName();
    }
  };

  ns.SavedStatusService.prototype.updatePiskelName = function () {
    var piskel = this.piskelController_.piskel;
    var name = piskel.getDescriptor().name;
    if (piskel.isDirty_) {
      $('.piskel-name').html(name + ' *');
    } else {
      $('.piskel-name').html(name);
    }
  };

  ns.SavedStatusService.prototype.onBeforeUnload = function (evt) {
    var piskel = this.piskelController_.piskel;
    if (piskel.isDirty_) {
      var confirmationMessage = "Your Piskel seem to have unsaved changes";

      (evt || window.event).returnValue = confirmationMessage;
      return confirmationMessage;
    }
  };
})();