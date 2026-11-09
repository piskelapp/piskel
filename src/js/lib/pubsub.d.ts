import type { EventArgs, EventName, PublishArgs } from "../Events";
import type { JQueryEvent } from "./jquery-1.8.0";

export type PubSub = {
  subscribe<E extends EventName>(
    event: E,
    callback: (evt: JQueryEvent, ...args: EventArgs[E]) => void
  ): void;
  unsubscribe<E extends EventName>(
    event: E,
    callback?: (evt: JQueryEvent, ...args: EventArgs[E]) => void
  ): void;
  publish<E extends EventName>(event: E, ...args: PublishArgs<E>): void;
};
