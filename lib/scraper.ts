import sharp, { FormatEnum } from 'sharp';
import { sleep, isPicture, scrollToEnd, launchBrowserAndOpenPage, getImageData } from './utils';
import { PickOptions, PickResult } from './types/scraper';
import { ElementHandle } from 'puppeteer';

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

const pick = async (query: string, options?: PickOptions): Promise<PickResult[]> => {
    if (!query) throw new Error('Query is required');
    if (options && options.limit && options.limit > 100) throw new Error('Limit must be less than 100');

    const queryOptions = { ...defaultOptions, ...(options || {}) };

    const url = `https://www.google.com/search?as_st=y&as_q=${query}&as_epq=&as_oq=&as_eq=&imgsz=${queryOptions.imgSize}&imgar=${queryOptions.imgar}&imgcolor=${queryOptions.imgColor}&imgtype=${queryOptions.imgtype}&cr=&as_sitesearch=${queryOptions.siteSearch}&as_filetype=${queryOptions.imgtype}&tbs=${queryOptions.rights}&udm=2`;

    const results: PickResult[] = [];

    const page = await launchBrowserAndOpenPage(url);

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
    let elements = await page.$$('.F0uyec');

    if (options && options.random) {
        elements = elements.sort(() => 0.5 - Math.random());
    }

    if (queryOptions && queryOptions.imgtype === 'photo') {
        const photosElements: ElementHandle[] = [];

        for (let element of elements) {


            const imgSrc = await element.$eval('img', (img: HTMLImageElement) => {

                return {
                    imgData: '',
                    src: img.src,
                    description: img.getAttribute('aria-label') || img.alt || img.title || '',
                    metadata: {}
                };
            }) as PickResult;

            if (imgSrc && await isPicture(imgSrc.src)) {
                photosElements.push(element);
                if (photosElements.length >= (queryOptions.limit || 10)) {
                    break;
                }
            }
        }

        elements = photosElements;
    } else {
        elements = elements.slice(0, queryOptions.limit || 10);
    }

    let index = 0;

    // page.on('console', async (msg) => {
    //     const msgArgs = msg.args();
    //     for (let i = 0; i < msgArgs.length; ++i) {
    //       console.log(await msgArgs[i].jsonValue());
    //     }
    //   });

    for (const element of elements) {

        index = index + 1;
            
        await Promise.all([
            page.waitForNetworkIdle(),
            element.click(),
        ])

        const src = await page.evaluate(() => {

            const img = document.querySelector('img.iPVvYb') as HTMLImageElement;

            const source = document.querySelector('a.Hnk30e.indIKd') as HTMLAnchorElement;

            if (!img) {
                return {
                    imgData: '',
                    src: '',
                    description: '',
                    source: '',
                    metadata: {}
                };
            }

            return {
                imgData: '',
                src: img.src,
                description: img.getAttribute('aria-label') || img.alt || img.title || '',
                source: source ? source.href : '',
                metadata: {}
            };
        }) as PickResult;

        
        if (src.src !== '') {
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
    return results;
};

export { pick };

