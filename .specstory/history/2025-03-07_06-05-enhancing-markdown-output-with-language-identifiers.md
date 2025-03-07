## SpecStory

## Enhancing Markdown Output with Language Identifiers (3/7/2025, 6:05:36 AM)

_**User**_

@backup-crawler-output.ts @cli.ts @config.ts @core.ts @server.ts @main.ts i am aware there is an 'onVisitPage' callback / function that can be used to modify the page before it is crawled, is there such a callback to modify the then created markdown? i want to make sure that all code block triple back ticks get a language added to them

---

_**Assistant**_

I can see you're looking to add language identifiers to code blocks in the markdown output. Currently, there's no built-in callback specifically for modifying the markdown after it's generated, but we can implement this functionality.

Let's add a new optional callback to the config schema and modify the markdown conversion process to support this feature:

```typescript:src/config.ts
// ... existing code ...

export const configSchema = z.object({
  // ... existing fields ...

  /** Optional function to run for each page found */
  onVisitPage: z
    .function()
    .args(
      z.object({
        page: Page,
        pushData: z.function().args(z.any()).returns(z.promise(z.void())),
      }),
    )
    .returns(z.promise(z.void()))
    .optional(),

  /** Optional function to modify the generated markdown before writing to file */
  onProcessMarkdown: z
    .function()
    .args(z.string())
    .returns(z.string())
    .optional(),

  // ... existing fields ...
});
```

Now let's modify the `write` function in `core.ts` to use this callback when processing markdown:

```typescript:src/core.ts
// ... existing code ...

export async function write(config: Config) {
  // ... existing code ...

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

      // Apply the markdown processing callback if provided
      if (config.onProcessMarkdown) {
        markdownContent = config.onProcessMarkdown(markdownContent);
      }

      await writeFile(nextFileNameString, markdownContent);
    } else {
      // ... existing JSON handling code ...
    }
    // ... existing code ...
  };

  // ... rest of the function ...
}
```

Now, let's create a helper function that you can use to add language identifiers to code blocks. You can add this to your config file:

````typescript:config.ts
// Add this to your config file where you define defaultConfig

