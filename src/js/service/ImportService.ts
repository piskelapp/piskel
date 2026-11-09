import { Constants } from "../Constants";
import { Events } from "../Events";
import type { PublicPiskelController } from "../controller/piskel/PublicPiskelController";
import type { JQueryEvent } from "../lib/jquery-1.8.0";
import type { Frame } from "../model/Frame";
import { Layer } from "../model/Layer";
import { Piskel } from "../model/Piskel";
import { Descriptor } from "../model/piskel/Descriptor";
import { CanvasUtils } from "../utils/CanvasUtils";
import { FrameUtils } from "../utils/FrameUtils";
import { ImageResizer } from "../utils/ImageResizer";

/* @file Image and Animation import service supporting the import dialog. */

/**
 * Image an animation import service supporting the import dialog.
 * @param {!PiskelController} piskelController
 * @constructor
 */
export type ImportOptions = {
  importType: string;
  name: string;
  smoothing: boolean;
  frameSizeX: number;
  frameSizeY: number;
  frameOffsetX: number;
  frameOffsetY: number;
};

export class ImportService {
  piskelController_: PublicPiskelController;

  constructor(piskelController: PublicPiskelController) {
    this.piskelController_ = piskelController;
  }

  init(): void {
    $.subscribe(
      Events.PISKEL_FILE_IMPORT_FAILED,
      (evt: JQueryEvent, reason: string) => {
        this.onPiskelFileImportFailed_(evt, reason);
      }
    );
  }

  /**
   * Called when a piskel load failed event is published. Display an appropriate error message.
   * TODO: for some failure reasons, we might want to display a dialog with more details.
   */
  onPiskelFileImportFailed_(evt: JQueryEvent, reason: string): void {
    $.publish(Events.SHOW_NOTIFICATION, [
      {
        content: "Piskel file import failed (" + reason + ")",
        hideDelay: 10000
      }
    ]);
  }

  /**
   * Given an image object and some options, create a new Piskel and open it
   * for editing.
   * @param {Image} image
   * @param {Object} options
   *        - {String}  importType 'single' if not spritesheet
   *        - {String}  name
   *        - {Boolean} smoothing
   *        - {Number}  frameSizeX
   *        - {Number}  frameSizeY
   *        - {Number}  frameOffsetX (only used in spritesheet imports)
   *        - {Number}  frameOffsetY (only used in spritesheet imports)
   * @param {Function} onComplete
   *        Callback called when the new piskel has been created, with the new piskel
   *        as single argument.
   */
  newPiskelFromImage(
    image: HTMLImageElement | HTMLCanvasElement,
    options: ImportOptions,
    onComplete: (piskel: Piskel) => void
  ): void {
    onComplete = onComplete || Constants.EMPTY_FUNCTION;
    const importType = options.importType;
    const name = options.name;
    const smoothing = options.smoothing;
    const frameSizeX = options.frameSizeX;
    const frameSizeY = options.frameSizeY;
    const frameOffsetX = options.frameOffsetX;
    const frameOffsetY = options.frameOffsetY;

    const gifLoader = new window.SuperGif({
      gif: image as HTMLImageElement
    });

    gifLoader.load({
      success: () => {
        const images = gifLoader.getFrames().map(function (frame: {
          data: ImageData;
        }) {
          return CanvasUtils.createFromImageData(frame.data);
        });

        let piskel;
        if (importType === "single" || images.length > 1) {
          // Single image import or animated gif
          piskel = this.createPiskelFromImages_(
            images,
            name,
            frameSizeX,
            frameSizeY,
            smoothing
          );
        } else {
          // Spritesheet
          const frameImages = this.createImagesFromSheet_(
            images[0],
            frameSizeX,
            frameSizeY,
            frameOffsetX,
            frameOffsetY
          );
          piskel = this.createPiskelFromImages_(
            frameImages,
            name,
            frameSizeX,
            frameSizeY,
            smoothing
          );
        }
        onComplete(piskel);
      },
      error: () => {
        let piskel;
        if (importType === "single") {
          // Single image
          piskel = this.createPiskelFromImages_(
            [image],
            name,
            frameSizeX,
            frameSizeY,
            smoothing
          );
        } else {
          // Spritesheet
          const frameImages = this.createImagesFromSheet_(
            image,
            frameSizeX,
            frameSizeY,
            frameOffsetX,
            frameOffsetY
          );
          piskel = this.createPiskelFromImages_(
            frameImages,
            name,
            frameSizeX,
            frameSizeY,
            smoothing
          );
        }
        onComplete(piskel);
      }
    });
  }

  /**
   * @param {!Image} image
   * @param {!number} frameSizeX
   * @param {!number} frameSizeY
   * @param {!number} frameOffsetX
   * @param {!number} frameOffsetY
   * @returns {canvas[]}
   * @private
   */
  createImagesFromSheet_(
    image: HTMLImageElement | HTMLCanvasElement,
    frameSizeX: number,
    frameSizeY: number,
    frameOffsetX: number,
    frameOffsetY: number
  ): HTMLCanvasElement[] {
    return CanvasUtils.createFramesFromImage(
      image,
      frameOffsetX,
      frameOffsetY,
      frameSizeX,
      frameSizeY,
      /*useHorizonalStrips=*/ true,
      /*ignoreEmptyFrames=*/ true
    );
  }

  /**
   * @param {canvas[]} images
   * @param {!number} frameSizeX
   * @param {!number} frameSizeY
   * @param {!boolean} smoothing
   * @private
   */
  createPiskelFromImages_(
    images: (HTMLImageElement | HTMLCanvasElement)[],
    name: string,
    frameSizeX: number,
    frameSizeY: number,
    smoothing: boolean
  ): Piskel {
    name = name || "Imported piskel";
    const frames = this.createFramesFromImages_(
      images,
      frameSizeX,
      frameSizeY,
      smoothing
    );
    const layer = Layer.fromFrames("Layer 1", frames);
    const descriptor = new Descriptor(name, "");
    return Piskel.fromLayers([layer], Constants.DEFAULT.FPS, descriptor);
  }

  /**
   * @param {!canvas[]} images
   * @param {!number} frameSizeX
   * @param {!number} frameSizeY
   * @param {!boolean} smoothing
   * @returns {pskl.model.Frame[]}
   * @private
   */
  createFramesFromImages_(
    images: (HTMLImageElement | HTMLCanvasElement)[],
    frameSizeX: number,
    frameSizeY: number,
    smoothing: boolean
  ): Frame[] {
    return images.map(function (image: HTMLImageElement | HTMLCanvasElement) {
      const resizedImage = ImageResizer.resize(
        image,
        frameSizeX,
        frameSizeY,
        smoothing
      );
      return FrameUtils.createFromImage(resizedImage);
    });
  }
}
