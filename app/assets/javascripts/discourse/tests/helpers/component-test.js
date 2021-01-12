import EmberObject from "@ember/object";
import Session from "discourse/models/session";
import Site from "discourse/models/site";
import { TestModuleForComponent } from "@ember/test-helpers";
import TopicTrackingState from "discourse/models/topic-tracking-state";
import User from "discourse/models/user";
import { autoLoadModules } from "discourse/initializers/auto-load-modules";
import createStore from "discourse/tests/helpers/create-store";
import { currentSettings } from "discourse/tests/helpers/site-settings";
import { test } from "qunit";

export function setupRenderingTest(hooks) {
  let testModule;

  hooks.before(function () {
    const name = this.moduleName.split("|").pop();
    testModule = new TestModuleForComponent(name, {
      integration: true,
    });
  });

  hooks.beforeEach(function () {
    testModule.setContext(this);
    return testModule.setup(...arguments);
  });

  hooks.afterEach(function () {
    return testModule.teardown(...arguments);
  });

  hooks.after(function () {
    testModule = null;
  });
}

if (typeof andThen === "undefined") {
  window.andThen = function (callback) {
    return callback.call(this);
  };
}

export default function (name, opts) {
  opts = opts || {};

  if (opts.skip) {
    return;
  }

  test(name, async function (assert) {
    this.site = Site.current();
    this.session = Session.current();

    this.registry.register("site-settings:main", currentSettings(), {
      instantiate: false,
    });
    this.registry.register("capabilities:main", EmberObject);
    this.registry.register("site:main", this.site, { instantiate: false });
    this.registry.register("session:main", this.session, {
      instantiate: false,
    });
    this.registry.injection("component", "siteSettings", "site-settings:main");
    this.registry.injection("component", "appEvents", "service:app-events");
    this.registry.injection("component", "capabilities", "capabilities:main");
    this.registry.injection("component", "site", "site:main");
    this.registry.injection("component", "session", "session:main");

    this.siteSettings = currentSettings();
    autoLoadModules(this.container, this.registry);

    const store = createStore();
    if (!opts.anonymous) {
      const currentUser = User.create({ username: "eviltrout" });
      this.currentUser = currentUser;
      this.registry.register("current-user:main", this.currentUser, {
        instantiate: false,
      });
      this.registry.injection("component", "currentUser", "current-user:main");
      this.registry.register(
        "topic-tracking-state:main",
        TopicTrackingState.create({ currentUser }),
        { instantiate: false }
      );
    }

    this.registry.register("service:store", store, { instantiate: false });

    if (opts.beforeEach) {
      opts.beforeEach.call(this, store);
    }

    await andThen(() => {
      return this.render(opts.template);
    });

    await andThen(() => {
      return opts.test.call(this, assert);
    }).finally(async () => {
      if (opts.afterEach) {
        await andThen(() => {
          return opts.afterEach.call(opts);
        });
      }
    });
  });
}
