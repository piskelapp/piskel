import ImageProcessorWorker from "./ImageProcessorWorker?worker&inline";
import { CanvasUtils } from "../../utils/CanvasUtils";
import type {
  ImageProcessorRequest,
  ImageProcessorResponse
} from "./ImageProcessorWorker";

type ImageProcessorCallback = (
  event: MessageEvent<ImageProcessorResponse>
) => void;

export class ImageProcessor {
  image: HTMLImageElement;
  onStep: ImageProcessorCallback;
  onSuccess: ImageProcessorCallback;
  onError: ImageProcessorCallback;
  worker: Worker;

  constructor(
    image: HTMLImageElement,
    onSuccess: ImageProcessorCallback,
    onStep: ImageProcessorCallback,
    onError: ImageProcessorCallback
  ) {
    this.image = image;

    this.onStep = onStep;
    this.onSuccess = onSuccess;
    this.onError = onError;

    this.worker = new ImageProcessorWorker();
    this.worker.onmessage = this.onWorkerMessage.bind(this);
  }

  process(): void {
    const canvas = CanvasUtils.createFromImage(this.image);
    const request: ImageProcessorRequest = {
      imageData: CanvasUtils.getImageDataFromCanvas(canvas),
      width: this.image.width,
      height: this.image.height
    };
    this.worker.postMessage(request);
  }

  onWorkerMessage(event: MessageEvent<ImageProcessorResponse>): void {
    if (event.data.type === "STEP") {
      this.onStep(event);
    } else if (event.data.type === "SUCCESS") {
      this.onSuccess(event);
      this.worker.terminate();
    } else if (event.data.type === "ERROR") {
      this.onError(event);
      this.worker.terminate();
    }
  }
}
