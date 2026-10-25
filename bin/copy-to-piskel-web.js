const rmdir = require('rmdir');
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const fse = require('fs-extra');

const PISKEL_PATH = path.resolve(__dirname, '..');
const PISKELAPP_PATH = path.resolve(__dirname, '../../piskel-web/src/p/create/sprite');
const PISKELAPP_KIDS_PATH = path.resolve(__dirname, '../../piskel-web/src/kids');

var pjson = require('../package.json');

const srcEditorPath = path.resolve(PISKELAPP_PATH, "index.html");
const srcTestEditorPath = path.resolve(PISKELAPP_PATH, "index_test.html");
const srcKidsEditorPath = path.resolve(PISKELAPP_KIDS_PATH, "index.html");

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

        /** Kids file moves  */

        // Clean up the kids target directory too, like the editor one above.
        // Bundle names contain the build date, so without this, every release
        // adds new bundles next to the previous ones instead of replacing them.
        await fse.remove(path.resolve(PISKELAPP_KIDS_PATH));
        console.log(`Kids target destination folder cleaned-up successfully!`);

        // Then, copy all kids statics from piskel into piskel-web
        await fse.copy(
            path.resolve(PISKEL_PATH, "dest/prod"),
            path.resolve(PISKELAPP_KIDS_PATH, "")
        );
        console.log(`All piskel kids statics copied successfully!`);

        // Now, rename piskel-web-partial-kids.html to index.html
        await fse.copy(
            path.resolve(PISKELAPP_KIDS_PATH, "piskelapp-partials/piskel-web-partial-kids.html"),
            srcKidsEditorPath
        );
        console.log(`Copied piskel-web-partial-kids.html to index.html successfully!`);

        // Clean up unused kids partial folder from copied files
        await fse.remove(path.resolve(PISKELAPP_KIDS_PATH, "piskelapp-partials"));
        console.log(`piskelapp-partials in kids folder deleted successfully!`);

        /** End: kids file moves */

        await fse.writeFile(path.resolve(PISKELAPP_PATH, "VERSION"), pjson.version);
        console.log(`VERSION file created successfully!`);

        // Record the exact piskel commit in a COMMIT file next to VERSION, so releases can be diffed against each other.
        // VERSION alone is not enough: it stays the same (e.g. x.y.z-SNAPSHOT) across releases.
        const commit = execSync('git rev-parse HEAD', { cwd: PISKEL_PATH }).toString().trim();
        await fse.writeFile(path.resolve(PISKELAPP_PATH, "COMMIT"), commit);
        console.log(`COMMIT file created successfully (${commit})!`);

        const readmeContent = `
          The content of the editor folder was copied from the piskel project.
          Do not edit this folder directly but instead edit the piskel project
          and release it inside piskel-web.
        `;
        await fse.writeFile(path.resolve(PISKELAPP_PATH, "README"), readmeContent);
        console.log(`README file created successfully!`);

    } catch (err) {
        console.error(`Failed to copy piskel statics`, err);
        // Exit with an error code, so that callers (npm, scripts, CI) see the failure.
        process.exitCode = 1;
    }
}

(async () => {
    await copyPiskelStaticsToPiskelWeb();
})();