import { BlobUtils } from "../../../utils/BlobUtils";
import { Dom } from "../../../utils/Dom";
import { FileUtils } from "../../../utils/FileUtils";
import { assertDefined } from "../../../utils/core";
import type { PublicPiskelController } from "../../piskel/PublicPiskelController";
import { AbstractSettingController } from "../AbstractSettingController";

export class MiscExportController extends AbstractSettingController {
  piskelController: PublicPiskelController;

  constructor(piskelController: PublicPiskelController) {
    super();
    this.piskelController = piskelController;
  }

  init(): void {
    const cDownloadButton = Dom.getElement<HTMLElement>(".c-download-button");
    this.addEventListener(cDownloadButton, "click", this.onDownloadCFileClick_);
  }

  onDownloadCFileClick_(evt: Event): void {
    const fileName = this.getPiskelName_() + ".c";
    const cName = this.getPiskelName_().replace(" ", "_");
    const width = this.piskelController.getWidth();
    const height = this.piskelController.getHeight();
    const frameCount = this.piskelController.getFrameCount();

    // Useful defines for C routines
    let frameStr = "#include <stdint.h>\n\n";
    frameStr +=
      "#define " +
      cName.toUpperCase() +
      "_FRAME_COUNT " +
      this.piskelController.getFrameCount() +
      "\n";
    frameStr +=
      "#define " + cName.toUpperCase() + "_FRAME_WIDTH " + width + "\n";
    frameStr +=
      "#define " + cName.toUpperCase() + "_FRAME_HEIGHT " + height + "\n\n";

    frameStr += '/* Piskel data for \"' + this.getPiskelName_() + '\" */\n\n';

    frameStr += "static const uint32_t " + cName.toLowerCase();
    frameStr += "_data[" + frameCount + "][" + width * height + "] = {\n";

    for (let i = 0; i < frameCount; i++) {
      const render = this.piskelController.renderFrameAt(i, true);
      const context = assertDefined(render.getContext("2d"), "context");
      const imgd = context.getImageData(0, 0, width, height);
      const pix = imgd.data;

      frameStr += "{\n";
      for (let j = 0; j < pix.length; j += 4) {
        frameStr += this.rgbToCHex(pix[j], pix[j + 1], pix[j + 2], pix[j + 3]);
        if (j != pix.length - 4) {
          frameStr += ", ";
        }
        if ((j + 4) % (width * 4) === 0) {
          frameStr += "\n";
        }
      }
      if (i != frameCount - 1) {
        frameStr += "},\n";
      } else {
        frameStr += "}\n";
      }
    }

    frameStr += "};\n";
    BlobUtils.stringToBlob(
      frameStr,
      (blob: Blob) => {
        FileUtils.downloadAsFile(blob, fileName);
      },
      "application/text"
    );
  }

  getPiskelName_(): string {
    return this.piskelController.getPiskel().getDescriptor().name;
  }

  rgbToCHex(r: number, g: number, b: number, a: number): string {
    let hexStr = "0x";
    hexStr += ("00" + a.toString(16)).substr(-2);
    hexStr += ("00" + b.toString(16)).substr(-2);
    hexStr += ("00" + g.toString(16)).substr(-2);
    hexStr += ("00" + r.toString(16)).substr(-2);
    return hexStr;
  }
}
