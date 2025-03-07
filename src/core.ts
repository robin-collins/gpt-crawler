// For more information, see https://crawlee.dev/
import { Configuration, PlaywrightCrawler, downloadListOfUrls } from "crawlee";
import { readFile, writeFile } from "fs/promises";
import { glob } from "glob";
import { Config, configSchema } from "./config.js";
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
      let result = elements.iterateNext();
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

function minimalisticTextContent(html: string): string {
  const dom = new JSDOM(html);
  const document = dom.window.document;

  // Recursively remove attributes from elements, except inside <scg> or <svg> tags.
  const cleanElement = (element: Element) => {
    if (
      element.tagName.toLowerCase() === "scg" ||
      element.tagName.toLowerCase() === "svg"
    ) {
      // Skip cleaning this element and its children to preserve image/graphics data.
      return;
    }
    for (const attr of Array.from(element.attributes)) {
      element.removeAttribute(attr.name);
    }
    // Recursively process child elements.
    for (const child of Array.from(element.children)) {
      cleanElement(child);
    }
  };

  cleanElement(document.body);

  // Return the modified innerHTML which maintains basic tags but without extra attributes.
  return document.body.innerHTML;
}

function preserveCodeBlockLanguages(html: string): {
  html: string;
  languageMap: Map<string, string>;
} {
  const dom = new JSDOM(html);
  const document = dom.window.document;
  const languageMap = new Map<string, string>();

  // Find all pre and code elements with language classes
  const codeBlocks = document.querySelectorAll("pre, code");
  let counter = 0;

  codeBlocks.forEach((element) => {
    // Cast to Element type from JSDOM
    const el = element as unknown as Element;

    const classAttr = el.getAttribute("class");
    if (classAttr && classAttr.includes("language-")) {
      const match = classAttr.match(/language-(\w+)/);
      if (match && match[1]) {
        // Create a unique ID for this code block
        const id = `code-block-${counter++}`;
        // Store the language
        languageMap.set(id, match[1]);
        // Add a data attribute that Readability won't strip
        el.setAttribute("data-code-language-id", id);
      }
    }
  });

  return {
    html: dom.serialize(),
    languageMap,
  };
}

