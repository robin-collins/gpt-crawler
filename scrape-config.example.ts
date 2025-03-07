import { Config, visitPage, markdown } from "./src/config";

/**
 * Custom function to remove specific DOM elements
 * Removes footer and outline elements from the DOM
 */
const removeNodesFromDOM = visitPage.createRemoveNodesFunction([
  ".mod-footer.mod-ui",
  ".outline-view-outer.node-insert-event",
]);

const config: Config = {
  // URL to start crawling from. Can be a regular webpage or a sitemap URL
  url: "https://docs.example.com",
  // Alternative sitemap example:
  // url: "https://docs.example.com/sitemap.xml",

  // Specify patterns for URLs to crawl. Can be a single pattern or an array of patterns.
  // Supports glob patterns (**, *, ?)
  match: [
    "https://docs.example.com/guides/**",
    "https://docs.example.com/api/**",
  ],
  // Alternative single pattern example:
  // match: "https://docs.example.com/docs/**",

  // Optional: Exclude specific URL patterns from crawling
  exclude: [
    "https://docs.example.com/guides/legacy/**",
    "https://docs.example.com/api/deprecated/**",
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
    value: "accepted",
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
  onVisitPage: removeNodesFromDOM,

  // Example of chaining multiple functions together
  // onVisitPage: visitPage.chainVisitFunctions(
  //   removeNodesFromDOM,
  //   visitPage.cleanCodeBlocks
  // ),
  onProcessMarkdown: markdown.removeHtmlComments,
  // Example of chaining multiple markdown processors together
  // onProcessMarkdown: markdown.chainMarkdownProcessors(
  //   markdown.addLanguageToCodeBlocks,
  //   markdown.removeHtmlComments,
  //   markdown.normalizeHeadings
  // ),

  // Optional: Timeout (in milliseconds) for waiting for elements to appear
  waitForSelectorTimeout: 5000,

  // Optional: File types to exclude from crawling
  // Common examples included below, see config.ts for full list
  resourceExclusions: [
    "png",
    "jpg",
    "jpeg",
    "gif",
    "svg",
    "css",
    "js",
    "pdf",
    "doc",
    "docx",
    "zip",
    "tar",
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
  topic: "technical-documentation",
};

export default config;
