import type { TinyColor } from "../lib/spectrum/spectrum";
import { KeycodeTranslator } from "../service/keyboard/KeycodeTranslator";
import { Dom } from "../utils/Dom";
import { EventUtils } from "../utils/Event";
import { UserAgent } from "../utils/UserAgent";
import { assertDefined, copy } from "../utils/core";

type ColorModel = Record<string, number>;
type ColorInput = string | TinyColor | ColorModel;

const isTinyColor = function (color: ColorInput): color is TinyColor {
  return typeof color == "object" && color.hasOwnProperty("_tc_id");
};

const isHsvColor = function (color: ColorInput): color is ColorModel {
  return ["h", "s", "v"].every(color.hasOwnProperty.bind(color));
};

export class HslRgbColorPicker {
  container: HTMLElement | null;
  colorUpdatedCallback: (color: TinyColor) => void;
  tinyColor: TinyColor | null;
  hsvColor: ColorModel | null;
  rgbColor: ColorModel | null;
  lastInputTimestamp_: number;
  spectrumEl: HTMLElement | null | undefined;
  unplugged: boolean | undefined;

  constructor(
    container: HTMLElement,
    colorUpdatedCallback: (color: TinyColor) => void
  ) {
    this.container = container;
    this.colorUpdatedCallback = colorUpdatedCallback;

    this.tinyColor = null;
    this.hsvColor = null;
    this.rgbColor = null;

    this.lastInputTimestamp_ = 0;
  }

  init(): void {
    const isFirefox = UserAgent.isFirefox;
    const isChrome = UserAgent.isChrome;

    const changeEvent = isChrome || isFirefox ? "input" : "change";
    EventUtils.addEventListener(
      assertDefined(this.container, "container"),
      changeEvent,
      this.onPickerChange_,
      this
    );
    EventUtils.addEventListener(
      assertDefined(this.container, "container"),
      "keydown",
      this.onPickerChange_,
      this
    );

    // Cannot use pskl.utils.Event with useCapture for now ...
    this.onBlur_ = this.onBlur_.bind(this);
    assertDefined(this.container, "container").addEventListener(
      "blur",
      this.onBlur_,
      true
    );

    this.spectrumEl = Dom.getElement<HTMLElement>(
      ".color-picker-spectrum",
      assertDefined(this.container, "container")
    );

    $(this.spectrumEl).spectrum({
      flat: true,
      showButtons: false,
      move: this.setColor.bind(this),
      change: this.setColor.bind(this)
    });

    this.setColor("#000000");
  }

  destroy(): void {
    // Remove event listeners.
    EventUtils.removeAllEventListeners(this);
    assertDefined(this.container, "container").removeEventListener(
      "blur",
      this.onBlur_,
      true
    );

    // Destroy spectrum widget.
    $(this.spectrumEl).spectrum("destroy");

    this.container = null;
    this.spectrumEl = null;
  }

  /**
   * Handle change event on all color inputs
   */
  onPickerChange_(evt: Event): void {
    const target = evt.target as HTMLInputElement;
    if (target.dataset.dimension) {
      const model = target.dataset.model;
      const dimension = target.dataset.dimension;
      const value = target.value;

      this.updateColor_(value, model, dimension);
    }
  }

  /**
   * Handle up/down arrow keydown on text inputs
   */
  onKeydown_(evt: KeyboardEvent): void {
    const target = evt.target as HTMLInputElement;

    const isInputText =
      assertDefined(target.getAttribute("type"), "type").toLowerCase() ===
      "text";
    if (isInputText && target.dataset.dimension) {
      const model = target.dataset.model;

      if (model === "rgb" || model === "hsv") {
        const increment = this.getIncrement_(evt);
        if (increment) {
          const dimension = target.dataset.dimension;
          const value = parseInt(target.value, 10);
          this.updateColor_(value + increment, model, dimension);
        }
      }
    }
  }

  getIncrement_(evt: KeyboardEvent): number {
    let increment = 0;
    const key = KeycodeTranslator.toChar(evt.keyCode);
    if (key === "up") {
      increment = 1;
    } else if (key === "down") {
      increment = -1;
    }

    if (evt.shiftKey) {
      increment = increment * 5;
    }

    return increment;
  }

  updateColor_(
    inputValue: string | number,
    model: string | undefined,
    dimension: string
  ): void {
    const value = this.toModelValue_(inputValue, model, dimension);
    if (model === "hsv" || model === "rgb") {
      if (typeof value === "number" && !isNaN(value)) {
        const color = this.getColor_(model);
        color[dimension] = this.normalizeDimension_(value, dimension);
        this.setColor(color);
      }
    } else if (model === "hex") {
      if (typeof value === "string" && /^#([a-f0-9]{3}){1,2}$/i.test(value)) {
        this.setColor(value);
      }
    }
  }

