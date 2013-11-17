(function () {
  var ns = $.namespace('service.keyboard');

  ns.KeyboardEvent = function (eventName, args, description) {
    this.eventName = eventName;
    this.args = args;
    this.description = description;
  };

  ns.KeyboardEvent.prototype.fire = function () {
    $.publish(this.eventName, this.args);
  };

  ns.KeyboardEvent.prototype.getDescription = function () {
    return this.description;
  };
})();
