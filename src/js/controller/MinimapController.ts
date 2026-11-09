import { Constants } from "../Constants";
import { Events } from "../Events";
import { assertDefined } from "../utils/core";
import type { DrawingController } from "./DrawingController";
import type { PublicPiskelController } from "./piskel/PublicPiskelController";
import type { PreviewController } from "./preview/PreviewController";

export class MinimapController {
  piskelController: PublicPiskelController;
  previewController: PreviewController;
  drawingController: DrawingController;
  container: HTMLElement;
  isClicked: boolean;
  isVisible: boolean;
  minimapEl: HTMLElement | undefined;

  constructor(
    piskelController: PublicPiskelController,
    previewController: PreviewController,
    drawingController: DrawingController,
    container: HTMLElement
  ) {
    this.piskelController = piskelController;
    this.previewController = previewController;
    this.drawingController = drawingController;
    this.container = container;

    this.isClicked = false;
    this.isVisible = false;
  }

  init(): void {
    // Create minimap DOM elements
    this.minimapEl = document.createElement("DIV");
    this.minimapEl.className = "minimap-crop-frame";
    this.minimapEl.style.display = "none";
    this.container.appendChild(this.minimapEl);

    // Init mouse events
    this.container.addEventListener(
      "mousedown",
      this.onMinimapMousedown_.bind(this)
    );
    document.body.addEventListener(
      "mousemove",
      this.onMinimapMousemove_.bind(this)
    );
    document.body.addEventListener(
      "mouseup",
      this.onMinimapMouseup_.bind(this)
    );

    $.subscribe(Events.ZOOM_CHANGED, this.renderMinimap_.bind(this));
  }

  renderMinimap_(): void {
    const verticalRatio = this.getVerticalRatio_();
    const horizontalRatio = this.getHorizontalRatio_();
    if (verticalRatio > 1 || horizontalRatio > 1) {
      this.displayMinimap_();
    } else {
      this.hideMinimap_();
    }
  }

  displayMinimap_(): void {
    const minimapSize = this.getMinimapSize_();
    const previewSize = this.getPreviewSize_();

    const containerRect = this.container.getBoundingClientRect();
    const containerHeight = containerRect.height;
    const containerWidth = containerRect.width;

    // offset(x, y) in frame pixels
    const offset = this.drawingController.getRenderer().getOffset();

    // the preview is centered in a square container
    // if the sprite is not a square, a margin is needed on the appropriate coordinate
    // before adding the offset coming from the drawing area
    const leftMargin =
      (containerWidth - Math.max(minimapSize.width, previewSize.width)) / 2;
    const leftOffset = offset.x * this.previewController.getZoom();
    const left = leftMargin + leftOffset;

    const topMargin =
      (containerHeight - Math.max(minimapSize.height, previewSize.height)) / 2;
    const topOffset = offset.y * this.previewController.getZoom();
    const top = topMargin + topOffset;

    assertDefined(this.minimapEl, "minimapEl").style.display = "block";
    assertDefined(this.minimapEl, "minimapEl").style.width =
      Math.min(minimapSize.width, containerWidth) + "px";
    assertDefined(this.minimapEl, "minimapEl").style.height =
      Math.min(minimapSize.height, containerHeight) + "px";
    assertDefined(this.minimapEl, "minimapEl").style.left =
      Math.max(0, left) + Constants.RIGHT_COLUMN_PADDING_LEFT + "px";
    assertDefined(this.minimapEl, "minimapEl").style.top =
      Math.max(0, top) + "px";

    this.isVisible = true;
  }

  getMinimapSize_(): { width: number; height: number } {
    // Calculate the ratio to translate drawing area sizes to animated preview sizes
    const drawingAreaZoom = this.drawingController.getRenderer().getZoom();
    const animatedPreviewZoom = this.previewController.getZoom();
    const ratio = drawingAreaZoom / animatedPreviewZoom;

    const displaySize = this.drawingController.getRenderer().getDisplaySize();
    const minimapWidth = displaySize.width / ratio;
    const minimapHeight = displaySize.height / ratio;

    return {
      width: minimapWidth,
      height: minimapHeight
    };
  }

  getPreviewSize_(): { width: number; height: number } {
    const frame = this.piskelController.getCurrentFrame();
    const previewWidth = frame.getWidth() * this.previewController.getZoom();
    const previewHeight = frame.getHeight() * this.previewController.getZoom();

    return {
      width: previewWidth,
      height: previewHeight
    };
  }

  hideMinimap_(): void {
    assertDefined(this.minimapEl, "minimapEl").style.display = "none";
    this.isVisible = false;
  }

  onMinimapMousemove_(evt: MouseEvent): void {
    if (this.isVisible && this.isClicked) {
      const coords = this.getCoordinatesCenteredAround_(
        evt.clientX,
        evt.clientY
      );
      this.drawingController.setOffset(coords.x, coords.y);
    }
  }

  onMinimapMousedown_(evt: Event): void {
    this.isClicked = true;
  }

  onMinimapMouseup_(evt: Event): void {
    this.isClicked = false;
  }

  getCoordinatesCenteredAround_(
    x: number,
    y: number
  ): { x: number; y: number } {
    const frameCoords = this.previewController.getCoordinates(x, y);

    const frameWidth = this.piskelController.getCurrentFrame().getWidth();
    const frameHeight = this.piskelController.getCurrentFrame().getHeight();

    const width = frameWidth / this.getHorizontalRatio_();
    const height = frameHeight / this.getVerticalRatio_();

    return {
      x: frameCoords.x - width / 2,
      y: frameCoords.y - height / 2
    };
  }

  getVerticalRatio_(): number {
    const drawingAreaZoom = this.drawingController.getRenderer().getZoom();
    const frame = this.piskelController.getCurrentFrame();
    const frameTotalHeight = frame.getHeight() * drawingAreaZoom;
    const frameDisplayHeight = this.drawingController
      .getRenderer()
      .getDisplaySize().height;

    return frameTotalHeight / frameDisplayHeight;
  }

  getHorizontalRatio_(): number {
    const drawingAreaZoom = this.drawingController.getRenderer().getZoom();
    const frame = this.piskelController.getCurrentFrame();
    const frameTotalWidth = frame.getWidth() * drawingAreaZoom;
    const frameDisplayWidth = this.drawingController
      .getRenderer()
      .getDisplaySize().width;

    return frameTotalWidth / frameDisplayWidth;
  }
}
