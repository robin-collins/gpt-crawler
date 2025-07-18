<!-- Generated by SpecStory -->

# Comparison of JSON Storage in Core Versions (2025-02-11 19:52:05)

_**User**_

can you please outline exactly what was stored to json in the older version of core.ts @core-pre-readability.ts then do the same explanation for @core.ts

i am looking for exactly what it stores, and the path the data goes through to get there

---

_**Assistant**_

Below is a detailed breakdown of what data each version produces and saves to JSON, along with an explanation of the “path” the data takes from extraction to the final output file.

---

## Older Version (`core-pre-readability.ts`)

### **1. What’s Stored**

- **Data Object Structure:**  
  Each crawled page results in an object that contains at minimum:

  - **`title`**
    - Extracted from `page.title()`.
  - **`url`**
    - Taken from `request.loadedUrl` (the URL that the crawler loaded).
  - **`html`**
    - Extracted using the helper function `getPageHtml(page, config.selector)`.
    - This function checks if the provided selector starts with `/` (an XPath) or is a CSS selector, and then returns either the element’s `textContent` or `innerText`.

- **Optional/Add-on Data:**  
  Additionally, if a user-supplied hook (`config.onVisitPage`) is provided, that hook might call `pushData` with extra properties. However, the core guaranteed fields remain `title`, `url`, and `html`.

### **2. Data Flow Path**

- **Extraction in the Crawler:**
  - In the `crawl(config: Config)` function, the crawler’s `requestHandler` is defined. Inside this handler:
    - The page title is fetched using `await page.title()`.
    - The HTML (or text) fragment is captured by calling `getPageHtml(page, config.selector)`.
    - Both the title and the URL (from `request.loadedUrl`) are combined with this extracted HTML.
    - The data object is then passed to `pushData({ title, url, html })`.
- **Storage Location:**
  - Behind the scenes, the Crawlee framework (used by the crawler) writes these objects as individual JSON files into the directory:  
    `./storage/datasets/default`
- **Aggregation & Final Write:**
  - Later, when the `write(config: Config)` function is called:
    - It collects all the JSON files from `storage/datasets/default/*.json` using a glob pattern.
    - It batches them (taking into account token limits and byte size restrictions) and writes a combined JSON output file.
    - The final output file name is determined by `config.outputFileName` (and may be split into multiple files if thresholds are exceeded).

---

## Newer Version (`src/core.ts`)

### **1. What’s Stored**

