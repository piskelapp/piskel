import {
  SHORTCUT_SETTINGS_PREFIX,
  UserSettings
} from "../../utils/UserSettings";
import { KeyUtils } from "./KeyUtils";

/**
 * List of keys that cannot be remapped. Either alternate keys, which are not displayed.
 * Or really custom shortcuts such as the 1-9 for color palette shorctus
 */
export const FORBIDDEN_KEYS: string[] = [
  "1",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "?",
  "shift+?",
  "DEL",
  "BACK",
  "ENTER",
  "ctrl+Y",
  "ctrl+shift+Z"
];

/**
 * Keyboard shortcut wrapper, use it to register on the ShortcutService.
 *
 * @param {String} id          Shortcut identifier
 * @param {String} description Shortcut description
 * @param {String|Array<String>} defaultKeys  combination of modifiers + ([a-z0-9] or a special key)
 *                 Special keys are defined in KeycodeTranslator. If the shortcut supports several keys,
 *                 use an array of String keys
 */
export class Shortcut {
  id_: string;
  description_: string;
  defaultKeys_: string[];
  displayKey_: string | undefined;

  constructor(
    id: string,
    description: string,
    defaultKeys: string | string[],
    displayKey?: string
  ) {
    this.id_ = id;
    this.description_ = description;
    if (typeof defaultKeys === "string") {
      defaultKeys = [defaultKeys];
    }
    this.defaultKeys_ = defaultKeys;
    this.displayKey_ = displayKey;
  }

  static USER_SETTINGS_PREFIX: string = SHORTCUT_SETTINGS_PREFIX;

  getId(): string {
    return this.id_;
  }

  getDescription(): string {
    return this.description_;
  }

  /**
   * Retrieve the array of String keys that match this shortcut
   * @return {Array<String>} array of keys
   */
  getKeys(): string[] {
    const keys =
      UserSettings.get(this.getLocalStorageKey_()) || this.defaultKeys_;

    if (typeof keys === "string") {
      return [keys];
    }

    if (!Array.isArray(keys)) {
      return [];
    }

    return keys;
  }

  /**
   * For now, only shortcuts with a single key mapped can be edited
   * @return {Boolean} true if the shortcut can be updated
   */
  isEditable(): boolean {
    if (this.getKeys().length === 0) {
      // No key defined: can be edited.
      return true;
    }

    if (this.getKeys().length === 1) {
      // Only one key defined, can be edited if it is not using a forbidden key.
      return FORBIDDEN_KEYS.indexOf(this.getKeys()[0]) === -1;
    }

    // More than one key, can't be edited.
    return false;
  }

  isCustom(): boolean {
    const keys = this.getKeys();
    if (keys.length !== this.defaultKeys_.length) {
      return true;
    }

    // for some default keys
    return this.defaultKeys_.some(function (defaultKey: string) {
      // no match can be found in the current keys
      return !keys.some(function (key: string) {
        return KeyUtils.equals(key, defaultKey);
      });
    });
  }

  isUndefined(): boolean {
    return this.getKeys().length === 0;
  }

  /**
   * Get the key to be displayed for this shortcut, if
   * @return {[type]} [description]
   */
  getDisplayKey(): string {
    if (this.isUndefined()) {
      return "???";
    }

    if (this.displayKey_) {
      return this.displayKey_;
    }

    return this.getKeys()[0];
  }

  restoreDefault(): void {
    UserSettings.set(this.getLocalStorageKey_(), "");
  }

  updateKeys(keys: string[]): void {
    UserSettings.set(this.getLocalStorageKey_(), keys);
  }

  removeKeys(keysToRemove: string[]): boolean | undefined {
    if (!this.isEditable()) {
      return;
    }

    const keys = this.getKeys();
    const updatedKeys = keys.filter(function (key: string) {
      return !keysToRemove.some(function (keyToRemove: string) {
        return KeyUtils.equals(key, keyToRemove);
      });
    });

    if (updatedKeys.length !== keys.length) {
      this.updateKeys(updatedKeys);
      return true;
    }
    return false;
  }

  getLocalStorageKey_(): string {
    return Shortcut.USER_SETTINGS_PREFIX + this.id_;
  }
}
