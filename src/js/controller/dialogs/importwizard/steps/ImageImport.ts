import { app } from "../../../../app";
import type { Piskel } from "../../../../model/Piskel";
import { CanvasUtils } from "../../../../utils/CanvasUtils";
import { Dom } from "../../../../utils/Dom";
import { FileUtils } from "../../../../utils/FileUtils";
import { assertDefined } from "../../../../utils/core";
import type { PublicPiskelController } from "../../../piskel/PublicPiskelController";
import type { ImportWizard } from "../ImportWizard";
import { AbstractImportStep } from "./AbstractImportStep";

export class ImageImport extends AbstractImportStep {
  importedImage_: HTMLImageElement | HTMLCanvasElement | null;
  file_: File | null;
  importPreview: HTMLElement | undefined;
  fileNameContainer: HTMLElement | undefined;
  singleImportType: HTMLInputElement | null | undefined;
  sheetImportType: HTMLInputElement | null | undefined;
  resizeWidth: HTMLInputElement | undefined;
  resizeHeight: HTMLInputElement | undefined;
  smoothResize: HTMLInputElement | undefined;
  frameSizeX: HTMLInputElement | undefined;
  frameSizeY: HTMLInputElement | undefined;
  frameOffsetX: HTMLInputElement | undefined;
  frameOffsetY: HTMLInputElement | undefined;

  constructor(
    piskelController: PublicPiskelController,
    importController: ImportWizard,
    container: HTMLElement
  ) {
    super(piskelController, importController, container);
    this.importedImage_ = null;
    this.file_ = null;
  }

  init(): void {
    super.init();

    // This step is only used if rawFiles contains a single image.
    this.file_ = this.mergeData.rawFiles[0];

    this.importPreview = Dom.getElement<HTMLElement>(
      ".import-section-preview",
      this.container
    );

    this.fileNameContainer = Dom.getElement<HTMLElement>(
      ".import-image-file-name",
      this.container
    );

    this.singleImportType = this.container.querySelector<HTMLInputElement>(
      "[name=import-type][value=single]"
    );
    this.sheetImportType = this.container.querySelector<HTMLInputElement>(
      "[name=import-type][value=sheet]"
    );

    this.resizeWidth = Dom.getElement<HTMLInputElement>(
      "[name=resize-width]",
      this.container
    );
    this.resizeHeight = Dom.getElement<HTMLInputElement>(
      "[name=resize-height]",
      this.container
    );
    this.smoothResize = Dom.getElement<HTMLInputElement>(
      "[name=smooth-resize-checkbox]",
      this.container
    );

    this.frameSizeX = Dom.getElement<HTMLInputElement>(
      "[name=frame-size-x]",
      this.container
    );
    this.frameSizeY = Dom.getElement<HTMLInputElement>(
      "[name=frame-size-y]",
      this.container
    );
    this.frameOffsetX = Dom.getElement<HTMLInputElement>(
      "[name=frame-offset-x]",
      this.container
    );
    this.frameOffsetY = Dom.getElement<HTMLInputElement>(
      "[name=frame-offset-y]",
      this.container
    );

    this.addEventListener(
      assertDefined(this.singleImportType, "singleImportType"),
      "change",
      this.onImportTypeChange_
    );
    this.addEventListener(
      assertDefined(this.sheetImportType, "sheetImportType"),
      "change",
      this.onImportTypeChange_
    );

    this.addEventListener(this.resizeWidth, "keyup", this.onResizeInputKeyUp_);
    this.addEventListener(this.resizeHeight, "keyup", this.onResizeInputKeyUp_);
    this.addEventListener(this.frameSizeX, "keyup", this.onFrameInputKeyUp_);
    this.addEventListener(this.frameSizeY, "keyup", this.onFrameInputKeyUp_);
    this.addEventListener(this.frameOffsetX, "keyup", this.onFrameInputKeyUp_);
    this.addEventListener(this.frameOffsetY, "keyup", this.onFrameInputKeyUp_);

    FileUtils.readImageFile(
      assertDefined(this.file_, "file_"),
      this.onImageLoaded_.bind(this)
    );

    if (this.piskelController.isEmpty()) {
      assertDefined(this.nextButton, "nextButton").textContent = "import";
    }
  }

  onNextClick(): void {
    this.container.classList.add("import-image-loading");
    this.createPiskelFromImage()
      .then((piskel: Piskel) => {
        this.mergeData.mergePiskel = piskel;
        this.container.classList.remove("import-image-loading");
        super.onNextClick();
      })
      .catch(function (e: Event) {
        console.error(e);
      });
  }

