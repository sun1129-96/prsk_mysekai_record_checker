import * as cheerio from 'cheerio';

async function inspectSong(url) {
  console.log(`Fetching song page: ${url}`);
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
  });
  const html = await res.text();
  const $ = cheerio.load(html);

  console.log('Page Title:', $('title').text());

  // 「音源」または「楽曲DATA」に関連するテーブルやテキストを探索
  $('table').each((i, table) => {
    const text = $(table).text();
    if (text.includes('音源') || text.includes('歌唱') || text.includes('ボーカル') || text.includes('セカイ') || text.includes('バーチャル')) {
      console.log(`\n--- Table ${i} ---`);
      $(table).find('tr').each((_, tr) => {
        const row = $(tr).find('th, td').map((_, cell) => $(cell).text().trim().replace(/\s+/g, ' ')).get();
        console.log(row.join(' | '));
      });
    }
  });
}

async function main() {
  // ロキのページ
  await inspectSong('https://pjsekai.com/?60dcc0957a');
  console.log('\n====================================\n');
  // ステラのページ
  await inspectSong('https://pjsekai.com/?bbb8f882f7');
}

main().catch(console.error);
