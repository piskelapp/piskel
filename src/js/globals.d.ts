/// <reference types="vite/client" />
import type { WindowBridge } from "./bridge";
import type { SerializedData } from "./utils/serialization/Deserializer";

export type NwMenu = { createMacBuiltin(name: string): void };
export type NwWindow = {
  menu: NwMenu;
  on(event: "close", callback: () => void): void;
  close(force: boolean): void;
};
export type NwGui = {
  Menu: new (options: { type: "menubar" }) => NwMenu;
  Window: { get(): NwWindow };
};
export type NodeFs = {
  readFile(
    path: string,
    encoding: string,
    callback: (err: Error | null, data: string) => void
  ): void;
  writeFile(
    path: string,
    content: string,
    callback: (err: Error | null) => void
  ): void;
};

declare global {
  // biome-ignore lint/style/useConsistentTypeDefinitions: only an interface can augment Window
  interface Window {
    pskl: WindowBridge;
    piskelReadyCallbacks: Array<() => void>;
    _onPiskelReady: () => void;
    _externalPiskel?: SerializedData;
    process?: object;
    require: {
      (id: "nw.gui"): NwGui;
      (id: "fs"): NodeFs;
    };
  }
}
