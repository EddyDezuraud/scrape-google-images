"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.scrapeImages = void 0;
const utils_1 = require("./utils");
const defaultOptions = {
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
const scrapeImages = (query, options) => __awaiter(void 0, void 0, void 0, function* () {
    if (!query)
        throw new Error('Query is required');
    if (options && options.limit && options.limit > 100)
        throw new Error('Limit must be less than 100');
    const queryOptions = Object.assign(Object.assign({}, defaultOptions), (options || {}));
    const url = `https://www.google.com/search?as_st=y&as_q=${query}&as_epq=&as_oq=&as_eq=&imgsz=${queryOptions.imgSize}&imgar=${queryOptions.imgar}&imgcolor=${queryOptions.imgColor}&imgtype=${queryOptions.imgtype}&cr=&as_sitesearch=${queryOptions.siteSearch}&as_filetype=${queryOptions.imgtype}&tbs=${queryOptions.rights}&udm=2`;
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
        if (queryOptions.limit && results.length >= queryOptions.limit)
            break;
        const imgSrc = yield element.$eval('img', (img) => img.src);
        if (!imgSrc)
            continue;
        if (queryOptions.imgtype === 'photo' && !(0, utils_1.isPicture)(imgSrc))
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
            if (queryOptions.metadata || queryOptions.imgData) {
                const { metadata, imgBuffer } = yield (0, utils_1.getImageData)(src.src);
                src.imgData = queryOptions.imgData ? `data:image/${metadata.format};base64,${imgBuffer.toString('base64')}` : '';
                if (queryOptions.metadata && metadata) {
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
exports.scrapeImages = scrapeImages;
//# sourceMappingURL=scraper.js.map