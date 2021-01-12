import {
  applyPretender,
  exists,
  resetSite,
} from "discourse/tests/helpers/qunit-helpers";
import createPretender, {
  applyDefaultHandlers,
  pretenderHelpers,
} from "discourse/tests/helpers/create-pretender";
import {
  currentSettings,
  resetSettings,
} from "discourse/tests/helpers/site-settings";
import { getOwner, setDefaultOwner } from "discourse-common/lib/get-owner";
import { setApplication, setResolver } from "@ember/test-helpers";
import { setupS3CDN, setupURL } from "discourse-common/lib/get-url";
import Application from "../app";
import MessageBus from "message-bus-client";
import PreloadStore from "discourse/lib/preload-store";
import QUnit from "qunit";
import { ScrollingDOMMethods } from "discourse/mixins/scrolling";
import Session from "discourse/models/session";
import User from "discourse/models/user";
import bootbox from "bootbox";
import { buildResolver } from "discourse-common/resolver";
import { clearAppEventsCache } from "discourse/services/app-events";
import { createHelperContext } from "discourse-common/lib/helpers";
import deprecated from "discourse-common/lib/deprecated";
import { flushMap } from "discourse/models/store";
import { registerObjects } from "discourse/pre-initializers/inject-discourse-objects";
import { setupApplicationTest } from "ember-qunit";
import sinon from "sinon";

const Plugin = $.fn.modal;
const Modal = Plugin.Constructor;

function AcceptanceModal(option, _relatedTarget) {
  return this.each(function () {
    var $this = $(this);
    var data = $this.data("bs.modal");
    var options = $.extend(
      {},
      Modal.DEFAULTS,
      $this.data(),
      typeof option === "object" && option
    );

    if (!data) {
      $this.data("bs.modal", (data = new Modal(this, options)));
    }
    data.$body = $("#ember-testing");

    if (typeof option === "string") {
      data[option](_relatedTarget);
    } else if (options.show) {
      data.show(_relatedTarget);
    }
  });
}

let app;
let started = false;

function createApplication(config, settings) {
  app = Application.create(config);
  setApplication(app);
  setResolver(buildResolver("discourse").create({ namespace: app }));

  let container = app.__registry__.container();
  app.__container__ = container;
  setDefaultOwner(container);

  app.rootElement = "#ember-testing";
  app.setupForTesting();
  app.injectTestHelpers();

  // TODO: remove after fixing
  app.testing = false;

  if (!started) {
    app.start();
    started = true;
  }

  app.SiteSettings = settings;
  // TODO: inject-discourse-objects intializer does this already?
  registerObjects(container, app);
  return app;
}

export default function setupTests(config) {
  sinon.config = {
    injectIntoThis: false,
    injectInto: null,
    properties: ["spy", "stub", "mock", "clock", "sandbox"],
    useFakeTimers: true,
    useFakeServer: false,
  };

  // Stop the message bus so we don't get ajax calls
  MessageBus.stop();

  if (!setupApplicationTest) {
    // Legacy testing environment
    let settings = resetSettings();
    app = createApplication(config, settings);
  }

  $.fn.modal = AcceptanceModal;

  // disable logster error reporting
  if (window.Logster) {
    window.Logster.enabled = false;
  } else {
    window.Logster = { enabled: false };
  }

  let server;

  Object.defineProperty(window, "server", {
    get() {
      deprecated(
        "Accessing the global variable `server` is deprecated. Use a `pretend()` method instead.",
        {
          since: "2.6.0.beta.3",
          dropFrom: "2.6.0",
        }
      );
      return server;
    },
  });
  Object.defineProperty(window, "sandbox", {
    get() {
      deprecated(
        "Accessing the global variable `sandbox` is deprecated. Import `sinon` instead",
        {
          since: "2.6.0.beta.4",
          dropFrom: "2.6.0",
        }
      );
      return sinon;
    },
  });
  Object.defineProperty(window, "exists", {
    get() {
      deprecated(
        "Accessing the global function `exists` is deprecated. Import it instead.",
        {
          since: "2.6.0.beta.4",
          dropFrom: "2.6.0",
        }
      );
      return exists;
    },
  });

  QUnit.testStart(function (ctx) {
    bootbox.$body = $("#ember-testing");
    let settings = resetSettings();

    if (setupApplicationTest) {
      // Ember CLI testing environment
      app = createApplication(config, settings);
    }

    server = createPretender;
    server.handlers = [];
    applyDefaultHandlers(server);

    server.prepareBody = function (body) {
      if (body && typeof body === "object") {
        return JSON.stringify(body);
      }
      return body;
    };

    if (QUnit.config.logAllRequests) {
      server.handledRequest = function (verb, path) {
        // eslint-disable-next-line no-console
        console.log("REQ: " + verb + " " + path);
      };
    }

    server.unhandledRequest = function (verb, path) {
      if (QUnit.config.logAllRequests) {
        // eslint-disable-next-line no-console
        console.log("REQ: " + verb + " " + path + " missing");
      }

      const error =
        "Unhandled request in test environment: " + path + " (" + verb + ")";

      // eslint-disable-next-line no-console
      console.error(error);
      throw new Error(error);
    };

    server.checkPassthrough = (request) =>
      request.requestHeaders["Discourse-Script"];

    applyPretender(ctx.module, server, pretenderHelpers());

    setupURL(null, "http://localhost:3000", "");
    setupS3CDN(null, null);

    Session.resetCurrent();
    User.resetCurrent();
    let site = resetSite(settings);
    createHelperContext({
      siteSettings: settings,
      capabilities: {},
      site,
    });

    PreloadStore.reset();

    sinon.stub(ScrollingDOMMethods, "screenNotFull");
    sinon.stub(ScrollingDOMMethods, "bindOnScroll");
    sinon.stub(ScrollingDOMMethods, "unbindOnScroll");

    // Unless we ever need to test this, let's leave it off.
    $.fn.autocomplete = function () {};
  });

  QUnit.testDone(function () {
    sinon.restore();

    // Destroy any modals
    $(".modal-backdrop").remove();
    flushMap();

    if (!setupApplicationTest) {
      // ensures any event not removed is not leaking between tests
      // most likely in intialisers, other places (controller, component...)
      // should be fixed in code
      clearAppEventsCache(getOwner(this));
    }

    MessageBus.unsubscribe("*");
    server = null;
  });

  // Load ES6 tests
  function getUrlParameter(name) {
    name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
    var regex = new RegExp("[\\?&]" + name + "=([^&#]*)");
    var results = regex.exec(location.search);
    return results === null
      ? ""
      : decodeURIComponent(results[1].replace(/\+/g, " "));
  }

  let skipCore = getUrlParameter("qunit_skip_core") === "1";
  let pluginPath = getUrlParameter("qunit_single_plugin")
    ? "/" + getUrlParameter("qunit_single_plugin") + "/"
    : "/plugins/";

  Object.keys(requirejs.entries).forEach(function (entry) {
    let isTest = /\-test/.test(entry);
    let regex = new RegExp(pluginPath);
    let isPlugin = regex.test(entry);

    if (isTest && (!skipCore || isPlugin)) {
      require(entry, null, null, true);
    }
  });

  // forces 0 as duration for all jquery animations
  jQuery.fx.off = true;

  if (!setupApplicationTest) {
    // Legacy testing environment
    setApplication(app);
    setDefaultOwner(app.__container__);
    resetSite();
  }
}
