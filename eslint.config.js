module.exports = [
  {
    files: ['src/js/**/*.js'],
    ignores: ['src/js/lib/**'],
    languageOptions: {
      ecmaVersion: 2015,
      sourceType: 'script',
      globals: {
        window: 'readonly',
        document: 'readonly',
        console: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        pskl: 'writable',
        $: 'readonly',
      },
    },
    rules: {
      'no-unused-vars': 'warn',
      'no-undef': 'error',
      'no-console': 'off',
    },
  },
];
