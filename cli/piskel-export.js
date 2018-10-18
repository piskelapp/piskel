// PhantomJS system
const system = require('system');

// Exporter
const exporter = require('./export-png');

// Get passed args
const args = system.args;

// Parse input piskel file and options
const piskelFile = JSON.parse(args[1]);
const options = JSON.parse(args[2]);

// Create page w/ canvas
const page = require('webpage').create();

page.content = '<html><body></body></html>';

// Inject Piskel JS
page.injectJs(options.piskelAppJsPath);

// Listen for page console logs
page.onConsoleMessage = function (msg) {
    console.log(msg);
};

// Run page logic
page.evaluate(function (piskelFile, options, onPageEvaluate) {
    // Zero out default body margin
    document.body.style.margin = 0;

    // Deserialize piskel file and run exporter's page evaluate task
    pskl.utils.serialization.Deserializer.deserialize(piskelFile, function (piskel) {
       onPageEvaluate(window, options, piskel);
    });
}, piskelFile, options, exporter.onPageEvaluate);

// Wait for page to trigger exit
page.onCallback = function (data) {
    // Run exporter page exit task
    exporter.onPageExit(page, options, data);

    // Exit
    phantom.exit(0);
};
