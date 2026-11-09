import { Events } from "../../../Events";
import { PiskelRenderer } from "../../../rendering/PiskelRenderer";
import { BlobUtils } from "../../../utils/BlobUtils";
import { CanvasUtils } from "../../../utils/CanvasUtils";
import { Dom } from "../../../utils/Dom";
import { FileUtils } from "../../../utils/FileUtils";
import { ImageResizer } from "../../../utils/ImageResizer";
import { MathUtils } from "../../../utils/Math";
import { Template } from "../../../utils/Template";
import { assertDefined } from "../../../utils/core";
import type { PublicPiskelController } from "../../piskel/PublicPiskelController";
import { AbstractSettingController } from "../AbstractSettingController";
import type { ExportController } from "./ExportController";

const dimensionInfoPattern =
  "{{width}} x {{height}} px, {{frames}}<br/>{{columns}}, {{rows}}.";

const replace = Template.replace;

// Helper to return "X items" or "1 item" if X is 1.
const pluralize = function (word: string, count: number) {
  if (count === 1) {
    return "1 " + word;
  }
  return count + " " + word + "s";
};

export class PngExportController extends AbstractSettingController {
  piskelController: PublicPiskelController;
  exportController: ExportController;
  layoutContainer: HTMLElement | undefined;
  dimensionInfo: HTMLElement | undefined;
  rowsInput: HTMLInputElement | undefined;
  columnsInput: HTMLInputElement | undefined;
  pixiInlineImageCheckbox: HTMLInputElement | null | undefined;

  constructor(
    piskelController: PublicPiskelController,
    exportController: ExportController
  ) {
    super();
    this.piskelController = piskelController;
    this.exportController = exportController;
    this.onScaleChanged_ = this.onScaleChanged_.bind(this);
  }

  init(): void {
    this.layoutContainer = Dom.getElement<HTMLElement>(
      ".png-export-layout-section"
    );
    this.dimensionInfo = Dom.getElement<HTMLElement>(
      ".png-export-dimension-info"
    );

    this.rowsInput = Dom.getElement<HTMLInputElement>("#png-export-rows");
    this.columnsInput = Dom.getElement<HTMLInputElement>("#png-export-columns");

    const downloadButton = Dom.getElement<HTMLElement>(".png-download-button");
    const downloadPixiButton = Dom.getElement<HTMLElement>(
      ".png-pixi-download-button"
    );
    const dataUriButton = Dom.getElement<HTMLElement>(".datauri-open-button");
    const selectedFrameDownloadButton = Dom.getElement<HTMLSelectElement>(
      ".selected-frame-download-button"
    );

    this.pixiInlineImageCheckbox = document.querySelector<HTMLInputElement>(
      ".png-pixi-inline-image-checkbox"
    );

    this.initLayoutSection_();
    this.updateDimensionLabel_();

    this.addEventListener(this.columnsInput, "input", this.onColumnsInput_);
    this.addEventListener(downloadButton, "click", this.onDownloadClick_);
    this.addEventListener(
      downloadPixiButton,
      "click",
      this.onPixiDownloadClick_
    );
    this.addEventListener(dataUriButton, "click", this.onDataUriClick_);
    this.addEventListener(
      selectedFrameDownloadButton,
      "click",
      this.onDownloadSelectedFrameClick_
    );
    $.subscribe(Events.EXPORT_SCALE_CHANGED, this.onScaleChanged_);
  }

  destroy(): void {
    $.unsubscribe(Events.EXPORT_SCALE_CHANGED, this.onScaleChanged_);
    super.destroy();
  }

  /**
   * Initalize all controls related to the spritesheet layout.
   */
  initLayoutSection_(): void {
    const frames = this.piskelController.getFrameCount();
    if (frames === 1) {
      // Hide the layout section if only one frame is defined.
      assertDefined(this.layoutContainer, "layoutContainer").style.display =
        "none";
    } else {
      assertDefined(this.columnsInput, "columnsInput").setAttribute(
        "max",
        String(frames)
      );
      assertDefined(this.columnsInput, "columnsInput").value = String(
        this.getBestFit_()
      );
      this.onColumnsInput_();
    }
  }

  updateDimensionLabel_(): void {
    const zoom = this.exportController.getExportZoom();
    const frames = this.piskelController.getFrameCount();
    let width = this.piskelController.getWidth() * zoom;
    let height = this.piskelController.getHeight() * zoom;

    const columns = this.getColumns_();
    const rows = this.getRows_();
    width = columns * width;
    height = rows * height;

    assertDefined(this.dimensionInfo, "dimensionInfo").innerHTML = replace(
      dimensionInfoPattern,
      {
        width: width,
        height: height,
        rows: pluralize("row", rows),
        columns: pluralize("column", columns),
        frames: pluralize("frame", frames)
      }
    );
  }

  getColumns_(): number {
    return parseInt(
      assertDefined(this.columnsInput, "columnsInput").value || "1",
      10
    );
  }

  getRows_(): number {
    return parseInt(
      assertDefined(this.rowsInput, "rowsInput").value || "1",
      10
    );
  }

