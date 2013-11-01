(function () {
  var ns = $.namespace('pskl.rendering');

  ns.AbstractRenderer = function () {};

  ns.AbstractRenderer.prototype.render =         function (frame)  {throw 'abstract method should be implemented';};
  ns.AbstractRenderer.prototype.clear =          function ()       {throw 'abstract method should be implemented';};

  ns.AbstractRenderer.prototype.getCoordinates = function (x, y)   {throw 'abstract method should be implemented';};

  ns.AbstractRenderer.prototype.setGridEnabled = function (b)      {throw 'abstract method should be implemented';};
  ns.AbstractRenderer.prototype.isGridEnabled =  function ()       {throw 'abstract method should be implemented';};

  ns.AbstractRenderer.prototype.setZoom =        function (zoom)   {throw 'abstract method should be implemented';};
  ns.AbstractRenderer.prototype.getZoom =        function ()       {throw 'abstract method should be implemented';};

  ns.AbstractRenderer.prototype.moveOffset =     function (x, y)   {throw 'abstract method should be implemented';};
  ns.AbstractRenderer.prototype.getOffset =      function ()       {throw 'abstract method should be implemented';};

  ns.AbstractRenderer.prototype.setDisplaySize = function (w, h)   {throw 'abstract method should be implemented';};
  ns.AbstractRenderer.prototype.getDisplaySize = function ()       {throw 'abstract method should be implemented';};
})();