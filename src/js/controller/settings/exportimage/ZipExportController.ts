import type { JSZipInstance } from "../../../lib/jszip/jszip.min";
import { CanvasUtils } from "../../../utils/CanvasUtils";
import { Dom } from "../../../utils/Dom";
import { FileUtils } from "../../../utils/FileUtils";
import { ImageResizer } from "../../../utils/ImageResizer";
import { LayerUtils } from "../../../utils/LayerUtils";
import { StringUtils } from "../../../utils/StringUtils";
import { assertDefined } from "../../../utils/core";
import type { PublicPiskelController } from "../../piskel/PublicPiskelController";
import { AbstractSettingController } from "../AbstractSettingController";
import type { ExportController } from "./ExportController";

export class ZipExportController extends AbstractSettingController {
  piskelController: PublicPiskelController;
  exportController: ExportController;
  pngFilePrefixInput: HTMLInputElement | undefined;
  splitByLayersCheckbox: HTMLInputElement | null | undefined;
  useLayerNamesContainer: HTMLElement | undefined;
  useLayerNamesCheckbox: HTMLInputElement | null | undefined;

  constructor(
    piskelController: PublicPiskelController,
    exportController: ExportController
  ) {
    super();
    this.piskelController = piskelController;
    this.exportController = exportController;
  }

  init(): void {
    this.pngFilePrefixInput =
      Dom.getElement<HTMLInputElement>(".zip-prefix-name");
    this.pngFilePrefixInput.value = "sprite_";

    this.splitByLayersCheckbox = document.querySelector<HTMLInputElement>(
      ".zip-split-layers-checkbox"
    );
    this.addEventListener(
      assertDefined(this.splitByLayersCheckbox, "splitByLayersCheckbox"),
      "change",
      this.onSplitLayersClick_
    );

    this.useLayerNamesContainer = Dom.getElement<HTMLElement>(
      ".use-layer-names-container"
    );
    this.useLayerNamesCheckbox = document.querySelector<HTMLInputElement>(
      ".zip-use-layer-names-checkbox"
    );
    this.toggleHideUseLayerNamesCheckbox();

    const zipButton = Dom.getElement<HTMLElement>(".zip-generate-button");
    this.addEventListener(zipButton, "click", this.onZipButtonClick_);
  }

  toggleHideUseLayerNamesCheckbox(): void {
    assertDefined(
      this.useLayerNamesContainer,
      "useLayerNamesContainer"
    ).style.display = assertDefined(
      this.splitByLayersCheckbox,
      "splitByLayersCheckbox"
    ).checked
      ? "block"
      : "none";
  }

  onSplitLayersClick_(): void {
    this.toggleHideUseLayerNamesCheckbox();
  }

  onZipButtonClick_(): void {
    const zip = new window.JSZip();

    if (
      assertDefined(this.splitByLayersCheckbox, "splitByLayersCheckbox").checked
    ) {
      this.splittedExport_(zip);
    } else {
      this.mergedExport_(zip);
    }

    const fileName = this.getPiskelName_() + ".zip";

    const blob = zip.generate({
      type: "blob"
    });

    FileUtils.downloadAsFile(blob, fileName);
  }

  mergedExport_(zip: JSZipInstance): void {
    const paddingLength = ("" + this.piskelController.getFrameCount()).length;
    const zoom = this.exportController.getExportZoom();
    for (let i = 0; i < this.piskelController.getFrameCount(); i++) {
      const render = this.piskelController.renderFrameAt(i, true);
      const canvas = ImageResizer.scale(render, zoom);
      const basename = assertDefined(
        this.pngFilePrefixInput,
        "pngFilePrefixInput"
      ).value;
      const id = StringUtils.leftPad(i, paddingLength, "0");
      const filename = basename + id + ".png";
      zip.file(filename, CanvasUtils.getBase64FromCanvas(canvas) + "\n", {
        base64: true
      });
    }
  }

  splittedExport_(zip: JSZipInstance): void {
    const layers = this.piskelController.getLayers();
    const framePaddingLength = ("" + this.piskelController.getFrameCount())
      .length;
    const layerPaddingLength = ("" + layers.length).length;
    const zoom = this.exportController.getExportZoom();
    for (let j = 0; this.piskelController.hasLayerAt(j); j++) {
      const layer = this.piskelController.getLayerAt(j);
      const layerid = StringUtils.leftPad(j, layerPaddingLength, "0");
      for (let i = 0; i < this.piskelController.getFrameCount(); i++) {
        const render = LayerUtils.renderFrameAt(layer, i, true);
        const canvas = ImageResizer.scale(render, zoom);
        const basename = assertDefined(
          this.pngFilePrefixInput,
          "pngFilePrefixInput"
        ).value;
        const frameid = StringUtils.leftPad(i + 1, framePaddingLength, "0");
        let filename = "l" + layerid + "_" + basename + frameid + ".png";
        if (
          assertDefined(this.useLayerNamesCheckbox, "useLayerNamesCheckbox")
            .checked
        ) {
          filename = layer.getName() + "_" + basename + frameid + ".png";
        }
        zip.file(filename, CanvasUtils.getBase64FromCanvas(canvas) + "\n", {
          base64: true
        });
      }
    }
  }

  getPiskelName_(): string {
    return this.piskelController.getPiskel().getDescriptor().name;
  }
}
