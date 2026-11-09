import type { TinyColorHsl } from "../../lib/spectrum/spectrum";
const LOW_SAT = 0.1;

const LOW_LUM = 0.1;

const HI_LUM = 0.9;

const HUE_STEP = 36;

const HUE_BAGS = 10;

const HUE_BOUNDS: number[] = [];

for (let i = 0; i < HUE_BAGS; i++) {
  HUE_BOUNDS.push(i * HUE_STEP);
}

export class ColorSorter {
  colorsHslMap_: Record<string, TinyColorHsl>;

  constructor() {
    this.colorsHslMap_ = {};
  }

  sort(colors: string[]): string[] {
    this.colorsHslMap_ = {};

    colors.forEach((color: string) => {
      this.colorsHslMap_[color] = window.tinycolor(color).toHsl();
    });

    // sort by most frequent color
    let darkColors = colors.filter((c) => {
      const hsl = this.colorsHslMap_[c];
      return hsl.l <= LOW_LUM;
    });

    let brightColors = colors.filter((c) => {
      const hsl = this.colorsHslMap_[c];
      return hsl.l >= HI_LUM;
    });

    let desaturatedColors = colors
      .filter(function (c) {
        return brightColors.indexOf(c) === -1 && darkColors.indexOf(c) === -1;
      })
      .filter((c) => {
        const hsl = this.colorsHslMap_[c];
        return hsl.s <= LOW_SAT;
      });

    darkColors = this.sortOnHslProperty_(darkColors, "l");
    brightColors = this.sortOnHslProperty_(brightColors, "l");
    desaturatedColors = this.sortOnHslProperty_(desaturatedColors, "h");

    const sortedColors = darkColors.concat(brightColors, desaturatedColors);

    const regularColors = colors.filter(function (c) {
      return sortedColors.indexOf(c) === -1;
    });

    const regularColorsBags = HUE_BOUNDS.map((hue: number) => {
      const bagColors = regularColors.filter((color: string) => {
        const hsl = this.colorsHslMap_[color];
        return hsl.h >= hue && hsl.h < hue + HUE_STEP;
      });

      return this.sortRegularColors_(bagColors);
    });

    return Array.prototype.concat.apply(sortedColors, regularColorsBags);
  }

  sortRegularColors_(colors: string[]): string[] {
    const sortedColors = colors.sort((c1, c2) => {
      const hsl1 = this.colorsHslMap_[c1];
      const hsl2 = this.colorsHslMap_[c2];
      const hDiff = Math.abs(hsl1.h - hsl2.h);
      const sDiff = Math.abs(hsl1.s - hsl2.s);
      const lDiff = Math.abs(hsl1.l - hsl2.l);
      if (hDiff < 10) {
        if (sDiff > lDiff) {
          return this.compareValues_(hsl1.s, hsl2.s);
        } else {
          return this.compareValues_(hsl1.l, hsl2.l);
        }
      } else {
        return this.compareValues_(hsl1.h, hsl2.h);
      }
    });

    return sortedColors;
  }

  sortOnHslProperty_(
    colors: string[],
    property: "h" | "s" | "l" | "a"
  ): string[] {
    return colors.sort((c1, c2) => {
      const hsl1 = this.colorsHslMap_[c1];
      const hsl2 = this.colorsHslMap_[c2];
      return this.compareValues_(hsl1[property], hsl2[property]);
    });
  }

  compareValues_(v1: number, v2: number): 0 | 1 | -1 {
    if (v1 > v2) {
      return 1;
    } else if (v1 < v2) {
      return -1;
    }
    return 0;
  }
}
