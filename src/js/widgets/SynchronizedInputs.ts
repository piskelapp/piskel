import { EventUtils } from "../utils/Event";

export class SynchronizedInputs {
  leftInput: HTMLInputElement | null;
  rightInput: HTMLInputElement | null;
  synchronize: (input: EventTarget | null) => void;
  syncEnabled: boolean;
  lastInput: EventTarget | null;

  constructor(options: {
    leftInput: HTMLInputElement;
    rightInput: HTMLInputElement;
    synchronize: (input: EventTarget | null) => void;
  }) {
    this.leftInput = options.leftInput;
    this.rightInput = options.rightInput;
    this.synchronize = options.synchronize;

    this.syncEnabled = true;
    this.lastInput = this.leftInput;

    EventUtils.addEventListener(
      options.leftInput,
      "input",
      this.onInput_,
      this
    );
    EventUtils.addEventListener(
      options.rightInput,
      "input",
      this.onInput_,
      this
    );
  }

  destroy(): void {
    EventUtils.removeAllEventListeners(this);

    this.leftInput = null;
    this.rightInput = null;
    this.lastInput = null;
  }

  enableSync(): void {
    this.syncEnabled = true;
    this.synchronize(this.lastInput);
  }

  disableSync(): void {
    this.syncEnabled = false;
  }

  onInput_(evt: Event): void {
    const target = evt.target;
    if (this.syncEnabled) {
      this.synchronize(target);
    }
    this.lastInput = target;
  }
}
