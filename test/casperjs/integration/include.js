/**
 * Collection of shared methods for casperjs integration tests.
 */

function evalLine(line) {
  return casper.evaluate(
    'function () {return ' + line + '}'
  );
}

function getValue(selector) {
  return casper.evaluate(
    'function () { \
      return document.querySelector(\'' + selector + '\').value;\
    }');
}

function isChecked(selector) {
  return casper.evaluate(
    'function () { \
      return document.querySelector(\'' + selector + '\').checked;\
    }');
}

function isDrawerExpanded() {
  return casper.evaluate(function () {
    var settingsElement = document.querySelector('[data-pskl-controller="settings"]');
    return settingsElement.classList.contains('expanded');
  });
}
