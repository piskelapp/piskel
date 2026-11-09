import { Events } from "../../Events";
import { app } from "../../app";
import { KeyUtils } from "../../service/keyboard/KeyUtils";
import type { Shortcut } from "../../service/keyboard/Shortcut";
import {
  type ShortcutCategory,
  Shortcuts
} from "../../service/keyboard/Shortcuts";
import { Dom } from "../../utils/Dom";
import { Template } from "../../utils/Template";
import { UserAgent } from "../../utils/UserAgent";
import { assertDefined } from "../../utils/core";
import { AbstractDialogController } from "./AbstractDialogController";

const SHORTCUT_EDITING_CLASSNAME = "cheatsheet-shortcut-editing";

type ShortcutDescriptor = { shortcut: Shortcut; iconClass: string };

export class CheatsheetController extends AbstractDialogController {
  cheatsheetEl: HTMLElement | null | undefined;
  eventTrapInput: HTMLElement | undefined;

  constructor() {
    super();
  }

  init(): void {
    super.init();

    this.cheatsheetEl = Dom.getElement<HTMLElement>("#cheatsheetContainer");
    this.eventTrapInput = Dom.getElement<HTMLInputElement>(
      "#cheatsheetEventTrap"
    );

    this.addEventListener(
      ".cheatsheet-restore-defaults",
      "click",
      this.onRestoreDefaultsClick_
    );
    this.addEventListener(this.cheatsheetEl, "click", this.onCheatsheetClick_);
    this.addEventListener(
      this.eventTrapInput,
      "keydown",
      this.onEventTrapKeydown_
    );

    this.onShortcutsChanged_ = this.onShortcutsChanged_.bind(this);
    $.subscribe(Events.SHORTCUTS_CHANGED, this.onShortcutsChanged_);

    this.initMarkup_();
    Dom.getElement<HTMLElement>(".cheatsheet-helptext").setAttribute(
      "title",
      this.getHelptextTitle_()
    );
  }

  destroy(): void {
    assertDefined(this.eventTrapInput, "eventTrapInput").blur();

    $.unsubscribe(Events.SHORTCUTS_CHANGED, this.onShortcutsChanged_);
    this.cheatsheetEl = null;

    super.destroy();
  }

  onRestoreDefaultsClick_(): void {
    if (
      window.confirm(
        "Replace all custom shortcuts by the default Piskel shortcuts ?"
      )
    ) {
      assertDefined(
        app.shortcutService,
        "shortcutService"
      ).restoreDefaultShortcuts();
    }
  }

  onShortcutsChanged_(): void {
    this.initMarkup_();
  }

  onCheatsheetClick_(evt: Event): void {
    const shortcutEl = Dom.getParentWithData(
      evt.target as HTMLElement,
      "shortcutId"
    );
    if (!shortcutEl) {
      Dom.removeClass(SHORTCUT_EDITING_CLASSNAME);
      return;
    }

    const shortcutId = String(shortcutEl.dataset.shortcutId);
    const shortcut = assertDefined(
      assertDefined(app.shortcutService, "shortcutService").getShortcutById(
        shortcutId
      ),
      "shortcut"
    );

    if (shortcutEl.classList.contains(SHORTCUT_EDITING_CLASSNAME)) {
      Dom.removeClass(SHORTCUT_EDITING_CLASSNAME);
      assertDefined(this.eventTrapInput, "eventTrapInput").blur();
    } else if (shortcut.isEditable()) {
      Dom.removeClass(SHORTCUT_EDITING_CLASSNAME);
      shortcutEl.classList.add(SHORTCUT_EDITING_CLASSNAME);
      assertDefined(this.eventTrapInput, "eventTrapInput").focus();
    }
  }

  onEventTrapKeydown_(evt: KeyboardEvent): void {
    const shortcutEl = document.querySelector<HTMLElement>(
      "." + SHORTCUT_EDITING_CLASSNAME
    );
    if (!shortcutEl) {
      return;
    }

    const shortcutKeyObject = KeyUtils.createKeyFromEvent(evt);
    if (!shortcutKeyObject) {
      return;
    }

    const shortcutKeyString = KeyUtils.stringify(shortcutKeyObject);
    const shortcutId = String(shortcutEl.dataset.shortcutId);
    const shortcut = assertDefined(
      assertDefined(app.shortcutService, "shortcutService").getShortcutById(
        shortcutId
      ),
      "shortcut"
    );
    assertDefined(app.shortcutService, "shortcutService").updateShortcut(
      shortcut,
      shortcutKeyString
    );

    shortcutEl.classList.remove(SHORTCUT_EDITING_CLASSNAME);
    assertDefined(this.eventTrapInput, "eventTrapInput").blur();

    evt.preventDefault();
  }

