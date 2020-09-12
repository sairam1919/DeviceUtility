module.exports = {
  "extends": "standard",
  "env": {
    "mocha": true,
    "node": true
  },
  "rules": {
    "semi": ["error", "always"],
    "no-trailing-spaces": ["error", { "ignoreComments": true }],
    "space-before-function-paren": ["error", {
      "anonymous": "always",
      "named": "never",
      "asyncArrow": "always"
    }],
    "handle-callback-err": "off",

    "indent": ["error", 2, { "SwitchCase": 1 }],
    "complexity": ["error", 15],
    "no-inner-declarations": "off"
  }
};