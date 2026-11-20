#!/usr/bin/env node
/**
 * Trims a saved recipe web page down to a small, anonymous "skeleton" fixture
 * for the recipe parser tests (see .claude/skills/add-parser-fixture/SKILL.md).
 *
 * Usage:
 *   node .claude/skills/add-parser-fixture/trimFixture.mjs <input.html> <output.html> \
 *     --title="Neutral Recipe Title" [--scrub=<text>]... [--keep=<css selector>]...
 *
 * The fixture keeps the page's STRUCTURE (the JSON-LD shape, ingredient and
 * instruction containers, section headings, class names) and nothing that
 * identifies the page:
 *
 * - Title: replaced with --title. Author: "Recipe Author".
 * - Images: every <img> is removed; JSON-LD image URLs become
 *   https://images.example.com/photos/recipe-N.jpg (same shape as the original).
 * - Instruction steps, notes, and the description: replaced with placeholder
 *   words. Numbers, punctuation, and structure are preserved.
 * - Ingredient lines and short section headings: kept (they are facts and the
 *   point of the fixture). Use --scrub to replace a site or brand name that
 *   appears in them; each match becomes "Acme".
 * - Everything else (scripts, styles, navigation, ads, comments, reviews,
 *   nutrition, links, ids) is removed, and so is all JSON-LD except the Recipe.
 *
 * Keep the selector lists below in sync with getIngredientsOrInstructions.ts,
 * getNotes.ts, and the servings fallback in recipeParser.ts. The fixture tests
 * will fail if they drift far enough to matter.
 */
import { readFileSync, writeFileSync } from 'node:fs';

import * as cheerio from 'cheerio';

const INGREDIENT_SELECTORS = [
  '.tasty-recipes-ingredients',
  '.wprm-recipe-ingredients-container',
  '.ingredients',
  '.recipe__ingredients',
  '[class*="ingredients_ingredients"]',
  '[data-testid="IngredientList"]',
  '.section--ingredients',
];
const INSTRUCTION_SELECTORS = [
  '.tasty-recipes-instructions',
  '.wprm-recipe-instructions-container',
  '.instructions',
  '.recipe__instructions',
  '[class*="recipebody_prep-block"]',
  '[data-testid="InstructionsWrapper"]',
  '.section--instructions',
];
const NOTES_SELECTORS = [
  '.tasty-recipes-notes-body',
  '.wprm-recipe-notes',
  '.recipe__tips',
];
const SERVINGS_SELECTORS = ['.wprm-recipe-servings', '.tasty-recipes-yield'];

const joined = (selectors) => selectors.join(', ');

// ---------------------------------------------------------------- arguments

const [input, output, ...flags] = process.argv.slice(2);
const flagValues = (name) =>
  flags
    .filter((flag) => flag.startsWith(`--${name}=`))
    .map((flag) => flag.slice(name.length + 3));
const [title] = flagValues('title');
const scrubTerms = flagValues('scrub');
const extraKeep = flagValues('keep');

if (!input || !output || !title) {
  console.error(
    'Usage: trimFixture.mjs <input.html> <output.html> --title="Neutral Title" ' +
      '[--scrub=<text>]... [--keep=<selector>]...',
  );
  process.exit(1);
}

// ---------------------------------------------------------------- text

// Words left alone when scrubbing prose: they carry no recipe content and keep
// the placeholder text readable.
const KEEP_WORDS = new Set(
  (
    'a an the and or of to in on for with until about at by from into then it ' +
    'its is are be as if that this than over under each per all any not no ' +
    'minute minutes hour hours second seconds degree degrees f c'
  ).split(' '),
);
const FILLER_WORDS = (
  'lorem ipsum dolor amet tempor labore magna aliqua enim minim veniam ' +
  'nostrud laboris nisi aliquip commodo consequat duis aute irure velit esse ' +
  'cillum fugiat nulla pariatur excepteur sint occaecat cupidatat proident ' +
  'culpa officia deserunt mollit anim laborum'
).split(' ');

function hash(word) {
  let h = 0;
  for (const ch of word) h = (h * 31 + ch.codePointAt(0)) >>> 0;
  return h;
}

// Replaces every word with a placeholder. Entities, digits, punctuation, and
// whitespace are untouched so sentence/step structure survives.
function scrubProse(text) {
  return text.replace(/&#?\w+;|\p{L}[\p{L}'’]*/gu, (token) => {
    if (token.startsWith('&')) return token;
    const lower = token.toLowerCase();
    if (KEEP_WORDS.has(lower)) return token;
    const filler = FILLER_WORDS[hash(lower) % FILLER_WORDS.length];
    if (token === token.toUpperCase() && token.length > 1) {
      return filler.toUpperCase();
    }
    return token[0] === token[0].toUpperCase()
      ? filler[0].toUpperCase() + filler.slice(1)
      : filler;
  });
}

