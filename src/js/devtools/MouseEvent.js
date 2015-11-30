(function () {
  var ns = $.namespace('pskl.devtools');

  ns.MouseEvent = function (event, coords) {
    this.event = {
      type : event.type,
      button : event.button,
      shiftKey : event.shiftKey,
      altKey : event.altKey,
      ctrlKey : event.ctrlKey
    };
    this.coords = coords;
    this.type = 'mouse-event';
  };

  ns.MouseEvent.prototype.equals = function (otherEvent) {
    if (otherEvent && otherEvent instanceof ns.MouseEvent) {
      var sameEvent = JSON.stringify(otherEvent.event) == JSON.stringify(this.event);
      var sameCoords = JSON.stringify(otherEvent.coords) == JSON.stringify(this.coords);
      return sameEvent && sameCoords;
    } else {
      return false;
    }
  };
})();
