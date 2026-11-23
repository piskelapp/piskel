import { Events } from "@/Events";
import { app } from "@/app";
import { Dom } from "@/utils/Dom";
import { assertInitialized } from "@/utils/core";
import { SizePicker } from "@/widgets/SizePicker";

export class PenSizeController {
  sizePicker: SizePicker;

  constructor() {
    this.sizePicker = new SizePicker(this.onSizePickerChanged_.bind(this));
  }

  init(): void {
    this.sizePicker.init(Dom.getElement<HTMLElement>(".pen-size-container"));

    $.subscribe(Events.PEN_SIZE_CHANGED, this.onPenSizeChanged_.bind(this));
    this.updateSelectedOption_();
  }

  onSizePickerChanged_(size: number): void {
    assertInitialized(app.penSizeService, "penSizeService").setPenSize(size);
  }

  onPenSizeChanged_(): void {
    this.updateSelectedOption_();
  }

  updateSelectedOption_(): void {
    const size = assertInitialized(
      app.penSizeService,
      "penSizeService"
    ).getPenSize();
    this.sizePicker.setSize(size);
  }
}
