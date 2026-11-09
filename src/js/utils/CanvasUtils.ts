import { assertDefined } from "./core";
export const CanvasUtils = {
  createCanvas(
    width: number,
    height: number,
    classList?: string | string[]
  ): HTMLCanvasElement {
    const canvas = document.createElement("canvas");
    canvas.setAttribute("width", String(width));
    canvas.setAttribute("height", String(height));

    const classes = typeof classList == "string" ? [classList] : classList;
    if (Array.isArray(classes)) {
      for (let i = 0; i < classes.length; i++) {
        canvas.classList.add(classes[i]);
      }
    }

    return canvas;
  },

  createFromImageData(imageData: ImageData): HTMLCanvasElement {
    const canvas = CanvasUtils.createCanvas(imageData.width, imageData.height);
    const context = assertDefined(canvas.getContext("2d"), "context");
    context.putImageData(imageData, 0, 0);
    return canvas;
  },

  createFromImage(
    image: HTMLImageElement | HTMLCanvasElement
  ): HTMLCanvasElement {
    const canvas = CanvasUtils.createCanvas(image.width, image.height);
    const context = assertDefined(canvas.getContext("2d"), "context");
    context.drawImage(image, 0, 0);
    return canvas;
  },

  /**
   * Splits the specified image into several new canvas elements based on the
   * supplied offset and frame sizes
   * @param image The source image that will be split
   * @param {Number} offsetX The padding from the left side of the source image
   * @param {Number} offsetY The padding from the top side of the source image
   * @param {Number} width The width of an individual frame
   * @param {Number} height The height of an individual frame
   * @param {Boolean} useHorizonalStrips True if the frames should be layed out from left to
   * right, False if it should use top to bottom
   * @param {Boolean} ignoreEmptyFrames True to ignore empty frames, false to keep them
   * @returns {Array} An array of canvas elements that contain the split frames
   */
  createFramesFromImage(
    image: HTMLImageElement | HTMLCanvasElement,
    offsetX: number,
    offsetY: number,
    width: number,
    height: number,
    useHorizonalStrips: boolean,
    ignoreEmptyFrames: boolean
  ): HTMLCanvasElement[] {
    const canvasArray = [];
    let x = offsetX;
    let y = offsetY;
    const blankData = CanvasUtils.createCanvas(width, height).toDataURL();

    while (x + width <= image.width && y + height <= image.height) {
      // Create a new canvas element
      const canvas = CanvasUtils.createCanvas(width, height);
      const context = assertDefined(canvas.getContext("2d"), "context");

      // Blit the correct part of the source image into the new canvas
      context.drawImage(image, x, y, width, height, 0, 0, width, height);

      if (!ignoreEmptyFrames || canvas.toDataURL() !== blankData) {
        canvasArray.push(canvas);
      }

      if (useHorizonalStrips) {
        // Move from left to right
        x += width;
        if (x + width > image.width) {
          x = offsetX;
          y += height;
        }
      } else {
        // Move from top to bottom
        y += height;
        if (y + height > image.height) {
          x += width;
          y = offsetY;
        }
      }
    }

    return canvasArray;
  },

  /**
   * By default, all scaling operations on a Canvas 2D Context are performed using antialiasing.
   * Resizing a 32x32 image to 320x320 will lead to a blurry output.
   * On Chrome, FF and IE>=11, this can be disabled by setting a property on the Canvas 2D Context.
   * In this case the browser will use a nearest-neighbor scaling.
   * @param  {Canvas} canvas
   */
  disableImageSmoothing(canvas: HTMLCanvasElement): void {
    CanvasUtils.setImageSmoothing(canvas, false);
  },

  enableImageSmoothing(canvas: HTMLCanvasElement): void {
    CanvasUtils.setImageSmoothing(canvas, true);
  },

  setImageSmoothing(canvas: HTMLCanvasElement, smoothing: boolean): void {
    const context: CanvasRenderingContext2D & {
      mozImageSmoothingEnabled?: boolean;
      oImageSmoothingEnabled?: boolean;
      webkitImageSmoothingEnabled?: boolean;
      msImageSmoothingEnabled?: boolean;
    } = assertDefined(canvas.getContext("2d"), "context");
    context.imageSmoothingEnabled = smoothing;
    context.mozImageSmoothingEnabled = smoothing;
    context.oImageSmoothingEnabled = smoothing;
    context.webkitImageSmoothingEnabled = smoothing;
    context.msImageSmoothingEnabled = smoothing;
  },

  clear(canvas: HTMLCanvasElement | null): void {
    if (canvas) {
      assertDefined(canvas.getContext("2d"), "context").clearRect(
        0,
        0,
        canvas.width,
        canvas.height
      );
    }
  },

  clone(canvas: HTMLCanvasElement): HTMLCanvasElement {
    const clone = CanvasUtils.createCanvas(canvas.width, canvas.height);

    //apply the old canvas to the new one
    assertDefined(clone.getContext("2d"), "context").drawImage(canvas, 0, 0);

    //return the new canvas
    return clone;
  },

  getImageDataFromCanvas(canvas: HTMLCanvasElement): ImageDataArray {
    const sourceContext = assertDefined(canvas.getContext("2d"), "context");
    return sourceContext.getImageData(0, 0, canvas.width, canvas.height).data;
  },

  getBase64FromCanvas(canvas: HTMLCanvasElement, format?: string): string {
    format = format || "png";
    const data = canvas.toDataURL("image/" + format);
    return data.substr(data.indexOf(",") + 1);
  }
};
