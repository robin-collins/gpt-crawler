### Data Format Description

The provided JSON data represents a serialized, deeply nested array structure. This structure appears to model a tree of elements, likely corresponding to HTML or React components used for rendering a dynamic code viewer with syntax highlighting.

1.  **Outer Structure:** The entire data is wrapped in a JSON array containing a number (`1`) and a string (`"1b:[...]"`) which itself holds the serialized core data structure.
2.  **Element Representation:** Individual elements (like `div`, `span`, `code`, `pre`) are represented as arrays, typically following a pattern like `["$", elementType, elementIdOrNull, attributesObject, childrenOrContent]`.
    *   `"$"` seems to be a marker indicating an element node.
    *   `elementType` is a string like `"div"`, `"span"`, or sometimes a specific identifier like `"$L21"`, `"$L22"`. These identifiers likely represent custom components or specific structural nodes within the rendering framework.
    *   `attributesObject` is a JSON object containing properties like `className`, `style`, `value`, `children`, `defaultValue`, etc.
    *   `childrenOrContent` can be an array of child elements (following the same pattern), a simple string for text content, or sometimes mixed arrays/strings.
3.  **File Identification:** Filenames (e.g., 'App.tsx', 'index.css') appear primarily associated with elements marked `"$L21"` (likely representing tabs) and `"$L22"` (likely representing the content panels for each tab). The filename is often stored in the `value` property within the `attributesObject`, or as the third element in the array (e.g., `["$", "$L22", "App.tsx", {...}]`).
4.  **Code Content Location:** The actual source code for each file resides deep within the structure corresponding to its `"$L22"` element. Specifically, it's found within the children of an element like `["$", "code", null, {..., "children": [...]}]`.
5.  **Code Fragmentation and Highlighting:** Inside the `<code>` element's children, the source code is broken down line by line, often represented by `<span>` elements. Each line (`<span>`) contains further nested `<span>` elements, where each innermost `<span>` typically holds a small fragment of code text as its child. These nested spans often have a `style` attribute containing CSS variables (`--shiki-light`, `--shiki-dark`) for syntax highlighting. Newlines are represented as distinct string literals like `"\\n"`.

### Extraction Process Explanation

To extract the filenames and their corresponding plain source code (preserving whitespace and indentation but removing highlighting tags/styles), the following process is required:

1.  **Parse JSON:** Deserialize the main JSON string (the `1b:[...]` part) to get the nested array structure.
2.  **Identify File Content Blocks:** Traverse the parsed structure to find all elements matching the pattern `["$", "$L22", filename, attributesObject]` (or similar, where `$L22` indicates a file content container). Extract the `filename` (from the third element or the `value` property in `attributesObject`) and note the associated `children` structure within the `attributesObject` which contains the code representation.
3.  **Locate Code Element:** For each file content block identified, recursively search within its `children` structure to find the specific element representing the code block, which looks like `["$", "code", null, {..., "children": codeContentArray}]`.
4.  **Recursively Extract Text:** Implement a recursive function that traverses the `codeContentArray` (the children of the `<code>` element).
    *   If the current item is a string (like `"\\n"` or `" "`), append it directly to the result string for the current file (converting `"\\n"` to an actual newline).
    *   If the current item is an array representing an element (like `["$", "span", ...]`), recursively process its children. Crucially, *only* extract the text content from the innermost children (which are usually plain strings within nested spans). Ignore the element tags (`span`, `div`, etc.) and their attributes (especially `style`) themselves. Concatenate the text fragments returned by the recursive calls in the order they appear.
5.  **Assemble Full Source Code:** Concatenate all the extracted text fragments and newlines obtained from step 4 for a single file block. This reassembles the complete, plain source code for that file, maintaining the original formatting derived from the sequence of text fragments and newline strings.
6.  **Map Files to Code:** Store the extracted plain source code for each file in a data structure (e.g., a map or dictionary) where the key is the `filename` extracted in step 2 and the value is the assembled source code string from step 5.

This process effectively rebuilds the original source code by concatenating text nodes found deep within the structure, while discarding the intermediate formatting elements (`<span>` tags and their styles) used for highlighting.