(function () {
  var ns = $.namespace('pskl.widgets');
  var TRANSITION_DURATION = 200;

  /**
   * Simple layout widget to display one step element (DOM Element) at a time.
   * When switching to another step, the new step element will slide over the
   * current step element. When going back to the previous step, the current
   * step element will slide out from the container to reveal the previous one.
   *
   * @param {Object} steps map of step descriptions with the step name as the key.
   *        Each step description contains:
   *        - el {Element} the DOM Element corresponding to this step
   *        - name {String} the name of the step (redundant with the key)
   * @param {Element} container the DOM Element in which the wizard should be
   *        displayed.
   */
  ns.Wizard = function (steps, container) {
    this.steps = steps;
    this.container = container;

    // Create internal wrapper that will contain the wizard steps.
    this.wrapper = document.createElement('div');
    this.wrapper.classList.add('wizard-wrapper');

    this.currentStep = null;
    this.previousSteps = [];
  };

  ns.Wizard.prototype.init = function () {
    // Prepare all steps and add them in the wrapper.
    Object.keys(this.steps).forEach(function (stepName) {
      var step = this.steps[stepName];
      step.el.classList.add('wizard-step');
      this.wrapper.appendChild(step.el);
    }.bind(this));
    this.container.appendChild(this.wrapper);
  };

  ns.Wizard.prototype.getStep = function (stepName) {
    return this.steps[stepName];
  };

  ns.Wizard.prototype.getCurrentStep = function () {
    return this.currentStep;
  };

  /**
   * Transition to the step cirresponding to the provided step name.
   * Animation will be skipped if no current step is displayed.
   */
  ns.Wizard.prototype.goTo = function (stepName) {
    var step = this.steps[stepName];
    if (!step) {
      console.error('Wizard could not go to unknown step: ' + stepName);
      return;
    }

    var previousStep = this.currentStep;
    this.currentStep = step;
    this.currentStep.instance.onShow();

    if (previousStep) {
      this.previousSteps.push(previousStep);

      // Update classes to trigger animation.
      this.currentStep.el.classList.add('current-step-in');

      window.setTimeout(function () {
        // Cleanup transition classes after animation.
        this.currentStep.el.classList.remove('current-step-in');
        previousStep.el.classList.remove('current-step');
        this.currentStep.el.classList.add('current-step');
      }.bind(this), TRANSITION_DURATION);
    } else {
      this.currentStep.el.classList.add('current-step');
    }
  };

  /**
   * Go back to the previous step displayed, if available.
   */
  ns.Wizard.prototype.back = function () {
    var previousStep = this.previousSteps.pop();
    if (!previousStep) {
      console.error('Wizard has no previous step to go to.');
      return;
    }

    var backedStep = this.currentStep;
    if (!backedStep) {
      console.error('Wizard is in an invalid state');
    }

    this.currentStep = previousStep;

    // Update classes to trigger animation.
    backedStep.el.classList.add('current-step-out');
    backedStep.el.classList.remove('current-step');
    this.currentStep.el.classList.add('current-step');

    window.setTimeout(function () {
      // Cleanup transition classes after animation.
      backedStep.el.classList.remove('current-step-out');
    }.bind(this), TRANSITION_DURATION);
  };
})();
