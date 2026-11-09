import { Constants } from "../../Constants";
import type { Frame } from "../../model/Frame";
import { assertDefined, colorToInt } from "../../utils/core";

export type Boundaries = {
  minx: number;
  maxx: number;
  miny: number;
  maxy: number;
};

/** The part of a frame needed to compute boundaries. */
export type PixelIterable = {
  forEachPixel(
    callback: (color: number, col: number, row: number) => void
  ): void;
};

export const TransformUtils = {
  VERTICAL: "VERTICAL",
  HORIZONTAL: "HORIZONTAL",
  flip(frame: Frame, axis: string): Frame {
    const clone = frame.clone();
    const w = frame.getWidth();
    const h = frame.getHeight();

    clone.forEachPixel(function (color: number, x: number, y: number) {
      if (axis === TransformUtils.VERTICAL) {
        x = w - x - 1;
      } else if (axis === TransformUtils.HORIZONTAL) {
        y = h - y - 1;
      }
      frame.setPixel(x, y, color);
    });

    return frame;
  },

  CLOCKWISE: "clockwise",
  COUNTERCLOCKWISE: "counterclockwise",
  rotate(frame: Frame, direction: string): Frame {
    const clone = frame.clone();
    const w = frame.getWidth();
    const h = frame.getHeight();

    const max = Math.max(w, h);
    const xDelta = Math.ceil((max - w) / 2);
    const yDelta = Math.ceil((max - h) / 2);

    frame.forEachPixel(function (color: number, x: number, y: number) {
      const _x = x;
      const _y = y;

      // Convert to square coords
      x = x + xDelta;
      y = y + yDelta;

      // Perform the rotation
      const tmpX = x;
      const tmpY = y;
      if (direction === TransformUtils.CLOCKWISE) {
        x = tmpY;
        y = max - 1 - tmpX;
      } else if (direction === TransformUtils.COUNTERCLOCKWISE) {
        y = tmpX;
        x = max - 1 - tmpY;
      }

      // Convert the coordinates back to the rectangular grid
      x = x - xDelta;
      y = y - yDelta;
      if (clone.containsPixel(x, y)) {
        frame.setPixel(_x, _y, assertDefined(clone.getPixel(x, y), "pixel"));
      } else {
        frame.setPixel(_x, _y, Constants.TRANSPARENT_COLOR);
      }
    });

    return frame;
  },

  getBoundaries(frames: PixelIterable[]): Boundaries {
    let minx = +Infinity;
    let miny = +Infinity;
    let maxx = 0;
    let maxy = 0;

    const transparentColorInt = colorToInt(Constants.TRANSPARENT_COLOR);

    frames.forEach(function (frame: PixelIterable) {
      frame.forEachPixel(function (color: number, x: number, y: number) {
        if (color !== transparentColorInt) {
          minx = Math.min(minx, x);
          maxx = Math.max(maxx, x);
          miny = Math.min(miny, y);
          maxy = Math.max(maxy, y);
        }
      });
    });

    return {
      minx: minx,
      maxx: maxx,
      miny: miny,
      maxy: maxy
    };
  },

  moveFramePixels(frame: Frame, dx: number, dy: number): void {
    const clone = frame.clone();
    frame.forEachPixel(function (color: number, x: number, y: number) {
      const _x = x;
      const _y = y;

      x -= dx;
      y -= dy;

      if (clone.containsPixel(x, y)) {
        frame.setPixel(_x, _y, assertDefined(clone.getPixel(x, y), "pixel"));
      } else {
        frame.setPixel(_x, _y, Constants.TRANSPARENT_COLOR);
      }
    });
  },

  center(frame: Frame): Frame {
    // Figure out the boundary
    const boundaries = TransformUtils.getBoundaries([frame]);

    // Calculate how much to move the pixels
    const bw = (boundaries.maxx - boundaries.minx + 1) / 2;
    const bh = (boundaries.maxy - boundaries.miny + 1) / 2;
    const fw = frame.width / 2;
    const fh = frame.height / 2;

    const dx = Math.floor(fw - bw - boundaries.minx);
    const dy = Math.floor(fh - bh - boundaries.miny);

    // Actually move the pixels

    TransformUtils.moveFramePixels(frame, dx, dy);
    return frame;
  }
};
