import type { Piskel } from "../model/Piskel";
import { Dom } from "../utils/Dom";
import { EventUtils, type ListenerCallback } from "../utils/Event";
import { FrameUtils } from "../utils/FrameUtils";
import { LayerUtils } from "../utils/LayerUtils";
import { assertDefined } from "../utils/core";

const WIDGET_MARKUP =
  '<div class="frame-viewer"></div>' +
  '<div class="frame-nav">' +
  '<button class="button frame-nav-first">&lt;&lt;</button>' +
  '<button class="button frame-nav-previous">&lt;</button>' +
  '<input class="textfield frame-nav-input" type="text">' +
  '<button class="button frame-nav-next">&gt;</button>' +
  '<button class="button frame-nav-last">&gt;&gt;</button>' +
  "</div>";

/**
 * The frame picker widget displays a a simple UI to view the frames of a piskel.
 * UI controls allow the user to browser through the frames
 * @param {Piskel} piskel
 *        The piskel instance for which we want to preview frames.
 * @param {Node} container
 *        Node in which the widget should be inserted.
 */
export class FramePicker {
  piskel: Piskel;
  container: HTMLElement;
  firstFrameIndex: number;
  wrapper: HTMLElement;
  frameViewer: HTMLElement;
  firstButton: HTMLElement;
  previousButton: HTMLElement;
  nextButton: HTMLElement;
  lastButton: HTMLElement;
  input: HTMLInputElement;
  currentFrameIndex: number | undefined;

  constructor(piskel: Piskel, container: HTMLElement) {
    this.piskel = piskel;
    this.container = container;
    this.firstFrameIndex = 1;

    // Create internal wrapper that will contain the widget.
    this.wrapper = document.createElement("div");
    this.wrapper.innerHTML = WIDGET_MARKUP;
    this.wrapper.classList.add("frame-picker-wrapper");

    this.frameViewer = Dom.getElement<HTMLElement>(
      ".frame-viewer",
      this.wrapper
    );
    this.firstButton = Dom.getElement<HTMLElement>(
      ".frame-nav-first",
      this.wrapper
    );
    this.previousButton = Dom.getElement<HTMLElement>(
      ".frame-nav-previous",
      this.wrapper
    );
    this.nextButton = Dom.getElement<HTMLElement>(
      ".frame-nav-next",
      this.wrapper
    );
    this.lastButton = Dom.getElement<HTMLElement>(
      ".frame-nav-last",
      this.wrapper
    );
    this.input = Dom.getElement<HTMLInputElement>(
      ".frame-nav-input",
      this.wrapper
    );
  }

  init(): void {
    // Add widget to its container
    this.container.appendChild(this.wrapper);

    // Attach event listeners
    this.addEventListener(this.firstButton, "click", this.onFirstClicked_);
    this.addEventListener(
      this.previousButton,
      "click",
      this.onPreviousClicked_
    );
    this.addEventListener(this.nextButton, "click", this.onNextClicked_);
    this.addEventListener(this.lastButton, "click", this.onLastClicked_);
    this.addEventListener(this.input, "change", this.onInputChange_);

    // Select the first frame
    this.setFrameIndex(1);
  }

  setFirstFrameIndex(index: number): void {
    this.firstFrameIndex = index;
    // Set the current frame index once again to normalize and update the UI if needed.
    this.setFrameIndex(
      assertDefined(this.currentFrameIndex, "currentFrameIndex")
    );
  }

  destroy(): void {
    if (this.wrapper.parentNode) {
      this.wrapper.parentNode.removeChild(this.wrapper);
    }

    EventUtils.removeAllEventListeners(this);
  }

  onFirstClicked_(): void {
    this.setFrameIndex(this.firstFrameIndex);
  }

  onPreviousClicked_(): void {
    this.setFrameIndex(
      assertDefined(this.currentFrameIndex, "currentFrameIndex") - 1
    );
  }

  onNextClicked_(): void {
    this.setFrameIndex(
      assertDefined(this.currentFrameIndex, "currentFrameIndex") + 1
    );
  }

  onLastClicked_(): void {
    this.setFrameIndex(this.piskel.getFrameCount());
  }

  onInputChange_(): void {
    let index = parseInt(this.input.value, 10);
    if (isNaN(index)) {
      this.input.value = String(1);
      return;
    }

    index = Math.max(this.firstFrameIndex, index);
    index = Math.min(this.getFrameCount_(), index);

    if (index !== this.currentFrameIndex) {
      this.setFrameIndex(index);
    }
  }

  getFrameCount_(): number {
    return this.piskel.getLayerAt(0).getFrames().length;
  }

  addEventListener(
    el: EventTarget | string,
    type: string,
    callback: ListenerCallback
  ): void {
    EventUtils.addEventListener(el, type, callback, this);
  }

  getFrameIndex(): number | undefined {
    return this.currentFrameIndex;
  }

  setFrameIndex(frameIndex: number): void {
    frameIndex = Math.max(this.firstFrameIndex, frameIndex);
    frameIndex = Math.min(this.getFrameCount_(), frameIndex);

    this.currentFrameIndex = frameIndex;
    this.input.value = String(frameIndex);

    const image = this.getFrameAsImage_(frameIndex);
    image.classList.add("canvas-background");
    this.frameViewer.innerHTML = "";
    this.frameViewer.appendChild(image);

    const frameCount = this.getFrameCount_();
    this.setEnabled_(this.firstButton, frameIndex !== this.firstFrameIndex);
    this.setEnabled_(this.previousButton, frameIndex !== this.firstFrameIndex);
    this.setEnabled_(this.nextButton, frameIndex !== frameCount);
    this.setEnabled_(this.lastButton, frameIndex !== frameCount);

    if (frameIndex === 0) {
      this.previousButton.setAttribute("disabled", String(true));
      this.firstButton.setAttribute("disabled", String(true));
    }
  }

  getFrameAsImage_(frameIndex: number): HTMLCanvasElement | HTMLImageElement {
    if (frameIndex === 0) {
      return new Image();
    }

    const frame = LayerUtils.mergeFrameAt(
      this.piskel.getLayers(),
      frameIndex - 1
    );
    const zoom = this.getZoomLevel_();
    return FrameUtils.toImage(frame, zoom);
  }

  getZoomLevel_(): number {
    const viewerWidth = this.frameViewer.offsetWidth;
    const viewerHeight = this.frameViewer.offsetHeight;
    const wZoom = viewerWidth / this.piskel.width;
    const hZoom = viewerHeight / this.piskel.height;
    return Math.min(hZoom, wZoom);
  }

  /**
   * DOM helper to enable / disable as DOM element.
   * @param {Node} el
   *        The element to enable / disable.
   * @param {Boolean} enabled
   *        Should the element be disabled or enabled.
   */
  setEnabled_(el: HTMLElement, enabled: boolean): void {
    if (enabled) {
      el.removeAttribute("disabled");
    } else {
      el.setAttribute("disabled", String(true));
    }
  }
}
