## SpecStory

## Custom Code Block Formatting in Markdown (2/11/2025, 5:37:33 PM)

_**User**_

please provide a custom "onVisitPage: " code to solve the following. I have identified an issue with the collected data generated by this app, if the source material has codeblocks that are numbered, it can include the numbers as part of the code, i have provided an example in the markdown doc it created. The source page for that code was @intro.html , given we can add custom function to execute on each page visit, could we use that to say remove the line numbering, perhaps even ensure the codeblock is encapsulated in a nice and conformant manner for the crawler to injest and for readability to then correctly escape it with triple back ticks in the markdown formatting. I believe teh custom functions can be part of the config.ts file (thus we can add when required)

---

_**Assistant**_

Below is an example change to your `config.ts` that uses a custom `onVisitPage` function. In this version, we query for all code blocks (assuming they’re rendered as `<pre><code>`), split the text into lines, remove any leading line‐numbering (via a regex), and then re‑wrap the cleaned code with triple backticks. This way, when the crawler gathers the page content the code blocks will not retain their unwanted numbers and will be formatted as valid Markdown code fences.

Below is the update for `config.ts`:

---

**Explanation:**  
The updated `onVisitPage` function runs within the page context. It selects all `<pre><code>` elements, processes each line to remove any leading numeric tokens, then replaces the code block’s content with a Markdown‑formatted code block wrapped by triple backticks. Finally, it returns the modified HTML to be pushed via `_pushData`.

---

````typescript:config.ts
import { Config } from "./src/config";

export const defaultConfig: Config = {
  url: "https://d2lang.com/tour",
  match: ["https://d2lang.com/tour/**"],
  exclude: [],
  maxPagesToCrawl: 1000,
  topic: "d2lang",
  selector: ".theme-doc-markdown",
  outputFileName: "d2-docs.json",
  outputFileFormat: "json",

  // Custom onVisitPage function to remove numbering from code blocks and wrap them in triple backticks
  onVisitPage: async ({ page, pushData: _pushData }) => {
    const updatedContent = await page.evaluate(() => {
      // Select all code blocks that are rendered as <pre><code>
      const codeBlocks = document.querySelectorAll('pre code');
      codeBlocks.forEach(codeBlock => {
        // Get the raw text of the code block, then split it into its lines
        const lines = codeBlock.innerText.split('\n');
        // Remove any leading numbers (and an optional space) from each line.
        const cleanedLines = lines.map(line => line.replace(/^\s*\d+\s?/, ''));
        // Build a new markdown code block string with triple-backticks encapsulation
        const markdownCode = '```\n' + cleanedLines.join('\n') + '\n```';
        // Replace the parent <pre> content (or fallback to the <code> element)
        const pre = codeBlock.parentElement;
        if (pre) {
          pre.textContent = markdownCode;
        } else {
          codeBlock.textContent = markdownCode;
        }
      });
      // Return the modified body content after processing code blocks
      return document.body.innerHTML;
    });
    // Push the updated content so that the crawler ingests the cleaned version.
    _pushData({ content: updatedContent });
  },
};
````

---

This change will help ensure that any numbered code block is cleaned of its line numbers and will be encapsulated by triple backticks in the final markdown output.

---

_**User**_

in the old version of the config.onVisitPage: it did not need to return or push anything, it just modified the source, can you adjust your implementation to be as simple

---

_**Assistant**_

Below is a simplified version of your `onVisitPage` function. In this version, we no longer capture or push updated content. Instead, we simply modify the page content in place—just as your original implementation did.

Below are the changes as a diff snippet for `config.ts`:

