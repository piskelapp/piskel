(function () {
  var ns = $.namespace("pskl.controller");

  ns.NotificationController = function () {};

  /**
   * @private
   */
  ns.NotificationController.prototype.displayMessage_ = function (evt, messageInfo) {
    var message = document.createElement('div');
    message.id = "user-message";
    message.className = "user-message";
    message.innerHTML = messageInfo.content;
    message.innerHTML = message.innerHTML + "<div title='Close message' class='close'>x</div>";
    document.body.appendChild(message);
    $(message).find(".close").click($.proxy(this.removeMessage_, this));
    if(messageInfo.behavior) {
      messageInfo.behavior(message);
    }
  };

  /**
   * @private
   */
  ns.NotificationController.prototype.removeMessage_ = function (evt) {
    var message = $("#user-message");
    if (message.length) {
      message.remove();
    }
  };

  /**
   * @public
   */
  ns.NotificationController.prototype.init = function() {
    $.subscribe(Events.SHOW_NOTIFICATION, $.proxy(this.displayMessage_, this));
    $.subscribe(Events.HIDE_NOTIFICATION, $.proxy(this.removeMessage_, this));
  };
})();
