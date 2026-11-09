import { Events } from "../Events";
import type { JQueryEvent } from "../lib/jquery-1.8.0";
import { ToolIconBuilder } from "../tools/ToolIconBuilder";
import type { AbstractTransformTool } from "../tools/transform/AbstractTransformTool";
import { Center } from "../tools/transform/Center";
import { Clone } from "../tools/transform/Clone";
import { Crop } from "../tools/transform/Crop";
import { Flip } from "../tools/transform/Flip";
import { Rotate } from "../tools/transform/Rotate";
import { Dom } from "../utils/Dom";
import { UserSettings } from "../utils/UserSettings";
import { assertDefined } from "../utils/core";

const SHOW_MORE_CLASS = "show-more";

type TransformTool = AbstractTransformTool | Crop;

export class TransformationsController {
  tools: TransformTool[];
  toolIconBuilder: ToolIconBuilder;
  container: HTMLElement | undefined;
  showMoreLink: HTMLElement | undefined;

  constructor() {
    this.tools = [
      new Flip(),
      new Rotate(),
      new Clone(),
      new Center(),
      new Crop()
    ];

    this.toolIconBuilder = new ToolIconBuilder();
  }

  init(): void {
    this.container = Dom.getElement<HTMLElement>(".transformations-container");
    this.container.addEventListener(
      "click",
      this.onTransformationClick_.bind(this)
    );

    this.showMoreLink = Dom.getElement<HTMLElement>(
      ".transformations-show-more-link",
      this.container
    );
    this.showMoreLink.addEventListener(
      "click",
      this.toggleShowMoreTools_.bind(this)
    );

    this.createToolsDom_();
    this.updateShowMoreLink_();

    $.subscribe(
      Events.USER_SETTINGS_CHANGED,
      this.onUserSettingsChange_.bind(this)
    );
  }

  applyTool(toolId: string, evt: MouseEvent): void {
    this.tools.forEach((tool: TransformTool) => {
      if (tool.toolId === toolId) {
        $.publish(Events.TRANSFORMATION_EVENT, [toolId, evt]);
        tool.applyTransformation(evt);
      }
    });
  }

  onTransformationClick_(evt: MouseEvent): void {
    const toolId = (evt.target as HTMLElement).dataset.toolId;
    if (toolId) {
      this.applyTool(toolId, evt);
    }
  }

  toggleShowMoreTools_(evt: Event): void {
    const showMore = UserSettings.get(UserSettings.TRANSFORM_SHOW_MORE);
    UserSettings.set(UserSettings.TRANSFORM_SHOW_MORE, !showMore);
  }

  onUserSettingsChange_(evt: JQueryEvent, settingName: string): void {
    if (settingName == UserSettings.TRANSFORM_SHOW_MORE) {
      this.updateShowMoreLink_();
    }
  }

  updateShowMoreLink_(): void {
    const showMoreEnabled = UserSettings.get(UserSettings.TRANSFORM_SHOW_MORE);
    assertDefined(this.container, "container").classList.toggle(
      SHOW_MORE_CLASS,
      showMoreEnabled
    );

    // Hide the link in case there are 4 or less tools available.
    assertDefined(this.showMoreLink, "showMoreLink").classList.toggle(
      "hidden",
      this.tools.length < 5
    );
  }

  createToolsDom_(): void {
    const html = this.tools.reduce((p: string, tool: TransformTool) => {
      return p + this.toolIconBuilder.createIcon(tool, "left");
    }, "");
    const toolsContainer = Dom.getElement<HTMLElement>(
      ".tools-wrapper",
      this.container
    );
    toolsContainer.innerHTML = html;
  }
}
