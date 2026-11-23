const { execSync } = require('child_process');
const path = require('path');
const { parseArgs } = require('util');
const fse = require('fs-extra');

const PISKEL_PATH = path.resolve(__dirname, '..');
const BUILD_PATH = path.resolve(PISKEL_PATH, "dest/prod");

var pjson = require('../package.json');

// The editor is shipped twice in piskel-web, as two independent copies.
// Each one can be released on its own, so the kids editor (no ads) can run a newer build
// than the main editor (with ads), e.g. to try a big update on /kids first.
const TARGETS = {
    editor: {
        folder: path.resolve(PISKEL_PATH, '../piskel-web/src/p/create/sprite'),
        partial: "piskel-web-partial.html",
    },
    kids: {
        folder: path.resolve(PISKEL_PATH, '../piskel-web/src/kids'),
        partial: "piskel-web-partial-kids.html",
    },
};

const USAGE = `Usage: node bin/copy-to-piskel-web.js [--only=editor|kids]
  (via npm: npm run release-piskel-web -- --only=kids)
  Without --only, both the editor and the kids editor are replaced.`;

const parseTargets = () => {
    let values;
    try {
        // strict mode rejects unknown options and positional arguments.
        ({ values } = parseArgs({ options: { only: { type: "string" } }, strict: true }));
    } catch (err) {
        throw new Error(`${err.message}\n${USAGE}`);
    }
    const target = values.only;
    if (target === undefined) {
        return Object.keys(TARGETS);
    }
    if (!TARGETS[target]) {
        throw new Error(`Unknown target "${target}".\n${USAGE}`);
    }
    return [target];
};

const copyTarget = async (name, commit) => {
    const { folder, partial } = TARGETS[name];
    console.log(`\n[${name}] Releasing into ${folder}`);

    // First clean up the target directory.
    // Bundle names contain the build date, so without this, every release
    // adds new bundles next to the previous ones instead of replacing them.
    await fse.remove(folder);
    console.log(`[${name}] Target destination folder cleaned-up successfully!`);

    // Then, copy all statics from piskel into piskel-web
    await fse.copy(BUILD_PATH, folder);
    console.log(`[${name}] All piskel statics copied successfully!`);

    // Use the piskel-web partial as index.html, instead of the standalone index.html.
    await fse.copy(path.resolve(folder, "piskelapp-partials", partial), path.resolve(folder, "index.html"));
    console.log(`[${name}] Copied ${partial} to index.html successfully!`);

    // Clean up unused partial folder from copied files
    await fse.remove(path.resolve(folder, "piskelapp-partials"));
    console.log(`[${name}] piskelapp-partials folder deleted successfully!`);

    // VERSION and COMMIT are written in each folder, since both can ship different builds.
    await fse.writeFile(path.resolve(folder, "VERSION"), pjson.version);
    console.log(`[${name}] VERSION file created successfully!`);

    // Record the exact piskel commit, so releases can be diffed against each other.
    // VERSION alone is not enough: it stays the same (e.g. x.y.z-SNAPSHOT) across releases.
    // piskel-web also reports it to Sentry as the release.
    await fse.writeFile(path.resolve(folder, "COMMIT"), commit);
    console.log(`[${name}] COMMIT file created successfully (${commit})!`);

    // When this build was released into piskel-web, shown with the commit in the editor pages' console.
    const releaseDate = new Date().toISOString();
    await fse.writeFile(path.resolve(folder, "RELEASE_DATE"), releaseDate);
    console.log(`[${name}] RELEASE_DATE file created successfully (${releaseDate})!`);

    const readmeContent = `
          The content of the editor folder was copied from the piskel project.
          Do not edit this folder directly but instead edit the piskel project
          and release it inside piskel-web.
        `;
    await fse.writeFile(path.resolve(folder, "README"), readmeContent);
    console.log(`[${name}] README file created successfully!`);
};

const copyPiskelStaticsToPiskelWeb = async () => {
    try {
        const targets = parseTargets();
        const commit = execSync('git rev-parse HEAD', { cwd: PISKEL_PATH }).toString().trim();
        for (const target of targets) {
            await copyTarget(target, commit);
        }
    } catch (err) {
        console.error(`Failed to copy piskel statics`, err);
        // Exit with an error code, so that callers (npm, scripts, CI) see the failure.
        process.exitCode = 1;
    }
}

(async () => {
    await copyPiskelStaticsToPiskelWeb();
})();
