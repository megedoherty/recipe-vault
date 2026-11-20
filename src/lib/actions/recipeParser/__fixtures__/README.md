# Parser fixtures

Trimmed, anonymized copies of real recipe pages, used by
`recipeParser.fixtures.test.ts` to run the whole parser (`parseRecipeFromUrl`)
against markup it will meet in production. They catch what hand-written test
HTML can't: `@graph` wrappers, `@type` arrays, `HowToSection` steps, ingredient
sections, and the markup of real recipe plugins and sites.

They are frozen. They protect against regressions in our parser, not against a
site redesigning its pages.

## What a fixture contains

Structure only. The page's identity is removed:

- **Kept:** the JSON-LD shape, the ingredient / instruction / notes containers
  and their class names, section headings, ingredient lines, and servings.
- **Replaced:** the recipe title (a neutral one), the author, and the
  description. Instruction steps and notes become placeholder words, with
  numbers, punctuation, and structure preserved.
- **Removed:** all images (JSON-LD image URLs become
  `https://images.example.com/photos/recipe-N.jpg`), links, ids, scripts,
  styles, navigation, comments, reviews, and every other JSON-LD block.
- Source URLs in the test are `https://example.com/recipes/<fixture>`.

So don't assert on titles, step text, or image URLs. Image selection from page
markup is tested in `getRecipeImages.test.ts`.

## The fixtures

| Fixture           | Structure                                                          |
| ----------------- | ------------------------------------------------------------------ |
| `wprm-a`          | WPRM, ingredient and step sections                                 |
| `wprm-b`          | WPRM, single section, notes                                        |
| `tasty-recipes-a` | Tasty Recipes plugin, ingredient sections, notes                   |
| `tasty-recipes-b` | Tasty Recipes plugin, `HowToSection` steps, sections in both lists |
| `custom-a`        | JSON-LD only, name has a "Recipe by <site>" suffix                 |
| `custom-b`        | JSON-LD only, `@type` is an array                                  |
| `custom-c`        | JSON-LD only, `@type` is an array, long ingredient notes           |
| `custom-d`        | Hashed class names, ingredient sections, slash metric amounts      |
| `custom-e`        | `.recipe__ingredients` / `.recipe__tips`, trailing promo heading   |
| `custom-f`        | Ingredients in `<p>`/`<div>` pairs (no `<li>`), so from JSON-LD    |

To add one, use the `add-parser-fixture` skill
(`.claude/skills/add-parser-fixture/`). It documents the steps and includes the
trimming script, `trimFixture.mjs`, which also works on its own:

```bash
node .claude/skills/add-parser-fixture/trimFixture.mjs <saved.html> \
  src/lib/actions/recipeParser/__fixtures__/<name>.html \
  --title="Neutral Recipe Title"
```
