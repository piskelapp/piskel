import HashWorker from "./HashWorker?worker&inline";
import type { HashRequest, HashResponse } from "./HashWorker";

type HashCallback = (event: MessageEvent<HashResponse>) => void;

export class Hash {
  str: string;
  onStep: HashCallback;
  onSuccess: HashCallback;
  onError: HashCallback;
  worker: Worker;

  constructor(
    str: string,
    onSuccess: HashCallback,
    onStep: HashCallback,
    onError: HashCallback
  ) {
    this.str = str;

    this.onStep = onStep;
    this.onSuccess = onSuccess;
    this.onError = onError;

    this.worker = new HashWorker();
    this.worker.onmessage = this.onWorkerMessage.bind(this);
  }

  process(): void {
    const request: HashRequest = { str: this.str };
    this.worker.postMessage(request);
  }

  onWorkerMessage(event: MessageEvent<HashResponse>): void {
    if (event.data.type === "SUCCESS") {
      this.onSuccess(event);
      this.worker.terminate();
    } else if (event.data.type === "ERROR") {
      this.onError(event);
      this.worker.terminate();
    }
  }
}
