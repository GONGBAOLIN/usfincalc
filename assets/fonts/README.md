# Self-hosted fonts

These `.woff2` binaries are **not** committed yet — download them once and drop
them here. The site uses the system fallback stack until they exist, so nothing
breaks in the meantime.

| File | Weight | Source |
|---|---|---|
| `inter-regular.woff2` | 400 | https://github.com/rsms/inter (OFL) |
| `inter-medium.woff2` | 500 | same |
| `inter-semibold.woff2` | 600 | same |
| `inter-bold.woff2` | 700 | same |
| `dmserifdisplay-regular.woff2` | 400 | https://fonts.google.com/specimen/DM+Serif+Display (OFL) |

## How to generate

1. Download the Inter web package and the DM Serif Display TTF.
2. Subset to **Latin** and convert to woff2 (e.g. with `fonttools` /
   `glyphhanger`, or https://gwfh.mranftl.com/fonts for a quick subset+woff2).
3. Name the files exactly as above and place them in this folder.
4. Target total payload ~40–60KB.

`@font-face` declarations live in `/assets/css/fonts.css`. Preload the two most
critical faces (Inter 400, DM Serif 400) in each page `<head>`:

```html
<link rel="preload" href="/assets/fonts/inter-regular.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/assets/fonts/dmserifdisplay-regular.woff2" as="font" type="font/woff2" crossorigin>
```

Do **not** load fonts from the Google Fonts CDN — master context requires zero
external calls.
