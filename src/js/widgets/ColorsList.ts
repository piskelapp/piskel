import type { SortableUi } from "../lib/jquery-ui-1.10.3.custom";
import type { TinyColor } from "../lib/spectrum/spectrum";
import { Palette } from "../model/Palette";
import { Dom } from "../utils/Dom";
import { EventUtils } from "../utils/Event";
import { Template } from "../utils/Template";
import { assertDefined } from "../utils/core";
import { HslRgbColorPicker } from "./HslRgbColorPicker";

const DEFAULT_COLOR = "#000000";

export class ColorsList {
  selectedIndex: number;
  palette: Palette;
  container: HTMLElement | null;
  colorsList: HTMLElement | null;
  colorPreviewEl: HTMLElement | null;
  hslRgbColorPicker: HslRgbColorPicker;

  constructor(container: HTMLElement) {
    this.selectedIndex = -1;
    this.palette = new Palette("tmp", "tmp", []);
    this.container = container;

    this.colorsList = Dom.getElement<HTMLElement>(
      ".colors-list",
      this.container
    );
    this.colorPreviewEl = Dom.getElement<HTMLElement>(
      ".color-preview",
      this.container
    );

    $(container).sortable({
      placeholder: "colors-list-drop-proxy",
      update: this.onColorDrop_.bind(this),
      items: ".create-palette-color"
    });

    EventUtils.addEventListener(
      this.colorsList,
      "click",
      this.onColorContainerClick_,
      this
    );

    const colorPickerContainer = Dom.getElement<HTMLElement>(
      ".color-picker-container",
      container
    );
    this.hslRgbColorPicker = new HslRgbColorPicker(
      colorPickerContainer,
      this.onColorUpdated_.bind(this)
    );
    this.hslRgbColorPicker.init();
  }

  setColors(colors: string[]): void {
    if (colors.length === 0) {
      colors.push(DEFAULT_COLOR);
    }

    this.palette.setColors(colors);

    this.selectColor_(0);
    this.refresh_();
  }

  getColors(): string[] {
    return this.palette.getColors();
  }

  destroy(): void {
    EventUtils.removeAllEventListeners(this);

    $(this.container).sortable("destroy");

    this.hslRgbColorPicker.destroy();
    this.container = null;
    this.colorsList = null;
    this.colorPreviewEl = null;
  }

  /**
   * Lightweight refresh only changing the color of one element of the palette color list
   */
  refreshColorElement_(index: number): void {
    const color = this.palette.get(this.selectedIndex);
    const element = document.querySelector<HTMLElement>(
      '[data-palette-index="' + index + '"]'
    );
    if (element) {
      element.style.background = color;
      element.classList.toggle("light-color", this.isLight_(color));
    }
  }

  onColorContainerClick_(evt: Event): void {
    const target = evt.target as HTMLElement;
    if (target.classList.contains("create-palette-color")) {
      this.onPaletteColorClick_(evt, target);
    } else if (target.classList.contains("create-palette-new-color")) {
      this.onNewColorClick_(evt, target);
    } else if (target.classList.contains("create-palette-remove-color")) {
      this.onRemoveColorClick_(evt, target);
    }
    this.refresh_();
  }

  onColorUpdated_(color: TinyColor): void {
    const strColor = color.toHexString();
    assertDefined(this.colorPreviewEl, "colorPreviewEl").style.background =
      strColor;
    if (this.palette) {
      this.palette.set(this.selectedIndex, strColor);
      this.refreshColorElement_(this.selectedIndex);
    }
  }

  onPaletteColorClick_(evt: Event, target: HTMLElement): void {
    const index = parseInt(String(target.dataset.paletteIndex), 10);
    this.selectColor_(index);
  }

  onRemoveColorClick_(evt: Event, target: HTMLElement): void {
    const colorElement = assertDefined(target.parentElement, "parentElement");
    const index = parseInt(String(colorElement.dataset.paletteIndex), 10);
    this.removeColor_(index);
  }

  onNewColorClick_(evt: Event, target: HTMLElement): void {
    const newColor = this.palette.get(this.selectedIndex) || "#000000";
    this.palette.add(newColor);
    this.selectColor_(this.palette.size() - 1);
  }

  refresh_(): void {
    let html = "";
    const tpl = Template.get("create-palette-color-template");
    const colors = this.palette.getColors();

    colors.forEach((color: string | number, index: number) => {
      const isSelected = index === this.selectedIndex;

      html += Template.replace(tpl, {
        color: color,
        index: index,
        ":selected": isSelected,
        ":light-color": this.isLight_(String(color))
      });
    });

    html += '<li class="create-palette-new-color">+</li>';

    assertDefined(this.colorsList, "colorsList").innerHTML = html;
  }

  selectColor_(index: number): void {
    this.selectedIndex = index;
    this.hslRgbColorPicker.setColor(this.palette.get(index));
  }

  removeColor_(index: number): void {
    this.palette.removeAt(index);
    this.refresh_();
  }

  isLight_(color: string): boolean {
    const rgb = window.tinycolor(color).toRgb();
    return rgb.r + rgb.b + rgb.g > 128 * 3;
  }

  onColorDrop_(evt: Event, drop: SortableUi): void {
    const colorElement = drop.item.get(0);

    const oldIndex = parseInt(String(colorElement.dataset.paletteIndex), 10);
    const colors = document.querySelectorAll(".create-palette-color");
    const newIndex = Array.prototype.indexOf.call(colors, colorElement);
    this.palette.move(oldIndex, newIndex);

    this.selectedIndex = newIndex;

    this.refresh_();
  }
}
