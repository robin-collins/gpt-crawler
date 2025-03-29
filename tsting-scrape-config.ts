import { Config } from "./src/config";

export const defaultConfig: Config = {
  url: "https://d2lang.com/tour/intro/",
  match: ["https://d2lang.com/tour/intro/"],
  exclude: [],
  maxPagesToCrawl: 1,
  topic: "testing",
  selector: ".theme-doc-markdown",
  outputFileName: "onvisit-docs.md",
  outputFileFormat: "markdown",

  // Custom onVisitPage function to remove numbering from code blocks and wrap them in triple backticks.
  // This version only modifies the content over the page and does not push or return any data.
  onVisitPage: async ({ page, pushData: _pushData }) => {
    await page.evaluate(() => {
      // Select all code blocks within sections with the "CodeBlock" class.
      const codeBlocks = document.querySelectorAll('section.CodeBlock pre');
      codeBlocks.forEach(codeBlock => {
        if (!(codeBlock instanceof HTMLElement)) return;
        // Get the raw text of the code block and split it into lines.
        const lines = codeBlock.innerText.split('\n');
        // Remove any leading numbers (and an optional space) from each line.
        const cleanedLines = lines.map((line: string) => line.replace(/^\s*\d+\s?/, ''));
        // Create new <pre> and <code> nodes and insert the cleaned code.
        const newPre = document.createElement("pre");
        const newCode = document.createElement("code");
        newCode.textContent = cleanedLines.join("\n");
        newPre.appendChild(newCode);
        // Replace the old <pre> element with the new one.
        if (codeBlock.parentNode) {
          codeBlock.parentNode.replaceChild(newPre, codeBlock);
        }
      });
    });
  },
};
