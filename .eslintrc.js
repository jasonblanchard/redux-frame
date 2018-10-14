module.exports = {
  "env": {
    "browser": true,
    "es6": true,
    "jest": true,
  },
  "extends": [
    "eslint:recommended",
    "semistandard",
    "standard-react"
  ],
  "parser": "babel-eslint",
  "parserOptions": {
    "ecmaVersion": 2016,
    "sourceType": "module"
  },
  "rules": {
    "indent": [
      "error",
      2
    ],
    "linebreak-style": [
      "error",
      "unix"
    ],
    "quotes": [
      "error",
      "single"
    ],
    "semi": [
      "error",
      "always"
    ],
    "space-before-function-paren": 0,
    "comma-dangle": ["error", "always-multiline"],
  }
};
