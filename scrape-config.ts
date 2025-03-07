import { Config, visitPage, markdown } from "./src/config";

/**
 * Custom function to remove specific DOM elements
 * Removes footer and outline elements from the DOM
 */
const removeNodesFromDOM = visitPage.createRemoveNodesFunction([
  ".mod-footer.mod-ui",
  ".outline-view-outer.node-insert-event",
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
