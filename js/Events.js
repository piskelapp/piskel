Events = {
    
    TOOL_SELECTED : "TOOL_SELECTED",
    TOOL_RELEASED : "TOOL_RELEASED",
    COLOR_SELECTED: "COLOR_SELECTED",

    /**
     *  When this event is emitted, a request is sent to the localstorage
     *  Service to save the current framesheet. The storage service 
     *  may not immediately store data (internal throttling of requests).
     */
    LOCALSTORAGE_REQUEST: "LOCALSTORAGE_REQUEST",

    CANVAS_RIGHT_CLICKED: "CANVAS_RIGHT_CLICKED",

    /**
     * Event to request a refresh of the display.
     * A bit overkill but, it's just workaround in our current drawing system.
     * TODO: Remove or rework when redraw system is refactored.
     */
    REFRESH: "REFRESH",

    /**
     * Temporary event to bind the redraw of right preview film to the canvas.
     * This redraw should be driven by model updates.
     * TODO(vincz): Remove.
     */
    REDRAW_PREVIEWFILM: "REDRAW_PREVIEWFILM",

    GRID_DISPLAY_STATE_CHANGED: "GRID_DISPLAY_STATE_CHANGED",

    /**
     * The framesheet was reseted and is now probably drastically different.
     * Number of frames, content of frames, color used for the palette may have changed.
     */
    FRAMESHEET_RESET: "FRAMESHEET_RESET",

    FRAME_SIZE_CHANGED : "FRAME_SIZE_CHANGED",

    CURRENT_FRAME_SET: "CURRENT_FRAME_SET",

    SELECTION_CREATED: "SELECTION_CREATED",
    SELECTION_MOVE_REQUEST: "SELECTION_MOVE_REQUEST",
    SELECTION_DISMISSED: "SELECTION_DISMISSED",
    
    SHOW_NOTIFICATION: "SHOW_NOTIFICATION",
    HIDE_NOTIFICATION: "HIDE_NOTIFICATION",

    UNDO: "UNDO",
    REDO: "REDO",
    CUT: "CUT",
    COPY: "COPY",
    PASTE: "PASTE"    
};