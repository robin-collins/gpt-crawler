/**
 * Helper function to add language identifiers to code blocks
 * @param markdown - The markdown content to process
 * @returns The processed markdown with language identifiers added to code blocks
 */
export function addLanguageToCodeBlocks(
  markdown: string,
  language = "text"
): string {
  const lines = markdown.split('\n');
  const processedLines: string[] = [];
  let inCodeBlock = false;
  const fenceRegex = /^\s*```(.*)/; // Matches ``` and captures anything after

  for (const line of lines) {
    const match = line.match(fenceRegex);

    if (match) {
      if (!inCodeBlock) {
        // Entering a code block
        const existingLang = match[1].trim();
        if (!existingLang) {
          // No language specified, add the default/provided one
          processedLines.push(`\`\`\`${language}`);
        } else {
          // Language already exists, keep the line as is
          processedLines.push(line);
        }
        inCodeBlock = true;
      } else {
        // Exiting a code block, keep the closing fence as is
        processedLines.push(line);
        inCodeBlock = false;
      }
    } else {
      // Not a fence line, add it as is (respecting if inside a code block or not)
      processedLines.push(line);
    }
  }

  return processedLines.join('\n');
}

/**
 * Helper function to remove HTML comments from markdown
 * @param markdown - The markdown content to process
 * @returns The processed markdown with HTML comments removed
 */
export function removeHtmlComments(markdown: string): string {
  return markdown.replace(/<!--[\s\S]*?-->/g, "");
}

/**
 * Helper function to normalize headings (ensure proper spacing after # symbols)
 * @param markdown - The markdown content to process
 * @returns The processed markdown with normalized headings
 */
export function normalizeHeadings(markdown: string): string {
  return markdown.replace(/^(#{1,6})([^ #])/gm, "$1 $2");
}

/**
 * Helper function to chain multiple markdown processor functions together
 * @param processors - Array of markdown processor functions to chain
 * @returns A single function that applies all processors in sequence
 */
export const chainMarkdownProcessors = (
  ...processors: ((markdown: string) => string)[]
) => {
  return (markdown: string): string => {
    return processors.reduce((processedMarkdown, processor) => {
      return processor(processedMarkdown);
    }, markdown);
  };
};
