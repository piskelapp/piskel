import { Template } from "../utils/Template";
import { TooltipFormatter } from "../utils/TooltipFormatter";
import type { Tool } from "./Tool";

export class ToolIconBuilder {
  createIcon(tool: Tool, tooltipPosition?: string): string {
    tooltipPosition = tooltipPosition || "right";
    const tpl = Template.get("drawingTool-item-template");
    return Template.replace(tpl, {
      cssclass: ["tool-icon", "icon-" + tool.toolId].join(" "),
      toolid: tool.toolId,
      title: this.getTooltipText(tool),
      tooltipposition: tooltipPosition
    });
  }

  getTooltipText(tool: Tool): string {
    const descriptors = tool.tooltipDescriptors;
    return TooltipFormatter.format(
      tool.getHelpText(),
      tool.shortcut,
      descriptors
    );
  }
}
