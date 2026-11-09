import { Constants } from "../Constants";
import { Frame } from "../model/Frame";
import { Layer } from "../model/Layer";
import { Piskel } from "../model/Piskel";
import { FrameUtils } from "./FrameUtils";

export type ResizeOptions = {
  width: number;
  height: number;
  resizeContent: boolean;
  origin: string;
};

export const ResizeUtils = {
  /**
   * Resize the provided piskel instance and return a new instance using the provided resize options
   * @param  {Piskel} piskel  [description]
   * @param  {Object} options
   *         - width {Number} target width after the resize
   *         - height {Number} target height after the resize
   *         - resizeContent {Booleam} true of the sprite content should be resized
   *         - origin {String} should be a valid AnchorWidget origin
   * @return {Piskel} The resized piskel
   */
  resizePiskel(piskel: Piskel, options: ResizeOptions): Piskel {
    const fps = piskel.getFPS();
    const resizedLayers = piskel.getLayers().map(function (layer: Layer) {
      return ResizeUtils.resizeLayer(layer, options);
    });

    const resizedPiskel = Piskel.fromLayers(
      resizedLayers,
      fps,
      piskel.getDescriptor()
    );
    // propagate savepath to new Piskel
    resizedPiskel.savePath = piskel.savePath;

    return resizedPiskel;
  },

  resizeLayer(layer: Layer, options: ResizeOptions): Layer {
    const opacity = layer.getOpacity();
    const resizedFrames = layer.getFrames().map(function (frame: Frame) {
      return ResizeUtils.resizeFrame(frame, options);
    });
    const resizedLayer = Layer.fromFrames(layer.getName(), resizedFrames);
    resizedLayer.setOpacity(opacity);
    return resizedLayer;
  },

  resizeFrame(frame: Frame, options: ResizeOptions): Frame {
    const width = options.width;
    const height = options.height;
    const origin = options.origin;

    if (options.resizeContent) {
      return FrameUtils.resize(frame, width, height, false);
    } else {
      const resizedFrame = new Frame(width, height);
      frame.forEachPixel(function (color: number, x: number, y: number) {
        const translated = ResizeUtils.translateCoordinates(
          x,
          y,
          frame,
          resizedFrame,
          origin
        );
        if (resizedFrame.containsPixel(translated.x, translated.y)) {
          resizedFrame.setPixel(translated.x, translated.y, color);
        }
      });

      return resizedFrame;
    }
  },

  /**
   * Turn a width and height entered by the user into a size that can be used for a frame.
   * Values that are not positive numbers are replaced by the fallback size, and values
   * above Constants.MAX_DEFAULT_WIDTH / MAX_DEFAULT_HEIGHT are capped.
   * @param  {String|Number} width
   * @param  {String|Number} height
   * @param  {Object} fallback {width, height} used for invalid values
   * @return {Object} {width, height}
   */
  sanitizeSize(
    width: string | number,
    height: string | number,
    fallback: { width: number; height: number }
  ): { width: number; height: number } {
    const parsedWidth = parseInt(String(width), 10);
    const parsedHeight = parseInt(String(height), 10);
    return {
      width:
        parsedWidth > 0
          ? Math.min(parsedWidth, Constants.MAX_DEFAULT_WIDTH)
          : fallback.width,
      height:
        parsedHeight > 0
          ? Math.min(parsedHeight, Constants.MAX_DEFAULT_HEIGHT)
          : fallback.height
    };
  },

  translateCoordinates(
    x: number,
    y: number,
    frame: Frame,
    resizedFrame: Frame,
    origin: string
  ): { x: number; y: number } {
    return {
      x: ResizeUtils.translateX(x, frame.width, resizedFrame.width, origin),
      y: ResizeUtils.translateY(y, frame.height, resizedFrame.height, origin)
    };
  },

  translateX(
    x: number,
    width: number,
    resizedWidth: number,
    origin: string | string[]
  ): number {
    if (origin.indexOf("LEFT") != -1) {
      return x;
    } else if (origin.indexOf("RIGHT") != -1) {
      return x - (width - resizedWidth);
    } else {
      return x - Math.round((width - resizedWidth) / 2);
    }
  },

  translateY(
    y: number,
    height: number,
    resizedHeight: number,
    origin: string | string[]
  ): number {
    if (origin.indexOf("TOP") != -1) {
      return y;
    } else if (origin.indexOf("BOTTOM") != -1) {
      return y - (height - resizedHeight);
    } else {
      return y - Math.round((height - resizedHeight) / 2);
    }
  }
};
