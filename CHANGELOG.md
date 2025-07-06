# [1.4.0](https://github.com/BuilderIO/gpt-crawler/compare/v1.3.0...v1.4.0) (2024-01-15)

### Bug Fixes

- linting ([0f4e58b](https://github.com/BuilderIO/gpt-crawler/commit/0f4e58b400eab312e7b595d7a2472bae93055415))

### Features

- add server api readme docs ([717e625](https://github.com/BuilderIO/gpt-crawler/commit/717e625f47257bdbd96437acb7242bcd28c233ba))

# [1.3.0](https://github.com/BuilderIO/gpt-crawler/compare/v1.2.1...v1.3.0) (2024-01-06)

### Features

- add exclude pattern for links in config ([16443ed](https://github.com/BuilderIO/gpt-crawler/commit/16443ed9501624de40d921b8e47e4c35f15bf6b4))

### Added

- N/A

### Changed

- N/A

### Deprecated

- N/A

### Removed

- N/A

### Fixed

- N/A

### Security

- N/A

### Chore

- Investigated an issue where code blocks from pages similar to `hyperdiv.html` were rendered with single backticks instead of triple backticks. The root cause appears to be a combination of how the `Readability` library parses HTML structures like `div.codehilite` and how `TurndownService` subsequently converts these potentially altered structures to Markdown. No code changes were made during this investigation.

# [1.5.0](https://github.com/BuilderIO/gpt-crawler/compare/v1.4.0...v1.5.0) (YYYY-MM-DD)

### Added

- Added `cleanHyperdivCodeBlocks` function to `src/visitPageHelpers.ts`. This function cleans up `div.codehilite` structures by replacing them with their inner `pre` tag, aiming to improve Markdown conversion consistency for code blocks from Hyperdiv-like documentation sites.

### Changed

- N/A

### Deprecated

- N/A

### Removed

- N/A

### Fixed

- N/A

### Security

- N/A

### Chore

- N/A

# [1.5.1](https://github.com/BuilderIO/gpt-crawler/compare/v1.5.0...v1.5.1) (YYYY-MM-DD)

### Added

- N/A

### Changed

- Modified `cleanCodeBlocks` in `src/visitPageHelpers.ts` to attempt to preserve existing language classes from `<code>` or `<pre>` elements, defaulting to `language-text` if none is found. This replaces the previous behavior of hardcoding `language-bash`.

### Deprecated

- N/A

### Removed

- N/A

### Fixed

- N/A

### Security

- N/A

### Chore

- N/A

# [1.5.2](https://github.com/BuilderIO/gpt-crawler/compare/v1.5.1...v1.5.2) (YYYY-MM-DD)

### Added

- N/A

### Changed

- N/A

### Deprecated

- N/A

### Removed

- N/A

### Fixed

- Modified `cleanCodeBlocks` in `src/visitPageHelpers.ts` to preserve leading and trailing whitespace (including newlines and indentation) by removing `.trim()` calls that were affecting individual lines and the entire code block. This is critical for whitespace-sensitive languages like Python.

### Security

- N/A

### Chore

- N/A

# [1.5.3](https://github.com/BuilderIO/gpt-crawler/compare/v1.5.2...v1.5.3) (YYYY-MM-DD)

### Added

- N/A

### Changed

- Modified `cleanCodeBlocks` in `src/visitPageHelpers.ts` to use `innerText.split('\n')` instead of `textContent.split('\n')` for splitting code into lines. This is an attempt to better preserve newlines in code blocks that are heavily structured with inline `<span>` elements for syntax highlighting, as `innerText` can better reflect visual line breaks.

### Deprecated

- N/A

### Removed

- N/A

### Fixed

- N/A

### Security

- N/A

### Chore

- N/A

# [1.5.4](https://github.com/BuilderIO/gpt-crawler/compare/v1.5.3...v1.5.4) (YYYY-MM-DD)

### Added

- N/A

### Changed

- N/A

### Deprecated

- N/A

### Removed

- N/A

### Fixed

- Modified `cleanCodeBlocks` in `src/visitPageHelpers.ts` to ensure that empty lines (including those that become empty after prefix removal) are preserved in the output, unless they are specifically the "$ powershell" command line. This fixes an issue where intentional blank lines in code (e.g., in Python) were being removed.

### Security

- N/A

### Chore

- N/A

# [1.5.5](https://github.com/BuilderIO/gpt-crawler/compare/v1.5.4...v1.5.5) (2025-01-07)

### Added

- Added comprehensive `ARCHITECTURE.md` documentation file covering system architecture, component analysis, technology stack, and deployment strategies. Includes detailed analysis of the Turndown package for HTML to Markdown conversion, Mermaid diagrams for system visualization, and complete technical specifications.

### Changed

- N/A

### Deprecated

- N/A

### Removed

- N/A

### Fixed

- N/A

### Security

- N/A

### Chore

- N/A

# [1.5.6](https://github.com/BuilderIO/gpt-crawler/compare/v1.5.5...v1.5.6) (2025-01-07)

### Added

- Added "🌐💼 Job Researcher" custom mode to global custom_modes.yaml configuration. This mode specializes in job market research, company analysis, and role-specific insights with capabilities for creating structured markdown documentation, web browsing for employment research, and advanced search via MCP servers (brave-search and tavily-mcp).

### Changed

- N/A

### Deprecated

- N/A

### Removed

- N/A

### Fixed

- N/A

### Security

- N/A

### Chore

- N/A
