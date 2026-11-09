import { app } from "../app";
import type { PublicPiskelController } from "../controller/piskel/PublicPiskelController";
import { Environment } from "../utils/Environment";
import { assertDefined } from "../utils/core";

export class BeforeUnloadService {
  piskelController: PublicPiskelController;

  constructor(piskelController: PublicPiskelController) {
    this.piskelController = piskelController;
  }

  init(): void {
    if (Environment.detectNodeWebkit()) {
      // Add a dedicated listener to window 'close' event in nwjs environment.
      const win = window.require("nw.gui").Window.get();
      win.on("close", this.onNwWindowClose.bind(this, win));
    }

    window.addEventListener("beforeunload", this.onBeforeUnload.bind(this));
  }

  /**
   * In nw.js environment "onbeforeunload" is not triggered when closing the window.
   * Polyfill the behavior here.
   */
  onNwWindowClose(win: { close: (arg0: boolean) => void }): false | undefined {
    const msg = this.onBeforeUnload();
    if (msg) {
      if (!window.confirm(msg)) {
        return false;
      }
    }
    win.close(true);
  }

  onBeforeUnload(evt?: BeforeUnloadEvent): string | undefined {
    // Attempt one last backup. Some of it may fail due to the asynchronous
    // nature of IndexedDB.
    assertDefined(app.backupService, "backupService").backup();
    if (assertDefined(app.savedStatusService, "savedStatusService").isDirty()) {
      const confirmationMessage =
        "Your current sprite has unsaved changes. Are you sure you want to quit?";

      evt = evt || window.event;
      if (evt) {
        evt.returnValue = confirmationMessage;
      }
      return confirmationMessage;
    }
  }
}
