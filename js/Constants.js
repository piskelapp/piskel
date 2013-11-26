// TODO(grosbouddha): put under pskl namespace.
var Constants = {
  DEFAULT : {
    HEIGHT : 32,
    WIDTH : 32,
    FPS : 12
  },

  MODEL_VERSION : 2,

  MAX_HEIGHT : 1024,
  MAX_WIDTH : 1024,

  PREVIEW_FILM_SIZE : 120,

  DEFAULT_PEN_COLOR : '#000000',
  TRANSPARENT_COLOR : 'rgba(0, 0, 0, 0)',

  /*
   * Fake semi-transparent color used to highlight transparent
   * strokes and rectangles:
   */
  SELECTION_TRANSPARENT_COLOR: 'rgba(255, 255, 255, 0.6)',

  /*
   * When a tool is hovering the drawing canvas, we highlight the eventual
   * pixel target with this color:
   */
  TOOL_TARGET_HIGHLIGHT_COLOR: 'rgba(255, 255, 255, 0.2)',

  /*
   * Default entry point for piskel web service:
   */
  STATIC : {
    URL : {
      SAVE : 'http://3.piskel-app.appspot.com/store',
      GET : 'http://3.piskel-app.appspot.com/get'
    }
  },
  APPENGINE : {
    URL : {
      SAVE : 'save'
    }
  },
  IMAGE_SERVICE_UPLOAD_URL : 'http://screenletstore.appspot.com/__/upload',
  IMAGE_SERVICE_GET_URL : 'http://screenletstore.appspot.com/img/',

  GRID_STROKE_WIDTH: 1,
  ZOOMED_OUT_BACKGROUND_COLOR : '#A0A0A0',

  LEFT_BUTTON : 'left_button_1',
  RIGHT_BUTTON : 'right_button_2',
  MOUSEMOVE_THROTTLING : 10,

  ABSTRACT_FUNCTION : function () {throw 'abstract method should be implemented';}
};