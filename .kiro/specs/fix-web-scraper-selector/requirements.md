# Requirements Document

## Introduction

The gpt-crawler web scraper is currently failing to extract complete content from LibreChat documentation pages despite using the `article` selector. While the selector correctly targets the article element, the scraper is missing critical content including the main heading (h1), section headings (h2), and other important elements that are present within the article tags, resulting in incomplete content extraction.

## Requirements

### Requirement 1

**User Story:** As a developer using gpt-crawler, I want the scraper to correctly identify and extract the main content from targeted documentation pages using the entire <selector.innerHtml> as the starting point for the extraction, so that I can generate comprehensive knowledge files.

#### Acceptance Criteria

1. WHEN the scraper processes a documentation page THEN it SHALL extract the innerHtml content from the chosen selector including headings (h1, h2, h3)
2. WHEN the scraper processes the page THEN it SHALL extract all unordered and ordered lists within the main content
3. WHEN the scraper processes the page THEN it SHALL extract all paragraph text and code blocks
4. WHEN the scraper processes the page THEN it SHALL exclude code that is outside the selector element chosen
5. WHEN the scraper processes the page THEN it SHALL maintain the hierarchical structure of the content

### Requirement 2

**User Story:** As a developer configuring the scraper, I want to use the correct selector that matches the actual HTML structure, so that the content extraction works reliably.

#### Acceptance Criteria

1. WHEN analyzing the current configuration THEN the system SHALL identify that the `article` selector is correctly targeting the main content container
2. WHEN investigating the extraction issue THEN it SHALL determine why content within the article element is not being fully extracted
3. WHEN the scraper processes the article element THEN it SHALL extract all child elements including headings, paragraphs, lists, and code blocks
4. WHEN multiple pages are scraped THEN the extraction SHALL work consistently across different LibreChat documentation pages

### Requirement 3

**User Story:** As a user of the generated knowledge files, I want the scraped content to include all important information from the source pages, so that the knowledge base is complete and useful.

#### Acceptance Criteria

1. WHEN content is extracted THEN it SHALL include the page title (h1 element)
2. WHEN content is extracted THEN it SHALL include all section headings (h2, h3 elements)
3. WHEN content is extracted THEN it SHALL include warning callouts and important notices
4. WHEN content is extracted THEN it SHALL include code examples and configuration snippets
5. WHEN content is extracted THEN it SHALL exclude redundant navigation and UI elements
