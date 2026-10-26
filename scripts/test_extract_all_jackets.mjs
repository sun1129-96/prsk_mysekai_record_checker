import fs from 'fs';
import * as cheerio from 'cheerio';
import path from 'path';

const songs = JSON.parse(fs.readFileSync('src/data/allImportedRecords.json', 'utf8'));

let foundCount = 0;
let multiCount = 0;
let missing = [];

function extractJacketUrl(html) {
  const $ = cheerio.load(html);
  const candidates = [];

  $('img').each((_, el) => {
    const width = $(el).attr('width');
    const height = $(el).attr('height');
    const alt = $(el).attr('alt') || '';
    const title = $(el).attr('title') || '';
    const dataSrc = $(el).attr('data-src') || '';
    const src = $(el).attr('src') || '';

    // ジャケット画像候補の判定（width 300以上、またはファイル名にジャケットや曲名が含まれる）
    const isJacketCandidate =
      (width === '350' || width === '300' || width === '320') ||
      alt.includes('ジャケット') ||
      alt.includes('jacket') ||
      dataSrc.includes('jacket') ||
      src.includes('jacket');

    if (isJacketCandidate) {
      let rawUrl = dataSrc || src;
      if (!rawUrl || rawUrl === 'image/spacer.png') return;

      let fullUrl = rawUrl;
      if (rawUrl.startsWith('./')) {
        fullUrl = `https://pjsekai.com/${rawUrl.slice(2)}`;
      } else if (rawUrl.startsWith('/')) {
        fullUrl = `https://pjsekai.com${rawUrl}`;
      } else if (!rawUrl.startsWith('http')) {
        fullUrl = `https://pjsekai.com/${rawUrl}`;
      }

      const isSekai =
        alt.includes('セカイver') ||
        alt.includes('セカイ') ||
        title.includes('セカイver') ||
        title.includes('セカイ') ||
        decodeURIComponent(fullUrl).includes('セカイver') ||
        decodeURIComponent(fullUrl).includes('セカイ');

      candidates.push({
        url: fullUrl,
        alt,
        isSekai,
      });
    }
  });

  if (candidates.length === 0) return null;

  // 複数ある場合はセカイverを最優先
  const sekaiCandidate = candidates.find((c) => c.isSekai);
  if (sekaiCandidate) return { url: sekaiCandidate.url, isMulti: candidates.length > 1, chosen: 'sekai' };

  return { url: candidates[0].url, isMulti: candidates.length > 1, chosen: 'first' };
}

for (const song of songs) {
  if (!song.detailUrl) {
    missing.push({ no: song.no, title: song.title, reason: 'no detailUrl' });
    continue;
  }
  const safeName = encodeURIComponent(song.detailUrl.replace('https://pjsekai.com/', '').replace('?', ''));
  const cachePath = path.join('scripts', 'cache', `${safeName}.html`);

  if (!fs.existsSync(cachePath)) {
    missing.push({ no: song.no, title: song.title, reason: 'no cache' });
    continue;
  }

  const html = fs.readFileSync(cachePath, 'utf8');
  const result = extractJacketUrl(html);

  if (result) {
    foundCount++;
    if (result.isMulti) multiCount++;
  } else {
    missing.push({ no: song.no, title: song.title, reason: 'not found in html' });
  }
}

console.log(`全727曲中: ${foundCount}曲でジャケット抽出成功！`);
console.log(`複数ジャケットがあった曲: ${multiCount}曲 (セカイverを自動優先選択)`);
console.log(`未発見: ${missing.length}曲`);
if (missing.length > 0) {
  console.log('未発見の曲サンプル:', missing.slice(0, 10));
}
