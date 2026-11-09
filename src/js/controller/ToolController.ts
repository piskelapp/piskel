import { Events } from "../Events";
import { app } from "../app";
import type { JQueryEvent } from "../lib/jquery-1.8.0";
import { ToolIconBuilder } from "../tools/ToolIconBuilder";
import type { BaseTool } from "../tools/drawing/BaseTool";
import { Circle } from "../tools/drawing/Circle";
import { ColorPicker } from "../tools/drawing/ColorPicker";
import { ColorSwap } from "../tools/drawing/ColorSwap";
import { DitheringTool } from "../tools/drawing/DitheringTool";
import { Eraser } from "../tools/drawing/Eraser";
import { Lighten } from "../tools/drawing/Lighten";
import { Move } from "../tools/drawing/Move";
import { PaintBucket } from "../tools/drawing/PaintBucket";
import { Rectangle } from "../tools/drawing/Rectangle";
import { SimplePen } from "../tools/drawing/SimplePen";
import { Stroke } from "../tools/drawing/Stroke";
import { VerticalMirrorPen } from "../tools/drawing/VerticalMirrorPen";
import { LassoSelect } from "../tools/drawing/selection/LassoSelect";
import { RectangleSelect } from "../tools/drawing/selection/RectangleSelect";
import { ShapeSelect } from "../tools/drawing/selection/ShapeSelect";
import { ArrayUtils } from "../utils/Array";
import { Dom } from "../utils/Dom";
import { assertDefined } from "../utils/core";

export class ToolController {
  tools: (
    | Move
    | SimplePen
    | LassoSelect
    | PaintBucket
    | ColorSwap
    | Stroke
    | Rectangle
    | Circle
    | ShapeSelect
    | RectangleSelect
    | ColorPicker
  )[];
  toolIconBuilder: ToolIconBuilder;
  currentSelectedTool: BaseTool | undefined;

  constructor() {
    this.tools = [
      new SimplePen(),
      new VerticalMirrorPen(),
      new PaintBucket(),
      new ColorSwap(),
      new Eraser(),
      new Stroke(),
      new Rectangle(),
      new Circle(),
      new Move(),
      new ShapeSelect(),
      new RectangleSelect(),
      new LassoSelect(),
      new Lighten(),
      new DitheringTool(),
      new ColorPicker()
    ];

    this.toolIconBuilder = new ToolIconBuilder();
  }

  /**
   * @public
   */
  init(): void {
    this.createToolsDom_();
    this.addKeyboardShortcuts_();

    // Initialize tool:
    // Set SimplePen as default selected tool:
    this.selectTool_(this.tools[0]);
    // Activate listener on tool panel:
    const toolSection = Dom.getElement<HTMLElement>("#tool-section");
    toolSection.addEventListener(
      "mousedown",
      this.onToolIconClicked_.bind(this)
    );

    $.subscribe(Events.SELECT_TOOL, this.onSelectToolEvent_.bind(this));
    $.subscribe(Events.SHORTCUTS_CHANGED, this.createToolsDom_.bind(this));
  }

  /**
   * @private
   */
  activateToolOnStage_(tool: BaseTool): void {
    const stage = document.body;
    const previousSelectedToolClass = stage.dataset.selectedToolClass;
    if (previousSelectedToolClass) {
      stage.classList.remove(previousSelectedToolClass);
      stage.classList.remove(Move.TOOL_ID);
    }
    const toolId = assertDefined(tool.toolId, "toolId");
    stage.classList.add(toolId);
    stage.dataset.selectedToolClass = toolId;
  }

  onSelectToolEvent_(event: JQueryEvent, toolId: string): void {
    const tool = this.getToolById_(toolId);
    if (tool) {
      this.selectTool_(tool);
    }
  }

  /**
   * @private
   */
  selectTool_(tool: BaseTool): void {
    this.currentSelectedTool = tool;
    this.activateToolOnStage_(this.currentSelectedTool);

    const selectedToolElement = document.querySelector(
      "#tool-section .tool-icon.selected"
    );
    if (selectedToolElement) {
      selectedToolElement.classList.remove("selected");
    }

    const toolElement = Dom.getElement<HTMLElement>(
      "[data-tool-id=" + tool.toolId + "]"
    );
    toolElement.classList.add("selected");

    $.publish(Events.TOOL_SELECTED, [tool]);
  }

  /**
   * @private
   */
  onToolIconClicked_(evt: Event): void {
    const target = evt.target as HTMLElement;
    const clickedTool = Dom.getParentWithData(target, "toolId");

    if (clickedTool) {
      const toolId = String(clickedTool.dataset.toolId);
      const tool = this.getToolById_(toolId);
      if (tool) {
        this.selectTool_(tool);
      }
    }
  }

  onKeyboardShortcut_(toolId: string, charkey: string): void {
    const tool = this.getToolById_(toolId);
    if (tool !== null) {
      this.selectTool_(tool);
    }
  }

  getToolById_(toolId: string): BaseTool | null {
    return ArrayUtils.find(this.tools, function (tool: BaseTool) {
      return tool.toolId == toolId;
    });
  }

  /**
   * @private
   */
  createToolsDom_(): void {
    let html = "";
    for (let i = 0; i < this.tools.length; i++) {
      const tool = this.tools[i];
      html += this.toolIconBuilder.createIcon(tool);
    }
    Dom.getElement<HTMLElement>("#tools-container").innerHTML = html;
  }

  addKeyboardShortcuts_(): void {
    for (let i = 0; i < this.tools.length; i++) {
      const tool = this.tools[i];
      assertDefined(app.shortcutService, "shortcutService").registerShortcut(
        assertDefined(tool.shortcut, "shortcut"),
        this.onKeyboardShortcut_.bind(
          this,
          assertDefined(tool.toolId, "toolId")
        )
      );
    }
  }
}
