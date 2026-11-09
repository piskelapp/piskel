import { Constants } from "../Constants";
import { Events } from "../Events";
import type { JQueryEvent } from "../lib/jquery-1.8.0";

const BUTTON_UNSET: number | null = null;

/**
 * This service exists mostly due to a FF/IE bug.
 * For mousemove events, the button type is set to 0 (e.g. left button type) whatever was the
 * pressed button on mousedown. We use this service to cache the button type value on mousedown
 * and make it available to mousemove events.
 */
export class MouseStateService {
  lastButtonPressed_: number | null;

  constructor() {
    this.lastButtonPressed_ = BUTTON_UNSET;
  }

  init(): void {
    $.subscribe(Events.MOUSE_EVENT, this.onMouseEvent_.bind(this));
  }

  isLeftButtonPressed(): boolean {
    return this.isMouseButtonPressed_(Constants.LEFT_BUTTON);
  }

  isRightButtonPressed(): boolean {
    return this.isMouseButtonPressed_(Constants.RIGHT_BUTTON);
  }

  isMiddleButtonPressed(): boolean {
    return this.isMouseButtonPressed_(Constants.MIDDLE_BUTTON);
  }

  isMouseButtonPressed_(mouseButton: number): boolean {
    return (
      this.lastButtonPressed_ != BUTTON_UNSET &&
      this.lastButtonPressed_ == mouseButton
    );
  }

  onMouseEvent_(evt: JQueryEvent, mouseEvent: MouseEvent): void {
    if (mouseEvent.type == "mousedown") {
      this.lastButtonPressed_ = mouseEvent.button;
    } else if (mouseEvent.type == "mouseup") {
      this.lastButtonPressed_ = BUTTON_UNSET;
    }
  }
}
