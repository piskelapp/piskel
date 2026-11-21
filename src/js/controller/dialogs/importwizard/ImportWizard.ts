import { Constants } from "@/Constants";
import { Events } from "@/Events";
import type { Piskel } from "@/model/Piskel";
import { Dom } from "@/utils/Dom";
import { MergeUtils } from "@/utils/MergeUtils";
import { PiskelFileUtils } from "@/utils/PiskelFileUtils";
import { Template } from "@/utils/Template";
import { assertInitialized } from "@/utils/core";
import {
  Wizard,
  type WizardStepInstance,
  type WizardSteps
} from "@/widgets/Wizard";
import type { PublicPiskelController } from "@/controller/piskel/PublicPiskelController";
import { AbstractDialogController } from "@/controller/dialogs/AbstractDialogController";
import { AdjustSize } from "./steps/AdjustSize";
import { ImageImport } from "./steps/ImageImport";
import { InsertLocation } from "./steps/InsertLocation";
import { SelectMode } from "./steps/SelectMode";

type StepDefinition = {
  controller: new (
    piskelController: PublicPiskelController,
    importController: ImportWizard,
    container: HTMLElement
  ) => WizardStepInstance;
  template: string;
};

const stepDefinitions: Record<string, StepDefinition> = {
  IMAGE_IMPORT: {
    controller: ImageImport,
    template: "import-image-import"
  },
  ADJUST_SIZE: {
    controller: AdjustSize,
    template: "import-adjust-size"
  },
  INSERT_LOCATION: {
    controller: InsertLocation,
    template: "import-insert-location"
  },
  SELECT_MODE: {
    controller: SelectMode,
    template: "import-select-mode"
  }
};

export type MergeData = {
  rawFiles: File[];
  mergePiskel: Piskel | null;
  origin: string | null;
  resize: string | null;
  insertIndex: number | null | undefined;
  insertMode: string | null;
  importMode?: string;
};

export class ImportWizard extends AbstractDialogController {
  piskelController: PublicPiskelController;
  mergeData: MergeData;
  steps: WizardSteps | undefined;
  wizard: Wizard | undefined;

  constructor(piskelController: PublicPiskelController) {
    super();
    this.piskelController = piskelController;

    // Merge data object used by steps to communicate and share their
    // results.
    this.mergeData = {
      rawFiles: [],
      mergePiskel: null,
      origin: null,
      resize: null,
      insertIndex: null,
      insertMode: null
    };
  }

  init(initArgs: { rawFiles: File[] }): void {
    super.init();

    // Prepare mergeData  object and wizard steps.
    this.mergeData.rawFiles = initArgs.rawFiles;
    this.steps = this.createSteps_();

    // Start wizard widget.
    const wizardContainer = Dom.getElement<HTMLElement>(
      ".import-wizard-container"
    );
    this.wizard = new Wizard(this.steps, wizardContainer);
    this.wizard.init();

    if (this.hasSingleImage_()) {
      this.wizard.goTo("IMAGE_IMPORT");
    } else if (this.hasSinglePiskelFile_()) {
      // If a piskel file was provided we can directly go to
      PiskelFileUtils.loadFromFile(
        this.mergeData.rawFiles[0],
        // onSuccess
        (piskel: Piskel) => {
          this.mergeData.mergePiskel = piskel;
          assertInitialized(this.wizard, "wizard").goTo("SELECT_MODE");
        },
        // onError
        (reason: string) => {
          this.closeDialog();
          $.publish(Events.PISKEL_FILE_IMPORT_FAILED, [reason]);
        }
      );
    } else {
      console.error(
        "Unsupported import. Only single piskel or single image are supported at the moment."
      );
      this.closeDialog();
    }
  }

  back(): void {
    assertInitialized(this.wizard, "wizard").back();
    assertInitialized(this.wizard, "wizard").getCurrentStep().instance.onShow();
  }

