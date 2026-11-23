import type { JQueryCollection } from "./jquery-1.8.0";

export type SortableUi = { item: { get(index: number): HTMLElement } };

export type SortableOptions = {
  placeholder?: string;
  forcePlaceholderSize?: boolean;
  items?: string;
  tolerance?: string;
  axis?: string;
  update?: (event: Event, ui: SortableUi) => void;
  stop?: (event: Event, ui: SortableUi) => void;
  start?: (event: Event, ui: SortableUi) => void;
};

export type JQueryUiMethods = {
  sortable(options: SortableOptions | "destroy"): JQueryCollection;
  disableSelection(): JQueryCollection;
};
