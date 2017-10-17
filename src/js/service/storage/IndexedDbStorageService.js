(function () {
  var ns = $.namespace('pskl.service.storage');

  ns.IndexedDbStorageService = function (piskelController) {
    this.piskelController = piskelController;
    this.piskelDatabase = new pskl.database.PiskelDatabase();
  };

  ns.IndexedDbStorageService.prototype.init = function () {
    this.piskelDatabase.init().catch(function (e) {
      console.log('Failed to initialize PiskelDatabase, local browser saves will be unavailable.');
    });
  };

  ns.IndexedDbStorageService.prototype.save = function (piskel) {
    var name = piskel.getDescriptor().name;
    var description = piskel.getDescriptor().description;
    var date = Date.now();
    var serialized = pskl.utils.serialization.Serializer.serialize(piskel);

    return this.save_(name, description, date, serialized);
  };

  ns.IndexedDbStorageService.prototype.save_ = function (name, description, date, serialized) {
    return this.piskelDatabase.get(name).then(function (piskelData) {
      if (typeof piskelData !== 'undefined') {
        return this.piskelDatabase.update(name, description, date, serialized);
      } else {
        return this.piskelDatabase.create(name, description, date, serialized);
      }
    }.bind(this));
  };

  ns.IndexedDbStorageService.prototype.load = function (name) {
    return this.piskelDatabase.get(name).then(function (piskelData) {
      if (typeof piskelData !== 'undefined') {
        var serialized = piskelData.serialized;
        pskl.utils.serialization.Deserializer.deserialize(
          JSON.parse(serialized),
          function (piskel) {
            pskl.app.piskelController.setPiskel(piskel);
          }
        );
      } else {
        console.log('no local browser save found for name: ' + name);
      }
    });
  };

  ns.IndexedDbStorageService.prototype.remove = function (name) {
    return this.piskelDatabase.delete(name);
  };

  ns.IndexedDbStorageService.prototype.getKeys = function () {
    return this.piskelDatabase.list();
  };
})();
