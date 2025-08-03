// For more information, see https://crawlee.dev/
import { Configuration, PlaywrightCrawler, downloadListOfUrls } from "crawlee";
import { readFile, writeFile } from "fs/promises";
import { glob } from "glob";
import path from "path";
import { Config, configSchema } from "./config.js";
import { minimatch } from "minimatch";
import { Page } from "playwright";
import { isWithinTokenLimit } from "gpt-tokenizer";
import { PathLike } from "fs";
import { Readability } from "@mozilla/readability";
import { JSDOM } from "jsdom";
import TurndownService from "turndown";
import { URL } from "url";

let pageCounter = 0;
let crawler: PlaywrightCrawler;

export function getPageHtml(page: Page, selector = "body") {
  return page.evaluate((selector) => {
    // Check if the selector is an XPath
    if (selector.startsWith("/")) {
      const elements = document.evaluate(
        selector,
        document,
        null,
        XPathResult.ANY_TYPE,
        null,
      );
      const result = elements.iterateNext();
      return result ? result.textContent || "" : "";
    } else {
      // Handle as a CSS selector
      const el = document.querySelector(selector) as HTMLElement | null;
      return el?.innerText || "";
    }
  }, selector);
}

export async function waitForXPath(page: Page, xpath: string, timeout: number) {
  await page.waitForFunction(
    (xpath) => {
      const elements = document.evaluate(
        xpath,
        document,
        null,
        XPathResult.ANY_TYPE,
        null,
      );
      return elements.iterateNext() !== null;
    },
    xpath,
    { timeout },
  );
}

