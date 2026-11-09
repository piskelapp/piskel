import { Constants } from "../Constants";
import { Events, type UserSettingValue } from "../Events";
import { app } from "../app";
import type { JQueryEvent } from "../lib/jquery-1.8.0";
import { Frame } from "../model/Frame";
import { CompositeRenderer } from "../rendering/CompositeRenderer";
import { OnionSkinRenderer } from "../rendering/OnionSkinRenderer";
import { CachedFrameRenderer } from "../rendering/frame/CachedFrameRenderer";
import { LayersRenderer } from "../rendering/layer/LayersRenderer";
import { Shortcuts } from "../service/keyboard/Shortcuts";
import type { BaseTool } from "../tools/drawing/BaseTool";
import { Dom } from "../utils/Dom";
import { UserAgent } from "../utils/UserAgent";
import { UserSettings } from "../utils/UserSettings";
import { assertDefined, intToColor } from "../utils/core";
import { DragHandler } from "./drawing/DragHandler";
import type { PublicPiskelController } from "./piskel/PublicPiskelController";

const computedLineheightForScrollEvents =
  parseFloat(getComputedStyle(document.documentElement).lineHeight) || 16;

/** Touch events go through the same handlers as mouse events. */
type DrawingEvent = MouseEvent & { changedTouches?: TouchList };

export class DrawingController {
  piskelController: PublicPiskelController;
  dragHandler: DragHandler;
  overlayFrame: Frame;
  container: HTMLElement;
  overlayRenderer: CachedFrameRenderer;
  onionSkinRenderer: OnionSkinRenderer;
  layersRenderer: LayersRenderer;
  renderer: CachedFrameRenderer;
  compositeRenderer: CompositeRenderer;
  isClicked: boolean;
  previousMousemoveTime: number;
  currentToolBehavior: BaseTool | null;
  resizeObserver: ResizeObserver | null;
  resizeTimer: number | undefined;
  isPickingColor: boolean | undefined;
  _clientX: number | undefined;
  _clientY: number | undefined;
  flashColorPickerTimer: number | undefined;

  constructor(
    piskelController: PublicPiskelController,
    container: HTMLElement
  ) {
    /**
     * @public
     */
    this.piskelController = piskelController;

    this.dragHandler = new DragHandler(this);

    /**
     * @public
     */
    this.overlayFrame = Frame.createEmptyFromFrame(
      piskelController.getCurrentFrame()
    );

    /**
     * @private
     */
    this.container = container;

    const cfg = {
      zoom: this.calculateZoom_(),
      supportGridRendering: false,
      height: this.getContainerHeight_(),
      width: this.getContainerWidth_(),
      xOffset: 0,
      yOffset: 0
    };

    this.overlayRenderer = new CachedFrameRenderer(this.container, cfg, [
      "canvas-overlay"
    ]);
    this.onionSkinRenderer = OnionSkinRenderer.createInContainer(
      this.container,
      cfg,
      piskelController
    );
    this.layersRenderer = new LayersRenderer(
      this.container,
      cfg,
      piskelController
    );
    cfg.supportGridRendering = true;
    this.renderer = new CachedFrameRenderer(this.container, cfg, [
      "drawing-canvas"
    ]);

    this.compositeRenderer = new CompositeRenderer();
    this.compositeRenderer
      .add(this.overlayRenderer)
      .add(this.renderer)
      .add(this.layersRenderer)
      .add(this.onionSkinRenderer);

    // State of drawing controller:
    this.isClicked = false;
    this.previousMousemoveTime = 0;
    this.currentToolBehavior = null;
    this.resizeObserver = null;
  }

