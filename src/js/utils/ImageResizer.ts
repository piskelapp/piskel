import { Dom } from "@/utils/Dom";
import { CanvasUtils } from "./CanvasUtils";

export const ImageResizer = {
  scale(
    image: HTMLImageElement | HTMLCanvasElement,
    factor: number,
    smoothingEnabled?: boolean
  ): HTMLCanvasElement {
    return ImageResizer.resize(
      image,
      image.width * factor,
      image.height * factor,
      smoothingEnabled
    );
  },

  resize(
    image: HTMLImageElement | HTMLCanvasElement,
    targetWidth: number,
    targetHeight: number,
    smoothingEnabled?: boolean
  ): HTMLCanvasElement {
    const canvas = CanvasUtils.createCanvas(targetWidth, targetHeight);
    const context = Dom.getContext2d(canvas);
    context.save();

    if (!smoothingEnabled) {
      CanvasUtils.disableImageSmoothing(canvas);
    }

    context.translate(canvas.width / 2, canvas.height / 2);
    context.scale(targetWidth / image.width, targetHeight / image.height);
    context.drawImage(image, -image.width / 2, -image.height / 2);
    context.restore();

    return canvas;
  }
};
