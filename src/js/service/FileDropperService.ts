import { Constants } from "../Constants";
import { Events } from "../Events";
import { app } from "../app";
import type { PublicPiskelController } from "../controller/piskel/PublicPiskelController";
import type { Palette } from "../model/Palette";
import type { Piskel } from "../model/Piskel";
import { FileUtils } from "../utils/FileUtils";
import { FrameUtils } from "../utils/FrameUtils";
import { PiskelFileUtils } from "../utils/PiskelFileUtils";
import { UserSettings } from "../utils/UserSettings";
import { assertDefined } from "../utils/core";
import { HistoryService } from "./HistoryService";

export class FileDropperService {
  piskelController: PublicPiskelController;
  dropPosition_: { x: number; y: number } | null;
  isMultipleFiles_: boolean | undefined;

  constructor(piskelController: PublicPiskelController) {
    this.piskelController = piskelController;
    this.dropPosition_ = null;
  }

  init(): void {
    document.body.addEventListener("drop", this.onFileDrop.bind(this), false);
    document.body.addEventListener(
      "dragover",
      this.onFileDragOver.bind(this),
      false
    );
  }

  onFileDragOver(event: DragEvent): void {
    event.stopPropagation();
    event.preventDefault();
    assertDefined(event.dataTransfer, "dataTransfer").dropEffect = "copy";
  }

  onFileDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();

    this.dropPosition_ = {
      x: event.clientX,
      y: event.clientY
    };

    const files = assertDefined(event.dataTransfer, "dataTransfer").files;
    this.isMultipleFiles_ = files.length > 1;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const isImage = file.type.indexOf("image") === 0;
      const isPiskel = /\.piskel$/i.test(file.name);
      const isPalette = /\.(gpl|txt|pal)$/i.test(file.name);
      if (isImage) {
        FileUtils.readImageFile(
          file,
          (image: HTMLImageElement | HTMLCanvasElement) => {
            this.onImageLoaded_(image, file);
          }
        );
      } else if (isPiskel) {
        PiskelFileUtils.loadFromFile(
          file,
          this.onPiskelFileLoaded_,
          this.onPiskelFileError_
        );
      } else if (isPalette) {
        assertDefined(app.paletteImportService, "paletteImportService").read(
          file,
          this.onPaletteLoaded_.bind(this)
        );
      }
    }
  }

  onPaletteLoaded_(palette: Palette): void {
    assertDefined(app.paletteService, "paletteService").savePalette(palette);
    UserSettings.set(UserSettings.SELECTED_PALETTE, palette.id);
  }

  onPiskelFileLoaded_(piskel: Piskel): void {
    if (window.confirm(Constants.CONFIRM_OVERWRITE)) {
      assertDefined(app.piskelController, "piskelController").setPiskel(piskel);
    }
  }

  onPiskelFileError_(reason: string): void {
    $.publish(Events.PISKEL_FILE_IMPORT_FAILED, [reason]);
  }

  onImageLoaded_(
    importedImage: HTMLImageElement | HTMLCanvasElement,
    file: File
  ): void {
    const piskelWidth = assertDefined(
      app.piskelController,
      "piskelController"
    ).getWidth();
    const piskelHeight = assertDefined(
      app.piskelController,
      "piskelController"
    ).getHeight();

    if (this.isMultipleFiles_) {
      this.piskelController.addFrameAtCurrentIndex();
      this.piskelController.selectNextFrame();
    } else if (
      importedImage.width > piskelWidth ||
      importedImage.height > piskelHeight
    ) {
      // For single file imports, if the file is too big, trigger the import wizard.
      $.publish(Events.DIALOG_SHOW, {
        dialogId: "import",
        initArgs: {
          rawFiles: [file]
        }
      });

      return;
    }

    const currentFrame = this.piskelController.getCurrentFrame();
    // Convert client coordinates to sprite coordinates
    const spriteDropPosition = assertDefined(
      app.drawingController,
      "drawingController"
    ).getSpriteCoordinates(
      assertDefined(this.dropPosition_, "dropPosition_").x,
      assertDefined(this.dropPosition_, "dropPosition_").y
    );

    const x = spriteDropPosition.x;
    const y = spriteDropPosition.y;

    FrameUtils.addImageToFrame(currentFrame, importedImage, x, y);

    $.publish(Events.PISKEL_RESET);
    $.publish(Events.PISKEL_SAVE_STATE, {
      type: HistoryService.SNAPSHOT
    });
  }
}
