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
