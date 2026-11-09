import { assertDefined } from "../../../utils/core";
import {
  AbstractPaletteFileReader,
  type PaletteReadError,
  type PaletteReadSuccess
} from "./AbstractPaletteFileReader";

const RE_COLOR_LINE = /^[A-F0-9]{2}([A-F0-9]{2})([A-F0-9]{2})([A-F0-9]{2})/;

export class PaletteTxtReader extends AbstractPaletteFileReader {
  constructor(
    file: File,
    onSuccess: PaletteReadSuccess,
    onError: PaletteReadError
  ) {
    super(file, onSuccess, onError, RE_COLOR_LINE);
  }

  extractColorFromLine(line: string): string {
    const matches = assertDefined(line.match(RE_COLOR_LINE), "matches");
    const color = "#" + matches[1] + matches[2] + matches[3];
    return color.toLowerCase();
  }
}
