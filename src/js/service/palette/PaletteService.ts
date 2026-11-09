import { Events } from "../../Events";
import { Palette } from "../../model/Palette";
import type { CurrentColorsPalette } from "./CurrentColorsPalette";

export type PaletteLike = Palette | CurrentColorsPalette;

export class PaletteService {
  dynamicPalettes: PaletteLike[];
  localStorageGlobal: Storage;

  constructor() {
    this.dynamicPalettes = [];
    // Exposed for tests.
    this.localStorageGlobal = window.localStorage;
  }

  getPalettes(): PaletteLike[] {
    const palettesString = this.localStorageGlobal.getItem("piskel.palettes");
    const palettes: Palette[] = (JSON.parse(String(palettesString)) || []).map(
      function (palette: Palette) {
        return Palette.fromObject(palette);
      }
    );

    return this.dynamicPalettes.concat(palettes);
  }

  getPaletteById(paletteId: string): PaletteLike | null {
    const palettes = this.getPalettes();
    return this.findPaletteInArray_(paletteId, palettes);
  }

  savePalette(palette: Palette): void {
    const palettes = this.getPalettes();
    const existingPalette = this.findPaletteInArray_(palette.id, palettes);
    if (existingPalette) {
      const currentIndex = palettes.indexOf(existingPalette);
      palettes.splice(currentIndex, 1, palette);
    } else {
      palettes.push(palette);
    }

    this.savePalettes_(palettes);

    $.publish(Events.SHOW_NOTIFICATION, [
      { content: "Palette " + palette.name + " successfully saved !" }
    ]);
    window.setTimeout(function () {
      $.publish(Events.HIDE_NOTIFICATION);
    }, 2000);
  }

  addDynamicPalette(palette: PaletteLike): void {
    this.dynamicPalettes.push(palette);
  }

  deletePaletteById(id: string): void {
    const palettes = this.getPalettes();
    const filteredPalettes = palettes.filter(function (palette: PaletteLike) {
      return palette.id !== id;
    });

    this.savePalettes_(filteredPalettes);
  }

  savePalettes_(allPalettes: PaletteLike[]): void {
    const palettes = allPalettes.filter((palette: PaletteLike) => {
      return this.dynamicPalettes.indexOf(palette) === -1;
    });
    this.localStorageGlobal.setItem(
      "piskel.palettes",
      JSON.stringify(palettes)
    );
    $.publish(Events.PALETTE_LIST_UPDATED);
  }

  findPaletteInArray_(
    paletteId: string,
    palettes: PaletteLike[]
  ): PaletteLike | null {
    let match: PaletteLike | null = null;

    palettes.forEach(function (palette: PaletteLike) {
      if (palette.id === paletteId) {
        match = palette;
      }
    });

    return match;
  }
}
