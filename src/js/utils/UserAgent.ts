const ua = navigator.userAgent;

type SupportedUserAgent = "isEdge" | "isChrome" | "isFirefox";

const isEdge = /edge\//i.test(ua);
const isOpera = /OPR\//.test(ua);
const hasChrome = /Chrome/i.test(ua);
const hasSafari = /Safari\//.test(ua);
const isFirefox = /Firefox/i.test(ua);
const isChrome = hasChrome && !isOpera && !isEdge;
const isSafari = hasSafari && !isOpera && !isEdge;

const getVersion = function (): number | undefined {
  let match;
  if (isChrome) {
    match = /Chrome\/(\d+)/i.exec(ua);
  } else if (isFirefox) {
    match = /Firefox\/(\d+)/i.exec(ua);
  } else {
    return undefined;
  }
  // The regular expressions above always match when the checks pass.
  return parseInt(match === null ? "" : match[1], 10);
};

export type UserAgentInfo = {
  isEdge: boolean;
  isFirefox: boolean;
  isMac: boolean;
  isOpera: boolean;
  hasChrome: boolean;
  hasSafari: boolean;
  isChrome: boolean;
  isSafari: boolean;
  supportedUserAgents: SupportedUserAgent[];
  version: number | undefined;
  isUnsupported(): boolean;
  getDisplayName(): string;
};

export const UserAgent: UserAgentInfo = {
  isEdge: isEdge,
  isFirefox: isFirefox,
  isMac: /Mac/.test(ua),
  isOpera: isOpera,
  hasChrome: hasChrome,
  hasSafari: hasSafari,
  isChrome: isChrome,
  isSafari: isSafari,
  supportedUserAgents: ["isEdge", "isChrome", "isFirefox"],
  version: getVersion(),

  isUnsupported(): boolean {
    // Check that none of the supported UAs are set to true.
    return UserAgent.supportedUserAgents.every(function (
      uaTest: SupportedUserAgent
    ) {
      return !UserAgent[uaTest];
    });
  },

  getDisplayName(): string {
    if (UserAgent.isChrome) {
      return "Chrome";
    } else if (UserAgent.isFirefox) {
      return "Firefox";
    } else if (UserAgent.isSafari) {
      return "Safari";
    } else if (UserAgent.isOpera) {
      return "Opera";
    } else {
      return ua;
    }
  }
};
