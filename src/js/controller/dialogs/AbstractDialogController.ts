import { Events } from "../../Events";
import { Dom } from "../../utils/Dom";
import { EventUtils, type ListenerCallback } from "../../utils/Event";

export class AbstractDialogController {
  init(initArgs?: unknown): void {
    const closeButton = Dom.getElement<HTMLElement>(".dialog-close");
    this.addEventListener(closeButton, "click", this.closeDialog);
  }

  addEventListener(
    el: EventTarget | string,
    type: string,
    cb: ListenerCallback
  ): void {
    EventUtils.addEventListener(el, type, cb, this);
  }

  destroy(): void {
    EventUtils.removeAllEventListeners(this);
  }

  closeDialog(): void {
    $.publish(Events.DIALOG_HIDE);
  }

  setTitle(title: string): void {
    const dialogTitle = document.querySelector<HTMLElement>(".dialog-title");
    if (dialogTitle) {
      dialogTitle.innerText = title;
    }
  }
}