const tidyShort = (text, max) =>
  text.trim().length <= max ? text : scrubProse(text);

const escapeRegExp = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const scrubPatterns = scrubTerms.map(
  (term) => new RegExp(escapeRegExp(term), 'gi'),
);
const scrubBrands = (text) =>
  scrubPatterns.reduce((acc, pattern) => acc.replace(pattern, 'Acme'), text);

// ---------------------------------------------------------------- JSON-LD

const isRecipe = (node) =>
  node['@type'] === 'Recipe' ||
  (Array.isArray(node['@type']) && node['@type'].includes('Recipe'));

let imageCounter = 0;
const nextImageUrl = () =>
  `https://images.example.com/photos/recipe-${++imageCounter}.jpg`;

// Same shape as the original (string, array, ImageObject, array of
// ImageObjects), with generic URLs.
function anonymizeImage(image) {
  if (typeof image === 'string') return nextImageUrl();
  if (Array.isArray(image)) return image.map(anonymizeImage);
  if (image && typeof image === 'object') {
    const out = {};
    for (const key of ['@type', 'width', 'height']) {
      if (image[key] !== undefined) out[key] = image[key];
    }
    out.url = nextImageUrl();
    return out;
  }
  return image;
}

// Keeps the shape (string vs array) but not the site's own wording.
const genericLabel = (value, label) => (Array.isArray(value) ? [label] : label);

function scrubInstructions(value) {
  if (typeof value === 'string') return scrubProse(value);
  if (Array.isArray(value)) return value.map(scrubInstructions);
  if (!value || typeof value !== 'object') return value;

  const out = { '@type': value['@type'] };
  if (typeof value.name === 'string') {
    out.name =
      value['@type'] === 'HowToSection'
        ? tidyShort(value.name, 60)
        : scrubProse(value.name);
  }
  if (typeof value.text === 'string') out.text = scrubProse(value.text);
  if (value.itemListElement) {
    out.itemListElement = scrubInstructions(value.itemListElement);
  }
  return out;
}

function sanitizeRecipe(node) {
  const out = {};
  for (const key of [
    '@context',
    '@type',
    'recipeYield',
    'prepTime',
    'cookTime',
    'totalTime',
  ]) {
    if (node[key] !== undefined) out[key] = node[key];
  }
  out.name = title;
  if (node.image !== undefined) out.image = anonymizeImage(node.image);
  if (typeof node.description === 'string') {
    out.description = scrubProse(node.description);
  }
  if (node.author !== undefined) {
    out.author = { '@type': 'Person', name: 'Recipe Author' };
  }
  if (node.recipeCategory !== undefined) {
    out.recipeCategory = genericLabel(node.recipeCategory, 'Dessert');
  }
  if (node.recipeCuisine !== undefined) {
    out.recipeCuisine = genericLabel(node.recipeCuisine, 'American');
  }
  if (node.keywords !== undefined) {
    out.keywords = Array.isArray(node.keywords)
      ? ['baking', 'dessert']
      : 'baking, dessert';
  }
  if (Array.isArray(node.recipeIngredient)) {
    out.recipeIngredient = node.recipeIngredient.map((line) =>
      typeof line === 'string' ? tidyShort(line, 200) : line,
    );
  }
  if (node.recipeInstructions !== undefined) {
    out.recipeInstructions = scrubInstructions(node.recipeInstructions);
  }
  return out;
}

// Keeps only Recipe nodes, preserving the wrapper shape (@graph, root array,
// bare object) since that shape is exactly what the parser has to handle.
function pruneJsonLd(node) {
  if (Array.isArray(node)) {
    const items = node.map(pruneJsonLd).filter((item) => item !== undefined);
    return items.length > 0 ? items : undefined;
  }
  if (!node || typeof node !== 'object') return undefined;
  if (node['@graph'] !== undefined) {
    const graph = pruneJsonLd(node['@graph']);
    return graph === undefined
      ? undefined
      : { '@context': node['@context'], '@graph': graph };
  }
  return isRecipe(node) ? sanitizeRecipe(node) : undefined;
}

// Applies --scrub to every string in the (already pruned) JSON-LD.
function scrubStrings(value) {
  if (typeof value === 'string') return scrubBrands(value);
  if (Array.isArray(value)) return value.map(scrubStrings);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, scrubStrings(item)]),
    );
  }
  return value;
}

// ---------------------------------------------------------------- main

const $ = cheerio.load(readFileSync(input, 'utf8'));

