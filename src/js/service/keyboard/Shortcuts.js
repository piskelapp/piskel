(function () {
  var ns = $.namespace('pskl.service.keyboard');

  var createShortcut = function (id, description, defaultKey, displayKey) {
    return new ns.Shortcut(id, description, defaultKey, displayKey);
  };

  ns.Shortcuts = {
    /**
     * List of keys that cannot be remapped. Either alternate keys, which are not displayed.
     * Or really custom shortcuts such as the 1-9 for color palette shorctus
     */
    FORBIDDEN_KEYS : ['1', '2', '3', '4', '5', '6', '7', '8', '9', '?', 'shift+?',
      'DEL', 'BACK', 'ENTER', 'ctrl+Y', 'ctrl+shift+Z'],

    /**
     * Syntax : createShortcut(id, description, default key(s))
     */
    TOOL : {
      PEN : createShortcut('tool-pen', 'Pen tool', 'P'),
      MIRROR_PEN : createShortcut('tool-vertical-mirror-pen', 'Vertical mirror pen tool', 'V'),
      PAINT_BUCKET : createShortcut('tool-paint-bucket', 'Paint bucket tool', 'B'),
      COLORSWAP : createShortcut('tool-colorswap', 'Magic bucket tool', 'A'),
      ERASER : createShortcut('tool-eraser', 'Eraser pen tool', 'E'),
      STROKE : createShortcut('tool-stroke', 'Stroke tool', 'L'),
      RECTANGLE : createShortcut('tool-rectangle', 'Rectangle tool', 'R'),
      CIRCLE : createShortcut('tool-circle', 'Circle tool', 'C'),
      MOVE : createShortcut('tool-move', 'Move tool', 'M'),
      SHAPE_SELECT : createShortcut('tool-shape-select', 'Shape selection', 'Z'),
      RECTANGLE_SELECT : createShortcut('tool-rectangle-select', 'Rectangle selection', 'S'),
      LASSO_SELECT : createShortcut('tool-lasso-select', 'Lasso selection', 'H'),
      LIGHTEN : createShortcut('tool-lighten', 'Lighten tool', 'U'),
      DITHERING : createShortcut('tool-dithering', 'Dithering tool', 'T'),
      COLORPICKER : createShortcut('tool-colorpicker', 'Color picker', 'O')
    },

    SELECTION : {
      CUT : createShortcut('selection-cut', 'Cut selection', 'ctrl+X'),
      COPY : createShortcut('selection-copy', 'Copy selection', 'ctrl+C'),
      PASTE : createShortcut('selection-paste', 'Paste selection', 'ctrl+V'),
      DELETE : createShortcut('selection-delete', 'Delete selection', ['DEL', 'BACK']),
      COMMIT : createShortcut('selection-commit', 'Commit selection', ['ENTER'])
    },

    MISC : {
      RESET_ZOOM : createShortcut('reset-zoom', 'Reset zoom level', '0'),
      INCREASE_ZOOM : createShortcut('increase-zoom', 'Increase zoom level', '+'),
      DECREASE_ZOOM : createShortcut('decrease-zoom', 'Decrease zoom level', '-'),
      INCREASE_PENSIZE : createShortcut('increase-pensize', 'Increase pen size', ']'),
      DECREASE_PENSIZE : createShortcut('decrease-pensize', 'Decrease pen size', '['),
      UNDO : createShortcut('undo', 'Undo', 'ctrl+Z'),
      REDO : createShortcut('redo', 'Redo', ['ctrl+Y', 'ctrl+shift+Z']),
      PREVIOUS_FRAME : createShortcut('previous-frame', 'Select previous frame', 'up'),
      NEXT_FRAME : createShortcut('next-frame', 'Select next frame', 'down'),
      NEW_FRAME : createShortcut('new-frame', 'Create new empty frame', 'N'),
      DUPLICATE_FRAME : createShortcut('duplicate-frame', 'Duplicate selected frame', 'shift+N'),
      CHEATSHEET : createShortcut('cheatsheet', 'Open the keyboard shortcut cheatsheet', ['?', 'shift+?']),
      X1_PREVIEW : createShortcut('x1-preview', 'Select original size preview', 'alt+1'),
      BEST_PREVIEW : createShortcut('best-preview', 'Select best size preview', 'alt+2'),
      FULL_PREVIEW : createShortcut('full-preview', 'Select full size preview', 'alt+3'),
      ONION_SKIN : createShortcut('onion-skin', 'Toggle onion skin', 'alt+O'),
      LAYER_PREVIEW : createShortcut('layer-preview', 'Toggle layer preview', 'alt+L'),
      CLOSE_POPUP : createShortcut('close-popup', 'Close an opened popup', 'ESC')
    },

    STORAGE : {
      SAVE : createShortcut('save', 'Save the current sprite', 'ctrl+S'),
      OPEN : createShortcut('open', '(desktop) Open a .piskel file', 'ctrl+O'),
      SAVE_AS : createShortcut('save-as', '(desktop) Save as new', 'ctrl+shift+S')
    },

    COLOR : {
      SWAP : createShortcut('swap-colors', 'Swap primary/secondary colors', 'X'),
      RESET : createShortcut('reset-colors', 'Reset default colors', 'D'),
      CREATE_PALETTE : createShortcut('create-palette', 'Open the palette creation popup', 'alt+P'),
      PREVIOUS_COLOR : createShortcut('previous-color', 'Select the previous color in the current palette', '<'),
      NEXT_COLOR : createShortcut('next-color', 'Select the next color in the current palette', '>'),
      SELECT_COLOR : createShortcut('select-color', 'Select a palette color in the current palette',
        '123456789'.split(''), '1 to 9')
    },

    CATEGORIES : ['TOOL', 'SELECTION', 'MISC', 'STORAGE', 'COLOR']
  };
})();
