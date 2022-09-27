const { nwbuild } = require("nw-builder");

nwbuild({
    files: "./dest/prod/**",
    version: "0.67.1",
    flavor: "sdk",
    cacheDir: "./dest/desktop/cache",
    mode: "run",
});
