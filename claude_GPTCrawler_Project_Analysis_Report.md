# GPTCrawler Project Analysis Report

## Problems and Resolutions

### Problem 1: Node.js Module Import Error (`ERR_MODULE_NOT_FOUND`)
- **Description**: When trying to import `lodash/snakeCase` in `iconlist.js` using ES module syntax, a `ERR_MODULE_NOT_FOUND` error occurred. This happened because Node.js ES modules require explicit file extensions when importing from packages like lodash that don't specify submodule exports clearly in their `package.json`.
- **Resolution**: Two solutions were provided:
    1. Import the standalone package: `import snakeCase from "lodash.snakecase";`
    2. Import from the main lodash package using the `.js` extension: `import snakeCase from "lodash/snakeCase.js";`
    Additionally, it was recommended to ensure `package.json` has `"type": "module"` or the file uses the `.mjs` extension.
- **Code Snippet** (Resolution 2):
```javascript
// iconlist.js
import snakeCase from "lodash/snakeCase.js";
import * as Icons from "@mui/icons-material";

// ... rest of the code stays the same ...
```
- **Source**: `.specstory/history/2025-01-25_22-43-node-js-module-import-error-troubleshooting.md`, `.specstory/history/2025-01-26_09-13-node-js-module-import-error-troubleshooting.md`

### Problem 2: Node.js "Too Many Open Files" Error
- **Description**: Importing all icons from `@mui/icons-material` using `import * as Icons from "@mui/icons-material";` caused a "too many open files" error because the package contains hundreds of individual icon modules, exceeding the system's file descriptor limit.
- **Resolution**: The script (`iconlist.js`) was modified to read icon filenames directly from the `@mui/icons-material/esm` directory using `fs.readdir` instead of importing all modules. This avoided opening too many files simultaneously.
- **Code Snippet** (Resolution):
```javascript
// iconlist.js
import fs from 'fs/promises';
import path from 'path';
import snakeCase from "lodash/snakeCase.js";

const iconStyles = ["Filled", "Outlined", "Rounded", "TwoTone", "Sharp"];
const iconsDir = path.resolve('./node_modules/@mui/icons-material/esm');

async function getIconList() {
  const files = await fs.readdir(iconsDir);
  const iconNames = files
    .filter(file => file.endsWith('.js'))
    .map(file => file.replace('.js', ''))
    .filter(name => !iconStyles.some(style => name.endsWith(style)))
    .map(name => snakeCase(name));
  console.log(JSON.stringify(iconNames));
}

getIconList().catch(console.error);
```
- **Source**: `.specstory/history/2025-01-25_22-43-node-js-module-import-error-troubleshooting.md`, `.specstory/history/2025-01-26_09-13-node-js-module-import-error-troubleshooting.md`

### Problem 3: Icon Rendering Issues in Generated HTML
- **Description**: The HTML page (`icon-reference.html`) generated to display Material UI icons had issues where icons were not rendering correctly within their designated cards or were misplaced. This was attributed to incorrect icon naming for the Material Icons font and potential font loading/CSS issues.
- **Resolution**: Several attempts were made to fix the icon name generation (`snakeCase(name).replace(/_/g, '')`, `name.replace(/([a-z])([A-Z])/g, '$1_$2').toLowerCase()`) and CSS/font loading within the `iconlist.js` script. The final state of this issue resolution is unclear from the provided history, as the user indicated the fixes were not working, and the conversation pivoted to using a React component.
- **Source**: `.specstory/history/2025-01-26_00-05-icon-rendering-issues-in-html-output.md`, `.specstory/history/2025-01-26_10-35-icon-rendering-issues-in-html-output.md`

### Problem 4: Webpack Build Errors
- **Description**: When trying to bundle a React component (`SearchIcons.js`) using Webpack, errors occurred:
    1. `require` is not defined in ES module scope (when using `webpack.config.js` with `require`).
    2. `module.exports` cannot be used in ES module scope (when using `webpack.config.cjs` with `export default`).
- **Resolution**:
    1. For the first error, it was suggested to rename the config file to `webpack.config.cjs` to treat it as CommonJS or update the config to use ES module syntax (`import`/`export`).
    2. For the second error (after renaming to `.cjs`), the config file was corrected to use CommonJS syntax (`require`/`module.exports`). The necessary dev dependencies (`webpack`, `webpack-cli`, `babel-loader`, etc.) were also listed.
- **Code Snippet** (Corrected `webpack.config.cjs`):
```javascript
// webpack.config.cjs
const path = require('path');

module.exports = {
  entry: './SearchIcons.js',
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist'),
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-react'],
          },
        },
      },
    ],
  },
};
```
- **Source**: `.specstory/history/2025-01-26_00-05-icon-rendering-issues-in-html-output.md`, `.specstory/history/2025-01-26_10-35-icon-rendering-issues-in-html-output.md`

