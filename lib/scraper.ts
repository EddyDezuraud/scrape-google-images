import { FormatEnum } from 'sharp';
import { isPicture, scrollToEnd, launchBrowserAndOpenPage, getImageData, sleep, getUserAgent } from './utils';
import { PickOptions, PickResult } from './types/scraper';
import * as cheerio from 'cheerio';
import axios from 'axios';
import { Cluster } from 'puppeteer-cluster';

const defaultOptions: PickOptions = {
    limit: 10,
    imgSize: '',
    imgType: '',
    imgColor: '',
    imgar: '',
    fileType: '',
    safe: false,
    siteSearch: '',
    rights: '',
    metadata: true,
    imgData: false,
    engine: 'pupeeteer'
};

const scrapWithPuppeteer = async (url: string, options: PickOptions): Promise<PickResult[]> => {

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
        if (options.limit && results.length >= options.limit) break;

        const imgSrc = await element.$eval('img', (img: HTMLImageElement) => img.src);

        if(!imgSrc) continue;
        if(options.imgType === 'photo' && !isPicture(imgSrc)) continue;


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
            if (options.metadata || options.imgData) {
                const {metadata, imgBuffer} = await getImageData(src.src);

                src.imgData = options.imgData ? `data:image/${metadata.format};base64,${imgBuffer.toString('base64')}` : '';

                if (options.metadata && metadata) {
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
}


const scrapeWithCheerio = async (url: string, options: PickOptions): Promise<PickResult[]> => {

    const results: PickResult[] = [];

    const response = await axios.get(url, {
        headers: {
            'User-Agent': getUserAgent()
        }
    });

    const $ = cheerio.load(response.data);
    // make an array of all .eA0Zlc elements and push an object with attributes data-lpage, data-ref-docid, data-docid
    const elements = Array.from($('.eA0Zlc'));

    if (options.random) {
        elements.sort(() => 0.5 - Math.random());
    }

    const elementsData = elements.slice(0, options.limit).map((element) => {
        return {
            lpage: $(element).attr('data-lpage'),
            docid: $(element).attr('data-ref-docid'),
            tbnid: $(element).attr('data-docid')
        };
    });

    if(elementsData.length === 0) {
        return [];
    }

    const cluster = await Cluster.launch({
        concurrency: Cluster.CONCURRENCY_CONTEXT,
        maxConcurrency: 3,
        monitor: false,
    });

    await cluster.task(async ({ page, data }) => {

        const googleImageUrl = `https://www.google.com/imgres?docid=${data.docid}&tbnid=${data.tbnid}`;

        await page.setViewport({width: 1920, height: 1080});

        await page.goto(googleImageUrl, { waitUntil: 'networkidle0' });

        page
            .on('console', message => console.log(`${message.type().substr(0, 3).toUpperCase()} ${message.text()}`))

        // console.log body of the page
        const body = await page.evaluate(() => document.body.innerHTML);

        console.log('body', body);

        // find a button with class .nCP5yc and click on it

        const button = await page.evaluate(() => {
            const button = document.querySelector('button') as HTMLButtonElement;

            // if(button) {
            //     button.click();
            // }

            return button;
        });

        console.log('button', button?.innerHTML);

        // if (button) {
        //     await button.click();
        //     await page.waitForNavigation({
        //         waitUntil: 'networkidle0',
        //     });
        // }

        // const src = await page.evaluate(() => {
        //     const img = document.querySelector('.p7sI2 .sFlh5c') as HTMLImageElement;

        //     console.log('img', img);

        //     if(img) {
        //         return {
        //             imgData: '',
        //             src: img.src,
        //             description: img.alt || img.title || '',
        //             source: data.lpage,
        //             metadata: {
        //                 width: 0,
        //                 height: 0
        //             }
        //         };
        //     }

        //     return null;
        // }) 

        // return src

        return null
    });

    
    for(let i = 0; i < elementsData.length; i++) {
        if (options.limit && results.length >= options.limit) break;
        const data = await cluster.execute(elementsData[i]);

        console.log('data', data);

        if(data) {
            results.push(data);
        }
    }

    await cluster.idle();
    await cluster.close();

    if(options.imgData) {
        for(let i = 0; i < results.length; i++) {

            const el = results[i];
    
            if(el.src) {
                const {metadata, imgBuffer} = await getImageData(el.src);
    
                const imgData = `data:image/${metadata.format};base64,${imgBuffer.toString('base64')}`;
    
                el.metadata.width = metadata.width || 0;
                el.metadata.height = metadata.height || 0;
                el.metadata.format = metadata.format as unknown as FormatEnum;
                el.imgData = imgData;
            }
           
        }
    }
    
    return results;
}

const scrapeImages = async (query: string, options?: PickOptions): Promise<PickResult[]> => {
    if (!query) throw new Error('Query is required');
    if (options && options.limit && options.limit > 100) throw new Error('Limit must be less than 100');

    const queryOptions = { ...defaultOptions, ...(options || {}) };
    query = query.replace(/&/g, '%26');

    const url = `https://www.google.com/search?as_st=y&as_q=${query}&as_epq=&as_oq=&as_eq=&imgsz=${queryOptions.imgSize}&imgar=${queryOptions.imgar}&imgcolor=${queryOptions.imgColor}&imgtype=${queryOptions.imgType}&cr=&as_sitesearch=${queryOptions.siteSearch}&as_filetype=${queryOptions.fileType}&tbs=${queryOptions.rights}&udm=2`;

    
    if(queryOptions.engine === 'puppeteer') {
        return await scrapWithPuppeteer(url, queryOptions);
    }

    return await scrapeWithCheerio(url, queryOptions);
};

export { scrapeImages };

