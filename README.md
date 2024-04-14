# Scrape Google Images

A TypeScript library for scraping images from Google Images using Puppeteer.

## Installation

To use this library, you'll need Node.js installed on your machine. Then, you can install it via npm:

```bash
npm install scrape-google-images
```

## Usage
```typescript
import { scrapeImages } from 'scrape-google-images';

const query = 'cats';
const options = {
    limit: 10,
    imgSize: 'm',
    imgtype: 'photo',
    imgColor: 'color',
    imgar: 'xw',
    fileType: 'jpg',
    safe: false,
    siteSearch: '',
    rights: '',
    metadata: true,
    imgData: false
};

const images = await scrapeImages(query, options);
```


## Options 
The `pick` function accepts an optional `options` object with the following properties:

| Option       | Type      | Default | Description                                                                               |
| ------------ | --------- | ------- | ----------------------------------------------------------------------------------------- |
| `limit`      | `number`  | `10`    | Maximum number of images to retrieve. (max: 100)                                          |
| `imgSize`    | `string`  | `''`    | Filter images by size (e.g., `'l'`, `'m'`, `'i'`, `'qsvga'`, `'vga'`, `'svga'`, `'xga'`). |
| `imgtype`    | `string`  | `''`    | Filter images by type (e.g., `'clipart'`, `'face'`, `'lineart'`, `'stock'`, `'photo'`).   |
| `imgColor`   | `string`  | `''`    | Filter images by color (e.g., `'mono'`, `'gray'`, `'color'`, `'trans'`).                  |
| `imgar`      | `string`  | `''`    | Filter images by aspect ratio (e.g., `'t'`, `'s'`, `'w'`, `'xw'`)                         |
| `fileType`   | `string`  | `''`    | Filter images by file type (e.g., `'jpg'`, `'gif'`, `'png'`, `'bmp'`, `'svg'`, `'webp'`). |
| `safe`       | `boolean` | `false` | Enable safe search filter.                                                                |
| `siteSearch` | `string`  | `''`    | Search for images from a specific website.                                                |
| `rights`     | `string`  | `''`    | Filter images by usage rights (e.g., `'cl'` for creative commons, `'ol'` for other).      |
| `random`     | `boolean` | `false` | Randomize the order of search results.                                                    |
| `metadata`   | `boolean` | `true`  | Include image metadata in the results.                                                    |
| `imgData`    | `boolean` | `false` | Include base64 image data in the results.                                                 |


## Result 

The `pick` function returns a Promise that resolves to an array of `PickResult` objects, each containing the following properties:

| Property      | Type     | Description                                   |
| ------------- | -------- | --------------------------------------------- |
| `src`         | `string` | The URL of the image.                         |
| `imgData`     | `string` | The base64 image data (if `imgData` is true). |
| `description` | `string` | The image description or alt text.            |
| `source`      | `string` | The URL of the source website.                |
| `metadata`    | `object` | The image metadata (if `metadata` is true).   |

\
The `metadata` object has the following properties:

| Property | Type               | Description              |
| -------- | ------------------ | ------------------------ |
| `width`  | `number`           | The width of the image.  |
| `height` | `number`           | The height of the image. |
| `format` | `sharp.FormatEnum` | The format of the image. |

## Licence
This library is licensed under the MIT License. See the LICENSE file for more information.
