import { Constants } from "../Constants";
import { Events } from "../Events";
import type { JQueryEvent } from "../lib/jquery-1.8.0";
import type { SortableUi } from "../lib/jquery-ui-1.10.3.custom";
import type { Frame } from "../model/Frame";
import { CachedFrameProcessor } from "../model/frame/CachedFrameProcessor";
import type { RenderedFrame } from "../model/frame/RenderedFrame";
import { CanvasRenderer } from "../rendering/CanvasRenderer";
import { CanvasUtils } from "../utils/CanvasUtils";
import { Dom } from "../utils/Dom";
import { UserSettings } from "../utils/UserSettings";
import { assertDefined } from "../utils/core";
import type { PublicPiskelController } from "./piskel/PublicPiskelController";

const ACTION = {
  SELECT: "select",
  CLONE: "clone",
  DELETE: "delete",
  NEW_FRAME: "newframe",
  TOGGLE: "toggle"
};

export class FramesListController {
  piskelController: PublicPiskelController;
  container: HTMLElement;
  previewList: HTMLElement;
  redrawFlag: boolean;
  regenerateDomFlag: boolean;
  justDropped: boolean;
  cachedFrameProcessor: CachedFrameProcessor<HTMLCanvasElement>;
  previewListScroller: HTMLElement | undefined;
  zoom: number | undefined;
  tiles: HTMLElement[] | undefined;
  addFrameTile: HTMLDivElement | null | undefined;
  resizeTimer: number | undefined;

  constructor(
    piskelController: PublicPiskelController,
    container: HTMLElement
  ) {
    this.piskelController = piskelController;
    this.container = container;
    this.previewList = Dom.getElement<HTMLElement>("#preview-list", container);
    this.refreshZoom_();

    this.redrawFlag = true;
    this.regenerateDomFlag = true;
    this.justDropped = false;

    this.cachedFrameProcessor = new CachedFrameProcessor<HTMLCanvasElement>();
    this.cachedFrameProcessor.setFrameProcessor(
      this.frameToPreviewCanvas_.bind(this)
    );
    this.cachedFrameProcessor.setOutputCloner(
      this.clonePreviewCanvas_.bind(this)
    );

    this.initDragndropBehavior_();
  }

  init(): void {
    $.subscribe(Events.TOOL_RELEASED, this.flagForRedraw_.bind(this));
    $.subscribe(Events.PISKEL_RESET, () => this.flagForRedraw_(true));
    $.subscribe(Events.USER_SETTINGS_CHANGED, this.flagForRedraw_.bind(this));

    $.subscribe(Events.PISKEL_RESET, this.refreshZoom_.bind(this));

    this.previewListScroller = Dom.getElement<HTMLElement>(
      "#preview-list-scroller"
    );
    this.previewListScroller.addEventListener(
      "scroll",
      this.updateScrollerOverflows.bind(this)
    );
    this.container.addEventListener("click", this.onContainerClick_.bind(this));
    this.updateScrollerOverflows();
  }

  flagForRedraw_(regenerateDom?: JQueryEvent | boolean): void {
    this.redrawFlag = true;

    if (regenerateDom) {
      this.regenerateDomFlag = true;
    }
  }

  refreshZoom_(): void {
    this.zoom = this.calculateZoom_();
  }

  render(): void {
    if (this.redrawFlag) {
      if (this.regenerateDomFlag) {
        this.tiles = [];
        this.addFrameTile = null;
        this.createPreviews_();

        this.regenerateDomFlag = false;
      }

      this.updatePreviews_();
      this.redrawFlag = false;
    }
  }

  updateScrollerOverflows(): void {
    const scroller = assertDefined(
      this.previewListScroller,
      "previewListScroller"
    );
    const scrollerHeight = scroller.offsetHeight;
    const scrollTop = scroller.scrollTop;
    const scrollerContentHeight = this.previewList.offsetHeight;
    const treshold = Dom.getElement<HTMLElement>(
      ".top-overflow",
      this.container
    ).offsetHeight;
    let overflowTop = false;
    let overflowBottom = false;

    if (scrollerHeight < scrollerContentHeight) {
      if (scrollTop > treshold) {
        overflowTop = true;
      }
      const scrollBottom = scrollerContentHeight - scrollTop - scrollerHeight;
      if (scrollBottom > treshold) {
        overflowBottom = true;
      }
    }
    this.container.classList.toggle("top-overflow-visible", overflowTop);
    this.container.classList.toggle("bottom-overflow-visible", overflowBottom);
  }