// Helper function to add language identifiers to code blocks
export function addLanguageToCodeBlocks(markdown: string): string {
  // Replace code blocks that don't have a language specified
  return markdown.replace(/```\n/g, "```text\n");
}

// Then in your config:
export const defaultConfig: Config = {
  // ... your other config options ...
  onProcessMarkdown: addLanguageToCodeBlocks,
};
````

This implementation:

1. Adds a new `onProcessMarkdown` callback to the config schema
2. Applies this callback to the markdown content before writing to file
3. Provides a helper function that adds "text" as the default language for code blocks that don't have a language specified

You can customize the `addLanguageToCodeBlocks` function to be more sophisticated if needed, such as trying to detect the language based on content or applying different default languages based on context.

---

_**User**_

what about how the code currently handles <pre><code class="language-typescript"></code></pre> (or any language)

does the source code attempt to retain and use the language in the cleaned up markdown

---

_**Assistant**_

You're asking a great question about how the current code handles HTML code blocks with language classes like `<pre><code class="language-typescript">...</code></pre>` when converting to markdown.

Looking at the current implementation, the code uses the Turndown library to convert HTML to markdown, but there's no specific handling to preserve language information from HTML code blocks. Let's examine the relevant parts:

In `core.ts`, the `convertToMarkdown` function creates a TurndownService instance:

```typescript
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

  // Custom rules for lists, links, and tables are added
  // But no custom rule for code blocks

  // ...
}
```

The default Turndown behavior will convert `<pre><code>` blocks to triple backtick code blocks, but it doesn't preserve the language class information by default.

Let's add a custom rule to the TurndownService to handle this:

```typescript:src/core.ts
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

  // ... existing custom rules ...

  // Add custom rule to preserve language in code blocks
  turndownService.addRule('codeBlocks', {
    filter: function (node) {
      return (
        node.nodeName === 'PRE' &&
        node.firstChild &&
        node.firstChild.nodeName === 'CODE'
      );
    },
    replacement: function (content, node) {
      const code = node.firstChild as HTMLElement;
      let language = '';

      // Check for language class
      if (code.classList.length > 0) {
        for (let i = 0; i < code.classList.length; i++) {
          const className = code.classList[i];
          if (className.startsWith('language-')) {
            language = className.replace('language-', '');
            break;
          }
        }
      }

      // Clean the content - remove leading and trailing newlines
      // and dedent the code
      const cleanContent = content
        .replace(/^\n+|\n+$/g, '')
        .replace(/^    /gm, '');

      return `\n\`\`\`${language}\n${cleanContent}\n\`\`\`\n`;
    }
  });

  // ... rest of the function ...
}
```

This custom rule will:

1. Identify `<pre><code>` blocks in the HTML
2. Extract the language from the `class="language-xxx"` attribute if present
3. Clean up the content (removing extra indentation and newlines)
4. Generate a markdown code block with the appropriate language identifier

With this change, when the HTML contains code blocks with language classes, the generated markdown will preserve that language information in the fenced code blocks.

This approach is better than just post-processing the markdown because it correctly identifies the intended language from the source HTML rather than guessing or applying a default.

---

_**User**_

[{
"resource": "/d:/projects/gpt-crawler/src/core.ts",
"owner": "typescript",
"code": "2322",
"severity": 8,
"message": "Type '(node: HTMLElement) => boolean | null' is not assignable to type 'Filter'.\n Type '(node: HTMLElement) => boolean | null' is not assignable to type 'FilterFunction'.\n Type 'boolean | null' is not assignable to type 'boolean'.\n Type 'null' is not assignable to type 'boolean'.",
"source": "ts",
"startLineNumber": 313,
"startColumn": 5,
"endLineNumber": 313,
"endColumn": 11,
"relatedInformation": [
{
"startLineNumber": 38,
"startColumn": 9,
"endLineNumber": 38,
"endColumn": 15,
"message": "The expected type comes from property 'filter' which is declared here on type 'Rule'",
"resource": "/d:/projects/gpt-crawler/node_modules/@types/turndown/index.d.ts"
}
],
"modelVersionId": 3
}]

can you resolve the issues

---

_**Assistant**_

I see the TypeScript error. The issue is with the filter function in our custom rule for code blocks. Let's fix the type issue by ensuring the filter function returns a boolean value and not null:

```typescript:src/core.ts
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

  // ... existing custom rules ...

  // Add custom rule to preserve language in code blocks
  turndownService.addRule('codeBlocks', {
    filter: function (node) {
      // Ensure we're working with an Element
      if (!(node instanceof HTMLElement)) {
        return false;
      }

      // Check if it's a PRE element with a CODE child
      return (
        node.nodeName === 'PRE' &&
        node.firstChild !== null &&
        node.firstChild.nodeName === 'CODE'
      );
    },
    replacement: function (content, node) {
      // Ensure we're working with an Element
      if (!(node instanceof HTMLElement) || !node.firstChild) {
        return `\n\`\`\`\n${content}\n\`\`\`\n`;
      }

      const code = node.firstChild as HTMLElement;
      let language = '';

      // Check for language class
      if (code.classList && code.classList.length > 0) {
        for (let i = 0; i < code.classList.length; i++) {
          const className = code.classList[i];
          if (className.startsWith('language-')) {
            language = className.replace('language-', '');
            break;
          }
        }
      }

      // Clean the content - remove leading and trailing newlines
      // and dedent the code
      const cleanContent = content
        .replace(/^\n+|\n+$/g, '')
        .replace(/^    /gm, '');

      return `\n\`\`\`${language}\n${cleanContent}\n\`\`\`\n`;
    }
  });

  // ... rest of the function ...
}
```

The key changes I made:

1. Added a check to ensure the node is an HTMLElement before proceeding
2. Added explicit null checks to ensure we don't have null values
3. Made sure the filter function always returns a boolean value
4. Added a fallback in the replacement function if the node or firstChild is unexpectedly not available

This should resolve the TypeScript error while maintaining the functionality to extract language information from code blocks.

---

_**User**_

seems your update was not accurate. please resolve

---

_**Assistant**_

I see the issue now. The error is occurring because `HTMLElement` is not defined in the Node.js environment where the code is running. This is because we're using JSDOM, which has its own DOM implementation. Let's fix this by using the JSDOM's Element class instead:

```typescript:src/core.ts
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

  // ... existing custom rules ...

  // Add custom rule to preserve language in code blocks
  turndownService.addRule('codeBlocks', {
    filter: 'pre',
    replacement: function (content, node) {
      // Since we're filtering on 'pre', we need to check if it has a code child
      const codeElement = node.querySelector('code');
      if (!codeElement) {
        return `\n\`\`\`\n${content}\n\`\`\`\n`;
      }

      let language = '';

      // Check for language class
      const classAttr = codeElement.getAttribute('class');
      if (classAttr && classAttr.includes('language-')) {
        const match = classAttr.match(/language-(\w+)/);
        if (match && match[1]) {
          language = match[1];
        }
      }

      // Clean the content - remove leading and trailing newlines
      // and dedent the code
      const cleanContent = content
        .replace(/^\n+|\n+$/g, '')
        .replace(/^    /gm, '');

      return `\n\`\`\`${language}\n${cleanContent}\n\`\`\`\n`;
    }
  });

  // ... rest of the function ...
}
```

The key changes:

1. Changed the filter to use a string selector ('pre') instead of a function, which avoids the need to check instance types
2. Used DOM methods that are compatible with both browser and JSDOM environments (querySelector, getAttribute)
3. Used a regex to extract the language from the class attribute
4. Simplified the overall approach to be more robust across different environments

This should resolve the `HTMLElement is not defined` error while still preserving the language information from code blocks.

---

_**User**_

ok, so it did not preserve the language info.

the page I am scraping has <pre class="language-ts"><code class="language-ts is-loaded">code here is lots of <span></span> to colorise it</code></pre>

the output markdown had

```
code
```

no language identifier.
we should a) check both pre and code for a language-\* class as well as fixing it so that the output uses it

---

_**Assistant**_

You're right - we need to improve the code to properly handle the language classes from both `<pre>` and `<code>` elements, and ensure the language identifier is correctly added to the markdown output. Let's fix this:

```typescript:src/core.ts
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

  // ... existing custom rules ...

  // Helper function to extract language from class attribute
  function extractLanguage(element: any): string {
    const classAttr = element.getAttribute('class');
    if (!classAttr) return '';

    const match = classAttr.match(/language-(\w+)/);
    return match && match[1] ? match[1] : '';
  }

  // Add custom rule to preserve language in code blocks
  turndownService.addRule('codeBlocks', {
    filter: 'pre',
    replacement: function (content, node) {
      // Try to get language from pre element first
      let language = extractLanguage(node);

      // If no language found on pre, check if there's a code element with language
      const codeElement = node.querySelector('code');
      if (!language && codeElement) {
        language = extractLanguage(codeElement);
      }

      // Clean the content - remove leading and trailing newlines
      // and dedent the code
      const cleanContent = content
        .replace(/^\n+|\n+$/g, '')
        .replace(/^    /gm, '')
        .trim();

      // Log for debugging
      console.log(`Found code block with language: "${language}"`);

      return `\n\`\`\`${language}\n${cleanContent}\n\`\`\`\n`;
    }
  });

  // ... rest of the function ...
}
```

The key improvements:

1. Created a helper function `extractLanguage` to consistently extract language information from class attributes
2. Check both the `<pre>` element and its `<code>` child for language classes
3. Added more thorough content cleaning to ensure proper formatting
4. Added a debug log to help verify language detection is working
5. Made sure to trim the content to remove any extra whitespace

This should properly extract language information from both the `<pre class="language-ts">` and `<code class="language-ts">` elements in your example and include it in the markdown output.

If this still doesn't work, we might need to implement a post-processing step as a fallback. Let's add the `onProcessMarkdown` callback to the config schema as we discussed earlier, which would allow you to apply additional fixes if needed:

```typescript:src/config.ts
// ... existing code ...

