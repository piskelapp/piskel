import type { Palette } from "../../model/Palette";
export class PaletteGplWriter {
  palette: Palette;

  constructor(palette: Palette) {
    this.palette = palette;
  }

  write(): string {
    const lines = [];
    lines.push("GIMP Palette");
    lines.push("Name: " + this.palette.name);
    lines.push("Columns: 0");
    lines.push("#");
    this.palette.getColors().forEach((color: string) => {
      lines.push(this.writeColorLine(color));
    });
    lines.push("\r\n");

    return lines.join("\r\n");
  }

  writeColorLine(color: string): string {
    const tinycolor = window.tinycolor(color);
    const rgb = tinycolor.toRgb();
    const strBuffer = [];
    strBuffer.push(this.padString(rgb.r, 3));
    strBuffer.push(this.padString(rgb.g, 3));
    strBuffer.push(this.padString(rgb.b, 3));
    strBuffer.push("Untitled");

    return strBuffer.join(" ");
  }

  padString(value: string | number, size: number): string {
    const str = value.toString();
    const pad = new Array(1 + size - str.length).join(" ");
    return pad + str;
  }
}
