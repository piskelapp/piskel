import { app } from "../../app";
import type { PublicPiskelController } from "../../controller/piskel/PublicPiskelController";
import type { Piskel } from "../../model/Piskel";
import { FileUtilsDesktop } from "../../utils/FileUtilsDesktop";
import { PiskelFileUtils } from "../../utils/PiskelFileUtils";
import { assertDefined } from "../../utils/core";
import { Serializer } from "../../utils/serialization/Serializer";

const PISKEL_EXTENSION = ".piskel";

export class DesktopStorageService {
  piskelController: PublicPiskelController;
  hideNotificationTimeoutID: number;

  constructor(piskelController: PublicPiskelController) {
    this.piskelController = assertDefined(
      piskelController || app.piskelController,
      "piskelController"
    );
    this.hideNotificationTimeoutID = 0;
  }

  init(): void {}

  save(piskel: Piskel, saveAsNew?: boolean): Promise<void> {
    if (piskel.savePath && !saveAsNew) {
      return this.saveAtPath_(piskel, piskel.savePath);
    } else {
      const name = piskel.getDescriptor().name;
      const filenamePromise = FileUtilsDesktop.chooseFilenameDialog(
        name,
        PISKEL_EXTENSION
      );
      return filenamePromise.then((savePath: string) =>
        this.saveAtPath_(piskel, savePath)
      );
    }
  }

  saveAtPath_(piskel: Piskel, savePath: string): Promise<void> {
    if (!savePath) {
      return Promise.reject("Invalid file name");
    }

    const serialized = Serializer.serialize(piskel);
    savePath = this.addExtensionIfNeeded_(savePath);
    piskel.savePath = savePath;
    const fileName = this.extractFilename_(savePath);
    if (fileName !== undefined) {
      piskel.setName(fileName);
    }
    return FileUtilsDesktop.saveToFile(serialized, savePath);
  }

  openPiskel(): Promise<void> {
    return FileUtilsDesktop.chooseFilenameDialog().then(this.load);
  }

  load(savePath: string): void {
    FileUtilsDesktop.readFile(savePath).then(function (content: string) {
      PiskelFileUtils.decodePiskelFile(
        content,
        function (piskel: Piskel) {
          // store save path so we can re-save without opening the save dialog
          piskel.savePath = savePath;
          assertDefined(app.piskelController, "piskelController").setPiskel(
            piskel
          );
        },
        function () {}
      );
    });
  }

  addExtensionIfNeeded_(filename: string): string {
    const hasExtension =
      filename.substr(-PISKEL_EXTENSION.length) === PISKEL_EXTENSION;
    if (!hasExtension) {
      return filename + PISKEL_EXTENSION;
    }
    return filename;
  }

  extractFilename_(savePath: string): string | undefined {
    const matches = /[\/\\]([^\/\\]*)\.piskel$/gi.exec(savePath);
    if (matches && matches[1]) {
      return matches[1];
    }
  }
}
