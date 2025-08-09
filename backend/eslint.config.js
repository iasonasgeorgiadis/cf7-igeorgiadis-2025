module.exports = [
  {
    files: ["src/**/*.js"],
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: "commonjs",
      globals: {
        process: "readonly",
        Buffer: "readonly",
        __dirname: "readonly",
        console: "readonly",
        setTimeout: "readonly"
      }
    },
    rules: {
      "no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
      "no-console": process.env.NODE_ENV === "production" ? "error" : "warn",
      "semi": ["error", "always"],
      "quotes": ["error", "single"],
      "no-trailing-spaces": "error",
      "eol-last": ["error", "always"]
    }
  }
];