### Problem 5: Code Block Line Number Inclusion in Crawled Data
- **Description**: When crawling pages containing code blocks with line numbers (e.g., from Docusaurus sites like d2lang.com), the line numbers were being included as part of the code text in the generated output (JSON/Markdown).
- **Resolution**: The `onVisitPage` function in the configuration (`scrape-config.ts`) was modified to use `page.evaluate`. This function selects code block elements (`pre code` or `section.CodeBlock pre`), extracts their `innerText`, splits the text into lines, removes leading numbers using regex (`line.replace(/^\s*\d+\s?/, '')`), and then reconstructs the code block within new, clean `<pre>` and `<code>` DOM elements, replacing the original complex structure. This cleanup happens *before* the content is captured by the main crawler logic. (Note: There were several unsuccessful attempts before reaching this solution).
- **Code Snippet** (Final `onVisitPage` for code block cleaning):
```typescript
// In scrape-config.ts, used within chainVisitFunctions
export const cleanCodeBlocks = async ({ page, pushData: _pushData }: OnVisitPageParams): Promise<void> => {
  await page.evaluate(() => {
    const codeBlocks = document.querySelectorAll('pre'); // Or a more specific selector like 'section.CodeBlock pre' if needed
    codeBlocks.forEach(codeBlock => {
      if (!(codeBlock instanceof HTMLElement)) return;
      const codeElement = codeBlock.querySelector('code');
      if (!codeElement) return;
      let codeText = '';
      const codeLines = codeElement.textContent?.split('\n') || [];
      codeLines.forEach(line => {
        const cleanLine = line
          .replace(/^\s*\d+\s?/, '') // Remove leading line numbers
          .replace(/^\s*\$\s/, '$  ') // Preserve command prompts
          .replace(/^.*codelineno.*$/, '') // Remove line number anchors
          .trim();
        if (cleanLine && !cleanLine.startsWith('$ powershell')) {
          codeText += cleanLine + '\n';
        }
      });
      const newPre = document.createElement('pre');
      const newCode = document.createElement('code');
      // Attempt to preserve language class if present on original code/pre
      const langClass = codeElement.className.match(/language-(\w+)/) || codeBlock.className.match(/language-(\w+)/);
      newCode.className = langClass ? `language-${langClass[1]}` : 'language-bash'; // Defaulting to bash, adjust as needed
      newCode.textContent = codeText.trim();
      newPre.appendChild(newCode);
      if (codeBlock.parentNode) {
        codeBlock.parentNode.replaceChild(newPre, codeBlock);
      }
    });
  });
};
```
- **Source**: `.specstory/history/2025-02-11_05-23-confirmation-of-custom-function-implementation.md`, `.specstory/history/2025-02-11_15-53-confirmation-of-custom-function-implementation.md`, `.specstory/history/2025-02-11_07-07-custom-code-block-formatting-in-markdown.md`, `.specstory/history/2025-02-11_17-37-custom-code-block-formatting-in-markdown.md`, `.specstory/history/2025-02-20_09-17-code-cleanup-for-html-code-blocks.md`, `.specstory/history/2025-02-20_19-47-code-cleanup-for-html-code-blocks.md`

