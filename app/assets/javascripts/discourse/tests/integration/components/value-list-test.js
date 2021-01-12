import componentTest, {
  setupRenderingTest,
} from "discourse/tests/helpers/component-test";
import {
  discourseModule,
  queryAll,
} from "discourse/tests/helpers/qunit-helpers";
import { click } from "@ember/test-helpers";
import hbs from "htmlbars-inline-precompile";
import selectKit from "discourse/tests/helpers/select-kit-helper";

discourseModule("Integration | Component | value-list", function (hooks) {
  setupRenderingTest(hooks);

  componentTest("adding a value", {
    template: hbs`{{value-list values=values}}`,

    skip: true,

    beforeEach() {
      this.set("values", "vinkas\nosama");
    },

    async test(assert) {
      await selectKit().expand();
      await selectKit().fillInFilter("eviltrout");
      await selectKit().keyboard("enter");

      assert.ok(
        queryAll(".values .value").length === 3,
        "it adds the value to the list of values"
      );

      assert.deepEqual(
        this.values,
        "vinkas\nosama\neviltrout",
        "it adds the value to the list of values"
      );
    },
  });

  componentTest("removing a value", {
    template: hbs`{{value-list values=values}}`,

    beforeEach() {
      this.set("values", "vinkas\nosama");
    },

    async test(assert) {
      await click(".values .value[data-index='0'] .remove-value-btn");

      assert.ok(
        queryAll(".values .value").length === 1,
        "it removes the value from the list of values"
      );

      assert.equal(this.values, "osama", "it removes the expected value");

      await selectKit().expand();

      assert.ok(
        queryAll(".select-kit-collection li.select-kit-row span.name")[0]
          .innerText === "vinkas",
        "it adds the removed value to choices"
      );
    },
  });

  componentTest("selecting a value", {
    template: hbs`{{value-list values=values choices=choices}}`,

    beforeEach() {
      this.setProperties({
        values: "vinkas\nosama",
        choices: ["maja", "michael"],
      });
    },

    async test(assert) {
      await selectKit().expand();
      await selectKit().selectRowByValue("maja");

      assert.ok(
        queryAll(".values .value").length === 3,
        "it adds the value to the list of values"
      );

      assert.deepEqual(
        this.values,
        "vinkas\nosama\nmaja",
        "it adds the value to the list of values"
      );
    },
  });

  componentTest("array support", {
    template: hbs`{{value-list values=values inputType='array'}}`,

    beforeEach() {
      this.set("values", ["vinkas", "osama"]);
    },

    async test(assert) {
      this.set("values", ["vinkas", "osama"]);

      await selectKit().expand();
      await selectKit().fillInFilter("eviltrout");
      await selectKit().keyboard("enter");

      assert.ok(
        queryAll(".values .value").length === 3,
        "it adds the value to the list of values"
      );

      assert.deepEqual(
        this.values,
        ["vinkas", "osama", "eviltrout"],
        "it adds the value to the list of values"
      );
    },
  });

  componentTest("delimiter support", {
    template: hbs`{{value-list values=values inputDelimiter='|'}}`,

    beforeEach() {
      this.set("values", "vinkas|osama");
    },

    skip: true,

    async test(assert) {
      await selectKit().expand();
      await selectKit().fillInFilter("eviltrout");
      await selectKit().keyboard("enter");

      assert.ok(
        queryAll(".values .value").length === 3,
        "it adds the value to the list of values"
      );

      assert.deepEqual(
        this.values,
        "vinkas|osama|eviltrout",
        "it adds the value to the list of values"
      );
    },
  });
});
