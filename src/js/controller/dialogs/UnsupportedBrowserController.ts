import { Dom } from "@/utils/Dom";
import { UserAgent } from "@/utils/UserAgent";
import { AbstractDialogController } from "./AbstractDialogController";

export class UnsupportedBrowserController extends AbstractDialogController {
  init(): void {
    super.init();
    const currentUserAgentElement = Dom.getElement<HTMLElement>(
      "#current-user-agent"
    );
    currentUserAgentElement.innerText = UserAgent.getDisplayName();
  }
}