  next(): void {
    const step = assertInitialized(this.wizard, "wizard").getCurrentStep();

    if (step.name === "IMAGE_IMPORT") {
      if (this.piskelController.isEmpty()) {
        // If the current sprite is empty finalize immediately and replace the current sprite.
        this.mergeData.importMode = SelectMode.MODES.REPLACE;
        this.finalizeImport_();
      } else {
        assertInitialized(this.wizard, "wizard").goTo("SELECT_MODE");
      }
    } else if (step.name === "SELECT_MODE") {
      if (this.mergeData.importMode === SelectMode.MODES.REPLACE) {
        this.finalizeImport_();
      } else if (this.hasSameSize_()) {
        assertInitialized(this.wizard, "wizard").goTo("INSERT_LOCATION");
      } else {
        assertInitialized(this.wizard, "wizard").goTo("ADJUST_SIZE");
      }
    } else if (step.name === "ADJUST_SIZE") {
      assertInitialized(this.wizard, "wizard").goTo("INSERT_LOCATION");
    } else if (step.name === "INSERT_LOCATION") {
      this.finalizeImport_();
    }
  }

  destroy(): void {
    const steps = assertInitialized(this.steps, "steps");
    Object.keys(steps).forEach((stepName: string) => {
      steps[stepName].instance.destroy();
    });

    super.destroy();
  }

  createSteps_(): WizardSteps {
    // The IMAGE_IMPORT step is used only if there is a single image file
    // being imported.
    const hasSingleImage = this.hasSingleImage_();

    const steps: WizardSteps = {};
    Object.keys(stepDefinitions).forEach((stepName: string) => {
      if (stepName === "IMAGE_IMPORT" && !hasSingleImage) {
        return;
      }

      const definition = stepDefinitions[stepName];
      const el = Template.getAsHTML(definition.template) as
        | HTMLElement
        | undefined;
      if (el === undefined) {
        throw new Error("Missing template: " + definition.template);
      }
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

    if (hasSingleImage) {
      steps.IMAGE_IMPORT.el.classList.add("import-first-step");
    } else {
      steps.SELECT_MODE.el.classList.add("import-first-step");
    }

    return steps;
  }

  finalizeImport_(): void {
    const piskel = assertInitialized(this.mergeData.mergePiskel, "mergePiskel");
    const mode = this.mergeData.importMode;

    if (mode === SelectMode.MODES.REPLACE) {
      // Replace the current piskel and close the dialog.
      if (window.confirm(Constants.CONFIRM_OVERWRITE)) {
        this.piskelController.setPiskel(piskel);
        this.closeDialog();
      }
    } else if (mode === SelectMode.MODES.MERGE) {
      const merge = MergeUtils.merge(
        this.piskelController.getPiskel(),
        piskel,
        {
          insertIndex: this.mergeData.insertIndex,
          insertMode: this.mergeData.insertMode,
          origin: assertInitialized(this.mergeData.origin, "origin"),
          resize: this.mergeData.resize
        }
      );
      this.piskelController.setPiskel(merge);

      // Set the first imported layer as selected.
      const importedLayers = piskel.getLayers().length;
      const currentLayers = this.piskelController.getLayers().length;
      this.piskelController.setCurrentLayerIndex(
        currentLayers - importedLayers
      );

      this.closeDialog();
    }
  }

  hasSameSize_(): boolean {
    const piskel = assertInitialized(this.mergeData.mergePiskel, "mergePiskel");
    if (!piskel) {
      return false;
    }

    return (
      piskel.width === this.piskelController.getWidth() &&
      piskel.height === this.piskelController.getHeight()
    );
  }

  hasSingleImage_(): boolean {
    if (this.mergeData.rawFiles.length !== 1) {
      return false;
    }

    const file = this.mergeData.rawFiles[0];
    return file.type.indexOf("image") === 0;
  }

  hasSinglePiskelFile_(): boolean {
    if (this.mergeData.rawFiles.length !== 1) {
      return false;
    }

    const file = this.mergeData.rawFiles[0];
    return /\.piskel$/.test(file.name);
  }
}
