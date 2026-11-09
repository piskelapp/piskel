import { Constants } from "../Constants";
import { Events, type UserSettingValue } from "../Events";
import { app } from "../app";
import type { JQueryEvent } from "../lib/jquery-1.8.0";
import type { CurrentColorsService } from "../service/CurrentColorsService";
import { Shortcuts } from "../service/keyboard/Shortcuts";
import type {
  PaletteLike,
  PaletteService
} from "../service/palette/PaletteService";
import { Dom } from "../utils/Dom";
import { Template } from "../utils/Template";
import { UserSettings } from "../utils/UserSettings";
import { assertDefined } from "../utils/core";

const PRIMARY_COLOR_CLASSNAME = "palettes-list-primary-color";

const SECONDARY_COLOR_CLASSNAME = "palettes-list-secondary-color";

export class PalettesListController {
  usedColorService: CurrentColorsService;
  paletteService: PaletteService | undefined;
  paletteColorTemplate_: string | undefined;
  colorListContainer_: HTMLElement | undefined;
  colorPaletteSelect_: HTMLInputElement | undefined;

  constructor(usedColorService: CurrentColorsService) {
    this.usedColorService = usedColorService;
    this.paletteService = app.paletteService;
  }

  init(): void {
    this.paletteColorTemplate_ = Template.get("palette-color-template");

    this.colorListContainer_ = Dom.getElement<HTMLElement>(
      ".palettes-list-colors"
    );
    this.colorPaletteSelect_ = Dom.getElement<HTMLInputElement>(
      ".palettes-list-select"
    );

    const createPaletteButton_ = Dom.getElement<HTMLElement>(
      ".create-palette-button"
    );
    const editPaletteButton_ = Dom.getElement<HTMLElement>(
      ".edit-palette-button"
    );

    assertDefined(
      this.colorPaletteSelect_,
      "colorPaletteSelect_"
    ).addEventListener("change", this.onPaletteSelected_.bind(this));
    this.colorListContainer_.addEventListener(
      "mouseup",
      this.onColorContainerMouseup.bind(this)
    );
    this.colorListContainer_.addEventListener(
      "contextmenu",
      this.onColorContainerContextMenu.bind(this)
    );

    createPaletteButton_.addEventListener(
      "click",
      this.onCreatePaletteClick_.bind(this)
    );
    editPaletteButton_.addEventListener(
      "click",
      this.onEditPaletteClick_.bind(this)
    );

    $.subscribe(
      Events.PALETTE_LIST_UPDATED,
      this.onPaletteListUpdated.bind(this)
    );
    $.subscribe(
      Events.CURRENT_COLORS_UPDATED,
      this.fillColorListContainer.bind(this)
    );
    $.subscribe(
      Events.PRIMARY_COLOR_SELECTED,
      this.highlightSelectedColors.bind(this)
    );
    $.subscribe(
      Events.SECONDARY_COLOR_SELECTED,
      this.highlightSelectedColors.bind(this)
    );
    $.subscribe(
      Events.USER_SETTINGS_CHANGED,
      this.onUserSettingsChange_.bind(this)
    );

    const shortcuts = Shortcuts;
    assertDefined(app.shortcutService, "shortcutService").registerShortcut(
      shortcuts.COLOR.PREVIOUS_COLOR,
      this.selectPreviousColor_.bind(this)
    );
    assertDefined(app.shortcutService, "shortcutService").registerShortcut(
      shortcuts.COLOR.NEXT_COLOR,
      this.selectNextColor_.bind(this)
    );
    assertDefined(app.shortcutService, "shortcutService").registerShortcut(
      shortcuts.COLOR.SELECT_COLOR,
      this.selectColorForKey_.bind(this)
    );

    this.fillPaletteList();
    this.updateFromUserSettings();
    this.fillColorListContainer();
  }

  fillPaletteList(): void {
    const palettes = assertDefined(
      this.paletteService,
      "paletteService"
    ).getPalettes();

    const html = palettes
      .map(function (palette: PaletteLike) {
        return Template.replace('<option value="{{id}}">{{name}}</option>', {
          id: palette.id,
          name: palette.name
        });
      })
      .join("");
    assertDefined(this.colorPaletteSelect_, "colorPaletteSelect_").innerHTML =
      html;
  }

  fillColorListContainer(): void {
    const colors = this.getSelectedPaletteColors_();

    if (colors.length > 0) {
      const html = colors
        .filter(function (color: string) {
          return !!color;
        })
        .map((color: string, index: number) => {
          return Template.replace(
            assertDefined(this.paletteColorTemplate_, "paletteColorTemplate_"),
            {
              color: color,
              index: index + 1,
              title: color.toUpperCase()
            }
          );
        })
        .join("");
      assertDefined(this.colorListContainer_, "colorListContainer_").innerHTML =
        html;

      this.highlightSelectedColors();
    } else {
      assertDefined(this.colorListContainer_, "colorListContainer_").innerHTML =
        Template.get("palettes-list-no-colors-partial");
    }

    // If we have more than 10 colors, use tiny mode, where 10 colors will fit on the same
    // line.
    assertDefined(
      this.colorListContainer_,
      "colorListContainer_"
    ).classList.toggle("tiny", colors.length > 10);
  }

