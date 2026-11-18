import '@testing-library/jest-dom';

// jsdom doesn't implement HTMLDialogElement.showModal/close. Re-applied before
// each test so jest.restoreAllMocks() in a test file can't remove it.
beforeEach(() => {
  if (typeof HTMLDialogElement === 'undefined') return; // node test environment

  HTMLDialogElement.prototype.showModal = jest.fn(function (
    this: HTMLDialogElement,
  ) {
    this.setAttribute('open', '');
  });
  HTMLDialogElement.prototype.close = jest.fn(function (
    this: HTMLDialogElement,
  ) {
    this.removeAttribute('open');
  });
});

// jsdom doesn't know the <search> element, so React warns about it on every
// render of SearchForm.
const originalConsoleError = console.error;
console.error = (...args: unknown[]) => {
  // React passes a printf-style template: "The tag <%s> is unrecognized…"
  const [template, tag] = args;
  if (
    typeof template === 'string' &&
    template.includes('is unrecognized in this browser') &&
    tag === 'search'
  ) {
    return;
  }
  originalConsoleError(...args);
};
