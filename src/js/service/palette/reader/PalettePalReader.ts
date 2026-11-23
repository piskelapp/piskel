import {
  AbstractPaletteFileReader,
  type PaletteReadError,
  type PaletteReadSuccess
} from "./AbstractPaletteFileReader";

const RE_COLOR_LINE = /^(\d{1,3})\s+(\d{1,3})\s+(\d{1,3})/;

export class PalettePalReader extends AbstractPaletteFileReader {
  constructor(
    file: File,
    onSuccess: PaletteReadSuccess,
    onError: PaletteReadError
  ) {
    super(file, onSuccess, onError, RE_COLOR_LINE);
  }

  extractColorFromLine(line: string): string {
    const matches = line.match(RE_COLOR_LINE);
    if (matches === null) {
      throw new Error("Not a color line: " + line);
    }
    const rgbColor =
      "rgb(" + matches[1] + "," + matches[2] + "," + matches[3] + ")";
    const color = window.tinycolor(rgbColor);

    return color.toHexString();
  }
}
