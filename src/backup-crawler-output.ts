import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { defaultConfig } from "../scrape-config.js";

async function backupCrawlerOutput() {
  try {
    // Get the domain from the URL and topic from config
    const url = new URL(defaultConfig.url);
    const domainName = url.hostname;

    // Create the backup directory path - use topic if provided, otherwise use domain name
    const backupDir = path.join("crawled", defaultConfig.topic || domainName);

    // Ensure the backup directory exists
    await fs.mkdir(backupDir, { recursive: true });

    // Get the source files
    const outputFile = defaultConfig.outputFileName;
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

    // Copy the output file
    const outputDestPath = path.join(backupDir, outputFile);
    const uniqueOutputPath = await getUniqueFilename(outputDestPath);
    await fs.copyFile(outputFile, uniqueOutputPath);

    // Copy the config file with domain name and output format prefix
    const configDestPath = path.join(backupDir, configFile);
    const uniqueConfigPath = await getUniqueFilename(
      configDestPath,
      `${domainName}-${defaultConfig.outputFileFormat}`,
    );
    await fs.copyFile(configFile, uniqueConfigPath);

    console.log(`Backup completed successfully:`);
    console.log(
      `Directory: ${defaultConfig.topic ? "Topic: " + defaultConfig.topic : "Domain: " + domainName}`,
    );
    console.log(`Output file: ${uniqueOutputPath}`);
    console.log(`Config file: ${uniqueConfigPath}`);
  } catch (error) {
    console.error("Error during backup:", error);
    process.exit(1);
  }
}

backupCrawlerOutput();
