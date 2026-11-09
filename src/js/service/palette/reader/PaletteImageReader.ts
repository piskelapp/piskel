import { Constants } from "../../../Constants";
import { Events } from "../../../Events";
import { Palette } from "../../../model/Palette";
import { FileUtils } from "../../../utils/FileUtils";
import { Uuid } from "../../../utils/Uuid";
import { ImageProcessor } from "../../../worker/imageprocessor/ImageProcessor";
import type { ImageProcessorResponse } from "../../../worker/imageprocessor/ImageProcessorWorker";
import { ColorSorter } from "../../color/ColorSorter";
import type {
  PaletteReadError,
  PaletteReadSuccess
} from "./AbstractPaletteFileReader";

export class PaletteImageReader {
  file: File;
  onSuccess: PaletteReadSuccess;
  onError: PaletteReadError;
  colorSorter_: ColorSorter;

  constructor(
    file: File,
    onSuccess: PaletteReadSuccess,
    onError: PaletteReadError
  ) {
    this.file = file;
    this.onSuccess = onSuccess;
    this.onError = onError;

    this.colorSorter_ = new ColorSorter();
  }

  read(): void {
    FileUtils.readImageFile(this.file, this.onImageLoaded_.bind(this));
  }

  onImageLoaded_(image: HTMLImageElement): void {
    const imageProcessor = new ImageProcessor(
      image,
      this.onWorkerSuccess_.bind(this),
      this.onWorkerStep_.bind(this),
      this.onWorkerError_.bind(this)
    );

    $.publish(Events.SHOW_PROGRESS, [{ name: "Processing image colors ..." }]);

    imageProcessor.process();
  }

  onWorkerSuccess_(event: MessageEvent<ImageProcessorResponse>): void {
    const data = event.data;
    if (data.type !== "SUCCESS") {
      return;
    }
    const colorsMap = data.colorsMap;

    const colors = Object.keys(colorsMap);

    if (colors.length > Constants.MAX_PALETTE_COLORS) {
      this.onError("Too many colors : " + colors.length);
    } else {
      const uuid = Uuid.generate();
      const sortedColors = this.colorSorter_.sort(colors);
      const palette = new Palette(
        uuid,
        this.file.name + " palette",
        sortedColors
      );

      this.onSuccess(palette);
    }
    $.publish(Events.HIDE_PROGRESS);
  }

  onWorkerStep_(event: MessageEvent<ImageProcessorResponse>): void {
    if (event.data.type !== "STEP") {
      return;
    }
    const progress = event.data.progress;
    $.publish(Events.UPDATE_PROGRESS, [{ progress: progress }]);
  }

  onWorkerError_(event: MessageEvent<ImageProcessorResponse>): void {
    $.publish(Events.HIDE_PROGRESS);
    if (event.data.type === "ERROR") {
      this.onError("Unable to process the image : " + event.data.message);
    }
  }
}
