import type { Session } from "../../../database/BackupDatabase";
import { Dom } from "../../../utils/Dom";
import { Template } from "../../../utils/Template";
import { assertDefined } from "../../../utils/core";
import {
  Wizard,
  type WizardStepInstance,
  type WizardSteps
} from "../../../widgets/Wizard";
import type { PublicPiskelController } from "../../piskel/PublicPiskelController";
import { AbstractDialogController } from "../AbstractDialogController";
import { SelectSession } from "./steps/SelectSession";
import { SessionDetails } from "./steps/SessionDetails";

type StepDefinition = {
  controller: new (
    piskelController: PublicPiskelController,
    backupsController: BrowseBackups,
    container: HTMLElement
  ) => WizardStepInstance;
  template: string;
};

const stepDefinitions: Record<string, StepDefinition> = {
  SELECT_SESSION: {
    controller: SelectSession,
    template: "backups-select-session"
  },
  SESSION_DETAILS: {
    controller: SessionDetails,
    template: "backups-session-details"
  }
};

export type BackupsData = {
  sessions: Session[];
  selectedSession: string | null;
};

export class BrowseBackups extends AbstractDialogController {
  piskelController: PublicPiskelController;
  backupsData: BackupsData;
  steps: WizardSteps | undefined;
  wizard: Wizard | undefined;

  constructor(piskelController: PublicPiskelController, args?: unknown) {
    super();
    this.piskelController = piskelController;

    // Backups data object used by steps to communicate and share their
    // results.
    this.backupsData = {
      sessions: [],
      selectedSession: null
    };
  }

  init(): void {
    super.init();

    // Prepare wizard steps.
    this.steps = this.createSteps_();

    // Start wizard widget.
    const wizardContainer = Dom.getElement<HTMLElement>(
      ".backups-wizard-container"
    );
    this.wizard = new Wizard(this.steps, wizardContainer);
    this.wizard.init();

    this.wizard.goTo("SELECT_SESSION");
  }

  back(): void {
    assertDefined(this.wizard, "wizard").back();
    assertDefined(this.wizard, "wizard").getCurrentStep().instance.onShow();
  }

  next(): void {
    const step = assertDefined(this.wizard, "wizard").getCurrentStep();
    if (step.name === "SELECT_SESSION") {
      assertDefined(this.wizard, "wizard").goTo("SESSION_DETAILS");
    }
  }

  destroy(): void {
    const steps = assertDefined(this.steps, "steps");
    Object.keys(steps).forEach((stepName: string) => {
      steps[stepName].instance.destroy();
    });

    super.destroy();
  }

  createSteps_(): WizardSteps {
    const steps: WizardSteps = {};
    Object.keys(stepDefinitions).forEach((stepName: string) => {
      const definition = stepDefinitions[stepName];
      const el = assertDefined(
        Template.getAsHTML(definition.template),
        "el"
      ) as HTMLElement;
      const instance = new definition.controller(
        this.piskelController,
        this,
        el
      );
      instance.init();
      steps[stepName] = {
        name: stepName,
        el: el,
        instance: instance
      };
    });

    return steps;
  }
}
