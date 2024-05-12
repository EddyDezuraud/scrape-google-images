import sharp from 'sharp';
import { Page} from 'puppeteer';
import puppeteer from 'puppeteer-extra';

import StealthPlugin from 'puppeteer-extra-plugin-stealth'

const getUserAgent = () => {
  const agents = [
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
    ]

  const index = Math.floor(Math.random() * agents.length);
  return agents[index]
}
const launchBrowserAndOpenPage = async (url: string) => {
  puppeteer.use(StealthPlugin())

  const browser = await puppeteer.launch(
    {
      headless: true
    }
  );
  const page = await browser.newPage();

  await page.goto(url);

  return {browser, page};
}

const isScrollable = async (page: Page) => {
  return page.evaluate(() => {
      return document.querySelector("#islmp input[type='button']") !== null;
    });
};

const isButtonVisible = async (page: Page) => {
  return page.evaluate(() => {
      function isVisible(e: HTMLElement) {
          return !!(e.offsetWidth || e.offsetHeight || e.getClientRects().length);
      }
      const button = document.querySelector("#islmp input[type='button']");
      return button ? isVisible(button as HTMLElement) : false;
  });
};

const scrollToEnd = async (page: Page) => {
  const isScroll = await isScrollable(page);

  if (!isScroll) {
      return;
  }

  return await isButtonVisible(page)
};

const getImageData = async (imgSrc: string): Promise<{ metadata: sharp.Metadata, imgBuffer: Buffer }> => {
  try {
    let imgBuffer = Buffer.from(imgSrc, 'base64');

    // deal with url images and base64 images
    if (imgSrc.startsWith('http')) {
      const response = await fetch(imgSrc);
      const buffer = await response.arrayBuffer();
      imgBuffer = Buffer.from(buffer);
    } else if (imgSrc.startsWith('data:image')) {
      const uri = imgSrc.split(';base64,').pop();
      if (!uri) {
        throw new Error('Invalid base64 image');
      }
      imgBuffer = Buffer.from(uri, 'base64');
    }

    const metadata = await sharp(imgBuffer).metadata();

    return {metadata, imgBuffer}
    
  } catch (err) {
    console.error(imgSrc, err);
    throw err;
  }
};

const isPicture = async (imgSrc: string) => {
    // analyser si l'image est une photo ou non en se basant sur le contenu de l'image nombre de couleurs, etc.
    try {
  
      let imgBuffer = Buffer.from(imgSrc, 'base64');
  
      if (imgSrc.startsWith('data:image')) {
        const uri = imgSrc.split(';base64,').pop();
  
        if (!uri) {
          throw new Error('Invalid base64 image');
        }
    
        imgBuffer = Buffer.from(uri, 'base64');
      } else {
        // check if the image is supported image format
        const supportedFormats = ['jpeg', 'webp', '.jpg'];
        const format = imgSrc.split('.').pop();
        if (!format || !supportedFormats.includes(format)) {
          console.error('Unsupported image format');
          return false;
        }
      }
  
      const { data, info } = await sharp(imgBuffer)
        .raw()
        .toBuffer({ resolveWithObject: true });
  
      const width = info.width;
      const height = info.height;
  
      const uniqueColorsRow = new Set();
      const uniqueColorsColumn = new Set();
  
      for (let i = 0; i < width * 4; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        uniqueColorsRow.add(`${r},${g},${b}`);
      }
  
      for (let i = 0; i < height * width * 4; i += width * 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        uniqueColorsColumn.add(`${r},${g},${b}`);
      }
  
      const limitColors = 50;
  
      if (uniqueColorsRow.size < limitColors && uniqueColorsColumn.size < limitColors) {
        return false;
      } else {
        return true;
      }
    } catch (err) {
      console.error(imgSrc, err);
      throw err;
    }
}

const sleep = (ms: number) => new Promise(res => setTimeout(res, ms));

export {
    isPicture,
    sleep,
    scrollToEnd,
    launchBrowserAndOpenPage,
    getImageData,
    getUserAgent
};
