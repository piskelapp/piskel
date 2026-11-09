import { EventUtils } from "../utils/Event";
import { assertDefined } from "../utils/core";

const OPTION_CLASSNAME = "anchor-option";

// Maybe move to HTML ...
const WIDGET_TEMPLATE =
  '<div class="anchor-option"  title="top left"      data-origin="TOPLEFT"></div>' +
  '<div class="anchor-option"  title="top"           data-origin="TOP"></div>' +
  '<div class="anchor-option"  title="top right"     data-origin="TOPRIGHT"></div>' +
  '<div class="anchor-option"  title="middle left"   data-origin="MIDDLELEFT"></div>' +
  '<div class="anchor-option"  title="middle"        data-origin="MIDDLE"></div>' +
  '<div class="anchor-option"  title="middle right"  data-origin="MIDDLERIGHT"></div>' +
  '<div class="anchor-option"  title="bottom left"   data-origin="BOTTOMLEFT"></div>' +
  '<div class="anchor-option"  title="bottom"        data-origin="BOTTOM"></div>' +
  '<div class="anchor-option"  title="bottom right"  data-origin="BOTTOMRIGHT"></div>';

export class AnchorWidget {
  onChangeCallback: ((origin: string) => void) | undefined;
  wrapper: HTMLElement | null;
  disabled: boolean;
  origin: string | undefined;

  constructor(
    container: HTMLElement,
    onChangeCallback?: (origin: string) => void
  ) {
    this.onChangeCallback = onChangeCallback;

    this.wrapper = document.createElement("div");
    this.wrapper.classList.add("anchor-wrapper");
    this.wrapper.innerHTML = WIDGET_TEMPLATE;

    container.innerHTML = "";
    container.appendChild(this.wrapper);

    this.disabled = false;
    EventUtils.addEventListener(
      this.wrapper,
      "click",
      this.onResizeOriginClick_,
      this
    );
  }

  static ORIGIN = {
    TOPLEFT: "TOPLEFT",
    TOP: "TOP",
    TOPRIGHT: "TOPRIGHT",
    MIDDLELEFT: "MIDDLELEFT",
    MIDDLE: "MIDDLE",
    MIDDLERIGHT: "MIDDLERIGHT",
    BOTTOMLEFT: "BOTTOMLEFT",
    BOTTOM: "BOTTOM",
    BOTTOMRIGHT: "BOTTOMRIGHT"
  };

  destroy(evt?: Event): void {
    EventUtils.removeAllEventListeners(this);
    this.wrapper = null;
  }

  onResizeOriginClick_(evt: Event): void {
    const origin = (evt.target as HTMLElement).dataset.origin;
    if (origin && origin in AnchorWidget.ORIGIN && !this.disabled) {
      this.setOrigin(origin);
    }
  }

  setOrigin(origin: string): void {
    this.origin = origin;
    const previous = assertDefined(this.wrapper, "wrapper").querySelector(
      "." + OPTION_CLASSNAME + ".selected"
    );
    if (previous) {
      previous.classList.remove("selected");
    }

    const selected = assertDefined(this.wrapper, "wrapper").querySelector(
      "." + OPTION_CLASSNAME + '[data-origin="' + origin + '"]'
    );
    if (selected) {
      selected.classList.add("selected");
      this.refreshNeighbors_(selected);
    }

    if (typeof this.onChangeCallback === "function") {
      this.onChangeCallback(origin);
    }
  }

  getOrigin(): string | undefined {
    return this.origin;
  }

  disable(): void {
    this.disabled = true;
    assertDefined(this.wrapper, "wrapper").classList.add("transition");
    assertDefined(this.wrapper, "wrapper").classList.add("disabled");
  }

  enable(): void {
    this.disabled = false;
    assertDefined(this.wrapper, "wrapper").classList.remove("disabled");
    window.setTimeout(
      assertDefined(this.wrapper, "wrapper").classList.remove.bind(
        assertDefined(this.wrapper, "wrapper").classList,
        "transition"
      ),
      250
    );
  }

  refreshNeighbors_(selected: Element): void {
    const options = assertDefined(this.wrapper, "wrapper").querySelectorAll(
      "." + OPTION_CLASSNAME
    );
    for (let i = 0; i < options.length; i++) {
      options[i].removeAttribute("data-neighbor");
    }

    const selectedIndex = Array.prototype.indexOf.call(options, selected);

    this.setNeighborhood_(options[selectedIndex - 1], "left");
    this.setNeighborhood_(options[selectedIndex + 1], "right");
    this.setNeighborhood_(options[selectedIndex - 3], "top");
    this.setNeighborhood_(options[selectedIndex + 3], "bottom");
  }

  setNeighborhood_(el: Element, neighborhood: string): void {
    const origin = assertDefined(this.origin, "origin").toLowerCase();
    const isNeighborhoodValid = origin.indexOf(neighborhood) === -1;
    if (isNeighborhoodValid) {
      el.setAttribute("data-neighbor", neighborhood);
    }
  }
}
