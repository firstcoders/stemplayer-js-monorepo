import openWcConfig from '@open-wc/eslint-config';
import prettierConfig from 'eslint-config-prettier';

export default [
  {
    ignores: [
      'node_modules/**',
      'coverage/**',
      'dist/**',
      'out-tsc/**',
      '_site/**',
      '.tmp/**',
    ],
  },

  ...openWcConfig,

  {
    rules: {
      ...prettierConfig.rules,
    },
  },
];