  getBestFit_(): number {
    const ratio =
      this.piskelController.getWidth() / this.piskelController.getHeight();
    const frameCount = this.piskelController.getFrameCount();
    const bestFit = Math.round(Math.sqrt(frameCount / ratio));

    return MathUtils.minmax(bestFit, 1, frameCount);
  }

  onScaleChanged_(): void {
    this.updateDimensionLabel_();
  }

  /**
   * Synchronise column and row inputs, called everytime a user input updates one of the
   * two inputs by the SynchronizedInputs widget.
   */
  onColumnsInput_(): void {
    const value = assertDefined(this.columnsInput, "columnsInput").value;
    if (value === "") {
      // Skip the synchronization if the input is empty.
      return;
    }

    let columns = parseInt(value, 10);
    if (isNaN(columns)) {
      columns = 1;
    }

    // Force the value to be in bounds, if the user tried to update it by directly typing
    // a value.
    columns = MathUtils.minmax(
      columns,
      1,
      this.piskelController.getFrameCount()
    );
    assertDefined(this.columnsInput, "columnsInput").value = String(columns);

    // Update readonly rowsInput
    assertDefined(this.rowsInput, "rowsInput").value = String(
      Math.ceil(this.piskelController.getFrameCount() / columns)
    );
    this.updateDimensionLabel_();
  }

  createPngSpritesheet_(): HTMLCanvasElement {
    const renderer = new PiskelRenderer(this.piskelController);
    let outputCanvas = renderer.renderAsCanvas(this.getColumns_());
    const width = outputCanvas.width;
    const height = outputCanvas.height;

    const zoom = this.exportController.getExportZoom();
    if (zoom != 1) {
      outputCanvas = ImageResizer.resize(
        outputCanvas,
        width * zoom,
        height * zoom,
        false
      );
    }

    return outputCanvas;
  }

  onDownloadClick_(evt: Event): void {
    // Create PNG export.
    const canvas = this.createPngSpritesheet_();
    this.downloadCanvas_(canvas);
  }

  // Used and overridden in casper integration tests.
  downloadCanvas_(canvas: HTMLCanvasElement, name?: string): void {
    // Generate file name
    name = name || this.piskelController.getPiskel().getDescriptor().name;
    const fileName = name + ".png";

    // Transform to blob and start download.
    BlobUtils.canvasToBlob(canvas, function (blob: Blob) {
      FileUtils.downloadAsFile(blob, fileName);
    });
  }

  onPixiDownloadClick_(): void {
    const zip = new window.JSZip();

    // Create PNG export.
    const canvas = this.createPngSpritesheet_();
    const name = this.piskelController.getPiskel().getDescriptor().name;

    let image;

    if (
      assertDefined(this.pixiInlineImageCheckbox, "pixiInlineImageCheckbox")
        .checked
    ) {
      image = canvas.toDataURL("image/png");
    } else {
      image = name + ".png";

      zip.file(image, CanvasUtils.getBase64FromCanvas(canvas) + "\n", {
        base64: true
      });
    }

    const width = canvas.width / this.getColumns_();
    const height = canvas.height / this.getRows_();

    const numFrames = this.piskelController.getFrameCount();
    const frames: Record<
      string,
      {
        frame: { x: number; y: number; w: number; h: number };
        rotated: boolean;
        trimmed: boolean;
        spriteSourceSize: { x: number; y: number; w: number; h: number };
        sourceSize: { w: number; h: number };
      }
    > = {};
    for (let i = 0; i < numFrames; i++) {
      const column = i % this.getColumns_();
      const row = (i - column) / this.getColumns_();
      const frame = {
        frame: { x: width * column, y: height * row, w: width, h: height },
        rotated: false,
        trimmed: false,
        spriteSourceSize: { x: 0, y: 0, w: width, h: height },
        sourceSize: { w: width, h: height }
      };
      frames[name + i + ".png"] = frame;
    }

    const json = {
      frames: frames,
      meta: {
        app: "https://github.com/piskelapp/piskel/",
        version: "1.0",
        image: image,
        format: "RGBA8888",
        size: { w: canvas.width, h: canvas.height }
      }
    };
    zip.file(name + ".json", JSON.stringify(json));

    const blob = zip.generate({
      type: "blob"
    });

    FileUtils.downloadAsFile(blob, name + ".zip");
  }

  onDataUriClick_(evt: Event): void {
    const popup = window.open("about:blank");
    const dataUri = this.createPngSpritesheet_().toDataURL("image/png");
    window.setTimeout(() => {
      const html = Template.getAndReplace("data-uri-export-partial", {
        src: dataUri
      });
      const target = assertDefined(popup, "popup");
      target.document.title = dataUri;
      target.document.body.innerHTML = html;
    }, 500);
  }

  onDownloadSelectedFrameClick_(evt: Event): void {
    const frameIndex = this.piskelController.getCurrentFrameIndex();
    const name = this.piskelController.getPiskel().getDescriptor().name;
    let canvas = this.piskelController.renderFrameAt(frameIndex, true);
    const zoom = this.exportController.getExportZoom();
    if (zoom != 1) {
      canvas = ImageResizer.resize(
        canvas,
        canvas.width * zoom,
        canvas.height * zoom,
        false
      );
    }

    const fileName = name + "-" + (frameIndex + 1) + ".png";
    this.downloadCanvas_(canvas, fileName);
  }
}
