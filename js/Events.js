Events = {
	
	TOOL_SELECTED : "TOOL_SELECTED",
	COLOR_SELECTED: "COLOR_SELECTED",
	COLOR_USED: "COLOR_USED",

	/**
	 *  When this event is emitted, a request is sent to the localstorage
	 *  Service to save the current framesheet. The storage service 
	 *  may not immediately store data (internal throttling of requests).
	 */
	LOCALSTORAGE_REQUEST: "LOCALSTORAGE_REQUEST",

	CANVAS_RIGHT_CLICKED: "CANVAS_RIGHT_CLICKED",
	CANVAS_RIGHT_CLICK_RELEASED: "CANVAS_RIGHT_CLICK_RELEASED",

	/**
	 * Event to requset a refresh of the display.
	 * A bit overkill but, it's just workaround in our current drawing system.
	 * TODO: Remove or rework when redraw system is refactored.
	 */
	REFRESH: "REFRESH",
	SHOW_NOTIFICATION: "SHOW_NOTIFICATION",
	HIDE_NOTIFICATION: "HIDE_NOTIFICATION"

};