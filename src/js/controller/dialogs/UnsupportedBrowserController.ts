import { Dom } from "../../utils/Dom";
import { UserAgent } from "../../utils/UserAgent";
import { AbstractDialogController } from "./AbstractDialogController";

export class UnsupportedBrowserController extends AbstractDialogController {
  constructor() {
    super();
  }

  init(): void {
    super.init();
    const currentUserAgentElement = Dom.getElement<HTMLElement>(
      "#current-user-agent"
    );
    currentUserAgentElement.innerText = UserAgent.getDisplayName();
  }
}