export const configSchema = z.object({
  // ... existing fields ...

  /** Optional function to modify the generated markdown before writing to file */
  onProcessMarkdown: z
    .function()
    .args(z.string())
    .returns(z.string())
    .optional(),

  // ... existing fields ...
});
```

And then update the `write` function to use this callback:

```typescript:src/core.ts
// In the writeBatchToFile function:

// Apply the markdown processing callback if provided
if (config.onProcessMarkdown) {
  markdownContent = config.onProcessMarkdown(markdownContent);
}

await writeFile(nextFileNameString, markdownContent);
```

---

_**User**_

ok, so the console logging helped. I think that the 'found codeblock with language' code is running too late in the process, seems it was ran as it combined the files from the crawled pages, i think that readability had already stripped the language id's

---

_**Assistant**_

You've identified the key issue - the language information is being lost before our code block processing happens. You're right that Readability is likely stripping out the language classes when it processes the HTML content.

Let's implement a two-part solution:

1. First, let's modify the crawling process to preserve code block language information before Readability processes the page
2. Then, let's add a post-processing step to ensure code blocks have language identifiers

Here's how we can implement this:

```typescript:src/core.ts
// Add this function near the top of the file
function preserveCodeBlockLanguages(html: string): { html: string, languageMap: Map<string, string> } {
  const dom = new JSDOM(html);
  const document = dom.window.document;
  const languageMap = new Map<string, string>();

  // Find all pre and code elements with language classes
  const codeBlocks = document.querySelectorAll('pre, code');
  let counter = 0;

  codeBlocks.forEach(element => {
    const classAttr = element.getAttribute('class');
    if (classAttr && classAttr.includes('language-')) {
      const match = classAttr.match(/language-(\w+)/);
      if (match && match[1]) {
        // Create a unique ID for this code block
        const id = `code-block-${counter++}`;
        // Store the language
        languageMap.set(id, match[1]);
        // Add a data attribute that Readability won't strip
        element.setAttribute('data-code-language-id', id);
      }
    }
  });

  return {
    html: dom.serialize(),
    languageMap
  };
}

