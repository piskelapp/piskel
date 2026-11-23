import type { JQueryCollection } from "@/lib/jquery-1.8.0";

export type BootstrapMethods = {
  tooltip(options: { selector: string }): JQueryCollection;
};
