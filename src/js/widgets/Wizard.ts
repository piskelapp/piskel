import { assertDefined } from "../utils/core";
const TRANSITION_DURATION = 200;

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
export type WizardStepInstance = {
  init(): void;
  onShow(): void;
  destroy(): void;
};

export type WizardStep = {
  el: HTMLElement;
  name: string;
  instance: WizardStepInstance;
};

export type WizardSteps = Record<string, WizardStep>;

export class Wizard {
  steps: WizardSteps;
  container: HTMLElement;
  wrapper: HTMLElement;
  currentStep: WizardStep | null;
  previousSteps: WizardStep[];

  constructor(steps: WizardSteps, container: HTMLElement) {
    this.steps = steps;
    this.container = container;

    // Create internal wrapper that will contain the wizard steps.
    this.wrapper = document.createElement("div");
    this.wrapper.classList.add("wizard-wrapper");

    this.currentStep = null;
    this.previousSteps = [];
  }

  init(): void {
    // Prepare all steps and add them in the wrapper.
    Object.keys(this.steps).forEach((stepName: string) => {
      const step = this.steps[stepName];
      step.el.classList.add("wizard-step");
      this.wrapper.appendChild(step.el);
    });
    this.container.appendChild(this.wrapper);
  }

  getStep(stepName: string): WizardStep {
    return this.steps[stepName];
  }

  getCurrentStep(): WizardStep {
    return assertDefined(this.currentStep, "currentStep");
  }

  /**
   * Transition to the step cirresponding to the provided step name.
   * Animation will be skipped if no current step is displayed.
   */
  goTo(stepName: string): void {
    const step = this.steps[stepName];
    if (!step) {
      console.error("Wizard could not go to unknown step: " + stepName);
      return;
    }

    const previousStep = this.currentStep;
    this.currentStep = step;
    this.currentStep.instance.onShow();

    if (previousStep) {
      this.previousSteps.push(previousStep);

      // Update classes to trigger animation.
      this.currentStep.el.classList.add("current-step-in");

      const stepBefore = previousStep;
      window.setTimeout(() => {
        const currentStep = assertDefined(this.currentStep, "currentStep");
        // Cleanup transition classes after animation.
        currentStep.el.classList.remove("current-step-in");
        stepBefore.el.classList.remove("current-step");
        currentStep.el.classList.add("current-step");
      }, TRANSITION_DURATION);
    } else {
      this.currentStep.el.classList.add("current-step");
    }
  }

  /**
   * Go back to the previous step displayed, if available.
   */
  back(): void {
    const previousStep = this.previousSteps.pop();
    if (!previousStep) {
      console.error("Wizard has no previous step to go to.");
      return;
    }

    if (!this.currentStep) {
      console.error("Wizard is in an invalid state");
    }
    const backedStep = assertDefined(this.currentStep, "backedStep");

    this.currentStep = previousStep;

    // Update classes to trigger animation.
    backedStep.el.classList.add("current-step-out");
    backedStep.el.classList.remove("current-step");
    this.currentStep.el.classList.add("current-step");

    window.setTimeout(() => {
      // Cleanup transition classes after animation.
      backedStep.el.classList.remove("current-step-out");
    }, TRANSITION_DURATION);
  }
}
