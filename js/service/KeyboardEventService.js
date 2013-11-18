(function () {
  var ns = $.namespace("pskl.service");

  ns.KeyboardEventService = function () {
    this.keyboardActions_ = {
      "ctrl" : {
        "z" : Events.UNDO,
        "y" : Events.REDO,
        "x" : Events.CUT,
        "c" : Events.COPY,
        "v" : Events.PASTE
      },
      "shift" : {
        "?" : Events.TOGGLE_HELP
      },
      "x" : Events.SWAP_COLORS
    };

    // See ToolController
    // TODO : Allow for other classes to register new shortcuts
    var toolKeys = 'pveblrcmzso'.split('');
    toolKeys.forEach(function (key) {
      this.keyboardActions_[key] = Events.SELECT_TOOL;
    }.bind(this));
  };


  /**
   * @public
   */
  ns.KeyboardEventService.prototype.init = function() {
    $(document.body).keydown($.proxy(this.onKeyUp_, this));
  };

  /**
   * @private
   */
  ns.KeyboardEventService.prototype.onKeyUp_ = function(evt) {
    var eventToTrigger;

    // jquery names FTW ...
    var keycode = evt.which;
    var charkey = pskl.service.keyboard.KeycodeTranslator.toChar(keycode);

    if(charkey) {
      if (this.isCtrlKeyPressed_(evt)) {
        eventToTrigger = this.keyboardActions_.ctrl[charkey];
      } else if (this.isShiftKeyPressed_(evt)) {
        eventToTrigger = this.keyboardActions_.shift[charkey];
      } else {
        eventToTrigger = this.keyboardActions_[charkey];
      }

      if(eventToTrigger) {
        $.publish(eventToTrigger, charkey);
        evt.preventDefault();
      }
    }
  };

  ns.KeyboardEventService.prototype.isCtrlKeyPressed_ = function (evt) {
    return this.isMac_() ? evt.metaKey : evt.ctrlKey;
  };

  ns.KeyboardEventService.prototype.isShiftKeyPressed_ = function (evt) {
    return evt.shiftKey;
  };

  ns.KeyboardEventService.prototype.isMac_ = function () {
    return navigator.appVersion.indexOf("Mac") != -1;
  };
})();
