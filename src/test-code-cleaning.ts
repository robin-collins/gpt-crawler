import { chromium } from "playwright";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

// Logic adapted from cleanNextraCodeBlocks - designed to be run in page.evaluate()
const cleaningLogic = () => {
  // Select <pre> elements using the class identified in reactflow examples
  const codeBlocks = document.querySelectorAll("pre.not-prose");
  // Define the type for the results array
  const results: {
    original: string;
    cleanedHtml: string | null;
    text: string;
  }[] = [];

  // Use console.log inside evaluate for debugging in the browser's context (visible via page.on('console'))
  console.log(`[Browser] Found ${codeBlocks.length} 'pre.not-prose' elements.`);

  codeBlocks.forEach((codeBlock, index) => {
    if (!(codeBlock instanceof HTMLElement)) return;

    // Find the specific <code class="nextra-code"> element inside the <pre>
    const codeElement = codeBlock.querySelector("code.nextra-code");
    if (!codeElement) {
      console.log(
        `[Browser] Skipping pre block ${index}: code.nextra-code child not found.`,
      );
      return; // Skip pre blocks that don't contain the target code element
    }
    console.log(
      `[Browser] Processing pre block ${index} containing code.nextra-code.`,
    );

    // Get all direct child spans within the code element - these often represent lines in Nextra/Shiki highlighting
    const lineSpans =
      codeElement.querySelectorAll<HTMLElement>(":scope > span");
    let extractedCodeText = "";
    console.log(
      `[Browser] Found ${lineSpans.length} direct child spans (lines) in code block ${index}.`,
    );

    lineSpans.forEach((lineSpan, lineIndex) => {
      // textContent should retrieve text from all descendants, handling nested spans
      const lineText = lineSpan.textContent || "";
      console.log(`[Browser] Line ${lineIndex} text content: "${lineText}"`);
      extractedCodeText += lineText + "\n"; // Add newline after each line span's content
    });

    const originalHtml = codeBlock.outerHTML; // For debugging comparison
    const cleanedText = extractedCodeText.trim(); // Trim leading/trailing whitespace/newlines

    // --- Create the new, clean structure ---
    const newPre = document.createElement("pre");
    const newCode = document.createElement("code");

    // Attempt to preserve the language class if present (e.g., language-typescript)
    const langClass =
      Array.from(codeElement.classList).find((cls) =>
        cls.startsWith("language-"),
      ) || "language-typescript"; // Default to bash or ts?
    newCode.className = langClass;
    newCode.textContent = cleanedText;
    newPre.appendChild(newCode);

    // --- Replace the old block with the new one ---
    if (codeBlock.parentNode) {
      codeBlock.parentNode.replaceChild(newPre, codeBlock);
      // Store the outerHTML of the *newly created* pre block
      results.push({
        original: originalHtml,
        cleanedHtml: newPre.outerHTML,
        text: cleanedText,
      });
      console.log(
        `[Browser] Replaced pre block ${index}. Cleaned text length: ${cleanedText.length}`,
      );
    } else {
      console.log(
        `[Browser] Could not replace pre block ${index}: no parent node.`,
      );
      // Store text even if replacement failed
      results.push({
        original: originalHtml,
        cleanedHtml: null,
        text: cleanedText,
      });
    }
  });

  // Return data back to the Node.js context
  return {
    totalPreBlocksFound: codeBlocks.length,
    processedBlocks: results.length,
    // Send back the outerHTML of the *successfully replaced* blocks
    cleanedPreHtmls: results
      .map((r) => r.cleanedHtml)
      .filter((html) => html !== null),
    extractedTexts: results.map((r) => r.text), // Also return extracted text for debugging
  };
};

// --- Main execution logic ---
(async () => {
  let browser;
  try {
    console.log("Launching browser...");
    browser = await chromium.launch();
    const page = await browser.newPage();
    console.log("Browser launched, new page created.");

    // Forward browser console logs to Node console
    page.on("console", (msg) => console.log(`BROWSER LOG: ${msg.text()}`));

    // --- Calculate __dirname for ESM ---
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    // ---------------------------------

    // Construct the absolute path to the HTML file
    // Assumes script is run from workspace root or uses a relative path correctly managed by the execution environment
    const filePath = path.resolve(
      __dirname,
      "..",
      "example_html",
      "reactflow2.html",
    );
    const fileUrl = `file://${filePath}`;

    console.log(`Attempting to load file: ${fileUrl}`);

    // Verify file exists before attempting to load
    if (!fs.existsSync(filePath)) {
      console.error(`\n---> ERROR: File not found at path: ${filePath}`);
      console.error(
        `---> Please ensure 'example_html/reactflow2.html' exists relative to the project root.`,
      );
      if (browser) await browser.close();
      process.exit(1); // Exit if file doesn't exist
    }
    console.log(`File exists. Navigating page to ${fileUrl}...`);

    await page.goto(fileUrl, { waitUntil: "domcontentloaded" });
    console.log("Page navigation successful.");

    // Execute the cleaning logic within the page context
    console.log("Executing cleaning logic in browser context...");
    const cleaningResult = await page.evaluate(cleaningLogic);
    console.log("Cleaning logic execution finished.");

    // --- Output Results ---
    console.log("\n--- Cleaning Execution Summary ---");
    console.log(
      `Total '<pre class="not-prose">' blocks found on page: ${cleaningResult.totalPreBlocksFound}`,
    );
    console.log(
      `Blocks containing '<code class="nextra-code">' processed: ${cleaningResult.processedBlocks}`,
    );
    console.log(
      `Blocks successfully replaced with clean HTML: ${cleaningResult.cleanedPreHtmls.length}`,
    );

    if (
      cleaningResult.cleanedPreHtmls &&
      cleaningResult.cleanedPreHtmls.length > 0
    ) {
      console.log("\n--- Successfully Cleaned <pre> Blocks (HTML) ---");
      cleaningResult.cleanedPreHtmls.forEach((snippet, i) => {
        console.log(`\n--- Cleaned Block ${i + 1} ---`);
        console.log(snippet);
        console.log("-------------------------");
      });
    } else {
      console.log(
        "\n--- No code blocks were successfully cleaned and replaced. ---",
      );
      // Optionally log extracted text even if replacement failed
      if (cleaningResult.extractedTexts.length > 0) {
        console.log("\n--- Extracted Text (even if replacement failed) ---");
        cleaningResult.extractedTexts.forEach((text, i) => {
          console.log(`\n--- Extracted Text ${i + 1} ---`);
          console.log(text);
          console.log("-------------------------");
        });
      }
    }
  } catch (error) {
    console.error("\n--- ERROR DURING EXECUTION ---");
    console.error(error);
  } finally {
    if (browser) {
      await browser.close();
      console.log("\nBrowser closed.");
    }
  }
})();