- **Data Object Structure:**  
  Instead of simply capturing an element’s text, the new flow processes the full page content through [Mozilla’s Readability](https://github.com/mozilla/readability). Each object now includes:

  - **`title`**
    - Preferably the article’s title as determined by Readability (`article?.title`), or it falls back to the original `page.title()`.
  - **`url`**
    - The URL of the page from `request.loadedUrl`.
  - **`content`**
    - The formatted HTML content of the parsed article (from `article?.content`).
  - **`textContent`**
    - A plain text version of the article (from `article?.textContent`).
  - **`excerpt`**
    - A short summary or excerpt (from `article?.excerpt`).
  - **`byline`**
    - Authorship information if available (from `article?.byline`).
  - **`siteName`**
    - The site name metadata (from `article?.siteName`).

- **Optional/Add-on Data:**  
  As with the older version, if there is an `onVisitPage` hook provided in the configuration, it will run before the Readability processing. That hook might also add its own data via `pushDataWrapper`.

### **2. Data Flow Path**

- **Extraction in the Crawler:**
  - In the `crawl(config: Config)` function, the crawler’s `requestHandler` is defined. The flow is as follows:
    1. **Initial Page Data:**
       - The page title is fetched (`await page.title()`), and the crawler logs the visit.
    2. **Waiting for Selectors:**
       - Similar to the older version, if a selector is specified (either XPath or CSS), it waits for that element.
    3. **On-Visit Hook:**
       - If `config.onVisitPage` exists, it is executed before processing the main content.
    4. **Full Content Processing:**
       - The complete page HTML is fetched using `page.content()`.
       - A new JSDOM instance is created using that HTML (with the URL set to `request.loadedUrl`).
       - Mozilla’s Readability is then run against the parsed document (`new Readability(dom.window.document).parse()`), returning an `article` object with rich properties.
    5. **Data Assembly and Push:**
       - A new data object is assembled with the keys listed above. For example:
         ```javascript
         {
           title: article?.title || originalPageTitle,
           url: request.loadedUrl,
           content: article?.content || "",
           textContent: article?.textContent || "",
           excerpt: article?.excerpt || "",
           byline: article?.byline || "",
           siteName: article?.siteName || "",
         }
         ```
       - This data object is then passed to `pushDataWrapper` (a thin wrapper around `pushData`).
- **Storage Location:**
  - As before, the Crawlee framework writes these objects to individual JSON files under:  
    `./storage/datasets/default`
- **Aggregation & Final Write:**
  - The `write(config: Config)` function gathers all JSON files matching the pattern.
  - **Additional Processing Options:**
    - If `config.outputFileFormat` is set to either `"markdown"` or `"human_readable_markdown"`, then:
      - Each JSON object is converted into a formatted Markdown document via the `convertToMarkdown` function.
      - This function uses Turndown (with custom rules) and may insert a Table of Contents.
    - Otherwise, the JSON objects are simply aggregated into a JSON array.
  - The final output file (or files) is then written—with the naming pattern determined by `config.outputFileName` and the file extension chosen based on the output format.

---

## **Summary Comparison**

- **Older Version:**

  - **Stored Data:** `{ title, url, html }`
    - The “html” is the text content extracted directly via a selector (either XPath or CSS).
  - **Processing:**
    - Minimal processing; no advanced parsing besides selecting text.

- **Newer Version:**
  - **Stored Data:** `{ title, url, content, textContent, excerpt, byline, siteName }`
    - The content is enhanced by processing the full page with Readability to extract a structured and “readable” version of the article.
  - **Processing:**
    - Involves getting the full HTML via `page.content()`, processing it with JSDOM and Readability, and then optionally converting it to Markdown during the aggregation phase.

Both versions ultimately rely on the Crawlee framework’s mechanism to store intermediate JSON files in `storage/datasets/default` and then later combine them into a final aggregate file.

---

_**User**_

i think the newer one needs to not collect the excerpt, byline & sitename. and the textContent, needs to maintain some of the html structure, but make it minimalistic

---

_**Assistant**_

Below are the changes needed in the newer version (in `src/core.ts`). We will remove the extra fields (`excerpt`, `byline`, and `siteName`) from the data pushed to storage and update the `textContent` field. Instead of using the plain text value provided by Readability, we’ll create a helper function (`minimalisticTextContent`) that takes the HTML from the article’s content, removes excess attributes, and returns a cleaner, minimalistic HTML structure.

---

### **1. Update the Data Collection in the Request Handler**

In the `requestHandler` inside the `crawl` function, remove the extra keys (`excerpt`, `byline`, and `siteName`) and update the assignment for `textContent` to call `minimalisticTextContent`. Replace this block:

```typescript:src/core.ts
// Now fetch the page content and process it with Readability
const html = await page.content();
const dom = new JSDOM(html, { url: request.loadedUrl });
const reader = new Readability(dom.window.document);
const article = reader.parse();

// Save processed results
await pushDataWrapper({
  title: article?.title || title,
  url: request.loadedUrl,
  content: article?.content || "",
  textContent: article?.textContent || "",
  excerpt: article?.excerpt || "",
  byline: article?.byline || "",
  siteName: article?.siteName || "",
});
```

with this updated version:

```typescript:src/core.ts
// Now fetch the page content and process it with Readability
const html = await page.content();
const dom = new JSDOM(html, { url: request.loadedUrl });
const reader = new Readability(dom.window.document);
const article = reader.parse();

// Save processed results with minimal fields only,
// and process the textContent to keep minimal HTML structure.
await pushDataWrapper({
  title: article?.title || title,
  url: request.loadedUrl,
  content: article?.content || "",
  textContent: article && article.content ? minimalisticTextContent(article.content) : "",
});
```

### **2. Add a Helper Function for Minimalistic Text Content**

Insert the following helper function (e.g., just after the `waitForXPath` function) so it can process the article’s HTML and remove extra attributes while preserving basic structure:

```typescript:src/core.ts
// Insert below waitForXPath (or in an appropriate utility section)
function minimalisticTextContent(html: string): string {
  const dom = new JSDOM(html);
  const document = dom.window.document;

  // Recursively remove all attributes from elements to simplify the HTML structure.
  const cleanElement = (element: Element) => {
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
```

---

### **Explanation**

- **Removed Fields:**  
  The keys `excerpt`, `byline`, and `siteName` are no longer included in the object passed to `pushDataWrapper`. This means these extra metadata fields won’t be stored in the JSON files.

- **Updated `textContent`:**  
  Instead of using `article?.textContent` (which is plain text), the new implementation calls `minimalisticTextContent(article.content)` if available. This helper function uses JSDOM to parse the HTML content, walks the DOM to remove all attributes (thus stripping styling and other extraneous markup), and returns a more minimalistic version of the HTML. This way, the returned `textContent` maintains a basic HTML structure (e.g., retaining tags like `<p>`, `<strong>`, etc.) but without any unnecessary details.

These changes will ensure that your JSON output in the newer version no longer contains the removed fields and that the `textContent` field is now a minimalistic HTML version.

---

_**User**_

very nice, except i do not think it should strip the extra inside <scg> tags and the nodes therein as tha removes the image data,

---

_**Assistant**_

Below is the updated diff for the `minimalisticTextContent` function in `src/core.ts` to ensure that elements with the tag `<scg>` (and `<svg>`, in case that's intended) are skipped during the attribute cleanup. This will preserve any image or graphical data stored within those tags.

---

```diff:src/core.ts
 function minimalisticTextContent(html: string): string {
   const dom = new JSDOM(html);
   const document = dom.window.document;

-  // Recursively remove all attributes from elements to simplify the HTML structure.
-  const cleanElement = (element: Element) => {
-    for (const attr of Array.from(element.attributes)) {
-      element.removeAttribute(attr.name);
-    }
-    // Recursively process child elements.
-    for (const child of Array.from(element.children)) {
-      cleanElement(child);
-    }
-  };
+  // Recursively remove attributes from elements, except inside <scg> or <svg> tags.
+  const cleanElement = (element: Element) => {
+    if (
+      element.tagName.toLowerCase() === 'scg' ||
+      element.tagName.toLowerCase() === 'svg'
+    ) {
+      // Skip cleaning this element and its children to preserve image/graphics data.
+      return;
+    }
+    for (const attr of Array.from(element.attributes)) {
+      element.removeAttribute(attr.name);
+    }
+    // Recursively process child elements.
+    for (const child of Array.from(element.children)) {
+      cleanElement(child);
+    }
+  };

   cleanElement(document.body);

   // Return the modified innerHTML which maintains basic tags but without extra attributes.
   return document.body.innerHTML;
 }
```

---

### Explanation

- **What Changed:**  
  The `cleanElement` function has been updated to check if the current element's tag is either `<scg>` or `<svg>` (using `tagName.toLowerCase()`). If it matches, it returns without stripping any attributes from that element or its children. This ensures that any image or graphic data (typically stored in such tags) remains intact.

- **Preserved Data:**  
  All other elements not matching these tag names will have their attributes removed to maintain a minimalistic HTML structure.

Apply this diff to your `src/core.ts` file, and the image/graphic data inside `<scg>` (and `<svg>`) elements will remain unaffected.

---

_**User**_

lets remove textContent and just leave it with just the content field value

---

_**Assistant**_

Below is the diff update for `src/core.ts` that removes the `textContent` field from the object passed to `pushDataWrapper`, leaving only the `content` field.

---

```diff:src/core.ts
          // Save processed results with minimal fields only,
          // and process the textContent to keep minimal HTML structure.
          await pushDataWrapper({
            title: article?.title || title,
            url: request.loadedUrl,
            content: article?.content || "",
-           textContent: article && article.content ? minimalisticTextContent(article.content) : "",
          });
```

---

### Explanation

The update removes the `textContent` property from the object that is being sent via `pushDataWrapper`. Now, only the `content` field (which contains the article's full processed HTML) is stored in the JSON file. This change simplifies the stored data and retains only one field for the processed content.

---

---
