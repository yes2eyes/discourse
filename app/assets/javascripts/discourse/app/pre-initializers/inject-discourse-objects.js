import TopicTrackingState, {
  startTracking,
} from "discourse/models/topic-tracking-state";
import DiscourseLocation from "discourse/lib/discourse-location";
import KeyValueStore from "discourse/lib/key-value-store";
import MessageBus from "message-bus-client";
import ScreenTrack from "discourse/lib/screen-track";
import SearchService from "discourse/services/search";
import Session from "discourse/models/session";
import Site from "discourse/models/site";
import Store from "discourse/models/store";
import User from "discourse/models/user";

const ALL_TARGETS = ["controller", "component", "route", "model", "adapter"];

export default {
  name: "inject-discourse-objects",
  after: "discourse-bootstrap",

  initialize(container, app) {
    ALL_TARGETS.forEach((t) =>
      app.inject(t, "appEvents", "service:app-events")
    );

    // backwards compatibility: remove when plugins have updated
    app.register("store:main", Store);
    app.appEvents = container.lookup("service:app-events");

    if (!app.hasRegistration("service:store")) {
      app.register("service:store", Store);
      ALL_TARGETS.forEach((t) => app.inject(t, "store", "service:store"));
    }

    // TODO: This should be included properly
    app.register("message-bus:main", MessageBus, { instantiate: false });

    ALL_TARGETS.concat("service").forEach((t) =>
      app.inject(t, "messageBus", "message-bus:main")
    );

    const siteSettings = app.SiteSettings;
    app.register("site-settings:main", siteSettings, { instantiate: false });
    ALL_TARGETS.concat("service").forEach((t) =>
      app.inject(t, "siteSettings", "site-settings:main")
    );

    const currentUser = User.current();
    app.register("current-user:main", currentUser, { instantiate: false });
    app.currentUser = currentUser;

    const topicTrackingState = TopicTrackingState.create({
      messageBus: MessageBus,
      siteSettings,
      currentUser,
    });
    app.register("topic-tracking-state:main", topicTrackingState, {
      instantiate: false,
    });
    ALL_TARGETS.forEach((t) =>
      app.inject(t, "topicTrackingState", "topic-tracking-state:main")
    );

    const site = Site.current();
    app.register("site:main", site, { instantiate: false });
    ALL_TARGETS.forEach((t) => app.inject(t, "site", "site:main"));

    app.register("search-service:main", SearchService);
    ALL_TARGETS.forEach((t) =>
      app.inject(t, "searchService", "search-service:main")
    );

    const session = Session.current();
    app.register("session:main", session, { instantiate: false });
    ALL_TARGETS.forEach((t) => app.inject(t, "session", "session:main"));
    app.inject("service", "session", "session:main");

    // TODO: Automatically register this service
    const screenTrack = new ScreenTrack(
      topicTrackingState,
      siteSettings,
      session,
      currentUser
    );
    app.register("service:screen-track", screenTrack, { instantiate: false });

    if (currentUser) {
      ["component", "route", "controller", "service"].forEach((t) => {
        app.inject(t, "currentUser", "current-user:main");
      });
    }

    app.register("location:discourse-location", DiscourseLocation);

    const keyValueStore = new KeyValueStore("discourse_");
    app.register("key-value-store:main", keyValueStore, { instantiate: false });
    ALL_TARGETS.forEach((t) =>
      app.inject(t, "keyValueStore", "key-value-store:main")
    );

    startTracking(topicTrackingState);
  },
};
