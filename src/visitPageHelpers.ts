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
    console.log('\x1b[91mvisitPageHelpers.ts:\x1b[0m  createRemoveNodesFunction executing');
    console.log('\x1b[91mvisitPageHelpers.ts:\x1b[0m  selectors to remove:', selectorsToRemove);
    
    const results = await page.evaluate((selectors: string[]) => {
      if (!selectors || !Array.isArray(selectors)) {
        return { error: 'Selectors not found or not an array' };
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
          count: elements.length
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
    
    console.log('\x1b[91mvisitPageHelpers.ts:\x1b[0m  Results from browser:', JSON.stringify(results, null, 2));
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
      const codeLines = codeElement.textContent?.split("\n") || [];

      codeLines.forEach((line) => {
        // Remove line numbers and their associated elements
        const cleanLine = line
          .replace(/^\s*\d+\s?/, "") // Remove leading line numbers
          .replace(/^\s*\$\s/, "$  ") // Preserve command prompts but normalize spacing
          .replace(/^.*codelineno.*$/, "") // Remove line number anchor elements
          .trim();

        if (cleanLine && !cleanLine.startsWith("$ powershell")) {
          // Skip powershell commands
          codeText += cleanLine + "\n";
        }
      });

      // Create new clean elements
      const newPre = document.createElement("pre");
      const newCode = document.createElement("code");
      newCode.className = "language-bash";
      newCode.textContent = codeText.trim();
      newPre.appendChild(newCode);

      // Replace the old complex structure with our clean one
      if (codeBlock.parentNode) {
        codeBlock.parentNode.replaceChild(newPre, codeBlock);
      }
    });
  });
};

/**
 * function to confirm that onVisitPage is working and returl the page.url
 */
export const confirmOnVisitPage = async ({
  page,
  pushData: _pushData,
}: OnVisitPageParams): Promise<void> => {
  console.log('\x1b[91mvisitPageHelpers.ts:\x1b[0m  onVisitPage is working');
  console.log('\x1b[91mvisitPageHelpers.ts:\x1b[0m  page.url(): ', page.url());
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
