# GPTCrawler Project Analysis Report

## Problems and Resolutions

### Problem 1: Incorrect execution order for onVisitPage function
- **Description**: The `onVisitPage` function was being executed after content was captured and processed by Readability, causing any DOM modifications made by the function to not be reflected in the captured content.
- **Resolution**: Modified the `requestHandler` in `core.ts` to call the `onVisitPage` function before content capture with Readability.
- **Code Snippet**:
```typescript
// Execute onVisitPage BEFORE content capture
if (config.onVisitPage) {
  await config.onVisitPage({ page, pushData: pushDataWrapper });
}

// Now capture the content AFTER any DOM modifications
const html = await page.content();
const dom = new JSDOM(html, { url: request.loadedUrl });
const reader = new Readability(dom.window.document);
const article = reader.parse();
```
- **Source**: 2025-03-07_03-38-execution-order-of-onvisitpage-function.md

### Problem 2: Module import error with lodash
- **Description**: Error when importing lodash/snakeCase in Node.js ES modules due to missing file extension.
- **Resolution**: Two solutions were provided: either use the standalone `lodash.snakecase` package, or add the `.js` extension to the import.
- **Code Snippet**:
```javascript
// Solution 1
import snakeCase from "lodash.snakecase";

// Solution 2
import snakeCase from "lodash/snakeCase.js";
```
- **Source**: 2025-01-25_22-43-node-js-module-import-error-troubleshooting.md

### Problem 3: Icon rendering issues in HTML output
- **Description**: Material icons were not displaying correctly in generated HTML output, appearing scattered instead of in their designated cards.
- **Resolution**: Updated CSS styles and selectors to properly handle Material Icons font loading and display.
- **Code Snippet**:
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Material+Icons&display=swap" rel="stylesheet">
<style>
  .material-icons {
    font-family: 'Material Icons';
    font-weight: normal;
    font-style: normal;
    font-size: 40px;
    display: inline-block;
    line-height: 1;
    text-transform: none;
    letter-spacing: normal;
    word-wrap: normal;
    white-space: nowrap;
    direction: ltr;
    -webkit-font-smoothing: antialiased;
    text-rendering: optimizeLegibility;
    -moz-osx-font-smoothing: grayscale;
    font-feature-settings: 'liga';
  }
</style>
```
- **Source**: 2025-01-26_01-59-icon-rendering-issues-in-html-output.md

### Problem 4: TypeScript compile error in server.ts
- **Description**: TypeScript compiler error related to incompatible types when using swagger-ui-express middleware.
- **Resolution**: Added type assertions to bypass the type checking for swagger-ui-express components.
- **Code Snippet**:
```typescript
app.use(
  "/api-docs",
  swaggerUi.serve as any[],
  swaggerUi.setup(swaggerDocument) as any
);
```
- **Source**: 2025-03-07_02-13-resolving-typescript-compile-error-in-server-ts.md

### Problem 5: Poor table extraction in HTML crawling
- **Description**: Tables were not being properly extracted from HTML content, resulting in missing or malformed tables in markdown output.
- **Resolution**: Improved the table extraction logic to better handle different table structures, including proper handling of headers and nested elements.
- **Code Snippet**:
```typescript
turndownService.addRule("tables", {
  filter: "table",
  replacement: function (_content, node) {
    const headers: string[] = [];
    let markdown = "";

    // Extract table headers (first trying thead, then falling back to first row)
    const headerRow = node.querySelector("thead tr");
    if (headerRow) {
      headerRow.querySelectorAll("th").forEach((th) => {
        headers.push(
          turndownService.turndown(th.innerHTML.trim()).replace(/\n+/g, " ")
        );
      });
    } else {
      const firstRow = node.querySelector("tr");
      if (firstRow) {
        firstRow.querySelectorAll("th").forEach((th) => {
          headers.push(
            turndownService.turndown(th.innerHTML.trim()).replace(/\n+/g, " ")
          );
        });
      }
    }

    // Add header row to markdown if headers were found
    if (headers.length > 0) {
      markdown += `| ${headers.join(" | ")} |\n`;
      markdown += `| ${headers.map(() => "---").join(" | ")} |\n`;
    }

    // Extract table rows - skip the first row if it was used for headers and there's no thead
    const rows = Array.from(node.querySelectorAll("tbody tr, tr")).filter(tr => {
      if (!node.querySelector("thead") && tr === node.querySelector("tr") && headers.length > 0) {
        return false;
      }
      return true;
    });

    rows.forEach((tr) => {
      const cells: string[] = [];
      tr.querySelectorAll("td, th").forEach((cell) => {
        cells.push(
          turndownService.turndown(cell.innerHTML.trim()).replace(/\n+/g, " ")
        );
      });
      if (cells.length > 0) {
        markdown += `| ${cells.join(" | ")} |\n`;
      }
    });

    return `\n${markdown}\n`;
  }
});
```
- **Source**: 2025-03-06_20-39-table-extraction-issues-in-html-crawl.md

### Problem 6: Missing onProcessMarkdown property in Config type
- **Description**: Linter error in scrape-config.ts because the onProcessMarkdown property was used but wasn't defined in the Config type.
- **Resolution**: Added the onProcessMarkdown property to the configSchema in src/config.ts and updated core.ts to use it.
- **Code Snippet**:
```typescript
// In config.ts
/** Optional function to process markdown content */
onProcessMarkdown: z
  .function()
  .args(z.string())
  .returns(z.string())
  .optional(),

