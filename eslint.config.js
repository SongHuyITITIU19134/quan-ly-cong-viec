import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'

export default [
  { ignores: ['dist', 'playwright-report', 'test-results'] },
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: { ecmaVersion: 2022, globals: { ...globals.browser, ...globals.node }, parserOptions: { ecmaFeatures: { jsx: true }, sourceType: 'module' } },
    plugins: { 'react-hooks': reactHooks, 'react-refresh': reactRefresh },
    rules: { ...js.configs.recommended.rules, ...reactHooks.configs.recommended.rules, 'no-unused-vars': ['error', { argsIgnorePattern: '^_' }], 'react-refresh/only-export-components': 'off', 'react-hooks/set-state-in-effect': 'off', 'react-hooks/refs': 'off', 'react-hooks/exhaustive-deps': 'off' },
  },
  {
    files: ['src/pages/tasks/**/*.{js,jsx}', 'src/contexts/**/*.{js,jsx}', 'src/hooks/useData.jsx', 'src/hooks/useRepositoryConnection.js'],
    rules: { 'max-len': ['error', { code: 160, ignoreComments: true, ignoreUrls: true }] },
  },
]
