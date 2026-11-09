import { Events } from "../../Events";
import { app } from "../../app";
import type { PublicPiskelController } from "../../controller/piskel/PublicPiskelController";
import type { Piskel } from "../../model/Piskel";
import { Environment } from "../../utils/Environment";
import { assertDefined } from "../../utils/core";
import { Shortcuts } from "../keyboard/Shortcuts";
import type { DesktopStorageService } from "./DesktopStorageService";
import type { FileDownloadStorageService } from "./FileDownloadStorageService";
import type { IndexedDbStorageService } from "./IndexedDbStorageService";
import type { LocalStorageService } from "./LocalStorageService";

export class StorageService {
  piskelController: PublicPiskelController;
  savingFlag_: boolean;

  constructor(piskelController: PublicPiskelController) {
    this.piskelController = piskelController;
    this.savingFlag_ = false;

    this.onSaveSuccess_ = this.onSaveSuccess_.bind(this);
    this.onSaveError_ = this.onSaveError_.bind(this);
  }

  init(): void {
    const shortcuts = Shortcuts;
    assertDefined(app.shortcutService, "shortcutService").registerShortcut(
      shortcuts.STORAGE.OPEN,
      this.onOpenKey_.bind(this)
    );
    assertDefined(app.shortcutService, "shortcutService").registerShortcut(
      shortcuts.STORAGE.SAVE,
      this.onSaveKey_.bind(this)
    );
    assertDefined(app.shortcutService, "shortcutService").registerShortcut(
      shortcuts.STORAGE.SAVE_AS,
      this.onSaveAsKey_.bind(this)
    );

    $.subscribe(
      Events.BEFORE_SAVING_PISKEL,
      this.setSavingFlag_.bind(this, true)
    );
    $.subscribe(
      Events.AFTER_SAVING_PISKEL,
      this.setSavingFlag_.bind(this, false)
    );
  }

  isSaving(): boolean {
    return this.savingFlag_;
  }

  // @deprecated, use saveToIndexedDb unless indexedDb is not available.
  saveToLocalStorage(piskel: Piskel): Promise<void> {
    return this.delegateSave_(app.localStorageService, piskel);
  }

  saveToIndexedDb(piskel: Piskel): Promise<void> {
    return this.delegateSave_(app.indexedDbStorageService, piskel);
  }

  saveToFileDownload(piskel: Piskel): Promise<void> {
    return this.delegateSave_(app.fileDownloadStorageService, piskel);
  }

  saveToDesktop(piskel: Piskel, saveAsNew?: boolean): Promise<void> {
    return this.delegateSave_(app.desktopStorageService, piskel, saveAsNew);
  }

  delegateSave_(
    delegatedService:
      | IndexedDbStorageService
      | LocalStorageService
      | DesktopStorageService
      | FileDownloadStorageService
      | undefined,
    piskel: Piskel,
    saveAsNew?: boolean
  ): Promise<void> {
    if (this.savingFlag_) {
      return Promise.reject("Already saving");
    }

    $.publish(Events.BEFORE_SAVING_PISKEL);
    return assertDefined(delegatedService, "delegatedService")
      .save(piskel, saveAsNew)
      .then(this.onSaveSuccess_, this.onSaveError_);
  }

  onOpenKey_(): void {
    if (Environment.detectNodeWebkit()) {
      assertDefined(
        app.desktopStorageService,
        "desktopStorageService"
      ).openPiskel();
    }
    // no other implementation for now
  }

  onSaveKey_(charkey: string): void {
    if (Environment.detectNodeWebkit()) {
      this.saveToDesktop(this.piskelController.getPiskel());
    } else {
      // saveToLocalStorage might display a native confirm dialog
      // on Firefox, the native 'save' window will then be displayed
      // wrap in timeout in order to start saving only after event.preventDefault
      // has been done
      window.setTimeout(() => {
        this.saveToIndexedDb(this.piskelController.getPiskel());
      }, 0);
    }
  }

  onSaveAsKey_(): void {
    if (Environment.detectNodeWebkit()) {
      this.saveToDesktop(this.piskelController.getPiskel(), true);
    }
    // no other implementation for now
  }

  onSaveSuccess_(): void {
    $.publish(Events.SHOW_NOTIFICATION, [
      {
        content: "Successfully saved !",
        hideDelay: 3000
      }
    ]);
    $.publish(Events.PISKEL_SAVED);
    this.afterSaving_();
  }

  onSaveError_(errorMessage: string): Promise<never> {
    let errorText = "Saving failed";
    if (errorMessage) {
      errorText += " : " + errorMessage;
    }
    $.publish(Events.SHOW_NOTIFICATION, [
      {
        content: errorText,
        hideDelay: 10000
      }
    ]);
    this.afterSaving_();
    return Promise.reject(errorMessage);
  }

  afterSaving_(): void {
    $.publish(Events.AFTER_SAVING_PISKEL);
  }

  setSavingFlag_(savingFlag: boolean): void {
    this.savingFlag_ = savingFlag;
  }
}
