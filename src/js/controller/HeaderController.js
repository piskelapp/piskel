(function () {
  var ns  = $.namespace('pskl.controller');

  /**
   * When embedded in piskelapp.com, the page adds a header containing the name of the currently edited sprite
   * This controller will keep the displayed name in sync with the actual piskel name
   */
  ns.HeaderController = function (piskelController, savedStatusService) {
    this.piskelController = piskelController;
    this.savedStatusService = savedStatusService;
  };

  ns.HeaderController.prototype.init = function () {
    this.piskelName_ = document.querySelector('.piskel-name');

    $.subscribe(Events.BEFORE_SAVING_PISKEL, this.onBeforeSavingPiskelEvent_.bind(this));
    $.subscribe(Events.AFTER_SAVING_PISKEL, this.onAfterSavingPiskelEvent_.bind(this));

    $.subscribe(Events.PISKEL_DESCRIPTOR_UPDATED, this.updateHeader_.bind(this));
    $.subscribe(Events.PISKEL_RESET, this.updateHeader_.bind(this));
    $.subscribe(Events.PISKEL_SAVED_STATUS_UPDATE, this.updateHeader_.bind(this));

    this.updateHeader_();
  };

  ns.HeaderController.prototype.updateHeader_ = function () {
    try {
      var name = this.piskelController.getPiskel().getDescriptor().name;
      if (this.savedStatusService.isDirty()) {
        name = name + ' *';
      }

      if (this.piskelName_) {
        this.piskelName_.textContent = name;
      }
    } catch (e) {
      console.warn('Could not update header : ' + e.message);
    }
  };

  ns.HeaderController.prototype.onBeforeSavingPiskelEvent_ = function () {
    if (!this.piskelName_) {
      return;
    }
    this.piskelName_.classList.add('piskel-name-saving');
  };

  ns.HeaderController.prototype.onAfterSavingPiskelEvent_ = function () {
    if (!this.piskelName_) {
      return;
    }
    this.piskelName_.classList.remove('piskel-name-saving');
  };

})();
