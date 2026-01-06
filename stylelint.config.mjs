/** @type {import("stylelint").Config} */
// eslint-disable-next-line import/no-anonymous-default-export
export default {
  extends: ['stylelint-config-standard', 'stylelint-prettier/recommended'],
  rules: {
    'selector-class-pattern': null,
    'selector-pseudo-class-no-unknown': [
      true,
      {
        ignorePseudoClasses: ['global'],
      },
    ],
  },
  ignoreFiles: ['coverage/**'],
};
