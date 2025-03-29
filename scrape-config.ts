import * as ConfigModule from "./src/config.js";
import { Config } from "./src/config"; // Importing only the type

const { visitPage, markdown } = ConfigModule;

/**
 * Custom function to remove specific DOM elements
 * Removes footer and outline elements from the DOM
 */

const removeNodesFromDOM = visitPage.createRemoveNodesFunction([
  ".site-body-right-column",
  ".mod-footer.mod-ui",
]);

const combinedOnVisitPage = visitPage.chainVisitFunctions(
  visitPage.confirmOnVisitPage,
  visitPage.cleanCodeBlocks,
);

export const defaultConfig: Config = {
  url: "http://localhost:3000",
  match: ["http://localhost:3000/**/**"],
  exclude: [],
  maxPagesToCrawl: 1000,
  topic: "obsidian",
  selector: "#content",
  outputFileName: "Templater-plugin.md",
  outputFileFormat: "markdown",
  // onVisitPage: combinedOnVisitPage,
  // onProcessMarkdown: markdown.addLanguageToCodeBlocks,
};

/*
<!--
You can use various selectors to target this element:

1. Tag selector:
   article

2. Class selector:
   .markdown-section

3. ID selector:
   #main

4. Attribute selector:
   [class="markdown-section"]
   [id="main"]

5. Combined selectors:
   article.markdown-section
   article#main
   .markdown-section#main

6. Descendant selectors (for children inside):
   article.markdown-section > p
   #main > div

7. Pseudo-classes:
   .markdown-section:hover
   #main:first-child

8. Pseudo-elements:
   .markdown-section::before
   #main::after
-->
<article class="markdown-section" id="main"></article>
*/
