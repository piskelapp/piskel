(function () {
  var ns = $.namespace('pskl.service.storage.migrate');

  // Simple migration helper to move local storage saves to indexed db.
  ns.MigrateLocalStorageToIndexedDb = {};

  ns.MigrateLocalStorageToIndexedDb.migrate = function () {
    var deferred = Q.defer();

    var localStorageService = pskl.app.localStorageService;
    var indexedDbStorageService = pskl.app.indexedDbStorageService;

    var localStorageKeys = localStorageService.getKeys();
    var migrationData = localStorageKeys.map(function (key) {
      return {
        name: key.name,
        description: key.description,
        date: key.date,
        serialized: localStorageService.getPiskel(key.name)
      };
    });

    // Define the sequential migration process.
    // Wait for each sprite to be saved before saving the next one.
    var success = true;
    var migrateSprite = function (index) {
      var data = migrationData[index];
      if (!data) {
        console.log('Data migration from local storage to indexed db finished.');
        if (success) {
          ns.MigrateLocalStorageToIndexedDb.deleteLocalStoragePiskels();
        }

        deferred.resolve();
        return;
      }
      indexedDbStorageService.save_(
        data.name,
        data.description,
        data.date,
        data.serialized
      ).then(function () {
        migrateSprite(index + 1);
      }).catch(function (e) {
        var success = false;
        console.error('Failed to migrate local storage sprite for name: ' + data.name);
        migrateSprite(index + 1);
      });
    };

    // Start the migration.
    migrateSprite(0);

    return deferred.promise;
  };

  ns.MigrateLocalStorageToIndexedDb.deleteLocalStoragePiskels = function () {
    var localStorageKeys = pskl.app.localStorageService.getKeys();

    // Remove all sprites.
    localStorageKeys.forEach(function (key) {
      window.localStorage.removeItem('piskel.' + key.name);
    });

    // Remove keys.
    window.localStorage.removeItem('piskel.keys');
  };

})();
