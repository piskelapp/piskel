import { app } from "../../../../app";
import type { Session } from "../../../../database/BackupDatabase";
import { DateUtils } from "../../../../utils/DateUtils";
import { Dom } from "../../../../utils/Dom";
import { EventUtils } from "../../../../utils/Event";
import { Template } from "../../../../utils/Template";
import { assertDefined } from "../../../../utils/core";
import type { PublicPiskelController } from "../../../piskel/PublicPiskelController";
import type { BrowseBackups } from "../BrowseBackups";

// Should match the transition duration for.session-item defined in dialogs-browse-backups.css
const DELETE_TRANSITION_DURATION = 500;

/**
 * Helper that returns a promise that will resolve after waiting for a
 * given time (in ms).
 *
 * @param {Number} time
 *        The time to wait.
 * @return {Promise} promise that resolves after time.
 */
const wait = function (time: number) {
  return new Promise(function (resolve) {
    setTimeout(resolve, time);
  });
};

export class SelectSession {
  piskelController: PublicPiskelController;
  backupsController: BrowseBackups;
  container: HTMLElement;

  constructor(
    piskelController: PublicPiskelController,
    backupsController: BrowseBackups,
    container: HTMLElement
  ) {
    this.piskelController = piskelController;
    this.backupsController = backupsController;
    this.container = container;
  }

  addEventListener(
    el: HTMLElement,
    type: string,
    cb: (evt: Event) => void
  ): void {
    EventUtils.addEventListener(el, type, cb, this);
  }

  init(): void {
    this.addEventListener(this.container, "click", this.onContainerClick_);
  }

  onShow(): void {
    this.update();
  }

  update(): void {
    assertDefined(app.backupService, "backupService")
      .list()
      .then((sessions) => {
        const html = this.getMarkupForSessions_(sessions);
        Dom.getElement<HTMLElement>(".session-list", this.container).innerHTML =
          html;
      })
      .catch(() => {
        const html = Template.get("session-list-error");
        Dom.getElement<HTMLElement>(".session-list", this.container).innerHTML =
          html;
      });
  }

  getMarkupForSessions_(sessions: Session[]): string {
    if (sessions.length === 0) {
      return Template.get("session-list-empty");
    }

    const sessionItemTemplate = Template.get("session-list-item");
    return sessions.reduce(function (previous: string, session: Session) {
      if (session.id === app.sessionId) {
        // Do not show backups for the current session.
        return previous;
      }
      const view = {
        id: session.id,
        name: session.name,
        description: session.description ? "- " + session.description : "",
        date: DateUtils.format(
          session.endDate,
          "the {{Y}}/{{M}}/{{D}} at {{H}}:{{m}}"
        ),
        count: session.count === 1 ? "1 snapshot" : session.count + " snapshots"
      };
      return previous + Template.replace(sessionItemTemplate, view);
    }, "");
  }

  destroy(): void {
    EventUtils.removeAllEventListeners(this);
  }

  onContainerClick_(evt: Event): void {
    const sessionId = (evt.target as HTMLElement).dataset.sessionId;
    if (!sessionId) {
      return;
    }

    const action = (evt.target as HTMLElement).dataset.action;
    if (action == "view") {
      this.backupsController.backupsData.selectedSession = sessionId;
      this.backupsController.next();
    } else if (action == "delete") {
      if (window.confirm("Are you sure you want to delete this session?")) {
        assertDefined(
          (evt.target as HTMLElement).closest(".session-item"),
          "sessionItem"
        ).classList.add("deleting");
        Promise.all([
          assertDefined(app.backupService, "backupService").deleteSession(
            sessionId
          ),
          // Wait for 500ms for the .hide opacity transition.
          wait(DELETE_TRANSITION_DURATION)
        ]).then(() => {
          // Refresh the list of sessions
          this.update();
        });
      }
    }
  }
}
