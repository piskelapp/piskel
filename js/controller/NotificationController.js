/*
 * @provide pskl.NotificationService
 *
 */
$.namespace("pskl");

pskl.NotificationService = (function() {

	/**
     * @private
     */
    var displayMessage_ = function (evt, messageInfo) {
      var message = document.createElement('div');
      message.id = "user-message";
      message.className = "user-message";
      message.innerHTML = messageInfo.content;
      message.innerHTML = message.innerHTML + "<div title='Close message' class='close'>x</div>";
      document.body.appendChild(message);
      $(message).find(".close").click(removeMessage_);
      if(messageInfo.behavior) messageInfo.behavior(message);
    };

    /**
     * @private
     */
    var removeMessage_ = function (evt) {
      var message = $("#user-message");
      if (message.length) {
        message.remove();
      }
    };

	return {
		init: function() {
			$.subscribe(Events.SHOW_NOTIFICATION, displayMessage_);
			$.subscribe(Events.HIDE_NOTIFICATION, removeMessage_);
		}
	};
})();