````diff:config.ts
@@ export const defaultConfig: Config = {
-  // Custom onVisitPage function to remove numbering from code blocks and wrap them in triple backticks
-  onVisitPage: async ({ page, pushData: _pushData }) => {
-    const updatedContent = await page.evaluate(() => {
-      // Select all code blocks that are rendered as <pre><code>
-      const codeBlocks = document.querySelectorAll('pre code');
-      codeBlocks.forEach(codeBlock => {
-        // Get the raw text of the code block, then split it into its lines
-        const lines = codeBlock.innerText.split('\n');
-        // Remove any leading numbers (and an optional space) from each line.
-        const cleanedLines = lines.map(line => line.replace(/^\s*\d+\s?/, ''));
-        // Build a new markdown code block string with triple-backticks encapsulation
-        const markdownCode = '```\n' + cleanedLines.join('\n') + '\n```';
-        // Replace the parent <pre> content (or fallback to the <code> element)
-        const pre = codeBlock.parentElement;
-        if (pre) {
-          pre.textContent = markdownCode;
-        } else {
-          codeBlock.textContent = markdownCode;
-        }
-      });
-      // Return the modified body content after processing code blocks
-      return document.body.innerHTML;
-    });
-
-    // Push the updated content so that the crawler ingests the cleaned version.
-    _pushData({ content: updatedContent });
-  },
+  // Custom onVisitPage function to remove numbering from code blocks and wrap them in triple backticks.
+  // This version only modifies the content over the page and does not push or return any data.
+  onVisitPage: async ({ page, pushData: _pushData }) => {
+    await page.evaluate(() => {
+      // Select all code blocks that are rendered as <pre><code>
+      const codeBlocks = document.querySelectorAll('pre code');
+      codeBlocks.forEach(codeBlock => {
+        // Get the raw text of the code block and split it into lines.
+        const lines = codeBlock.innerText.split('\n');
+        // Remove any leading numbers (and an optional space) from each line.
+        const cleanedLines = lines.map(line => line.replace(/^\s*\d+\s?/, ''));
+        // Assemble a new markdown code block string encapsulated in triple-backticks.
+        const markdownCode = '```\n' + cleanedLines.join('\n') + '\n```';
+        // Replace the content of its parent (or fall back to the <code> element).
+        const pre = codeBlock.parentElement;
+        if (pre) {
+          pre.textContent = markdownCode;
+        } else {
+          codeBlock.textContent = markdownCode;
+        }
+      });
+    });
+  },
````

### Explanation

- **Before:** The previous implementation captured updated content within the page using `page.evaluate()` and then pushed that updated content using `_pushData`.
- **After:** The update simply processes the page over the browser context (using `page.evaluate()`) and modifies the DOM in place. No content is returned or pushed, matching the simplicity of your original version.

This should meet your requirement for a simpler implementation while still cleaning up numbered code blocks.

---

_**User**_

[{
"resource": "/d:/projects/gpt-crawler/config.ts",
"owner": "typescript",
"code": "2339",
"severity": 8,
"message": "Property 'innerText' does not exist on type 'Element'.",
"source": "ts",
"startLineNumber": 21,
"startColumn": 33,
"endLineNumber": 21,
"endColumn": 42,
"modelVersionId": 211
},{
"resource": "/d:/projects/gpt-crawler/config.ts",
"owner": "typescript",
"code": "7006",
"severity": 8,
"message": "Parameter 'line' implicitly has an 'any' type.",
"source": "ts",
"startLineNumber": 23,
"startColumn": 40,
"endLineNumber": 23,
"endColumn": 44,
"modelVersionId": 211
}]

these require resolving

---

_**Assistant**_

Below is an updated diff snippet for your `config.ts` that resolves the TypeScript errors by:

1. Checking that each code block is an instance of `HTMLElement` before accessing its `innerText`.
2. Explicitly annotating the type of the `line` parameter in the `map` function.

````diff:config.ts
   onVisitPage: async ({ page, pushData: _pushData }) => {
-    await page.evaluate(() => {
-      // Select all code blocks that are rendered as <pre><code>
-      const codeBlocks = document.querySelectorAll('pre code');
-      codeBlocks.forEach(codeBlock => {
-        // Get the raw text of the code block and split it into lines.
-        const lines = codeBlock.innerText.split('\n');
-        // Remove any leading numbers (and an optional space) from each line.
-        const cleanedLines = lines.map(line => line.replace(/^\s*\d+\s?/, ''));
-        // Assemble a new markdown code block string encapsulated in triple-backticks.
-        const markdownCode = '```\n' + cleanedLines.join('\n') + '\n```';
-        // Replace the content of its parent (or fall back to the <code> element).
-        const pre = codeBlock.parentElement;
-        if (pre) {
-          pre.textContent = markdownCode;
-        } else {
-          codeBlock.textContent = markdownCode;
-        }
-      });
-    });
+    await page.evaluate(() => {
+      // Select all code blocks that are rendered as <pre><code>
+      const codeBlocks = document.querySelectorAll('pre code');
+      codeBlocks.forEach(codeBlock => {
+        if (!(codeBlock instanceof HTMLElement)) return;
+        // Get the raw text of the code block and split it into lines.
+        const lines = codeBlock.innerText.split('\n');
+        // Remove any leading numbers (and an optional space) from each line.
+        const cleanedLines = lines.map((line: string) => line.replace(/^\s*\d+\s?/, ''));
+        // Assemble a new markdown code block string encapsulated in triple-backticks.
+        const markdownCode = '```\n' + cleanedLines.join('\n') + '\n```';
+        // Replace the content of its parent (or fall back to the <code> element).
+        const pre = codeBlock.parentElement;
+        if (pre) {
+          pre.textContent = markdownCode;
+        } else {
+          codeBlock.textContent = markdownCode;
+        }
+      });
+    });
````

### Explanation

- **Instance Check:** The code now checks whether the current `codeBlock` is an instance of `HTMLElement` before using `innerText` (this resolves TS2339).
- **Explicit Typing:** The lambda parameter `line` in the call to `map` is explicitly typed as a string (this resolves TS7006).

This simpler implementation should now compile without errors and behave as intended by modifying the page content in place without the need to push additional data.

---

_**User**_

it seems i gave you an incorrect version of the page that we are trying to cleanse the codeblocks from, here is the corrected version @intro.html please update the onPageVisit function in @config.ts

---

_**Assistant**_

Below is the updated diff for your `config.ts` file. In this version, we target the corrected code block structure inside a `<section class="CodeBlock">`, then cleanse the line numbers and re‑format the code as a markdown code block using triple backticks.

---

### Updated Diff for `config.ts`

````diff:config.ts
-    await page.evaluate(() => {
-      // Select all code blocks that are rendered as <pre><code>
-      const codeBlocks = document.querySelectorAll('pre code');
-      codeBlocks.forEach(codeBlock => {
-        if (!(codeBlock instanceof HTMLElement)) return;
-        // Get the raw text of the code block and split it into lines.
-        const lines = codeBlock.innerText.split('\n');
-        // Remove any leading numbers (and an optional space) from each line.
-        const cleanedLines = lines.map((line: string) => line.replace(/^\s*\d+\s?/, ''));
-        // Assemble a new markdown code block string encapsulated in triple-backticks.
-        const markdownCode = '```\n' + cleanedLines.join('\n') + '\n```';
-        // Replace the content of its parent (or fall back to the <code> element).
-        const pre = codeBlock.parentElement;
-        if (pre) {
-          pre.textContent = markdownCode;
-        } else {
-          codeBlock.textContent = markdownCode;
-        }
-      });
+    await page.evaluate(() => {
+      // Select all code blocks within sections with the "CodeBlock" class.
+      const codeBlocks = document.querySelectorAll('section.CodeBlock pre');
+      codeBlocks.forEach(codeBlock => {
+        if (!(codeBlock instanceof HTMLElement)) return;
+        // Get the raw text of the code block and split it into lines.
+        const lines = codeBlock.innerText.split('\n');
+        // Remove any leading numbers (and an optional space) from each line.
+        const cleanedLines = lines.map((line: string) => line.replace(/^\s*\d+\s?/, ''));
+        // Assemble a new markdown code block string encapsulated in triple-backticks.
+        const markdownCode = '```\n' + cleanedLines.join('\n') + '\n```';
+        // Replace the content of the <pre> element.
+        codeBlock.textContent = markdownCode;
+      });
````

---

### Explanation

- **Selector Updated:** We now target code blocks inside `<section class="CodeBlock">` by using `document.querySelectorAll('section.CodeBlock pre');`.
- **Cleansing Logic:** For each code block, we split the inner text by newline and remove any leading numbers (using the regex `/^\s*\d+\s?/`).
- **Re-formatting:** The cleaned lines are then reassembled into a markdown code block string wrapped in triple backticks.
- **DOM Replacement:** Finally, we replace the content of the existing `<pre>` element with the new markdown-formatted string.

This update should correctly cleanse the numbered code blocks from the corrected version of your `@intro.html` page.

---

_**User**_

ok, so much much better, only little issue is that the markdown triple back ticks are coming out as '\`\`\`' instead of unescaped

---

_**Assistant**_

Below is the updated diff for your `config.ts` file. This update replaces the inline triple backticks with a solution that builds them from character codes so that they come out unescaped in the final output:

````diff:config.ts
         // Assemble a new markdown code block string encapsulated in triple-backticks.
-        const markdownCode = '```\n' + cleanedLines.join('\n') + '\n```';
+        const backtick = String.fromCharCode(96);
+        const markdownCode = backtick + backtick + backtick + "\n" + cleanedLines.join("\n") + "\n" + backtick + backtick + backtick;
````

### Explanation

Instead of using a literal string that contains backticks (which may be escaped in the final output), we compute a backtick character with `String.fromCharCode(96)`. Then we concatenate it three times to form the triple backticks. This produces unescaped triple backticks in the final output.

---

_**User**_

nope, still "\`\`\`"

---

_**Assistant**_

Below is an updated diff snippet for your `config.ts` file. In this update we use a template literal to build the markdown code block. This approach produces literal triple backticks in the output rather than escaped ones.

---

```diff:config.ts
-         const backtick = String.fromCharCode(96);
-         const markdownCode = backtick + backtick + backtick + "\n" + cleanedLines.join("\n") + "\n" + backtick + backtick + backtick;
+         const markdownCode = `\`\`\`
+${cleanedLines.join("\n")}
+\`\`\``;
```

---

### Explanation

- **Before:** We built the triple backticks using `String.fromCharCode(96)`, but the resulting string still ended up with escaped backticks.
- **After:** We now use a template literal to directly insert the backticks (escaped only in the source code) so that the final string contains unescaped triple backticks.

This change should now output a markdown code block with literal ``` markers instead of escaping them.

---

_**User**_

i would like us to paste a string of three back ticks like so "&#96;&#96;&#96;"

---

_**Assistant**_

Below is an updated diff snippet for your `config.ts` file that replaces the template literal with a string literal containing the HTML entity codes for three backticks ("&#96;&#96;&#96;").

```diff:config.ts
-         const markdownCode = `\`\`\`
- ${cleanedLines.join("\n")}
- \`\`\``;
+         const markdownCode = "&#96;&#96;&#96;\n" + cleanedLines.join("\n") + "\n&#96;&#96;&#96;";
```

### Explanation

- **Before:** The code used a template literal with escaped backticks (``\`\`\``) to generate the markdown code block.
- **After:** We now build the string using literal HTML entity codes "&#96;&#96;&#96;" for the triple backticks. This ensures that the output will contain the exact sequence `&#96;&#96;&#96;` (without further escaping) in both the opening and closing positions.

This change will produce a markdown code block in the output that uses the HTML entity codes as you requested.

---

_**User**_

I want to create two nodes when replacing the text, i want it to create a <pre>node, then a <code> node, then insert all the lines back inside that

---

_**Assistant**_

---

---