  onBlur_(evt: Event): void {
    const target = evt.target as HTMLInputElement;

    const isInputText =
      assertDefined(target.getAttribute("type"), "type").toLowerCase() ===
      "text";
    if (isInputText && target.dataset.dimension) {
      const model = target.dataset.model;
      const dimension = target.dataset.dimension;
      target.value = String(this.toInputValue_(model, dimension));
    }
  }

  setColor(inputColor: ColorInput): void {
    if (!this.unplugged) {
      this.unplugged = true;

      this.hsvColor = this.toHsvColor_(inputColor);
      const tinyColor = this.toTinyColor_(inputColor);
      this.tinyColor = tinyColor;
      this.rgbColor = tinyColor.toRgb();

      this.updateInputs();
      $(".color-picker-spectrum").spectrum("set", tinyColor);

      this.colorUpdatedCallback(tinyColor);

      this.unplugged = false;
    }
  }

  updateInputs(): void {
    const inputs = assertDefined(this.container, "container").querySelectorAll(
      "input"
    );

    for (let i = 0; i < inputs.length; i++) {
      const input = inputs[i];
      const dimension = input.dataset.dimension;
      const model = input.dataset.model;

      const value = this.toInputValue_(model, dimension);
      if (input.value != value) {
        input.value = String(value);
      }
      if (input.getAttribute("type") === "range") {
        this.updateSliderBackground(input);
      }
    }
  }

  toInputValue_(
    model: string | undefined,
    dimension: string | undefined
  ): string | number | undefined {
    let value;

    if (model === "rgb" || model === "hsv") {
      const color = this.getColor_(model);
      value = color[assertDefined(dimension, "dimension")];

      if (dimension === "v" || dimension === "s") {
        value = 100 * value;
      }
      value = Math.round(value);
    } else if (model === "hex") {
      value = assertDefined(this.tinyColor, "tinyColor").toHexString(true);
    }

    return value;
  }

  toModelValue_(
    value: string | number,
    model: string | undefined,
    dimension: string
  ): string | number | undefined {
    let modelValue;

    if (model === "rgb" || model === "hsv") {
      modelValue = parseInt(String(value), 10);
      if (dimension === "v" || dimension === "s") {
        modelValue = modelValue / 100;
      }
    } else if (model === "hex") {
      modelValue = value;
    }

    return modelValue;
  }

  toTinyColor_(color: ColorInput): TinyColor {
    if (isTinyColor(color)) {
      return color;
    } else {
      return window.tinycolor(copy(color));
    }
  }

  toHsvColor_(color: ColorInput): ColorModel {
    if (isHsvColor(color)) {
      return {
        h: this.normalizeDimension_(color.h, "h"),
        s: this.normalizeDimension_(color.s, "s"),
        v: this.normalizeDimension_(color.v, "v")
      };
    } else {
      return this.toTinyColor_(color).toHsv();
    }
  }

  normalizeDimension_(value: number, dimension: string): number {
    const range = assertDefined(this.getDimensionRange_(dimension), "range");
    return Math.max(range[0], Math.min(range[1], value));
  }

  /**
   * Update background colors for range inputs
   */
  updateSliderBackground(slider: HTMLInputElement): void {
    const dimension = assertDefined(slider.dataset.dimension, "dimension");
    const model = slider.dataset.model;

    const isHueSlider = dimension === "h";
    if (!isHueSlider) {
      const colors = this.getSliderBackgroundColors_(model, dimension);
      slider.style.backgroundImage =
        "linear-gradient(to right, " +
        colors.start +
        " 0, " +
        colors.end +
        " 100%)";
    }
  }

  getSliderBackgroundColors_(
    model: string | undefined,
    dimension: string
  ): { start: string; end: string } {
    const color = this.getColor_(model);
    const start = copy(color);
    const end = copy(color);

    const range = assertDefined(this.getDimensionRange_(dimension), "range");
    start[dimension] = range[0];
    end[dimension] = range[1];

    return {
      start: window.tinycolor(start).toRgbString(),
      end: window.tinycolor(end).toRgbString()
    };
  }

  getDimensionRange_(d: string): number[] | undefined {
    if (d === "h") {
      return [0, 359];
    } else if (d === "s" || d === "v") {
      return [0, 1];
    } else if (d === "r" || d === "g" || d === "b") {
      return [0, 255];
    }
  }

  getColor_(model: string | undefined): ColorModel {
    let color;
    if (model === "hsv") {
      color = this.hsvColor;
    } else if (model === "rgb") {
      color = this.rgbColor;
    }
    return assertDefined(color, "color");
  }
}
