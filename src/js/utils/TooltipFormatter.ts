import type { Shortcut } from "../service/keyboard/Shortcut";
import { Template } from "./Template";
import { UserAgent } from "./UserAgent";

export type TooltipDescriptor = {
  key?: string;
  description: string;
  icon?: string;
};

export const TooltipFormatter = {
  format(
    helpText: string | undefined,
    shortcut: Shortcut | undefined,
    descriptors?: TooltipDescriptor[] | undefined
  ): string {
    const tpl = Template.get("tooltip-container-template");
    const shortcutText = shortcut ? "(" + shortcut.getDisplayKey() + ")" : "";
    return Template.replace(tpl, {
      helptext: helpText,
      shortcut: shortcutText,
      // Avoid sanitization for descriptors (markup)
      "!descriptors!": this.formatDescriptors_(descriptors)
    });
  },

  formatDescriptors_(descriptors: TooltipDescriptor[] | undefined): string {
    return (descriptors || []).reduce((p, descriptor) => {
      return (p += this.formatDescriptor_(descriptor));
    }, "");
  },

  formatDescriptor_(descriptor: TooltipDescriptor): string {
    let tpl;
    if (descriptor.key) {
      tpl = Template.get("tooltip-modifier-descriptor-template");
      descriptor.key = descriptor.key.toUpperCase();
      if (UserAgent.isMac) {
        descriptor.key = descriptor.key.replace("CTRL", "CMD");
        descriptor.key = descriptor.key.replace("ALT", "OPTION");
      }
    } else {
      tpl = Template.get("tooltip-simple-descriptor-template");
    }
    return Template.replace(tpl, descriptor);
  }
};
