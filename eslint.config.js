import js from '@eslint/js';

export default [
  js.configs.recommended,
  {
    files: ['**/*.{js,mjs,cjs}'],
    rules: {
      'no-unused-vars': 'off',
      'no-console': 'off',
      'no-undef': 'off',
    },
  },
  {
    ignores: [
      '**/dist/**',
      '**/.next/**',
      '**/build/**',
      '**/.dart_tool/**',
      '**/generated/**',
      '**/research/**',
      '**/*.d.ts',
      '**/*.ts',
      '**/*.tsx',
    ],
  },
];


