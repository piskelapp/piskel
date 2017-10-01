(function () {
  var ns = $.namespace('pskl.controller.dialogs.importwizard');

  var stepDefinitions = {
    'IMAGE_IMPORT' : {
      controller : ns.steps.ImageImport,
      template : 'import-image-import'
    },
    'ADJUST_SIZE' : {
      controller : ns.steps.AdjustSize,
      template : 'import-adjust-size'
    },
    'INSERT_LOCATION' : {
      controller : ns.steps.InsertLocation,
      template : 'import-insert-location'
    },
    'SELECT_MODE' : {
      controller : ns.steps.SelectMode,
      template : 'import-select-mode'
    }
  };

  ns.ImportWizard = function (piskelController, args) {
    this.piskelController = piskelController;

    // Merge data object used by steps to communicate and share their
    // results.
    this.mergeData = {
      rawFiles : [],
      mergePiskel: null,
      origin: null,
      resize: null,
      insertIndex: null,
      insertMode: null
    };
  };

  pskl.utils.inherit(ns.ImportWizard, pskl.controller.dialogs.AbstractDialogController);

  ns.ImportWizard.prototype.init = function (initArgs) {
    this.superclass.init.call(this);

    // Prepare mergeData  object and wizard steps.
    this.mergeData.rawFiles = initArgs.rawFiles;
    this.steps = this.createSteps_();

    // Start wizard widget.
    var wizardContainer = document.querySelector('.import-wizard-container');
    this.wizard = new pskl.widgets.Wizard(this.steps, wizardContainer);
    this.wizard.init();

    if (this.hasSingleImage_()) {
      this.wizard.goTo('IMAGE_IMPORT');
    } else if (this.hasSinglePiskelFile_()) {
      // If a piskel file was provided we can directly go to
      pskl.utils.PiskelFileUtils.loadFromFile(this.mergeData.rawFiles[0],
        // onSuccess
        function (piskel) {
          this.mergeData.mergePiskel = piskel;
          this.wizard.goTo('SELECT_MODE');
        }.bind(this),
        // onError
        function (reason) {
          this.closeDialog();
          $.publish(Events.PISKEL_FILE_IMPORT_FAILED, [reason]);
        }.bind(this)
      );
    } else {
      console.error('Unsupported import. Only single piskel or single image are supported at the moment.');
      this.closeDialog();
    }
  };

  ns.ImportWizard.prototype.back = function () {
    this.wizard.back();
    this.wizard.getCurrentStep().instance.onShow();
  };

  ns.ImportWizard.prototype.next = function () {
    var step = this.wizard.getCurrentStep();

    if (step.name === 'IMAGE_IMPORT') {
      if (this.piskelController.isEmpty()) {
        // If the current sprite is empty finalize immediately and replace the current sprite.
        this.mergeData.importMode = ns.steps.SelectMode.MODES.REPLACE;
        this.finalizeImport_();
      } else {
        this.wizard.goTo('SELECT_MODE');
      }
    } else if (step.name === 'SELECT_MODE') {
      if (this.mergeData.importMode === ns.steps.SelectMode.MODES.REPLACE) {
        this.finalizeImport_();
      } else if (this.hasSameSize_()) {
        this.wizard.goTo('INSERT_LOCATION');
      } else {
        this.wizard.goTo('ADJUST_SIZE');
      }
    } else if (step.name === 'ADJUST_SIZE') {
      this.wizard.goTo('INSERT_LOCATION');
    } else if (step.name === 'INSERT_LOCATION') {
      this.finalizeImport_();
    }
  };

  ns.ImportWizard.prototype.destroy = function (file) {
    Object.keys(this.steps).forEach(function (stepName) {
      var step = this.steps[stepName];
      step.instance.destroy();
      step.instance = null;
      step.el = null;
    }.bind(this));

    this.superclass.destroy.call(this);
  };

  ns.ImportWizard.prototype.createSteps_ = function () {
    // The IMAGE_IMPORT step is used only if there is a single image file
    // being imported.
    var hasSingleImage = this.hasSingleImage_();

    var steps = {};
    Object.keys(stepDefinitions).forEach(function (stepName) {
      if (stepName === 'IMAGE_IMPORT' && !hasSingleImage) {
        return;
      }

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

    if (hasSingleImage) {
      steps.IMAGE_IMPORT.el.classList.add('import-first-step');
    } else {
      steps.SELECT_MODE.el.classList.add('import-first-step');
    }

    return steps;
  };

  ns.ImportWizard.prototype.finalizeImport_ = function () {
    var piskel = this.mergeData.mergePiskel;
    var mode = this.mergeData.importMode;

    if (mode === ns.steps.SelectMode.MODES.REPLACE) {
      // Replace the current piskel and close the dialog.
      if (window.confirm(Constants.CONFIRM_OVERWRITE)) {
        this.piskelController.setPiskel(piskel);
        this.closeDialog();
      }
    } else if (mode === ns.steps.SelectMode.MODES.MERGE) {
      var merge = pskl.utils.MergeUtils.merge(this.piskelController.getPiskel(), piskel, {
        insertIndex: this.mergeData.insertIndex,
        insertMode: this.mergeData.insertMode,
        origin: this.mergeData.origin,
        resize: this.mergeData.resize
      });
      this.piskelController.setPiskel(merge);

      // Set the first imported layer as selected.
      var importedLayers = piskel.getLayers().length;
      var currentLayers = this.piskelController.getLayers().length;
      this.piskelController.setCurrentLayerIndex(currentLayers - importedLayers);

      this.closeDialog();
    }
  };

  ns.ImportWizard.prototype.hasSameSize_ = function () {
    var piskel = this.mergeData.mergePiskel;
    if (!piskel) {
      return false;
    }

    return piskel.width === this.piskelController.getWidth() &&
           piskel.height === this.piskelController.getHeight();
  };

  ns.ImportWizard.prototype.hasSingleImage_ = function () {
    if (this.mergeData.rawFiles.length !== 1) {
      return false;
    }

    var file = this.mergeData.rawFiles[0];
    return file.type.indexOf('image') === 0;
  };

  ns.ImportWizard.prototype.hasSinglePiskelFile_ = function () {
    if (this.mergeData.rawFiles.length !== 1) {
      return false;
    }

    var file = this.mergeData.rawFiles[0];
    return (/\.piskel$/).test(file.name);
  };
})();