  initMarkup_(): void {
    this.initMarkupForCategory_(
      "TOOL",
      ".cheatsheet-tool-shortcuts",
      this.getToolIconClass_
    );
    this.initMarkupForCategory_("MISC", ".cheatsheet-misc-shortcuts");
    this.initMarkupForCategory_("COLOR", ".cheatsheet-color-shortcuts");
    this.initMarkupForCategory_("SELECTION", ".cheatsheet-selection-shortcuts");
    this.initMarkupForCategory_("STORAGE", ".cheatsheet-storage-shortcuts");
  }

  getToolIconClass_(shortcut: Shortcut): string {
    return "tool-icon cheatsheet-icon-" + shortcut.getId();
  }

  initMarkupForCategory_(
    category: ShortcutCategory,
    container: string,
    iconClassProvider?: (shortcut: Shortcut) => string
  ): void {
    const shortcutMap: Record<string, Shortcut> = Shortcuts[category];

    const descriptors = Object.keys(shortcutMap).map((shortcutKey: string) => {
      return this.toDescriptor_(shortcutMap[shortcutKey], iconClassProvider);
    });

    this.initMarkupForDescriptors_(descriptors, container);
  }

  toDescriptor_(
    shortcut: Shortcut,
    iconClassProvider?: (shortcut: Shortcut) => string
  ): ShortcutDescriptor {
    const iconClass =
      typeof iconClassProvider == "function" ? iconClassProvider(shortcut) : "";
    return {
      shortcut: shortcut,
      iconClass: iconClass
    };
  }

  initMarkupForDescriptors_(
    descriptors: ShortcutDescriptor[],
    containerSelector: string
  ): void {
    const container = document.querySelector(containerSelector);
    if (!container) {
      return;
    }
    const markupArray = descriptors.map(
      this.getMarkupForDescriptor_.bind(this)
    );
    container.innerHTML = markupArray.join("");
  }

  getMarkupForDescriptor_(descriptor: ShortcutDescriptor): string {
    const shortcutTemplate = Template.get("cheatsheet-shortcut-template");
    const shortcut = descriptor.shortcut;
    const description = shortcut.isCustom()
      ? shortcut.getDescription() + " *"
      : shortcut.getDescription();

    const shortcutClasses = [];
    if (shortcut.isUndefined()) {
      shortcutClasses.push("cheatsheet-shortcut-undefined");
    }
    if (shortcut.isEditable()) {
      shortcutClasses.push("cheatsheet-shortcut-editable");
    }

    const title = shortcut.isEditable()
      ? "Click to edit the key"
      : "Shortcut cannot be remapped";

    const markup = Template.replace(shortcutTemplate, {
      id: shortcut.getId(),
      title: title,
      icon: descriptor.iconClass,
      description: description,
      // Avoid sanitization
      "!key!": this.formatKey_(shortcut.getDisplayKey()),
      className: shortcutClasses.join(" ")
    });

    return markup;
  }

  formatKey_(key: string): string {
    if (UserAgent.isMac) {
      key = key.replace("ctrl", "cmd");
      key = key.replace("alt", "option");
    }
    key = key.replace(/left/i, "&larr;");
    key = key.replace(/up/i, "&uarr;");
    key = key.replace(/right/i, "&rarr;");
    key = key.replace(/down/i, "&darr;");
    key = key.replace(/>/g, "&gt;");
    key = key.replace(/</g, "&lt;");
    // add spaces around '+' delimiters
    key = key.replace(/([^ ])\+([^ ])/g, "$1 + $2");
    return key;
  }

  getHelptextTitle_(): string {
    const helpItems = [
      "Click on a shortcut to change the key.",
      "When the shortcut blinks, press the key on your keyboard to assign it.",
      "White shortcuts can not be edited.",
      "Click on 'Restore default shortcuts' to erase all custom shortcuts."
    ];

    let helptextTitle = helpItems.reduce(function (p, n) {
      return (
        p + '<div class="cheatsheet-helptext-tooltip-item">' + n + "</div>"
      );
    }, "");
    helptextTitle =
      '<div class="cheatsheet-helptext-tooltip">' + helptextTitle + "</div>";
    return helptextTitle;
  }
}
