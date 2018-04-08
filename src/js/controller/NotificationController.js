(function () {
  var ns = $.namespace('pskl.controller');

  ns.NotificationController = function () {};

  /**
   * @public
   */
  ns.NotificationController.prototype.init = function() {
    $.subscribe(Events.SHOW_NOTIFICATION, this.displayMessage_.bind(this));
    $.subscribe(Events.HIDE_NOTIFICATION, this.removeMessage_.bind(this));
  };

  /**
   * @private
   */
  ns.NotificationController.prototype.displayMessage_ = function (evt, messageInfo) {
    this.removeMessage_();

    var message = document.createElement('div');
    message.id = 'user-message';
    message.className = 'user-message';
    message.innerHTML = messageInfo.content;
    message.innerHTML = message.innerHTML + '<div title="Close message" class="close">x</div>';
    document.body.appendChild(message);

    message.querySelector('.close').addEventListener('click', this.removeMessage_.bind(this));

    if (messageInfo.hideDelay) {
      window.setTimeout(this.removeMessage_.bind(this), messageInfo.hideDelay);
    }
  };

  /**
   * @private
   */
  ns.NotificationController.prototype.removeMessage_ = function (evt) {
    var message = document.querySelector('#user-message');
    if (message) {
      message.parentNode.removeChild(message);
    }
  };
})();
