import fs from "fs";
import path from "path";
import { JSDOM } from "jsdom";

// --- Configuration ---
// Set the relative path to your saved HTML file here
const filePath =
  "D:/projects/gpt-crawler/save_output/initial_page_content.html";
// Set the desired output JSON file name
const outputJsonFile = "extracted_code.json";
// --- End Configuration ---

/**
 * Extracts filenames and source code from tabbed code viewers within an HTML file.
 * Assumes a structure where tab triggers (buttons) contain filenames and control
 * corresponding tab panels (divs) which contain the code within <pre><code> blocks.
 *
 * @param htmlContent The HTML content as a string.
 * @returns A record mapping filenames to their source code, or null if an error occurs.
 */
function extractCodeFromTabs(
  htmlContent: string,
): Record<string, string> | null {
  try {
    const dom = new JSDOM(htmlContent);
    const document = dom.window.document;
    const extractedCode: Record<string, string> = {};

    // Select all tab trigger buttons within a tablist container
    // This selector might need adjustment based on the specific website structure
    const tabTriggers = document.querySelectorAll(
      'div[role="tablist"] button[role="tab"]',
    );

    if (tabTriggers.length === 0) {
      console.warn(
        "No tab triggers found. Check the selectors or HTML structure.",
      );
      return {}; // Return empty object if no tabs found
    }

    console.log(`Found ${tabTriggers.length} potential file tabs.`);

    tabTriggers.forEach((triggerButton) => {
      const filename = triggerButton.textContent?.trim();
      const controlsId = triggerButton.getAttribute("aria-controls");

      if (!filename) {
        console.warn(
          "Found a tab trigger button without text content (filename). Skipping.",
        );
        return; // Skip buttons without text
      }

      if (!controlsId) {
        console.warn(
          `Tab trigger "${filename}" is missing the 'aria-controls' attribute. Skipping.`,
        );
        return; // Skip buttons without the control link
      }

      // Find the corresponding content panel using the ID from aria-controls
      const contentPanel = document.querySelector(
        `div[role="tabpanel"]#${controlsId}`,
      );

      if (!contentPanel) {
        console.warn(
          `Could not find content panel for tab "${filename}" with ID "${controlsId}". Skipping.`,
        );
        return; // Skip if content panel not found
      }

      // Find the code block within the panel (look inside <pre> then <code>, or just <pre>)
      const codeElement =
        contentPanel.querySelector("pre code") ||
        contentPanel.querySelector("pre");

      if (!codeElement) {
        console.warn(
          `Could not find code block (<pre><code> or <pre>) within panel for tab "${filename}". Skipping.`,
        );
        return; // Skip if code block not found
      }

      // Extract text content - textContent within <pre> usually preserves formatting
      const sourceCode = codeElement.textContent;

      if (sourceCode !== null && sourceCode.trim() !== "") {
        extractedCode[filename] = sourceCode;
        console.log(`Successfully extracted code for: ${filename}`);
      } else {
        console.warn(
          `Extracted empty or null source code for: ${filename}. Skipping.`,
        );
      }
    });

    return extractedCode;
  } catch (error) {
    console.error("Error parsing HTML content:", error);
    return null;
  }
}

/**
 * Main function to read the HTML file, extract code, and write to JSON.
 */
async function main() {
  const absoluteFilePath = path.resolve(filePath);
  console.log(`Attempting to read HTML file: ${absoluteFilePath}`);

  if (!fs.existsSync(absoluteFilePath)) {
    console.error(`Error: Input HTML file not found at ${absoluteFilePath}`);
    process.exit(1);
  }

  let htmlContent: string;
  try {
    htmlContent = fs.readFileSync(absoluteFilePath, "utf-8");
    console.log("Successfully read HTML file.");
  } catch (error) {
    console.error(`Error reading file ${absoluteFilePath}:`, error);
    process.exit(1);
  }

  console.log("Extracting code snippets...");
  const codeData = extractCodeFromTabs(htmlContent);

  if (codeData === null) {
    console.error("Failed to extract code data due to parsing errors.");
    process.exit(1);
  }

  if (Object.keys(codeData).length === 0) {
    console.log("No code snippets were extracted. Writing empty JSON file.");
  } else {
    console.log(`Extracted ${Object.keys(codeData).length} code snippets.`);
  }

  const absoluteOutputPath = path.resolve(outputJsonFile);
  console.log(`Attempting to write JSON output to: ${absoluteOutputPath}`);

  try {
    // Use JSON.stringify with indentation for readability
    fs.writeFileSync(
      absoluteOutputPath,
      JSON.stringify(codeData, null, 2),
      "utf-8",
    );
    console.log(`Successfully wrote extracted code to ${absoluteOutputPath}`);
  } catch (error) {
    console.error(`Error writing JSON file ${absoluteOutputPath}:`, error);
    process.exit(1);
  }
}

// Run the main function
main().catch((error) => {
  console.error("An unexpected error occurred:", error);
  process.exit(1);
});
