import { assertDefined } from "../utils/core";
import { SynchronizedInputs } from "./SynchronizedInputs";

/**
 * Synchronize two "number" inputs to stick to their initial ratio.
 * The synchronization can be disabled/enabled on the fly.
 *
 * @param {Object} options
 *        - {Element} widthInput
 *        - {Element} heightInput
 *        - {Number} initWidth
 *        - {Number} initHeight
 *        - {Function} onChange
 */
export type SizeInputOptions = {
  widthInput: HTMLInputElement;
  heightInput: HTMLInputElement;
  initWidth: number;
  initHeight: number;
  onChange?: () => void;
};

export class SizeInput {
  widthInput: HTMLInputElement | null;
  heightInput: HTMLInputElement | null;
  initWidth: number;
  initHeight: number;
  onChange: (() => void) | undefined;
  synchronizedInputs: SynchronizedInputs;
  disableSync: () => void;
  enableSync: () => void;

  constructor(options: SizeInputOptions) {
    this.widthInput = options.widthInput;
    this.heightInput = options.heightInput;
    this.initWidth = options.initWidth;
    this.initHeight = options.initHeight;
    this.onChange = options.onChange;

    this.synchronizedInputs = new SynchronizedInputs({
      leftInput: this.widthInput,
      rightInput: this.heightInput,
      synchronize: this.synchronize_.bind(this)
    });

    this.disableSync = this.synchronizedInputs.disableSync.bind(
      this.synchronizedInputs
    );
    this.enableSync = this.synchronizedInputs.enableSync.bind(
      this.synchronizedInputs
    );

    assertDefined(this.widthInput, "widthInput").value = String(this.initWidth);
    assertDefined(this.heightInput, "heightInput").value = String(
      this.initHeight
    );
  }

  destroy(): void {
    this.synchronizedInputs.destroy();

    this.widthInput = null;
    this.heightInput = null;
  }

  setWidth(width: number): void {
    assertDefined(this.widthInput, "widthInput").value = String(width);
    this.synchronize_(this.widthInput);
  }

  setHeight(height: number): void {
    assertDefined(this.heightInput, "heightInput").value = String(height);
    this.synchronize_(this.heightInput);
  }

  /**
   * Based on the value of the provided sizeInput (considered as emitter)
   * update the value of the other sizeInput to match the current width/height ratio
   * @param  {HTMLElement} origin either widthInput or heightInput
   */
  synchronize_(input: EventTarget | null): void {
    const sizeInput = assertDefined(input, "sizeInput") as HTMLInputElement;
    let value = parseInt(sizeInput.value, 10);
    if (isNaN(value)) {
      value = 0;
    }

    if (sizeInput === this.widthInput) {
      assertDefined(this.heightInput, "heightInput").value = String(
        Math.round((value * this.initHeight) / this.initWidth)
      );
    } else if (sizeInput === this.heightInput) {
      assertDefined(this.widthInput, "widthInput").value = String(
        Math.round((value * this.initWidth) / this.initHeight)
      );
    }

    if (this.onChange) {
      this.onChange();
    }
  }
}
