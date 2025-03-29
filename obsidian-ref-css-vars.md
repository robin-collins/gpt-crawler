## CSS variables - Developer Documentation

URL: https://docs.obsidian.md/Reference/CSS+variables/CSS+variables

CSS variables - Developer Documentation

##### Foundations

Abstracted variables for colors, spacing, typography and more

- [Borders](https://docs.obsidian.md/Reference/CSS+variables/Foundations/Borders)
- [Colors](https://docs.obsidian.md/Reference/CSS+variables/Foundations/Colors)
- [Cursor](https://docs.obsidian.md/Reference/CSS+variables/Foundations/Cursor)
- [Icons](https://docs.obsidian.md/Reference/CSS+variables/Foundations/Icons)
- [Layers](https://docs.obsidian.md/Reference/CSS+variables/Foundations/Layers)
- [Radiuses](https://docs.obsidian.md/Reference/CSS+variables/Foundations/Radiuses)
- [Spacing](https://docs.obsidian.md/Reference/CSS+variables/Foundations/Spacing)
- [Typography](https://docs.obsidian.md/Reference/CSS+variables/Foundations/Typography)

##### Components

Interactive components used throughout the app

- [Button](https://docs.obsidian.md/Reference/CSS+variables/Components/Button)
- [Checkbox](https://docs.obsidian.md/Reference/CSS+variables/Components/Checkbox)
- [Color input](https://docs.obsidian.md/Reference/CSS+variables/Components/Color+input)
- [Dialog](https://docs.obsidian.md/Reference/CSS+variables/Components/Dialog)
- [Dragging](https://docs.obsidian.md/Reference/CSS+variables/Components/Dragging)
- [Indentation guides](https://docs.obsidian.md/Reference/CSS+variables/Components/Indentation+guides)
- [Modal](https://docs.obsidian.md/Reference/CSS+variables/Components/Modal)
- [Multi-select](https://docs.obsidian.md/Reference/CSS+variables/Components/Multi-select)
- [Navigation](https://docs.obsidian.md/Reference/CSS+variables/Components/Navigation)
- [Popover](https://docs.obsidian.md/Reference/CSS+variables/Components/Popover)
- [Slider](https://docs.obsidian.md/Reference/CSS+variables/Components/Slider)
- [Tabs](https://docs.obsidian.md/Reference/CSS+variables/Components/Tabs)
- [Text input](https://docs.obsidian.md/Reference/CSS+variables/Components/Text+input)
- [Toggle](https://docs.obsidian.md/Reference/CSS+variables/Components/Toggle)

##### Editor

Content types and variables used for editing and reading text files

- [Block](https://docs.obsidian.md/Reference/CSS+variables/Editor/Block)
- [Blockquote](https://docs.obsidian.md/Reference/CSS+variables/Editor/Blockquote)
- [Callout](https://docs.obsidian.md/Reference/CSS+variables/Editor/Callout)
- [Code](https://docs.obsidian.md/Reference/CSS+variables/Editor/Code)
- [Embed](https://docs.obsidian.md/Reference/CSS+variables/Editor/Embed)
- [File](https://docs.obsidian.md/Reference/CSS+variables/Editor/File)
- [Footnote](https://docs.obsidian.md/Reference/CSS+variables/Editor/Footnote)
- [Headings](https://docs.obsidian.md/Reference/CSS+variables/Editor/Headings)
- [Horizontal rule](https://docs.obsidian.md/Reference/CSS+variables/Editor/Horizontal+rule)
- [Inline title](https://docs.obsidian.md/Reference/CSS+variables/Editor/Inline+title)
- [Link](https://docs.obsidian.md/Reference/CSS+variables/Editor/Link)
- [List](https://docs.obsidian.md/Reference/CSS+variables/Editor/List)
- [Properties](https://docs.obsidian.md/Reference/CSS+variables/Editor/Properties)
- [Table](https://docs.obsidian.md/Reference/CSS+variables/Editor/Table)
- [Tag](https://docs.obsidian.md/Reference/CSS+variables/Editor/Tag)

##### Plugins

Variables related to interface elements in core plugins

- [Canvas](https://docs.obsidian.md/Reference/CSS+variables/Plugins/Canvas)
- [File explorer](https://docs.obsidian.md/Reference/CSS+variables/Plugins/File+explorer)
- [Graph](https://docs.obsidian.md/Reference/CSS+variables/Plugins/Graph)
- [Search](https://docs.obsidian.md/Reference/CSS+variables/Plugins/Search)

##### Window

Variables related to the window chrome for the Obsidian app

- [Divider](https://docs.obsidian.md/Reference/CSS+variables/Window/Divider)
- [Ribbon](https://docs.obsidian.md/Reference/CSS+variables/Window/Ribbon)
- [Scrollbar](https://docs.obsidian.md/Reference/CSS+variables/Window/Scrollbar)
- [Status bar](https://docs.obsidian.md/Reference/CSS+variables/Window/Status+bar)
- [Window frame](https://docs.obsidian.md/Reference/CSS+variables/Window/Window+frame)
- [Workspace](https://docs.obsidian.md/Reference/CSS+variables/Window/Workspace)

##### Obsidian Publish

Variables for Obsidian Publish sites

- [Site fonts](https://docs.obsidian.md/Reference/CSS+variables/Publish/Site+fonts)
- [Site header](https://docs.obsidian.md/Reference/CSS+variables/Publish/Site+header)
- [Site navigation](https://docs.obsidian.md/Reference/CSS+variables/Publish/Site+navigation)
- [Site components](https://docs.obsidian.md/Reference/CSS+variables/Publish/Site+components)
- [Site sidebars](https://docs.obsidian.md/Reference/CSS+variables/Publish/Site+sidebars)
- [Site pages](https://docs.obsidian.md/Reference/CSS+variables/Publish/Site+pages)

---

## Colors - Developer Documentation

URL: https://docs.obsidian.md/Reference/CSS+variables/Foundations/Colors

Colors - Developer Documentation

The Obsidian color palette defines a range of colors used in the app.

###### Base colors

The base colors is a neutral color palette ranging from light to dark. These values should typically only be defined by themes.

| Variable           | Default value (light mode) | Default value (dark mode) |
| ------------------ | -------------------------- | ------------------------- |
| `--color-base-00`  | `#ffffff`                  | `#1e1e1e`                 |
| `--color-base-05`  | `#fcfcfc`                  | `#212121`                 |
| `--color-base-10`  | `#fafafa`                  | `#242424`                 |
| `--color-base-20`  | `#f6f6f6`                  | `#262626`                 |
| `--color-base-25`  | `#e3e3e3`                  | `#2a2a2a`                 |
| `--color-base-30`  | `#e0e0e0`                  | `#363636`                 |
| `--color-base-35`  | `#d4d4d4`                  | `#3f3f3f`                 |
| `--color-base-40`  | `#bdbdbd`                  | `#555555`                 |
| `--color-base-50`  | `#ababab`                  | `#666666`                 |
| `--color-base-60`  | `#707070`                  | `#999999`                 |
| `--color-base-70`  | `#5a5a5a`                  | `#bababa`                 |
| `--color-base-100` | `#222222`                  | `#dadada`                 |

###### Accent color

The accent color is used to draw attention to interactive elements, such as links and primary buttons, and can be overridden by the user under **Settings → Appearance** in the Obsidian app.

| Variable     | Default value | Description       |
| ------------ | ------------- | ----------------- |
| `--accent-h` | `254`         | Accent hue        |
| `--accent-s` | `80%`         | Accent saturation |
| `--accent-l` | `68%`         | Accent lightness  |

You can use [CSS calculations](https://developer.mozilla.org/en-US/docs/Web/CSS/calc) to create a variety of shades based on the accent color.

###### Extended colors

Extended color variables define the broader range of colors used for status messages (errors, warnings, success), callouts, syntax highlighting, graph nodes, and Canvas elements.

Each extended color has an additional RGB variable with a `-rgb` suffix that you can use to create colors with opacity, using the `rgba` function.

For example, the following snippet uses the default variable to set the text color, and the RGB variable to set a background color to red with 20% opacity.

```
color: var(--color-red);
background-color: rgba(var(--color-red-rgb), 0.2);
```

| Variable             | Default value (light mode) | Default value (dark mode) |
| -------------------- | -------------------------- | ------------------------- |
| `--color-red`        | `#e93147`                  | `#fb464c`                 |
| `--color-orange`     | `#ec7500`                  | `#e9973f`                 |
| `--color-yellow`     | `#e0ac00`                  | `#e0de71`                 |
| `--color-green`      | `#08b94e`                  | `#44cf6e`                 |
| `--color-cyan`       | `#00bfbc`                  | `#53dfdd`                 |
| `--color-blue`       | `#086ddd`                  | `#027aff`                 |
| `--color-purple`     | `#7852ee`                  | `#a882ff`                 |
| `--color-pink`       | `#d53984`                  | `#fa99cd`                 |
| `--color-red-rgb`    | `233, 49, 71`              | `251, 70, 76`             |
| `--color-orange-rgb` | `236, 117, 0`              | `233, 151, 63`            |
| `--color-yellow-rgb` | `224, 172, 0`              | `224, 222, 113`           |
| `--color-green-rgb`  | `8, 185, 78`               | `68, 207, 110`            |
| `--color-cyan-rgb`   | `0, 191, 188`              | `83, 223, 221`            |
| `--color-blue-rgb`   | `8, 109, 221`              | `2, 122, 255`             |
| `--color-purple-rgb` | `120, 82, 238`             | `168, 130, 255`           |
| `--color-pink-rgb`   | `213, 57, 132`             | `250, 153, 205`           |

###### Black and white

Black and white colors let you create masks with opacity.

| Variable         | Default value (light mode) | Default value (dark mode) |
| ---------------- | -------------------------- | ------------------------- |
| `--mono-rgb-0`   | `255, 255, 255`            | `0, 0, 0`                 |
| `--mono-rgb-100` | `0, 0, 0`                  | `255, 255, 255`           |

Avoid changing the value of black and white variables.

###### Semantic colors

Semantic colors are derived from the base color palette based on their intended use.

###### Surface colors

Primary background

Alt. primary background

Secondary background

Alt. secondary background

| Variable                             | Description                                            |
| ------------------------------------ | ------------------------------------------------------ |
| `--background-primary`               | Primary background                                     |
| `--background-primary-alt`           | Background for surfaces on top of primary background   |
| `--background-secondary`             | Secondary background                                   |
| `--background-secondary-alt`         | Background for surfaces on top of secondary background |
| `--background-modifier-hover`        | Hovered elements                                       |
| `--background-modifier-active-hover` | Active hovered elements                                |
| `--background-modifier-border`       | Border color                                           |
| `--background-modifier-border-hover` | Border color (hover)                                   |
| `--background-modifier-border-focus` | Border color (focus)                                   |
| `--background-modifier-error-rgb`    | Error background, RGB value                            |
| `--background-modifier-error`        | Error background                                       |
| `--background-modifier-error-hover`  | Error background (hover)                               |
| `--background-modifier-success-rgb`  | Success background, RGB value                          |
| `--background-modifier-success`      | Success background                                     |
| `--background-modifier-message`      | Messages background                                    |
| `--background-modifier-form-field`   | Form field background                                  |

###### Interactive colors

| Variable                     | Description                                          |
| ---------------------------- | ---------------------------------------------------- |
| `--interactive-normal`       | Background for standard interactive elements         |
| `--interactive-hover`        | Background for standard interactive elements (hover) |
| `--interactive-accent`       | Background for accented interactive elements         |
| `--interactive-accent-hsl`   | Background for accented interactive elements in HSL  |
| `--interactive-accent-hover` | Background for accented interactive elements (hover) |

##### Text colors

###### Text foreground colors

| Variable                    | Description                                    |
| --------------------------- | ---------------------------------------------- |
| `--text-normal`             | Normal text                                    |
| `--text-muted`              | Muted text                                     |
| `--text-faint`              | Faint text                                     |
| `--text-on-accent`          | Text on accent background when accent is dark  |
| `--text-on-accent-inverted` | Text on accent background when accent is light |
| `--text-success`            | Success text                                   |
| `--text-warning`            | Warning text                                   |
| `--text-error`              | Error text                                     |
| `--text-accent`             | Accent text                                    |
| `--text-accent-hover`       | Accent text (hover)                            |

###### Text background colors

| Variable              | Description                 |
| --------------------- | --------------------------- |
| `--text-selection`    | Selected text background    |
| `--text-highlight-bg` | Highlighted text background |

###### Caret color

Defines the color of the caret, the blinking text entry cursor.

| Variable        | Description |
| --------------- | ----------- |
| `--caret-color` | Caret color |

---

## Checkbox - Developer Documentation

URL: https://docs.obsidian.md/Reference/CSS+variables/Components/Checkbox

Checkbox - Developer Documentation

This page lists CSS variables for checkboxes and text inside of task lists.

###### CSS variables

| Variable                         | Description                       |
| -------------------------------- | --------------------------------- |
| `--checkbox-radius`              | Radius                            |
| `--checkbox-size`                | Height and width                  |
| `--checkbox-marker-color`        | Marker color for the check itself |
| `--checkbox-color`               | Background color                  |
| `--checkbox-color-hover`         | Background color (hover)          |
| `--checkbox-border-color`        | Unchecked border color            |
| `--checkbox-border-color-hover`  | Unchecked border color (hover)    |
| `--checklist-done-decoration`    | Checked text decoration           |
| `--checklist-done-color`         | Checked text color                |
| `--checkbox-margin-inline-start` | `start` margin                    |

---
