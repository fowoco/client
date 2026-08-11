import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  { ignores: ['dist'] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      // eslint-plugin-react-hooks v6+의 recommended는 React Compiler 전제 규칙(set-state-in-effect,
      // refs, preserve-manual-memoization 등)을 대거 포함한다. 이 프로젝트는 React Compiler를
      // 쓰지 않고 fetch-then-setState(useApiQuery 등) 패턴을 광범위하게 쓰므로, 범용 규칙 2개만 켠다.
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
    },
  },
)
