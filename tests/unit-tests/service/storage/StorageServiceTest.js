describe("Storage Service test suite", function () {
  var storageService = null;
  var piskel = {};

  beforeEach(function () {
    pskl.app.desktopStorageService = {
      save: function () {}
    };
    pskl.app.fileDownloadStorageService = {
      save: function () {}
    };
    pskl.app.localStorageService = {
      save: function () {}
    };
    pskl.app.shortcutService = {
      registerShortcut: function () {}
    };

    storageService = new pskl.service.storage.StorageService();
    storageService.init();
  });

  var checkSubServiceSuccessfulSave = function (service, methodName, done) {
    spyOn(service, "save").and.returnValue(Promise.resolve());
    storageService[methodName](piskel)
      .then(
        function () {
          expect(service.save).toHaveBeenCalledWith(piskel, undefined);
        },
        function (err) {
          expect(false).toBe(
            true,
            "Error callback should not have been called"
          );
        }
      )
      .then(function () {
        done();
      });
  };

  var checkSubServiceFailedSave = function (service, methodName, done) {
    spyOn(service, "save").and.returnValue(Promise.reject());
    storageService[methodName](piskel)
      .then(
        function () {
          expect(false).toBe(
            true,
            "Success callback should not have been called"
          );
        },
        function () {
          expect(service.save).toHaveBeenCalledWith(piskel, undefined);
        }
      )
      .then(function () {
        done();
      });
  };

  // DesktopStorage
  it("calls DesktopStorage#save in saveToDesktop", function (done) {
    checkSubServiceSuccessfulSave(
      pskl.app.desktopStorageService,
      "saveToDesktop",
      done
    );
  });
  it("calls DesktopStorage#save in saveToDesktop - error case", function (done) {
    checkSubServiceFailedSave(
      pskl.app.desktopStorageService,
      "saveToDesktop",
      done
    );
  });

  // FileDownloadStorage
  it("calls FileDownloadStorage#save in saveToFileDownload", function (done) {
    checkSubServiceSuccessfulSave(
      pskl.app.fileDownloadStorageService,
      "saveToFileDownload",
      done
    );
  });
  it("calls FileDownloadStorage#save in saveToFileDownload - error case", function (done) {
    checkSubServiceFailedSave(
      pskl.app.fileDownloadStorageService,
      "saveToFileDownload",
      done
    );
  });

  // LocalStorage
  it("calls LocalStorage#save in saveToLocalStorage", function (done) {
    checkSubServiceSuccessfulSave(
      pskl.app.localStorageService,
      "saveToLocalStorage",
      done
    );
  });
  it("calls LocalStorage#save in saveToLocalStorage - error case", function (done) {
    checkSubServiceFailedSave(
      pskl.app.localStorageService,
      "saveToLocalStorage",
      done
    );
  });

  it("updates saving status properly", function (done) {
    var resolveSavePromise;
    var savePromise = new Promise(function (resolve) {
      resolveSavePromise = resolve;
    });
    spyOn(pskl.app.desktopStorageService, "save").and.returnValue(savePromise);

    // check storageService is not in saving mode
    expect(storageService.isSaving()).toBe(false);

    // save
    var storageServicePromise = storageService.saveToDesktop(piskel);

    // storageService is now in saving mode
    expect(storageService.isSaving()).toBe(true);

    // we have called save once
    expect(pskl.app.desktopStorageService.save.calls.count()).toBe(1);

    // call save again, should be ignored (rejected with "Already saving")
    storageService.saveToDesktop(piskel).catch(function () {});
    expect(pskl.app.desktopStorageService.save.calls.count()).toBe(1);

    resolveSavePromise();
    storageServicePromise.then(function () {
      // after saving, isSaving() should be false again
      expect(storageService.isSaving()).toBe(false);
      done();
    });
  });

  it("updates saving status on BEFORE_SAVING_PISKEL and AFTER_SAVING_PISKEL events", function () {
    spyOn(pskl.app.desktopStorageService, "save").and.returnValue(
      Promise.resolve()
    );

    // check storageService is not in saving mode
    expect(storageService.isSaving()).toBe(false);

    // trigger before save event
    $.publish(Events.BEFORE_SAVING_PISKEL);
    expect(storageService.isSaving()).toBe(true);

    // call save, should have been ignored (rejected with "Already saving")
    storageService.saveToDesktop(piskel).catch(function () {});
    expect(pskl.app.desktopStorageService.save.calls.count()).toBe(0);

    // trigger before save event
    $.publish(Events.AFTER_SAVING_PISKEL);
    expect(storageService.isSaving()).toBe(false);
  });
});
