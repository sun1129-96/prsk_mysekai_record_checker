import fs from 'fs';
import * as cheerio from 'cheerio';

function inspectSongHtml(filename, title) {
  const html = fs.readFileSync('scripts/cache/' + filename, 'utf8');
  const $ = cheerio.load(html);
  console.log('=== ' + title + ' ===');
  $('img').each((i, el) => {
    const src = $(el).attr('src') || '';
    const dataSrc = $(el).attr('data-src') || '';
    const alt = $(el).attr('alt') || '';
    const titleAttr = $(el).attr('title') || '';
    const width = $(el).attr('width') || '';
    const parentText = $(el).parent().text().trim();
    if (src.includes('plugin=ref') || dataSrc.includes('plugin=ref')) {
      console.log({ src: dataSrc || src, alt, titleAttr, width, parentText });
    }
  });
}

inspectSongHtml('708ecb0c47.html', 'Tell Your World');
inspectSongHtml('60dcc0957a.html', 'ロキ');
inspectSongHtml('19b7f1baba.html', 'シャルル');
