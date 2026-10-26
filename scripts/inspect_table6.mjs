import * as cheerio from 'cheerio';

async function main() {
  const res = await fetch('https://pjsekai.com/?aad6ee23b0', {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
  });
  const html = await res.text();
  const $ = cheerio.load(html);

  const table = $('table').eq(6);
  const headers = [];
  table.find('thead tr, tr:first-child').first().find('th, td').each((_, el) => {
    headers.push($(el).text().trim());
  });
  console.log('Headers:', headers);

  // 先頭5行
  table.find('tbody tr, tr').slice(1, 6).each((rowIdx, tr) => {
    const row = [];
    $(tr).find('td, th').each((_, td) => {
      const a = $(td).find('a');
      const link = a.length ? a.attr('href') : '';
      const text = $(td).text().trim();
      row.push(link ? `${text} (${link})` : text);
    });
    console.log(`Row ${rowIdx + 1}:`, row.join(' | '));
  });
}

main().catch(console.error);
