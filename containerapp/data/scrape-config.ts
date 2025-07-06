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
  url: "https://www.builder.io/c/docs/developers",
  match: "https://www.builder.io/c/docs/**",
  maxPagesToCrawl: 50,
  outputFileName: "../data/output.json",
};
