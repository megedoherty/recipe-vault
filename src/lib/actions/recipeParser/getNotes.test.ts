/** @jest-environment node */
import * as cheerio from 'cheerio';

import { findNotes } from './getNotes';

const notes = (html: string) => findNotes(cheerio.load(html));

describe('findNotes', () => {
  it.each(['tasty-recipes-notes-body', 'wprm-recipe-notes', 'recipe__tips'])(
    'reads notes from .%s',
    (className) => {
      expect(notes(`<div class="${className}">Keep chilled.</div>`)).toBe(
        'Keep chilled.',
      );
    },
  );

  it('trims the text and doubles newlines between paragraphs', () => {
    expect(
      notes('<div class="wprm-recipe-notes">\nFirst tip.\nSecond tip.\n</div>'),
    ).toBe('First tip.\n\nSecond tip.');
  });

  it('returns an empty string when there are no notes', () => {
    expect(notes('<p>Nothing here</p>')).toBe('');
  });
});
