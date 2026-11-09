import type { Frame } from "../../model/Frame";
import { CachedFrameProcessor } from "../../model/frame/CachedFrameProcessor";
import { RenderedFrame } from "../../model/frame/RenderedFrame";
import { FrameUtils } from "../../utils/FrameUtils";
import { ImageResizer } from "../../utils/ImageResizer";

export class BackgroundImageFrameRenderer {
  container: HTMLElement;
  frameContainer: HTMLElement;
  cachedFrameProcessor: CachedFrameProcessor<string>;
  zoom: number | undefined;

  constructor(container: HTMLElement, zoom?: number) {
    this.container = container;
    this.setZoom(zoom);

    const containerDocument = container.ownerDocument;
    this.frameContainer = containerDocument.createElement("div");
    this.frameContainer.classList.add("background-image-frame-container");
    container.appendChild(this.frameContainer);

    this.cachedFrameProcessor = new CachedFrameProcessor<string>();
    this.cachedFrameProcessor.setFrameProcessor(
      this.frameToDataUrl_.bind(this)
    );
  }

  frameToDataUrl_(frame: Frame | RenderedFrame): string {
    let canvas;
    if (frame instanceof RenderedFrame) {
      canvas = ImageResizer.scale(frame.getRenderedFrame(), Number(this.zoom));
    } else {
      canvas = FrameUtils.toImage(frame, this.zoom);
    }
    return canvas.toDataURL("image/png");
  }

  render(frame: Frame | RenderedFrame): void {
    const imageSrc = this.cachedFrameProcessor.get(frame, this.zoom);
    this.frameContainer.style.backgroundImage = "url(" + imageSrc + ")";
  }

  show(): void {
    if (this.frameContainer) {
      this.frameContainer.style.display = "block";
    }
  }

  setZoom(zoom?: number): void {
    this.zoom = zoom;
  }

  getZoom(): number | undefined {
    return this.zoom;
  }

  setRepeated(repeat: boolean): void {
    let repeatValue;
    if (repeat) {
      repeatValue = "repeat";
    } else {
      repeatValue = "no-repeat";
    }
    this.frameContainer.style.backgroundRepeat = repeatValue;
  }
}
