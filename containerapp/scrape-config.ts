import * as ConfigModule from "./src/config.js";
import type { Config } from "./src/config"; // Importing only the type

const { visitPage, markdown } = ConfigModule;
void markdown; // This is to ensure that the markdown module is imported but not throw an error
// void visitPage; // This is to ensure that the visitPage module is imported but not throw an error

/**
 * Custom function to remove specific DOM elements
 * Removes footer and outline elements from the DOM
 */
const removeNodesFromDOM = visitPage.createRemoveNodesFunction([
  ".css-162gapn",
]);

export const defaultConfig: Config = {
  url: "https://docs.obsidian.md/",
  match: [
    "https://docs.obsidian.md/Reference/CSS+variables/CSS+variables",
    "https://docs.obsidian.md/Reference/CSS+variables/Foundations/Borders",
    "https://docs.obsidian.md/Reference/CSS+variables/Foundations/Colors",
  ],
  exclude: [],
  maxPagesToCrawl: 3,
  topic: "obsidian-dev",
  selector: ".markdown-preview-sizer.markdown-preview-section",
  outputFileName: "obsidian-ref-css-vars.md",
  outputFileFormat: "markdown",
  onVisitPage: removeNodesFromDOM,
  // Example of chaining multiple functions together
  // onVisitPage: visitPage.chainVisitFunctions(
  //   removeNodesFromDOM,
  //   visitPage.cleanCodeBlocks
  // ),

  // Example of chaining multiple markdown processors together
  // onProcessMarkdown: markdown.chainMarkdownProcessors(
  //   markdown.addLanguageToCodeBlocks,
  //   markdown.removeHtmlComments,
  //   markdown.normalizeHeadings
  // ),

  /*

'https://docs.obsidian.md/Reference/TypeScript+API/**','https://docs.obsidian.md/Themes/**', 'https://docs.obsidian.md/Plugins/**'
*/
};
