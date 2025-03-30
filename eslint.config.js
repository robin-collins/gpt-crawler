// eslint.config.js
import globals from "globals";
import tseslint from "typescript-eslint";
import pluginPrettierRecommended from 'eslint-plugin-prettier/recommended';

export default tseslint.config(
  // Global ignores - apply before any other configurations
  {
    ignores: [
        "dist/",
        "node_modules/",
        "coverage/", // Often excluded
        "example_html/", // Project specific
        "crawled/", // Project specific
        "*.js", // Ignore root JS files by default (like swagger.js)
        "*.mjs",
        "**/*.d.ts", // Ignore declaration files
    ],
  },

  // Base configuration using recommended type-checked rules
  // This provides good defaults for TypeScript projects requiring type information
  ...tseslint.configs.recommendedTypeChecked,

  // Configuration specific to TS files within the src directory
  {
    files: ["src/**/*.ts"],
    languageOptions: {
      parserOptions: {
        project: true, // Automatically finds tsconfig.json in the root
        tsconfigRootDir: import.meta.dirname, // Helps ESLint find tsconfig relative to eslint.config.js
      },
      globals: {
        ...globals.node, // Add Node.js specific globals
      }
    },
    // You can add specific rule overrides for your TS code here
    // rules: {
    //   '@typescript-eslint/no-unused-vars': 'warn', // Example override
    // }
  },

  // Apply Prettier rules - This MUST be the last configuration
  // It turns off conflicting ESLint rules and runs Prettier as an ESLint rule.
  pluginPrettierRecommended,
);