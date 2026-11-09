import type { Frame } from "../model/Frame";
import { MathUtils } from "./Math";
import { assertDefined, colorToInt, normalize } from "./core";

export type PixelCoords = { col: number; row: number };

export const PixelUtils = {
  getRectanglePixels(
    x0: number,
    y0: number,
    x1: number,
    y1: number
  ): { col: number; row: number }[] {
    const rectangle = this.getOrderedRectangleCoordinates(x0, y0, x1, y1);
    const pixels = [];

    for (let x = rectangle.x0; x <= rectangle.x1; x++) {
      for (let y = rectangle.y0; y <= rectangle.y1; y++) {
        pixels.push({ col: x, row: y });
      }
    }

    return pixels;
  },

  /**
   * Return an object of ordered rectangle coordinate.
   * In returned object {x0, y0} => top left corner - {x1, y1} => bottom right corner
   * @private
   */
  getOrderedRectangleCoordinates(
    x0: number,
    y0: number,
    x1: number,
    y1: number
  ): { x0: number; y0: number; x1: number; y1: number } {
    return {
      x0: Math.min(x0, x1),
      y0: Math.min(y0, y1),
      x1: Math.max(x0, x1),
      y1: Math.max(y0, y1)
    };
  },

  /**
   * Return the list of pixels that would have been filled by a paintbucket tool applied
   * on pixel at coordinate (x,y).
   * This function is not altering the Frame object argument.
   *
   * @param frame pskl.model.Frame The frame target in which we want to paintbucket
   * @param col number Column coordinate in the frame
   * @param row number Row coordinate in the frame
   *
   * @return an array of the pixel coordinates paint with the replacement color
   */
  getSimilarConnectedPixelsFromFrame(
    frame: Frame,
    col: number,
    row: number
  ): PixelCoords[] {
    const targetColor = frame.getPixel(col, row);
    if (targetColor === null) {
      return [];
    }

    const startPixel = {
      col: col,
      row: row
    };

    const visited: Record<string, boolean> = {};
    return PixelUtils.visitConnectedPixels(
      startPixel,
      frame,
      function (pixel: PixelCoords) {
        const key = pixel.col + "-" + pixel.row;
        if (visited[key]) {
          return false;
        }
        visited[key] = true;
        return frame.getPixel(pixel.col, pixel.row) == targetColor;
      }
    );
  },

  /**
   * Resize the pixel at {col, row} for the provided size. Will return the array of pixels centered
   * around the original pixel, forming a pixel square of side=size
   *
   * @param  {Number} row  x-coordinate of the original pixel
   * @param  {Number} col  y-coordinate of the original pixel
   * @param  {Number} size >= 1 && <= 32
   * @return {Array}  array of arrays of 2 Numbers (eg. [[0,0], [0,1], [1,0], [1,1]])
   */
  resizePixel(col: number, row: number, size: number): number[][] {
    const pixels = [];

    for (let j = 0; j < size; j++) {
      for (let i = 0; i < size; i++) {
        pixels.push([
          col - Math.floor(size / 2) + i,
          row - Math.floor(size / 2) + j
        ]);
      }
    }

    return pixels;
  },

  /**
   * Shortcut to reduce the output of pskl.PixelUtils.resizePixel for several pixels
   * @param  {Array}  pixels Array of pixels (objects {col:Number, row:Number})
   * @param  {Number} >= 1 && <= 4
   * @return {Array}  array of arrays of 2 Numbers (eg. [[0,0], [0,1], [1,0], [1,1]])
   */
  resizePixels(pixels: PixelCoords[], size: number): number[][] {
    return pixels.reduce(function (p: number[][], pixel: PixelCoords) {
      return p.concat(PixelUtils.resizePixel(pixel.col, pixel.row, size));
    }, []);
  },

  /**
   * Apply the paintbucket tool in a frame at the (col, row) initial position
   * with the replacement color.
   *
   * @param frame pskl.model.Frame The frame target in which we want to paintbucket
   * @param col number Column coordinate in the frame
   * @param row number Row coordinate in the frame
   * @param replacementColor string Hexadecimal color used to fill the area
   *
   * @return an array of the pixel coordinates paint with the replacement color
   */
  paintSimilarConnectedPixelsFromFrame(
    frame: Frame,
    col: number,
    row: number,
    replacementColor: string | number
  ): PixelCoords[] | undefined {
    /**
     *  Queue linear Flood-fill (node, target-color, replacement-color):
     *   1. Set Q to the empty queue.
     *   2. If the color of node is not equal to target-color, return.
     *   3. Add node to Q.
     *   4. For each element n of Q:
     *   5.     If the color of n is equal to target-color:
     *   6.         Set w and e equal to n.
     *   7.         Move w to the west until the color of the node to the west of w no longer matches target-color.
     *   8.         Move e to the east until the color of the node to the east of e no longer matches target-color.
     *   9.         Set the color of nodes between w and e to replacement-color.
     *  10.         For each node n between w and e:
     *  11.             If the color of the node to the north of n is target-color, add that node to Q.
     *  12.             If the color of the node to the south of n is target-color, add that node to Q.
     *  13. Continue looping until Q is exhausted.
     *  14. Return.
     */
    if (typeof replacementColor == "string") {
      replacementColor = colorToInt(replacementColor);
    }

    let targetColor: number | null = null;
    try {
      targetColor = frame.getPixel(col, row);
    } catch {
      // Frame out of bound exception.
    }

    if (targetColor === null || targetColor == replacementColor) {
      return;
    }

    const startPixel = {
      col: col,
      row: row
    };
    const paintedPixels = PixelUtils.visitConnectedPixels(
      startPixel,
      frame,
      function (pixel: { col: number; row: number }) {
        if (frame.getPixel(pixel.col, pixel.row) == targetColor) {
          frame.setPixel(pixel.col, pixel.row, replacementColor);
          return true;
        }
        return false;
      }
    );
    return paintedPixels;
  },

  /**
   * Starting from a provided origin, visit connected pixels using a visitor function.
   * After visiting a pixel, select the 4 connected pixels (up, right, down, left).
   * Call the provided visitor on each pixel. The visitor should return true if the
   * pixel should be considered as connected. If the pixel is connected repeat the
   * process with its own connected pixels
   *
   * TODO : Julian : The visitor is also responsible for making sure a pixel is never
   * visited twice. This could be handled by default by this method.
   *
   * @return {Array} the array of visited pixels {col, row}
   */
  visitConnectedPixels(
    pixel: PixelCoords,
    frame: Frame,
    pixelVisitor: (pixel: PixelCoords) => boolean
  ): PixelCoords[] {
    const queue: PixelCoords[] = [];
    const visitedPixels: PixelCoords[] = [];
    const dy = [-1, 0, 1, 0];
    const dx = [0, 1, 0, -1];

    queue.push(pixel);
    visitedPixels.push(pixel);
    pixelVisitor(pixel);

    let loopCount = 0;
    const cellCount = frame.getWidth() * frame.getHeight();
    while (queue.length > 0) {
      loopCount++;

      const currentItem = assertDefined(queue.pop(), "currentItem");

      for (let i = 0; i < 4; i++) {
        const nextCol = currentItem.col + dx[i];
        const nextRow = currentItem.row + dy[i];
        try {
          const connectedPixel = { col: nextCol, row: nextRow };
          const isValid = pixelVisitor(connectedPixel);
          if (isValid) {
            queue.push(connectedPixel);
            visitedPixels.push(connectedPixel);
          }
        } catch {
          // Frame out of bound exception.
        }
      }

      // Security loop breaker:
      if (loopCount > 10 * cellCount) {
        console.log("loop breaker called");
        break;
      }
    }

    return visitedPixels;
  },

  /**
   * Bresenham line algorithm: Get an array of pixels from
   * start and end coordinates.
   *
   * http://en.wikipedia.org/wiki/Bresenham's_line_algorithm
   * http://stackoverflow.com/questions/4672279/bresenham-algorithm-in-javascript
   */
  getLinePixels(
    x0: number,
    x1: number,
    y0: number,
    y1: number
  ): { col: number; row: number }[] {
    const pixels = [];

    x1 = normalize(x1, 0);
    y1 = normalize(y1, 0);

    const dx = Math.abs(x1 - x0);
    const dy = Math.abs(y1 - y0);

    const sx = x0 < x1 ? 1 : -1;
    const sy = y0 < y1 ? 1 : -1;

    let err = dx - dy;
    while (true) {
      // Do what you need to for this
      pixels.push({ col: x0, row: y0 });

      if (x0 == x1 && y0 == y1) {
        break;
      }

      const e2 = 2 * err;
      if (e2 > -dy) {
        err -= dy;
        x0 += sx;
      }
      if (e2 < dx) {
        err += dx;
        y0 += sy;
      }
    }

    return pixels;
  },

  /**
   * Create a uniform line using the same number of pixel at each step, between the provided
   * origin and target coordinates.
   */
  getUniformLinePixels(
    x0: number,
    x1: number,
    y0: number,
    y1: number
  ): { col: number; row: number }[] {
    const pixels = [];

    x1 = normalize(x1, 0);
    y1 = normalize(y1, 0);

    const dx = Math.abs(x1 - x0) + 1;
    const dy = Math.abs(y1 - y0) + 1;

    const sx = x0 < x1 ? 1 : -1;
    const sy = y0 < y1 ? 1 : -1;

    const ratio = Math.max(dx, dy) / Math.min(dx, dy);
    // in pixel art, lines should use uniform number of pixels for each step
    let pixelStep = Math.round(ratio) || 0;

    if (pixelStep > Math.min(dx, dy)) {
      pixelStep = Infinity;
    }

    const maxDistance = MathUtils.distance(x0, x1, y0, y1);

    let x = x0;
    let y = y0;
    let i = 0;
    while (true) {
      i++;

      pixels.push({ col: x, row: y });
      if (MathUtils.distance(x0, x, y0, y) >= maxDistance) {
        break;
      }

      const isAtStep = i % pixelStep === 0;
      if (dx >= dy || isAtStep) {
        x += sx;
      }
      if (dy >= dx || isAtStep) {
        y += sy;
      }
    }

    return pixels;
  }
};
