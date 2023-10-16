module.exports = {
  env: {
    commonjs: true,
    es2021: true,
    node: true
  },
  extends: ['standard',
  'plugin:react/recommended',
  'prettier'],
  overrides: [
  ],
  parserOptions: {
    ecmaVersion: 'latest'
  },
  rules: {
    "indent": ["error", 2],
    "react/prop-types": "off",
    "camelcase": [
      "error",
      {
        "properties": "never"
      }
    ]
  }
}