const ldBlocks = [];
$('script[type="application/ld+json"]').each((_, el) => {
  try {
    const pruned = pruneJsonLd(JSON.parse($(el).contents().text().trim()));
    if (pruned !== undefined) {
      ldBlocks.push(
        JSON.stringify(scrubStrings(pruned)).replace(/</g, '\\u003c'),
      );
    }
  } catch {
    // Invalid JSON-LD is skipped, same as the parser does.
  }
});

$(
  'script, style, noscript, iframe, svg, link, template, video, audio, canvas, source, picture, img',
).remove();

const containerSelector = joined([
  ...INGREDIENT_SELECTORS,
  ...INSTRUCTION_SELECTORS,
  ...NOTES_SELECTORS,
  ...SERVINGS_SELECTORS,
  ...extraKeep,
]);
const containers = $(containerSelector)
  .filter((_, el) => $(el).parents(containerSelector).length === 0)
  .toArray();

// The parser reads a single h1 (as the fallback title).
$('h1').slice(1).remove();
$('h1').first().text(title);

// Mark what survives: containers and the h1 (with all descendants), plus their
// ancestors so the original nesting and order are preserved.
const keep = new Set();
const whole = new Set();
const markWhole = (el) => {
  whole.add(el);
  keep.add(el);
  $(el)
    .find('*')
    .each((_, descendant) => {
      whole.add(descendant);
      keep.add(descendant);
    });
};
for (const el of [...containers, ...$('h1').toArray()]) {
  markWhole(el);
  $(el)
    .parents()
    .each((_, ancestor) => keep.add(ancestor));
}

$('body')
  .find('*')
  .toArray()
  .forEach((el) => {
    if (!keep.has(el)) $(el).remove();
  });

// Drop stray text/comments in the ancestors-only wrappers, and comments inside
// kept areas.
$('*')
  .addBack()
  .each((_, el) => {
    $(el)
      .contents()
      .each((__, node) => {
        if (node.type === 'comment') $(node).remove();
        else if (node.type === 'text' && !whole.has(el)) $(node).remove();
      });
  });

const contextOf = (node) => {
  for (const ancestor of $(node).parents().toArray()) {
    const $a = $(ancestor);
    if (ancestor.tagName === 'h1') return 'title';
    if ($a.is(joined(INGREDIENT_SELECTORS))) return 'ingredients';
    if ($a.is(joined(INSTRUCTION_SELECTORS))) return 'instructions';
    if ($a.is(joined(NOTES_SELECTORS))) return 'notes';
    if ($a.is(joined(SERVINGS_SELECTORS))) return 'servings';
  }
  return 'other';
};

$('*')
  .contents()
  .each((_, node) => {
    if (node.type !== 'text' || !node.data.trim()) return;
    switch (contextOf(node)) {
      case 'title':
        return;
      case 'ingredients':
        node.data = scrubBrands(tidyShort(node.data, 200));
        return;
      case 'instructions': {
        const inHeading =
          $(node).parents('h1, h2, h3, h4, h5, h6').toArray().length > 0;
        node.data = scrubBrands(
          inHeading ? tidyShort(node.data, 60) : scrubProse(node.data),
        );
        return;
      }
      case 'notes':
        node.data = scrubProse(node.data);
        return;
      case 'servings':
        node.data = scrubBrands(tidyShort(node.data, 40));
        return;
      default:
        node.data = scrubBrands(tidyShort(node.data, 40));
    }
  });

// Wrapper elements only exist to preserve nesting; the parser never reads their
// classes, and theme/template class names often contain the site's name. Only
// the kept containers and their contents keep their classes.
$('*').each((_, el) => {
  const allowed = whole.has(el) ? ['class', 'data-testid', 'itemprop'] : [];
  for (const name of Object.keys(el.attribs ?? {})) {
    if (!allowed.includes(name)) $(el).removeAttr(name);
  }
});

$('head')
  .empty()
  .append('<meta charset="utf-8">')
  .append(
    ldBlocks.map(
      (block) => `<script type="application/ld+json">${block}</script>`,
    ),
  );

const html = $.html({ encodeEntities: 'utf8' })
  // Line breaks only where the parser never reads text across the boundary.
  .replace(/(<\/(?:li|ul|ol|h[1-6]|script|head)>)(?=<)/g, '$1\n')
  .replace(/(<meta[^>]*>)(?=<)/g, '$1\n');

writeFileSync(output, `${html}\n`);

console.log(
  `${input.split('/').pop()} -> ${output.split('/').pop()}: ` +
    `${Math.round(readFileSync(input).length / 1024)}KB -> ` +
    `${Math.round(Buffer.byteLength(html) / 1024)}KB, ` +
    `${ldBlocks.length} JSON-LD block(s), ${containers.length} container(s)`,
);
