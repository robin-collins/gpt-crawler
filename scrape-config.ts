import * as ConfigModule from "./src/config.js";
import { Config } from "./src/config"; // Importing only the type

const { visitPage, markdown } = ConfigModule;

/**
 * Custom function to remove specific DOM elements
 * Removes footer and outline elements from the DOM
 */

// const removeNodesFromDOM = visitPage.createRemoveNodesFunction(["iframe"]);

const combinedOnVisitPage = visitPage.chainVisitFunctions(
  visitPage.cleanNextraCodeBlocks,
  visitPage.cleanCodeBlocks
);

export const defaultConfig: Config = {
  url: "https://www.librechat.ai/docs/configuration/librechat_yaml/ai_endpoints",
  match: ["https://www.librechat.ai/docs/configuration/librechat_yaml/ai_endpoints"],
  exclude: [],
  maxPagesToCrawl: 1,
  topic: "librechat",
  selector: "article",
  outputFileName: "librechat-configuration.md",
  outputFileFormat: "markdown",
  waitForSelectorTimeout: 5000,
  // onVisitPage: visitPage.cleanNextraCodeBlocks,
  // onProcessMarkdown: (md) => ConfigModule.markdown.addLanguageToCodeBlocks(md, "python"),
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
