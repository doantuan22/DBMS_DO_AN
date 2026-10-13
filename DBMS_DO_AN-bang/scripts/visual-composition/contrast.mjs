// Measure actual rendered background pixels after overlays. No artwork editing/assets.
import { inflateSync } from 'node:zlib';
import { wait } from '../db/seed-browser-support.mjs';
export function pngPixels(buffer) {
  let width, height, channels, depth, interlace;
  const chunks = [];
  for (let offset = 8; offset < buffer.length;) {
    const length = buffer.readUInt32BE(offset),
      type = buffer.toString('ascii', offset + 4, offset + 8),
      data = buffer.subarray(offset + 8, offset + 8 + length);
    if (type === 'IHDR') {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      depth = data[8];
      channels = data[9] === 2 ? 3 : data[9] === 6 ? 4 : 0;
      interlace = data[12];
    }
    if (type === 'IDAT') chunks.push(data);
    offset += 12 + length;
  }
  if (depth !== 8 || !channels || interlace) throw new Error('Unsupported screenshot PNG format');
  const raw = inflateSync(Buffer.concat(chunks)),
    stride = width * channels,
    pixels = Buffer.alloc(height * stride);
  const paeth = (a, b, c) => {
    const p = a + b - c,
      pa = Math.abs(p - a),
      pb = Math.abs(p - b),
      pc = Math.abs(p - c);
    return pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
  };
  for (let y = 0; y < height; y++) {
    const filter = raw[y * (stride + 1)];
    for (let x = 0; x < stride; x++) {
      const left = x >= channels ? pixels[y * stride + x - channels] : 0,
        up = y ? pixels[(y - 1) * stride + x] : 0,
        corner = y && x >= channels ? pixels[(y - 1) * stride + x - channels] : 0;
      const adjustment =
        filter === 0
          ? 0
          : filter === 1
            ? left
            : filter === 2
              ? up
              : filter === 3
                ? Math.floor((left + up) / 2)
                : filter === 4
                  ? paeth(left, up, corner)
                  : NaN;
      if (!Number.isFinite(adjustment)) throw new Error('Unknown PNG filter');
      pixels[y * stride + x] = (raw[y * (stride + 1) + x + 1] + adjustment) & 255;
    }
  }
  return {
    width,
    height,
    pixel: (x, y) => [
      ...pixels.subarray(
        Math.floor(y) * stride + Math.floor(x) * channels,
        Math.floor(y) * stride + Math.floor(x) * channels + 3,
      ),
    ],
  };
}
const luminance = (rgb) =>
  rgb
    .map((v) => v / 255)
    .map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4))
    .reduce((s, v, i) => s + v * [0.2126, 0.7152, 0.0722][i], 0);
const ratio = (a, b) => {
  const x = luminance(a),
    y = luminance(b);
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
};
export async function renderedContrast(b, selectors) {
  await b.cdp('Page.bringToFront');
  const items = await b.evaluate(
    `(()=>{window.__vcrProbe=[];return [...document.querySelectorAll(${JSON.stringify(selectors)})].filter(e=>{const r=e.getBoundingClientRect();return r.width>0&&r.height>0&&r.top>=0&&r.bottom<=innerHeight}).map((e,index)=>{const s=getComputedStyle(e),r=e.getBoundingClientRect();const item={label:e.textContent.trim(),color:s.color,fontSize:parseFloat(s.fontSize),weight:parseInt(s.fontWeight)||400,x:r.x,y:r.y,width:r.width,height:r.height};for(const textNode of [e,...e.querySelectorAll('*')]){window.__vcrProbe.push({element:textNode,css:textNode.style.cssText});textNode.style.setProperty('transition','none','important');textNode.style.setProperty('animation','none','important');textNode.style.setProperty('color','transparent','important');textNode.style.setProperty('text-shadow','none','important');}return item})})()`,
  );
  try {
    await b.evaluate('window.__vcrProbe.map(({element})=>getComputedStyle(element).color)');
    await wait(250);
    const frame = await b.cdp('Page.captureScreenshot', {
      format: 'png',
      captureBeyondViewport: false,
    });
    const png = pngPixels(Buffer.from(frame.data, 'base64'));
    return items.map((item) => {
      const foreground = item.color
          .match(/[\d.]+/g)
          .slice(0, 3)
          .map(Number),
        ratios = [];
      for (const fy of [0.2, 0.5, 0.8])
        for (const fx of [0.05, 0.25, 0.5, 0.75, 0.95]) {
          const x = Math.max(0, Math.min(png.width - 1, item.x + item.width * fx)),
            y = Math.max(0, Math.min(png.height - 1, item.y + item.height * fy));
          ratios.push(ratio(foreground, png.pixel(x, y)));
        }
      const minimum = Math.min(...ratios),
        required = item.fontSize >= 24 || (item.fontSize >= 18.66 && item.weight >= 700) ? 3 : 4.5;
      return {
        ...item,
        minimumRatio: Number(minimum.toFixed(2)),
        required,
        status: minimum >= required ? 'PASS' : 'FAIL',
      };
    });
  } finally {
    await b.evaluate(
      'window.__vcrProbe.forEach(({element,css})=>element.style.cssText=css);delete window.__vcrProbe',
    );
  }
}
