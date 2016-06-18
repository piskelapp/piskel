(function () {
  var ns = $.namespace('pskl.model.piskel');

  ns.Descriptor = function (name, description, isPublic, isMultiPlane) {
    this.name = name;
    this.description = description;
    this.isPublic = isPublic;
    this.isMultiPlane = isMultiPlane;
  };
})();
