import { Constants } from "../../Constants";
import { Events, type UserSettingValue } from "../../Events";
import type { JQueryEvent } from "../../lib/jquery-1.8.0";
import { BackgroundImageFrameRenderer } from "../../rendering/frame/BackgroundImageFrameRenderer";
import { Dom } from "../../utils/Dom";
import { LayerUtils } from "../../utils/LayerUtils";
import { UserSettings } from "../../utils/UserSettings";
import { assertDefined } from "../../utils/core";
import type { PublicPiskelController } from "../piskel/PublicPiskelController";
import { PopupPreviewController } from "./PopupPreviewController";
import { PreviewActionsController } from "./PreviewActionsController";

// Preview is a square of PREVIEW_SIZE x PREVIEW_SIZE
const PREVIEW_SIZE = 200;

const RENDER_MINIMUM_DELAY = 300;

export class PreviewController {
  piskelController: PublicPiskelController;
  container: HTMLElement;
  elapsedTime: number;
  currentIndex: number;
  lastRenderTime: number;
  renderFlag: boolean;
  renderer: BackgroundImageFrameRenderer;
  popupPreviewController: PopupPreviewController;
  previewActionsController: PreviewActionsController;

  constructor(
    piskelController: PublicPiskelController,
    container: HTMLElement
  ) {
    this.piskelController = piskelController;
    this.container = container;

    this.elapsedTime = 0;
    this.currentIndex = 0;
    this.lastRenderTime = 0;
    this.renderFlag = true;

    this.renderer = new BackgroundImageFrameRenderer(this.container);
    this.popupPreviewController = new PopupPreviewController(piskelController);
    this.previewActionsController = new PreviewActionsController(
      this,
      container
    );
  }

  init(): void {
    const width =
      Constants.ANIMATED_PREVIEW_WIDTH + Constants.RIGHT_COLUMN_PADDING_LEFT;
    Dom.getElement<HTMLElement>(".right-column").style.width = width + "px";

    $.subscribe(Events.FRAME_SIZE_CHANGED, this.onFrameSizeChange_.bind(this));
    $.subscribe(
      Events.USER_SETTINGS_CHANGED,
      this.onUserSettingsChange_.bind(this)
    );
    $.subscribe(Events.PISKEL_SAVE_STATE, this.setRenderFlag_.bind(this, true));
    $.subscribe(Events.PISKEL_RESET, this.setRenderFlag_.bind(this, true));

    this.popupPreviewController.init();
    this.previewActionsController.init();

    this.updateZoom_();
    this.updateContainerDimensions_();
  }

  openPopupPreview(): void {
    this.popupPreviewController.open();
  }

  onUserSettingsChange_(
    evt: JQueryEvent,
    name: string,
    value: UserSettingValue
  ): void {
    if (name === UserSettings.SEAMLESS_MODE) {
      this.onFrameSizeChange_();
    } else {
      this.updateZoom_();
      this.updateContainerDimensions_();
    }
  }

  updateZoom_(): void {
    const previewSize = UserSettings.get(UserSettings.PREVIEW_SIZE);

    let zoom;
    if (previewSize === "original") {
      zoom = 1;
    } else if (previewSize === "best") {
      zoom = Math.floor(this.calculateZoom_());
    } else if (previewSize === "full") {
      zoom = this.calculateZoom_();
    }

    this.renderer.setZoom(assertDefined(zoom, "zoom"));
    this.setRenderFlag_(true);
  }

  getZoom(): number {
    return this.calculateZoom_();
  }

  getCoordinates(x: number, y: number): { x: number; y: number } {
    const containerRect = this.container.getBoundingClientRect();
    x = x - containerRect.left;
    y = y - containerRect.top;
    const zoom = this.getZoom();
    return {
      x: Math.floor(x / zoom),
      y: Math.floor(y / zoom)
    };
  }

  render(delta: number): void {
    this.elapsedTime += delta;
    const index = this.getNextIndex_(delta);
    if (this.shouldRender_() || this.currentIndex != index) {
      this.currentIndex = index;
      const frame = LayerUtils.mergeFrameAt(
        this.piskelController.getLayers(),
        index
      );
      this.renderer.render(frame);
      this.renderFlag = false;
      this.lastRenderTime = Date.now();

      this.popupPreviewController.render(frame);
    }
  }

  getNextIndex_(delta: number): number {
    const fps = this.piskelController.getFPS();
    if (fps === 0) {
      return this.piskelController.getCurrentFrameIndex();
    } else {
      let index = Math.floor(this.elapsedTime / (1000 / fps));
      const frameIndexes = this.piskelController.getVisibleFrameIndexes();
      if (frameIndexes.length <= index) {
        this.elapsedTime = 0;
        index = frameIndexes.length
          ? frameIndexes[0]
          : this.piskelController.getCurrentFrameIndex();
        return index;
      }
      return frameIndexes[index];
    }
  }

  /**
   * Calculate the preview zoom depending on the framesheet size
   */
  calculateZoom_(): number {
    const frame = this.piskelController.getCurrentFrame();
    const hZoom = PREVIEW_SIZE / frame.getHeight();
    const wZoom = PREVIEW_SIZE / frame.getWidth();

    return Math.min(hZoom, wZoom);
  }

  onFrameSizeChange_(): void {
    this.updateZoom_();
    this.updateContainerDimensions_();
  }

  updateContainerDimensions_(): void {
    const isSeamless = UserSettings.get(UserSettings.SEAMLESS_MODE);
    this.renderer.setRepeated(isSeamless);

    let width;
    let height;

    if (isSeamless) {
      height = PREVIEW_SIZE;
      width = PREVIEW_SIZE;
    } else {
      const zoom = this.getZoom();
      const frame = this.piskelController.getCurrentFrame();
      height = frame.getHeight() * zoom;
      width = frame.getWidth() * zoom;
    }

    const containerEl = this.container;
    containerEl.style.height = height + "px";
    containerEl.style.width = width + "px";

    const horizontalMargin = (PREVIEW_SIZE - height) / 2;
    containerEl.style.marginTop = horizontalMargin + "px";
    containerEl.style.marginBottom = horizontalMargin + "px";

    const verticalMargin = (PREVIEW_SIZE - width) / 2;
    containerEl.style.marginLeft = verticalMargin + "px";
    containerEl.style.marginRight = verticalMargin + "px";
  }

  setRenderFlag_(bool: boolean): void {
    this.renderFlag = bool;
  }

  shouldRender_(): boolean {
    return (
      (this.renderFlag || this.popupPreviewController.renderFlag) &&
      Date.now() - this.lastRenderTime > RENDER_MINIMUM_DELAY
    );
  }
}
