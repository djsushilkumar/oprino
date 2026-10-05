import js from '@eslint/js';

export default [
  js.configs.recommended,
  {
    ignores: [
      '**/dist/**',
      '**/.next/**',
      '**/build/**',
      '**/.dart_tool/**',
      '**/generated/**',
      '**/research/**',
      '**/*.d.ts',
    ],
  },
  {
    rules: {
      'no-unused-vars': 'off',
      'no-console': 'off',
      'no-undef': 'off',
    },
  },
];
