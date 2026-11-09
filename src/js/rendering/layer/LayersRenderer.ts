import { Events, type UserSettingValue } from "../../Events";
import type { PublicPiskelController } from "../../controller/piskel/PublicPiskelController";
import type { JQueryEvent } from "../../lib/jquery-1.8.0";
import { LayerUtils } from "../../utils/LayerUtils";
import { UserSettings } from "../../utils/UserSettings";
import { CompositeRenderer } from "../CompositeRenderer";
import { FrameRenderer } from "../frame/FrameRenderer";

export class LayersRenderer extends CompositeRenderer {
  piskelController: PublicPiskelController;
  belowRenderer: FrameRenderer;
  aboveRenderer: FrameRenderer;
  serializedRendering: string;
  stylesheet_: HTMLElement;

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
    piskelController: PublicPiskelController
  ) {
    super();

    this.piskelController = piskelController;

    // Do not use CachedFrameRenderers here, since the caching will be performed in the render method of LayersRenderer
    this.belowRenderer = new FrameRenderer(container, renderingOptions, [
      "layers-canvas",
      "layers-below-canvas"
    ]);

    this.aboveRenderer = new FrameRenderer(container, renderingOptions, [
      "layers-canvas",
      "layers-above-canvas"
    ]);

    this.add(this.belowRenderer);
    this.add(this.aboveRenderer);

    this.serializedRendering = "";

    this.stylesheet_ = document.createElement("style");
    document.head.appendChild(this.stylesheet_);
    this.updateLayersCanvasOpacity_(
      UserSettings.get(UserSettings.LAYER_OPACITY)
    );

    $.subscribe(Events.PISKEL_RESET, this.flush.bind(this));
    $.subscribe(
      Events.USER_SETTINGS_CHANGED,
      this.onUserSettingsChange_.bind(this)
    );
  }

  render(): void {
    const offset = this.getOffset();
    const size = this.getDisplaySize();
    const layers = this.piskelController.getLayers();
    const frameIndex = this.piskelController.getCurrentFrameIndex();
    const layerIndex = this.piskelController.getCurrentLayerIndex();

    const belowLayers = layers.slice(0, layerIndex);
    const aboveLayers = layers.slice(layerIndex + 1, layers.length);

    const serializedRendering = [
      this.getZoom(),
      this.getGridWidth(),
      offset.x,
      offset.y,
      size.width,
      size.height,
      LayerUtils.getFrameHashAt(belowLayers, frameIndex),
      LayerUtils.getFrameHashAt(aboveLayers, frameIndex),
      layers.length
    ].join("-");

    if (this.serializedRendering != serializedRendering) {
      this.serializedRendering = serializedRendering;

      this.clear();

      if (belowLayers.length > 0) {
        const belowFrame = LayerUtils.mergeFrameAt(belowLayers, frameIndex);
        this.belowRenderer.render(belowFrame);
      }

      if (aboveLayers.length > 0) {
        const aboveFrame = LayerUtils.mergeFrameAt(aboveLayers, frameIndex);
        this.aboveRenderer.render(aboveFrame);
      }
    }
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

  onUserSettingsChange_(
    evt: JQueryEvent,
    settingsName: string,
    settingsValue: UserSettingValue
  ): void {
    if (
      settingsName == UserSettings.LAYER_OPACITY &&
      typeof settingsValue === "number"
    ) {
      this.updateLayersCanvasOpacity_(settingsValue);
    }
  }

  updateLayersCanvasOpacity_(opacity: number): void {
    this.stylesheet_.innerHTML = ".layers-canvas { opacity : " + opacity + "}";
  }

  flush(): void {
    this.serializedRendering = "";
  }
}