  init(): void {
    this.initMouseBehavior();

    $.subscribe(Events.TOOL_SELECTED, (evt, toolBehavior) => {
      this.currentToolBehavior = toolBehavior;
      this.overlayFrame.clear();
    });

    $.subscribe(
      Events.USER_SETTINGS_CHANGED,
      this.onUserSettingsChange_.bind(this)
    );
    $.subscribe(Events.FRAME_SIZE_CHANGED, this.onFrameSizeChange_.bind(this));

    const shortcuts = Shortcuts;
    assertDefined(app.shortcutService, "shortcutService").registerShortcut(
      shortcuts.MISC.RESET_ZOOM,
      this.resetZoom_.bind(this)
    );
    assertDefined(app.shortcutService, "shortcutService").registerShortcut(
      shortcuts.MISC.INCREASE_ZOOM,
      this.updateZoom_.bind(this, 1)
    );
    assertDefined(app.shortcutService, "shortcutService").registerShortcut(
      shortcuts.MISC.DECREASE_ZOOM,
      this.updateZoom_.bind(this, -1)
    );
    assertDefined(app.shortcutService, "shortcutService").registerShortcut(
      shortcuts.MISC.OFFSET_UP,
      this.updateOffset_.bind(this, "up")
    );
    assertDefined(app.shortcutService, "shortcutService").registerShortcut(
      shortcuts.MISC.OFFSET_RIGHT,
      this.updateOffset_.bind(this, "right")
    );
    assertDefined(app.shortcutService, "shortcutService").registerShortcut(
      shortcuts.MISC.OFFSET_DOWN,
      this.updateOffset_.bind(this, "down")
    );
    assertDefined(app.shortcutService, "shortcutService").registerShortcut(
      shortcuts.MISC.OFFSET_LEFT,
      this.updateOffset_.bind(this, "left")
    );

    window.setTimeout(() => {
      this.relayout_();
      this.resetZoom_();
    }, 100);

    this.resizeObserver = new ResizeObserver(() => {
      this.requestRelayout_();
    });

    const container = Dom.getElement<HTMLElement>("#main-wrapper");
    this.resizeObserver.observe(container);
  }

  initMouseBehavior(): void {
    this.container.addEventListener("mousedown", this.onMousedown_.bind(this));

    this.container.addEventListener("wheel", this.onMousewheel_.bind(this));

    window.addEventListener("mouseup", this.onMouseup_.bind(this));
    window.addEventListener("mousemove", this.onMousemove_.bind(this));
    window.addEventListener("keyup", this.onKeyup_.bind(this));
    window.addEventListener("touchstart", this.onTouchstart_.bind(this));
    window.addEventListener("touchmove", this.onTouchmove_.bind(this));
    window.addEventListener("touchend", this.onTouchend_.bind(this));

    // Deactivate right click:
    document.body.addEventListener(
      "contextmenu",
      this.onCanvasContextMenu_.bind(this)
    );
  }

  requestRelayout_(): void {
    if (this.resizeTimer) {
      window.clearInterval(this.resizeTimer);
    }
    this.resizeTimer = window.setTimeout(this.relayout_.bind(this), 200);
  }

  relayout_(): void {
    const initialWidth = this.compositeRenderer.getDisplaySize().width;

    this.compositeRenderer.setDisplaySize(
      this.getContainerWidth_(),
      this.getContainerHeight_()
    );
    const ratio = this.compositeRenderer.getDisplaySize().width / initialWidth;
    const newZoom = ratio * this.compositeRenderer.getZoom();
    this.compositeRenderer.setZoom(newZoom);

    $.publish(Events.ZOOM_CHANGED);
  }

  /**
   * @private
   */
  onUserSettingsChange_(
    evt: JQueryEvent,
    settingsName: string,
    settingsValue: UserSettingValue
  ): void {
    if (settingsName == "SHOW_GRID") {
      console.warn("DrawingController:onUserSettingsChange_ not implemented !");
    } else if (
      settingsName == UserSettings.ONION_SKIN ||
      settingsName == UserSettings.LAYER_PREVIEW
    ) {
      this.onionSkinRenderer.clear();
      this.onionSkinRenderer.flush();
      this.layersRenderer.clear();
      this.layersRenderer.flush();
      this.render();
    }
  }

  onFrameSizeChange_(): void {
    this.compositeRenderer.setDisplaySize(
      this.getContainerWidth_(),
      this.getContainerHeight_()
    );
    this.compositeRenderer.setZoom(this.calculateZoom_());
    this.compositeRenderer.setOffset(0, 0);
    $.publish(Events.ZOOM_CHANGED);
  }

  onTouchstart_(event: Event): void {
    this.onMousedown_(event as DrawingEvent);
  }

  onTouchmove_(event: Event): void {
    this.onMousemove_(event as DrawingEvent);
    event.preventDefault();
  }

  onTouchend_(event: Event): void {
    this.onMouseup_(event as DrawingEvent);
  }

