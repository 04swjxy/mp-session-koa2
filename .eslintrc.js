module.exports = {
    extends: "airbnb",
    // extends: "eslint:recommended",
    env: {
      browser: true,
      node: true
    },
    "rules": {
      "no-console": "off",
      "no-await-in-loop": "off",
      "no-restricted-syntax": "off",
      "no-underscore-dangle": "off",
      "camelcase": "off",
      "no-param-reassign": ["error", { "props": false }]
    }
};
