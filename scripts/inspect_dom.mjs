import * as cheerio from 'cheerio';

async function main() {
  const res = await fetch('https://pjsekai.com/?bbb8f882f7', {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
  });
  const html = await res.text();
  const $ = cheerio.load(html);

  const table = $('table').eq(1);
  table.find('tr').each((i, tr) => {
    const cells = $(tr).find('th, td').map((_, c) => {
      const tag = c.tagName;
      const text = $(c).text().trim().replace(/\s+/g, ' ');
      const rowspan = $(c).attr('rowspan') || 1;
      const colspan = $(c).attr('colspan') || 1;
      return `<${tag} r=${rowspan} c=${colspan}>${text}`;
    }).get();
    console.log(`Row ${i}:`, cells.join(' | '));
  });
}

main().catch(console.error);
