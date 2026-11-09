import FrameColorsWorker from "./FrameColorsWorker?worker&inline";
import { Constants } from "../../Constants";
import type { Frame } from "../../model/Frame";
import { colorToInt } from "../../utils/core";
import type {
  FrameColorsRequest,
  FrameColorsResponse
} from "./FrameColorsWorker";

type FrameColorsCallback = (event: MessageEvent<FrameColorsResponse>) => void;

// The worker defaults assume this value.
if (Constants.TRANSPARENT_COLOR !== "rgba(0, 0, 0, 0)") {
  throw "Constants.TRANSPARENT_COLOR, please update FrameColorsWorker";
}

export class FrameColors {
  pixels: Uint32Array;
  onStep: FrameColorsCallback;
  onSuccess: FrameColorsCallback;
  onError: FrameColorsCallback;
  worker: Worker;

  constructor(
    frame: Frame,
    onSuccess: FrameColorsCallback,
    onStep: FrameColorsCallback,
    onError: FrameColorsCallback
  ) {
    this.pixels = frame.pixels;

    this.onStep = onStep;
    this.onSuccess = onSuccess;
    this.onError = onError;

    this.worker = new FrameColorsWorker();
    this.worker.onmessage = this.onWorkerMessage.bind(this);
  }

  process(): void {
    const request: FrameColorsRequest = [
      colorToInt(Constants.TRANSPARENT_COLOR),
      Constants.MAX_WORKER_COLORS,
      this.pixels
    ];
    this.worker.postMessage(request);
  }

  onWorkerMessage(event: MessageEvent<FrameColorsResponse>): void {
    if (event.data.type === "SUCCESS") {
      this.onSuccess(event);
      this.worker.terminate();
    } else if (event.data.type === "ERROR") {
      this.onError(event);
      this.worker.terminate();
    }
  }
}
