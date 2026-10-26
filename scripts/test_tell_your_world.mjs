import fs from 'fs';
import * as cheerio from 'cheerio';

const html = fs.readFileSync('scripts/cache/708ecb0c47.html', 'utf8');
const $ = cheerio.load(html);
$('table').eq(1).find('tr').each((i, tr) => {
  const cells = $(tr).find('th, td').map((_, c) => $(c).text().trim()).get();
  console.log(`Row ${i}:`, cells.join(' | '));
});
