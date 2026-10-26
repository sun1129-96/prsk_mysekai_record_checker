import fs from 'fs';
import * as cheerio from 'cheerio';

function inspectJackets(file, title) {
  const html = fs.readFileSync(`scripts/cache/${file}`, 'utf8');
  const $ = cheerio.load(html);

  console.log(`\n=== ${title} ===`);
  const imgs = [];
  $('img').each((i, img) => {
    const src = $(img).attr('src') || '';
    const alt = $(img).attr('alt') || '';
    const parent = $(img).parent().text().trim().slice(0, 30);
    imgs.push({ src, alt, parent });
  });
  console.log('Images found:', imgs);
}

inspectJackets('708ecb0c47.html', 'Tell Your World');
inspectJackets('60dcc0957a.html', 'ロキ');
inspectJackets('bbb8f882f7.html', 'ステラ');
inspectJackets('19b7f1baba.html', 'シャルル');
