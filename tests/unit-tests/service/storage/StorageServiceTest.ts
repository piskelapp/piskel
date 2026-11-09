import { Events } from "../../../../src/js/Events";
import { app } from "../../../../src/js/app";
import type { PublicPiskelController } from "../../../../src/js/controller/piskel/PublicPiskelController";
import type { Piskel } from "../../../../src/js/model/Piskel";
import type { ShortcutService } from "../../../../src/js/service/keyboard/ShortcutService";
import type { DesktopStorageService } from "../../../../src/js/service/storage/DesktopStorageService";
import type { FileDownloadStorageService } from "../../../../src/js/service/storage/FileDownloadStorageService";
import type { LocalStorageService } from "../../../../src/js/service/storage/LocalStorageService";
import { StorageService } from "../../../../src/js/service/storage/StorageService";
import { assertDefined } from "../../../../src/js/utils/core";
import { mock } from "../../testutils/TestUtils";
import { beforeEach, describe, expect, it, vi } from "vitest";

type SubService = { save(piskel: Piskel, saveAsNew?: boolean): Promise<void> };
type SaveMethod = "saveToDesktop" | "saveToFileDownload" | "saveToLocalStorage";

describe("Storage Service test suite", function () {
  let storageService: StorageService;
  const piskel = mock<Piskel>({});

  beforeEach(function () {
    app.desktopStorageService = mock<DesktopStorageService>({
      save: function () {}
    });
    app.fileDownloadStorageService = mock<FileDownloadStorageService>({
      save: function () {}
    });
    app.localStorageService = mock<LocalStorageService>({
      save: function () {}
    });
    app.shortcutService = mock<ShortcutService>({
      registerShortcut: function () {}
    });

    storageService = new StorageService(mock<PublicPiskelController>({}));
    storageService.init();
  });

  const checkSubServiceSuccessfulSave = function (
    service: SubService,
    methodName: SaveMethod,
    done: () => void
  ) {
    vi.spyOn(service, "save").mockReturnValue(Promise.resolve());
    storageService[methodName](piskel)
      .then(
        function () {
          expect(service.save).toHaveBeenCalledWith(piskel, undefined);
        },
        function () {
          expect(false, "Error callback should not have been called").toBe(
            true
          );
        }
      )
      .then(function () {
        done();
      });
  };

  const checkSubServiceFailedSave = function (
    service: SubService,
    methodName: SaveMethod,
    done: () => void
  ) {
    vi.spyOn(service, "save").mockReturnValue(Promise.reject());
    storageService[methodName](piskel)
      .then(
        function () {
          expect(false, "Success callback should not have been called").toBe(
            true
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
  it("calls DesktopStorage#save in saveToDesktop", () =>
    new Promise<void>((done) => {
      checkSubServiceSuccessfulSave(
        mock<SubService>(app.desktopStorageService),
        "saveToDesktop",
        done
      );
    }));
  it("calls DesktopStorage#save in saveToDesktop - error case", () =>
    new Promise<void>((done) => {
      checkSubServiceFailedSave(
        mock<SubService>(app.desktopStorageService),
        "saveToDesktop",
        done
      );
    }));

  // FileDownloadStorage
  it("calls FileDownloadStorage#save in saveToFileDownload", () =>
    new Promise<void>((done) => {
      checkSubServiceSuccessfulSave(
        mock<SubService>(app.fileDownloadStorageService),
        "saveToFileDownload",
        done
      );
    }));
  it("calls FileDownloadStorage#save in saveToFileDownload - error case", () =>
    new Promise<void>((done) => {
      checkSubServiceFailedSave(
        mock<SubService>(app.fileDownloadStorageService),
        "saveToFileDownload",
        done
      );
    }));

  // LocalStorage
  it("calls LocalStorage#save in saveToLocalStorage", () =>
    new Promise<void>((done) => {
      checkSubServiceSuccessfulSave(
        mock<SubService>(app.localStorageService),
        "saveToLocalStorage",
        done
      );
    }));
  it("calls LocalStorage#save in saveToLocalStorage - error case", () =>
    new Promise<void>((done) => {
      checkSubServiceFailedSave(
        mock<SubService>(app.localStorageService),
        "saveToLocalStorage",
        done
      );
    }));

  it("updates saving status properly", () =>
    new Promise<void>((done) => {
      let resolveSavePromise: (() => void) | undefined;
      const savePromise = new Promise(function (resolve) {
        resolveSavePromise = () => resolve(undefined);
      });
      vi.spyOn(
        assertDefined(app.desktopStorageService, "service"),
        "save"
      ).mockReturnValue(mock<Promise<void>>(savePromise));

      // check storageService is not in saving mode
      expect(storageService.isSaving()).toBe(false);

      // save
      const storageServicePromise = storageService.saveToDesktop(piskel);

      // storageService is now in saving mode
      expect(storageService.isSaving()).toBe(true);

      // we have called save once
      expect(
        vi.mocked(assertDefined(app.desktopStorageService, "service").save).mock
          .calls.length
      ).toBe(1);

      // call save again, should be ignored (rejected with "Already saving")
      storageService.saveToDesktop(piskel).catch(function () {});
      expect(
        vi.mocked(assertDefined(app.desktopStorageService, "service").save).mock
          .calls.length
      ).toBe(1);

      assertDefined(resolveSavePromise, "resolveSavePromise")();
      storageServicePromise.then(function () {
        // after saving, isSaving() should be false again
        expect(storageService.isSaving()).toBe(false);
        done();
      });
    }));

  it("updates saving status on BEFORE_SAVING_PISKEL and AFTER_SAVING_PISKEL events", function () {
    vi.spyOn(
      assertDefined(app.desktopStorageService, "service"),
      "save"
    ).mockReturnValue(Promise.resolve());

    // check storageService is not in saving mode
    expect(storageService.isSaving()).toBe(false);

    // trigger before save event
    $.publish(Events.BEFORE_SAVING_PISKEL);
    expect(storageService.isSaving()).toBe(true);

    // call save, should have been ignored (rejected with "Already saving")
    storageService.saveToDesktop(piskel).catch(function () {});
    expect(
      vi.mocked(assertDefined(app.desktopStorageService, "service").save).mock
        .calls.length
    ).toBe(0);

    // trigger before save event
    $.publish(Events.AFTER_SAVING_PISKEL);
    expect(storageService.isSaving()).toBe(false);
  });
});