### Problem 6: Escaped Triple Backticks in Markdown Output
- **Description**: When attempting to modify code blocks using `onVisitPage` to wrap cleaned code in Markdown triple backticks directly within the DOM manipulation (`pre.textContent = '```\n...'`), the resulting Markdown output showed escaped backticks (`\`\`\``) instead of literal ones. Attempts using `String.fromCharCode(96)` and template literals also failed.
- **Resolution**: The approach was changed to create actual `<pre>` and `<code>` DOM elements using `document.createElement` and setting the `textContent` of the `<code>` element to the cleaned code. This avoids inserting Markdown syntax directly into the DOM, letting the downstream Turndown service handle the conversion correctly.
- **Code Snippet** (Relevant part of the final `cleanCodeBlocks` function):
```typescript
// Create new clean elements
const newPre = document.createElement('pre');
const newCode = document.createElement('code');
// ... (set className if needed) ...
newCode.textContent = codeText.trim();
newPre.appendChild(newCode);

// Replace the old complex structure with our clean one
if (codeBlock.parentNode) {
  codeBlock.parentNode.replaceChild(newPre, codeBlock);
}
```
- **Source**: `.specstory/history/2025-02-11_07-07-custom-code-block-formatting-in-markdown.md`, `.specstory/history/2025-02-11_17-37-custom-code-block-formatting-in-markdown.md`

### Problem 7: `onVisitPage` Executing After Content Capture
- **Description**: It was discovered that the `onVisitPage` function in `src/core.ts` was being called *after* the page content was captured using `page.content()` and processed by Readability. This meant that any DOM manipulations performed within `onVisitPage` (like removing elements or cleaning code blocks) were not reflected in the captured content used for markdown generation.
- **Resolution**: The `src/core.ts` file was modified to move the execution of `if (config.onVisitPage) { ... }` block to *before* the `const html = await page.content();` line. This ensures DOM modifications occur before content capture.
- **Code Snippet** (Conceptual structure in `src/core.ts` `requestHandler`):
```typescript
// ... setup, wait for selector ...

// Create pushDataWrapper
const pushDataWrapper = async (data: any) => { /* ... */ };

// Execute onVisitPage BEFORE content capture
if (config.onVisitPage) {
  await config.onVisitPage({ page, pushData: pushDataWrapper });
}

// Now capture the content AFTER any DOM modifications
const html = await page.content();

// Process with JSDOM and Readability
const dom = new JSDOM(html, { url: request.loadedUrl });
const reader = new Readability(dom.window.document);
const article = reader.parse();

// Push data (conditionally if hook already pushed)
// ...

// Enqueue links
// ...
```
- **Source**: `.specstory/history/2025-03-07_02-27-debugging-removenodesfromdom-function.md`, `.specstory/history/2025-03-07_03-38-execution-order-of-onvisitpage-function.md`

### Problem 8: Duplicate Entries in Output When `onVisitPage` Pushes Data
- **Description**: When the `onVisitPage` hook was modified to run *before* Readability and it also called `pushData`, the final output (e.g., JSON file) contained two entries for the same page: one pushed by the hook (pre-Readability) and one pushed by the default logic after Readability processing.
- **Resolution**: A tracker variable (`hookPushed`) was added to the `requestHandler` in `src/core.ts`. The `pushDataWrapper` function now sets this tracker to `true` when called. The default data push after Readability processing is now wrapped in a condition: `if (!hookPushed.pushed) { /* push default data */ }`. This ensures the default data is only pushed if the `onVisitPage` hook did *not* push any data itself.
- **Code Snippet** (Conceptual logic in `src/core.ts` `requestHandler`):
```typescript
// Create tracker
const hookPushed = { pushed: false };

// Wrapper sets tracker
const pushDataWrapper = async (data: any) => {
  hookPushed.pushed = true;
  await pushData(data);
};

// Apply custom hook BEFORE Readability
if (config.onVisitPage) {
  await config.onVisitPage({ page, pushData: pushDataWrapper });
}

// Process with Readability
// ...
const article = reader.parse();

// Only push default data if hook didn't push
if (!hookPushed.pushed) {
  await pushDataWrapper({ /* Readability output */ });
}
```
- **Source**: `.specstory/history/2025-02-11_06-28-crawling-pipeline-implementation-comparison.md`, `.specstory/history/2025-02-11_16-58-crawling-pipeline-implementation-comparison.md`

### Problem 9: TypeScript Error: `'pushData' is declared but its value is never read`
- **Description**: When the `onVisitPage` hook was implemented to *not* call `pushData` (to avoid duplicate entries), a TypeScript linter error (TS6133) occurred because the `pushData` parameter was unused.
- **Resolution**: Rename the unused parameter by prefixing it with an underscore (`_pushData`). This is a common convention to signal to TypeScript and linters that the parameter is intentionally unused.
- **Code Snippet**:
```typescript
// Example onVisitPage function signature
async function customOnVisitPage({ page, pushData: _pushData }: OnVisitPageParams): Promise<void> {
  // _pushData is intentionally unused
  await page.evaluate(() => {
    // Modify DOM
  });
}
```
- **Source**: `.specstory/history/2025-02-11_06-28-crawling-pipeline-implementation-comparison.md`, `.specstory/history/2025-02-11_16-58-crawling-pipeline-implementation-comparison.md`

### Problem 10: Markdown Code Block Language Not Preserved
- **Description**: The HTML-to-Markdown conversion process using Turndown was not preserving the language specified in HTML code blocks (e.g., `<code class="language-typescript">`). Readability was suspected of stripping these classes before Turndown processing.
- **Resolution**: A multi-step solution was implemented:
    1.  A `preserveCodeBlockLanguages` function was added (`src/core.ts`) to run *before* Readability. It finds `pre` and `code` elements with `language-` classes, stores the language in a map keyed by a unique ID, and adds a `data-code-language-id` attribute to the element.
    2.  The `requestHandler` (`src/core.ts`) calls this function and stores the resulting `languageMap` in the data pushed to the dataset (`codeLanguages: Object.fromEntries(languageMap)`).
    3.  The custom Turndown rule for code blocks (`src/core.ts`) was updated to first check for the `data-code-language-id` attribute and use the corresponding language from `data.codeLanguages`. It falls back to checking the `class` attribute on `<pre>` and `<code>` if the data attribute is not found.
    4.  A fallback mechanism was added (`src/core.ts` `write` function) using a new optional `defaultCodeLanguage` config property (`src/config.ts`) to apply a default language (e.g., 'text') to any code blocks that still lack an identifier after Turndown conversion (`markdownContent.replace(/```\n/g, \`\`\`\${config.defaultCodeLanguage}\n\`);`).
- **Source**: `.specstory/history/2025-03-06_19-35-enhancing-markdown-output-with-language-identifiers.md`

### Problem 11: TypeScript Errors in Turndown Rule (`getAttribute` on `Node`)
- **Description**: TypeScript errors (TS2339) occurred in the custom Turndown rule for code blocks because `getAttribute` was being called on `node`, which is typed as `Node`, but the method exists on `Element`. This happened both in the `preserveCodeBlockLanguages` function and the Turndown rule itself.
- **Resolution**: Type assertions (`as unknown as Element`) were added where `getAttribute` or `setAttribute` were called on nodes queried from the JSDOM document, ensuring the compiler recognized them as elements.
- **Code Snippet** (Example assertion):
```typescript
// In preserveCodeBlockLanguages
codeBlocks.forEach((element) => {
  const el = element as unknown as Element; // Assertion
  const classAttr = el.getAttribute('class');
  // ...
  el.setAttribute('data-code-language-id', id);
});

// In Turndown rule
const el = node as unknown as Element; // Assertion
const languageId = el.getAttribute('data-code-language-id');
```
- **Source**: `.specstory/history/2025-03-06_19-35-enhancing-markdown-output-with-language-identifiers.md`

### Problem 12: Incorrect Backup Config File Naming
- **Description**: The `backup-crawler-output.ts` script was naming the backed-up config file using the domain name and output format (e.g., `domain-markdown_config.ts`), but the requirement was to name it based on the `outputFileName` (e.g., `outputFileName_config.ts`). An initial fix attempt resulted in double `_config` suffix.
- **Resolution**: The script was corrected to construct the destination path directly using the `outputFileName` from the config: `path.join(backupDir, \`${outputFileName}_config.ts\`)`. The `getUniqueFilename` function handles potential name collisions.
- **Code Snippet**:
```typescript
// src/backup-crawler-output.ts
const outputFileName = defaultConfig.outputFileName;
const configDestPath = path.join(backupDir, `${outputFileName}_config.ts`);
const uniqueConfigPath = await getUniqueFilename(configDestPath);
await fs.copyFile(configFile, uniqueConfigPath);
```
- **Source**: `.specstory/history/2025-03-06_20-25-improve-config-file-naming-in-crawler.md`

### Problem 13: Poor Table Extraction and Duplicate Headers
- **Description**: The crawler performed poorly when extracting tables from certain pages (e.g., `colors.html`), often missing table content entirely or duplicating header rows in the final markdown output.
- **Resolution**: Several improvements were made:
    1.  **Readability Preservation:** Logic was added in `requestHandler` (`src/core.ts`) to store the HTML of `table`, `pre`, `code`, and `h1-h6` elements in placeholders before Readability runs and restore them afterward. A check was added to use the original HTML if Readability removed too much content or lost tables.
    2.  **Table Rule Enhancement:** The Turndown table rule (`src/core.ts`) was refined to correctly identify header rows (`thead` or first row `th`s), filter body rows accurately (excluding headers), handle tables without explicit headers, and escape pipe characters (`|`) within cells.
    3.  **Markdown Cleanup:** Post-processing was added in `convertToMarkdown` (`src/core.ts`) to clean excessive newlines and ensure proper heading spacing.
- **Source**: `.specstory/history/2025-03-06_20-39-table-extraction-issues-in-html-crawl.md`

### Problem 14: Module Resolution Error (`ERR_MODULE_NOT_FOUND`) After Refactoring
- **Description**: After refactoring helper functions into separate files (`visitPageHelpers.ts`, `markdownHelpers.ts`) and exporting them via `src/config.ts` or `src/index.ts`, a runtime `ERR_MODULE_NOT_FOUND` error occurred when `main.js` tried to load `scrape-config.js`, which in turn couldn't find the compiled helper modules (e.g., `dist/src/config`). This occurred despite the code working previously without explicit `.js` extensions in imports.
- **Resolution**: The root cause was identified as Node.js's stricter ES module resolution, requiring the `.js` extension for relative imports. The final resolution was to add the `.js` extension to the import statement within the root `scrape-config.ts` file when importing from `./src/config`.
- **Code Snippet** (Corrected import in `scrape-config.ts`):
```typescript
import { Config, visitPage, markdown } from "./src/config.js";
```
- **Source**: `.specstory/history/2025-03-07_09-17-remove-dom-nodes-by-selector-array.md`, `.specstory/history/2025-03-07_11-09-es-module-resolution-error.md`

### Problem 15: TypeScript Compile Error in `server.ts` (Swagger UI)
- **Description**: A TypeScript compilation error (TS2769: No overload matches this call) occurred in `server.ts` when using `swagger-ui-express` middleware with Express (`app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));`). This was due to type incompatibilities between Express and the middleware types.
- **Resolution**: Type assertions (`as any[]` for `swaggerUi.serve` and `as any` for the result of `swaggerUi.setup`) were used to bypass the TypeScript type checking for this specific middleware registration, resolving the compile error.
- **Code Snippet**:
```typescript
// src/server.ts
app.use(
  "/api-docs",
  swaggerUi.serve as any[],
  swaggerUi.setup(swaggerDocument) as any,
);
```
- **Source**: `.specstory/history/2025-03-07_02-13-resolving-typescript-compile-error-in-server-ts.md`

### Problem 16: `onProcessMarkdown` Not Defined in `Config` Type
- **Description**: A linter error occurred in `scrape-config.ts` because the `onProcessMarkdown` property was being used, but it wasn't defined in the `Config` type schema in `src/config.ts`. Additionally, the `core.ts` logic wasn't actually calling this function.
- **Resolution**:
    1. The `onProcessMarkdown` property (an optional function taking a string and returning a string) was added to the `configSchema` using Zod in `src/config.ts`.
    2. The `write` function in `src/core.ts` was updated to call `config.onProcessMarkdown(markdownContent)` if the function is provided in the config, just before writing the final markdown file.
- **Code Snippet** (Schema addition in `src/config.ts`):
```typescript
  /** Optional function to process markdown content */
  onProcessMarkdown: z
    .function()
    .args(z.string())
    .returns(z.string())
    .optional(),
```
- **Code Snippet** (Usage in `src/core.ts`):
```typescript
// In writeBatchToFile function:
// ... generate markdownContent ...

// Apply onProcessMarkdown if provided
if (config.onProcessMarkdown) {
  markdownContent = config.onProcessMarkdown(markdownContent);
}

await writeFile(nextFileNameString, markdownContent);
```
- **Source**: `.specstory/history/2025-03-07_11-56-validating-css-selectors-for-article-tag.md`

## Features and Implementations

### Feature 1: Select HTML Elements with CSS
- **Description**: User asked how to select HTML elements like `<article>` using CSS selectors, comparing tag selectors to class (`.class`) and ID (`#ID`) selectors.
- **Implementation**: Explained the use of the tag selector (`article {}`) and how to combine it with class (`article.some-class`) or ID (`article#some-id`) selectors for more specificity.
- **Source**: `.specstory/history/2025-01-25_21-39-choosing-css-selectors-for-html-elements.md`, `.specstory/history/2025-01-26_08-09-choosing-css-selectors-for-html-elements.md`

### Feature 2: Output JSON Keys with `jq`
- **Description**: User requested a `jq` command to output only the key names from a JSON file.
- **Implementation**: Provided the command `jq 'keys' yourfile.json` for top-level keys and `jq 'paths | select(type == "array") | join(".")' yourfile.json` for recursive key paths.
- **Source**: `.specstory/history/2025-01-25_21-39-choosing-css-selectors-for-html-elements.md`, `.specstory/history/2025-01-26_08-09-choosing-css-selectors-for-html-elements.md`

### Feature 3: Comprehensive Example Configuration File
- **Description**: User requested the creation of a `config.example.ts` file in the root directory, containing all possible configuration options for the `gptcrawler`, with detailed documentation, examples, and use cases.
- **Implementation**: A comprehensive `config.example.ts` file was generated, including comments explaining each option (url, match, exclude, selector, maxPagesToCrawl, outputFileName, outputFileFormat, cookie, onVisitPage, waitForSelectorTimeout, resourceExclusions, maxFileSize, maxTokens, topic) with examples and alternatives.
- **Code Snippet** (Structure):
```typescript
// config.example.ts
import type { Config } from "./src/config";

const config: Config = {
  url: "https://docs.example.com", // URL to start crawling
  match: ["https://docs.example.com/guides/**"], // Patterns to crawl
  exclude: ["https://docs.example.com/guides/legacy/**"], // Patterns to exclude
  selector: ".documentation-content", // CSS selector for content
  maxPagesToCrawl: 100, // Max pages
  outputFileName: "documentation.json", // Output file name
  outputFileFormat: "markdown", // Output format (json, markdown, etc.)
  // ... other options like cookie, onVisitPage, timeouts, exclusions, limits, topic ...
};

export default config;
```
- **Source**: `.specstory/history/2025-01-25_21-39-comprehensive-configuration-file-example.md`, `.specstory/history/2025-01-26_08-09-comprehensive-configuration-file-example.md`

### Feature 4: Generate HTML Icon Reference Page
- **Description**: User requested a way to visualize all Material UI icons along with their snake_case names in an HTML grid.
- **Implementation**: The `iconlist.js` script was created/modified to:
    1. Read icon filenames from the `@mui/icons-material/esm` directory.
    2. Generate an `icon-reference.html` file.
    3. This HTML file includes CSS for styling a grid of cards.
    4. Each card displays the icon (using the Material Icons web font), its original name, and its snake_case name.
- **Source**: `.specstory/history/2025-01-25_22-43-node-js-module-import-error-troubleshooting.md`, `.specstory/history/2025-01-26_09-13-node-js-module-import-error-troubleshooting.md`

### Feature 5: Integrate React Icon Search Component
- **Description**: User inquired about integrating a React-based icon search component (`SearchIcons.js` from MUI docs) into a static HTML page, including its synonym functionality (`synonyms.js`).
- **Implementation**: A high-level plan was provided:
    1. Use Webpack (with Babel for React) to bundle `SearchIcons.js` and its dependencies (including `synonyms.js` after importing it) into a `bundle.js`.
    2. Create an `index.html` file that includes the necessary fonts (Material Icons, Roboto) and the `bundle.js`.
    3. Use `ReactDOM.render` within the React component's entry point to mount it to a div (e.g., `#root`) in the HTML.
- **Source**: `.specstory/history/2025-01-26_00-05-icon-rendering-issues-in-html-output.md`, `.specstory/history/2025-01-26_10-35-icon-rendering-issues-in-html-output.md`

### Feature 6: Specify Language in HTML Code Blocks
- **Description**: User asked how to specify the language for syntax highlighting in HTML `<pre><code>` blocks.
- **Implementation**: Explained the common convention of using a class with the `language-` prefix (e.g., `<code class="language-python">`).
- **Source**: `.specstory/history/2025-02-11_01-59-specifying-language-in-code-blocks.md`, `.specstory/history/2025-02-11_12-29-specifying-language-in-code-blocks.md`

### Feature 7: Automatic Cleanup of Generated Output Files
- **Description**: User requested that the main generated output files (e.g., `output.json`, `output.md`) be automatically deleted from the project root directory after the `backup-crawler-output.ts` script successfully copies them to the `crawled/` subdirectory.
- **Implementation**: The `backup-crawler-output.ts` script was modified. After the loop that copies the output files, another loop was added to iterate through the same list of `outputFiles` and delete each one using `await fs.unlink(outputFile)`. Logging messages were added for the cleanup process.
- **Code Snippet** (Logic added in `backup-crawler-output.ts`):
```typescript
// After successful backup loop...
console.log("\nCleaning up output files...");
for (const outputFile of outputFiles) { // outputFiles contains paths like './output.json', './output-1.json'
  await fs.unlink(outputFile);
  console.log(`Deleted: ${outputFile}`);
}
console.log("Cleanup completed.");
```
- **Source**: `.specstory/history/2025-02-11_02-13-cleanup-process-for-generated-files.md`, `.specstory/history/2025-02-11_12-43-cleanup-process-for-generated-files.md`

### Feature 8: `onVisitPage` Custom Function Hook
- **Description**: User asked to confirm the implementation status of the `onVisitPage` hook mentioned in `config.example.ts` and later requested its use for cleaning code blocks. Its execution timing relative to content capture was also discussed and adjusted.
- **Implementation**:
    1. Confirmed that `onVisitPage` was defined in the Zod schema (`src/config.ts`) and called in the `requestHandler` (`src/core.ts`).
    2. Implemented `onVisitPage` logic in `scrape-config.ts` (using helpers) to perform DOM manipulations (e.g., code block cleaning, node removal) before content capture.
    3. Adjusted `src/core.ts` to ensure `onVisitPage` executes *before* `page.content()` is called, allowing DOM changes to affect the captured HTML.
- **Source**: `.specstory/history/2025-02-11_05-23-confirmation-of-custom-function-implementation.md`, `.specstory/history/2025-02-11_15-53-confirmation-of-custom-function-implementation.md`, `.specstory/history/2025-03-07_03-38-execution-order-of-onvisitpage-function.md`

### Feature 9: Modification of Stored Data Fields
- **Description**: User requested changes to the data fields stored in the intermediate JSON files by `src/core.ts`. Specifically, remove `excerpt`, `byline`, `siteName`, and the `textContent` field.
- **Implementation**: The object passed to `pushDataWrapper` within the `requestHandler` in `src/core.ts` was modified to only include `title`, `url`, `content`, and `codeLanguages`. The `minimalisticTextContent` helper function previously added was removed as `textContent` itself was removed.
- **Code Snippet** (Modified `pushDataWrapper` call in `src/core.ts`):
```typescript
await pushDataWrapper({
  title: article?.title || title,
  url: request.loadedUrl,
  content: finalContent, // finalContent might be article.content or originalHtml
  codeLanguages: Object.fromEntries(languageMap), // Store the language map
});
```
- **Source**: `.specstory/history/2025-02-11_09-22-comparison-of-json-storage-in-core-versions.md`, `.specstory/history/2025-02-11_19-52-comparison-of-json-storage-in-core-versions.md`

### Feature 10: Reusable Helper Functions for Config Callbacks
- **Description**: User requested refactoring of `onVisitPage` and `onProcessMarkdown` helper functions (like node removal, code cleaning, markdown processing) and chaining utilities into the core `src/` codebase for better organization and reusability in the root `scrape-config.ts`.
- **Implementation**:
    1. Created `src/visitPageHelpers.ts` containing `OnVisitPageParams` type, `createRemoveNodesFunction`, `cleanCodeBlocks`, and `chainVisitFunctions`.
    2. Created `src/markdownHelpers.ts` containing `addLanguageToCodeBlocks`, `removeHtmlComments`, `normalizeHeadings`, and `chainMarkdownProcessors`.
    3. Modified `src/config.ts` to export these helpers under namespaces: `export * as visitPage from './visitPageHelpers';` and `export * as markdown from './markdownHelpers';`.
    4. Updated `scrape-config.ts` to import from `./src/config.js` and use the helpers via namespaces (e.g., `visitPage.chainVisitFunctions(...)`, `markdown.chainMarkdownProcessors(...)`).
    5. Defined config-specific functions like `removeNodesFromDOM` within `scrape-config.ts` itself, calling the factory function from the helpers (`visitPage.createRemoveNodesFunction([...])`).
- **Source**: `.specstory/history/2025-03-07_09-17-remove-dom-nodes-by-selector-array.md`

### Feature 11: Renaming Root Config File
- **Description**: User requested renaming the main configuration file in the project root from `config.ts` to `scrape-config.ts` to avoid confusion with `src/config.ts`.
- **Implementation**:
    1. User manually renamed `config.ts` to `scrape-config.ts` and updated `tsconfig.json`.
    2. Code changes were made in `src/main.ts` and `src/backup-crawler-output.ts` to import `defaultConfig` from `"../scrape-config.js"`.
    3. References in `README.md` and `containerapp/data/init.sh` were updated.
    4. The example config file was renamed to `scrape-config.example.ts`.
    5. The config file within `containerapp/data/` was renamed to `scrape-config.ts`.
- **Source**: `.specstory/history/2025-03-07_11-09-es-module-resolution-error.md`

### Feature 12: Internal Link Conversion in Combined Markdown
- **Description**: User requested that when multiple pages are crawled and combined into a single markdown file, links between those crawled pages should be converted into internal fragment links (e.g., `[link text](#target-section-id)`) pointing to the corresponding page's header within the document, instead of remaining external URLs. The `URL: http...` line at the start of each section should be preserved.
- **Implementation**:
    1. Modified the `write` function (`src/core.ts`) to collect all crawled URLs and their titles into maps before processing content.
    2. Passed `allUrls` and `allTitles` to the `convertToMarkdown` function.
    3. Modified the header generation in `convertToMarkdown` to create a unique, sanitized slug based on the page's URL path relative to the `baseUrl` (e.g., `reference-css-variables-foundations-colors`) and added it as an ID (`## Title {#slug}`).
    4. Modified the Turndown link rule (`convertToMarkdown`) to:
        *   Normalize the link `href`.
        *   Check if the normalized `href` matches any URL in `allUrls`.
        *   If it's an internal link, generate the same URL path-based slug as the target header.
        *   Output the link as `[link text](#slug)`.
        *   If it's not an internal link, output the original external link `[link text](href)`.
- **Source**: `.specstory/history/2025-03-06_20-39-table-extraction-issues-in-html-crawl.md`

### Feature 13: File Copy Verification and Source Deletion
- **Description**: User requested that the `backup-crawler-output.ts` script verify that the copied output and config files are identical to the source files (using hashes) and then delete the original *output* file after successful verification.
- **Implementation**:
    1. Imported the `crypto` module in `backup-crawler-output.ts`.
    2. Added a `calculateFileHash` helper function using SHA-256.
    3. After copying the output file, calculated hashes for both source and destination. If hashes mismatch, log an error and exit. If they match, log verification and delete the original output file using `fs.unlink`.
    4. Added similar hash verification for the config file (without deletion).
    5. Updated console logs to reflect verification and deletion steps.
- **Code Snippet** (Hash verification and deletion logic):
```typescript
// src/backup-crawler-output.ts
async function calculateFileHash(filepath: string): Promise<string> { /* ... */ }

// After copying outputFile to uniqueOutputPath
const sourceOutputHash = await calculateFileHash(outputFile);
const destOutputHash = await calculateFileHash(uniqueOutputPath);
if (sourceOutputHash !== destOutputHash) {
  console.error(`Error: Hash mismatch for output file...`);
  process.exit(1);
}
console.log(`Output file hash verified: ${sourceOutputHash}`);
await fs.unlink(outputFile); // Delete original
console.log(`Original output file deleted: ${outputFile}`);

// After copying configFile to uniqueConfigPath
const sourceConfigHash = await calculateFileHash(configFile);
const destConfigHash = await calculateFileHash(uniqueConfigPath);
if (sourceConfigHash !== destConfigHash) {
  console.error(`Error: Hash mismatch for config file...`);
  process.exit(1);
}
console.log(`Config file hash verified: ${sourceConfigHash}`);
```
- **Source**: `.specstory/history/2025-03-29_06-52-typescript-file-copy-and-verification-update.md`

## Recommendations and Suggestions

### Recommendation 1: Version Control for `.specstory` Directory
- **Details**: The `.specstory/history/.what-is-this.md` file recommends keeping the `.specstory` directory (which contains chat history) under version control to maintain a history of AI interactions. It also provides instructions on how to `.gitignore` it if preferred. It specifically recommends *not* versioning `.specstory/cursor_rules_backups` if `.cursor/rules` is already versioned.
- **Source**: `.specstory/history/.what-is-this.md`

### Recommendation 2: Exclude `.specstory` from Code Search
- **Details**: To avoid including AI interaction history in codebase searches, it's recommended to add `.specstory/*` to the "files to exclude" setting in the editor's search functionality.
- **Source**: `.specstory/history/.what-is-this.md`

### Recommendation 3: Handling Unused Function Parameters in TypeScript
- **Details**: When a function parameter (like `pushData` in `onVisitPage`) is intentionally unused, prefix its name with an underscore (`_pushData`) to signal intent and suppress TypeScript linter warnings (TS6133).
- **Code Snippet**:
```typescript
async function myOnVisitPage({ page, pushData: _pushData }: OnVisitPageParams) {
  // _pushData is unused
  await page.evaluate(() => { /* ... */ });
}
```
- **Source**: `.specstory/history/2025-02-11_06-28-crawling-pipeline-implementation-comparison.md`, `.specstory/history/2025-02-11_16-58-crawling-pipeline-implementation-comparison.md`

### Recommendation 4: Refactor Helper Functions
- **Details**: It was recommended and implemented to move reusable helper functions (for `onVisitPage` and `onProcessMarkdown`) out of the main configuration file (`scrape-config.ts`) and into separate files within the `src/` directory (`src/visitPageHelpers.ts`, `src/markdownHelpers.ts`) for better organization, reusability, and maintainability. Config-specific functions (like `removeNodesFromDOM` using specific selectors) should remain defined within the config file, potentially calling factory functions from the helpers.
- **Source**: `.specstory/history/2025-03-07_09-17-remove-dom-nodes-by-selector-array.md`

### Recommendation 5: Use `.js` Extension for ES Module Imports in Node.js
- **Details**: To resolve `ERR_MODULE_NOT_FOUND` errors when using ES modules in Node.js, it's recommended to include the `.js` extension in relative import paths, even when importing TypeScript files, as Node.js resolves based on the compiled JavaScript output.
- **Code Snippet**:
```typescript
import { Config, visitPage, markdown } from "./src/config.js"; // Note the .js
```
- **Source**: `.specstory/history/2025-03-07_11-09-es-module-resolution-error.md`