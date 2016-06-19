(function () {
  var ns = $.namespace('pskl.model.piskel');

  ns.Descriptor = function (name, description, isPublic) {
    this.name = name;
    this.description = description;
    this.isPublic = isPublic;
  };
})();
