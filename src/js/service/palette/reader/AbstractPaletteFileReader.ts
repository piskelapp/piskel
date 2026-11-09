import { Constants } from "../../../Constants";
import { Palette } from "../../../model/Palette";
import { Base64 } from "../../../utils/Base64";
import { FileUtils } from "../../../utils/FileUtils";
import { Uuid } from "../../../utils/Uuid";
import { assertDefined } from "../../../utils/core";

export type PaletteReadSuccess = (palette: Palette) => void;
export type PaletteReadError = (message?: string) => void;

export class AbstractPaletteFileReader {
  file: File;
  onSuccess: PaletteReadSuccess;
  onError: PaletteReadError;
  colorLineRegexp: RegExp;

  constructor(
    file: File,
    onSuccess: PaletteReadSuccess,
    onError: PaletteReadError,
    colorLineRegexp: RegExp
  ) {
    this.file = file;
    this.onSuccess = onSuccess;
    this.onError = onError;
    this.colorLineRegexp = colorLineRegexp;
  }

  extractColorFromLine(line: string): string {
    return Constants.ABSTRACT_FUNCTION();
  }

  read(): void {
    FileUtils.readFile(this.file, this.onFileLoaded_.bind(this));
  }

  onFileLoaded_(content: string): void {
    const text = Base64.toText(content);
    const lines = assertDefined(text.match(/[^\r\n]+/g), "lines");

    const colorLines = lines.filter((l: string) => {
      return this.colorLineRegexp.test(l);
    });

    const colors = colorLines.map(this.extractColorFromLine.bind(this));

    if (colors.length) {
      const uuid = Uuid.generate();
      const palette = new Palette(uuid, this.file.name, colors);
      this.onSuccess(palette);
    } else {
      this.onError();
    }
  }
}