// Modify the requestHandler in the crawler to preserve language info
async requestHandler({ request, page, enqueueLinks, log, pushData }) {
  // ... existing code ...

  // Now fetch the page content and process it with Readability
  const html = await page.content();

  // Preserve code block languages before Readability processes the page
  const { html: processedHtml, languageMap } = preserveCodeBlockLanguages(html);

  const dom = new JSDOM(processedHtml, { url: request.loadedUrl });
  const reader = new Readability(dom.window.document);
  const article = reader.parse();

  // Save processed results with minimal fields only,
  // and process the textContent to keep minimal HTML structure.
  await pushDataWrapper({
    title: article?.title || title,
    url: request.loadedUrl,
    content: article?.content || "",
    codeLanguages: Object.fromEntries(languageMap), // Store the language map
  });

  // ... rest of the function ...
}

// Then modify the convertToMarkdown function to use the language map
function convertToMarkdown(
  data: Record<string, any>,
  baseUrl: string,
  allUrls: string[],
  includeExtras: boolean,
): { markdown: string; tocItems: ToCItem[] } {
  // ... existing code ...

  // Add custom rule to use the preserved language information
  turndownService.addRule('codeBlocks', {
    filter: 'pre',
    replacement: function (content, node) {
      let language = '';

      // Check for our custom data attribute
      const languageId = node.getAttribute('data-code-language-id');
      if (languageId && data.codeLanguages && data.codeLanguages[languageId]) {
        language = data.codeLanguages[languageId];
      } else {
        // Fallback to checking class attributes
        const classAttr = node.getAttribute('class');
        if (classAttr && classAttr.includes('language-')) {
          const match = classAttr.match(/language-(\w+)/);
          if (match && match[1]) {
            language = match[1];
          }
        }

        // Check code element as well
        const codeElement = node.querySelector('code');
        if (!language && codeElement) {
          const codeClassAttr = codeElement.getAttribute('class');
          if (codeClassAttr && codeClassAttr.includes('language-')) {
            const match = codeClassAttr.match(/language-(\w+)/);
            if (match && match[1]) {
              language = match[1];
            }
          }
        }
      }

      // Clean the content
      const cleanContent = content
        .replace(/^\n+|\n+$/g, '')
        .replace(/^    /gm, '')
        .trim();

      console.log(`Found code block with language: "${language}"`);

      return `\n\`\`\`${language}\n${cleanContent}\n\`\`\`\n`;
    }
  });

  // ... rest of the function ...
}
```

Additionally, let's add a post-processing step as a fallback to ensure all code blocks have a language identifier:

```typescript:src/config.ts
// Add to the config schema
export const configSchema = z.object({
  // ... existing fields ...

  /** Optional function to modify the generated markdown before writing to file */
  onProcessMarkdown: z
    .function()
    .args(z.string())
    .returns(z.string())
    .optional(),

  /** Default language to use for code blocks that don't have a language specified */
  defaultCodeLanguage: z.string().optional(),

  // ... existing fields ...
});
```

````typescript:src/core.ts
// In the writeBatchToFile function:

// Apply default language to code blocks without a language
if (config.defaultCodeLanguage) {
  markdownContent = markdownContent.replace(/```\n/g, `\`\`\`${config.defaultCodeLanguage}\n`);
}