export async function crawl(config: Config) {
  configSchema.parse(config);

  if (process.env.NO_CRAWL !== "true") {
    // Robustly ensure all required storage directories exist
    const fs = await import("fs/promises");
    const path = await import("path");
    const requiredDirs = [
      path.join("storage"),
      path.join("storage", "request_queues"),
      path.join("storage", "request_queues", "default"),
      path.join("storage", "datasets"),
      path.join("storage", "datasets", "default"),
    ];
    for (const dir of requiredDirs) {
      try {
        await fs.mkdir(dir, { recursive: true });
        // console.log(`[DEBUG] Ensured directory exists: ${dir}`);
      } catch (e) {
        console.error(`[DEBUG] Failed to ensure directory: ${dir}`, e);
      }
    }
    // Test: Try to create a dummy file to confirm write access in request_queues/default
    const dummyFilePath = path.join(
      "storage",
      "request_queues",
      "default",
      "dummy.txt",
    );
    try {
      await fs.writeFile(dummyFilePath, "test");
      // console.log(`[DEBUG] Successfully wrote dummy file: ${dummyFilePath}`);
      await fs.unlink(dummyFilePath);
    } catch (e) {
      console.error(`[DEBUG] Failed to write dummy file: ${dummyFilePath}`, e);
    }
    // PlaywrightCrawler crawls the web using a headless
    // browser controlled by the Playwright library.
    crawler = new PlaywrightCrawler(
      {
        // Use the requestHandler to process each of the crawled pages.
        async requestHandler({ request, page, enqueueLinks, log, pushData }) {
          const title = await page.title();
          pageCounter++;
          log.info(
            `Crawling: Page ${pageCounter} / ${config.maxPagesToCrawl} - URL: ${request.loadedUrl}...`,
          );

          // Use custom handling for XPath selector
          if (config.selector) {
            if (config.selector.startsWith("/")) {
              await waitForXPath(
                page,
                config.selector,
                config.waitForSelectorTimeout ?? 1000,
              );
            } else {
              await page.waitForSelector(config.selector, {
                timeout: config.waitForSelectorTimeout ?? 1000,
              });
            }
          }

          // Create a wrapper for pushData that matches the expected type
          const pushDataWrapper = async (data: any) => {
            await pushData(data);
          };

          // Execute onVisitPage BEFORE content capture
          if (config.onVisitPage) {
            await config.onVisitPage({ page, pushData: pushDataWrapper });
          }

          // Now capture the content AFTER any DOM modifications using the configured selector
          const html = await page.evaluate((sel: string) => {
            const el = document.querySelector(sel);
            return el ? el.outerHTML : document.body.outerHTML;
          }, config.selector ?? "body");
          // Use raw HTML of the selected element for full fidelity
          const dom = new JSDOM(html);
          const contentText = dom.window.document.body.innerText;
          const doc = dom.window.document;
          const articleTitle =
            doc.querySelector("h1")?.textContent?.trim() || title;

          // Save results using the article <h1> for title and raw HTML for content
          await pushDataWrapper({
            title: articleTitle,
            url: request.loadedUrl,
            content: html,
            textContent: contentText,
            excerpt: "",
            byline: "",
            siteName: "",
          });

          // Extract links from the current page
          // and add them to the crawling queue.
          await enqueueLinks({
            globs:
              typeof config.match === "string" ? [config.match] : config.match,
            exclude:
              typeof config.exclude === "string"
                ? [config.exclude]
                : (config.exclude ?? []),
            transformRequestFunction: (req) => {
              // Additional check for excluded query parameters
              if (config.exclude && Array.isArray(config.exclude)) {
                const url = new URL(req.url);
                for (const pattern of config.exclude) {
                  if (typeof pattern === "string" && pattern.includes("&do=")) {
                    const param = pattern.replace(/\*\*/g, "").trim();
                    if (url.search.includes(param)) {
                      return false; // Exclude this URL
                    }
                  }
                }
              }
              return req; // Include this URL
            },
          });
        },
        // Comment this option to scrape the full website.
        maxRequestsPerCrawl: config.maxPagesToCrawl,
        // Uncomment this option to see the browser window.
        // headless: false,
        preNavigationHooks: [
          // Abort requests for certain resource types and add cookies
          async (crawlingContext, _gotoOptions) => {
            const { request, page, log } = crawlingContext;
            // Add cookies to the page
            // Because the crawler has not yet navigated to the page, so the loadedUrl is always undefined. Use the request url instead.
            if (config.cookie) {
              const cookies = (
                Array.isArray(config.cookie) ? config.cookie : [config.cookie]
              ).map((cookie) => {
                return {
                  name: cookie.name,
                  value: cookie.value,
                  url: request.url,
                };
              });
              await page.context().addCookies(cookies);
            }
            const RESOURCE_EXCLUSTIONS = config.resourceExclusions ?? [];
            // If there are no resource exclusions, return
            if (RESOURCE_EXCLUSTIONS.length === 0) {
              return;
            }
            await page.route(
              `**\/*.{${RESOURCE_EXCLUSTIONS.join()}}`,
              (route) => route.abort("aborted"),
            );
            log.info(
              `Aborting requests for as this is a resource excluded route`,
            );
          },
        ],
      },
      new Configuration({
        purgeOnStart: true,
      }),
    );

    const isUrlASitemap = /\.xml$/i.test(config.url);
    if (isUrlASitemap) {
      // console.log(`[DEBUG] Detected sitemap XML URL: ${config.url}`);

      // Extract URLs from sitemap (remote or local)
      let listOfUrls: string[];
      if (/^https?:\/\//i.test(config.url)) {
        listOfUrls = await downloadListOfUrls({ url: config.url });
      } else {
        const xmlContent = await fs.readFile(config.url, "utf-8");
        const dom = new JSDOM(xmlContent, { contentType: "text/xml" });
        listOfUrls = Array.from(dom.window.document.getElementsByTagName("loc"))
          .map((el) => el.textContent || "")
          .filter(Boolean);
      }

      const includePatterns =
        typeof config.match === "string" ? [config.match] : config.match;
      const excludePatterns = config.exclude
        ? typeof config.exclude === "string"
          ? [config.exclude]
          : config.exclude
        : [];

      const filteredUrls = listOfUrls.filter(
        (u) =>
          includePatterns.some((pattern) => minimatch(u, pattern)) &&
          !excludePatterns.some((pattern) => minimatch(u, pattern)),
      );

      // console.log(`[DEBUG] Sitemap URLs extracted: ${listOfUrls.length}, filtered: ${filteredUrls.length}`);
      await crawler.run(filteredUrls);
      // console.log(`Sitemap: initial URLs=${filteredUrls.length}, total pages crawled=${pageCounter}`);
      return;
    }

    // Non-sitemap: run crawler on the single URL
    await crawler.run([config.url]);
  }
}