  selectPalette(paletteId: string): void {
    UserSettings.set(UserSettings.SELECTED_PALETTE, paletteId);
  }

  getSelectedPaletteColors_(): string[] {
    let colors: string[] = [];
    const palette = this.getSelectedPalette_();
    if (palette) {
      colors = palette.getColors();
    }

    if (colors.length > Constants.MAX_PALETTE_COLORS) {
      colors = colors.slice(0, Constants.MAX_PALETTE_COLORS);
    }

    return colors;
  }

  getSelectedPalette_(): PaletteLike | null {
    const paletteId = UserSettings.get(UserSettings.SELECTED_PALETTE);
    return assertDefined(this.paletteService, "paletteService").getPaletteById(
      paletteId
    );
  }

  selectNextColor_(): void {
    this.selectColor_(this.getCurrentColorIndex_() + 1);
  }

  selectPreviousColor_(): void {
    this.selectColor_(this.getCurrentColorIndex_() - 1);
  }

  getCurrentColorIndex_(): number {
    let currentIndex = 0;
    const selectedColor = document.querySelector<HTMLElement>(
      "." + PRIMARY_COLOR_CLASSNAME
    );
    if (selectedColor) {
      currentIndex = parseInt(String(selectedColor.dataset.colorIndex), 10) - 1;
    }
    return currentIndex;
  }

  selectColorForKey_(key: string): void {
    let index = parseInt(key, 10);
    index = (index + 9) % 10;
    this.selectColor_(index);
  }

  selectColor_(index: number): void {
    const colors = this.getSelectedPaletteColors_();
    const color = colors[index];
    if (color) {
      $.publish(Events.SELECT_PRIMARY_COLOR, [color]);
    }
  }

  onUserSettingsChange_(
    evt: JQueryEvent,
    name: string,
    value: UserSettingValue
  ): void {
    if (name == UserSettings.SELECTED_PALETTE) {
      this.updateFromUserSettings();
    }
  }

  updateFromUserSettings(): void {
    const paletteId = UserSettings.get(UserSettings.SELECTED_PALETTE);
    this.fillColorListContainer();
    assertDefined(this.colorPaletteSelect_, "colorPaletteSelect_").value =
      paletteId;
  }

  onPaletteSelected_(evt: Event): void {
    const paletteId = assertDefined(
      this.colorPaletteSelect_,
      "colorPaletteSelect_"
    ).value;
    this.selectPalette(paletteId);
    assertDefined(this.colorPaletteSelect_, "colorPaletteSelect_").blur();
  }

  onCreatePaletteClick_(evt: Event): void {
    $.publish(Events.DIALOG_SHOW, {
      dialogId: "create-palette"
    });
  }

  onEditPaletteClick_(evt: Event): void {
    const paletteId = assertDefined(
      this.colorPaletteSelect_,
      "colorPaletteSelect_"
    ).value;
    $.publish(Events.DIALOG_SHOW, {
      dialogId: "create-palette",
      initArgs: paletteId
    });
  }

  onColorContainerContextMenu(event: Event): void {
    event.preventDefault();
  }

  onColorContainerMouseup(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    const color = target.dataset.color;

    if (color) {
      if (event.button == Constants.LEFT_BUTTON) {
        $.publish(Events.SELECT_PRIMARY_COLOR, [color]);
      } else if (event.button == Constants.RIGHT_BUTTON) {
        $.publish(Events.SELECT_SECONDARY_COLOR, [color]);
      }
    }
  }

  highlightSelectedColors(): void {
    this.removeClass_(PRIMARY_COLOR_CLASSNAME);
    this.removeClass_(SECONDARY_COLOR_CLASSNAME);

    let colorContainer = this.getColorContainer_(
      assertDefined(
        app.selectedColorsService,
        "selectedColorsService"
      ).getSecondaryColor()
    );
    if (colorContainer) {
      colorContainer.classList.remove(PRIMARY_COLOR_CLASSNAME);
      colorContainer.classList.add(SECONDARY_COLOR_CLASSNAME);
    }

    colorContainer = this.getColorContainer_(
      assertDefined(
        app.selectedColorsService,
        "selectedColorsService"
      ).getPrimaryColor()
    );
    if (colorContainer) {
      colorContainer.classList.remove(SECONDARY_COLOR_CLASSNAME);
      colorContainer.classList.add(PRIMARY_COLOR_CLASSNAME);
    }
  }

  getColorContainer_(color: string | number): Element | null {
    return assertDefined(
      this.colorListContainer_,
      "colorListContainer_"
    ).querySelector('.palettes-list-color[data-color="' + color + '"]');
  }

  removeClass_(cssClass: string): void {
    const element = document.querySelector("." + cssClass);
    if (element) {
      element.classList.remove(cssClass);
    }
  }

  onPaletteListUpdated(): void {
    this.fillPaletteList();
    this.updateFromUserSettings();
  }
}
