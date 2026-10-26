import fs from 'fs';
import * as cheerio from 'cheerio';

// 複数ジャケットがある曲を探索（例えばヒバナ、千本桜、ドラマツルギー、命に嫌われている、など）
const files = fs.readdirSync('scripts/cache').filter(f => f.endsWith('.html'));

for (const file of files) {
  const html = fs.readFileSync(`scripts/cache/${file}`, 'utf8');
  const $ = cheerio.load(html);

  const jacketImgs = [];
  $('img').each((_, img) => {
    const src = $(img).attr('src') || '';
    const alt = $(img).attr('alt') || '';
    if (src.includes('m_jacket') || src.includes('jacket') || alt.includes('jacket')) {
      // 周囲のテキスト（セカイver、原曲、バーチャルシンガーver等のタブやキャプション）
      const context = $(img).closest('table, div').text().trim().replace(/\s+/g, ' ').slice(0, 80);
      jacketImgs.push({ src, alt, context });
    }
  });

  if (jacketImgs.length > 1) {
    const title = $('title').text().split('|')[0].trim();
    console.log(`\n=== 複数ジャケット発見: ${title} (${file}) ===`);
    jacketImgs.forEach((img, idx) => {
      console.log(`[${idx + 1}] src: ${img.src}\n    alt: ${img.alt}\n    context: ${img.context}`);
    });
  }
}
