import { Events } from "../../Events";
import { app } from "../../app";
import { Dom } from "../../utils/Dom";
import { Environment } from "../../utils/Environment";
import { assertDefined } from "../../utils/core";
import type { PublicPiskelController } from "../piskel/PublicPiskelController";
import { AbstractSettingController } from "./AbstractSettingController";

export class ImportController extends AbstractSettingController {
  piskelController: PublicPiskelController;
  hiddenFileInput: HTMLInputElement | undefined;
  hiddenOpenPiskelInput: HTMLInputElement | undefined;

  constructor(piskelController: PublicPiskelController) {
    super();
    this.piskelController = piskelController;
  }

  init(): void {
    this.hiddenFileInput = Dom.getElement<HTMLInputElement>(
      '[name="file-upload-input"]'
    );
    this.addEventListener(
      this.hiddenFileInput,
      "change",
      this.onFileUploadChange_
    );

    this.hiddenOpenPiskelInput = Dom.getElement<HTMLInputElement>(
      '[name="open-piskel-input"]'
    );

    this.addEventListener(
      ".browse-local-button",
      "click",
      this.onBrowseLocalClick_
    );
    this.addEventListener(
      ".browse-backups-button",
      "click",
      this.onBrowseBackupsClick_
    );
    this.addEventListener(
      ".file-input-button",
      "click",
      this.onFileInputClick_
    );

    // different handlers, depending on the Environment
    if (Environment.detectNodeWebkit()) {
      this.addEventListener(
        ".open-piskel-button",
        "click",
        this.openPiskelDesktop_
      );
    } else {
      this.addEventListener(
        this.hiddenOpenPiskelInput,
        "change",
        this.onOpenPiskelChange_
      );
      this.addEventListener(
        ".open-piskel-button",
        "click",
        this.onOpenPiskelClick_
      );
    }
  }

  closeDrawer_(): void {
    $.publish(Events.CLOSE_SETTINGS_DRAWER);
  }

  onFileUploadChange_(evt: Event): void {
    this.importPictureFromFile_();
  }

  onFileInputClick_(evt: Event): void {
    assertDefined(this.hiddenFileInput, "hiddenFileInput").click();
  }

  onOpenPiskelChange_(evt: Event): void {
    const files = assertDefined(
      this.hiddenOpenPiskelInput,
      "hiddenOpenPiskelInput"
    ).files;
    if (files && files.length == 1) {
      this.openPiskelFile_(files[0]);
    }
  }

  openPiskelDesktop_(evt: Event): void {
    this.closeDrawer_();
    assertDefined(
      app.desktopStorageService,
      "desktopStorageService"
    ).openPiskel();
  }

  onOpenPiskelClick_(evt: Event): void {
    assertDefined(this.hiddenOpenPiskelInput, "hiddenOpenPiskelInput").click();
  }

  onBrowseLocalClick_(evt: Event): void {
    $.publish(Events.DIALOG_SHOW, {
      dialogId: "browse-local"
    });
    this.closeDrawer_();
  }

  onBrowseBackupsClick_(evt: Event): void {
    $.publish(Events.DIALOG_SHOW, {
      dialogId: "browse-backups"
    });
    this.closeDrawer_();
  }

  openPiskelFile_(file: File): void {
    if (this.isPiskel_(file)) {
      $.publish(Events.DIALOG_SHOW, {
        dialogId: "import",
        initArgs: {
          rawFiles: [file]
        }
      });
      this.closeDrawer_();
    } else {
      this.closeDrawer_();
      console.error("The selected file is not a piskel file");
    }
  }

  importPictureFromFile_(): void {
    const files = assertDefined(this.hiddenFileInput, "hiddenFileInput").files;
    // TODO : Simply filter and remove stuff
    const areImages = Array.prototype.every.call(files, function (file: File) {
      return file.type.indexOf("image") === 0;
    });
    if (areImages) {
      $.publish(Events.DIALOG_SHOW, {
        dialogId: "import",
        initArgs: {
          rawFiles: files
        }
      });
      this.closeDrawer_();
    } else {
      this.closeDrawer_();
      console.error("Some files are not images");
    }
  }

  isPiskel_(file: File): boolean {
    return /\.piskel$/.test(file.name);
  }

  onRestorePreviousSessionClick_(): void {
    if (window.confirm("This will erase your current workspace. Continue ?")) {
      assertDefined(app.backupService, "backupService").load();
      $.publish(Events.CLOSE_SETTINGS_DRAWER);
    }
  }
}
