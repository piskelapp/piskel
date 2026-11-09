import { Events } from "../../Events";
import { app } from "../../app";
import { UserSettings } from "../../utils/UserSettings";
import { assertDefined } from "../../utils/core";
import { Shortcuts } from "../keyboard/Shortcuts";

const MIN_PENSIZE = 1;

const MAX_PENSIZE = 32;

/**
 * Service to retrieve and modify the current pen size.
 */
export class PenSizeService {
  size: number;

  constructor() {
    this.size = MIN_PENSIZE;
  }

  init(): void {
    this.size = UserSettings.get(UserSettings.PEN_SIZE);

    const shortcuts = Shortcuts;
    assertDefined(app.shortcutService, "shortcutService").registerShortcut(
      shortcuts.MISC.INCREASE_PENSIZE,
      this.increasePenSize_.bind(this)
    );
    assertDefined(app.shortcutService, "shortcutService").registerShortcut(
      shortcuts.MISC.DECREASE_PENSIZE,
      this.decreasePenSize_.bind(this)
    );
  }

  increasePenSize_(): void {
    this.setPenSize(this.size + 1);
  }

  decreasePenSize_(): void {
    this.setPenSize(this.size - 1);
  }

  getPenSize(): number {
    return this.size;
  }

  setPenSize(size: number): void {
    if (this.isPenSizeValid_(size) && size != this.size) {
      this.size = size;
      UserSettings.set(UserSettings.PEN_SIZE, size);
      $.publish(Events.PEN_SIZE_CHANGED);
    }
  }

  isPenSizeValid_(size: number): boolean {
    if (isNaN(size)) {
      return false;
    }

    return size >= MIN_PENSIZE && size <= MAX_PENSIZE;
  }
}
