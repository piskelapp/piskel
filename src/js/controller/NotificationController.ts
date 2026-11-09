import { Events, type NotificationInfo } from "../Events";
import type { JQueryEvent } from "../lib/jquery-1.8.0";
import { Dom } from "../utils/Dom";
import { assertDefined } from "../utils/core";

export class NotificationController {
  /**
   * @public
   */
  init(): void {
    $.subscribe(Events.SHOW_NOTIFICATION, this.displayMessage_.bind(this));
    $.subscribe(Events.HIDE_NOTIFICATION, this.removeMessage_.bind(this));
  }

  /**
   * @private
   */
  displayMessage_(evt: JQueryEvent, messageInfo: NotificationInfo): void {
    this.removeMessage_();

    const message = document.createElement("div");
    message.id = "user-message";
    message.className = "user-message";
    message.innerHTML = messageInfo.content;
    message.innerHTML =
      message.innerHTML + '<div title="Close message" class="close">x</div>';
    document.body.appendChild(message);

    Dom.getElement<HTMLElement>(".close", message).addEventListener(
      "click",
      this.removeMessage_.bind(this)
    );

    if (messageInfo.hideDelay) {
      window.setTimeout(this.removeMessage_.bind(this), messageInfo.hideDelay);
    }
  }

  /**
   * @private
   */
  removeMessage_(evt?: JQueryEvent): void {
    const message = document.querySelector("#user-message");
    if (message) {
      assertDefined(message.parentNode, "parentNode").removeChild(message);
    }
  }
}
