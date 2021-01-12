// discourse-skip-module

define("sinon", () => {
  return { default: window.sinon };
});
define("qunit", () => {
  return {
    default: window.QUnit,
    test: window.QUnit.test,
    skip: window.QUnit.skip,
    module: window.QUnit.module,
  };
});
define("ember-qunit", () => {
  return {
    moduleFor: window.moduleFor,
    moduleForComponent: window.moduleForComponent,
  };
});
define("htmlbars-inline-precompile", () => {
  return {
    default: function (str) {
      return Ember.HTMLBars.compile(str[0]);
    },
  };
});

let _app;
define("@ember/test-helpers", () => {
  let helpers = {
    setApplication(app) {
      _app = app;
    },
    getApplication() {
      return _app;
    },
    async settled() {
      // No-op in pre ember-cli environment
    },
    TestModuleForComponent: window.TestModuleForComponent,
  };
  [
    "click",
    "visit",
    "currentURL",
    "currentRouteName",
    "fillIn",
    "setResolver",
    "triggerEvent",
  ].forEach((attr) => {
    helpers[attr] = function () {
      return window[attr](...arguments);
    };
  });
  helpers.triggerKeyEvent = window.keyEvent;
  return helpers;
});
define("pretender", () => {
  return { default: window.Pretender };
});
