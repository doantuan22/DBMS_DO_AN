// Original, dependency-free SVG artwork for the synthetic seed. No external assets are copied.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const OUT = path.join(ROOT, 'frontend', 'public', 'seed-media');
const escapeXml = (value) => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&apos;');

const posterTitles = [
  ['pho-dem-khong-ngu', 'PHỐ ĐÊM', 'KHÔNG NGỦ'], ['mua-sao-tren-song', 'MƯA SAO', 'TRÊN SÔNG'],
  ['bep-nha-co-chuyen', 'BẾP NHÀ', 'CÓ CHUYỆN'], ['hanh-tinh-mau-xanh', 'HÀNH TINH', 'MÀU XANH'],
  ['chuyen-tau-cuoi-cung', 'CHUYẾN TÀU', 'CUỐI CÙNG'], ['vuon-ky-uc', 'KHU VƯỜN', 'KÝ ỨC'],
  ['can-phong-so-13', 'CĂN PHÒNG', 'SỐ 13'], ['doi-gio-mua-ha', 'ĐỢI GIÓ', 'MÙA HẠ'],
  ['doi-thoai-voi-mat-trang', 'ĐỐI THOẠI', 'VỚI MẶT TRĂNG'], ['nhom-ban-ban-ke-hoach', 'NHÓM BẠN', 'BẢN KẾ HOẠCH'],
  ['vu-dieu-tren-mai-nha', 'VŨ ĐIỆU', 'TRÊN MÁI NHÀ'], ['bien-goi-ten-ai', 'BIỂN GỌI', 'TÊN AI'],
  ['nhat-ky-mau-tim', 'NHẬT KÝ', 'MÀU TÍM'], ['meo-may-di-lac', 'MÈO MÁY', 'ĐI LẠC'],
  ['cuoc-dua-tren-may', 'CUỘC ĐUA', 'TRÊN MÂY'], ['nguoi-giu-den', 'NGƯỜI GIỮ', 'ĐÈN'],
  ['la-thu-tu-tuong-lai', 'LÁ THƯ', 'TỪ TƯƠNG LAI'], ['rung-thong-thi-tham', 'RỪNG THÔNG', 'THÌ THẦM'],
  ['doi-dieu-uoc-nho', 'ĐỘI ĐIỀU', 'ƯỚC NHỎ'], ['ban-do-mua-he', 'BẢN ĐỒ', 'MÙA HÈ'],
];
const palette = [
  ['#17172b', '#6a294e', '#f2ac73', 'noir'], ['#061d38', '#087f8c', '#b8e4d6', 'ocean'],
  ['#160f1c', '#7e271e', '#f5a24d', 'forest'], ['#101c33', '#397b6a', '#e4c978', 'moon'],
  ['#25113b', '#bd315f', '#ffcc64', 'sound'],
];
const posters = posterTitles.map(([key, title, line], index) => ({ key, title, line, colors: palette[index % palette.length].slice(0, 3), motif: palette[index % palette.length][3] }));

