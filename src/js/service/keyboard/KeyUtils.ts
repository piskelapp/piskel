import { UserAgent } from "../../utils/UserAgent";
import { KeycodeTranslator } from "./KeycodeTranslator";

export type KeyModifiers = { alt: boolean; shift: boolean; ctrl: boolean };
export type ShortcutKey = { key: string; modifiers: KeyModifiers };

export const KeyUtils = {
  createKeyFromString(shortcutKeyString: string): ShortcutKey {
    shortcutKeyString = shortcutKeyString.toLowerCase();
    const modifiers = {
      alt: shortcutKeyString.indexOf("alt+") != -1,
      shift: shortcutKeyString.indexOf("shift+") != -1,
      ctrl: shortcutKeyString.indexOf("ctrl+") != -1
    };

    const parts = shortcutKeyString.split(/\+(?!$)/);
    const key = parts[parts.length - 1];

    return {
      key: key.toUpperCase(),
      modifiers: modifiers
    };
  },

  createKeyFromEvent(evt: KeyboardEvent): ShortcutKey | null {
    const keycode = evt.which || evt.keyCode;
    const key = KeycodeTranslator.toChar(keycode);
    if (!key) {
      return null;
    }

    return {
      key: key.toUpperCase(),
      modifiers: {
        alt: evt.altKey,
        shift: evt.shiftKey,
        ctrl: KeyUtils.isCtrlKeyPressed_(evt)
      }
    };
  },

  equals(key1: string | ShortcutKey, key2: string | ShortcutKey): boolean {
    const a =
      typeof key1 === "string" ? KeyUtils.createKeyFromString(key1) : key1;
    const b =
      typeof key2 === "string" ? KeyUtils.createKeyFromString(key2) : key2;

    const isKeyMatching =
      a.key === b.key &&
      a.modifiers.alt === b.modifiers.alt &&
      a.modifiers.shift === b.modifiers.shift &&
      a.modifiers.ctrl === b.modifiers.ctrl;

    return isKeyMatching;
  },

  stringify(shortcutKeyObject: ShortcutKey): string {
    const modifierString = KeyUtils.getModifiersString(
      shortcutKeyObject.modifiers
    );
    if (modifierString) {
      return modifierString + "+" + shortcutKeyObject.key;
    }

    return shortcutKeyObject.key;
  },

  getModifiersString(modifiers: KeyModifiers): string {
    const keyBuffer: string[] = [];

    if (modifiers.alt) {
      keyBuffer.push("alt");
    }
    if (modifiers.ctrl) {
      keyBuffer.push("ctrl");
    }
    if (modifiers.shift) {
      keyBuffer.push("shift");
    }

    return keyBuffer.join("+");
  },

  isCtrlKeyPressed_(evt: KeyboardEvent): boolean {
    return UserAgent.isMac ? evt.metaKey : evt.ctrlKey;
  }
};