// Apply the markdown processing callback if provided
if (config.onProcessMarkdown) {
  markdownContent = config.onProcessMarkdown(markdownContent);
}

await writeFile(nextFileNameString, markdownContent);
````

This comprehensive approach:

1. Preserves language information before Readability processes the page
2. Stores the language information in the crawled data
3. Uses the stored language information when converting to markdown
4. Provides a fallback to apply a default language to code blocks without a language
5. Allows for custom post-processing of the markdown

This should ensure that code block language information is preserved throughout the entire process.

---

_**User**_

[{
"resource": "/d:/projects/gpt-crawler/src/core.ts",
"owner": "typescript",
"code": "2339",
"severity": 8,
"message": "Property 'getAttribute' does not exist on type 'Node'.\n Property 'getAttribute' does not exist on type 'Document'.",
"source": "ts",
"startLineNumber": 353,
"startColumn": 31,
"endLineNumber": 353,
"endColumn": 43,
"modelVersionId": 18
},{
"resource": "/d:/projects/gpt-crawler/src/core.ts",
"owner": "typescript",
"code": "2339",
"severity": 8,
"message": "Property 'getAttribute' does not exist on type 'Node'.\n Property 'getAttribute' does not exist on type 'Document'.",
"source": "ts",
"startLineNumber": 358,
"startColumn": 32,
"endLineNumber": 358,
"endColumn": 44,
"modelVersionId": 18
}]

needs fixing

---

_**Assistant**_

I see the TypeScript errors. The issue is that we're using `getAttribute` on `Node` objects, but this method only exists on `Element` objects. Let's fix these type issues:

```typescript:src/core.ts
function preserveCodeBlockLanguages(html: string): { html: string, languageMap: Map<string, string> } {
  const dom = new JSDOM(html);
  const document = dom.window.document;
  const languageMap = new Map<string, string>();

  // Find all pre and code elements with language classes
  const codeBlocks = document.querySelectorAll('pre, code');
  let counter = 0;

  codeBlocks.forEach(element => {
    // Ensure element is an Element before using getAttribute
    if (element instanceof dom.window.Element) {
      const classAttr = element.getAttribute('class');
      if (classAttr && classAttr.includes('language-')) {
        const match = classAttr.match(/language-(\w+)/);
        if (match && match[1]) {
          // Create a unique ID for this code block
          const id = `code-block-${counter++}`;
          // Store the language
          languageMap.set(id, match[1]);
          // Add a data attribute that Readability won't strip
          element.setAttribute('data-code-language-id', id);
        }
      }
    }
  });

  return {
    html: dom.serialize(),
    languageMap
  };
}

// And in the turndownService rule:
turndownService.addRule('codeBlocks', {
  filter: 'pre',
  replacement: function (content, node) {
    let language = '';

    // Make sure node is an Element before using getAttribute
    if (node instanceof Element) {
      // Check for our custom data attribute
      const languageId = node.getAttribute('data-code-language-id');
      if (languageId && data.codeLanguages && data.codeLanguages[languageId]) {
        language = data.codeLanguages[languageId];
      } else {
        // Fallback to checking class attributes
        const classAttr = node.getAttribute('class');
        if (classAttr && classAttr.includes('language-')) {
          const match = classAttr.match(/language-(\w+)/);
          if (match && match[1]) {
            language = match[1];
          }
        }

        // Check code element as well
        const codeElement = node.querySelector('code');
        if (!language && codeElement) {
          const codeClassAttr = codeElement.getAttribute('class');
          if (codeClassAttr && codeClassAttr.includes('language-')) {
            const match = codeClassAttr.match(/language-(\w+)/);
            if (match && match[1]) {
              language = match[1];
            }
          }
        }
      }
    }

    // Clean the content
    const cleanContent = content
      .replace(/^\n+|\n+$/g, '')
      .replace(/^    /gm, '')
      .trim();

    console.log(`Found code block with language: "${language}"`);

    return `\n\`\`\`${language}\n${cleanContent}\n\`\`\`\n`;
  }
});
```

However, there's still a potential issue with the `Element` type. Since we're in a Node.js environment using JSDOM, we need to use the JSDOM's Element class. Let's modify the code to handle this properly:

```typescript:src/core.ts
function preserveCodeBlockLanguages(html: string): { html: string, languageMap: Map<string, string> } {
  const dom = new JSDOM(html);
  const document = dom.window.document;
  const languageMap = new Map<string, string>();

  // Find all pre and code elements with language classes
  const codeBlocks = document.querySelectorAll('pre, code');
  let counter = 0;

  codeBlocks.forEach(element => {
    // TypeScript doesn't know about JSDOM's Element type, so we use a type assertion
    const classAttr = element.getAttribute?.('class');
    if (classAttr && classAttr.includes('language-')) {
      const match = classAttr.match(/language-(\w+)/);
      if (match && match[1]) {
        // Create a unique ID for this code block
        const id = `code-block-${counter++}`;
        // Store the language
        languageMap.set(id, match[1]);
        // Add a data attribute that Readability won't strip
        element.setAttribute?.('data-code-language-id', id);
      }
    }
  });

  return {
    html: dom.serialize(),
    languageMap
  };
}

