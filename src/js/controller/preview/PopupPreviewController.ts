import type { Frame } from "@/model/Frame";
import type { RenderedFrame } from "@/model/frame/RenderedFrame";
import { BackgroundImageFrameRenderer } from "@/rendering/frame/BackgroundImageFrameRenderer";
import { Dom } from "@/utils/Dom";
import { EventUtils } from "@/utils/Event";
import { Template } from "@/utils/Template";
import { assertInitialized } from "@/utils/core";
import type { PublicPiskelController } from "@/controller/piskel/PublicPiskelController";

const POPUP_TITLE = "Piskel - preview";

export class PopupPreviewController {
  piskelController: PublicPiskelController;
  popup: Window | null | null;
  renderer: BackgroundImageFrameRenderer | null;
  renderFlag: boolean;

  constructor(piskelController: PublicPiskelController) {
    this.piskelController = piskelController;
    this.popup = null;
    this.renderer = null;
    this.renderFlag = false;
  }

  init(): void {
    EventUtils.addEventListener(
      window,
      "pagehide",
      this.onMainWindowUnload_,
      this
    );
  }

  isOpen(): boolean {
    return !!this.popup;
  }

  open(): void {
    if (!this.isOpen()) {
      this.popup = window.open("about:blank", "", "width=320,height=320");
      window.setTimeout(this.onPopupLoaded.bind(this), 500);
    } else {
      assertInitialized(this.popup, "popup").focus();
    }
  }

  onPopupLoaded(): void {
    assertInitialized(this.popup, "popup").document.title = POPUP_TITLE;
    assertInitialized(this.popup, "popup").document.body.innerHTML =
      Template.get("popup-preview-partial");
    EventUtils.addEventListener(
      assertInitialized(this.popup, "popup"),
      "resize",
      this.onWindowResize_,
      this
    );
    EventUtils.addEventListener(
      assertInitialized(this.popup, "popup"),
      "pagehide",
      this.onPopupClosed_,
      this
    );
    const container = Dom.getElement<HTMLElement>(
      ".preview-container",
      assertInitialized(this.popup, "popup").document
    );
    this.renderer = new BackgroundImageFrameRenderer(container);
    this.updateZoom_();
    this.renderFlag = true;
  }

  render(frame: Frame | RenderedFrame): void {
    if (this.isOpen() && this.renderer) {
      this.renderer.render(frame);
      this.renderFlag = false;
    }
  }

  onWindowResize_(): void {
    this.updateZoom_();
    this.renderFlag = true;
  }

  updateZoom_(): void {
    const documentElement = assertInitialized(this.popup, "popup").document
      .documentElement;
    const wZoom =
      documentElement.clientWidth / this.piskelController.getWidth();
    const hZoom =
      documentElement.clientHeight / this.piskelController.getHeight();
    const zoom = Math.min(wZoom, hZoom);

    assertInitialized(this.renderer, "renderer").setZoom(zoom);

    const height = this.piskelController.getHeight() * zoom;
    const width = this.piskelController.getWidth() * zoom;

    const container = Dom.getElement<HTMLElement>(
      ".preview-container",
      assertInitialized(this.popup, "popup").document
    );
    container.style.height = height + "px";
    container.style.width = width + "px";

    const horizontalMargin = (documentElement.clientHeight - height) / 2;
    container.style.marginTop = horizontalMargin + "px";
    container.style.marginBottom = horizontalMargin + "px";

    const verticalMargin = (documentElement.clientWidth - width) / 2;
    container.style.marginLeft = verticalMargin + "px";
    container.style.marginRight = verticalMargin + "px";
  }

  onPopupClosed_(): void {
    this.popup = null;
  }

  onMainWindowUnload_(): void {
    if (this.isOpen()) {
      assertInitialized(this.popup, "popup").close();
      // The page might be restored from the bfcache, reset the state here
      // rather than relying on the popup's pagehide listener.
      this.popup = null;
      this.renderer = null;
    }
  }
}
