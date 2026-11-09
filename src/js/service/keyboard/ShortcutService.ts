import { Events } from "../../Events";
import { ArrayUtils } from "../../utils/Array";
import { KeyUtils } from "./KeyUtils";
import { Shortcut } from "./Shortcut";
import { type ShortcutCategory, Shortcuts } from "./Shortcuts";

type ShortcutCallback = (key: string) => boolean | void;
type ShortcutInfo = { shortcut: Shortcut; callback: ShortcutCallback };

export class ShortcutService {
  shortcuts_: ShortcutInfo[];

  constructor() {
    this.shortcuts_ = [];
  }

  /**
   * @public
   */
  init(): void {
    document.body.addEventListener("keydown", this.onKeyDown_.bind(this));
  }

  /**
   * Add a keyboard shortcut
   * @param {pskl.service.keyboard.Shortcut} shortcut
   * @param {Function} callback should return true to let the original event perform its default action
   */
  registerShortcut(shortcut: Shortcut, callback: ShortcutCallback): void {
    if (!(shortcut instanceof Shortcut)) {
      throw "Invalid shortcut argument, please use instances of pskl.service.keyboard.Shortcut";
    }

    if (typeof callback != "function") {
      throw "Invalid callback argument, please provide a function";
    }

    this.shortcuts_.push({
      shortcut: shortcut,
      callback: callback
    });
  }

  unregisterShortcut(shortcut: Shortcut): void {
    let index = -1;
    this.shortcuts_.forEach(function (s: ShortcutInfo, i: number) {
      if (s.shortcut === shortcut) {
        index = i;
      }
    });
    if (index != -1) {
      this.shortcuts_.splice(index, 1);
    }
  }

  /**
   * @private
   */
  onKeyDown_(evt: KeyboardEvent): void {
    const eventKeyOrNull = KeyUtils.createKeyFromEvent(evt);
    if (this.isInInput_(evt) || !eventKeyOrNull) {
      return;
    }
    const eventKey = eventKeyOrNull;

    this.shortcuts_.forEach((shortcutInfo: ShortcutInfo) => {
      shortcutInfo.shortcut.getKeys().forEach((shortcutKey: string) => {
        if (!KeyUtils.equals(shortcutKey, eventKey)) {
          return;
        }

        const bubble = shortcutInfo.callback(eventKey.key);
        if (bubble !== true) {
          evt.preventDefault();
        }
        $.publish(Events.KEYBOARD_EVENT, [evt]);
      });
    });
  }

  isInInput_(evt: Event): boolean {
    const targetTagName = (evt.target as HTMLElement).nodeName.toUpperCase();
    return targetTagName === "INPUT" || targetTagName === "TEXTAREA";
  }

  getShortcutById(id: string): Shortcut | null {
    return ArrayUtils.find(this.getShortcuts(), function (shortcut: Shortcut) {
      return shortcut.getId() === id;
    });
  }

  getShortcuts(): Shortcut[] {
    const shortcuts: Shortcut[] = [];
    Shortcuts.CATEGORIES.forEach(function (category: ShortcutCategory) {
      const shortcutMap: Record<string, Shortcut> = Shortcuts[category];
      Object.keys(shortcutMap).forEach(function (shortcutKey: string) {
        shortcuts.push(shortcutMap[shortcutKey]);
      });
    });
    return shortcuts;
  }

  updateShortcut(shortcut: Shortcut, keyAsString: string): void {
    const key = keyAsString.replace(/\s/g, "");

    const isForbiddenKey = Shortcuts.FORBIDDEN_KEYS.indexOf(key) != -1;
    if (isForbiddenKey) {
      $.publish(Events.SHOW_NOTIFICATION, [
        {
          content: "Key cannot be remapped (" + keyAsString + ")",
          hideDelay: 5000
        }
      ]);
    } else {
      this.removeKeyFromAllShortcuts_(key);
      shortcut.updateKeys([key]);
      $.publish(Events.SHORTCUTS_CHANGED);
    }
  }

  removeKeyFromAllShortcuts_(key: string): void {
    this.getShortcuts().forEach(function (s) {
      if (s.removeKeys([key])) {
        $.publish(Events.SHOW_NOTIFICATION, [
          {
            content: "Shortcut key removed for " + s.getId(),
            hideDelay: 5000
          }
        ]);
      }
    });
  }

  /**
   * Restore the default piskel key for all shortcuts
   */
  restoreDefaultShortcuts(): void {
    this.getShortcuts().forEach(function (shortcut: Shortcut) {
      shortcut.restoreDefault();
    });
    $.publish(Events.SHORTCUTS_CHANGED);
  }
}
