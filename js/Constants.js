// TODO(grosbouddha): put under pskl namespace.
var Constants = {
    DEFAULT_SIZE : {
        height : 32,
        width : 32
    },

    MAX_HEIGHT : 128,
    MAX_WIDTH : 128,

    DEFAULT_PEN_COLOR : '#000000',  
    TRANSPARENT_COLOR : 'TRANSPARENT',
    
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
    PISKEL_SERVICE_URL: 'http://3.piskel-app.appspot.com',

    GRID_STROKE_WIDTH: 1,
    GRID_STROKE_COLOR: "lightgray",

    LEFT_BUTTON : "left_button_1",
    RIGHT_BUTTON : "right_button_2"
};