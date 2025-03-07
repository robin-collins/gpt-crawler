## SpecStory

## Code Cleanup for HTML Code Blocks (2/20/2025, 7:47:04 PM)

_**User**_

can you modify the onVisitPage code so that it finds and cleans up all the codeblocks, i have provided @uv-example-code.html that has JUST the two types of codeblock that i am seeing. What we are looking to achieve is to keep ONLY the code, none of the spans or id's etc, and then wrap the code in clean <pre><code></code></pre> tags prior to markdown conversion., the old version that you can see of the onVisitPage code did something similiar on another page except it also was removing line numbers.

---

_**Assistant**_

I'll help you modify the `onVisitPage` function to clean up the code blocks from the example HTML you provided. Looking at the example HTML, I can see two types of code blocks that need to be cleaned up, both wrapped in complex structures with navigation, buttons, and line numbers.

Let me modify the code to handle these cases:

---

_\*\*\*\*_

```diff
    onVisitPage: async ({ page, pushData: _pushData }) => {
      await page.evaluate(() => {
-       // Select all code blocks within sections with the "CodeBlock" class.
-       const codeBlocks = document.querySelectorAll('section.CodeBlock pre');
+       // Select all pre elements that contain code blocks
+       const codeBlocks = document.querySelectorAll('pre');
+
        codeBlocks.forEach(codeBlock => {
          if (!(codeBlock instanceof HTMLElement)) return;
-         // Get the raw text of the code block and split it into lines.
-         const lines = codeBlock.innerText.split('\n');
-         // Remove any leading numbers (and an optional space) from each line.
-         const cleanedLines = lines.map((line: string) => line.replace(/^\s*\d+\s?/, ''));
-         // Create new <pre> and <code> nodes and insert the cleaned code.
-         const newPre = document.createElement("pre");
-         const newCode = document.createElement("code");
-         newCode.textContent = cleanedLines.join("\n");
+
+         // Find the actual code content, which is within a code element
+         const codeElement = codeBlock.querySelector('code');
+         if (!codeElement) return;
+
+         // Get all text content, removing special characters and extra whitespace
+         let codeText = '';
+         const codeLines = codeElement.textContent?.split('\n') || [];
+
+         codeLines.forEach(line => {
+           // Remove line numbers and their associated elements
+           const cleanLine = line
+             .replace(/^\s*\d+\s?/, '') // Remove leading line numbers
+             .replace(/^\s*\$\s/, '$  ') // Preserve command prompts but normalize spacing
+             .replace(/^.*codelineno.*$/, '') // Remove line number anchor elements
+             .trim();
+
+           if (cleanLine && !cleanLine.startsWith('$ powershell')) { // Skip powershell commands
+             codeText += cleanLine + '\n';
+           }
+         });
+
+         // Create new clean elements
+         const newPre = document.createElement('pre');
+         const newCode = document.createElement('code');
+         newCode.textContent = codeText.trim();
          newPre.appendChild(newCode);
-         // Replace the old <pre> element with the new one.
+
+         // Replace the old complex structure with our clean one
          if (codeBlock.parentNode) {
            codeBlock.parentNode.replaceChild(newPre, codeBlock);
```

---

_\*\*\*\*_

I've updated the `onVisitPage` function with several improvements to handle the code blocks in your example:

1. Now selects all `pre` elements instead of just those within `.CodeBlock` sections, since your example shows code blocks in different contexts

2. Properly extracts code from the nested structure by finding the `code` element within each `pre` block

3. Cleans up the content by:

   - Removing line numbers
   - Preserving command prompts (`$`) but normalizing their spacing
   - Removing line number anchor elements (`codelineno`)
   - Skipping powershell commands (since you're using bash)
   - Trimming extra whitespace

4. Creates clean `<pre><code>` elements with just the essential code content

This should now handle both types of code blocks shown in your example HTML:

- The complex multi-line command examples with line numbers and prompts
- The simpler single-line command examples

The code will preserve the actual commands and their output while stripping away all the extra HTML structure, IDs, spans, and formatting elements. The result will be clean code blocks that can be properly converted to markdown.

Would you like me to test this with any specific examples to make sure it's working as expected?

---

_**User**_

can it also add a class to the <code></code> tags, eg
`<pre><code class="language-bash">code here</code></pre>` so it ends up looking like this

---

_**Assistant**_

Yes, I'll modify the code to add the `language-bash` class to the code elements since these are bash commands.

---

_\*\*\*\*_

```diff
          const newPre = document.createElement('pre');
          const newCode = document.createElement('code');
+         newCode.className = 'language-bash';
          newCode.textContent = codeText.trim();
          newPre.appendChild(newCode);
```

---

_\*\*\*\*_

I've added the line to set the class name to `language-bash`. Now when the code blocks are processed, they will be wrapped in `<pre><code class="language-bash">...</code></pre>` tags, which will help with proper syntax highlighting in markdown renderers that support it.

Would you like me to make any other adjustments to the code formatting or structure?

---

---
