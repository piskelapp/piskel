import { Palette } from "@/model/Palette";
import { Base64 } from "@/utils/Base64";
import { FileUtils } from "@/utils/FileUtils";
import { Uuid } from "@/utils/Uuid";

export type PaletteReadSuccess = (palette: Palette) => void;
export type PaletteReadError = (message?: string) => void;

export abstract class AbstractPaletteFileReader {
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

  abstract extractColorFromLine(line: string): string;

  read(): void {
    FileUtils.readFile(this.file, this.onFileLoaded_.bind(this));
  }

  onFileLoaded_(content: string): void {
    const text = Base64.toText(content);
    const lines = text.match(/[^\r\n]+/g);
    if (lines === null) {
      // Listed in docs/known-issues.md: no message is shown to the user.
      throw new Error("The palette file is empty: " + this.file.name);
    }

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
