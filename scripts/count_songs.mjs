import * as cheerio from 'cheerio';

async function main() {
  const res = await fetch('https://pjsekai.com/?aad6ee23b0', {
    headers: { 'User-Agent': 'Mozilla/5.0' },
  });
  const html = await res.text();
  const $ = cheerio.load(html);

  const table = $('table').eq(6);
  const rows = table.find('tbody tr').length ? table.find('tbody tr') : table.find('tr').slice(1);
  console.log('Total song rows in table:', rows.length);
  
  // 最後の数件を表示
  const lastRows = rows.slice(-3);
  lastRows.each((_, tr) => {
    const text = $(tr).find('td').map((_, td) => $(td).text().trim()).get();
    console.log(text.slice(0, 5).join(' | '), '...', text.slice(-1));
  });
}

main().catch(console.error);