// And in the turndownService rule:
turndownService.addRule('codeBlocks', {
  filter: 'pre',
  replacement: function (content, node) {
    let language = '';

    // Use optional chaining to safely access methods
    const languageId = node.getAttribute?.('data-code-language-id');
    if (languageId && data.codeLanguages && data.codeLanguages[languageId]) {
      language = data.codeLanguages[languageId];
    } else {
      // Fallback to checking class attributes
      const classAttr = node.getAttribute?.('class');
      if (classAttr && classAttr.includes('language-')) {
        const match = classAttr.match(/language-(\w+)/);
        if (match && match[1]) {
          language = match[1];
        }
      }

      // Check code element as well
      const codeElement = node.querySelector?.('code');
      if (!language && codeElement) {
        const codeClassAttr = codeElement.getAttribute?.('class');
        if (codeClassAttr && codeClassAttr.includes('language-')) {
          const match = codeClassAttr.match(/language-(\w+)/);
          if (match && match[1]) {
            language = match[1];
          }
        }
      }
    }

    // Clean the content
    const cleanContent = content
      .replace(/^\n+|\n+$/g, '')
      .replace(/^    /gm, '')
      .trim();

    console.log(`Found code block with language: "${language}"`);

    return `\n\`\`\`${language}\n${cleanContent}\n\`\`\`\n`;
  }
});
```

This approach uses optional chaining (`?.`) to safely access methods that might not exist on the object, which avoids TypeScript errors while still allowing the code to work correctly.

---

_**User**_

[{
"resource": "/d:/projects/gpt-crawler/src/core.ts",
"owner": "typescript",
"code": "2339",
"severity": 8,
"message": "Property 'getAttribute' does not exist on type 'Node'.\n Property 'getAttribute' does not exist on type 'Document'.",
"source": "ts",
"startLineNumber": 354,
"startColumn": 31,
"endLineNumber": 354,
"endColumn": 43,
"modelVersionId": 28
},{
"resource": "/d:/projects/gpt-crawler/src/core.ts",
"owner": "typescript",
"code": "2339",
"severity": 8,
"message": "Property 'getAttribute' does not exist on type 'Node'.\n Property 'getAttribute' does not exist on type 'Document'.",
"source": "ts",
"startLineNumber": 359,
"startColumn": 32,
"endLineNumber": 359,
"endColumn": 44,
"modelVersionId": 28
}]

jsdom remember

---

_**Assistant**_

You're right, we need to handle the JSDOM types properly. Let's fix the TypeScript errors by using the correct type assertions for JSDOM:

```typescript:src/core.ts
function preserveCodeBlockLanguages(html: string): { html: string, languageMap: Map<string, string> } {
  const dom = new JSDOM(html);
  const document = dom.window.document;
  const languageMap = new Map<string, string>();

  // Find all pre and code elements with language classes
  const codeBlocks = document.querySelectorAll('pre, code');
  let counter = 0;

  codeBlocks.forEach((element) => {
    // Cast to Element type from JSDOM
    const el = element as unknown as Element;

    const classAttr = el.getAttribute('class');
    if (classAttr && classAttr.includes('language-')) {
      const match = classAttr.match(/language-(\w+)/);
      if (match && match[1]) {
        // Create a unique ID for this code block
        const id = `code-block-${counter++}`;
        // Store the language
        languageMap.set(id, match[1]);
        // Add a data attribute that Readability won't strip
        el.setAttribute('data-code-language-id', id);
      }
    }
  });

  return {
    html: dom.serialize(),
    languageMap
  };
}

