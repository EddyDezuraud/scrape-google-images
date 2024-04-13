import puppeteer from 'puppeteer';
import { sleep, isPicture, scrollToEnd } from './utils';
import { pickOptions } from './types/scraper';

const defaultOptions: pickOptions = {
    limit: 10,
    imgSize: '',
    imgtype: '',
    imgColor: '',
    imgar: '',
    fileType: '',
    safe: false,
    siteSearch: '',
    rights: ''
};

const pick = async (query: string, options: pickOptions) => {

    if(!query) throw new Error('Query is required');
    if(options.limit && options.limit > 100) throw new Error('Limit must be less than 100');

    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    const queryOptions = { ...defaultOptions, ...options };

    const url = `https://www.google.com/search?as_st=y&as_q=${query}&as_epq=&as_oq=&as_eq=&imgsz=${queryOptions.imgSize}&imgar=${queryOptions.imgar}&imgcolor=${queryOptions.imgColor}&imgtype=${queryOptions.imgtype}&cr=&as_sitesearch=${siteSearch}&as_filetype=${queryOptions.imgtype}&tbs=${rights}&udm=2`;

    const results: string[] = [];

    await page.goto(url, { waitUntil: 'networkidle0' });

    const button = await page.$("#L2AGLb");
    if (button) {
      await button.click();
      await page.waitForNavigation({
        waitUntil: 'networkidle0',
      });
    }

    await page.setViewport({ width: 1920, height: 1080 });

    await scrollToEnd(page);


};

export { pick };

