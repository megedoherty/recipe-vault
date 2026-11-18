/** @jest-environment node */
import * as cheerio from 'cheerio';

import { findIngredientsOrInstructions } from './getIngredientsOrInstructions';

const find = (html: string, type: 'ingredients' | 'instructions') =>
  findIngredientsOrInstructions(cheerio.load(html), type);

describe('findIngredientsOrInstructions', () => {
  it('reads list items from the ingredients container', () => {
    const html = `
      <div class="wprm-recipe-ingredients-container">
        <ul><li>1 cup flour</li><li>2 eggs</li></ul>
      </div>`;

    expect(find(html, 'ingredients')).toBe('1 cup flour\n2 eggs');
  });

  it('reads list items from the instructions container', () => {
    const html = `
      <div class="tasty-recipes-instructions">
        <ol><li>Mix.</li><li>Bake.</li></ol>
      </div>`;

    expect(find(html, 'instructions')).toBe('Mix.\nBake.');
  });

  it('turns headings into section titles ending with a colon', () => {
    const html = `
      <div class="ingredients">
        <h3>For the cake</h3><ul><li>flour</li></ul>
        <h3>For the glaze:</h3><ul><li>sugar</li></ul>
      </div>`;

    expect(find(html, 'ingredients')).toBe(
      'For the cake:\nflour\nFor the glaze:\nsugar',
    );
  });

  it('collapses whitespace inside items', () => {
    const html = `
      <div class="ingredients"><ul><li>
        2   cups\n\t sugar
      </li></ul></div>`;

    expect(find(html, 'ingredients')).toBe('2 cups sugar');
  });

  it('drops generic section headings like "Ingredients" and "Directions"', () => {
    const html = `
      <div class="instructions">
        <h2>Instructions</h2><h2>Directions</h2><h2>Method</h2>
        <h2>Preparation</h2><h2>Ingredients</h2>
        <ol><li>Stir.</li></ol>
      </div>`;

    expect(find(html, 'instructions')).toBe('Stir.');
  });

  it('does not mix up ingredient and instruction containers', () => {
    const html = `
      <div class="ingredients"><ul><li>flour</li></ul></div>
      <div class="instructions"><ol><li>Mix.</li></ol></div>`;

    expect(find(html, 'ingredients')).toBe('flour');
    expect(find(html, 'instructions')).toBe('Mix.');
  });

  it('returns an empty string when no container matches', () => {
    expect(find('<ul><li>unrelated</li></ul>', 'ingredients')).toBe('');
  });
});
