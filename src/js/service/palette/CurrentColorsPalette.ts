import { Constants } from "../../Constants";
import { app } from "../../app";
import { assertDefined } from "../../utils/core";
import { ColorSorter } from "../color/ColorSorter";

export class CurrentColorsPalette {
  name: string;
  id: string;
  colorSorter: ColorSorter;

  constructor() {
    this.name = "Current colors";
    this.id = Constants.CURRENT_COLORS_PALETTE_ID;
    this.colorSorter = new ColorSorter();
  }

  getColors(): string[] {
    let currentColors = assertDefined(
      app.currentColorsService,
      "currentColorsService"
    ).getCurrentColors();
    currentColors = currentColors.slice(0, Constants.MAX_PALETTE_COLORS);
    return this.colorSorter.sort(currentColors);
  }
}
