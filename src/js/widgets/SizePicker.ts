import { Dom } from "../utils/Dom";
import { EventUtils } from "../utils/Event";
import { assertDefined } from "../utils/core";

export class SizePicker {
  onChange: (size: number) => void;
  container: HTMLElement | undefined;

  constructor(onChange: (size: number) => void) {
    this.onChange = onChange;
  }

  init(container: HTMLElement): void {
    this.container = container;
    EventUtils.addEventListener(
      this.container,
      "click",
      this.onSizeOptionClick_,
      this
    );
  }

  destroy(): void {
    EventUtils.removeAllEventListeners(this);
  }

  getSize(): string | null | undefined {
    const selectedOption = assertDefined(
      this.container,
      "container"
    ).querySelector<HTMLElement>(".selected");
    return selectedOption ? selectedOption.dataset.size : null;
  }

  setSize(size: string | number | undefined): void {
    if (this.getSize() === size) {
      return;
    }

    Dom.removeClass("labeled", this.container);
    Dom.removeClass("selected", this.container);
    let selectedOption;
    selectedOption = assertDefined(this.container, "container").querySelector(
      '[data-size="' + size + '"]'
    );
    if (!selectedOption) {
      selectedOption = assertDefined(
        assertDefined(this.container, "container").querySelector(
          "[data-size]:last-child"
        ),
        "selectedOption"
      );
      selectedOption.classList.add("labeled");
      selectedOption.setAttribute("real-size", String(size));
    }
    if (selectedOption) {
      selectedOption.classList.add("selected");
    }
  }

  onSizeOptionClick_(e: Event): void {
    const size = (e.target as HTMLElement).dataset.size;
    if (size !== undefined && !isNaN(Number(size))) {
      const parsedSize = parseInt(size, 10);
      this.onChange(parsedSize);
      this.setSize(parsedSize);
    }
  }
}