  onContainerClick_(event: Event): void {
    const target = Dom.getParentWithData(
      event.target as HTMLElement,
      "tileAction"
    );
    if (!target) {
      return;
    }
    const action = target.dataset.tileAction;
    const index = parseInt(String(target.dataset.tileNumber), 10);

    if (action === ACTION.CLONE) {
      this.piskelController.duplicateFrameAt(index);
      const clonedTile = this.createPreviewTile_(index + 1);
      this.previewList.insertBefore(
        clonedTile,
        assertDefined(this.tiles, "tiles")[index].nextSibling
      );
      assertDefined(this.tiles, "tiles").splice(index, 0, clonedTile);
      this.updateScrollerOverflows();
    } else if (action === ACTION.DELETE) {
      this.piskelController.removeFrameAt(index);
      this.previewList.removeChild(assertDefined(this.tiles, "tiles")[index]);
      assertDefined(this.tiles, "tiles").splice(index, 1);
      this.updateScrollerOverflows();
    } else if (action === ACTION.SELECT && !this.justDropped) {
      this.piskelController.setCurrentFrameIndex(index);
    } else if (action === ACTION.NEW_FRAME) {
      this.piskelController.addFrame();
      const newtile = this.createPreviewTile_(
        assertDefined(this.tiles, "tiles").length
      );
      assertDefined(this.tiles, "tiles").push(newtile);
      this.previewList.insertBefore(
        newtile,
        assertDefined(this.addFrameTile, "addFrameTile")
      );
      this.updateScrollerOverflows();
    } else if (action == ACTION.TOGGLE) {
      this.piskelController.toggleFrameVisibilityAt(index);
    }

    this.flagForRedraw_();
  }

  updatePreviews_(): void {
    let i;
    let length;

    for (
      i = 0, length = assertDefined(this.tiles, "tiles").length;
      i < length;
      i++
    ) {
      // Remove selected class
      assertDefined(this.tiles, "tiles")[i].classList.remove("selected");

      // Remove toggle class
      Dom.getElement<HTMLElement>(
        ".tile-count",
        assertDefined(this.tiles, "tiles")[i]
      ).classList.remove("toggled");

      // Update tile numbers
      assertDefined(this.tiles, "tiles")[i].setAttribute(
        "data-tile-number",
        String(i)
      );
      Dom.getElement<HTMLElement>(
        ".tile-count",
        assertDefined(this.tiles, "tiles")[i]
      ).innerHTML = String(i + 1);

      // Update visibility
      if (this.piskelController.hasVisibleFrameAt(i)) {
        Dom.getElement<HTMLElement>(
          ".tile-count",
          assertDefined(this.tiles, "tiles")[i]
        ).classList.add("toggled");
      }

      // Check if any tile is updated
      const hash = this.piskelController
        .getCurrentLayer()
        .getFrameAt(i)
        .getHash();
      if (
        assertDefined(this.tiles, "tiles")[i].getAttribute("data-tile-hash") !==
        hash
      ) {
        if (assertDefined(this.tiles, "tiles")[i].querySelector("canvas")) {
          Dom.getElement<HTMLElement>(
            ".canvas-container",
            assertDefined(this.tiles, "tiles")[i]
          ).replaceChild(
            this.getCanvasForFrame(
              this.piskelController.getCurrentLayer().getFrameAt(i)
            ),
            assertDefined(
              assertDefined(this.tiles, "tiles")[i].querySelector("canvas"),
              "canvas"
            )
          );
        } else {
          Dom.getElement<HTMLElement>(
            ".canvas-container",
            assertDefined(this.tiles, "tiles")[i]
          ).appendChild(
            this.getCanvasForFrame(
              this.piskelController.getCurrentLayer().getFrameAt(i)
            )
          );
        }
      }
    }

    // Hide/Show buttons if needed
    const buttons = this.container.querySelectorAll<HTMLElement>(
      ".delete-frame-action, .dnd-action"
    );
    const display =
      this.piskelController.getFrameCount() > 1 ? "block" : "none";
    for (i = 0, length = buttons.length; i < length; i++) {
      buttons[i].style.display = display;
    }

    // Add selected class
    assertDefined(this.tiles, "tiles")[
      this.piskelController.getCurrentFrameIndex()
    ].classList.add("selected");
  }

