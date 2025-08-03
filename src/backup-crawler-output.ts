import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import crypto from "crypto";
import { defaultConfig } from "../scrape-config.js";

// Helper function to calculate SHA-256 hash of a file
async function calculateFileHash(filepath: string): Promise<string> {
  const fileBuffer = await fs.readFile(filepath);
  const hashSum = crypto.createHash("sha256");
  hashSum.update(fileBuffer);
  return hashSum.digest("hex");
}

// {primary.domain.url}-{outputFileName}-{outputFileFormat}{possibleUniqueIdentifier-Number}.ts

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
    const outputFile = defaultConfig.outputFileName.trim();
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

    // --- Output File Handling ---
    const outputDestPath = path.join(backupDir, outputFile);
    const uniqueOutputPath = await getUniqueFilename(outputDestPath);
    await fs.copyFile(outputFile, uniqueOutputPath);

    // Verify output file hash
    const sourceOutputHash = await calculateFileHash(outputFile);
    const destOutputHash = await calculateFileHash(uniqueOutputPath);

    if (sourceOutputHash !== destOutputHash) {
      console.error(
        `Error: Hash mismatch for output file. Source (${outputFile}) and destination (${uniqueOutputPath}) are different.`,
      );
      // Optionally delete the potentially corrupted destination file
      // await fs.unlink(uniqueOutputPath);
      process.exit(1);
    }
// console.log(`Output file hash verified: ${sourceOutputHash}`);

    // Delete the original output file after successful verification
    await fs.unlink(outputFile);
// console.log(`Original output file deleted: ${outputFile}`);

    // --- Config File Handling ---
    // Generate config filename based on domain, outputFileName, and outputFileFormat
    const baseConfigName = `${domainName}-${defaultConfig.outputFileName.trim()}-${defaultConfig.outputFileFormat.trim()}`;
    let configFilename = `${baseConfigName}.ts`;
    let uniqueConfigPath = path.join(backupDir, configFilename);
    let counter = 1;
    while (true) {
      try {
        await fs.access(uniqueConfigPath);
        configFilename = `${baseConfigName}-${counter}.ts`;
        uniqueConfigPath = path.join(backupDir, configFilename);
        counter++;
      } catch {
        break;
      }
    }
    await fs.copyFile(configFile, uniqueConfigPath);

    // Verify config file hash
    const sourceConfigHash = await calculateFileHash(configFile);
    const destConfigHash = await calculateFileHash(uniqueConfigPath);

    if (sourceConfigHash !== destConfigHash) {
      console.error(
        `Error: Hash mismatch for config file. Source (${configFile}) and destination (${uniqueConfigPath}) are different.`,
      );
      // Optionally delete the potentially corrupted destination file
      // await fs.unlink(uniqueConfigPath);
      process.exit(1);
    }
// console.log(`Config file hash verified: ${sourceConfigHash}`);

    // console.log(`Backup completed successfully:`);
    // console.log(`Directory: ${defaultConfig.topic ? "Topic: " + defaultConfig.topic : "Domain: " + domainName}`, );
// console.log(`Backed up output file: ${uniqueOutputPath}`);
// console.log(`Backed up config file: ${uniqueConfigPath}`);
  } catch (error) {
    console.error("Error during backup:", error);
    process.exit(1);
  }
}

backupCrawlerOutput();
