## SpecStory

## Node.js Module Import Error Troubleshooting (1/26/2025, 9:13:40 AM)

_**User**_

```
❯ node iconlist.js
node:internal/modules/run_main:122
    triggerUncaughtException(
    ^

Error [ERR_MODULE_NOT_FOUND]: Cannot find module 'D:\projects\gpt-crawler\node_modules\lodash\snakeCase' imported from D:\projects\gpt-crawler\iconlist.js
Did you mean to import "lodash/snakeCase.js"?
    at finalizeResolution (node:internal/modules/esm/resolve:275:11)
    at moduleResolve (node:internal/modules/esm/resolve:932:10)
    at defaultResolve (node:internal/modules/esm/resolve:1056:11)
    at ModuleLoader.defaultResolve (node:internal/modules/esm/loader:654:12)
    at #cachedDefaultResolve (node:internal/modules/esm/loader:603:25)
    at ModuleLoader.resolve (node:internal/modules/esm/loader:586:38)
    at ModuleLoader.getModuleJobForImport (node:internal/modules/esm/loader:242:38)
    at ModuleJob._link (node:internal/modules/esm/module_job:135:49) {
  code: 'ERR_MODULE_NOT_FOUND',
  url: 'file:///D:/projects/gpt-crawler/node_modules/lodash/snakeCase'
}

Node.js v22.12.0
```

```
npm i lodash.snakecase
npm i @mui/icons-material
```

why the error, i have installed the module (i think) have i named the file wrong?

---

_**Assistant**_

The error is occurring because of how ES modules handle imports from `lodash`. There are a couple of ways to fix this:

1. Either use the standalone `lodash.snakecase` package you installed:

```javascript:iconlist.js
import snakeCase from "lodash.snakecase";
import * as Icons from "@mui/icons-material";

// ... rest of the code stays the same ...
```

OR

2. If you want to use the full lodash package, you'll need to add the `.js` extension when importing from lodash submodules:

```javascript:iconlist.js
import snakeCase from "lodash/snakeCase.js";
import * as Icons from "@mui/icons-material";

// ... rest of the code stays the same ...
```

The error occurs because Node.js ES modules require explicit file extensions when importing from packages that don't specify exports in their package.json. The standalone `lodash.snakecase` package is probably the simpler solution here since you're only using that one function.

Also, make sure your package.json has `"type": "module"` if you're using ES module imports (with the `import` syntax), or rename the file to `iconlist.mjs` to indicate it's an ES module.

---

_**User**_

?

---

_**Assistant**_

This error occurs because Node.js is trying to open too many files simultaneously when importing all icons from `@mui/icons-material`. The Material UI icons package contains hundreds of icons, and importing them all at once is causing the system to exceed its file descriptor limit.

Here's a modified version of the script that will handle the imports more efficiently:

```javascript:iconlist.js
import fs from 'fs/promises';
import path from 'path';
import snakeCase from "lodash/snakeCase.js";

const iconStyles = ["Filled", "Outlined", "Rounded", "TwoTone", "Sharp"];

// Get the directory path for @mui/icons-material/esm
const iconsDir = path.resolve('./node_modules/@mui/icons-material/esm');

async function getIconList() {
  // Read all files in the directory
  const files = await fs.readdir(iconsDir);

  // Filter out the style variants and get just the base names
  const iconNames = files
    .filter(file => file.endsWith('.js'))
    .map(file => file.replace('.js', ''))
    .filter(name => !iconStyles.some(style => name.endsWith(style)))
    .map(name => snakeCase(name));

  console.log(JSON.stringify(iconNames));
}

getIconList().catch(console.error);
```

This version:

1. Reads the icon files directly from the directory instead of importing them all
2. Filters out the style variants
3. Converts the names to snake case
4. Avoids the "too many open files" error by not actually importing the icon modules

This should work much better and avoid the file descriptor limit issue while still giving you the same output.

---

_**User**_

what about generating a page that displays the icons, and the snake_case name in a grid

---

_**Assistant**_

I'll help you create an HTML page that displays the icons along with their snake_case names in a grid. We'll need to modify the script to generate an HTML file:

```javascript:iconlist.js
import fs from 'fs/promises';
import path from 'path';
import snakeCase from "lodash/snakeCase.js";

const iconStyles = ["Filled", "Outlined", "Rounded", "TwoTone", "Sharp"];
const iconsDir = path.resolve('./node_modules/@mui/icons-material/esm');

async function generateIconPage() {
  const files = await fs.readdir(iconsDir);

  const iconNames = files
    .filter(file => file.endsWith('.js'))
    .map(file => file.replace('.js', ''))
    .filter(name => !iconStyles.some(style => name.endsWith(style)));

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <title>Material UI Icons Reference</title>
    <link rel="stylesheet" href="https://fonts.googleapis.com/icon?family=Material+Icons">
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cant

---



---

```
