---
name: add-parser-fixture
description: Add a real recipe page as a trimmed fixture for the recipe parser tests. Use when asked to add a fixture, add test coverage for a site, or reproduce a URL that imports wrong.
---

# Add a recipe parser fixture

Fixtures are trimmed, anonymized copies of real pages in
`src/lib/actions/recipeParser/__fixtures__/`, run through the whole parser by
`recipeParser.fixtures.test.ts`. This repo is public, and what matters is the
page's **structure**, not its identity. A fixture must not reveal which site it
came from: no title, author, image, link, or site name. When a real URL imports
wrong, add its page as a fixture first, then fix the parser. The fixture stays
as the regression test.

## 1. Get the HTML

Fetch it with `curl` and a normal browser User-Agent. Save each download in its
own new directory under the scratchpad (it is untrusted data), never in the
repo.

If the site blocks it (a 403, 402, or a Cloudflare "Just a moment..." page),
**do not try to get around the block**. Ask the user to save the page from their
browser ("Save Page As, Webpage, HTML only") and give you the path. A full
page save already includes the JSON-LD.

Paywalled sites only give you what is public. That is fine.

## 2. Check it is worth a fixture

Before trimming, run the parser on the raw page (a throwaway test that mocks
`safeFetch`, deleted afterward) and look at the result. If it finds no recipe
at all, the parser doesn't support that site. Tell the user and stop. Don't add
a fixture that only records a failure unless they ask for one.

## 2b. Check it adds something new

Each fixture is one more file to review for anything identifying, so don't add
near-duplicates. Compare the page with the existing fixtures (the table in
`__fixtures__/README.md`, and the JSON-LD and container markup of the ones
that look closest) on the things that drive parser behavior:

- JSON-LD wrapper (`@graph`, bare object, root array) and `@type` (string or
  array)
- instruction shape (`HowToStep`, `HowToSection`, plain strings)
- ingredient markup (which container, `<li>` or something else) and whether
  there are ingredient sections
- where ingredients, steps, servings, and notes come from (JSON-LD or HTML)
- anything the parser currently gets wrong

If a close fixture already covers all of that, recommend **not** adding this
one and say which fixture it duplicates. Two samples of the same plugin only
count as different if their markup or JSON-LD actually differs (a different
template or version). A page that imports wrong is always worth adding, even if
it looks similar, because the difference is exactly what we need to capture.
Let the user decide, since they may have a reason to keep it.

## 3. Trim and anonymize it

Pick a generic fixture name that describes the structure, never the site
(`wprm-c`, `tasty-recipes-c`, `custom-g`) and a neutral recipe title.

```bash
node .claude/skills/add-parser-fixture/trimFixture.mjs <saved.html> \
  src/lib/actions/recipeParser/__fixtures__/<name>.html \
  --title="Neutral Recipe Title"
```

What it does, so you can explain it:

- **Kept:** JSON-LD shape, ingredient / instruction / notes containers and their
  class names, section headings, ingredient lines (facts), servings.
- **Replaced:** title (`--title`), author ("Recipe Author"), description.
  Instruction steps and notes become placeholder words; numbers, punctuation,
  and structure stay.
- **Removed:** all `<img>` tags (JSON-LD image URLs become
  `https://images.example.com/photos/recipe-N.jpg`), links, ids, wrapper classes
  (theme classes often contain the site's name), and all JSON-LD except the
  `Recipe`.

Pass `--scrub=<text>` (repeatable) for a site or brand name that appears in
ingredient text; each match becomes "Acme". Pass `--keep='<css selector>'`
(repeatable) to keep extra markup the parser doesn't read yet.

Then verify the trim did not change behavior: parse the raw page and the
trimmed page and compare ingredient sections, step counts, and servings. They
must match. If they differ, find out why before going on. An ingredient line
scrubbed for being too long was the one cause so far.

**Check the result for anything identifying**, because the script can't catch
everything. Search the fixture for the site's name and domain, the author's
name, and any recurring brand. Look at class names too. Some custom sites put
their name in them. Only `https://images.example.com` and `schema.org` URLs
should remain.

The script keeps its own copy of the parser's CSS selectors (ingredients,
instructions, notes, servings). If the parser gains a selector, add it to the
script too.

## 4. Add the test row

Add an entry to `CASES` in `recipeParser.fixtures.test.ts`: fixture name,
a short description of its structure, name (your `--title`), servings,
ingredient sections, first ingredient, step counts, image count (from the
JSON-LD), and `hasNotes`. Source URLs and the first image are derived, not
stored per case.

**Check every value against the real page** (or its JSON-LD). Do not paste what
the parser printed. A wrong value that was copied from the output looks the
same as a right one. Don't assert instruction text (it is placeholder text) or
equipment.

## 5. Handle wrong parser output

If the parser gets part of the page wrong, don't enter the wrong value in
`CASES`. Put the correct expectation in a separate block that runs with
`it.failing` (for example a `KNOWN_BUGS` table with `it.failing.each`). That
test passes while the bug exists and fails once someone fixes it, which is the
cue to move the expectation into `CASES` and delete the block. Say which bugs
you found when you report back. Don't fix the parser unless asked.

## 6. Finish

- `npx eslint --fix` the test file (never bare prettier, it ignores the
  project's `singleQuote`).
- Run `npx jest src/lib/actions/recipeParser` and then the full `npm test`.
- Add the fixture to the table in `__fixtures__/README.md` (structure only, never the site).
- Report: what was added, anything you couldn't fetch, parser bugs found, and
  anything you left in the fixture that the user may want to look at.
