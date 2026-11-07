// MISMO Media's code check: only rules that catch real mistakes (code that can't run, typos in
// comparisons, duplicate keys, broken patterns). Style is not checked.
export default [{
  files: ["**/*.js"],
  languageOptions: { ecmaVersion: 2022, sourceType: "script" },
  rules: {
    "no-dupe-keys": "error", "no-dupe-else-if": "error", "no-duplicate-case": "error", "no-unreachable": "error",
    "no-unsafe-finally": "error", "no-self-assign": "error", "valid-typeof": "error", "use-isnan": "error",
    "no-unsafe-negation": "error", "no-sparse-arrays": "error", "no-empty-character-class": "error",
    "no-invalid-regexp": "error", "getter-return": "error", "no-compare-neg-zero": "error", "no-debugger": "error",
    "no-dupe-args": "error", "no-const-assign": "error", "no-redeclare": "error", "no-unexpected-multiline": "error"
  }
}];
