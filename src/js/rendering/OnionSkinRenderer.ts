import type { PublicPiskelController } from "../controller/piskel/PublicPiskelController";
import type { Frame } from "../model/Frame";
import { FrameUtils } from "../utils/FrameUtils";
import { assertDefined } from "../utils/core";
import { CompositeRenderer } from "./CompositeRenderer";
import { FrameRenderer } from "./frame/FrameRenderer";

export class OnionSkinRenderer extends CompositeRenderer {
  piskelController: PublicPiskelController;
  renderer: FrameRenderer;
  hash: string;

  constructor(
    renderer: FrameRenderer,
    piskelController: PublicPiskelController
  ) {
    super();

    this.piskelController = piskelController;
    this.renderer = renderer;
    this.add(this.renderer);

    this.hash = "";
  }

  static createInContainer(
    container: HTMLElement,
    renderingOptions: {
      zoom: number;
      supportGridRendering: boolean;
      height: number;
      width: number;
      xOffset: number;
      yOffset: number;
    },
    piskelController: PublicPiskelController
  ): OnionSkinRenderer {
    // Do not use CachedFrameRenderers here, caching is performed in the render method
    const renderer = new FrameRenderer(container, renderingOptions, [
      "onion-skin-canvas"
    ]);
    return new OnionSkinRenderer(renderer, piskelController);
  }

  render(): void {
    const frames = this.getOnionFrames_();
    const hash = this.computeHash_(frames);
    if (this.hash != hash) {
      this.hash = hash;
      this.clear();
      if (frames.length > 0) {
        const mergedFrame = assertDefined(
          FrameUtils.merge(frames),
          "mergedFrame"
        );
        this.renderer.render(mergedFrame);
      }
    }
  }

  getOnionFrames_(): Frame[] {
    const frames = [];

    const currentFrameIndex = this.piskelController.getCurrentFrameIndex();
    const layer = this.piskelController.getCurrentLayer();

    const previousIndex = currentFrameIndex - 1;
    const previousFrame = layer.getFrameAt(previousIndex);
    if (previousFrame) {
      frames.push(previousFrame);
    }

    const nextIndex = currentFrameIndex + 1;
    const nextFrame = layer.getFrameAt(nextIndex);
    if (nextFrame) {
      frames.push(nextFrame);
    }

    return frames;
  }

  computeHash_(frames: Frame[]): string {
    const offset = this.getOffset();
    const size = this.getDisplaySize();
    const layers = this.piskelController.getLayers();
    return [
      this.getZoom(),
      this.getGridWidth(),
      offset.x,
      offset.y,
      size.width,
      size.height,
      frames
        .map(function (f) {
          return f.getHash();
        })
        .join("-"),
      layers.length
    ].join("-");
  }

  /**
   * See @pskl.rendering.frame.CachedFrameRenderer
   * Same issue : FrameRenderer setDisplaySize destroys the canvas
   * @param {Number} width
   * @param {Number} height
   */
  setDisplaySize(width: number, height: number): void {
    const size = this.getDisplaySize();
    if (size.width !== width || size.height !== height) {
      super.setDisplaySize(width, height);
    }
  }

  flush(): void {
    this.hash = "";
  }
}
