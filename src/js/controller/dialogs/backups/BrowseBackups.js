(function () {
  var ns = $.namespace('pskl.controller.dialogs.backups');

  var stepDefinitions = {
    'SELECT_SESSION' : {
      controller : ns.steps.SelectSession,
      template : 'backups-select-session'
    },
    'SESSION_DETAILS' : {
      controller : ns.steps.SessionDetails,
      template : 'backups-session-details'
    },
  };

  ns.BrowseBackups = function (piskelController, args) {
    this.piskelController = piskelController;

    // Backups data object used by steps to communicate and share their
    // results.
    this.backupsData = {
      sessions: [],
      selectedSession : null
    };
  };

  pskl.utils.inherit(ns.BrowseBackups, pskl.controller.dialogs.AbstractDialogController);

  ns.BrowseBackups.prototype.init = function () {
    this.superclass.init.call(this);

    // Prepare wizard steps.
    this.steps = this.createSteps_();

    // Start wizard widget.
    var wizardContainer = document.querySelector('.backups-wizard-container');
    this.wizard = new pskl.widgets.Wizard(this.steps, wizardContainer);
    this.wizard.init();

    this.wizard.goTo('SELECT_SESSION');
  };

  ns.BrowseBackups.prototype.back = function () {
    this.wizard.back();
    this.wizard.getCurrentStep().instance.onShow();
  };

  ns.BrowseBackups.prototype.next = function () {
    var step = this.wizard.getCurrentStep();
    if (step.name === 'SELECT_SESSION') {
      this.wizard.goTo('SESSION_DETAILS');
    }
  };

  ns.BrowseBackups.prototype.destroy = function (file) {
    Object.keys(this.steps).forEach(function (stepName) {
      var step = this.steps[stepName];
      step.instance.destroy();
      step.instance = null;
      step.el = null;
    }.bind(this));

    this.superclass.destroy.call(this);
  };

  ns.BrowseBackups.prototype.createSteps_ = function () {
    var steps = {};
    Object.keys(stepDefinitions).forEach(function (stepName) {
      var definition = stepDefinitions[stepName];
      var el = pskl.utils.Template.getAsHTML(definition.template);
      var instance = new definition.controller(this.piskelController, this, el);
      instance.init();
      steps[stepName] = {
        name: stepName,
        el: el,
        instance: instance
      };
    }.bind(this));

    return steps;
  };
})();
