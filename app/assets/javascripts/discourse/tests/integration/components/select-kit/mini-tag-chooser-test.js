import componentTest, {
  setupRenderingTest,
} from "discourse/tests/helpers/component-test";
import {
  discourseModule,
  queryAll,
} from "discourse/tests/helpers/qunit-helpers";
import I18n from "I18n";
import hbs from "htmlbars-inline-precompile";
import selectKit from "discourse/tests/helpers/select-kit-helper";

discourseModule(
  "Integration | Component | select-kit/mini-tag-chooser",
  function (hooks) {
    setupRenderingTest(hooks);

    hooks.beforeEach(function () {
      this.set("subject", selectKit());
    });

    componentTest("displays tags", {
      template: hbs`{{mini-tag-chooser value=value}}`,

      beforeEach() {
        this.set("value", ["foo", "bar"]);
      },

      async test(assert) {
        assert.equal(this.subject.header().value(), "foo,bar");
      },
    });

    componentTest("create a tag", {
      template: hbs`{{mini-tag-chooser value=value}}`,

      beforeEach() {
        this.set("value", ["foo", "bar"]);
      },

      async test(assert) {
        assert.equal(this.subject.header().value(), "foo,bar");

        await this.subject.expand();
        await this.subject.fillInFilter("mon");
        assert.equal(queryAll(".select-kit-row").text().trim(), "monkey x1");
        await this.subject.fillInFilter("key");
        assert.equal(queryAll(".select-kit-row").text().trim(), "monkey x1");
        await this.subject.keyboard("enter");

        assert.equal(this.subject.header().value(), "foo,bar,monkey");
      },
    });

    componentTest("max_tags_per_topic", {
      template: hbs`{{mini-tag-chooser value=value}}`,

      beforeEach() {
        this.set("value", ["foo", "bar"]);
        this.siteSettings.max_tags_per_topic = 2;
      },

      async test(assert) {
        assert.equal(this.subject.header().value(), "foo,bar");

        await this.subject.expand();
        await this.subject.fillInFilter("baz");
        await this.subject.keyboard("enter");

        const error = queryAll(".select-kit-error").text();
        assert.equal(
          error,
          I18n.t("select_kit.max_content_reached", {
            count: this.siteSettings.max_tags_per_topic,
          })
        );
      },
    });
  }
);
