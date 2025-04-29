const rmdir = require('rmdir');
const path = require('path');
const fs = require('fs');
const fse = require('fs-extra');

const PISKEL_PATH = path.resolve(__dirname, '..');
const PISKELAPP_PATH = path.resolve(__dirname, '../../piskel-web/src/p/create/sprite');

var pjson = require('../package.json');

const srcEditorPath = path.resolve(PISKELAPP_PATH, "index.html");

const copyPiskelStaticsToPiskelWeb = async () => {
    try {
        // First clean up the target directory.
        await fse.remove(path.resolve(PISKELAPP_PATH));
        console.log(`Target destination folder cleaned-up successfully!`);

        // Then, copy all statics from piskel into piskel-web
        await fse.copy(
            path.resolve(PISKEL_PATH, "dest/prod"),
            path.resolve(PISKELAPP_PATH, "")
        );
        console.log(`All piskel statics copied successfully!`);

        // Then, remove the index.html, we don't use it for piskel-web.
        await fse.unlink(srcEditorPath);
        console.log(`index.html deleted successfully!`);

        // Now, rename piskel-web-partial.html to index.html
        await fse.copy(
            path.resolve(PISKELAPP_PATH, "piskelapp-partials/piskel-web-partial.html"),
            srcEditorPath
        );
        console.log(`Copied piskel-web-partial.html to index.html successfully!`);

        // Clean up unused partial folder from copied files
        await fse.remove(path.resolve(PISKELAPP_PATH, "piskelapp-partials"));
        console.log(`piskelapp-partials folder deleted successfully!`);

        await fse.writeFile(path.resolve(PISKELAPP_PATH, "VERSION"), pjson.version);
        console.log(`VERSION file created successfully!`);

        const readmeContent = `
          The content of the editor folder was copied from the piskel project.
          Do not edit this folder directly but instead edit the piskel project
          and release it inside piskel-web.
        `;
        await fse.writeFile(path.resolve(PISKELAPP_PATH, "README"), readmeContent);
        console.log(`README file created successfully!`);

    } catch (err) {
        console.error(`Failed to copy piskel statics`, err);
    }
}

(async () => {
    await copyPiskelStaticsToPiskelWeb();
})();