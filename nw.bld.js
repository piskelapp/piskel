const { nwbuild } = require("nw-builder");

nwbuild({
    files: ["./dest/prod/**"],
    version: "0.67.1",
    flavor: "normal",
    platforms: ["linux32", "linux64", "osx64", "win32", "win64"],
    cacheDir: "./dest/desktop/cache",
    buildDir: "./dest/desktop/build",
    mode: "build",
});