import { Constants } from "@/Constants";
import { Events } from "@/Events";
import { app } from "@/app";
import type { PublicPiskelController } from "@/controller/piskel/PublicPiskelController";
import type { Palette } from "@/model/Palette";
import type { Piskel } from "@/model/Piskel";
import { FileUtils } from "@/utils/FileUtils";
import { FrameUtils } from "@/utils/FrameUtils";
import { PiskelFileUtils } from "@/utils/PiskelFileUtils";
import { UserSettings } from "@/utils/UserSettings";
import { assertInitialized } from "@/utils/core";
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
    assertInitialized(event.dataTransfer, "dataTransfer").dropEffect = "copy";
  }

  onFileDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();

    this.dropPosition_ = {
      x: event.clientX,
      y: event.clientY
    };

    const files = Array.from(assertInitialized(event.dataTransfer, "dataTransfer").files);
    this.isMultipleFiles_ = files.length > 1;
    const loadedOrder: number[] = [];
    const lastFrameIndex = this.piskelController.getCurrentFrameIndex();

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const isImage = file.type.indexOf("image") === 0;
      const isPiskel = /\.piskel$/i.test(file.name);
      const isPalette = /\.(gpl|txt|pal)$/i.test(file.name);
      if (isImage) {
        FileUtils.readImageFile(
          file,
          (image: HTMLImageElement | HTMLCanvasElement) => {
            // keep it drag-drop order
            loadedOrder.push(i);
            this.onImageLoaded_(image, file);
            if (loadedOrder.length === files.length)
              if(this.isMultipleFiles_) {
                this.resortImportOrders_(lastFrameIndex, loadedOrder);
              }
          }
        );
      } else if (isPiskel) {
        PiskelFileUtils.loadFromFile(
          file,
          this.onPiskelFileLoaded_,
          this.onPiskelFileError_
        );
      } else if (isPalette) {
        assertInitialized(
          app.paletteImportService,
          "paletteImportService"
        ).read(file, this.onPaletteLoaded_.bind(this));
      }
    }
  }

  onPaletteLoaded_(palette: Palette): void {
    assertInitialized(app.paletteService, "paletteService").savePalette(
      palette
    );
    UserSettings.set(UserSettings.SELECTED_PALETTE, palette.id);
  }

  onPiskelFileLoaded_(piskel: Piskel): void {
    if (window.confirm(Constants.CONFIRM_OVERWRITE)) {
      assertInitialized(app.piskelController, "piskelController").setPiskel(
        piskel
      );
    }
  }

  onPiskelFileError_(reason: string): void {
    $.publish(Events.PISKEL_FILE_IMPORT_FAILED, [reason]);
  }

  onImageLoaded_(
    importedImage: HTMLImageElement | HTMLCanvasElement,
    file: File
  ): void {
    const piskelWidth = assertInitialized(
      app.piskelController,
      "piskelController"
    ).getWidth();
    const piskelHeight = assertInitialized(
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
    const spriteDropPosition = assertInitialized(
      app.drawingController,
      "drawingController"
    ).getSpriteCoordinates(
      assertInitialized(this.dropPosition_, "dropPosition_").x,
      assertInitialized(this.dropPosition_, "dropPosition_").y
    );

    const x = spriteDropPosition.x;
    const y = spriteDropPosition.y;

    FrameUtils.addImageToFrame(currentFrame, importedImage, x, y);

    $.publish(Events.PISKEL_RESET);
    $.publish(Events.PISKEL_SAVE_STATE, {
      type: HistoryService.SNAPSHOT
    });
  }

  /**
   * Resort imported images to the dragged order
   * 
   * @param {number} startIndex ordered index
   * @param {number[]} order insert order. start from 0
   */
  resortImportOrders_(startIndex: number, order: number[]): void {
    const indexedOrder = order.map((o) => o + startIndex + 1);
    const sorted = [...indexedOrder].sort((a, b) => a - b);

    let currentPositions = new Map();
    for (let i = 0; i < indexedOrder.length; i++) {
      currentPositions.set(indexedOrder[i], startIndex + 1 + i);
    }

    for (let targetIdx = 0; targetIdx < sorted.length; targetIdx++) {
      const targetValue = sorted[targetIdx];
      const targetAbsolutePos = startIndex + 1 + targetIdx;

      const currentPos = currentPositions.get(targetValue);

      if (currentPos === targetAbsolutePos)
        continue;

      this.piskelController.moveFrame(currentPos, targetAbsolutePos);

      // update others location
      if (currentPos < targetAbsolutePos) {
        for (let [value, pos] of currentPositions) {
          if (pos > currentPos && pos <= targetAbsolutePos) {
            currentPositions.set(value, pos - 1);
          }
        }
      } else {
        for (let [value, pos] of currentPositions) {
          if (pos >= targetAbsolutePos && pos < currentPos) {
            currentPositions.set(value, pos + 1);
          }
        }
      }

      currentPositions.set(targetValue, targetAbsolutePos);
    }
  }
}
