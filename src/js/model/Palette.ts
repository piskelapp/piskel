export type PaletteData = { id: string; name: string; colors: string[] };

export class Palette {
  id: string;
  name: string;
  colors: string[];

  constructor(id: string, name: string, colors: string[]) {
    this.id = id;
    this.name = name;
    this.colors = colors;
  }

  static fromObject(paletteObj: PaletteData): Palette {
    const colors = paletteObj.colors.slice(0, paletteObj.colors.length);
    return new Palette(paletteObj.id, paletteObj.name, colors);
  }

  getColors(): string[] {
    return this.colors;
  }

  setColors(colors: string[]): void {
    this.colors = colors;
  }

  get(index: number): string {
    return this.colors[index];
  }

  set(index: number, color: string): void {
    this.colors[index] = color;
  }

  add(color: string): void {
    this.colors.push(color);
  }

  size(): number {
    return this.colors.length;
  }

  removeAt(index: number): void {
    this.colors.splice(index, 1);
  }

  move(oldIndex: number, newIndex: number): void {
    this.colors.splice(newIndex, 0, this.colors.splice(oldIndex, 1)[0]);
  }
}
