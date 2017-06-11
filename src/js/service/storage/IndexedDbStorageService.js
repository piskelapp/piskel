(function () {
  var ns = $.namespace('pskl.service.storage');
  var DB_NAME = 'PiskelDatabase';
  var DB_VERSION = 1;

  ns.IndexedDbStorageService = function (piskelController) {
    this.piskelController = piskelController;
  };

  ns.IndexedDbStorageService.prototype.init = function () {
    var request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = this.onRequestError_.bind(this);
    request.onupgradeneeded = this.onUpgradeNeeded_.bind(this);
    request.onsuccess = this.onRequestSuccess_.bind(this);
  };

  ns.IndexedDbStorageService.prototype.save = function (piskel) {
    var name = piskel.getDescriptor().name;
    var description = piskel.getDescriptor().description;
    var date = Date.now();
    var serialized = pskl.utils.serialization.Serializer.serialize(piskel);

    return this.save_(name, description, date, serialized);
  };

  ns.IndexedDbStorageService.prototype.save_ = function (name, description, date, serialized) {
    var deferred = Q.defer();
    var objectStore = this.db.transaction(['piskels'], 'readwrite').objectStore('piskels');

    var getRequest = objectStore.get(name);
    getRequest.onsuccess = function (event) {
      console.log('get request successful for name: ' + name);
      var data = event.target.result;
      if (typeof data !== 'undefined') {

        data.serialized = serialized;
        data.date = date;
        data.description = description;

        var putRequest = objectStore.put(data);
        putRequest.onerror = function(event) {
          console.log('put request failed for name: ' + name);
          deferred.reject();
        };
        putRequest.onsuccess = function(event) {
          console.log('put request successful for name: ' + name);
          deferred.resolve();
        };
      } else {
        var request = objectStore.add({
          name: name,
          description: description,
          serialized: serialized,
          date: date
        });

        request.onerror = function(event) {
          console.log('Failed to save a piskel');
          deferred.reject();
        };
        request.onsuccess = function(event) {
          console.log('Successfully saved a piskel');
          deferred.resolve();
        };
      }
    };

    getRequest.onerror = function () {
      console.log('get request failed for name: ' + name);
      deferred.reject();
    };

    return deferred.promise;
  };

  ns.IndexedDbStorageService.prototype.load = function (name) {
    var objectStore = this.db.transaction(['piskels'], 'readwrite').objectStore('piskels');

    var getRequest = objectStore.get(name);
    getRequest.onsuccess = function (event) {
      console.log('get request successful for name: ' + name);
      var data = event.target.result;
      if (typeof data !== 'undefined') {
        var serialized = data.serialized;
        pskl.utils.serialization.Deserializer.deserialize(
          JSON.parse(serialized),
          function (piskel) {
            pskl.app.piskelController.setPiskel(piskel);
          }
        );
      } else {
        console.log('no local browser save found for name: ' + name);
      }
    };

    getRequest.onerror = function () {
      console.log('get request failed for name: ' + name);
    };
  };

  ns.IndexedDbStorageService.prototype.remove = function (name) {
    var objectStore = this.db.transaction(['piskels'], 'readwrite').objectStore('piskels');
    var deleteRequest = objectStore.delete(name);
    deleteRequest.onsuccess = function (event) {
      console.log('successfully deleted local browser save for name: ' + name);
    };

    deleteRequest.onerror = function (event) {
      console.log('failed to delete local browser save for name: ' + name);
    };
  };

  ns.IndexedDbStorageService.prototype.list = function () {
    var deferred = Q.defer();
    var piskels = [];
    var objectStore = this.db.transaction(['piskels']).objectStore('piskels');

    var cursor = objectStore.openCursor();
    cursor.onsuccess = function(event) {
      var cursor = event.target.result;
      if (cursor) {
        piskels.push({
          name: cursor.value.name,
          date: cursor.value.date,
          description: cursor.value.description
        });
        cursor.continue();
      } else {
        console.log('Cursor consumed all availabled piskels');
        deferred.resolve(piskels);
      }
    };

    cursor.onerror = function () {
      deferred.reject();
    };

    return deferred.promise;
  };

  ns.IndexedDbStorageService.prototype.getKeys = function () {
    return this.list();
  };

  ns.IndexedDbStorageService.prototype.onRequestError_ = function (event) {
    console.log('Failed to initialize IndexedDB, local browser saves will be unavailable.');
  };

  ns.IndexedDbStorageService.prototype.onRequestSuccess_ = function (event) {
    this.db = event.target.result;
    console.log('Successfully initialized IndexedDB, local browser saves are available.');
  };

  ns.IndexedDbStorageService.prototype.onUpgradeNeeded_ = function (event) {
    // Set this.db early to allow migration scripts to access it in oncomplete.
    this.db = event.target.result;

    // Create an object store "piskels" with the autoIncrement flag set as true.
    var objectStore = this.db.createObjectStore('piskels', { keyPath : 'name' });
    objectStore.transaction.oncomplete = function(event) {
      // Migrate existing sprites from LocalStorage
      pskl.service.storage.migrate.MigrateLocalStorageToIndexedDb.migrate().then(function () {
        console.log('Successfully migrated local storage data to indexed db');
      }).catch(function (e) {
        console.log('Failed to migrate local storage data to indexed db');
        console.error(e);
      });
    };
  };
})();
