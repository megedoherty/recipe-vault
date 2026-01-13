import * as cheerio from 'cheerio';

const notesSelectors = [
  // Common selectors
  '.tasty-recipes-notes-body',
  '.wprm-recipe-notes',
  '.recipe__tips', // KAF
];

export const findNotes = ($: cheerio.CheerioAPI) => {
  const section = $(notesSelectors.join(', '));

  // Double newlines between paragraphs
  return section.text().trim().replaceAll('\n', '\n\n');
};