  /**
   * @private
   */
  onMousedown_(event: DrawingEvent): void {
    $.publish(Events.MOUSE_EVENT, [event, this]);
    const frame = this.piskelController.getCurrentFrame();
    let coords = this.getSpriteCoordinates(event.clientX, event.clientY);
    if (event.changedTouches && event.changedTouches[0]) {
      coords = this.getSpriteCoordinates(
        event.changedTouches[0].clientX,
        event.changedTouches[0].clientY
      );
    }

    this.isClicked = true;

    if (event.button === Constants.MIDDLE_BUTTON) {
      this.dragHandler.startDrag(event.clientX, event.clientY);
    } else if (
      event.altKey &&
      !assertDefined(
        this.currentToolBehavior,
        "currentToolBehavior"
      ).supportsAlt()
    ) {
      assertDefined(
        this.currentToolBehavior,
        "currentToolBehavior"
      ).hideHighlightedPixel(this.overlayFrame);
      this.isPickingColor = true;
    } else {
      assertDefined(
        this.currentToolBehavior,
        "currentToolBehavior"
      ).hideHighlightedPixel(this.overlayFrame);
      $.publish(Events.TOOL_PRESSED);
      assertDefined(
        this.currentToolBehavior,
        "currentToolBehavior"
      ).applyToolAt(coords.x, coords.y, frame, this.overlayFrame, event);
    }
  }

  /**
   * @private
   */
  onMousemove_(event: DrawingEvent): void {
    this._clientX = event.clientX;
    this._clientY = event.clientY;
    if (event.changedTouches && event.changedTouches[0]) {
      this._clientX = event.changedTouches[0].clientX;
      this._clientY = event.changedTouches[0].clientY;
    }

    const currentTime = new Date().getTime();
    // Throttling of the mousemove event:

    if (
      currentTime - this.previousMousemoveTime >
      Constants.MOUSEMOVE_THROTTLING
    ) {
      this.moveTool_(Number(this._clientX), Number(this._clientY), event);
      this.previousMousemoveTime = currentTime;
    }
  }

  /**
   * @private
   */
  onKeyup_(event: Event): void {
    // moveTool_ only reads the modifier keys, available on both event types.
    this.moveTool_(
      Number(this._clientX),
      Number(this._clientY),
      event as MouseEvent
    );
  }

  moveTool_(x: number, y: number, event: MouseEvent): void {
    const coords = this.getSpriteCoordinates(x, y);
    const currentFrame = this.piskelController.getCurrentFrame();

    if (this.isClicked) {
      if (
        assertDefined(
          app.mouseStateService,
          "mouseStateService"
        ).isMiddleButtonPressed()
      ) {
        this.dragHandler.updateDrag(x, y);
      } else if (this.isPickingColor) {
        // Nothing to do on mousemove when picking a color with ALT+click.
      } else {
        $.publish(Events.MOUSE_EVENT, [event, this]);
        assertDefined(
          this.currentToolBehavior,
          "currentToolBehavior"
        ).moveToolAt(
          coords.x | 0,
          coords.y | 0,
          currentFrame,
          this.overlayFrame,
          event
        );
      }
    } else {
      assertDefined(
        this.currentToolBehavior,
        "currentToolBehavior"
      ).moveUnactiveToolAt(
        coords.x,
        coords.y,
        currentFrame,
        this.overlayFrame,
        event
      );
    }
    $.publish(Events.CURSOR_MOVED, [coords.x, coords.y]);
  }

  onMousewheel_(evt: WheelEvent): void {
    // Normalize mousewheel:
    let delta;
    if (evt.deltaMode === 2) {
      // DOM_DELTA_PAGE
      delta = -1 * evt.deltaY * window.innerHeight;
    } else if (evt.deltaMode === 1) {
      // DOM_DELTA_LINE
      delta = -1 * evt.deltaY * computedLineheightForScrollEvents; // Firefox uses line delta on desktop.
    } else {
      // DOM_DELTA_PIXEL
      delta = -1 * evt.deltaY; // Default and most common case.
    }

    delta = delta || 0;
    let modifier = delta / 120;

    if (UserAgent.isMac ? evt.metaKey : evt.ctrlKey) {
      modifier = modifier * 5;
      // prevent default to prevent the default browser UI resize
      evt.preventDefault();
    }

    const coords = this.getSpriteCoordinates(evt.clientX, evt.clientY);
    this.updateZoom_(modifier, coords);
  }