// In core.ts
// Apply onProcessMarkdown if provided
if (config.onProcessMarkdown) {
  markdownContent = config.onProcessMarkdown(markdownContent);
}
```
- **Source**: 2025-03-07_11-56-validating-css-selectors-for-article-tag.md

## Features and Implementations

### Feature 1: Comprehensive configuration file example
- **Description**: A thorough configuration file example with documentation and examples for all possible config options.
- **Implementation**: Created a comprehensive `config.example.ts` file with detailed comments and examples for each configuration option.
- **Code Snippet**:
```typescript
const config: Config = {
  // URL to start crawling from. Can be a regular webpage or a sitemap URL
  url: "https://docs.example.com",
  // Alternative sitemap example:
  // url: "https://docs.example.com/sitemap.xml",

  // Specify patterns for URLs to crawl. Can be a single pattern or an array of patterns.
  // Supports glob patterns (**, *, ?)
  match: [
    "https://docs.example.com/guides/**",
    "https://docs.example.com/api/**"
  ],

  // Optional: Exclude specific URL patterns from crawling
  exclude: [
    "https://docs.example.com/guides/legacy/**",
    "https://docs.example.com/api/deprecated/**"
  ],

  // CSS selector to extract content from each page
  selector: ".documentation-content",

  // Maximum number of pages to crawl (prevents infinite crawling)
  maxPagesToCrawl: 100,

  // Name of the output file where crawled content will be saved
  outputFileName: "documentation.json",

  // Format of the output file
  // - "json": Standard JSON format
  // - "markdown": Convert content to markdown
  // - "human_readable_markdown": Markdown with enhanced readability
  outputFileFormat: "markdown",

  // Optional: Custom function to execute on each page visit
  onVisitPage: async ({ page, pushData }) => {
    // Example: Extract page metadata
    const title = await page.title();
    const description = await page.$eval(
      'meta[name="description"]',
      (el) => el.getAttribute("content") || ""
    );
    await pushData({
      title,
      description,
      url: page.url()
    });
  },

  // Additional options like waitForSelectorTimeout, resourceExclusions, etc.
}
```
- **Source**: 2025-01-25_21-39-comprehensive-configuration-file-example.md

### Feature 2: Code block cleanup with language identification
- **Description**: A function to clean up code blocks by removing line numbers and adding language identifiers.
- **Implementation**: Created a custom onVisitPage function that processes code blocks in the DOM, removing line numbers and setting the appropriate language class.
- **Code Snippet**:
```typescript
onVisitPage: async ({ page, pushData: _pushData }) => {
  await page.evaluate(() => {
    // Select all pre elements that contain code blocks
    const codeBlocks = document.querySelectorAll('pre');

    codeBlocks.forEach(codeBlock => {
      if (!(codeBlock instanceof HTMLElement)) return;

      // Find the actual code content, which is within a code element
      const codeElement = codeBlock.querySelector('code');
      if (!codeElement) return;

      // Get all text content, removing special characters and extra whitespace
      let codeText = '';
      const codeLines = codeElement.textContent?.split('\n') || [];

      codeLines.forEach(line => {
        // Remove line numbers and their associated elements
        const cleanLine = line
          .replace(/^\s*\d+\s?/, '') // Remove leading line numbers
          .replace(/^\s*\$\s/, '$  ') // Preserve command prompts but normalize spacing
          .replace(/^.*codelineno.*$/, '') // Remove line number anchor elements
          .trim();

        if (cleanLine && !cleanLine.startsWith('$ powershell')) { // Skip powershell commands
          codeText += cleanLine + '\n';
        }
      });

      // Create new clean elements
      const newPre = document.createElement('pre');
      const newCode = document.createElement('code');
      newCode.className = 'language-bash';
      newCode.textContent = codeText.trim();
      newPre.appendChild(newCode);

      // Replace the old complex structure with our clean one
      if (codeBlock.parentNode) {
        codeBlock.parentNode.replaceChild(newPre, codeBlock);
      }
    });
  });
}
```
- **Source**: 2025-02-20_09-17-code-cleanup-for-html-code-blocks.md, 2025-02-11_07-07-custom-code-block-formatting-in-markdown.md

### Feature 3: DOM Node Removal by Selector Array
- **Description**: Function to remove DOM nodes based on an array of CSS selectors.
- **Implementation**: Created a factory function that generates a custom `onVisitPage` function to remove elements matching specified selectors.
- **Code Snippet**:
```typescript
// Type for the onVisitPage function parameters
export type OnVisitPageParams = {
  page: Page;
  pushData: (data: any) => Promise<void>;
};

