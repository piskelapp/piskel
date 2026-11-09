import { type DialogShowInfo, Events } from "../../Events";
import { app } from "../../app";
import type { JQueryEvent } from "../../lib/jquery-1.8.0";
import type { Shortcut } from "../../service/keyboard/Shortcut";
import { Shortcuts } from "../../service/keyboard/Shortcuts";
import { Dom } from "../../utils/Dom";
import { EventUtils } from "../../utils/Event";
import { Template } from "../../utils/Template";
import { assertDefined } from "../../utils/core";
import type { PublicPiskelController } from "../piskel/PublicPiskelController";
import { BrowseLocalController } from "./BrowseLocalController";
import { CheatsheetController } from "./CheatsheetController";
import { CreatePaletteController } from "./CreatePaletteController";
import { PerformanceInfoController } from "./PerformanceInfoController";
import { UnsupportedBrowserController } from "./UnsupportedBrowserController";
import { BrowseBackups } from "./backups/BrowseBackups";
import { ImportWizard } from "./importwizard/ImportWizard";

type DialogController = {
  init(initArgs?: unknown): void;
  destroy(): void;
};

type DialogDefinition = {
  template: string;
  controller: new (
    piskelController: PublicPiskelController,
    args?: unknown
  ) => DialogController;
};

const dialogs: Record<string, DialogDefinition> = {
  cheatsheet: {
    template: "templates/dialogs/cheatsheet.html",
    controller: CheatsheetController
  },
  "create-palette": {
    template: "templates/dialogs/create-palette.html",
    controller: CreatePaletteController
  },
  "browse-local": {
    template: "templates/dialogs/browse-local.html",
    controller: BrowseLocalController
  },
  import: {
    template: "templates/dialogs/import.html",
    controller: ImportWizard
  },
  "performance-info": {
    template: "templates/dialogs/performance-info.html",
    controller: PerformanceInfoController
  },
  "unsupported-browser": {
    template: "templates/dialogs/unsupported-browser.html",
    controller: UnsupportedBrowserController
  },
  "browse-backups": {
    template: "templates/dialogs/browse-backups.html",
    controller: BrowseBackups
  }
};

export class DialogsController {
  piskelController: PublicPiskelController;
  closePopupShortcut: Shortcut;
  currentDialog_: { id: string; controller: DialogController } | null;
  dialogContainer_: HTMLElement | undefined;
  dialogWrapper_: HTMLElement | undefined;
  isHiding_: boolean | undefined;

  constructor(piskelController: PublicPiskelController) {
    this.piskelController = piskelController;
    this.closePopupShortcut = Shortcuts.MISC.CLOSE_POPUP;
    this.currentDialog_ = null;
  }

  init(): void {
    this.dialogContainer_ = Dom.getElement<HTMLElement>("#dialog-container");
    this.dialogWrapper_ = Dom.getElement<HTMLElement>(
      "#dialog-container-wrapper"
    );

    $.subscribe(Events.DIALOG_SHOW, this.onDialogDisplayEvent_.bind(this));
    $.subscribe(Events.DIALOG_HIDE, this.hideDialog.bind(this));

    const createPaletteShortcut = Shortcuts.COLOR.CREATE_PALETTE;
    assertDefined(app.shortcutService, "shortcutService").registerShortcut(
      createPaletteShortcut,
      this.onCreatePaletteShortcut_.bind(this)
    );

    const cheatsheetShortcut = Shortcuts.MISC.CHEATSHEET;
    assertDefined(app.shortcutService, "shortcutService").registerShortcut(
      cheatsheetShortcut,
      this.onCheatsheetShortcut_.bind(this)
    );
    EventUtils.addEventListener(
      ".cheatsheet-link",
      "click",
      this.onCheatsheetShortcut_,
      this
    );

    // adding the .animated class here instead of in the markup to avoid an animation during app startup
    this.dialogWrapper_.classList.add("animated");
    EventUtils.addEventListener(
      this.dialogWrapper_,
      "click",
      this.onWrapperClicked_,
      this
    );
  }

  onCreatePaletteShortcut_(): void {
    this.toggleDialog_("create-palette");
  }

  onCheatsheetShortcut_(): void {
    this.toggleDialog_("cheatsheet");
  }

  /**
   * If no dialog is currently displayed, the dialog with the provided id will be displayed.
   * If a dialog is displayed and has the same id as the provided id, hide it.
   * Otherwise, no-op.
   */
  toggleDialog_(dialogId: string): void {
    if (!this.isDisplayingDialog_()) {
      this.showDialog(dialogId);
    } else if (this.getCurrentDialogId_() === dialogId) {
      this.hideDialog();
    }
  }

  onDialogDisplayEvent_(evt: JQueryEvent, args: DialogShowInfo): void {
    this.showDialog(args.dialogId, args.initArgs);
  }

  onWrapperClicked_(evt: Event): void {
    if (evt.target === this.dialogWrapper_) {
      this.hideDialog();
    }
  }

  showDialog(dialogId: string, initArgs?: unknown): void {
    if (this.isDisplayingDialog_()) {
      return;
    }

    const config = dialogs[dialogId];
    if (!config) {
      console.error(
        "Could not find dialog configuration for dialogId : " + dialogId
      );
      return;
    }

    assertDefined(this.dialogContainer_, "dialogContainer_").classList.add(
      dialogId
    );

    assertDefined(this.dialogContainer_, "dialogContainer_").innerHTML =
      Template.get(config.template);
    const controller = new config.controller(this.piskelController);
    controller.init(initArgs);

    this.currentDialog_ = {
      id: dialogId,
      controller: controller
    };

    assertDefined(app.shortcutService, "shortcutService").registerShortcut(
      this.closePopupShortcut,
      this.hideDialog.bind(this)
    );
    assertDefined(this.dialogWrapper_, "dialogWrapper_").classList.add("show");
  }

  hideDialog(): void {
    if (this.isHiding_ || !this.isDisplayingDialog_()) {
      return;
    }

    assertDefined(app.shortcutService, "shortcutService").unregisterShortcut(
      this.closePopupShortcut
    );
    assertDefined(this.dialogWrapper_, "dialogWrapper_").classList.remove(
      "show"
    );
    window.setTimeout(this.cleanupDialogContainer_.bind(this), 500);
    this.isHiding_ = true;
  }

  cleanupDialogContainer_(): void {
    assertDefined(this.dialogContainer_, "dialogContainer_").classList.remove(
      assertDefined(this.currentDialog_, "currentDialog_").id
    );
    assertDefined(this.currentDialog_, "currentDialog_").controller.destroy();
    this.currentDialog_ = null;

    assertDefined(this.dialogContainer_, "dialogContainer_").innerHTML = "";
    this.isHiding_ = false;
  }

  isDisplayingDialog_(): boolean {
    return this.currentDialog_ !== null;
  }

  getCurrentDialogId_(): string | null {
    if (this.currentDialog_) {
      return this.currentDialog_.id;
    }
    return null;
  }
}