  /**
   * Update the current viewport offset of 1 pixel in the provided direction.
   * Direction can be one of 'up', 'right', 'down', 'left'.
   * Callback for the OFFSET_${DIR} shortcuts.
   */
  updateOffset_(direction: string): void {
    const off = this.getOffset();
    if (direction === "up") {
      off.y -= 1;
    } else if (direction === "right") {
      off.x += 1;
    } else if (direction === "down") {
      off.y += 1;
    } else if (direction === "left") {
      off.x -= 1;
    }

    this.setOffset(off.x, off.y);
  }

  /**
   * Update the current zoom level by a given multiplier.
   *
   * @param {Number} zoomMultiplier: factor by which the zoom should be modified. Negative
   *        values will decrease the zoom, positive values will increase it.
   * @param {Object} centerCoords, optional:
   *        - {Number} x: x coordinate of the desired center the zoomed canvas
   *        - {Number} y: y coordinate of the desired center the zoomed canvas
   */
  updateZoom_(
    zoomMultiplier: number,
    centerCoords?: { x: number; y: number } | string
  ): void {
    if (zoomMultiplier === 0) {
      return;
    }

    const off = this.getOffset();
    const oldWidth = this.getContainerWidth_() / this.renderer.getZoom();
    const oldHeight = this.getContainerHeight_() / this.renderer.getZoom();

    const step = zoomMultiplier * this.getZoomStep_();
    this.setZoom_(this.renderer.getZoom() + step);

    if (typeof centerCoords === "object") {
      const xRatio = (centerCoords.x - off.x) / oldWidth;
      const yRatio = (centerCoords.y - off.y) / oldHeight;
      const newWidth = this.getContainerWidth_() / this.renderer.getZoom();
      const newHeight = this.getContainerHeight_() / this.renderer.getZoom();
      this.setOffset(
        off.x - (newWidth - oldWidth) * xRatio,
        off.y - (newHeight - oldHeight) * yRatio
      );
    }
  }

  /**
   * @private
   */
  onMouseup_(event: DrawingEvent): void {
    if (!this.isClicked) {
      return;
    }

    let coords = this.getSpriteCoordinates(event.clientX, event.clientY);
    if (event.changedTouches && event.changedTouches[0]) {
      coords = this.getSpriteCoordinates(
        event.changedTouches[0].clientX,
        event.changedTouches[0].clientY
      );
    }

    // A mouse button was clicked on the drawing canvas before this mouseup event,
    // the user was probably drawing on the canvas.
    // Note: The mousemove movement (and the mouseup) may end up outside
    // of the drawing canvas.

    this.isClicked = false;

    const isMiddleButton = assertDefined(
      app.mouseStateService,
      "mouseStateService"
    ).isMiddleButtonPressed();
    const isMiddleClick = isMiddleButton && !this.dragHandler.isDragging();
    const isMiddleDrag = isMiddleButton && this.dragHandler.isDragging();

    if (this.isPickingColor || isMiddleClick) {
      // Picking color after ALT+click or middle mouse button click.
      this.pickColorAt_(coords);
      this.isPickingColor = false;
      // Flash the cursor to briefly show the colorpicker cursor.
      this.flashColorPicker_();
    } else if (isMiddleDrag) {
      // Stop the drag handler after a middle button drag action.
      this.dragHandler.stopDrag();
    } else {
      // Regular tool click, release the current tool.
      assertDefined(
        this.currentToolBehavior,
        "currentToolBehavior"
      ).releaseToolAt(
        coords.x,
        coords.y,
        this.piskelController.getCurrentFrame(),
        this.overlayFrame,
        event
      );
      $.publish(Events.TOOL_RELEASED);
    }

    $.publish(Events.MOUSE_EVENT, [event, this]);
  }

  /**
   * Send a COLOR selection event for the color contained at the provided coordinates.
   * No-op if the coordinate is outside of the drawing canvas.
   * @param  {Object} coords {x: Number, y: Number}
   */
  pickColorAt_(coords: { x: number; y: number }): void {
    const frame = this.piskelController.getCurrentFrame();
    if (!frame.containsPixel(coords.x, coords.y)) {
      return;
    }

    const color = intToColor(frame.getPixel(coords.x, coords.y));
    const isRightButton = assertDefined(
      app.mouseStateService,
      "mouseStateService"
    ).isRightButtonPressed();
    const evt = isRightButton
      ? Events.SELECT_SECONDARY_COLOR
      : Events.SELECT_PRIMARY_COLOR;
    $.publish(evt, [color]);
  }

