import { Constants } from "../Constants";
import { Events } from "../Events";
import type { JQueryEvent } from "../lib/jquery-1.8.0";

export class SelectedColorsService {
  primaryColor_: string;
  secondaryColor_: string;

  constructor() {
    this.primaryColor_ = Constants.DEFAULT_PEN_COLOR;
    this.secondaryColor_ = Constants.TRANSPARENT_COLOR;
  }

  init(): void {
    $.subscribe(
      Events.PRIMARY_COLOR_SELECTED,
      this.onPrimaryColorUpdate_.bind(this)
    );
    $.subscribe(
      Events.SECONDARY_COLOR_SELECTED,
      this.onSecondaryColorUpdate_.bind(this)
    );
  }

  getPrimaryColor(): string {
    return this.primaryColor_;
  }

  getSecondaryColor(): string {
    return this.secondaryColor_;
  }

  onPrimaryColorUpdate_(evt: JQueryEvent, color: string): void {
    this.primaryColor_ = color;
  }

  onSecondaryColorUpdate_(evt: JQueryEvent, color: string): void {
    this.secondaryColor_ = color;
  }
}
