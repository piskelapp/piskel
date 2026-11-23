import { Base64 } from "./Base64";

const BASE64_REGEX = /\s*;\s*base64\s*(?:;|$)/i;

type BlobCallback = (blob: Blob) => void;

export const BlobUtils = {
  dataToBlob(dataURI: string, type: string, callback: BlobCallback): void {
    const headerEnd = dataURI.indexOf(",");
    const data = dataURI.substring(headerEnd + 1);
    const isBase64 = BASE64_REGEX.test(dataURI.substring(0, headerEnd));
    const blobData = isBase64 ? Base64.decode(data) : decodeURIComponent(data);
    callback(new Blob([blobData], { type: type }));
  },

  canvasToBlob(
    canvas: HTMLCanvasElement & {
      mozGetAsFile?: (name: string, type: string) => File;
    },
    callback: BlobCallback,
    type?: string,
    quality?: number
  ): void {
    const mimeType = type || "image/png";

    if (canvas.mozGetAsFile) {
      callback(canvas.mozGetAsFile("canvas", mimeType));
    } else {
      const dataURI = canvas.toDataURL(mimeType, quality);
      BlobUtils.dataToBlob(dataURI, mimeType, callback);
    }
  },

  stringToBlob(string: string, callback: BlobCallback, type?: string): void {
    const mimeType = type || "text/plain";
    BlobUtils.dataToBlob("data:" + mimeType + "," + string, mimeType, callback);
  }
};