function poster({ title, line, colors, motif }) {
  const [a, b, c] = colors;
  const shapes = {
    noir: '<path d="M260 0 400 95 340 255 400 370 235 575 20 475 95 285 0 180Z" fill="#e4b572" opacity=".16"/><circle cx="286" cy="302" r="82" fill="none" stroke="#f7d3a4" stroke-width="2" opacity=".8"/><path d="M0 338 400 188M0 420 400 270" stroke="#f6dfbd" stroke-width="1" opacity=".2"/>',
    ocean: '<path d="M0 260 Q75 220 140 260T280 260T420 260V600H0Z" fill="#5bd2cb" opacity=".22"/><path d="M0 330 Q75 290 140 330T280 330T420 330M0 393 Q75 353 140 393T280 393T420 393" fill="none" stroke="#ccfff1" stroke-width="3" opacity=".55"/><path d="M248 250 Q300 175 355 205 Q329 215 321 248 Q301 262 275 258Z" fill="#07182e" opacity=".7"/>',
    forest: '<path d="M200 75 65 410h75L62 510h272l-77-100h72Z" fill="#f4ad57" opacity=".18"/><path d="M50 0v600M350 0v600M0 185h400M0 480h400" stroke="#ffd99f" stroke-width="2" opacity=".18"/><circle cx="205" cy="280" r="90" fill="none" stroke="#f0b474" stroke-width="2" opacity=".65"/>',
    moon: '<circle cx="285" cy="205" r="86" fill="#fae9ad" opacity=".83"/><circle cx="320" cy="180" r="86" fill="#243553"/><path d="M0 360 65 245l48 95 75-150 67 170 64-95 81 126v209H0Z" fill="#101b2d" opacity=".8"/><circle cx="75" cy="93" r="3" fill="#fff7dc"/><circle cx="147" cy="158" r="2" fill="#fff7dc"/>',
    sound: '<circle cx="200" cy="288" r="110" fill="none" stroke="#ffd36e" stroke-width="2" opacity=".6"/><circle cx="200" cy="288" r="72" fill="none" stroke="#ffd36e" stroke-width="2" opacity=".55"/><path d="M26 284h68l22-68 46 146 39-102 27 46h148" fill="none" stroke="#ffd36e" stroke-width="7" stroke-linecap="round" stroke-linejoin="round" opacity=".85"/>',
  }[motif];
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="400" height="600" viewBox="0 0 400 600" role="img" aria-label="Minh họa biên tập cho ${escapeXml(title)} ${escapeXml(line)}">
<defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient><linearGradient id="wash" x2="0" y2="1"><stop stop-color="${c}" stop-opacity=".24"/><stop offset="1" stop-color="${c}" stop-opacity="0"/></linearGradient></defs>
<rect width="400" height="600" fill="url(#bg)"/><rect width="400" height="600" fill="url(#wash)"/>${shapes}
<path d="M25 30h350v540H25z" fill="none" stroke="#fff6e8" stroke-opacity=".28"/>
<text x="36" y="53" fill="#fff4dc" font-family="Arial,sans-serif" font-size="12" letter-spacing="3">CINEMASTAR • TUYỂN CHỌN</text>
<text x="34" y="459" fill="#fffaf0" font-family="Arial,sans-serif" font-size="29" font-weight="800">${escapeXml(title)}</text>
<text x="34" y="499" fill="${c}" font-family="Arial,sans-serif" font-size="24" font-weight="700">${escapeXml(line)}</text>
<text x="36" y="548" fill="#fff5e2" fill-opacity=".74" font-family="Arial,sans-serif" font-size="9" letter-spacing=".4">MINH HỌA • KHÔNG PHẢI POSTER CHÍNH THỨC</text>
</svg>`;
}

const venues = [
  { key: 'saigon', city: 'TP. HỒ CHÍ MINH', colors: ['#0d1830', '#34587e', '#ffc56d'] },
  { key: 'hanoi', city: 'HÀ NỘI', colors: ['#251b36', '#78506a', '#f0bd80'] },
  { key: 'danang', city: 'ĐÀ NẴNG', colors: ['#062b3a', '#237c82', '#ffd078'] },
  { key: 'cantho', city: 'CẦN THƠ', colors: ['#202234', '#6e4862', '#f5b16f'] },
];

function venue({ city, colors }) {
  const [a, b, c] = colors;
  const seats = Array.from({ length: 5 }, (_, row) => Array.from({ length: 9 }, (_, col) => {
    const x = 52 + col * 37 + (row % 2 ? 9 : 0);
    const y = 310 + row * 43;
    return `<path d="M${x} ${y}q0-10 10-10h10q10 0 10 10v13h-30z" fill="${row % 2 ? c : '#b94b5b'}" opacity="${0.73 - row * 0.04}"/>`;
  }).join('')).join('');
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="960" height="540" viewBox="0 0 960 540" role="img" aria-label="Minh họa rạp mô phỏng tại ${escapeXml(city)}">
<defs><linearGradient id="room" x2="0" y2="1"><stop stop-color="${b}"/><stop offset="1" stop-color="${a}"/></linearGradient><linearGradient id="screen" x2="0" y2="1"><stop stop-color="#fff5db"/><stop offset="1" stop-color="${c}"/></linearGradient></defs>
<rect width="960" height="540" fill="url(#room)"/><path d="M0 0h960v140L770 225H190L0 140Z" fill="#fff" opacity=".04"/>
<rect x="250" y="93" width="460" height="193" rx="8" fill="#090e1c" opacity=".56"/><rect x="270" y="110" width="420" height="160" rx="4" fill="url(#screen)"/>
<path d="M280 245 430 150l82 72 68-52 100 100H280Z" fill="${b}" opacity=".64"/><circle cx="575" cy="160" r="28" fill="#fff5d4" opacity=".85"/>
<path d="M0 270h960v270H0Z" fill="#080d1a" opacity=".5"/>${seats}
<text x="42" y="55" fill="#fff6e7" font-family="Arial,sans-serif" font-size="19" font-weight="700" letter-spacing="3">CINEMASTAR • ${escapeXml(city)}</text>
<text x="44" y="510" fill="#fff1d7" fill-opacity=".78" font-family="Arial,sans-serif" font-size="15" letter-spacing="2">KHÔNG GIAN MÔ PHỎNG • KHÔNG PHẢI ẢNH CƠ SỞ THẬT</text>
</svg>`;
}