  onShow(): void {
    this.container.classList.remove("import-image-loading");
  }

  createPiskelFromImage(): Promise<Piskel> {
    let name = this.extractFileNameFromPath_(
      assertDefined(this.file_, "file_").name
    );
    // Remove extension from filename.
    name = name.replace(/\.[a-zA-Z]+$/, "");

    return new Promise<Piskel>((resolve) => {
      assertDefined(app.importService, "importService").newPiskelFromImage(
        assertDefined(this.importedImage_, "importedImage_"),
        {
          importType: this.getImportType_(),
          frameSizeX:
            this.getImportType_() === "single"
              ? Number(assertDefined(this.resizeWidth, "resizeWidth").value)
              : this.sanitizeInputValue_(this.frameSizeX, 1),
          frameSizeY:
            this.getImportType_() === "single"
              ? Number(assertDefined(this.resizeHeight, "resizeHeight").value)
              : this.sanitizeInputValue_(this.frameSizeY, 1),
          frameOffsetX: this.sanitizeInputValue_(this.frameOffsetX, 0),
          frameOffsetY: this.sanitizeInputValue_(this.frameOffsetY, 0),
          smoothing: !!assertDefined(this.smoothResize, "smoothResize").checked,
          name: name
        },
        resolve
      );
    });
  }

  onImportTypeChange_(evt: Event): void {
    if (this.getImportType_() === "single") {
      // Using single image, so remove the frame grid
      this.hideFrameGrid_();
    } else {
      // Using spritesheet import, so draw the frame grid in the preview
      const x = this.sanitizeInputValue_(this.frameOffsetX, 0);
      const y = this.sanitizeInputValue_(this.frameOffsetY, 0);
      const w = this.sanitizeInputValue_(this.frameSizeX, 1);
      const h = this.sanitizeInputValue_(this.frameSizeY, 1);
      this.drawFrameGrid_(x, y, w, h);
    }
  }

  onResizeInputKeyUp_(evt: Event): void {
    const from = (evt.target as HTMLElement).getAttribute("name");
    if (this.importedImage_) {
      this.synchronizeResizeFields_(
        (evt.target as HTMLInputElement).value,
        from
      );
    }
  }

  onFrameInputKeyUp_(evt: Event): void {
    if (this.importedImage_) {
      this.synchronizeFrameFields_((evt.target as HTMLInputElement).value);
    }
  }

  synchronizeResizeFields_(input: string, from: string | null): void {
    let value = parseInt(input, 10);
    if (isNaN(value)) {
      value = 0;
    }
    const height = assertDefined(this.importedImage_, "importedImage_").height;
    const width = assertDefined(this.importedImage_, "importedImage_").width;

    // Select single image import type since the user changed a value here
    assertDefined(this.singleImportType, "singleImportType").checked = true;

    if (from === "resize-width") {
      assertDefined(this.resizeHeight, "resizeHeight").value = String(
        Math.round((value * height) / width)
      );
    } else {
      assertDefined(this.resizeWidth, "resizeWidth").value = String(
        Math.round((value * width) / height)
      );
    }
  }

  synchronizeFrameFields_(input: string): void {
    let value = parseInt(input, 10);
    if (isNaN(value)) {
      value = 0;
    }

    // Parse the frame input values
    const frameSizeX = this.sanitizeInputValue_(this.frameSizeX, 1);
    const frameSizeY = this.sanitizeInputValue_(this.frameSizeY, 1);
    const frameOffsetX = this.sanitizeInputValue_(this.frameOffsetX, 0);
    const frameOffsetY = this.sanitizeInputValue_(this.frameOffsetY, 0);

    // Select spritesheet import type since the user changed a value here
    assertDefined(this.sheetImportType, "sheetImportType").checked = true;

    // Draw the grid
    this.drawFrameGrid_(frameOffsetX, frameOffsetY, frameSizeX, frameSizeY);
  }

  sanitizeInputValue_(
    maybeInput: HTMLInputElement | undefined,
    minValue: number
  ): number {
    const input = assertDefined(maybeInput, "input");
    let value = parseInt(input.value, 10);
    if (value <= minValue || isNaN(value)) {
      input.value = String(minValue);
      value = minValue;
    }
    return value;
  }

