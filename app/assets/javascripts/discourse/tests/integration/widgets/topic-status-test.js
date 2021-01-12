import componentTest, {
  setupRenderingTest,
} from "discourse/tests/helpers/component-test";
import {
  discourseModule,
  queryAll,
} from "discourse/tests/helpers/qunit-helpers";
import TopicStatusIcons from "discourse/helpers/topic-status-icons";
import hbs from "htmlbars-inline-precompile";

discourseModule("Integration | Component | Widget | topic-status", function (
  hooks
) {
  setupRenderingTest(hooks);

  componentTest("basics", {
    template: hbs`{{mount-widget widget="topic-status" args=args}}`,
    beforeEach(store) {
      this.set("args", {
        topic: store.createRecord("topic", { closed: true }),
        disableActions: true,
      });
    },
    test(assert) {
      assert.ok(queryAll(".topic-status .d-icon-lock").length);
    },
  });

  componentTest("extendability", {
    template: hbs`{{mount-widget widget="topic-status" args=args}}`,
    beforeEach(store) {
      TopicStatusIcons.addObject([
        "has_accepted_answer",
        "far-check-square",
        "solved",
      ]);
      this.set("args", {
        topic: store.createRecord("topic", {
          has_accepted_answer: true,
        }),
        disableActions: true,
      });
    },
    test(assert) {
      assert.ok(queryAll(".topic-status .d-icon-far-check-square").length);
    },
  });
});
