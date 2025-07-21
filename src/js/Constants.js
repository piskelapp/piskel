// TODO(grosbouddha): put under pskl namespace.
var Constants = {
  DEFAULT : {
    HEIGHT : 32,
    WIDTH : 32,
    FPS : 12,
    LAYER_OPACITY : 0.2
  },

  MODEL_VERSION : 2,

  MAX_HEIGHT : 1024,
  MAX_WIDTH : 1024,

  MAX_PALETTE_COLORS : 256,
  // allow current colors service to get up to 256 colors.
  // GIF generation is different if the color count goes over 256.
  MAX_WORKER_COLORS : 256,

  PREVIEW_FILM_SIZE : 96,
  ANIMATED_PREVIEW_WIDTH : 200,
  // Keep in sync with padding-left: 10px in layout.css
  RIGHT_COLUMN_PADDING_LEFT : 10,

  DEFAULT_PEN_COLOR : '#000000',
  TRANSPARENT_COLOR : 'rgba(0, 0, 0, 0)',
  SEAMLESS_MODE_OVERLAY_COLOR : 'rgba(255, 255, 255, 0)',

  CURRENT_COLORS_PALETTE_ID : '__current-colors',

  /*
   * Fake semi-transparent color used to highlight transparent
   * strokes and rectangles:
   */
  SELECTION_TRANSPARENT_COLOR: 'rgba(160, 215, 240, 0.6)',

  /*
   * When a tool is hovering the drawing canvas, we highlight the eventual
   * pixel target with this color:
   */
  TOOL_HIGHLIGHT_COLOR_LIGHT: 'rgba(255, 255, 255, 0.2)',
  TOOL_HIGHLIGHT_COLOR_DARK: 'rgba(0, 0, 0, 0.2)',

  ZOOMED_OUT_BACKGROUND_COLOR : '#A0A0A0',

  LEFT_BUTTON : 0,
  MIDDLE_BUTTON : 1,
  RIGHT_BUTTON : 2,
  MOUSEMOVE_THROTTLING : 10,

  ABSTRACT_FUNCTION : function () {throw 'abstract method should be implemented';},
  EMPTY_FUNCTION : function () {},

  // TESTS
  DRAWING_TEST_FOLDER : 'drawing',

  // Maximum size of a sprite that can be saved on piskelapp datastore.
  // This size will be compared to the length of the stringified serialization of the sprite.
  // This is an approximation at best but gives correct results in most cases.
  // The datastore limit is 1 MiB, which we roughly approximate to 1 million characters.
  APPENGINE_SAVE_LIMIT : 1 * 1024 * 1024,

  // Message displayed when an action will lead to erase the current animation.
  CONFIRM_OVERWRITE: 'This will replace your current animation, are you sure you want to continue?',

  // SERVICE URLS
  APPENGINE_SAVE_URL : 'save'
};
