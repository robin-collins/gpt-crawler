import { strict as assert } from 'assert';
import fs from 'fs';

// Define a type for the recursive structure (using 'any' for simplicity due to complexity)
type JsonNode = string | any[];

/**
 * Recursively extracts raw text content from nested span structures.
 * It skips element definitions ("$", "tag", null, {...}) and concatenates
 * strings and the results of recursive calls on children arrays.
 */
function extractTextContent(node: JsonNode): string {
  if (typeof node === 'string') {
    // Handle escaped newlines or other direct strings
    // The input has "\\n", JSON.parse makes it "\n"
    return node;
  }

  if (!Array.isArray(node)) {
    return ''; // Ignore non-array, non-string nodes
  }

  // Check if it's an element structure like ["$", "tag", id, props, children]
  if (node[0] === '$' && typeof node[1] === 'string' && node.length >= 4) {
    // If it's a span, process its children
    if (node[1] === 'span') {
        // Children are typically at index 4
        if (Array.isArray(node[4])) {
             return node[4].map(extractTextContent).join('');
        }
    }
     // If it's a code element, process its children directly
     if (node[1] === 'code') {
        if (Array.isArray(node[4])) {
             return node[4].map(extractTextContent).join('');
        }
    }
     // If it's a div or pre wrapping the code, look inside its children
     if (node[1] === 'div' || node[1] === 'pre') {
         if (Array.isArray(node[4])) {
            return node[4].map(extractTextContent).join('');
         }
     }

    // Ignore other element types for text extraction, return empty
    return '';
  }

  // If it's just an array of nodes (like the direct children of <code>), process each item
  return node.map(extractTextContent).join('');
}

/**
 * Finds elements within the nested structure that match a specific type identifier.
 * This is a simple recursive search.
 */
function findElementsByType(node: JsonNode, typeIdentifier: string): any[] {
    let found: any[] = [];
    if (!Array.isArray(node)) {
        return found;
    }

    // Check if the current node is the element we're looking for
    // Format: ["$", typeIdentifier, id, props, children]
    if (node[0] === '$' && node[1] === typeIdentifier && node.length >= 3) {
        found.push(node);
    }

    // Recursively search in children arrays (often at index 4)
    if (node.length > 4 && Array.isArray(node[4])) {
        for (const child of node[4]) {
            found = found.concat(findElementsByType(child, typeIdentifier));
        }
    }
     // Also check other array elements if it's not the typical element structure
     else {
         for (const item of node) {
              if (Array.isArray(item)) {
                found = found.concat(findElementsByType(item, typeIdentifier));
              }
         }
     }

    return found;
}


/**
 * Extracts source code for multiple files from the specific JSON structure.
 *
 * @param jsonDataString - The raw JSON string (potentially prefixed, e.g., "1b:[...]")
 * @returns A Map where keys are filenames and values are the extracted source code.
 */
function extractSourceCode(jsonDataString: string): Map<string, string> {
  // Remove potential prefix like "1b:" if present
  // const actualJsonString = jsonDataString.includes(':')
  //   ? jsonDataString.substring(jsonDataString.indexOf(':') + 1)
  //   : jsonDataString; // This logic needs to be applied *after* the first parse

  let parsedData: JsonNode;
  let innerJsonString: string = ""; // Declare here
  try {
    // First, parse the outer array structure: [number, stringified_json]
    const outerArray = JSON.parse(jsonDataString);

    if (!Array.isArray(outerArray) || outerArray.length !== 2 || typeof outerArray[1] !== 'string') {
        throw new Error("Unexpected outer JSON structure. Expected [number, stringified_json].");
    }

    // Get the inner string which contains the actual JSON data
    // let innerJsonString = outerArray[1]; // Assign here, don't redeclare
    innerJsonString = outerArray[1];

    // Remove potential prefix like "1b:" from the inner string
    if (innerJsonString.includes(':')) {
      innerJsonString = innerJsonString.substring(innerJsonString.indexOf(':') + 1);
    }

    // Now parse the actual JSON data from the cleaned inner string
    parsedData = JSON.parse(innerJsonString);

  } catch (error) {
    console.error("Failed to parse JSON data:", error);
    // Log the problematic string for easier debugging if parsing fails
    if (error instanceof Error && error.message.includes("JSON")) {
        // Attempt to log the portion of the string causing issues if possible
        // This is a basic attempt; more sophisticated error reporting might be needed
        const errorPosMatch = error.message.match(/position (\d+)/);
        if (errorPosMatch) {
            const pos = parseInt(errorPosMatch[1], 10);
            // Log context around the error position
            const contextLength = 50; // Chars before and after
            const start = Math.max(0, pos - contextLength);
            const end = Math.min((error as any).input?.length ?? innerJsonString.length, pos + contextLength); // Use innerJsonString as fallback
            const problematicPart = ( (error as any).input ?? innerJsonString).substring(start, end);
            console.error(`Context around error position ${pos}: ...${problematicPart}...`);
        } else {
            // Fallback if position isn't found in the error message
             console.error("Problematic JSON String (first 500 chars):", innerJsonString.substring(0, 500));
        }
    }
    return new Map();
  }

  const sourceFiles = new Map<string, string>();

  // The structure seems to consistently use "$L22" to denote a file's content tab
  // Find all nodes representing file content panes
  const fileContentNodes = findElementsByType(parsedData, '$L22');

  for (const fileNode of fileContentNodes) {
    // Expected format: ["$", "$L22", filename, {props}, [children]]
    if (fileNode.length >= 5 && typeof fileNode[2] === 'string') {
      const filename = fileNode[2];
      const children = fileNode[4];

      // Find the code block within this file's children
      // It seems nested within a div -> div -> pre -> code structure
      const codeElements = findElementsByType(children, 'code');


      if (codeElements.length > 0) {
          // Assume the first code element found is the correct one
          const codeElement = codeElements[0];
          // The actual code pieces are in the children of the code element
           if (Array.isArray(codeElement[4])) {
                const rawCode = extractTextContent(codeElement[4]);
                sourceFiles.set(filename, rawCode);
           }

      } else {
         console.warn(`Could not find <code> element for file: ${filename}`);
      }
    }
  }

  return sourceFiles;
}

// --- Example Usage ---
const jsonData = fs.readFileSync('D:/projects/gpt-crawler/save_output/test_data.json', 'utf8');

// log the length of the jsonData
console.log(`Length of jsonData: ${jsonData.length}`);

// log the first 100 characters of the jsonData
console.log(`First 100 characters of jsonData: ${jsonData.substring(0, 100)}`);

const extractedFiles = extractSourceCode(jsonData);

console.log(`Extracted ${extractedFiles.size} files:`);
extractedFiles.forEach((code, filename) => {
  console.log(`\n--- ${filename} ---`);
  console.log(code);
  console.log(`--- End of ${filename} ---\n`);
});

// Example assertion for 'index.tsx' (replace jsonData placeholder first)
/*
const indexTsxCode = extractedFiles.get('index.tsx');
const expectedIndexTsx = `import { createRoot } from 'react-dom/client';
import App from './App';

import './index.css';

const container = document.querySelector('#app');
const root = createRoot(container);

root.render(<App />);
`;
// Use a proper comparison function in a real test suite
// assert(indexTsxCode?.trim() === expectedIndexTsx.trim(), "index.tsx code mismatch");
console.log("Assertion for index.tsx would run here if jsonData was populated.");
*/