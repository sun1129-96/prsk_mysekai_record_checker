import * as cheerio from 'cheerio';
import fs from 'fs';

async function main() {
  console.log('Fetching wiki page...');
  const res = await fetch('https://pjsekai.com/?aad6ee23b0', {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    },
  });
  const html = await res.text();
  console.log('Fetched HTML length:', html.length);
  
  const $ = cheerio.load(html);

  // テーブルを探索
  console.log('Tables found:', $('table').length);
  $('table').each((i, table) => {
    const ths = $(table).find('th').map((_, th) => $(th).text().trim()).get();
    console.log(`Table ${i}:`, ths.slice(0, 10).join(' | '));
  });
}

main().catch(console.error);
