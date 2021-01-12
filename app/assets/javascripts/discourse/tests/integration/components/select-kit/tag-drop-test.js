import componentTest, {
  setupRenderingTest,
} from "discourse/tests/helpers/component-test";
import I18n from "I18n";
import Site from "discourse/models/site";
import { discourseModule } from "discourse/tests/helpers/qunit-helpers";
import hbs from "htmlbars-inline-precompile";
import pretender from "discourse/tests/helpers/create-pretender";
import selectKit from "discourse/tests/helpers/select-kit-helper";
import { set } from "@ember/object";

function initTags(context) {
  const categories = context.site.categoriesList;
  const parentCategory = categories.findBy("id", 2);
  const childCategories = categories.filter(
    (c) => c.parentCategory === parentCategory
  );

  // top_tags
  context.setProperties({
    firstCategory: parentCategory,
    secondCategory: childCategories.firstObject,
    tagId: "jeff",
  });
}

discourseModule("Integration | Component | select-kit/tag-drop", function (
  hooks
) {
  setupRenderingTest(hooks);

  hooks.beforeEach(function () {
    this.set("subject", selectKit());

    const site = Site.current();
    set(site, "top_tags", ["jeff", "neil", "arpit", "régis"]);

    const response = (object) => {
      return [200, { "Content-Type": "application/json" }, object];
    };

    pretender.get("/tags/filter/search", (params) => {
      if (params.queryParams.q === "rég") {
        return response({
          results: [{ id: "régis", text: "régis", count: 2, pm_count: 0 }],
        });
      } else if (params.queryParams.q === "dav") {
        return response({
          results: [{ id: "David", text: "David", count: 2, pm_count: 0 }],
        });
      }
    });
  });

  componentTest("default", {
    template: hbs`
      {{tag-drop
        firstCategory=firstCategory
        secondCategory=secondCategory
        tagId=tagId
        options=(hash
          tagId=tagId
        )
      }}
    `,

    beforeEach() {
      initTags(this);
    },

    async test(assert) {
      await this.subject.expand();

      assert.ok(true);
      // const row = this.subject.rowByValue(this.category.id);
      // assert.ok(
      //   exists(row.el().find(".category-desc")),
      //   "it shows category description for newcomers"
      // );

      const content = this.subject.displayedContent();

      assert.equal(
        content[0].name,
        I18n.t("tagging.selector_no_tags"),
        "it has the translated label for no-tags"
      );
      assert.equal(
        content[1].name,
        I18n.t("tagging.selector_all_tags"),
        "it has the correct label for all-tags"
      );
    },
  });
});
