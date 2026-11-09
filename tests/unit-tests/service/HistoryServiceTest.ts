import { Events, type Replayable } from "../../../src/js/Events";
import type { PublicPiskelController } from "../../../src/js/controller/piskel/PublicPiskelController";
import { HistoryService } from "../../../src/js/service/HistoryService";
import type { ShortcutService } from "../../../src/js/service/keyboard/ShortcutService";
import { mock } from "../testutils/TestUtils";
import { describe, expect, it } from "vitest";

const callFactory = function (method: () => unknown) {
  return {
    times: function (times: number) {
      const results = [];
      for (let i = 0; i < times; i++) {
        results.push(method());
      }
      return results;
    },
    once: function () {
      return method();
    }
  };
};

describe("History Service suite", function () {
  const SERIALIZED_PISKEL = "serialized-piskel";
  let historyService: HistoryService;

  const getLastState = function () {
    return historyService.stateQueue[historyService.currentIndex];
  };

  const createMockHistoryService = function () {
    const mockPiskelController = {
      getWrappedPiskelController: function () {
        return {
          getPiskel: function () {},
          getFPS: function () {
            return 12;
          }
        };
      }
    };
    const mockShortcutService = {
      registerShortcuts: function () {},
      registerShortcut: function () {}
    };
    return new HistoryService(
      mock<PublicPiskelController>(mockPiskelController),
      mock<ShortcutService>(mockShortcutService),
      { deserialize: function () {} },
      {
        serialize: function () {
          return mock<ArrayBuffer>(SERIALIZED_PISKEL);
        }
      }
    );
  };

  it("starts at -1", function () {
    historyService = createMockHistoryService();
    expect(historyService.currentIndex).toBe(-1);
  });

  it("is at 0 after init", function () {
    historyService = createMockHistoryService();
    historyService.init();
    expect(historyService.currentIndex).toBe(0);
  });

  const sendSaveEvents = function (type: string) {
    return callFactory(function () {
      $.publish(Events.PISKEL_SAVE_STATE, {
        type: type,
        scope: mock<Replayable>({}),
        replay: {}
      });
    });
  };

  it("stores a piskel snapshot after 5 SAVE", function () {
    // BEFORE
    const SNAPSHOT_PERIOD_BACKUP = HistoryService.SNAPSHOT_PERIOD;
    HistoryService.SNAPSHOT_PERIOD = 5;

    historyService = createMockHistoryService();
    historyService.init();

    sendSaveEvents(HistoryService.REPLAY).times(5);

    expect(historyService.currentIndex).toBe(5);

    expect(getLastState().piskel).toBe(SERIALIZED_PISKEL);

    sendSaveEvents(HistoryService.REPLAY).times(4);
    expect(getLastState().piskel).toBeUndefined();

    sendSaveEvents(HistoryService.REPLAY).once();
    expect(getLastState().piskel).toBe(SERIALIZED_PISKEL);

    // AFTER
    HistoryService.SNAPSHOT_PERIOD = SNAPSHOT_PERIOD_BACKUP;
  });
});
