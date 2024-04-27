import { escapace } from 'eslint-config-escapace'

export default escapace({
  typescript: {
    rules: {
      'typescript/no-non-null-assertion': 0,
      'typescript/no-unsafe-enum-comparison': 0,
    },
  },
})
