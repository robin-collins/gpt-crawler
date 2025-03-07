import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { defaultConfig } from "../scrape-config.js";
import { glob } from "glob";

async function backupCrawlerOutput() {
  try {
    // Get the domain from the URL and topic from config
    const url = new URL(defaultConfig.url);
    const domainName = url.hostname;

    // Create the backup directory path - use topic if provided, otherwise use domain name
    const backupDir = path.join("crawled", defaultConfig.topic || domainName);

    // Ensure the backup directory exists
    await fs.mkdir(backupDir, { recursive: true });

    // Get the base output filename without extension
    const outputFileBase = defaultConfig.outputFileName.replace(
      /\.[^/.]+$/,
      "",
    );
    const outputFileExt = path.extname(defaultConfig.outputFileName);

    // Find all output files matching the pattern (e.g., output.json, output-1.json, etc.)
    const outputFiles = await glob(`${outputFileBase}*${outputFileExt}`);
    const configFile = "scrape-config.ts";

    // Function to generate unique filename if needed
    async function getUniqueFilename(
      filepath: string,
      prefix?: string,
    ): Promise<string> {
      const dir = path.dirname(filepath);
      const ext = path.extname(filepath);
      const basename = path.basename(filepath, ext);
      const basenamePrefixed = prefix ? `${prefix}_${basename}` : basename;
      let counter = 0;
      let uniquePath = path.join(dir, `${basenamePrefixed}${ext}`);

      while (true) {
        try {
          await fs.access(uniquePath);
          counter++;
          uniquePath = path.join(dir, `${basenamePrefixed}_${counter}${ext}`);
        } catch {
          return uniquePath;
        }
      }
    }

    // Copy each output file
    for (const outputFile of outputFiles) {
      const outputDestPath = path.join(backupDir, path.basename(outputFile));
      const uniqueOutputPath = await getUniqueFilename(outputDestPath);
      await fs.copyFile(outputFile, uniqueOutputPath);
      console.log(`Backed up output file: ${uniqueOutputPath}`);
    }

    // Copy the config file with output filename as prefix
    const outputFileName = defaultConfig.outputFileName;
    const configDestPath = path.join(backupDir, `${outputFileName}_config.ts`);
    const uniqueConfigPath = await getUniqueFilename(configDestPath);
    await fs.copyFile(configFile, uniqueConfigPath);

    console.log(`\nBackup completed successfully:`);
    console.log(
      `Directory: ${defaultConfig.topic ? "Topic: " + defaultConfig.topic : "Domain: " + domainName}`,
    );
    console.log(`Config file: ${uniqueConfigPath}`);

    // Delete the original output files after successful backup
    console.log("\nCleaning up output files...");
    for (const outputFile of outputFiles) {
      await fs.unlink(outputFile);
      console.log(`Deleted: ${outputFile}`);
    }
    console.log("Cleanup completed.");
  } catch (error) {
    console.error("Error during backup:", error);
    process.exit(1);
  }
}

backupCrawlerOutput();
