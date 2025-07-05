import type { Page } from "playwright";

/**
 * Type for the onVisitPage function parameters
 */
export type OnVisitPageParams = {
  page: Page;
  pushData: (data: any) => Promise<void>;
};

/**
 * Factory function to create a DOM node removal function
 * @param selectorsToRemove - Array of CSS selectors for elements to remove
 * @returns A function that can be used as onVisitPage to remove the specified elements
 */
export const createRemoveNodesFunction = (selectorsToRemove: string[]) => {
  return async ({
    page,
    pushData: _pushData,
  }: OnVisitPageParams): Promise<void> => {
    console.log(
      "\x1b[91mvisitPageHelpers.ts:\x1b[0m  createRemoveNodesFunction executing",
    );
    console.log(
      "\x1b[91mvisitPageHelpers.ts:\x1b[0m  selectors to remove:",
      selectorsToRemove,
    );

    const results = await page.evaluate((selectors: string[]) => {
      if (!selectors || !Array.isArray(selectors)) {
        return { error: "Selectors not found or not an array" };
      }

      interface SelectorResult {
        selector: string;
        found: boolean;
        count: number;
      }

      const selectorResults: SelectorResult[] = [];

      selectors.forEach((selector) => {
        // Find all elements matching the selector
        const elements = document.querySelectorAll(selector);

        selectorResults.push({
          selector,
          found: elements.length > 0,
          count: elements.length,
        });

        // Remove each element from the DOM
        elements.forEach((element) => {
          if (element && element.parentNode) {
            element.parentNode.removeChild(element);
          }
        });
      });

      return { selectorResults };
    }, selectorsToRemove);

    console.log(
      "\x1b[91mvisitPageHelpers.ts:\x1b[0m  Results from browser:",
      JSON.stringify(results, null, 2),
    );
  };
};

/**
 * Function to clean code blocks by removing line numbers and formatting
 * @param params - The onVisitPage parameters
 */
export const cleanCodeBlocks = async ({
  page,
  pushData: _pushData,
}: OnVisitPageParams): Promise<void> => {
  await page.evaluate(() => {
    // Select all pre elements that contain code blocks
    const codeBlocks = document.querySelectorAll("pre");

    codeBlocks.forEach((codeBlock) => {
      if (!(codeBlock instanceof HTMLElement)) return;

      // Find the actual code content, which is within a code element
      const codeElement = codeBlock.querySelector("code");
      if (!codeElement) return;

      // Get all text content, removing special characters and extra whitespace
      let codeText = "";
      // Use innerText to better preserve visual line breaks, then split
      const codeLines = codeElement.innerText?.split("\n") || [];

      codeLines.forEach((line) => {
        // Remove line numbers and their associated elements
        const processedLine = line
          .replace(/^\s*\d+\s?/, "") // Remove leading line numbers
          .replace(/^\s*\$\s/, "$  ") // Preserve command prompts but normalize spacing
          .replace(/^.*codelineno.*$/, ""); // Remove line number anchor elements

        // Skip only powershell command lines, include all others (even if empty)
        if (processedLine.startsWith("$ powershell")) {
          // Do nothing, effectively skipping this line from being added to codeText
        } else {
          codeText += processedLine + "\n";
        }
      });

      // Create new clean elements
      const newPre = document.createElement("pre");
      const newCode = document.createElement("code");

      // Attempt to preserve the language class
      let languageClass = "";
      if (codeElement.className) {
        const langMatch = codeElement.className.split(' ').find(cls => cls.startsWith('language-'));
        if (langMatch) {
          languageClass = langMatch;
        }
      }
      // If not found on <code>, check <pre>
      if (!languageClass && codeBlock.className) {
        const langMatch = codeBlock.className.split(' ').find(cls => cls.startsWith('language-'));
        if (langMatch) {
          languageClass = langMatch;
        }
      }
      // Default if no specific language class is found
      if (!languageClass) {
        languageClass = "language-text";
      }
      newCode.className = languageClass;

      newCode.textContent = codeText;
      newPre.appendChild(newCode);

      // Replace the old complex structure with our clean one
      if (codeBlock.parentNode) {
        codeBlock.parentNode.replaceChild(newPre, codeBlock);
      }
    });
  });
};

/**
 * Function to clean Nextra-specific code blocks by extracting text from spans.
 * @param params - The onVisitPage parameters
 */
