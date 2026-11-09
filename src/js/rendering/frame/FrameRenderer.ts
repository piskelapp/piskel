import { Constants } from "../../Constants";
import { Events, type UserSettingValue } from "../../Events";
import { app } from "../../app";
import type { JQueryEvent } from "../../lib/jquery-1.8.0";
import type { Frame } from "../../model/Frame";
import type { RenderedFrame } from "../../model/frame/RenderedFrame";
import { CanvasUtils } from "../../utils/CanvasUtils";
import { FrameUtils } from "../../utils/FrameUtils";
import { MathUtils } from "../../utils/Math";
import { UserSettings } from "../../utils/UserSettings";
import { assertDefined } from "../../utils/core";
import { AbstractRenderer } from "../AbstractRenderer";

/**
 * FrameRenderer will display a given frame inside a canvas element.
 * @param {HtmlElement} container HtmlElement to use as parentNode of the Frame
 * @param {Object} renderingOptions
 * @param {Array} classList array of strings to use for css classList
 */
export type RenderingOptions = {
  zoom?: number;
  supportGridRendering?: boolean;
  height: number;
  width: number;
  xOffset?: number;
  yOffset?: number;
};

export class FrameRenderer extends AbstractRenderer {
  defaultRenderingOptions: { supportGridRendering: boolean; zoom: number };
  container: HTMLElement;
  zoom: number;
  offset: { x: number; y: number };
  margin: { x: number; y: number };
  supportGridRendering: boolean;
  classList: string[];
  canvas: HTMLCanvasElement | null;
  displayCanvas: HTMLCanvasElement | null;
  displayWidth: number | undefined;
  displayHeight: number | undefined;
  gridWidth_: number | undefined;
  gridSpacing_: number | undefined;

  constructor(
    container: HTMLElement,
    renderingOptions: RenderingOptions,
    classList?: string[]
  ) {
    super();
    this.defaultRenderingOptions = {
      supportGridRendering: false,
      zoom: 1
    };

    const options = $.extend(
      true,
      {},
      this.defaultRenderingOptions,
      renderingOptions
    );

    if (container === undefined) {
      throw "Bad FrameRenderer initialization. <container> undefined.";
    }

    if (isNaN(options.zoom)) {
      throw "Bad FrameRenderer initialization. <zoom> not well defined.";
    }

    this.container = container;

    this.zoom = options.zoom;

    this.offset = {
      x: 0,
      y: 0
    };

    this.margin = {
      x: 0,
      y: 0
    };

    this.supportGridRendering = options.supportGridRendering;

    this.classList = classList || [];
    this.classList.push("canvas");

    /**
     * Off dom canvas, will be used to draw the frame at 1:1 ratio
     * @type {HTMLElement}
     */
    this.canvas = null;

    /**
     * Displayed canvas, scaled-up from the offdom canvas
     * @type {HTMLElement}
     */
    this.displayCanvas = null;
    this.setDisplaySize(options.width, options.height);

    this.setGridWidth(this.getUserGridWidth_());
    this.setGridSpacing(this.getUserGridSpacing_());

    $.subscribe(
      Events.USER_SETTINGS_CHANGED,
      this.onUserSettingsChange_.bind(this)
    );
  }

  render(frame: Frame | RenderedFrame): void {
    if (frame) {
      this.clear();
      this.renderFrame_(frame);
    }
  }

  clear(): void {
    CanvasUtils.clear(this.canvas);
    CanvasUtils.clear(this.displayCanvas);
  }

  setZoom(zoom: number): void {
    // Minimum zoom is one to ensure one sprite pixel occupies at least one pixel on screen.
    const minimumZoom = 1;
    // Maximum zoom is relative to the display dimensions to ensure at least 10 pixels can
    // be drawn on screen.
    const maximumZoom =
      Math.min(
        assertDefined(this.displayWidth, "displayWidth"),
        assertDefined(this.displayHeight, "displayHeight")
      ) / 10;
    zoom = MathUtils.minmax(zoom, minimumZoom, maximumZoom);

    if (zoom == this.zoom) {
      return;
    }

    // back up center coordinates
    const displayWidth = assertDefined(this.displayWidth, "displayWidth");
    const displayHeight = assertDefined(this.displayHeight, "displayHeight");
    const centerX = this.offset.x + displayWidth / (2 * this.zoom);
    const centerY = this.offset.y + displayHeight / (2 * this.zoom);

    this.zoom = zoom;
    // recenter
    this.setOffset(
      centerX - displayWidth / (2 * this.zoom),
      centerY - displayHeight / (2 * this.zoom)
    );
  }

  getZoom(): number {
    return this.zoom;
  }

  setDisplaySize(width: number, height: number): void {
    this.displayWidth = width;
    this.displayHeight = height;
    if (this.displayCanvas) {
      assertDefined(this.displayCanvas.parentNode, "parentNode").removeChild(
        this.displayCanvas
      );
      this.displayCanvas = null;
    }
    this.createDisplayCanvas_();
  }

