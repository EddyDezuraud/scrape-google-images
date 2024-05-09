"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.scrapeImages = void 0;
const utils_1 = require("./utils");
const cheerio = __importStar(require("cheerio"));
const axios_1 = __importDefault(require("axios"));
const puppeteer_cluster_1 = require("puppeteer-cluster");
const defaultOptions = {
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
const scrapWithPuppeteer = (url, options) => __awaiter(void 0, void 0, void 0, function* () {
    const { page, browser } = yield (0, utils_1.launchBrowserAndOpenPage)(url);
    yield page.goto(url, { waitUntil: 'networkidle0' });
    const button = yield page.$("#L2AGLb");
    if (button) {
        yield button.click();
        yield page.waitForNavigation({
            waitUntil: 'networkidle0',
        });
    }
    yield page.setViewport({ width: 1920, height: 1080 });
    yield (0, utils_1.scrollToEnd)(page);
    // click on every .F0uyec element to open the image preview and get the src of the image preview (img.iPVvYb)
    let elements = yield page.$$('.ob5Hkd');
    if (options && options.random) {
        elements = elements.sort(() => 0.5 - Math.random());
    }
    page.on('console', (msg) => __awaiter(void 0, void 0, void 0, function* () {
        const msgArgs = msg.args();
        for (let i = 0; i < msgArgs.length; ++i) {
            console.log(yield msgArgs[i].jsonValue());
        }
    }));
    const results = [];
    for (let element of elements) {
        if (options.limit && results.length >= options.limit)
            break;
        const imgSrc = yield element.$eval('img', (img) => img.src);
        if (!imgSrc)
            continue;
        if (options.imgType === 'photo' && !(0, utils_1.isPicture)(imgSrc))
            continue;
        element.click();
        yield page.waitForSelector('.RfPPs', { visible: true });
        // await page.waitForNetworkIdle();
        yield (0, utils_1.sleep)(400);
        const src = yield page.evaluate(() => {
            const img = document.querySelector('img.sFlh5c.pT0Scc.iPVvYb');
            const source = document.querySelector('a.Hnk30e.indIKd');
            if (img) {
                return {
                    imgData: '',
                    src: img.src,
                    description: img.getAttribute('aria-label') || img.alt || img.title || '',
                    source: source ? source.href : '',
                    metadata: {}
                };
            }
        });
        if (src && src.src !== '') {
            if (options.metadata || options.imgData) {
                const { metadata, imgBuffer } = yield (0, utils_1.getImageData)(src.src);
                src.imgData = options.imgData ? `data:image/${metadata.format};base64,${imgBuffer.toString('base64')}` : '';
                if (options.metadata && metadata) {
                    src.metadata.width = metadata.width || 0;
                    src.metadata.height = metadata.height || 0;
                    if (metadata.format) {
                        src.metadata.format = metadata.format;
                    }
                }
            }
            results.push(src);
        }
    }
    browser.close();
    return results;
});
const scrapeWithCheerio = (url, options) => __awaiter(void 0, void 0, void 0, function* () {
    const results = [];
    const response = yield axios_1.default.get(url, {
        headers: {
            'User-Agent': (0, utils_1.getUserAgent)()
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
    if (elementsData.length === 0) {
        return [];
    }
    const cluster = yield puppeteer_cluster_1.Cluster.launch({
        concurrency: puppeteer_cluster_1.Cluster.CONCURRENCY_CONTEXT,
        maxConcurrency: 3,
        monitor: false,
    });
    yield cluster.task((_a) => __awaiter(void 0, [_a], void 0, function* ({ page, data }) {
        const googleImageUrl = `https://www.google.com/imgres?docid=${data.docid}&tbnid=${data.tbnid}`;
        yield page.setViewport({ width: 1920, height: 1080 });
        yield page.goto(googleImageUrl, { waitUntil: 'networkidle0' });
        page
            .on('console', message => console.log(`${message.type().substr(0, 3).toUpperCase()} ${message.text()}`));
        // console.log body of the page
        const body = yield page.evaluate(() => document.body.innerHTML);
        console.log('body', body);
        // find a button with class .nCP5yc and click on it
        const button = yield page.evaluate(() => {
            const button = document.querySelector('button');
            // if(button) {
            //     button.click();
            // }
            return button;
        });
        console.log('button', button === null || button === void 0 ? void 0 : button.innerHTML);
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
        return null;
    }));
    for (let i = 0; i < elementsData.length; i++) {
        if (options.limit && results.length >= options.limit)
            break;
        const data = yield cluster.execute(elementsData[i]);
        console.log('data', data);
        if (data) {
            results.push(data);
        }
    }
    yield cluster.idle();
    yield cluster.close();
    if (options.imgData) {
        for (let i = 0; i < results.length; i++) {
            const el = results[i];
            if (el.src) {
                const { metadata, imgBuffer } = yield (0, utils_1.getImageData)(el.src);
                const imgData = `data:image/${metadata.format};base64,${imgBuffer.toString('base64')}`;
                el.metadata.width = metadata.width || 0;
                el.metadata.height = metadata.height || 0;
                el.metadata.format = metadata.format;
                el.imgData = imgData;
            }
        }
    }
    return results;
});
const scrapeImages = (query, options) => __awaiter(void 0, void 0, void 0, function* () {
    if (!query)
        throw new Error('Query is required');
    if (options && options.limit && options.limit > 100)
        throw new Error('Limit must be less than 100');
    const queryOptions = Object.assign(Object.assign({}, defaultOptions), (options || {}));
    query = query.replace(/&/g, '%26');
    const url = `https://www.google.com/search?as_st=y&as_q=${query}&as_epq=&as_oq=&as_eq=&imgsz=${queryOptions.imgSize}&imgar=${queryOptions.imgar}&imgcolor=${queryOptions.imgColor}&imgtype=${queryOptions.imgType}&cr=&as_sitesearch=${queryOptions.siteSearch}&as_filetype=${queryOptions.fileType}&tbs=${queryOptions.rights}&udm=2`;
    if (queryOptions.engine === 'puppeteer') {
        return yield scrapWithPuppeteer(url, queryOptions);
    }
    return yield scrapeWithCheerio(url, queryOptions);
});
exports.scrapeImages = scrapeImages;
//# sourceMappingURL=scraper.js.map