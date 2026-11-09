import { Constants } from "../Constants";
import { Events } from "../Events";
import { app } from "../app";
import type { JQueryEvent } from "../lib/jquery-1.8.0";
import { Shortcuts } from "../service/keyboard/Shortcuts";
import { Dom } from "../utils/Dom";
import { UserSettings } from "../utils/UserSettings";
import { assertDefined } from "../utils/core";

/**
 * The PaletteController is responsible for handling the two color picker
 * widgets found in the left column, below the tools.
 */
export class PaletteController {
  /**
   * @public
   */
  init(): void {
    $.subscribe(
      Events.SELECT_PRIMARY_COLOR,
      this.onColorSelected_.bind(this, { isPrimary: true })
    );
    $.subscribe(
      Events.SELECT_SECONDARY_COLOR,
      this.onColorSelected_.bind(this, { isPrimary: false })
    );

    const shortcuts = Shortcuts;
    assertDefined(app.shortcutService, "shortcutService").registerShortcut(
      shortcuts.COLOR.SWAP,
      this.swapColors.bind(this)
    );
    assertDefined(app.shortcutService, "shortcutService").registerShortcut(
      shortcuts.COLOR.RESET,
      this.resetColors.bind(this)
    );

    const spectrumCfg = {
      showPalette: true,
      showButtons: false,
      showInput: true,
      palette: [["rgba(0,0,0,0)"]],
      clickoutFiresChange: true,
      getDisplayFormat: function (): string {
        return UserSettings.get(UserSettings.COLOR_FORMAT);
      },

      beforeShow: function (tinycolor: { setAlpha: (arg0: number) => void }) {
        tinycolor.setAlpha(1);
      }
    };

    // Initialize colorpickers:
    const colorPicker = $("#color-picker");
    colorPicker.spectrum(
      $.extend({ color: Constants.DEFAULT_PEN_COLOR }, spectrumCfg)
    );
    colorPicker.change({ isPrimary: true }, this.onPickerChange_.bind(this));
    this.setTitleOnPicker_(Constants.DEFAULT_PEN_COLOR, colorPicker.get(0));

    const secondaryColorPicker = $("#secondary-color-picker");
    secondaryColorPicker.spectrum(
      $.extend({ color: Constants.TRANSPARENT_COLOR }, spectrumCfg)
    );
    secondaryColorPicker.change(
      { isPrimary: false },
      this.onPickerChange_.bind(this)
    );
    this.setTitleOnPicker_(
      Constants.TRANSPARENT_COLOR,
      secondaryColorPicker.get(0)
    );

    const swapColorsIcon = Dom.getElement<HTMLElement>(".swap-colors-button");
    swapColorsIcon.addEventListener("click", this.swapColors.bind(this));
  }

  /**
   * @private
   */
  onPickerChange_(evt: JQueryEvent): void {
    const inputPicker = evt.target as HTMLInputElement;
    let color = inputPicker.value;

    if (color != Constants.TRANSPARENT_COLOR) {
      // Unless the color is TRANSPARENT_COLOR, format it to hexstring, as
      // expected by the rest of the application.
      color = window.tinycolor(color).toHexString();
    }

    if (assertDefined(evt.data, "data").isPrimary) {
      this.setPrimaryColor_(color);
    } else {
      this.setSecondaryColor_(color);
    }
  }

  /**
   * @private
   */
  onColorSelected_(
    args: { isPrimary: boolean },
    evt: JQueryEvent,
    color: string
  ): void {
    if (args.isPrimary) {
      this.setPrimaryColor_(color);
    } else {
      this.setSecondaryColor_(color);
    }
  }

  setPrimaryColor_(color: string): void {
    this.updateColorPicker_(
      color,
      Dom.getElement<HTMLInputElement>("#color-picker")
    );
    $.publish(Events.PRIMARY_COLOR_SELECTED, [color]);
  }

  setSecondaryColor_(color: string): void {
    this.updateColorPicker_(
      color,
      Dom.getElement<HTMLInputElement>("#secondary-color-picker")
    );
    $.publish(Events.SECONDARY_COLOR_SELECTED, [color]);
  }

  swapColors(): void {
    const primaryColor = assertDefined(
      app.selectedColorsService,
      "selectedColorsService"
    ).getPrimaryColor();
    this.setPrimaryColor_(
      assertDefined(
        app.selectedColorsService,
        "selectedColorsService"
      ).getSecondaryColor()
    );
    this.setSecondaryColor_(primaryColor);
  }

  resetColors(): void {
    this.setPrimaryColor_(Constants.DEFAULT_PEN_COLOR);
    this.setSecondaryColor_(Constants.TRANSPARENT_COLOR);
  }

  /**
   * @private
   */
  updateColorPicker_(color: string, colorPicker: HTMLInputElement): void {
    const jqueryColorPicker = $(colorPicker);
    if (color == Constants.TRANSPARENT_COLOR) {
      // We can set the current palette color to transparent.
      // You can then combine this transparent color with an advanced
      // tool for customized deletions.
      // Eg: bucket + transparent: Delete a colored area
      //     Stroke + transparent: hollow out the equivalent of a stroke

      // The colorpicker can't be set to a transparent state.
      // We set its background to white and insert the
      // string "TRANSPARENT" to mimic this state:
      jqueryColorPicker.spectrum("set", Constants.TRANSPARENT_COLOR);
      colorPicker.value = Constants.TRANSPARENT_COLOR;
    } else {
      jqueryColorPicker.spectrum("set", color);
    }
    this.setTitleOnPicker_(color, colorPicker);
  }

  setTitleOnPicker_(title: string, colorPicker: HTMLElement): void {
    const parent = assertDefined(colorPicker.parentElement, "parentElement");
    title = parent.dataset.initialTitle + "<br/>" + title;
    parent.dataset.originalTitle = title;
  }
}
