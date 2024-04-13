import { FormatEnum } from 'sharp';

declare type ImgType = '' | 'clipart' | 'face' | 'lineart' | 'stock' | 'photo' | 'animated';

declare type FileType = "" | "jpg" | "gif" | "png" | "bmp" | "svg" | "webp" | "ico" | "craw";

declare type ImgColor = '' | 'mono' | 'gray' | 'color' | 'trans' | 'black' | 'blue' | 'brown' | 'gray' | 'green' | 'orange' | 'pink' | 'purple' | 'red' | 'teal' | 'white' | 'yellow';

declare type ImgSize = "" | "l" | "m" | "i" | "qsvga" | "vga" | "svga" | "xga" | "2mp" | "4mp" | "6mp" | "8mp" | "10mp" | "12mp" | "15mp" | "20mp" | "40mp" | "70mp";

declare type Imgar = "" | "t|xt" | "s" | "w" | "xw";

declare type AsRights = "" | "cl" | "ol";

declare type SharpFormat = 'jpeg' | 'png' | 'webp' | 'gif' | 'svg' | ''; 


interface PickOptions {
    limit?: number;
    imgSize?: ImgSize;
    imgtype?: ImgType;
    imgColor?: ImgColor;
    imgar?: Imgar;
    fileType?: FileType;
    safe?: boolean;
    siteSearch?: string;
    rights?: AsRights;
    random?: boolean;
    metadata?: boolean;
    imgData?: boolean;
}


interface PickResult {
    src: string;
    imgData: string;
    description: string;
    source: string;
    metadata: {
        width: number;
        height: number;
        format?: FormatEnum;
    }
}

export { PickOptions, PickResult };