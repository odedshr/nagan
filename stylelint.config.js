export default {
  extends: ['stylelint-config-standard'],
  rules: {
    // Allow nested selectors (CSS nesting)
    'selector-nested-pattern': null,
    // 'selector-nesting-depth': null,
    // Relax declaration order
    'declaration-block-no-redundant-longhand-properties': null,
    // Allow custom property patterns
    'custom-property-pattern': null,
    // Allow class naming patterns (for component-based styling)
    'selector-class-pattern': null,
    'selector-id-pattern': null,
    // Allow quoted font family names
    'font-family-name-quotes': null,
    // Allow existing import notation
    'import-notation': null,
    // Allow descending specificity (common in nested CSS)
    'no-descending-specificity': null,
    // Allow vendor prefixes for compatibility
    'property-no-vendor-prefix': null,
    // Allow rgba() notation
    'color-function-notation': null,
    'color-function-alias-notation': null,
    // Allow decimal alpha values
    'alpha-value-notation': null,
    // Allow long hex colors
    'color-hex-length': null,
    // Allow empty lines before declarations (for readability)
    'declaration-empty-line-before': null,
    // Allow empty lines before rules
    'rule-empty-line-before': null,
    // Allow empty lines before comments
    'comment-empty-line-before': null,
    // Allow comment whitespace
    'comment-whitespace-inside': null,
    // Allow duplicate selectors (common in large stylesheets)
    'no-duplicate-selectors': null,
    // Allow redundant shorthand values
    'shorthand-property-no-redundant-values': null,
    // Allow zero with units
    'length-zero-no-unit': null,
    // Allow shorthand property overrides
    'declaration-block-no-shorthand-property-overrides': null,
    // Allow unquoted URLs
    'function-url-quotes': null,
    // Allow single colon pseudo-elements (legacy support)
    'selector-pseudo-element-colon-notation': null,
    // Allow value-keyword-case (for legacy values)
    'value-keyword-case': null,
    // Allow unknown property values (for some edge cases)
    'declaration-property-value-no-unknown': null,
    // Allow generic font family to be missing
    'font-family-no-missing-generic-family-keyword': null,
  },
  ignoreFiles: ['dist/**', 'src-tauri/**', 'node_modules/**'],
};
