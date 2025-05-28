import { chromium, Page } from "playwright";
import path from "path";
import fs from "fs/promises"; // Use promises for async operations
import {
  cleanNextraCodeBlocks,
  OnVisitPageParams,
} from "./visitPageHelpers.js"; // Assuming ESM, use .js extension if needed by your config

// --- Configuration ---
// ! SET THE URL TO TEST HERE !
const URL_TO_TEST =
  "https://reactflow.dev/learn/advanced-use/devtools-and-debugging";
// ! SET THE SELECTOR TO WAIT FOR HERE !
const SELECTOR_TO_WAIT_FOR = "body > div > article"; // Example: wait for the body tag, change as needed
const INITIAL_HTML_OUTPUT_PATH = path.resolve(
  "save_output",
  "initial_page_content.html",
);
const CLEANED_HTML_OUTPUT_PATH = path.resolve(
  "save_output",
  "cleaned_page_content.html",
);
const SCREENSHOT_OUTPUT_PATH = path.resolve(
  "save_output",
  "full_page_screenshot.png",
);
// ---------------------

// Dummy pushData function as required by OnVisitPageParams type, though cleanNextraCodeBlocks doesn't use it
const dummyPushData = async (data: any) => {
  console.log("[DummyPushData] Received data (not used):", typeof data);
  // In a real scenario, this might send data somewhere
  await Promise.resolve(); // Simulate async operation
};

// --- Main execution logic ---
(async () => {
  let browser;
  try {
    console.log(`Launching browser and navigating to: ${URL_TO_TEST}`);
    browser = await chromium.launch();
    const page = await browser.newPage();

    // Forward browser console logs to Node console for debugging cleanNextraCodeBlocks
    page.on("console", (msg) => console.log(`BROWSER LOG: ${msg.text()}`));

    await page.goto(URL_TO_TEST, { waitUntil: "domcontentloaded" });
    console.log("Page navigation successful.");

    // --- Wait for specific selector ---
    console.log(`Waiting for selector "${SELECTOR_TO_WAIT_FOR}" to appear...`);
    try {
      await page.waitForSelector(SELECTOR_TO_WAIT_FOR, { timeout: 30000 }); // 30 second timeout
      console.log(`Selector "${SELECTOR_TO_WAIT_FOR}" found.`);
    } catch (error) {
      console.error(
        `Error: Selector "${SELECTOR_TO_WAIT_FOR}" not found within timeout.`,
      );
      console.error("Exiting script.");
      if (browser) await browser.close();
      process.exit(1); // Exit if selector not found
    }

    // --- Take Full Page Screenshot ---
    console.log(
      `Taking full page screenshot and saving to: ${SCREENSHOT_OUTPUT_PATH}`,
    );
    await page.screenshot({ path: SCREENSHOT_OUTPUT_PATH, fullPage: true });
    console.log("Screenshot saved.");

    // --- Save Initial HTML ---
    console.log(`Saving initial HTML content to: ${INITIAL_HTML_OUTPUT_PATH}`);
    const initialContent = await page.content();
    await fs.writeFile(INITIAL_HTML_OUTPUT_PATH, initialContent, "utf-8");
    console.log("Initial HTML saved.");

    // --- Run Cleaning Function ---
    console.log("Running cleanNextraCodeBlocks function...");
    const params: OnVisitPageParams = { page, pushData: dummyPushData };
    await cleanNextraCodeBlocks(params);
    console.log("cleanNextraCodeBlocks function finished.");

    // --- Save Cleaned HTML ---
    console.log(`Saving cleaned HTML content to: ${CLEANED_HTML_OUTPUT_PATH}`);
    const cleanedContent = await page.content(); // Get content *after* cleaning
    await fs.writeFile(CLEANED_HTML_OUTPUT_PATH, cleanedContent, "utf-8");
    console.log("Cleaned HTML saved.");

    console.log("Script finished successfully.");
    console.log(`Initial HTML saved to: ${INITIAL_HTML_OUTPUT_PATH}`);
    console.log(`Cleaned HTML saved to: ${CLEANED_HTML_OUTPUT_PATH}`);
    console.log(`Screenshot saved to: ${SCREENSHOT_OUTPUT_PATH}`);
  } catch (error) {
    console.error("--- ERROR DURING EXECUTION ---");
    console.error(error);
    process.exitCode = 1; // Indicate failure
  } finally {
    if (browser) {
      await browser.close();
      console.log("Browser closed.");
    }
  }
})();