  getDisplaySize(): { height: number; width: number } {
    return {
      height: assertDefined(this.displayHeight, "displayHeight"),
      width: assertDefined(this.displayWidth, "displayWidth")
    };
  }

  getOffset(): { x: number; y: number } {
    return {
      x: this.offset.x,
      y: this.offset.y
    };
  }

  setOffset(x: number, y: number): void {
    const width = assertDefined(
      app.piskelController,
      "piskelController"
    ).getWidth();
    const height = assertDefined(
      app.piskelController,
      "piskelController"
    ).getHeight();
    const maxX =
      width - assertDefined(this.displayWidth, "displayWidth") / this.zoom;
    x = MathUtils.minmax(x, 0, maxX);
    const maxY =
      height - assertDefined(this.displayHeight, "displayHeight") / this.zoom;
    y = MathUtils.minmax(y, 0, maxY);

    this.offset.x = x;
    this.offset.y = y;
  }

  getGridColor(): string {
    return UserSettings.get(UserSettings.GRID_COLOR);
  }

  setGridWidth(value: number): void {
    this.gridWidth_ = value;
  }

  setGridSpacing(value: number): void {
    this.gridSpacing_ = value;
  }

  getGridWidth(): number {
    if (!this.supportGridRendering) {
      return 0;
    }

    return assertDefined(this.gridWidth_, "gridWidth_");
  }

  getGridSpacing(): number {
    if (!this.supportGridRendering) {
      return 0;
    }

    return assertDefined(this.gridSpacing_, "gridSpacing_");
  }

  /**
   * Compute a grid width value best suited to the current display context,
   * particularly for the current zoom level
   */
  computeGridWidthForDisplay_(): number {
    const gridSpacing = this.getGridSpacing();
    if (this.zoom * gridSpacing < 6) {
      return 0;
    }

    let gridWidth = this.getGridWidth();
    while (gridWidth > 1 && this.zoom < 6 * gridWidth) {
      gridWidth--;
    }

    return gridWidth;
  }

  updateMargins_(frame: Frame | RenderedFrame): void {
    const deltaX =
      assertDefined(this.displayWidth, "displayWidth") -
      this.zoom * frame.getWidth();
    this.margin.x = Math.max(0, deltaX) / 2;

    const deltaY =
      assertDefined(this.displayHeight, "displayHeight") -
      this.zoom * frame.getHeight();
    this.margin.y = Math.max(0, deltaY) / 2;
  }

  createDisplayCanvas_(): void {
    const height = assertDefined(this.displayHeight, "displayHeight");
    const width = assertDefined(this.displayWidth, "displayWidth");

    this.displayCanvas = CanvasUtils.createCanvas(
      width,
      height,
      this.classList
    );
    CanvasUtils.disableImageSmoothing(this.displayCanvas);
    this.container.appendChild(this.displayCanvas);
  }

  onUserSettingsChange_(
    evt: JQueryEvent,
    settingName: string,
    settingValue: UserSettingValue
  ): void {
    const settings = UserSettings;
    if (
      settingName == settings.GRID_WIDTH ||
      settingName == settings.GRID_SPACING ||
      settingName == settings.GRID_ENABLED
    ) {
      this.setGridWidth(this.getUserGridWidth_());
      this.setGridSpacing(this.getUserGridSpacing_());
    }
  }

  getUserGridWidth_(): number {
    const gridEnabled = UserSettings.get(UserSettings.GRID_ENABLED);
    const width = UserSettings.get(UserSettings.GRID_WIDTH);
    return gridEnabled ? width : 0;
  }

  getUserGridSpacing_(): number {
    const gridEnabled = UserSettings.get(UserSettings.GRID_ENABLED);
    const spacing = UserSettings.get(UserSettings.GRID_SPACING);
    return gridEnabled ? spacing : 0;
  }

  /**
   * Transform a screen pixel-based coordinate (relative to the top-left corner of the rendered
   * frame) into a sprite coordinate in column and row.
   * @public
   */
  getCoordinates(x: number, y: number): { x: number; y: number } {
    const containerRect = this.container.getBoundingClientRect();
    x = x - containerRect.left;
    y = y - containerRect.top;

    // apply margins
    x = x - this.margin.x;
    y = y - this.margin.y;

    const cellSize = this.zoom;
    // apply frame offset
    x = x + this.offset.x * cellSize;
    y = y + this.offset.y * cellSize;

    return {
      x: Math.floor(x / cellSize),
      y: Math.floor(y / cellSize)
    };
  }

