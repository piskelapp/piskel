import { Events } from "../Events";
import type { PublicPiskelController } from "../controller/piskel/PublicPiskelController";

export class ClipboardService {
  piskelController: PublicPiskelController;

  constructor(piskelController: PublicPiskelController) {
    this.piskelController = piskelController;
  }

  init(): void {
    window.addEventListener("copy", this._onCopy.bind(this), true);
    window.addEventListener("cut", this._onCut.bind(this), true);
    window.addEventListener("paste", this._onPaste.bind(this), true);
  }

  _onCut(event: ClipboardEvent): void {
    $.publish(Events.CLIPBOARD_CUT, event);
  }

  _onCopy(event: ClipboardEvent): void {
    $.publish(Events.CLIPBOARD_COPY, event);
  }

  _onPaste(event: ClipboardEvent): void {
    $.publish(Events.CLIPBOARD_PASTE, event);
  }
}
