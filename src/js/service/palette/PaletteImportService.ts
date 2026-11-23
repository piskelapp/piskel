import type {
  PaletteReadError,
  PaletteReadSuccess
} from "./reader/AbstractPaletteFileReader";
import { PaletteGplReader } from "./reader/PaletteGplReader";
import { PaletteImageReader } from "./reader/PaletteImageReader";
import { PalettePalReader } from "./reader/PalettePalReader";
import { PaletteTxtReader } from "./reader/PaletteTxtReader";

type PaletteReader = { read(): void };
type PaletteReaderClass = new (
  file: File,
  onSuccess: PaletteReadSuccess,
  onError: PaletteReadError
) => PaletteReader;

const fileReaders: Record<string, PaletteReaderClass | undefined> & {
  img: PaletteReaderClass;
} = {
  gpl: PaletteGplReader,
  pal: PalettePalReader,
  txt: PaletteTxtReader,
  img: PaletteImageReader
};

export class PaletteImportService {
  init(): void {}

  read(
    file: File,
    onSuccess: PaletteReadSuccess,
    onError?: PaletteReadError
  ): void {
    const reader = this.getReader_(file, onSuccess, onError);
    if (reader) {
      reader.read();
    } else {
      console.error("Could not find reader for file : %s", file.name);
    }
  }

  isImage_(file: File): boolean {
    return file.type.indexOf("image") === 0;
  }

  getReader_(
    file: File,
    onSuccess: PaletteReadSuccess,
    onError?: PaletteReadError
  ): PaletteReader | null {
    const ReaderClass = this.getReaderClass_(file);
    if (ReaderClass) {
      return new ReaderClass(file, onSuccess, onError || function () {});
    } else {
      return null;
    }
  }

  getReaderClass_(file: File): PaletteReaderClass | undefined {
    let ReaderClass: PaletteReaderClass | undefined;
    if (this.isImage_(file)) {
      ReaderClass = fileReaders.img;
    } else {
      const extension = this.getExtension_(file);
      ReaderClass = fileReaders[extension];
    }
    return ReaderClass;
  }

  getExtension_(file: File): string {
    const parts = file.name.split(".");
    const extension = parts[parts.length - 1];
    return extension.toLowerCase();
  }
}