interface ToCItem {
  level: number;
  text: string;
  slug: string;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function convertToMarkdown(
  data: Record<string, any>,
  baseUrl: string,
  allUrls: string[],
  includeExtras: boolean,
): { markdown: string; tocItems: ToCItem[] } {
  const turndownService = new TurndownService({
    headingStyle: "atx",
    codeBlockStyle: "fenced",
    emDelimiter: "*",
  });

  // Custom rule to ensure list items start on a new line
  turndownService.addRule("listItems", {
    filter: "li",
    replacement: function (content) {
      content = content
        .trim()
        .replace(/^\n+/, "") // remove leading newlines
        .replace(/\n+$/, "\n") // replace trailing newlines with just a single one
        .replace(/\n/gm, "\n    "); // indent
      return `\n* ${content}\n`;
    },
  });

  // Custom rule to convert links to local if they exist in allUrls
  turndownService.addRule("links", {
    filter: "a",
    replacement: function (content, node) {
      const element = node as HTMLElement;
      const href = element.getAttribute("href");

      // Clean the content for use as link text: remove leading markdown and collapse whitespace
      const linkText = content
        .replace(/^#+\s*/, "")
        .replace(/\s+/g, " ")
        .trim();

      if (href && allUrls.includes(href)) {
        // Use the original, uncleaned content for slugification
        const localSlug = slugify(content);
        return includeExtras
          ? `[${linkText}](#${localSlug})`
          : `[${linkText}](${href})`;
      }
      return `[${linkText}](${href})`;
    },
  });

  // Add custom rule to convert HTML tables to Markdown tables
  turndownService.addRule("tables", {
    filter: "table",
    replacement: function (_content, node) {
      const headers: string[] = [];
      let markdown = "";

      // Extract table headers
      const headerRow = node.querySelector("tr");
      if (headerRow) {
        headerRow.querySelectorAll("th").forEach((th) => {
          headers.push(
            turndownService.turndown(th.innerHTML.trim()).replace(/\n+/g, " "),
          );
        });
        markdown += `| ${headers.join(" | ")} |\n`;
        markdown += `| ${headers.map(() => "---").join(" | ")} |\n`;
      }

      // Extract table rows
      node.querySelectorAll("tr").forEach((tr) => {
        const cells: string[] = [];
        tr.querySelectorAll("td").forEach((td) => {
          cells.push(
            turndownService.turndown(td.innerHTML.trim()).replace(/\n+/g, " "),
          );
        });
        if (cells.length > 0) {
          markdown += `| ${cells.join(" | ")} |\n`;
        }
      });

      return `\n${markdown}\n`;
    },
  });

  const domain = new URL(baseUrl).hostname;
  let markdown = "";
  const tocItems: ToCItem[] = [];

  if (data.isFirstPage && includeExtras) {
    markdown += `# ${domain}\n\n`;
  }

  const slug = slugify(data.title);
  if (includeExtras) {
    tocItems.push({ level: 2, text: data.title, slug });
  }
  markdown += `## ${data.title}${includeExtras ? ` {#${slug}}` : ""}\n\n`;
  if (includeExtras) {
    markdown += `[Back to Top](#table-of-contents)\n\n`;
  }
  markdown += `URL: ${data.url}\n\n`;

  if (data.byline) {
    markdown += `Author: ${data.byline}\n\n`;
  }

  // if (data.siteName) {
  //   markdown += `Site: ${data.siteName}\n\n`;
  // }

  // Create a JSDOM instance to parse the HTML content
  const dom = new JSDOM(data.content);
  let content = turndownService.turndown(dom.window.document.body);

  // Collect headers and add "Back to Top" links if includeExtras is true
  content = content.replace(/^(#{2,6}) (.+)$/gm, (_, hashes, title) => {
    const level = hashes.length;
    const slug = slugify(title);
    if (includeExtras) {
      tocItems.push({ level, text: title, slug });
      return `${hashes} ${title} {#${slug}}\n\n[Back to Top](#table-of-contents)\n`;
    }
    return `${hashes} ${title}\n`;
  });

  // [Removed automatic heading level shift to preserve original heading levels]

  // [Removed removal of headings beyond level 6 to retain all original headings]

  markdown += `${content}\n\n`;
  markdown += "---\n\n";

  return { markdown, tocItems };
}

function generateToC(tocItems: ToCItem[]): string {
  let toc = "## Table of Contents {#table-of-contents}\n\n";

  tocItems.forEach((item) => {
    const indent = "  ".repeat(item.level - 2);
    toc += `${indent}- [${item.text}](#${item.slug})\n`;
  });

  return toc + "\n";
}

/**
 * Combines all stored JSON dataset files into the final output.
 * Files are discovered recursively under storage/datasets/default,
 * then sorted by folder and filename in alphanumeric order.
 */
export async function write(config: Config) {
  let nextFileNameString: PathLike = "";
  // Discover all JSON files recursively and sort them by folder/subfolder alphanumerically
  const jsonFilesRaw = await glob("storage/datasets/default/**/*.json", {
    absolute: true,
  });
  const jsonFiles = jsonFilesRaw
    .map((filePath) => ({
      abs: filePath,
      relSegments: path
        .relative("storage/datasets/default", filePath)
        .split(path.sep),
    }))
    .sort((a, b) => {
      const segA = a.relSegments;
      const segB = b.relSegments;
      const len = Math.max(segA.length, segB.length);
      for (let i = 0; i < len; i++) {
        const partA = segA[i] || "";
        const partB = segB[i] || "";
        if (partA < partB) return -1;
        if (partA > partB) return 1;
      }
      return 0;
    })
    .map((item) => item.abs);

  console.log(`Found ${jsonFiles.length} files to combine...`);

  let currentResults: Record<string, any>[] = [];
  let currentSize: number = 0;
  let fileCounter: number = 1;
  const maxBytes: number = config.maxFileSize
    ? config.maxFileSize * 1024 * 1024
    : Infinity;

  const getStringByteSize = (str: string): number =>
    Buffer.byteLength(str, "utf-8");

  const nextFileName = (): string => {
    const baseName = config.outputFileName.replace(/\.[^/.]+$/, ""); // Remove any existing extension
    const extension = config.outputFileFormat === "json" ? "json" : "md";
    if (fileCounter > 1) {
      return `${baseName}-${fileCounter}.${extension}`;
    }
    return `${baseName}.${extension}`;
  };

  const writeBatchToFile = async (): Promise<void> => {
    nextFileNameString = nextFileName();
    if (
      config.outputFileFormat === "markdown" ||
      config.outputFileFormat === "human_readable_markdown"
    ) {
      const reversedResults = currentResults.reverse();
      let allToCItems: ToCItem[] = [];
      let markdownContent = "";

      // Collect all URLs
      const allUrls = reversedResults.map((data) => data.url);

      const includeExtras =
        config.outputFileFormat === "human_readable_markdown";

      reversedResults.forEach((data, index) => {
        const { markdown, tocItems } = convertToMarkdown(
          { ...data, isFirstPage: index === 0 },
          config.url,
          allUrls,
          includeExtras,
        );
        markdownContent += markdown;
        allToCItems = allToCItems.concat(tocItems);
      });

      if (includeExtras) {
        const toc = generateToC(allToCItems);

        // Insert ToC after the primary header
        const primaryHeaderIndex = markdownContent.indexOf("\n\n");
        if (primaryHeaderIndex !== -1) {
          markdownContent =
            markdownContent.slice(0, primaryHeaderIndex + 2) +
            toc +
            markdownContent.slice(primaryHeaderIndex + 2);
        } else {
          markdownContent = toc + markdownContent;
        }
      }

      // Apply onProcessMarkdown if provided
      if (config.onProcessMarkdown) {
        markdownContent = config.onProcessMarkdown(markdownContent);
      }

      await writeFile(nextFileNameString, markdownContent);
    } else {
      // For JSON, we'll also reverse the order
      await writeFile(
        nextFileNameString,
        JSON.stringify(currentResults.reverse(), null, 2),
      );
    }
    // console.log(`Wrote ${currentResults.length} items to ${nextFileNameString}`,);
    currentResults = [];
    currentSize = 0;
    fileCounter++;
  };

  let estimatedTokens: number = 0;

  const addContentOrSplit = async (
    data: Record<string, any>,
  ): Promise<void> => {
    const contentString: string = JSON.stringify(data);
    const tokenCount: number | false = isWithinTokenLimit(
      contentString,
      config.maxTokens || Infinity,
    );

    if (typeof tokenCount === "number") {
      if (estimatedTokens + tokenCount > config.maxTokens!) {
        // Only write the batch if it's not empty (something to write)
        if (currentResults.length > 0) {
          await writeBatchToFile();
        }
        // Since the addition of a single item exceeded the token limit, halve it.
        estimatedTokens = Math.floor(tokenCount / 2);
        currentResults.push(data);
      } else {
        currentResults.push(data);
        estimatedTokens += tokenCount;
      }
    }

    currentSize += getStringByteSize(contentString);
    if (currentSize > maxBytes) {
      await writeBatchToFile();
    }
  };

  // Iterate over each JSON file and process its contents.
  for (const file of jsonFiles) {
    const fileContent = await readFile(file, "utf-8");
    const data: Record<string, any> = JSON.parse(fileContent);
    await addContentOrSplit(data);
  }

  // Check if any remaining data needs to be written to a file.
  if (currentResults.length > 0) {
    await writeBatchToFile();
  }

  return nextFileNameString;
}

class GPTCrawlerCore {
  config: Config;

  constructor(config: Config) {
    this.config = config;
  }

  async crawl() {
    await crawl(this.config);
  }

  async write(): Promise<PathLike> {
    // we need to wait for the file path as the path can change
    return new Promise((resolve, reject) => {
      write(this.config)
        .then((outputFilePath) => {
          resolve(outputFilePath);
        })
        .catch(reject);
    });
  }
}

export default GPTCrawlerCore;
