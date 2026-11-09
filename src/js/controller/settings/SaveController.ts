import { Events } from "../../Events";
import { app } from "../../app";
import { Descriptor } from "../../model/piskel/Descriptor";
import { Dom } from "../../utils/Dom";
import { Environment } from "../../utils/Environment";
import type { ListenerCallback } from "../../utils/Event";
import { Template } from "../../utils/Template";
import { assertDefined } from "../../utils/core";
import type { PublicPiskelController } from "../piskel/PublicPiskelController";
import { AbstractSettingController } from "./AbstractSettingController";

const PARTIALS = {
  DESKTOP: "save-desktop-partial",
  LOCALSTORAGE: "save-localstorage-partial",
  FILEDOWNLOAD: "save-file-download-partial"
};

export class SaveController extends AbstractSettingController {
  piskelController: PublicPiskelController;
  saveForm: HTMLElement | undefined;
  piskelName: HTMLElement | undefined;
  descriptionInput: HTMLInputElement | undefined;
  nameInput: HTMLInputElement | undefined;
  saveLocalStorageButton: HTMLElement | null | undefined;
  saveDesktopButton: HTMLElement | null | undefined;
  saveDesktopAsNewButton: HTMLElement | null | undefined;
  saveFileDownloadButton: HTMLElement | null | undefined;

  constructor(piskelController: PublicPiskelController) {
    super();
    this.piskelController = piskelController;
  }

  /**
   * @public
   */
  init(): void {
    this.saveForm = Dom.getElement<HTMLFormElement>(".save-form");
    this.insertSavePartials_();

    this.piskelName = Dom.getElement<HTMLElement>(".piskel-name");
    this.descriptionInput =
      Dom.getElement<HTMLInputElement>("#save-description");
    this.nameInput = Dom.getElement<HTMLInputElement>("#save-name");
    this.updateDescriptorInputs_();

    this.saveLocalStorageButton = document.querySelector<HTMLElement>(
      "#save-localstorage-button"
    );
    this.saveDesktopButton = document.querySelector<HTMLElement>(
      "#save-desktop-button"
    );
    this.saveDesktopAsNewButton = document.querySelector<HTMLElement>(
      "#save-desktop-as-new-button"
    );
    this.saveFileDownloadButton = document.querySelector<HTMLElement>(
      "#save-file-download-button"
    );

    this.safeAddEventListener_(
      this.saveLocalStorageButton,
      "click",
      this.saveToIndexedDb_
    );
    this.safeAddEventListener_(
      this.saveDesktopButton,
      "click",
      this.saveToDesktop_
    );
    this.safeAddEventListener_(
      this.saveDesktopAsNewButton,
      "click",
      this.saveToDesktopAsNew_
    );
    this.safeAddEventListener_(
      this.saveFileDownloadButton,
      "click",
      this.saveToFileDownload_
    );

    this.addEventListener(this.saveForm, "submit", this.onSaveFormSubmit_);

    if (assertDefined(app.storageService, "storageService").isSaving()) {
      this.disableSaveButtons_();
    }

    $.subscribe(
      Events.BEFORE_SAVING_PISKEL,
      this.disableSaveButtons_.bind(this)
    );
    $.subscribe(Events.AFTER_SAVING_PISKEL, this.enableSaveButtons_.bind(this));
  }

  insertSavePartials_(): void {
    this.getPartials_().forEach((partial) => {
      assertDefined(this.saveForm, "saveForm").insertAdjacentHTML(
        "beforeend",
        Template.get(partial)
      );
    });
  }

  getPartials_(): string[] {
    if (Environment.detectNodeWebkit()) {
      return [PARTIALS.DESKTOP, PARTIALS.LOCALSTORAGE];
    }

    return [PARTIALS.FILEDOWNLOAD, PARTIALS.LOCALSTORAGE];
  }

  updateDescriptorInputs_(evt?: Event): void {
    const descriptor = this.piskelController.getPiskel().getDescriptor();
    assertDefined(this.descriptionInput, "descriptionInput").value =
      descriptor.description;
    assertDefined(this.nameInput, "nameInput").value = descriptor.name;
  }

  onSaveFormSubmit_(evt: Event): void {
    evt.preventDefault();
    evt.stopPropagation();

    this.saveToIndexedDb_();
  }

  saveToFileDownload_(): void {
    this.saveTo_("saveToFileDownload", false);
  }

  saveToIndexedDb_(): void {
    this.saveTo_("saveToIndexedDb", false);
  }

  saveToDesktop_(): void {
    this.saveTo_("saveToDesktop", false);
  }

  saveToDesktopAsNew_(): void {
    this.saveTo_("saveToDesktop", true);
  }

  saveTo_(
    methodName: "saveToFileDownload" | "saveToIndexedDb" | "saveToDesktop",
    saveAsNew: boolean
  ): void {
    const piskel = this.piskelController.getPiskel();
    piskel.setDescriptor(this.getDescriptor_());
    const storageService = assertDefined(app.storageService, "storageService");
    const saving =
      methodName === "saveToDesktop"
        ? storageService.saveToDesktop(piskel, !!saveAsNew)
        : storageService[methodName](piskel);
    saving.then(this.onSaveSuccess_);
  }

  getDescriptor_(): Descriptor {
    const name = assertDefined(this.nameInput, "nameInput").value;
    const description = assertDefined(
      this.descriptionInput,
      "descriptionInput"
    ).value;
    return new Descriptor(name, description);
  }

  onSaveSuccess_(): void {
    $.publish(Events.CLOSE_SETTINGS_DRAWER);
  }

  disableSaveButtons_(): void {
    this.setDisabled_(this.saveLocalStorageButton, true);
    this.setDisabled_(this.saveDesktopButton, true);
    this.setDisabled_(this.saveDesktopAsNewButton, true);
    this.setDisabled_(this.saveFileDownloadButton, true);
  }

  enableSaveButtons_(): void {
    this.setDisabled_(this.saveLocalStorageButton, false);
    this.setDisabled_(this.saveDesktopButton, false);
    this.setDisabled_(this.saveDesktopAsNewButton, false);
    this.setDisabled_(this.saveFileDownloadButton, false);
  }

  setDisabled_(
    element: HTMLElement | null | undefined,
    isDisabled: boolean
  ): void {
    if (!element) {
      return;
    }

    if (isDisabled) {
      element.setAttribute("disabled", "disabled");
    } else {
      element.removeAttribute("disabled");
    }
  }

  safeAddEventListener_(
    element: HTMLElement | null | undefined,
    type: string,
    callback: ListenerCallback
  ): void {
    if (element) {
      this.addEventListener(element, type, callback);
    }
  }
}