// Factory function to create a DOM node removal function
export const createRemoveNodesFunction = (selectorsToRemove: string[]) => {
  return async ({ page, pushData: _pushData }: OnVisitPageParams): Promise<void> => {
    await page.evaluate((selectors: string[]) => {
      if (!selectors || !Array.isArray(selectors)) return;

      selectors.forEach(selector => {
        // Find all elements matching the selector
        const elements = document.querySelectorAll(selector);

        // Remove each element from the DOM
        elements.forEach(element => {
          if (element && element.parentNode) {
            element.parentNode.removeChild(element);
          }
        });
      });
    }, selectorsToRemove);
  };
};

// Example usage
const removeNodesFromDOM = createRemoveNodesFunction([
  '.mod-footer.mod-ui',
  '.outline-view-outer.node-insert-event'
]);
```
- **Source**: 2025-03-06_22-47-remove-dom-nodes-by-selector-array.md

### Feature 4: Automatic file cleanup after backup
- **Description**: Automatically clean up generated output files after they have been backed up.
- **Implementation**: Added functionality to delete original output files after they've been successfully copied to the backup location.
- **Code Snippet**:
```typescript
// In backup-crawler-output.ts
// After successfully backing up files
console.log("\nCleaning up output files...");
for (const outputFile of outputFiles) {
  await fs.unlink(outputFile);
  console.log(`Deleted: ${outputFile}`);
}
console.log("Cleanup completed.");
```
- **Source**: 2025-02-11_02-13-cleanup-process-for-generated-files.md

### Feature 5: File hash verification and deletion
- **Description**: Verify that copied files are identical via hash comparison, then delete the original files.
- **Implementation**: Added hash calculation for both source and destination files, with verification before deletion.
- **Code Snippet**:
```typescript
// Helper function to calculate SHA-256 hash of a file
async function calculateFileHash(filepath: string): Promise<string> {
  const fileBuffer = await fs.readFile(filepath);
  const hashSum = crypto.createHash("sha256");
  hashSum.update(fileBuffer);
  return hashSum.digest("hex");
}

// After copying the output file
const sourceOutputHash = await calculateFileHash(outputFile);
const destOutputHash = await calculateFileHash(uniqueOutputPath);

if (sourceOutputHash !== destOutputHash) {
  console.error(
    `Error: Hash mismatch for output file. Source (${outputFile}) and destination (${uniqueOutputPath}) are different.`,
  );
  process.exit(1);
}
console.log(`Output file hash verified: ${sourceOutputHash}`);

// Delete the original output file after successful verification
await fs.unlink(outputFile);
console.log(`Original output file deleted: ${outputFile}`);
```
- **Source**: 2025-03-29_06-52-typescript-file-copy-and-verification-update.md

### Feature 6: Improved configuration file naming in backups
- **Description**: Better naming convention for backed up configuration files.
- **Implementation**: Modified the backup function to use the output filename as a prefix for the config backup.
- **Code Snippet**:
```typescript
// Copy the config file with output filename as prefix
const outputFileName = defaultConfig.outputFileName;
const configDestPath = path.join(backupDir, `${outputFileName}_config.ts`);
const uniqueConfigPath = await getUniqueFilename(configDestPath);
await fs.copyFile(configFile, uniqueConfigPath);
```
- **Source**: 2025-03-06_20-25-improve-config-file-naming-in-crawler.md

## Recommendations and Suggestions

### Recommendation 1: Separate helper functions by purpose
- **Details**: Split helper functions into separate files based on their purpose (onVisitPage vs onProcessMarkdown) to make the codebase more organized and clear.
- **Code Snippet**:
```typescript
// Create separate helper files:
// 1. visitPageHelpers.ts - For functions related to onVisitPage
// 2. markdownHelpers.ts - For functions related to onProcessMarkdown

// In index.ts:
export * as visitPage from './visitPageHelpers';
export * as markdown from './markdownHelpers';

