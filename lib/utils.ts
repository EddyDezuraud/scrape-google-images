import sharp from 'sharp';

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
    sleep
};
