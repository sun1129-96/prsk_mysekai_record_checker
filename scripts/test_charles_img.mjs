import fs from 'fs';
import * as cheerio from 'cheerio';

const html = fs.readFileSync('scripts/cache/19b7f1baba.html', 'utf8');
const $ = cheerio.load(html);

$('img').each((i, el) => {
  const alt = $(el).attr('alt') || '';
  if (alt.includes('シャルル') || alt.includes('ジャケット') || alt.includes('jacket')) {
    console.log(`Match ${i}:`);
    console.log('  outerHTML:', $.html(el));
    console.log('  parent outerHTML:', $.html($(el).parent()));
  }
});