export async function crawl(config: Config) {
  configSchema.parse(config);

  if (process.env.NO_CRAWL !== "true") {
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

          // Use custom handling for XPath or CSS selectors
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

          // Apply the custom hook BEFORE Readability processes the page
          if (config.onVisitPage) {
            await config.onVisitPage({ page, pushData: pushDataWrapper });
          }

          // Now fetch the page content and process it with Readability
          const html = await page.content();

          // Preserve code block languages and important structures before Readability processes the page
          const { html: processedHtml, languageMap } =
            preserveCodeBlockLanguages(html);

          // Create a DOM to work with
          const dom = new JSDOM(processedHtml, { url: request.loadedUrl });

          // Store the original HTML before Readability potentially modifies it
          const originalHtml = dom.window.document.body.innerHTML;

          // Preserve tables and other important structures before Readability
          const tables = Array.from(
            dom.window.document.querySelectorAll("table"),
          );
          const tableContents: string[] = [];

          // Store table HTML before Readability potentially modifies them
          tables.forEach((table, index) => {
            tableContents.push(table.outerHTML);
            // Add a placeholder that we can find later
            table.outerHTML = `<div class="preserved-table-${index}"></div>`;
          });

          // Also preserve code blocks
          const codeBlocks = Array.from(
            dom.window.document.querySelectorAll("pre, code"),
          );
          const codeContents: string[] = [];

          codeBlocks.forEach((block, index) => {
            codeContents.push(block.outerHTML);
            // Add a placeholder that we can find later
            block.outerHTML = `<div class="preserved-code-${index}"></div>`;
          });

          // Preserve important headings and sections
          const headings = Array.from(
            dom.window.document.querySelectorAll("h1, h2, h3, h4, h5, h6"),
          );
          const headingContents: string[] = [];

          headings.forEach((heading, index) => {
            headingContents.push(heading.outerHTML);
            // Add a placeholder that we can find later
            heading.outerHTML = `<div class="preserved-heading-${index}"></div>`;
          });

          // Run Readability on the modified DOM
          const reader = new Readability(dom.window.document, {
            // Configure Readability to keep more content
            charThreshold: 20, // Lower threshold to keep more content
          });
          const article = reader.parse();

          let finalContent = article?.content || "";

          // Check if Readability preserved enough content
          // If the content is too short or tables are missing, use the original HTML
          const shouldUseOriginal =
            (tables.length > 0 && !finalContent.includes("preserved-table")) ||
            finalContent.length < originalHtml.length * 0.5; // If Readability removed more than half the content

          if (shouldUseOriginal) {
            console.log(
              "Using original HTML instead of Readability output to preserve tables and structure",
            );
            finalContent = `<div>${originalHtml}</div>`;
          }

          // Restore tables in the final content
          tables.forEach((_, index) => {
            finalContent = finalContent.replace(
              `<div class="preserved-table-${index}"></div>`,
              tableContents[index],
            );
          });

          // Restore code blocks
          codeBlocks.forEach((_, index) => {
            finalContent = finalContent.replace(
              `<div class="preserved-code-${index}"></div>`,
              codeContents[index],
            );
          });

          // Restore headings
          headings.forEach((_, index) => {
            finalContent = finalContent.replace(
              `<div class="preserved-heading-${index}"></div>`,
              headingContents[index],
            );
          });

          // Save processed results with minimal fields only,
          // and process the textContent to keep minimal HTML structure.
          await pushDataWrapper({
            title: article?.title || title,
            url: request.loadedUrl,
            content: finalContent,
            codeLanguages: Object.fromEntries(languageMap), // Store the language map
          });

          // Extract links from the current page
          // and add them to the crawling queue.
          await enqueueLinks({
            globs:
              typeof config.match === "string" ? [config.match] : config.match,
            exclude:
              typeof config.exclude === "string"
                ? [config.exclude]
                : config.exclude,
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
          // Abort requests for certain resource types
          async ({ request, page, log }) => {
            // If there are no resource exclusions, return
            const RESOURCE_EXCLUSTIONS = config.resourceExclusions ?? [];
            if (RESOURCE_EXCLUSTIONS.length === 0) {
              return;
            }
            if (config.cookie) {
              const cookies = (
                Array.isArray(config.cookie) ? config.cookie : [config.cookie]
              ).map((cookie) => {
                return {
                  name: cookie.name,
                  value: cookie.value,
                  url: request.loadedUrl,
                };
              });
              await page.context().addCookies(cookies);
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

    const isUrlASitemap = /sitemap.*\.xml$/.test(config.url);

    if (isUrlASitemap) {
      const listOfUrls = await downloadListOfUrls({ url: config.url });

      // Add the initial URL to the crawling queue.
      await crawler.addRequests(listOfUrls);

      // Run the crawler
      await crawler.run();
    } else {
      // Add first URL to the queue and start the crawl.
      await crawler.run([config.url]);
    }
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
    bulletListMarker: "*",
    strongDelimiter: "**",
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

  // Add custom rule for inline code elements
  turndownService.addRule("inlineCode", {
    filter: function (node) {
      return (
        node.nodeName === "CODE" &&
        node.parentNode !== null &&
        node.parentNode.nodeName !== "PRE"
      );
    },
    replacement: function (content) {
      return content ? `\`${content}\`` : "";
    },
  });

  // Custom rule to convert links to local if they exist in allUrls
  turndownService.addRule("links", {
    filter: "a",
    replacement: function (content, node) {
      const element = node as HTMLElement;
      const href = element.getAttribute("href");

      if (!href) {
        return content;
      }

      // Try to normalize the URL for comparison
      let normalizedHref = href;
      try {
        // Handle relative URLs
        if (!href.startsWith("http")) {
          const base = new URL(baseUrl);
          if (href.startsWith("/")) {
            normalizedHref = `${base.protocol}//${base.host}${href}`;
          } else {
            // Handle relative paths without leading slash
            const basePath = base.pathname.endsWith("/")
              ? base.pathname
              : base.pathname + "/";
            normalizedHref = `${base.protocol}//${base.host}${basePath}${href}`;
          }
        }

        // Check if this URL is in our crawled pages
        const isInternalLink = allUrls.some((url) => {
          // Compare URLs ignoring trailing slashes
          const normalizedUrl = url.endsWith("/") ? url.slice(0, -1) : url;
          const normalizedHrefNoSlash = normalizedHref.endsWith("/")
            ? normalizedHref.slice(0, -1)
            : normalizedHref;
          return normalizedUrl === normalizedHrefNoSlash;
        });

        if (isInternalLink) {
          // Find the matching URL from allUrls
          const matchingUrl = allUrls.find((url) => {
            const normalizedUrl = url.endsWith("/") ? url.slice(0, -1) : url;
            const normalizedHrefNoSlash = normalizedHref.endsWith("/")
              ? normalizedHref.slice(0, -1)
              : normalizedHref;
            return normalizedUrl === normalizedHrefNoSlash;
          });

          if (matchingUrl) {
            // Create a slug from the URL path, consistent with page headers
            let linkSlug;
            try {
              // Extract the path from the URL, removing the base URL
              const urlObj = new URL(matchingUrl);
              const baseUrlObj = new URL(baseUrl);

              // Remove the base URL from the full URL to get the path
              let path = "";
              if (urlObj.pathname.startsWith(baseUrlObj.pathname)) {
                // If the base URL path is a prefix of the current URL path
                path = urlObj.pathname.substring(baseUrlObj.pathname.length);
              } else {
                // Fallback to using the full path
                path = urlObj.pathname;
              }

              // Remove leading and trailing slashes
              path = path.replace(/^\/|\/$/g, "");

              if (path) {
                // Use the path as the slug, replacing slashes with dashes
                linkSlug = path.replace(/\//g, "-");
                // Clean up the slug to ensure it's valid for markdown
                linkSlug = linkSlug
                  .replace(/[^a-zA-Z0-9-_]/g, "-")
                  .toLowerCase();
              } else {
                // Fallback to using the title if path is empty
                linkSlug =
                  data.allTitles && data.allTitles[matchingUrl]
                    ? slugify(data.allTitles[matchingUrl])
                    : slugify(content || urlObj.hostname);
              }
            } catch (e) {
              // Fallback to using the title if URL parsing fails
              console.error(
                `Error creating link slug from URL ${matchingUrl}:`,
                e,
              );
              linkSlug =
                data.allTitles && data.allTitles[matchingUrl]
                  ? slugify(data.allTitles[matchingUrl])
                  : slugify(content || "link");
            }

            // Keep the original link text
            return `[${content}](#${linkSlug})`;
          }
        }
      } catch (e) {
        // If URL parsing fails, just use the original link
        console.error(`Error processing link ${href}:`, e);
      }

      // Default case: external link or URL not in our crawled pages
      return `[${content}](${href})`;
    },
  });

  // Add custom rule to preserve headings with their hierarchy
  turndownService.addRule("headings", {
    filter: ["h1", "h2", "h3", "h4", "h5", "h6"],
    replacement: function (content, node) {
      const hLevel = parseInt(node.nodeName.charAt(1));
      const hashes = "#".repeat(hLevel);
      return `\n\n${hashes} ${content}\n\n`;
    },
  });

  // Add custom rule to convert HTML tables to Markdown tables
  turndownService.addRule("tables", {
    filter: "table",
    replacement: function (_content, node) {
      const headers: string[] = [];
      let markdown = "";

      // Extract table headers
      const headerRow = node.querySelector("thead tr");
      if (headerRow) {
        headerRow.querySelectorAll("th").forEach((th) => {
          // Process header content to preserve code blocks
          const headerContent = turndownService
            .turndown(th.innerHTML.trim())
            .replace(/\n+/g, " ")
            .replace(/\|/g, "\\|"); // Escape pipe characters in table cells

          headers.push(headerContent);
        });
      } else {
        // If no thead, try to get headers from the first row
        const firstRow = node.querySelector("tr");
        if (firstRow) {
          firstRow.querySelectorAll("th").forEach((th) => {
            // Process header content to preserve code blocks
            const headerContent = turndownService
              .turndown(th.innerHTML.trim())
              .replace(/\n+/g, " ")
              .replace(/\|/g, "\\|"); // Escape pipe characters in table cells

            headers.push(headerContent);
          });

          // If no th elements found, use the first row td elements as headers
          if (
            headers.length === 0 &&
            firstRow.querySelectorAll("td").length > 0
          ) {
            firstRow.querySelectorAll("td").forEach((td) => {
              const headerContent = turndownService
                .turndown(td.innerHTML.trim())
                .replace(/\n+/g, " ")
                .replace(/\|/g, "\\|");

              headers.push(headerContent);
            });
          }
        }
      }

      // Add header row to markdown if headers were found
      if (headers.length > 0) {
        markdown += `| ${headers.join(" | ")} |\n`;
        markdown += `| ${headers.map(() => "---").join(" | ")} |\n`;
      }

      // Get all rows, excluding header rows
      const allRows = Array.from(node.querySelectorAll("tr"));
      const bodyRows = allRows.filter((tr) => {
        // Skip header rows in thead
        if (
          tr.parentElement &&
          tr.parentElement.tagName.toLowerCase() === "thead"
        ) {
          return false;
        }
        // Skip the first row if it was used for headers and there's no thead
        if (
          !node.querySelector("thead") &&
          tr === allRows[0] &&
          headers.length > 0
        ) {
          return false;
        }
        return true;
      });

      // If no headers were found but we have rows, create a header row with empty cells
      if (headers.length === 0 && bodyRows.length > 0) {
        const firstRow = bodyRows[0];
        const cellCount = firstRow.querySelectorAll("td, th").length;
        if (cellCount > 0) {
          markdown += `| ${Array(cellCount).fill(" ").join(" | ")} |\n`;
          markdown += `| ${Array(cellCount).fill("---").join(" | ")} |\n`;
        }
      }

      // Process body rows
      bodyRows.forEach((tr) => {
        const cells: string[] = [];
        // Handle both td and th cells in the row
        tr.querySelectorAll("td, th").forEach((cell) => {
          // Get the cell content and clean it up
          const cellContent = turndownService
            .turndown(cell.innerHTML.trim())
            .replace(/\n+/g, " ")
            .replace(/\|/g, "\\|"); // Escape pipe characters in table cells

          cells.push(cellContent);
        });

        if (cells.length > 0) {
          markdown += `| ${cells.join(" | ")} |\n`;
        }
      });

      return `\n${markdown}\n`;
    },
  });

  // Add custom rule to use the preserved language information
  turndownService.addRule("codeBlocks", {
    filter: "pre",
    replacement: function (content, node) {
      let language = "";

      // Use type assertion for node
      const el = node as unknown as Element;

      // Check for our custom data attribute
      const languageId = el.getAttribute("data-code-language-id");
      if (languageId && data.codeLanguages && data.codeLanguages[languageId]) {
        language = data.codeLanguages[languageId];
      } else {
        // Fallback to checking class attributes
        const classAttr = el.getAttribute("class");
        if (classAttr && classAttr.includes("language-")) {
          const match = classAttr.match(/language-(\w+)/);
          if (match && match[1]) {
            language = match[1];
          }
        }

        // Check code element as well
        const codeElement = el.querySelector("code");
        if (!language && codeElement) {
          const codeEl = codeElement as unknown as Element;
          const codeClassAttr = codeEl.getAttribute("class");
          if (codeClassAttr && codeClassAttr.includes("language-")) {
            const match = codeClassAttr.match(/language-(\w+)/);
            if (match && match[1]) {
              language = match[1];
            }
          }
        }
      }

      // Clean the content but preserve indentation within code blocks
      const cleanContent = content
        .replace(/^\n+|\n+$/g, "") // Remove leading/trailing newlines
        .replace(/^    /gm, "") // Remove leading spaces that might be added by the HTML parser
        .trim();

      if (language) {
        console.log(`Found code block with language: "${language}"`);
      }

      return `\n\`\`\`${language}\n${cleanContent}\n\`\`\`\n`;
    },
  });

  const domain = new URL(baseUrl).hostname;
  let markdown = "";
  const tocItems: ToCItem[] = [];

  if (data.isFirstPage && includeExtras) {
    markdown += `# ${domain}\n\n`;
  }

  // Create a slug from the title or URL for consistent linking
  let pageSlug;
  try {
    // Extract the path from the URL, removing the base URL
    const urlObj = new URL(data.url);
    const baseUrlObj = new URL(baseUrl);

    // Remove the base URL from the full URL to get the path
    let path = "";
    if (urlObj.pathname.startsWith(baseUrlObj.pathname)) {
      // If the base URL path is a prefix of the current URL path
      path = urlObj.pathname.substring(baseUrlObj.pathname.length);
    } else {
      // Fallback to using the full path
      path = urlObj.pathname;
    }

    // Remove leading and trailing slashes
    path = path.replace(/^\/|\/$/g, "");

    if (path) {
      // Use the path as the slug, replacing slashes with dashes
      pageSlug = path.replace(/\//g, "-");
      // Clean up the slug to ensure it's valid for markdown
      pageSlug = pageSlug.replace(/[^a-zA-Z0-9-_]/g, "-").toLowerCase();
    } else {
      // Fallback to using the title if path is empty
      pageSlug = slugify(data.title || urlObj.hostname);
    }
  } catch (e) {
    // Fallback to using the title if URL parsing fails
    console.error(`Error creating slug from URL ${data.url}:`, e);
    pageSlug = slugify(data.title || "page");
  }

  if (includeExtras) {
    tocItems.push({ level: 2, text: data.title, slug: pageSlug });
  }

  // Add the page title with a consistent ID
  markdown += `## ${data.title} {#${pageSlug}}\n\n`;

  if (includeExtras) {
    markdown += `[Back to Top](#table-of-contents)\n\n`;
  }

  // Always keep the original URL reference
  markdown += `URL: ${data.url}\n\n`;

  if (data.excerpt) {
    markdown += `${data.excerpt}\n\n`;
  }

  if (data.byline) {
    markdown += `Author: ${data.byline}\n\n`;
  }

  if (data.siteName) {
    markdown += `Site: ${data.siteName}\n\n`;
  }

  // Create a JSDOM instance to parse the HTML content
  const dom = new JSDOM(data.content);

  // Ensure all tables have proper structure
  dom.window.document.querySelectorAll("table").forEach((table) => {
    // Make sure tables have thead if they have th elements in the first row
    const firstRow = table.querySelector("tr");
    if (
      firstRow &&
      firstRow.querySelectorAll("th").length > 0 &&
      !table.querySelector("thead")
    ) {
      const thead = dom.window.document.createElement("thead");
      thead.appendChild(firstRow.cloneNode(true));
      table.insertBefore(thead, table.firstChild);
      // Remove the original first row if it's now in thead
      if (
        firstRow.parentNode === table ||
        firstRow.parentNode?.nodeName.toLowerCase() === "tbody"
      ) {
        firstRow.parentNode.removeChild(firstRow);
      }
    }
  });

  // Process the content with our custom rules
  let content = turndownService.turndown(dom.window.document.body);

  // Clean up the content
  content = content
    // Remove excessive newlines
    .replace(/\n{3,}/g, "\n\n")
    // Fix code blocks that might have been broken
    .replace(/```\s+```/g, "")
    // Ensure proper spacing around headings
    .replace(/^(#{1,6}.*)\n([^#\n])/gm, "$1\n\n$2");

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

  // Increase heading levels
  content = content.replace(/^# /gm, "### ");
  content = content.replace(/^## /gm, "#### ");
  content = content.replace(/^### /gm, "##### ");
  content = content.replace(/^#### /gm, "###### ");

  // Remove any headings that are now beyond level 6
  content = content.replace(/^#{7,} (.+)$/gm, "***$1***");

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

function ensureCodeBlocksHaveLanguage(
  markdown: string,
  defaultLanguage: string = "text",
): string {
  // Replace code blocks that don't have a language specified
  return markdown.replace(/```\s*\n/g, `\`\`\`${defaultLanguage}\n`);
}

export async function write(config: Config) {
  let nextFileNameString: PathLike = "";
  const jsonFiles = await glob("storage/datasets/default/*.json", {
    absolute: true,
  });

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

      // Collect all URLs from the crawled pages
      const allUrls = reversedResults.map((data) => data.url);

      // Also collect titles for better linking
      const titleMap = new Map<string, string>();
      reversedResults.forEach((data) => {
        if (data.url && data.title) {
          titleMap.set(data.url, data.title);
        }
      });

      const includeExtras =
        config.outputFileFormat === "human_readable_markdown";

      // Process each page with knowledge of all URLs
      reversedResults.forEach((data, index) => {
        const { markdown, tocItems } = convertToMarkdown(
          {
            ...data,
            isFirstPage: index === 0,
            allTitles: Object.fromEntries(titleMap), // Pass titles for better linking
          },
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

      // Post-process the markdown to ensure all code blocks have a language
      if (config.defaultCodeLanguage) {
        markdownContent = ensureCodeBlocksHaveLanguage(
          markdownContent,
          config.defaultCodeLanguage,
        );
      }

      // Apply the markdown processing callback if provided
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
    console.log(
      `Wrote ${currentResults.length} items to ${nextFileNameString}`,
    );
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
