/**
 * Helper function to add language identifiers to code blocks
 * @param markdown - The markdown content to process
 * @returns The processed markdown with language identifiers added to code blocks
 */
export function addLanguageToCodeBlocks(markdown: string): string {
  // Replace code blocks that don't have a language specified
  return markdown.replace(/```\n/g, "```text\n");
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
