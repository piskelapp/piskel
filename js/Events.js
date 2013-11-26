// TODO(grosbouddha): put under pskl namespace.
var Events = {

  TOOL_SELECTED : "TOOL_SELECTED",
  TOOL_RELEASED : "TOOL_RELEASED",
  SELECT_PRIMARY_COLOR: "SELECT_PRIMARY_COLOR",
  SELECT_SECONDARY_COLOR: "SELECT_SECONDARY_COLOR",

  /**
   *  When this event is emitted, a request is sent to the localstorage
   *  Service to save the current framesheet. The storage service
   *  may not immediately store data (internal throttling of requests).
   */
  LOCALSTORAGE_REQUEST: "LOCALSTORAGE_REQUEST",

  /**
   * Fired each time a user setting change.
   * The payload will be:
   *   1st argument: Name of the settings
   *   2nd argument: New value
   */
  USER_SETTINGS_CHANGED: "USER_SETTINGS_CHANGED",

  CLOSE_SETTINGS_DRAWER : "CLOSE_SETTINGS_DRAWER",

  /**
   * The framesheet was reseted and is now probably drastically different.
   * Number of frames, content of frames, color used for the palette may have changed.
   */
  PISKEL_RESET: "PISKEL_RESET",

  FRAME_SIZE_CHANGED : "FRAME_SIZE_CHANGED",

  SELECTION_CREATED: "SELECTION_CREATED",
  SELECTION_MOVE_REQUEST: "SELECTION_MOVE_REQUEST",
  SELECTION_DISMISSED: "SELECTION_DISMISSED",

  SHOW_NOTIFICATION: "SHOW_NOTIFICATION",
  HIDE_NOTIFICATION: "HIDE_NOTIFICATION",

  // Events triggered by keyboard
  SELECT_TOOL : "SELECT_TOOL"
};