const products = [
  { key: 'popcorn', name: 'Bắp rang bơ', kind: 'popcorn', color: '#f2a63a' },
  { key: 'caramel', name: 'Bắp rang caramel', kind: 'popcorn', color: '#c87537' },
  { key: 'cola', name: 'Cola 500 ml', kind: 'drink', color: '#d84f61' },
  { key: 'water', name: 'Nước tinh khiết', kind: 'drink', color: '#54bfc8' },
  { key: 'combo', name: 'Combo bắp nước đôi', kind: 'combo', color: '#9e6ac8' },
  { key: 'hotdog', name: 'Hot dog', kind: 'snack', color: '#e07c43' },
  { key: 'nachos', name: 'Nachos phô mai', kind: 'snack', color: '#d8a343' },
  { key: 'lemon-tea', name: 'Trà chanh', kind: 'drink', color: '#87bb58' },
  { key: 'orange-juice', name: 'Nước cam', kind: 'drink', color: '#e88b34' },
  { key: 'mini-combo', name: 'Combo nhỏ', kind: 'combo', color: '#5c87c5' },
  { key: 'family-combo', name: 'Combo gia đình', kind: 'combo', color: '#b56e91' },
  { key: 'chocolate', name: 'Socola hạnh nhân', kind: 'snack', color: '#87523b' },
  { key: 'coffee', name: 'Cà phê sữa đá', kind: 'drink', color: '#9a674a' },
];

function product({ name, kind, color }) {
  const graphic = kind === 'drink'
    ? `<path d="M166 140h68l-9 178h-50z" fill="${color}"/><path d="M173 163h54l-4 33h-52z" fill="#fff" opacity=".27"/><path d="M180 124h38v17h-38z" fill="#f8f0dd"/><path d="m218 125 15-23" stroke="#fff" stroke-width="7" stroke-linecap="round"/>`
    : kind === 'snack'
      ? `<path d="M128 202h144l-15 118H144z" fill="${color}"/><path d="M152 185q45-52 92 0v30h-92z" fill="#f0c27b"/><path d="M151 248h96" stroke="#fff3d8" stroke-width="8" opacity=".65"/>`
      : `<path d="M119 199h162l-18 137H137z" fill="${color}"/><path d="m126 201 17-41 22 35 23-50 23 53 25-42 37 45" fill="${kind === 'combo' ? '#f3c35e' : '#fff0bc'}"/><path d="M141 247h118" stroke="#fff" stroke-width="5" opacity=".6"/>`;
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400" role="img" aria-label="Minh họa sản phẩm ${escapeXml(name)}">
<defs><linearGradient id="bg" x2="1" y2="1"><stop stop-color="#20253b"/><stop offset="1" stop-color="#101421"/></linearGradient></defs><rect width="400" height="400" rx="28" fill="url(#bg)"/><circle cx="200" cy="210" r="135" fill="${color}" opacity=".13"/>${graphic}
<text x="200" y="370" text-anchor="middle" fill="#fff5e3" font-family="Arial,sans-serif" font-size="20" font-weight="700">${escapeXml(name)}</text></svg>`;
}

function write(dir, file, contents) {
  const target = path.join(OUT, dir, file);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, contents, 'utf8');
}

for (const item of posters) write('posters', `${item.key}.svg`, poster(item));
for (const item of venues) write('cinemas', `${item.key}.svg`, venue(item));
for (const item of products) write('products', `${item.key}.svg`, product(item));
fs.writeFileSync(path.join(OUT, 'README.md'), '# CinemaStar seed artwork\n\nAll SVGs in this directory are original local vector illustrations generated by database/10_seed/generate-media.mjs. They use no third-party images, logos, or fonts. Movie artwork is labeled as editorial illustration and is not an official film poster; cinema scenes are labeled as simulated, not photographs of real venues. Copyright © 2026 CinemaStar project contributors.\n', 'utf8');
console.log(`Generated ${posters.length} poster illustrations, ${venues.length} simulated venue scenes, and ${products.length} product illustrations in ${path.relative(ROOT, OUT)}.`);
