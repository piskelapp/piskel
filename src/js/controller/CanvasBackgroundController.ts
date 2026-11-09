import { Events, type UserSettingValue } from "../Events";
import type { JQueryEvent } from "../lib/jquery-1.8.0";
import { UserSettings } from "../utils/UserSettings";

export class CanvasBackgroundController {
  body: HTMLElement;

  constructor() {
    this.body = document.body;
  }

  init(): void {
    $.subscribe(
      Events.USER_SETTINGS_CHANGED,
      this.onUserSettingsChange_.bind(this)
    );
    this.updateBackgroundClass_(
      UserSettings.get(UserSettings.CANVAS_BACKGROUND)
    );
  }

  onUserSettingsChange_(
    evt: JQueryEvent,
    settingName: string,
    settingValue: UserSettingValue
  ): void {
    if (
      settingName == UserSettings.CANVAS_BACKGROUND &&
      typeof settingValue === "string"
    ) {
      this.updateBackgroundClass_(settingValue);
    }
  }

  updateBackgroundClass_(newClass: string): void {
    const currentClass = this.body.dataset.currentBackgroundClass;
    if (currentClass) {
      this.body.classList.remove(currentClass);
    }
    this.body.classList.add(newClass);
    this.body.dataset.currentBackgroundClass = newClass;
  }
}
