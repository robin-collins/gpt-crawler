## SpecStory

## Comprehensive Configuration File Example (1/26/2025, 8:09:47 AM)

_**User**_

create a 'config.example.ts' in the root dir of the repository that can be used as a reference. put all possible config options in it, and provide documentation, and examples for all. Consider helpful examples the both cover expect use cases as well as examples the showcase / explain the config options. Provide as many examples in comments as needed.

---

_**Assistant**_

I'll create a comprehensive example configuration file with detailed documentation and examples.

```typescript:config.example.ts
import type { Config } from "./src/config";

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
  // Alternative single pattern example:
  // match: "https://docs.example.com/docs/**",

  // Optional: Exclude specific URL patterns from crawling
  exclude: [
    "https://docs.example.com/guides/legacy/**",
    "https://docs.example.com/api/deprecated/**"
  ],

  // CSS selector to extract content from each page
  // Examples:
  // - Select main content area: ".main-content"
  // - Select multiple sections: ".documentation-body, .api-content"
  // - Select by ID: "#main-container"
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

  // Optional: Set cookies for authenticated crawling
  // Single cookie example:
  cookie: {
    name: "consent",
    value: "accepted"
  },
  // Multiple cookies example:
  // cookie: [
  //   {
  //     name: "session",
  //     value: "abc123"
  //   },
  //   {
  //     name: "preferences",
  //     value: "dark-mode"
  //   }
  // ],

  // Optional: Custom function to execute on each page visit
  // Useful for extracting specific data or performing custom actions
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

  // Optional: Timeout (in milliseconds) for waiting for elements to appear
  waitForSelectorTimeout: 5000,

  // Optional: File types to exclude from crawling
  // Common examples included below, see config.ts for full list
  resourceExclusions: [
    "png", "jpg", "jpeg", "gif", "svg", "css", "js",
    "pdf", "doc", "docx", "zip", "tar"
  ],

  // Optional: Maximum file size in megabytes to include in output
  // Useful for limiting large files from being processed
  maxFileSize: 5,

  // Optional: Maximum number of tokens to include in output
  // Helpful when working with AI models that have token limits
  maxTokens: 8000,

  // Optional: Topic categorization for the crawled content
  // Examples:
  // - "api-documentation"
  // - "user-guides"
  // - "tutorials"
  topic: "technical-documentation"
};

export default config;
```

This example configuration file includes:

1. All possible configuration options from the schema
2. Detailed comments explaining each option
3. Multiple examples for complex options
4. Real-world use cases
5. Alternative configurations shown in comments
6. Practical examples of how to use each feature

The file can serve as both a reference and a starting point for users to create their own configuration. Users can copy this file, rename it to `config.ts`, and modify it according to their needs.

---

_**Assistant**_

---

---
