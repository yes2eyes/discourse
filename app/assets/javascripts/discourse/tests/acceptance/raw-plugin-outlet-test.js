import { acceptance, queryAll } from "discourse/tests/helpers/qunit-helpers";
import {
  addRawTemplate,
  removeRawTemplate,
} from "discourse-common/lib/raw-templates";
import hbs from "htmlbars-inline-precompile";
import { test } from "qunit";
import { visit } from "@ember/test-helpers";

const CONNECTOR =
  "javascripts/raw-test/connectors/topic-list-before-status/lala";

acceptance("Raw Plugin Outlet", function (needs) {
  needs.hooks.beforeEach(() => {
    addRawTemplate(
      CONNECTOR,
      hbs`<span class='topic-lala'>{{context.topic.id}}</span>`
    );
  });

  needs.hooks.afterEach(() => {
    removeRawTemplate(CONNECTOR);
  });
  test("Renders the raw plugin outlet", async function (assert) {
    await visit("/");
    assert.ok(queryAll(".topic-lala").length > 0, "it renders the outlet");
    assert.equal(
      queryAll(".topic-lala:nth-of-type(1)")[0].innerText,
      "11557",
      "it has the topic id"
    );
  });
});
