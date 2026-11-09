import { assertDefined } from "../../../utils/core";
import {
  AbstractPaletteFileReader,
  type PaletteReadError,
  type PaletteReadSuccess
} from "./AbstractPaletteFileReader";

const RE_COLOR_LINE = /^(\s*\d{1,3})(\s*\d{1,3})(\s*\d{1,3})/;

export class PaletteGplReader extends AbstractPaletteFileReader {
  constructor(
    file: File,
    onSuccess: PaletteReadSuccess,
    onError: PaletteReadError
  ) {
    super(file, onSuccess, onError, RE_COLOR_LINE);
  }

  extractColorFromLine(line: string): string {
    const matches = assertDefined(line.match(RE_COLOR_LINE), "matches");
    const color = window.tinycolor({
      r: parseInt(matches[1], 10),
      g: parseInt(matches[2], 10),
      b: parseInt(matches[3], 10)
    });

    return color.toHexString();
  }
}