export const cleanNextraCodeBlocks = async ({
  page,
  pushData: _pushData,
}: OnVisitPageParams): Promise<void> => {
  // We are injecting the logic from the validated test script here.
  // Note: console.log calls inside evaluate will go to the browser's console,
  //       not the Node.js console unless explicitly forwarded (like in the test script).
  const results = await page.evaluate(() => {
    // Select <pre> elements using the class identified in reactflow examples
    const codeBlocks = document.querySelectorAll("pre.not-prose");
    let processedCount = 0;
    let replacedCount = 0;

    codeBlocks.forEach((codeBlock) => {
      if (!(codeBlock instanceof HTMLElement)) return;

      // Find the specific <code class="nextra-code"> element inside the <pre>
      const codeElement = codeBlock.querySelector("code.nextra-code");
      if (!codeElement) {
        return; // Skip pre blocks that don't contain the target code element
      }

      processedCount++; // Increment count for blocks containing the target code element

      // Get all direct child spans within the code element
      const lineSpans =
        codeElement.querySelectorAll<HTMLElement>(":scope > span");
      let extractedCodeText = "";

      lineSpans.forEach((lineSpan) => {
        const lineText = lineSpan.textContent || "";
        extractedCodeText += lineText + "\n";
      });

      const cleanedText = extractedCodeText.trim();

      const newPre = document.createElement("pre");
      const newCode = document.createElement("code");

      const langClass =
        Array.from(codeElement.classList).find((cls) =>
          cls.startsWith("language-"),
        ) || "language-typescript"; // Default to typescript
      newCode.className = langClass;
      newCode.textContent = cleanedText;
      newPre.appendChild(newCode);

      if (codeBlock.parentNode) {
        codeBlock.parentNode.replaceChild(newPre, codeBlock);
        replacedCount++; // Increment count for successfully replaced blocks
      }
    });

    // Return summary data
    return {
      totalFound: codeBlocks.length,
      processed: processedCount,
      replaced: replacedCount,
    };
  });

  // Log the results in the Node.js console
  console.log(
    `\x1b[96m[cleanNextraCodeBlocks][0m Found: ${results.totalFound}, Processed: ${results.processed}, Replaced: ${results.replaced} Nextra code blocks.`,
  );
};

/**
 * Function to clean Hyperdiv-specific code blocks (div.codehilite > pre > code)
 * by replacing the outer div.codehilite with the inner pre element.
 * @param params - The onVisitPage parameters
 */
export const cleanHyperdivCodeBlocks = async ({
  page,
  pushData: _pushData,
}: OnVisitPageParams): Promise<void> => {
  const results = await page.evaluate(() => {
    const codeContainers = document.querySelectorAll("div.codehilite");
    let processedCount = 0;
    let replacedCount = 0;

    codeContainers.forEach((container) => {
      if (!(container instanceof HTMLElement)) return;

      const preElement = container.querySelector("pre");
      if (!preElement) {
        return; // Skip containers that don't contain a pre element
      }

      processedCount++;

      // Replace the container with the preElement
      if (container.parentNode) {
        container.parentNode.replaceChild(preElement, container);
        replacedCount++;
      }
    });

    return {
      totalFound: codeContainers.length,
      processed: processedCount,
      replaced: replacedCount,
    };
  });

  console.log(
    `\x1b[96m[cleanHyperdivCodeBlocks] [0m Found: ${results.totalFound}, Processed: ${results.processed}, Replaced: ${results.replaced} div.codehilite blocks.`,
  );
};

/**
 * function to confirm that onVisitPage is working and returl the page.url
 */
export const confirmOnVisitPage = async ({
  page,
  pushData: _pushData,
}: OnVisitPageParams): Promise<void> => {
  console.log("\x1b[91mvisitPageHelpers.ts:\x1b[0m  onVisitPage is working");
  console.log("\x1b[91mvisitPageHelpers.ts:\x1b[0m  page.url(): ", page.url());
};

/**
 * Helper function to chain multiple onVisitPage functions together
 * @param functions - Array of onVisitPage functions to chain
 * @returns A single function that runs all the provided functions in sequence
 *
 * @example
 * // Chain the functions together
 * const combinedOnVisitPage = chainVisitFunctions(confirmOnVisitPage, processPage);
 *
 * // Later in your code, when you have a page object and pushData function:
 * // await combinedOnVisitPage({ page, pushData });
 */
export const chainVisitFunctions = (
  ...functions: ((params: OnVisitPageParams) => Promise<void>)[]
) => {
  return async (params: OnVisitPageParams): Promise<void> => {
    for (const func of functions) {
      await func(params);
    }
  };
};