// And in the turndownService rule:
turndownService.addRule('codeBlocks', {
  filter: 'pre',
  replacement: function (content, node) {
    let language = '';

    // Use type assertion for node
    const el = node as unknown as Element;

    // Check for our custom data attribute
    const languageId = el.getAttribute('data-code-language-id');
    if (languageId && data.codeLanguages && data.codeLanguages[languageId]) {
      language = data.codeLanguages[languageId];
    } else {
      // Fallback to checking class attributes
      const classAttr = el.getAttribute('class');
      if (classAttr && classAttr.includes('language-')) {
        const match = classAttr.match(/language-(\w+)/);
        if (match && match[1]) {
          language = match[1];
        }
      }

      // Check code element as well
      const codeElement = el.querySelector('code');
      if (!language && codeElement) {
        const codeEl = codeElement as unknown as Element;
        const codeClassAttr = codeEl.getAttribute('class');
        if (codeClassAttr && codeClassAttr.includes('language-')) {
          const match = codeClassAttr.match(/language-(\w+)/);
          if (match && match[1]) {
            language = match[1];
          }
        }
      }
    }

    // Clean the content
    const cleanContent = content
      .replace(/^\n+|\n+$/g, '')
      .replace(/^    /gm, '')
      .trim();

    console.log(`Found code block with language: "${language}"`);

    return `\n\`\`\`${language}\n${cleanContent}\n\`\`\`\n`;
  }
});
```

Alternatively, we can use a simpler approach by using string-based selectors and attributes to avoid TypeScript errors:

````typescript:src/core.ts
// Add this import at the top of the file
import { JSDOM } from 'jsdom';

// Add this function to process the markdown after it's generated
function ensureCodeBlocksHaveLanguage(markdown: string, defaultLanguage: string = 'text'): string {
  // Replace code blocks that don't have a language specified
  return markdown.replace(/```\s*\n/g, `\`\`\`${defaultLanguage}\n`);
}

// Then modify the write function to use this post-processing
export async function write(config: Config) {
  // ... existing code ...

  const writeBatchToFile = async (): Promise<void> => {
    // ... existing code ...

    if (
      config.outputFileFormat === "markdown" ||
      config.outputFileFormat === "human_readable_markdown"
    ) {
      // ... existing code to generate markdown ...

      // Post-process the markdown to ensure all code blocks have a language
      if (config.defaultCodeLanguage) {
        markdownContent = ensureCodeBlocksHaveLanguage(markdownContent, config.defaultCodeLanguage);
      }

      // Apply the markdown processing callback if provided
      if (config.onProcessMarkdown) {
        markdownContent = config.onProcessMarkdown(markdownContent);
      }

      await writeFile(nextFileNameString, markdownContent);
    } else {
      // ... existing JSON handling code ...
    }
    // ... existing code ...
  };

  // ... rest of the function ...
}
````

This simpler approach:

1. Adds a post-processing function to ensure all code blocks have a language
2. Uses a regex to find code blocks without a language and adds the default language
3. Applies this post-processing before writing the markdown to file

This avoids the TypeScript errors while still addressing the core issue of ensuring code blocks have language identifiers.

---

---