  getImportType_(): string {
    if (assertDefined(this.singleImportType, "singleImportType").checked) {
      return assertDefined(this.singleImportType, "singleImportType").value;
    } else if (assertDefined(this.sheetImportType, "sheetImportType").checked) {
      return assertDefined(this.sheetImportType, "sheetImportType").value;
    } else {
      throw "Could not find the currently selected import type";
    }
  }

  onImageLoaded_(image: HTMLImageElement | HTMLCanvasElement): void {
    this.importedImage_ = image;

    const w = this.importedImage_.width;
    const h = this.importedImage_.height;

    // FIXME : We remove the onload callback here because JsGif will insert
    // the image again and we want to avoid retriggering the image onload
    this.importedImage_.onload = function () {};

    const fileName = this.extractFileNameFromPath_(
      assertDefined(this.file_, "file_").name
    );
    assertDefined(this.fileNameContainer, "fileNameContainer").textContent =
      fileName;
    assertDefined(this.fileNameContainer, "fileNameContainer").setAttribute(
      "title",
      fileName
    );

    assertDefined(this.resizeWidth, "resizeWidth").value = String(w);
    assertDefined(this.resizeHeight, "resizeHeight").value = String(h);

    assertDefined(this.frameSizeX, "frameSizeX").value = String(w);
    assertDefined(this.frameSizeY, "frameSizeY").value = String(h);
    assertDefined(this.frameOffsetX, "frameOffsetX").value = String(0);
    assertDefined(this.frameOffsetY, "frameOffsetY").value = String(0);

    assertDefined(this.importPreview, "importPreview").innerHTML = "";
    assertDefined(this.importPreview, "importPreview").appendChild(
      this.createImagePreview_()
    );
  }

  createImagePreview_(): HTMLImageElement {
    const image = document.createElement("img");
    image.src = (
      assertDefined(this.importedImage_, "importedImage_") as HTMLImageElement
    ).src;
    return image;
  }

  extractFileNameFromPath_(path: string): string {
    let parts = [];
    if (path.indexOf("/") !== -1) {
      parts = path.split("/");
    } else if (path.indexOf("\\") !== -1) {
      parts = path.split("\\");
    } else {
      parts = [path];
    }
    return parts[parts.length - 1];
  }

  drawFrameGrid_(
    frameX: number,
    frameY: number,
    frameW: number,
    frameH: number
  ): void {
    if (!this.importedImage_) {
      return;
    }

    // Grab the sizes of the source and preview images
    const width = this.importedImage_.width;
    const height = this.importedImage_.height;

    const image = Dom.getElement<HTMLElement>("img", this.importPreview);
    const previewWidth = image.offsetWidth;
    const previewHeight = image.offsetHeight;

    let canvas = assertDefined(
      this.importPreview,
      "importPreview"
    ).querySelector("canvas");
    if (!canvas) {
      // Create a new canvas for the grid
      canvas = CanvasUtils.createCanvas(previewWidth + 1, previewHeight + 1);
      assertDefined(this.importPreview, "importPreview").appendChild(canvas);
    }

    const context = assertDefined(canvas.getContext("2d"), "context");
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.beginPath();

    // Calculate the number of whole frames
    const countX = Math.floor((width - frameX) / frameW);
    const countY = Math.floor((height - frameY) / frameH);

    if (countX > 0 && countY > 0) {
      const scaleX = previewWidth / width;
      const scaleY = previewHeight / height;
      const maxWidth = countX * frameW + frameX;
      const maxHeight = countY * frameH + frameY;

      // Draw the vertical lines
      for (
        let x = frameX + 0.5;
        x < maxWidth + 1 && x < width + 1;
        x += frameW
      ) {
        context.moveTo(x * scaleX, frameY * scaleY);
        context.lineTo(x * scaleX, maxHeight * scaleY);
      }

      // Draw the horizontal lines
      for (
        let y = frameY + 0.5;
        y < maxHeight + 1 && y < height + 1;
        y += frameH
      ) {
        context.moveTo(frameX * scaleX, y * scaleY);
        context.lineTo(maxWidth * scaleX, y * scaleY);
      }

      context.lineWidth = 1;
      context.strokeStyle = "gold";
      context.stroke();

      // Show the canvas
      canvas.style.display = "block";
    } else {
      this.hideFrameGrid_();
    }
  }

  hideFrameGrid_(): void {
    const canvas = assertDefined(
      this.importPreview,
      "importPreview"
    ).querySelector("canvas");
    if (canvas) {
      canvas.style.display = "none";
    }
  }
}
