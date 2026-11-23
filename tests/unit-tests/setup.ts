// The vendored libraries are classic scripts, loaded before the tests as they
// are before the application in the bundle.
declare const __PISKEL_VENDORS__: string[];

for (const vendor of __PISKEL_VENDORS__) {
  await new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "/src/" + vendor;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Could not load " + vendor));
    document.head.appendChild(script);
  });
}

export {};
