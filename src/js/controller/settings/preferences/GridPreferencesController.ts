import { Constants } from "../../../Constants";
import { Dom } from "../../../utils/Dom";
import { Template } from "../../../utils/Template";
import { UserSettings } from "../../../utils/UserSettings";
import { SizePicker } from "../../../widgets/SizePicker";
import type { PublicPiskelController } from "../../piskel/PublicPiskelController";
import { AbstractSettingController } from "../AbstractSettingController";
import type { PreferencesController } from "../PreferencesController";

const colorsMap: Record<string, string> = {
  transparent: Constants.TRANSPARENT_COLOR,
  white: "#FFF1E8",
  "light-gray": "#C2C3C7",
  "dark-gray": "#5F574F",
  black: "#000000",
  blue: "#29ADFF",
  "dark-blue": "#1D2B53",
  green: "#00E436",
  "dark-green": "#008751",
  peach: "#FFCCAA",
  pink: "#FF77A8",
  yellow: "#FFEC27",
  orange: "#FFA300",
  red: "#FF004D"
};

export class GridPreferencesController extends AbstractSettingController {
  piskelController: PublicPiskelController;
  preferencesController: PreferencesController;
  sizePicker: SizePicker;
  spacingPicker: SizePicker;
  gridColorList: HTMLElement | undefined;

  constructor(
    piskelController: PublicPiskelController,
    preferencesController: PreferencesController
  ) {
    super();
    this.piskelController = piskelController;
    this.preferencesController = preferencesController;
    this.sizePicker = new SizePicker(this.onSizePickerChanged_.bind(this));
    this.spacingPicker = new SizePicker(
      this.onSpacingPickerChanged_.bind(this)
    );
  }

  init(): void {
    // Grid enabled
    const isEnabled = UserSettings.get(UserSettings.GRID_ENABLED);
    const enableGridCheckbox = Dom.getElement<HTMLInputElement>(
      ".enable-grid-checkbox"
    );
    if (isEnabled) {
      enableGridCheckbox.setAttribute("checked", "true");
    }
    this.addEventListener(
      enableGridCheckbox,
      "change",
      this.onEnableGridChange_
    );

    // Grid size
    const gridWidth = UserSettings.get(UserSettings.GRID_WIDTH);
    this.sizePicker.init(Dom.getElement<HTMLElement>(".grid-size-container"));
    this.sizePicker.setSize(gridWidth);

    //Grid Spacing
    const gridSpacing = UserSettings.get(UserSettings.GRID_SPACING);
    this.spacingPicker.init(
      Dom.getElement<HTMLElement>(".grid-spacing-container")
    );
    this.spacingPicker.setSize(gridSpacing);

    // Grid color
    const colorListItemTemplate = Template.get("color-list-item-template");

    const gridColor = UserSettings.get(UserSettings.GRID_COLOR);

    let markup = "";
    Object.keys(colorsMap).forEach(function (key: string, index: number) {
      let background = colorsMap[key];
      if (key === "transparent") {
        background =
          "url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAwAAAAMCAIAAADZ" +
          "F8uwAAAAGUlEQVQYV2M4gwH+YwCGIasIUwhT25BVBADtzYNYrHvv4gAAAABJRU5ErkJggg==)";
      }
      markup += Template.replace(colorListItemTemplate, {
        color: colorsMap[key],
        title: key,
        background: background,
        ":selected": gridColor === colorsMap[key]
      });
    });
    this.gridColorList = Dom.getElement<HTMLElement>(".grid-colors-list");
    this.gridColorList.innerHTML = markup;

    this.addEventListener(
      this.gridColorList,
      "click",
      this.onGridColorClicked_.bind(this)
    );
  }

  destroy(): void {
    this.sizePicker.destroy();
    this.spacingPicker.destroy();
    super.destroy();
  }

  onSizePickerChanged_(size: number): void {
    UserSettings.set(UserSettings.GRID_WIDTH, size);
  }

  onSpacingPickerChanged_(size: number): void {
    UserSettings.set(UserSettings.GRID_SPACING, size);
  }

  onEnableGridChange_(evt: Event): void {
    UserSettings.set(
      UserSettings.GRID_ENABLED,
      (evt.currentTarget as HTMLInputElement).checked
    );
  }

  onGridColorClicked_(evt: Event): void {
    const color = (evt.target as HTMLElement).dataset.color;
    if (color) {
      UserSettings.set(UserSettings.GRID_COLOR, color);
      Dom.getElement<HTMLElement>(
        ".selected",
        this.gridColorList
      ).classList.remove("selected");
      (evt.target as HTMLElement).classList.add("selected");
    }
  }
}
