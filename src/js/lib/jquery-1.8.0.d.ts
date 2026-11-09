import type { BootstrapMethods } from "./bootstrap/bootstrap";
import type { JQueryUiMethods } from "./jquery-ui-1.10.3.custom";
import type { PubSub } from "./pubsub";
import type { SpectrumMethods } from "./spectrum/spectrum";

/** The event object jQuery hands to its handlers. */
export type JQueryEvent = {
  type: string;
  data?: { isPrimary: boolean };
  target: EventTarget | null;
  stopPropagation(): void;
};

export type JQueryCollection = BootstrapMethods &
  JQueryUiMethods &
  SpectrumMethods & {
    get(index: number): HTMLElement;
    change(
      data: { isPrimary: boolean },
      handler: (evt: JQueryEvent) => void
    ): JQueryCollection;
  };

export type JQueryStatic = PubSub & {
  (selector: string | Element | null | undefined): JQueryCollection;
  extend<A extends object, B extends object>(target: A, source: B): A & B;
  extend<A extends object, B extends object>(
    deep: true,
    target: object,
    defaults: A,
    source: B
  ): A & B;
};

declare global {
  const $: JQueryStatic;
  const jQuery: JQueryStatic;
}
