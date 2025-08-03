import path from "path";
import assert from "assert";

function sortJsonFiles(filePaths: string[]): string[] {
  return filePaths
    .map((filePath) => ({
      filePath,
      segments: path
        .relative("storage/datasets/default", filePath)
        .split(path.sep),
    }))
    .sort((a, b) => {
      const segA = a.segments;
      const segB = b.segments;
      const len = Math.max(segA.length, segB.length);
      for (let i = 0; i < len; i++) {
        const partA = segA[i] || "";
        const partB = segB[i] || "";
        if (partA < partB) return -1;
        if (partA > partB) return 1;
      }
      return 0;
    })
    .map((item) => item.filePath);
}

// Test cases
const inputPaths = [
  "storage/datasets/default/A/file2.json",
  "storage/datasets/default/A/file1.json",
  "storage/datasets/default/A1/file3.json",
  "storage/datasets/default/B/file4.json",
];
const expectedOrder = [
  "storage/datasets/default/A/file1.json",
  "storage/datasets/default/A/file2.json",
  "storage/datasets/default/A1/file3.json",
  "storage/datasets/default/B/file4.json",
];

const sorted = sortJsonFiles(inputPaths);
assert.deepStrictEqual(
  sorted,
  expectedOrder,
  `Expected ${expectedOrder}, but got ${sorted}`,
);

console.log("test-ordering passed");
