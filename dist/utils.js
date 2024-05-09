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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserAgent = exports.getImageData = exports.launchBrowserAndOpenPage = exports.scrollToEnd = exports.sleep = exports.isPicture = void 0;
const sharp_1 = __importDefault(require("sharp"));
const puppeteer_1 = __importDefault(require("puppeteer"));
const getUserAgent = () => {
    const agents = [
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
    ];
    const index = Math.floor(Math.random() * agents.length);
    return agents[index];
};
exports.getUserAgent = getUserAgent;
const launchBrowserAndOpenPage = (url) => __awaiter(void 0, void 0, void 0, function* () {
    const browser = yield puppeteer_1.default.launch({
        headless: false
    });
    const page = yield browser.newPage();
    yield page.goto(url);
    return { browser, page };
});
exports.launchBrowserAndOpenPage = launchBrowserAndOpenPage;
const isScrollable = (page) => __awaiter(void 0, void 0, void 0, function* () {
    return page.evaluate(() => {
        return document.querySelector("#islmp input[type='button']") !== null;
    });
});
const isButtonVisible = (page) => __awaiter(void 0, void 0, void 0, function* () {
    return page.evaluate(() => {
        function isVisible(e) {
            return !!(e.offsetWidth || e.offsetHeight || e.getClientRects().length);
        }
        const button = document.querySelector("#islmp input[type='button']");
        return button ? isVisible(button) : false;
    });
});
const scrollToEnd = (page) => __awaiter(void 0, void 0, void 0, function* () {
    const isScroll = yield isScrollable(page);
    if (!isScroll) {
        return;
    }
    return yield isButtonVisible(page);
});
exports.scrollToEnd = scrollToEnd;
const getImageData = (imgSrc) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        let imgBuffer = Buffer.from(imgSrc, 'base64');
        // deal with url images and base64 images
        if (imgSrc.startsWith('http')) {
            const response = yield fetch(imgSrc);
            const buffer = yield response.arrayBuffer();
            imgBuffer = Buffer.from(buffer);
        }
        else if (imgSrc.startsWith('data:image')) {
            const uri = imgSrc.split(';base64,').pop();
            if (!uri) {
                throw new Error('Invalid base64 image');
            }
            imgBuffer = Buffer.from(uri, 'base64');
        }
        const metadata = yield (0, sharp_1.default)(imgBuffer).metadata();
        return { metadata, imgBuffer };
    }
    catch (err) {
        console.error(imgSrc, err);
        throw err;
    }
});
exports.getImageData = getImageData;
const isPicture = (imgSrc) => __awaiter(void 0, void 0, void 0, function* () {
    // analyser si l'image est une photo ou non en se basant sur le contenu de l'image nombre de couleurs, etc.
    try {
        let imgBuffer = Buffer.from(imgSrc, 'base64');
        if (imgSrc.startsWith('data:image')) {
            const uri = imgSrc.split(';base64,').pop();
            if (!uri) {
                throw new Error('Invalid base64 image');
            }
            imgBuffer = Buffer.from(uri, 'base64');
        }
        else {
            // check if the image is supported image format
            const supportedFormats = ['jpeg', 'webp', '.jpg'];
            const format = imgSrc.split('.').pop();
            if (!format || !supportedFormats.includes(format)) {
                console.error('Unsupported image format');
                return false;
            }
        }
        const { data, info } = yield (0, sharp_1.default)(imgBuffer)
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
        }
        else {
            return true;
        }
    }
    catch (err) {
        console.error(imgSrc, err);
        throw err;
    }
});
exports.isPicture = isPicture;
const sleep = (ms) => new Promise(res => setTimeout(res, ms));
exports.sleep = sleep;
//# sourceMappingURL=utils.js.map