  createPreviews_(): void {
    this.previewList.innerHTML = "";

    // Manually remove tooltips since mouseout events were shortcut by the DOM refresh:
    const tooltips = document.querySelectorAll(".tooltip");
    Array.prototype.forEach.call(tooltips, function (tooltip) {
      tooltip.parentNode.removeChild(tooltip);
    });

    const frameCount = this.piskelController.getFrameCount();

    for (let i = 0; i < frameCount; i++) {
      const tile = this.createPreviewTile_(i);
      this.previewList.appendChild(tile);
      assertDefined(this.tiles, "tiles")[i] = tile;
    }
    // Append 'new empty frame' button
    const newFrameButton = document.createElement("div");
    newFrameButton.id = "add-frame-action";
    newFrameButton.className = "add-frame-action";
    newFrameButton.setAttribute("data-tile-action", ACTION.NEW_FRAME);
    newFrameButton.setAttribute("data-test-id", "add-frame-button");
    newFrameButton.innerHTML =
      '<div class="add-frame-action-icon icon-frame-plus-white">' +
      '</div><div class="label">Add new frame</div>';
    this.previewList.appendChild(newFrameButton);
    this.addFrameTile = newFrameButton;

    this.updateScrollerOverflows();
  }

  /**
   * @private
   */
  initDragndropBehavior_(): void {
    $(this.previewList).sortable({
      placeholder: "preview-tile preview-tile-drop-proxy",
      update: this.onUpdate_.bind(this),
      stop: this.onSortableStop_.bind(this),
      items: ".preview-tile",
      axis: "y",
      tolerance: "pointer"
    });
    $(this.previewList).disableSelection();
  }

  /**
   * @private
   */
  onUpdate_(event: Event, ui: SortableUi): void {
    const movedItem = ui.item.get(0);
    const originFrameId = parseInt(String(movedItem.dataset.tileNumber), 10);
    const tiles = document.querySelectorAll(".preview-tile");
    const targetInsertionId = Array.prototype.indexOf.call(tiles, movedItem);

    this.piskelController.moveFrame(originFrameId, targetInsertionId);
    this.piskelController.setCurrentFrameIndex(targetInsertionId);

    const tile = assertDefined(this.tiles, "tiles").splice(originFrameId, 1)[0];
    assertDefined(this.tiles, "tiles").splice(targetInsertionId, 0, tile);
    this.flagForRedraw_();
  }

  /**
   * @private
   */
  onSortableStop_(event: Event, ui: SortableUi): void {
    this.justDropped = true;

    this.resizeTimer = window.setTimeout(() => {
      this.justDropped = false;
    }, 200);
  }

