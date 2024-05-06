import { FormatEnum } from 'sharp';
import { isPicture, scrollToEnd, launchBrowserAndOpenPage, getImageData, sleep } from './utils';
import { PickOptions, PickResult } from './types/scraper';

const defaultOptions: PickOptions = {
    limit: 10,
    imgSize: '',
    imgtype: '',
    imgColor: '',
    imgar: '',
    fileType: '',
    safe: false,
    siteSearch: '',
    rights: '',
    metadata: true,
    imgData: false
};

const scrapeImages = async (query: string, options?: PickOptions): Promise<PickResult[]> => {
    if (!query) throw new Error('Query is required');
    if (options && options.limit && options.limit > 100) throw new Error('Limit must be less than 100');

    const queryOptions = { ...defaultOptions, ...(options || {}) };

    const url = `https://www.google.com/search?as_st=y&as_q=${query}&as_epq=&as_oq=&as_eq=&imgsz=${queryOptions.imgSize}&imgar=${queryOptions.imgar}&imgcolor=${queryOptions.imgColor}&imgtype=${queryOptions.imgtype}&cr=&as_sitesearch=${queryOptions.siteSearch}&as_filetype=${queryOptions.imgtype}&tbs=${queryOptions.rights}&udm=2`;

    const {page, browser} = await launchBrowserAndOpenPage(url);

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

    // click on every .F0uyec element to open the image preview and get the src of the image preview (img.iPVvYb)
    let elements = await page.$$('.ob5Hkd');

    if (options && options.random) {
        elements = elements.sort(() => 0.5 - Math.random());
    }

    page.on('console', async (msg) => {
        const msgArgs = msg.args();
        for (let i = 0; i < msgArgs.length; ++i) {
          console.log(await msgArgs[i].jsonValue());
        }
    });

    const results: PickResult[] = [];

    for (let element of elements) {
        if (queryOptions.limit && results.length >= queryOptions.limit) break;

        const imgSrc = await element.$eval('img', (img: HTMLImageElement) => img.src);

        if(!imgSrc) continue;
        if(queryOptions.imgtype === 'photo' && !isPicture(imgSrc)) continue;


        element.click();
        await page.waitForSelector('.RfPPs', { visible: true });
        // await page.waitForNetworkIdle();
        await sleep(400);

        const src = await page.evaluate(() => {
            const img = document.querySelector('img.sFlh5c.pT0Scc.iPVvYb') as HTMLImageElement;
            const source = document.querySelector('a.Hnk30e.indIKd') as HTMLAnchorElement;

            if(img) {
                return {
                    imgData: '',
                    src: img.src,
                    description: img.getAttribute('aria-label') || img.alt || img.title || '',
                    source: source ? source.href : '',
                    metadata: {}
                };
            }
        }) as PickResult;


        if (src && src.src !== '') {
            if (queryOptions.metadata || queryOptions.imgData) {
                const {metadata, imgBuffer} = await getImageData(src.src);

                src.imgData = queryOptions.imgData ? `data:image/${metadata.format};base64,${imgBuffer.toString('base64')}` : '';

                if (queryOptions.metadata && metadata) {
                    src.metadata.width = metadata.width || 0;
                    src.metadata.height = metadata.height || 0;
                    if (metadata.format) {
                        src.metadata.format = metadata.format as unknown as FormatEnum;
                    }
                }
            }

            results.push(src);
        }
        
    }

    browser.close();
    
    return results;
};

export { scrapeImages };

