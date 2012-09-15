(function () {
	var ns = $.namespace("pskl");

	ns.KeyManager = function () {
		$(document.body).keydown($.proxy(this.onKeyUp_, this));
	};

	// Kind of object that make you want to stop front-end _engineering_:
	ns.KeyManager.prototype.CharCodeToKeyCodeMap = {

		90 : "z",
		89 : "y",
		88 : "x",
		67 : "c",
		86 : "v"
	};

	ns.KeyManager.prototype.KeyboardActions = {

		"ctrl" : {
			"z" : Events.UNDO,
			"y" : Events.REDO,
			"x" : Events.CUT,
			"c" : Events.COPY,
			"v" : Events.PASTE
		}
	};

	

	ns.KeyManager.prototype.onKeyUp_ = function(evt) {
		var isMac = false;
		if (navigator.appVersion.indexOf("Mac")!=-1) {
			// Welcome in mac world where vowels are consons and meta used instead of ctrl:
			isMac = true;
		}
		
		if (isMac ? evt.metaKey : evt.ctrlKey) {
			// Get key pressed:
			var letter = this.CharCodeToKeyCodeMap[evt.which];
			if(letter) {
				var eventToTrigger = this.KeyboardActions.ctrl[letter];
				if(eventToTrigger) {
					$.publish(eventToTrigger);
				}
			}
		}
	};
	
})();