  /**
   * @private
   */
  createPreviewTile_(tileNumber: number): HTMLLIElement {
    const currentFrame = this.piskelController
      .getCurrentLayer()
      .getFrameAt(tileNumber);

    const previewTileRoot = document.createElement("li");
    previewTileRoot.setAttribute("data-tile-number", String(tileNumber));
    previewTileRoot.setAttribute("data-tile-hash", currentFrame.getHash());
    previewTileRoot.setAttribute("data-tile-action", ACTION.SELECT);
    previewTileRoot.classList.add("preview-tile");
    previewTileRoot.setAttribute("data-test-id", "frame-tile");
    if (this.piskelController.getCurrentFrame() == currentFrame) {
      previewTileRoot.classList.add("selected");
    }

    const canvasContainer = document.createElement("div");
    canvasContainer.classList.add(
      "canvas-container",
      UserSettings.get(UserSettings.CANVAS_BACKGROUND)
    );

    const height =
      assertDefined(this.zoom, "zoom") *
      this.piskelController.getCurrentFrame().getHeight();
    const horizontalMargin = (Constants.PREVIEW_FILM_SIZE - height) / 2;
    canvasContainer.style.marginTop = horizontalMargin + "px";

    const width =
      assertDefined(this.zoom, "zoom") *
      this.piskelController.getCurrentFrame().getWidth();
    const verticalMargin = (Constants.PREVIEW_FILM_SIZE - width) / 2;
    canvasContainer.style.marginLeft = verticalMargin + "px";
    canvasContainer.style.marginRight = verticalMargin + "px";

    // Add canvas background and canvas
    const canvasBackground = document.createElement("div");
    canvasBackground.className = "canvas-background";
    canvasContainer.appendChild(canvasBackground);
    canvasContainer.appendChild(this.getCanvasForFrame(currentFrame));
    previewTileRoot.appendChild(canvasContainer);

    // Add clone button
    const cloneFrameButton = document.createElement("button");
    cloneFrameButton.setAttribute("rel", "tooltip");
    cloneFrameButton.setAttribute("data-placement", "right");
    cloneFrameButton.setAttribute("data-tile-number", String(tileNumber));
    cloneFrameButton.setAttribute("data-tile-action", ACTION.CLONE);
    cloneFrameButton.setAttribute("title", "Duplicate this frame");
    cloneFrameButton.className =
      "tile-overlay duplicate-frame-action icon-frame-duplicate-white";
    cloneFrameButton.setAttribute("data-test-id", "duplicate-frame-button");
    previewTileRoot.appendChild(cloneFrameButton);

    // Add delete button
    const deleteButton = document.createElement("button");
    deleteButton.setAttribute("rel", "tooltip");
    deleteButton.setAttribute("data-placement", "right");
    deleteButton.setAttribute("title", "Delete this frame");
    deleteButton.setAttribute("data-tile-number", String(tileNumber));
    deleteButton.setAttribute("data-tile-action", ACTION.DELETE);
    deleteButton.className =
      "tile-overlay delete-frame-action icon-frame-recyclebin-white";
    deleteButton.setAttribute("data-test-id", "delete-frame-button");
    previewTileRoot.appendChild(deleteButton);

    // Add 'dragndrop handle'.
    const dndHandle = document.createElement("div");
    dndHandle.className = "tile-overlay dnd-action icon-frame-dragndrop-white";
    previewTileRoot.appendChild(dndHandle);

    // Add tile count
    const tileCount = document.createElement("button");
    tileCount.setAttribute("rel", "tooltip");
    tileCount.setAttribute("title", "Toggle for preview");
    tileCount.setAttribute("data-tile-number", String(tileNumber));
    tileCount.setAttribute("data-tile-action", ACTION.TOGGLE);
    tileCount.className = "tile-overlay tile-count toggle-frame-action";
    tileCount.setAttribute("data-test-id", "toggle-frame-button");
    tileCount.innerHTML = String(tileNumber + 1);
    previewTileRoot.appendChild(tileCount);

    return previewTileRoot;
  }

  getCanvasForFrame(frame: Frame): HTMLCanvasElement {
    const canvas = this.cachedFrameProcessor.get(frame, this.zoom);
    return canvas;
  }

  frameToPreviewCanvas_(frame: Frame | RenderedFrame): HTMLCanvasElement {
    const canvasRenderer = new CanvasRenderer(
      frame,
      assertDefined(this.zoom, "zoom")
    );
    canvasRenderer.drawTransparentAs(Constants.TRANSPARENT_COLOR);
    const canvas = canvasRenderer.render();
    canvas.classList.add("tile-view", "canvas");
    return canvas;
  }

  clonePreviewCanvas_(canvas: HTMLCanvasElement): HTMLCanvasElement {
    const clone = CanvasUtils.clone(canvas);
    clone.classList.add("tile-view", "canvas");
    return clone;
  }

  /**
   * Calculate the preview zoom depending on the piskel size
   */
  calculateZoom_(): number {
    const frame = this.piskelController.getCurrentFrame();
    const frameSize = Math.max(frame.getHeight(), frame.getWidth());

    return Constants.PREVIEW_FILM_SIZE / frameSize;
  }
}
