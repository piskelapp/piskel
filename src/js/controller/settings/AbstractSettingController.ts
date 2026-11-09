import { EventUtils, type ListenerCallback } from "../../utils/Event";

export class AbstractSettingController {
  addEventListener(
    el: EventTarget | string,
    type: string,
    callback: ListenerCallback
  ): void {
    EventUtils.addEventListener(el, type, callback, this);
  }

  destroy(): void {
    EventUtils.removeAllEventListeners(this);
    this.nullifyDomReferences_();
  }

  nullifyDomReferences_(): void {
    for (const key of Object.keys(this)) {
      const value: unknown = Reflect.get(this, key);
      const isHTMLElement =
        typeof value === "object" &&
        value !== null &&
        "nodeName" in value &&
        value.nodeName;
      if (isHTMLElement) {
        Reflect.set(this, key, null);
      }
    }
  }
}
