import { Constants } from "../../../../Constants";
import { Events } from "../../../../Events";
import { app } from "../../../../app";
import type { Snapshot } from "../../../../database/BackupDatabase";
import type { Piskel } from "../../../../model/Piskel";
import { DateUtils } from "../../../../utils/DateUtils";
import { Dom } from "../../../../utils/Dom";
import { EventUtils, type ListenerCallback } from "../../../../utils/Event";
import { FrameUtils } from "../../../../utils/FrameUtils";
import { LayerUtils } from "../../../../utils/LayerUtils";
import { StringUtils } from "../../../../utils/StringUtils";
import { Template } from "../../../../utils/Template";
import { assertDefined } from "../../../../utils/core";
import { Deserializer } from "../../../../utils/serialization/Deserializer";
import type { PublicPiskelController } from "../../../piskel/PublicPiskelController";
import type { BrowseBackups } from "../BrowseBackups";

// Should match the preview dimensions defined in dialogs-browse-backups.css
const PREVIEW_SIZE = 60;

export class SessionDetails {
  piskelController: PublicPiskelController;
  backupsController: BrowseBackups;
  container: HTMLElement;
  backButton: HTMLElement | undefined;

  constructor(
    piskelController: PublicPiskelController,
    backupsController: BrowseBackups,
    container: HTMLElement
  ) {
    this.piskelController = piskelController;
    this.backupsController = backupsController;
    this.container = container;
  }

  init(): void {
    this.backButton = Dom.getElement<HTMLElement>(
      ".back-button",
      this.container
    );
    this.addEventListener(this.backButton, "click", this.onBackClick_);
    this.addEventListener(this.container, "click", this.onContainerClick_);
  }

  destroy(): void {
    EventUtils.removeAllEventListeners(this);
  }

  addEventListener(
    el: EventTarget | string,
    type: string,
    cb: ListenerCallback
  ): void {
    EventUtils.addEventListener(el, type, cb, this);
  }

  onShow(): void {
    const sessionId = this.backupsController.backupsData.selectedSession;
    assertDefined(app.backupService, "backupService")
      .getSnapshotsBySessionId(String(sessionId))
      .then((snapshots: Snapshot[]) => {
        const html = this.getMarkupForSnapshots_(snapshots);
        Dom.getElement<HTMLElement>(
          ".snapshot-list",
          this.container
        ).innerHTML = html;

        // Load the image of the first frame for each sprite and update the list.
        snapshots.forEach((snapshot: Snapshot) => {
          this.updateSnapshotPreview_(snapshot);
        });
      })
      .catch(() => {
        const html = Template.get("snapshot-list-error");
        Dom.getElement<HTMLElement>(
          ".snapshot-list",
          this.container
        ).innerHTML = html;
      });
  }

  getMarkupForSnapshots_(snapshots: Snapshot[]): string {
    if (snapshots.length === 0) {
      // This should normally never happen, all sessions have at least one snapshot and snapshots
      // can not be individually deleted.
      console.warn("Could not retrieve snapshots for a session");
      return Template.get("snapshot-list-empty");
    }

    const sessionItemTemplate = Template.get("snapshot-list-item");
    return snapshots.reduce(function (previous: string, snapshot: Snapshot) {
      const view = {
        id: snapshot.id,
        name: snapshot.name,
        description: snapshot.description ? "- " + snapshot.description : "",
        date: DateUtils.format(
          snapshot.date,
          "the {{Y}}/{{M}}/{{D}} at {{H}}:{{m}}"
        ),
        frames: snapshot.frames === 1 ? "1 frame" : snapshot.frames + " frames",
        resolution: StringUtils.formatSize(snapshot.width, snapshot.height),
        fps: snapshot.fps
      };
      return previous + Template.replace(sessionItemTemplate, view);
    }, "");
  }

  updateSnapshotPreview_(snapshot: Snapshot): void {
    Deserializer.deserialize(
      JSON.parse(snapshot.serialized),
      (piskel: Piskel) => {
        const selector =
          '.snapshot-item[data-snapshot-id="' +
          snapshot.id +
          '"] .snapshot-preview';
        const previewContainer = this.container.querySelector(selector);
        if (!previewContainer) {
          return;
        }
        const image = this.getFirstFrameAsImage_(piskel);
        previewContainer.appendChild(image);
      }
    );
  }

  getFirstFrameAsImage_(piskel: Piskel): HTMLCanvasElement {
    const frame = LayerUtils.mergeFrameAt(piskel.getLayers(), 0);
    const wZoom = PREVIEW_SIZE / piskel.width;
    const hZoom = PREVIEW_SIZE / piskel.height;
    const zoom = Math.min(hZoom, wZoom);
    return FrameUtils.toImage(frame, zoom);
  }

  onBackClick_(): void {
    this.backupsController.back();
  }

  onContainerClick_(evt: Event): void {
    const action = (evt.target as HTMLElement).dataset.action;
    if (action == "load" && window.confirm(Constants.CONFIRM_OVERWRITE)) {
      const snapshotId = Number((evt.target as HTMLElement).dataset.snapshotId);
      assertDefined(app.backupService, "backupService")
        .loadSnapshotById(snapshotId)
        .then(function () {
          $.publish(Events.DIALOG_HIDE);
        });
    }
  }
}
