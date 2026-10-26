import fs from 'fs';
import * as cheerio from 'cheerio';

function checkSong(file, title) {
  const html = fs.readFileSync(`scripts/cache/${file}`, 'utf8');
  const $ = cheerio.load(html);

  console.log(`\n=== ${title} ===`);
  $('img').each((i, el) => {
    const dataSrc = $(el).attr('data-src');
    const src = $(el).attr('src');
    const alt = $(el).attr('alt') || '';
    const width = $(el).attr('width');

    if ((width === '350' || width === '300') || alt.includes(title) || (dataSrc && dataSrc.includes('plugin=ref')) || (src && src.includes('cdn.wikiwiki.jp'))) {
      console.log(`- alt: ${alt}, width: ${width}, src: ${src}, data-src: ${dataSrc}`);
    }
  });
}

checkSong('708ecb0c47.html', 'Tell Your World');
checkSong('60dcc0957a.html', 'ロキ');
checkSong('bbb8f882f7.html', 'ステラ');