  reverseCoordinates(x: number, y: number): { x: number; y: number } {
    const cellSize = this.zoom;

    x = x * cellSize;
    y = y * cellSize;

    x = x - this.offset.x * cellSize;
    y = y - this.offset.y * cellSize;

    x = x + this.margin.x;
    y = y + this.margin.y;

    const containerRect = this.container.getBoundingClientRect();
    x = x + containerRect.left;
    y = y + containerRect.top;

    return {
      x: x + cellSize / 2,
      y: y + cellSize / 2
    };
  }

  /**
   * @private
   */
  renderFrame_(frame: Frame | RenderedFrame): void {
    if (
      !this.canvas ||
      frame.getWidth() != this.canvas.width ||
      frame.getHeight() != this.canvas.height
    ) {
      this.canvas = CanvasUtils.createCanvas(
        frame.getWidth(),
        frame.getHeight()
      );
    }

    const w = this.canvas.width;
    const h = this.canvas.height;
    const z = this.zoom;

    // Draw in canvas
    FrameUtils.drawToCanvas(frame, this.canvas);

    this.updateMargins_(frame);

    const displayContext = assertDefined(
      assertDefined(this.displayCanvas, "displayCanvas").getContext("2d"),
      "context"
    );
    displayContext.save();

    const translateX = this.margin.x - this.offset.x * z;
    const translateY = this.margin.y - this.offset.y * z;

    const isZoomedOut = translateX > 0 || translateY > 0;
    // Draw the background / zoomed-out color only if needed. Otherwise the clearRect
    // happening after that will clear "out of bounds" and seems to be doing nothing
    // on some chromebooks (cf https://github.com/piskelapp/piskel/issues/651)
    if (isZoomedOut) {
      // Draw background
      displayContext.fillStyle = Constants.ZOOMED_OUT_BACKGROUND_COLOR;
      // The -1 on the width and height here is a workaround for a Chrome-only bug
      // that was potentially fixed, but is very hardware dependant. Seems to be
      // triggered when doing clear rect or fill rect using the full width & height
      // of a canvas. (https://bugs.chromium.org/p/chromium/issues/detail?id=469906)
      displayContext.fillRect(
        0,
        0,
        assertDefined(this.displayCanvas, "displayCanvas").width - 1,
        assertDefined(this.displayCanvas, "displayCanvas").height - 1
      );
    }

    displayContext.translate(translateX, translateY);

    // Scale up to draw the canvas content
    displayContext.scale(z, z);

    if (UserSettings.get("SEAMLESS_MODE")) {
      displayContext.clearRect(-1 * w, -1 * h, 3 * w, 3 * h);
    } else {
      displayContext.clearRect(0, 0, w, h);
    }

    if (UserSettings.get("SEAMLESS_MODE")) {
      this.drawTiledFrames_(displayContext, this.canvas, w, h, 1);
    }
    displayContext.drawImage(this.canvas, 0, 0);

    // Draw grid.
    const gridWidth = this.computeGridWidthForDisplay_();
    const gridSpacing = this.getGridSpacing();
    if (gridWidth > 0) {
      const gridColor = this.getGridColor();
      // Scale out before drawing the grid.
      displayContext.scale(1 / z, 1 / z);

      let drawOrClear;
      if (gridColor === Constants.TRANSPARENT_COLOR) {
        drawOrClear = displayContext.clearRect.bind(displayContext);
      } else {
        displayContext.fillStyle = gridColor;
        drawOrClear = displayContext.fillRect.bind(displayContext);
      }

      // Draw or clear vertical lines.
      for (let i = 1; i < frame.getWidth(); i++) {
        if (i % gridSpacing == 0) {
          drawOrClear(i * z - gridWidth / 2, 0, gridWidth, h * z);
        }
      }
      // Draw or clear horizontal lines.
      for (let j = 1; j < frame.getHeight(); j++) {
        if (j % gridSpacing == 0) {
          drawOrClear(0, j * z - gridWidth / 2, w * z, gridWidth);
        }
      }
    }

    displayContext.restore();
  }

  /**
   * Draw repeatedly the provided image around the main drawing area. Used for seamless
   * drawing mode, to easily create seamless textures. A colored overlay is applied to
   * differentiate those additional frames from the main frame.
   */
  drawTiledFrames_(
    context: CanvasRenderingContext2D,
    image: HTMLImageElement | HTMLCanvasElement,
    w: number,
    h: number,
    z: number
  ): void {
    let opacity = UserSettings.get("SEAMLESS_OPACITY");
    opacity = MathUtils.minmax(opacity, 0, 1);
    context.fillStyle = "rgba(255, 255, 255, " + opacity + ")";
    [
      [0, -1],
      [0, 1],
      [-1, -1],
      [-1, 0],
      [-1, 1],
      [1, -1],
      [1, 0],
      [1, 1]
    ].forEach(function (d) {
      context.drawImage(image, d[0] * w * z, d[1] * h * z);
      context.fillRect(d[0] * w * z, d[1] * h * z, w * z, h * z);
    });
  }
}
