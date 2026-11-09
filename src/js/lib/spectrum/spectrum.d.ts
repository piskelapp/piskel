import type { JQueryCollection } from "../jquery-1.8.0";

export type TinyColorRgb = { r: number; g: number; b: number; a: number };
export type TinyColorHsl = { h: number; s: number; l: number; a: number };
export type TinyColorHsv = { h: number; s: number; v: number; a: number };

export type TinyColorInput =
  | string
  | TinyColor
  | { r: number; g: number; b: number; a?: number }
  | { h: number; s: number; l: number; a?: number }
  | { h: number; s: number; v: number; a?: number }
  | Record<string, number>;

export type TinyColor = {
  ok: boolean;
  toRgb(): TinyColorRgb;
  toHsl(): TinyColorHsl;
  toHsv(): TinyColorHsv;
  toHexString(allow3Char?: boolean): string;
  toRgbString(): string;
  toString(format?: string): string;
  setAlpha(alpha: number): void;
  getAlpha(): number;
};

export type TinyColorStatic = {
  (color: TinyColorInput): TinyColor;
  darken(color: TinyColorInput, amount?: number): TinyColor;
  lighten(color: TinyColorInput, amount?: number): TinyColor;
};

export type SpectrumOptions = {
  color?: string;
  flat?: boolean;
  showPalette?: boolean;
  showButtons?: boolean;
  showInput?: boolean;
  palette?: string[][];
  clickoutFiresChange?: boolean;
  beforeShow?: (color: TinyColor) => void;
  move?: (color: TinyColor) => void;
  change?: (color: TinyColor) => void;
  /** Piskel patch: returns the format of the text input, on each update. */
  getDisplayFormat?: () => string;
};

export type SpectrumMethods = {
  spectrum(options: SpectrumOptions): JQueryCollection;
  spectrum(method: "destroy"): JQueryCollection;
  spectrum(method: "set", color: string | TinyColor): JQueryCollection;
};

declare global {
  // biome-ignore lint/style/useConsistentTypeDefinitions: only an interface can augment Window
  interface Window {
    tinycolor: TinyColorStatic;
  }
}