  flashColorPicker_(): void {
    document.body.classList.add("tool-colorpicker");
    document.body.classList.remove(
      assertDefined(
        assertDefined(this.currentToolBehavior, "currentToolBehavior").toolId,
        "toolId"
      )
    );
    window.clearTimeout(this.flashColorPickerTimer);
    this.flashColorPickerTimer = window.setTimeout(() => {
      document.body.classList.remove("tool-colorpicker");
      document.body.classList.add(
        assertDefined(
          assertDefined(this.currentToolBehavior, "currentToolBehavior").toolId,
          "toolId"
        )
      );
    }, 200);
  }

  /**
   * Translate absolute x,y screen coordinates into sprite coordinates
   * @param  {Number} screenX
   * @param  {Number} screenY
   * @return {Object} {x:Number, y:Number}
   */
  getSpriteCoordinates(
    screenX: number,
    screenY: number
  ): { x: number; y: number } {
    return this.renderer.getCoordinates(screenX, screenY);
  }

  getScreenCoordinates(
    spriteX: number,
    spriteY: number
  ): { x: number; y: number } {
    return this.renderer.reverseCoordinates(spriteX, spriteY);
  }

  /**
   * @private
   */
  onCanvasContextMenu_(event: Event): false | undefined {
    // closest() not really available everywhere yet, just skip if missing.
    if (
      (event.target as HTMLElement).closest &&
      (event.target as HTMLElement).closest("#drawing-canvas-container")
    ) {
      // Deactivate right click on drawing canvas only.
      event.preventDefault();
      event.stopPropagation();
      event.cancelBubble = true;
      return false;
    }
  }

  render(): void {
    const currentFrame = this.piskelController.getCurrentFrame();
    if (!currentFrame.isSameSize(this.overlayFrame)) {
      this.overlayFrame = Frame.createEmptyFromFrame(currentFrame);
    }

    if (UserSettings.get(UserSettings.ONION_SKIN)) {
      this.onionSkinRenderer.render();
    }

    if (UserSettings.get(UserSettings.LAYER_PREVIEW)) {
      this.layersRenderer.render();
    }

    this.renderer.render(currentFrame);
    this.overlayRenderer.render(this.overlayFrame);
  }

  /**
   * @private
   */
  calculateZoom_(): number {
    const frameHeight = this.piskelController.getCurrentFrame().getHeight();
    const frameWidth = this.piskelController.getCurrentFrame().getWidth();

    return Math.min(
      this.getAvailableWidth_() / frameWidth,
      this.getAvailableHeight_() / frameHeight
    );
  }

  getAvailableHeight_(): number {
    return Dom.getElement<HTMLElement>("#main-wrapper").getBoundingClientRect()
      .height;
  }

  getSelectorWidth_(selector: string): number {
    return Dom.getElement<HTMLElement>(selector).getBoundingClientRect().width;
  }

  getAvailableWidth_(): number {
    const leftSectionWidth = this.getSelectorWidth_(".left-column");
    const rightSectionWidth = this.getSelectorWidth_(".right-column");
    const toolsContainerWidth = this.getSelectorWidth_("#tool-section");
    const settingsContainerWidth = this.getSelectorWidth_(
      "#application-action-section"
    );

    const usedWidth =
      leftSectionWidth +
      rightSectionWidth +
      toolsContainerWidth +
      settingsContainerWidth;
    const availableWidth = this.getSelectorWidth_("#main-wrapper") - usedWidth;

    const comfortMargin = 10;
    return availableWidth - comfortMargin;
  }

  getContainerHeight_(): number {
    return this.getAvailableHeight_();
  }

  getContainerWidth_(): number {
    return this.getAvailableWidth_();
  }

  getRenderer(): CompositeRenderer {
    return this.compositeRenderer;
  }

  getOffset(): { x: number; y: number } {
    return this.compositeRenderer.getOffset();
  }

  setOffset(x: number, y: number): void {
    this.compositeRenderer.setOffset(x, y);
    $.publish(Events.ZOOM_CHANGED);
  }

  resetZoom_(): void {
    this.setZoom_(this.calculateZoom_());
  }

  getZoomStep_(): number {
    return Math.max(0.1, this.renderer.getZoom() / 15);
  }

  setZoom_(zoom: number): void {
    this.compositeRenderer.setZoom(zoom);
    $.publish(Events.ZOOM_CHANGED);
  }
}
