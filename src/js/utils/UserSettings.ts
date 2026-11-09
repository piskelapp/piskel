import { Constants } from "../Constants";
import { Events } from "../Events";

/** Prefix of the keys under which the customized shortcuts are saved. */
export const SHORTCUT_SETTINGS_PREFIX = "shortcut.";

export type ResizeSettings = {
  maintainRatio: boolean;
  resizeContent: boolean;
  origin: string;
};

export type UserSettingsValues = {
  GRID_COLOR: string;
  GRID_ENABLED: boolean;
  GRID_WIDTH: number;
  GRID_SPACING: number;
  MAX_FPS: number;
  DEFAULT_SIZE: { width: number; height: number };
  CANVAS_BACKGROUND: string;
  SELECTED_PALETTE: string;
  SEAMLESS_OPACITY: number;
  SEAMLESS_MODE: boolean;
  PREVIEW_SIZE: string;
  ONION_SKIN: boolean;
  LAYER_PREVIEW: boolean;
  LAYER_OPACITY: number;
  EXPORT_SCALE: number;
  EXPORT_TAB: string;
  EXPORT_GIF_REPEAT: boolean;
  PEN_SIZE: number;
  RESIZE_SETTINGS: ResizeSettings;
  COLOR_FORMAT: string;
  TRANSFORM_SHOW_MORE: boolean;
  PREFERENCES_TAB: string;
};

export type UserSettingKey = keyof UserSettingsValues;

export type UserSettingsApi = { [K in UserSettingKey]: K } & {
  KEY_TO_DEFAULT_VALUE_MAP_: UserSettingsValues;
  cache_: Record<string, unknown>;
  get<K extends UserSettingKey>(key: K): UserSettingsValues[K];
  /** For keys built at runtime, such as those of the shortcuts. */
  get(key: string): string | undefined;
  set<K extends UserSettingKey>(key: K, value: UserSettingsValues[K]): void;
  set(key: string, value: string | number | boolean | object | null): void;
  readFromLocalStorage_(
    key: string
  ): string | number | boolean | object | null | undefined;
  writeToLocalStorage_(key: string, value: unknown): void;
  readFromDefaults_(key: string): unknown;
  checkKeyValidity_(key: string): boolean | undefined;
};

export const UserSettings: UserSettingsApi = {
  GRID_COLOR: "GRID_COLOR",
  GRID_ENABLED: "GRID_ENABLED",
  GRID_WIDTH: "GRID_WIDTH",
  GRID_SPACING: "GRID_SPACING",
  MAX_FPS: "MAX_FPS",
  DEFAULT_SIZE: "DEFAULT_SIZE",
  CANVAS_BACKGROUND: "CANVAS_BACKGROUND",
  SELECTED_PALETTE: "SELECTED_PALETTE",
  SEAMLESS_OPACITY: "SEAMLESS_OPACITY",
  SEAMLESS_MODE: "SEAMLESS_MODE",
  PREVIEW_SIZE: "PREVIEW_SIZE",
  ONION_SKIN: "ONION_SKIN",
  LAYER_PREVIEW: "LAYER_PREVIEW",
  LAYER_OPACITY: "LAYER_OPACITY",
  EXPORT_SCALE: "EXPORT_SCALE",
  EXPORT_TAB: "EXPORT_TAB",
  EXPORT_GIF_REPEAT: "EXPORT_GIF_REPEAT",
  PEN_SIZE: "PEN_SIZE",
  RESIZE_SETTINGS: "RESIZE_SETTINGS",
  COLOR_FORMAT: "COLOR_FORMAT",
  TRANSFORM_SHOW_MORE: "TRANSFORM_SHOW_MORE",
  PREFERENCES_TAB: "PREFERENCES_TAB",
  KEY_TO_DEFAULT_VALUE_MAP_: {
    GRID_COLOR: Constants.TRANSPARENT_COLOR,
    GRID_ENABLED: false,
    GRID_WIDTH: 1,
    GRID_SPACING: 1,
    MAX_FPS: 24,
    DEFAULT_SIZE: {
      width: Constants.DEFAULT.WIDTH,
      height: Constants.DEFAULT.HEIGHT
    },
    CANVAS_BACKGROUND: "lowcont-dark-canvas-background",
    SELECTED_PALETTE: Constants.CURRENT_COLORS_PALETTE_ID,
    SEAMLESS_OPACITY: 0.3,
    SEAMLESS_MODE: false,
    PREVIEW_SIZE: "original",
    ONION_SKIN: false,
    LAYER_OPACITY: 0.2,
    LAYER_PREVIEW: true,
    EXPORT_SCALE: 1,
    EXPORT_TAB: "gif",
    EXPORT_GIF_REPEAT: true,
    PEN_SIZE: 1,
    RESIZE_SETTINGS: {
      maintainRatio: true,
      resizeContent: false,
      origin: "TOPLEFT"
    },
    COLOR_FORMAT: "hex",
    TRANSFORM_SHOW_MORE: false,
    PREFERENCES_TAB: "misc"
  },

  /**
   * @private
   */
  cache_: {},

  /**
   * Static method to access a user defined settings value ot its default
   * value if not defined yet.
   */
  get(key: string) {
    this.checkKeyValidity_(key);
    if (!(key in this.cache_)) {
      const storedValue = this.readFromLocalStorage_(key);
      if (typeof storedValue !== "undefined" && storedValue !== null) {
        this.cache_[key] = storedValue;
      } else {
        this.cache_[key] = this.readFromDefaults_(key);
      }
    }
    // The cache only holds values of the type declared for their key.
    const cache: object = this.cache_;
    return Reflect.get(cache, key);
  },

  set(key: string, value: string | number | boolean | object | null) {
    this.checkKeyValidity_(key);
    this.cache_[key] = value;
    this.writeToLocalStorage_(key, value);

    $.publish(Events.USER_SETTINGS_CHANGED, [key, value]);
  },

  /**
   * @private
   */
  readFromLocalStorage_(key: string) {
    let value: string | undefined = window.localStorage[key];
    if (typeof value != "undefined") {
      value = JSON.parse(value);
    }
    return value;
  },

  /**
   * @private
   */
  writeToLocalStorage_(key: string, value: unknown) {
    // TODO(grosbouddha): Catch storage exception here.
    window.localStorage[key] = JSON.stringify(value);
  },

  /**
   * @private
   */
  readFromDefaults_(key: string) {
    const defaults: object = this.KEY_TO_DEFAULT_VALUE_MAP_;
    return Reflect.get(defaults, key);
  },

  /**
   * @private
   */
  checkKeyValidity_(key: string) {
    if (key.indexOf(SHORTCUT_SETTINGS_PREFIX) === 0) {
      return true;
    }

    const isValidKey = key in this.KEY_TO_DEFAULT_VALUE_MAP_;
    if (!isValidKey) {
      console.error(
        "UserSettings key <" + key + "> not found in supported keys."
      );
    }
  }
};