// In scrape-config.ts:
import { Config, visitPage, markdown } from "./src/index";

// Example usage:
onVisitPage: visitPage.chainVisitFunctions(
  removeNodesFromDOM,
  visitPage.cleanCodeBlocks
),
onProcessMarkdown: markdown.chainMarkdownProcessors(
  markdown.addLanguageToCodeBlocks,
  markdown.removeHtmlComments,
  markdown.normalizeHeadings
)
```
- **Source**: 2025-03-06_22-47-remove-dom-nodes-by-selector-array.md

### Recommendation 2: Use chain functions for combining multiple processors
- **Details**: Create chain functions to combine multiple onVisitPage or onProcessMarkdown functions in sequence.
- **Code Snippet**:
```typescript
// Helper function to chain multiple onVisitPage functions
export const chainVisitFunctions = (...functions: ((params: OnVisitPageParams) => Promise<void>)[]) => {
  return async (params: OnVisitPageParams): Promise<void> => {
    for (const func of functions) {
      await func(params);
    }
  };
};

// Helper function to chain multiple markdown processors
export const chainMarkdownProcessors = (...processors: ((markdown: string) => string)[]) => {
  return (markdown: string): string => {
    return processors.reduce((processedMarkdown, processor) => {
      return processor(processedMarkdown);
    }, markdown);
  };
};

// Example usage:
onVisitPage: chainVisitFunctions(
  removeNodesFromDOM,
  cleanCodeBlocks
),
onProcessMarkdown: chainMarkdownProcessors(
  addLanguageToCodeBlocks,
  removeHtmlComments,
  normalizeHeadings
)
```
- **Source**: 2025-03-06_22-47-remove-dom-nodes-by-selector-array.md

### Recommendation 3: Rename config.ts to avoid confusion
- **Details**: Rename the root-level config.ts file to scrape-config.ts to avoid confusion with src/config.ts.
- **Code Snippet**:
```typescript
// Update references in files:
// In main.ts:
import { defaultConfig } from "../scrape-config.js";

// In backup-crawler-output.ts:
import { defaultConfig } from "../scrape-config.js";

// In init.sh:
cp /home/data/scrape-config.ts /home/gpt-crawler/
```
- **Source**: 2025-03-06_22-47-remove-dom-nodes-by-selector-array.md

### Recommendation 4: Add language identifiers to code blocks in markdown
- **Details**: Implement a function to automatically add language identifiers to code blocks in markdown output.
- **Code Snippet**:
```typescript
/**
 * Helper function to add language identifiers to code blocks
 * @param markdown - The markdown content to process
 * @returns The processed markdown with language identifiers added to code blocks
 */
export function addLanguageToCodeBlocks(markdown: string): string {
  // Replace code blocks that don't have a language specified
  return markdown.replace(/```\n/g, "```text\n");
}

// In config.ts:
/** Optional function to process markdown content */
onProcessMarkdown: z
  .function()
  .args(z.string())
  .returns(z.string())
  .optional(),

// In scrape-config.ts:
onProcessMarkdown: markdown.addLanguageToCodeBlocks,
```
- **Source**: 2025-03-06_19-35-enhancing-markdown-output-with-language-identifiers.md

### Recommendation 5: Preserve table structure during HTML-to-markdown conversion
- **Details**: Enhance the HTML-to-markdown conversion to better preserve table structure, ensuring proper row and column alignment.
- **Code Snippet**:
```typescript
// Add custom rule to convert HTML tables to Markdown tables
turndownService.addRule("tables", {
  filter: "table",
  replacement: function (_content, node) {
    const headers: string[] = [];
    let markdown = "";

    // Extract table headers
    const headerRow = node.querySelector("thead tr");
    if (headerRow) {
      headerRow.querySelectorAll("th").forEach((th) => {
        headers.push(
          turndownService.turndown(th.innerHTML.trim()).replace(/\n+/g, " ")
        );
      });
    }

    // Add header row to markdown
    if (headers.length > 0) {
      markdown += `| ${headers.join(" | ")} |\n`;
      markdown += `| ${headers.map(() => "---").join(" | ")} |\n`;
    }

    // Extract table rows
    node.querySelectorAll("tr").forEach((tr) => {
      const cells: string[] = [];
      tr.querySelectorAll("td").forEach((td) => {
        cells.push(
          turndownService.turndown(td.innerHTML.trim()).replace(/\n+/g, " ")
        );
      });
      if (cells.length > 0) {
        markdown += `| ${cells.join(" | ")} |\n`;
      }
    });

    return `\n${markdown}\n`;
  }
});
```
- **Source**: 2025-03-06_20-39-table-extraction-issues-in-html-crawl.md