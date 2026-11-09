import type { Frame } from "../../model/Frame";
import type { RenderedFrame } from "../../model/frame/RenderedFrame";
import { UserSettings } from "../../utils/UserSettings";
import { FrameRenderer } from "./FrameRenderer";

/**
 * FrameRenderer implementation that prevents unnecessary redraws.
 * @param {HtmlElement} container HtmlElement to use as parentNode of the Frame
 * @param {Object} renderingOptions
 * @param {Array} classList array of strings to use for css classes
 */
export class CachedFrameRenderer extends FrameRenderer {
  serializedFrame: string;

  constructor(
    container: HTMLElement,
    renderingOptions: {
      zoom: number;
      supportGridRendering: boolean;
      height: number;
      width: number;
      xOffset: number;
      yOffset: number;
    },
    classList: string[]
  ) {
    super(container, renderingOptions, classList);
    this.serializedFrame = "";
  }

  /**
   * Only call display size if provided values are different from current values.
   * FrameRenderer:setDisplaySize destroys the underlying canvas
   * If the canvas is destroyed, a rendering is mandatory.
   * (Alternatively we could find a way to force the rendering of the CachedFrameRenderer from the outside)
   * @param {Number} width
   * @param {Number} height
   */
  setDisplaySize(width: number, height: number): void {
    if (this.displayWidth !== width || this.displayHeight !== height) {
      super.setDisplaySize(width, height);
    }
  }

  render(frame: Frame | RenderedFrame): void {
    const offset = this.getOffset();
    const size = this.getDisplaySize();
    const serializedFrame = [
      this.getZoom(),
      this.getGridWidth(),
      this.getGridSpacing(),
      this.getGridColor(),
      UserSettings.get("SEAMLESS_MODE"),
      UserSettings.get("SEAMLESS_OPACITY"),
      offset.x,
      offset.y,
      size.width,
      size.height,
      frame.getHash()
    ].join("-");

    if (this.serializedFrame != serializedFrame) {
      this.serializedFrame = serializedFrame;
      super.render(frame);
    }
  }
}
