# Project File Tree Structure

This document provides a comprehensive overview of the gpt-crawler project file structure, updated to reflect all current files and directories.

## Root Directory Structure

```
gpt-crawler/
├── ARCHITECTURE.md                     # System architecture documentation
├── CHANGELOG.md                       # Project change log and version history
├── cursor-extensions.txt              # Cursor IDE extensions configuration
├── Dockerfile                         # Docker container configuration
├── eslint.config.js                   # ESLint configuration for code linting
├── example.scrape-config.ts           # Example scraping configuration template
├── extracted_code.json               # Extracted code analysis results
├── FILETREE.md                        # This file - project structure documentation
├── License                            # Project license file
├── package-lock.json                  # NPM dependency lock file
├── package.json                       # NPM package configuration and dependencies
├── README.md                          # Main project documentation
├── scrape-config.ts                   # Main scraping configuration
├── swagger.js                         # Swagger API documentation configuration
├── tsconfig.json                      # TypeScript compiler configuration
├── tsting-scrape-config.ts           # Testing scraping configuration
├── yarn.lock                          # Yarn dependency lock file
├── containerapp/                      # Container application deployment files
│   ├── Dockerfile                     # Container-specific Dockerfile
│   ├── README.md                      # Container deployment documentation
│   ├── run.sh                         # Container startup script
│   ├── scrape-config.ts              # Container scraping configuration
│   └── data/
│       ├── init.sh                    # Data initialization script
│       └── scrape-config.ts          # Data-specific scraping configuration
├── crawled/                           # Directory for crawled content output
├── docs/                              # Project documentation directory
├── example_html/                      # Example HTML files for testing
├── example_html2/                     # Additional example HTML files
├── old_crawled/                       # Archived crawled content
├── reporting/                         # Reporting and analytics files
├── save_output/                       # Saved output files and results
│   ├── cleaned_page_content.html      # Cleaned HTML content
│   ├── DataFormat.md                  # Data format documentation
│   ├── full_page_screenshot.png       # Full page screenshot
│   ├── initial_page_content.html      # Original page content
│   └── initial_page_content copy.html # Backup of original content
├── src/                               # Source code directory
│   ├── backup-crawler-output.ts       # Backup functionality for crawler output
│   ├── cli.ts                         # Command-line interface implementation
│   ├── config.ts                      # Configuration management
│   ├── core.ts                        # Core crawling functionality
│   ├── main.ts                        # Main application entry point
│   ├── markdownHelpers.ts             # Markdown processing utilities
│   ├── server.ts                      # Web server implementation
│   ├── test-code-cleaning.ts          # Code cleaning test utilities
│   ├── test-extract-code.ts           # Code extraction test utilities
│   ├── test-json-extract.ts           # JSON extraction test utilities
│   ├── test-url-cleaning.ts           # URL cleaning test utilities
│   └── visitPageHelpers.ts            # Page visiting helper functions
└── storage/                           # Storage directory for persistent data
```

## External Configuration Files

### Global Custom Modes Configuration
```
c:\Users\Robin\AppData\Roaming\Cursor\User\globalStorage\rooveterinaryinc.roo-cline\settings\custom_modes.yaml
```

This file contains custom mode configurations including the newly added "🌐💼 Job Researcher" mode for job market research and company analysis.

## Key File Categories

### Configuration Files
- `package.json` - Node.js project dependencies and scripts
- `tsconfig.json` - TypeScript compilation settings
- `eslint.config.js` - Code quality and style rules
- `Dockerfile` - Container deployment configuration
- `scrape-config.ts` - Main crawling configuration

### Source Code
- `src/` - All TypeScript source files
- `src/main.ts` - Application entry point
- `src/core.ts` - Core crawling logic
- `src/server.ts` - Web server functionality

### Documentation
- `README.md` - Primary project documentation
- `ARCHITECTURE.md` - Technical architecture details
- `CHANGELOG.md` - Version history and changes
- `FILETREE.md` - This file structure documentation

### Output and Data
- `crawled/` - Crawled content storage
- `save_output/` - Processed output files
- `storage/` - Persistent data storage
- `reporting/` - Analytics and reporting data

### Testing and Examples
- `example.scrape-config.ts` - Configuration templates
- `example_html/` - Test HTML content
- `src/test-*.ts` - Test utility files

## Recent Changes

- Added comprehensive project structure documentation
- Integrated "🌐💼 Job Researcher" custom mode for employment research
- Enhanced documentation with architectural details

---

*Last Updated: 2025-01-07*
*Version: 1.5.6*