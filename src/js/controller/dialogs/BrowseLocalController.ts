import { app } from "../../app";
import type { SavedPiskelInfo } from "../../database/PiskelDatabase";
import type { IndexedDbStorageService } from "../../service/storage/IndexedDbStorageService";
import { DateUtils } from "../../utils/DateUtils";
import { Dom } from "../../utils/Dom";
import { Template } from "../../utils/Template";
import { assertDefined } from "../../utils/core";
import type { PublicPiskelController } from "../piskel/PublicPiskelController";
import { AbstractDialogController } from "./AbstractDialogController";

export class BrowseLocalController extends AbstractDialogController {
  localStorageItemTemplate_: string | undefined;
  service_: IndexedDbStorageService | undefined;
  piskelList: HTMLTableElement | undefined;

  constructor(piskelController: PublicPiskelController) {
    super();
  }

  init(): void {
    super.init();

    this.localStorageItemTemplate_ = Template.get(
      "local-storage-item-template"
    );

    this.service_ = app.indexedDbStorageService;
    this.piskelList = Dom.getElement<HTMLTableElement>(".local-piskel-list");

    this.fillLocalPiskelsList_();

    this.piskelList.addEventListener(
      "click",
      this.onPiskelsListClick_.bind(this)
    );
  }

  onPiskelsListClick_(evt: Event): void {
    const action = (evt.target as HTMLElement).getAttribute("data-action");
    const name = (evt.target as HTMLElement).getAttribute("data-name");
    if (action === "load") {
      if (window.confirm("This will erase your current piskel. Continue ?")) {
        assertDefined(this.service_, "service_").load(String(name));
        this.closeDialog();
      }
    } else if (action === "delete") {
      if (
        window.confirm(
          "This will permanently DELETE this piskel from your computer. Continue ?"
        )
      ) {
        assertDefined(this.service_, "service_").remove(String(name));
        this.fillLocalPiskelsList_();
      }
    }
  }

  fillLocalPiskelsList_(): void {
    assertDefined(this.service_, "service_")
      .getKeys()
      .then((keys: SavedPiskelInfo[]) => {
        let html = "";
        keys.sort(function (k1: SavedPiskelInfo, k2: SavedPiskelInfo) {
          if (k1.date < k2.date) {
            return 1;
          }
          if (k1.date > k2.date) {
            return -1;
          }
          return 0;
        });

        keys.forEach((key: SavedPiskelInfo) => {
          const date = DateUtils.format(
            key.date,
            "{{Y}}/{{M}}/{{D}} {{H}}:{{m}}"
          );
          html += Template.replace(
            assertDefined(
              this.localStorageItemTemplate_,
              "localStorageItemTemplate_"
            ),
            {
              name: key.name,
              date: date
            }
          );
        });

        const tableBody_ = assertDefined(this.piskelList, "piskelList")
          .tBodies[0];
        tableBody_.innerHTML = html;
      });
  }
}
