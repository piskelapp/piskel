import { Events } from "../../../Events";
import { app } from "../../../app";
import { BlobUtils } from "../../../utils/BlobUtils";
import { CanvasUtils } from "../../../utils/CanvasUtils";
import { ColorUtils } from "../../../utils/ColorUtils";
import { Dom } from "../../../utils/Dom";
import { FileUtils } from "../../../utils/FileUtils";
import { ImageResizer } from "../../../utils/ImageResizer";
import { UserSettings } from "../../../utils/UserSettings";
import { assertDefined } from "../../../utils/core";
import type { PublicPiskelController } from "../../piskel/PublicPiskelController";
import { AbstractSettingController } from "../AbstractSettingController";
import type { ExportController } from "./ExportController";

const MAX_GIF_COLORS = 256;

const MAGIC_PINK = "#FF00FF";

const WHITE = "#FFFFFF";

export class GifExportController extends AbstractSettingController {
  piskelController: PublicPiskelController;
  exportController: ExportController;
  uploadStatusContainerEl: HTMLElement | null | undefined;
  downloadButton: HTMLElement | undefined;
  repeatCheckbox: HTMLInputElement | undefined;
  previewContainerEl: HTMLElement | undefined;

  constructor(
    piskelController: PublicPiskelController,
    exportController: ExportController
  ) {
    super();
    this.piskelController = piskelController;
    this.exportController = exportController;
  }

  init(): void {
    this.uploadStatusContainerEl =
      document.querySelector<HTMLElement>(".gif-upload-status");
    this.downloadButton = Dom.getElement<HTMLElement>(".gif-download-button");
    this.repeatCheckbox = Dom.getElement<HTMLInputElement>(
      ".gif-repeat-checkbox"
    );

    // Initialize repeatCheckbox state
    this.repeatCheckbox.checked = this.getRepeatSetting_();

    this.addEventListener(
      this.downloadButton,
      "click",
      this.onDownloadButtonClick_
    );
    this.addEventListener(
      this.repeatCheckbox,
      "change",
      this.onRepeatCheckboxChange_
    );

    const currentColors = assertDefined(
      app.currentColorsService,
      "currentColorsService"
    ).getCurrentColors();
    const tooManyColors = currentColors.length >= MAX_GIF_COLORS;
    Dom.getElement<HTMLElement>(".gif-export-warning").classList.toggle(
      "visible",
      tooManyColors
    );
  }

  getZoom_(): number {
    return this.exportController.getExportZoom();
  }

  onDownloadButtonClick_(evt: Event): void {
    const zoom = this.getZoom_();
    const fps = this.piskelController.getFPS();

    this.renderAsImageDataAnimatedGIF(
      zoom,
      fps,
      this.downloadImageData_.bind(this)
    );
  }

  downloadImageData_(imageData: string): void {
    const fileName =
      this.piskelController.getPiskel().getDescriptor().name + ".gif";
    BlobUtils.dataToBlob(imageData, "image/gif", function (blob: Blob) {
      FileUtils.downloadAsFile(blob, fileName);
    });
  }

  updatePreview_(src: string): void {
    assertDefined(this.previewContainerEl, "previewContainerEl").innerHTML =
      '<div><img style="max-width:32px;" src="' + src + '"/></div>';
  }

  renderAsImageDataAnimatedGIF(
    zoom: number,
    fps: number,
    cb: (imageData: string) => void
  ): void {
    const currentColors = assertDefined(
      app.currentColorsService,
      "currentColorsService"
    ).getCurrentColors();

    const layers = this.piskelController.getLayers();
    const isTransparent = layers.some(function (l) {
      return l.isTransparent();
    });
    const preserveColors =
      !isTransparent && currentColors.length < MAX_GIF_COLORS;

    let transparentColor;
    let transparent;
    // transparency only supported if preserveColors is true, see Issue #357
    if (preserveColors) {
      transparentColor = this.getTransparentColor(currentColors);
      transparent = parseInt(transparentColor.substring(1), 16);
    } else {
      transparentColor = WHITE;
      transparent = null;
    }

    const width = this.piskelController.getWidth();
    const height = this.piskelController.getHeight();

    const gif = new window.GIF({
      workers: 5,
      quality: 1,
      width: width * zoom,
      height: height * zoom,
      preserveColors: preserveColors,
      repeat: this.getRepeatSetting_() ? 0 : -1,
      transparent: transparent
    });

    // Create a background canvas that will be filled with the transparent color before each render.
    const background = CanvasUtils.createCanvas(width, height);
    const context = assertDefined(background.getContext("2d"), "context");
    context.fillStyle = transparentColor;

    for (let i = 0; i < this.piskelController.getFrameCount(); i++) {
      const render = this.piskelController.renderFrameAt(i, true);
      context.clearRect(0, 0, width, height);
      context.fillRect(0, 0, width, height);
      context.drawImage(render, 0, 0, width, height);

      const canvas = ImageResizer.scale(background, zoom);
      gif.addFrame(assertDefined(canvas.getContext("2d"), "context"), {
        delay: 1000 / fps
      });
    }

    $.publish(Events.SHOW_PROGRESS, [{ name: "Building animated GIF ..." }]);
    gif.on("progress", (percentage: number) => {
      $.publish(Events.UPDATE_PROGRESS, [
        { progress: (percentage * 100).toFixed(1) }
      ]);
    });

    gif.on("finished", (blob: Blob) => {
      $.publish(Events.HIDE_PROGRESS);
      FileUtils.readFile(blob, cb);
    });

    gif.render();
  }

  getTransparentColor(currentColors: string[]): string {
    let transparentColor = ColorUtils.getUnusedColor(currentColors);

    if (!transparentColor) {
      console.error(
        "Unable to find unused color to use as transparent color in the current sprite"
      );
      transparentColor = MAGIC_PINK;
    }

    return transparentColor;
  }

  onRepeatCheckboxChange_(): void {
    const checked = assertDefined(
      this.repeatCheckbox,
      "repeatCheckbox"
    ).checked;
    UserSettings.set(UserSettings.EXPORT_GIF_REPEAT, checked);
  }

  getRepeatSetting_(): boolean {
    return UserSettings.get(UserSettings.EXPORT_GIF_REPEAT);
  }
}
