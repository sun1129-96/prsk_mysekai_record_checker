import * as cheerio from 'cheerio';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CACHE_DIR = path.join(__dirname, 'cache');
if (!fs.existsSync(CACHE_DIR)) {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
}

// ユニット変換マップ
const UNIT_MAP = {
  '0_VS': { id: 'virtual_singer', name: 'バーチャル・シンガー' },
  '1_L/n': { id: 'leo_need', name: 'Leo/need' },
  '2_MMJ': { id: 'more_more_jump', name: 'MORE MORE JUMP!' },
  '3_VBS': { id: 'vivid_bad_squad', name: 'Vivid BAD SQUAD' },
  '4_WxS': { id: 'wonderlands_showtime', name: 'ワンダーランズ×ショウタイム' },
  '5_25': { id: 'nightcord_at_25', name: '25時、ナイトコードで。' },
  '9_oth': { id: 'other', name: 'その他' },
};

// キャラクター名からIDへのマッピング
const CHAR_MAP = {
  '初音ミク': 'miku',
  '鏡音リン': 'rin',
  '鏡音レン': 'len',
  '巡音ルカ': 'luka',
  'MEIKO': 'meiko',
  'KAITO': 'kaito',
  '星乃一歌': 'ichika',
  '天馬咲希': 'saki',
  '望月穂波': 'honami',
  '日野森志歩': 'shiho',
  '花里みのり': 'minori',
  '桐谷遥': 'haruka',
  '桃井愛莉': 'airi',
  '日野森雫': 'shizuku',
  '小豆沢こはね': 'kohane',
  '白石杏': 'an',
  '東雲彰人': 'akito',
  '青柳冬弥': 'toya',
  '天馬司': 'tsukasa',
  '鳳えむ': 'emu',
  '草薙寧々': 'nene',
  '神代類': 'rui',
  '宵崎奏': 'kanade',
  '朝比奈まふゆ': 'mafuyu',
  '東雲絵名': 'ena',
  '暁山瑞希': 'mizuki',

  // プロセカ外部バーチャル・シンガー
  'GUMI': 'gumi',
  'flower': 'flower',
  '重音テト': 'teto',
  'IA': 'ia',
  '音街ウナ': 'una',
  '可不': 'kaf',
  '歌愛ユキ': 'yuki',
  '神威がくぽ': 'gakupo',
  '結月ゆかり': 'yukari',
  'ずんだもん': 'zundamon',
  '東北きりたん': 'kiritan',
  '琴葉茜': 'akane',
  '琴葉葵': 'aoi',
  '知声': 'chisei',
  '足立レイ': 'adachi_rei',
  '夏色花梨': 'karin',
  '花隈千冬': 'chifuyu',
  '裏命': 'rime',
  '星界': 'sekai_cevio',
  '羽累': 'haru',
  '狐子': 'koko',
  'ついなちゃん': 'tsuina',
  'めろう': 'merrow',
  'ゲキヤク': 'gekiyaku',
  '花奏かのんβ': 'kanon',
  '鳴花ミコト': 'mikoto',
  'Lily': 'lily',
  'SOLARIA': 'solaria',
  'VY1': 'vy1',
  'VY2V3': 'vy2',

  // 空白混じり表記対応
  '天馬 司': 'tsukasa',
  '神代 類': 'rui',
  '青柳 冬弥': 'toya',
  '東雲 彰人': 'akito',
};

async function fetchWithRetry(url, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'text/html,application/xhtml+xml',
        },
      });
      if (res.ok) return await res.text();
    } catch (e) {
      if (i === retries - 1) throw e;
      await new Promise((r) => setTimeout(r, 1000 * (i + 1)));
    }
  }
  throw new Error(`Failed to fetch ${url}`);
}

async function getCachedHtml(url) {
  // URLクエリやページ名をファイル名に変換
  const safeName = encodeURIComponent(url.replace('https://pjsekai.com/', '').replace('?', ''));
  const cachePath = path.join(CACHE_DIR, `${safeName}.html`);

  if (fs.existsSync(cachePath)) {
    return fs.readFileSync(cachePath, 'utf-8');
  }

  const html = await fetchWithRetry(url);
  fs.writeFileSync(cachePath, html, 'utf-8');
  return html;
}

// 楽曲個別ページから音源情報を解析
function parseSongDetail(html) {
  const $ = cheerio.load(html);
  const vocalTracks = [];
  const vocalVersions = {
    sekai: false,
    virtualSinger: false,
    connectLive: false,
    anotherVocal: false,
  };

  // 楽曲DATAテーブルを探索
  $('table').each((_, table) => {
    const tableText = $(table).text();
    if (!tableText.includes('音源') && !tableText.includes('楽曲DATA')) return;

    let inSoundSection = false;
    let soundRowsRemaining = 0;

    $(table).find('tr').each((_, tr) => {
      const thsAndTds = $(tr).find('th, td');
      const cells = thsAndTds.map((_, el) => $(el).text().trim().replace(/\s+/g, ' ')).get();

      // 音源行の開始検知
      let versionTypeCell = '';
      let singerListCell = '';

      const firstCellText = $(thsAndTds[0]).text().trim();
      if (firstCellText === '音源') {
        inSoundSection = true;
        const rowspan = parseInt($(thsAndTds[0]).attr('rowspan') || '1', 10);
        soundRowsRemaining = rowspan;
        versionTypeCell = $(thsAndTds[1]).text().trim();
        singerListCell = $(thsAndTds[2]).text().trim();
      } else if (inSoundSection && soundRowsRemaining > 0) {
        versionTypeCell = $(thsAndTds[0]).text().trim();
        singerListCell = $(thsAndTds[1]).text().trim();
      }

      if (versionTypeCell) {
        soundRowsRemaining--;
        if (soundRowsRemaining <= 0) {
          inSoundSection = false;
        }

        // 注釈記号（*1など）を除去
        const cleanedType = versionTypeCell.replace(/\*\d+/g, '').trim();
        const cleanedSingers = singerListCell.replace(/\*\d+/g, '').trim();
        const rawSingers = cleanedSingers
          ? cleanedSingers
              .split(/[,、]/)
              .map((s) => s.trim())
              .filter((s) => s && s !== '-' && s !== '―')
          : [];
        const singerIds = rawSingers.map((s) => CHAR_MAP[s] || s);

        const hasValidSingers = rawSingers.length > 0;

        let type = 'other';
        if (cleanedType.includes('セカイ')) {
          type = 'sekai';
          if (hasValidSingers) vocalVersions.sekai = true;
        } else if (
          cleanedType.includes('バーチャル・シンガー') ||
          cleanedType.includes('バーチャルシンガー')
        ) {
          type = 'virtual_singer';
          if (hasValidSingers) vocalVersions.virtualSinger = true;
        } else if (cleanedType.includes('アナザーボーカル')) {
          type = 'another_vocal';
          if (hasValidSingers) vocalVersions.anotherVocal = true;
        } else if (cleanedType.includes('コネクトライブ')) {
          type = 'connect_live';
          if (hasValidSingers) vocalVersions.connectLive = true;
        }

        if (hasValidSingers) {
          vocalTracks.push({
            rawType: cleanedType,
            type,
            rawSingers,
            singers: singerIds,
          });
        }
      }
    });
  });

  // ジャケット画像URL抽出（複数ある場合はセカイverを優先採用）
  const candidates = [];
  $('img').each((_, el) => {
    const width = $(el).attr('width');
    const alt = $(el).attr('alt') || '';
    const title = $(el).attr('title') || '';
    const dataSrc = $(el).attr('data-src') || '';
    const src = $(el).attr('src') || '';

    const isJacketCandidate =
      (width === '350' || width === '300' || width === '320') ||
      alt.includes('ジャケット') ||
      alt.includes('jacket') ||
      dataSrc.includes('jacket') ||
      src.includes('jacket');

    if (isJacketCandidate) {
      let rawUrl = dataSrc || src;
      if (!rawUrl || rawUrl === 'image/spacer.png') return;

      let fullUrl = rawUrl;
      if (rawUrl.startsWith('./')) {
        fullUrl = `https://pjsekai.com/${rawUrl.slice(2)}`;
      } else if (rawUrl.startsWith('/')) {
        fullUrl = `https://pjsekai.com${rawUrl}`;
      } else if (!rawUrl.startsWith('http')) {
        fullUrl = `https://pjsekai.com/${rawUrl}`;
      }

      const isSekai =
        alt.includes('セカイver') ||
        alt.includes('セカイ') ||
        title.includes('セカイver') ||
        title.includes('セカイ') ||
        decodeURIComponent(fullUrl).includes('セカイver') ||
        decodeURIComponent(fullUrl).includes('セカイ');

      candidates.push({
        url: fullUrl,
        alt,
        isSekai,
      });
    }
  });

  let jacketUrl = '';
  if (candidates.length > 0) {
    const sekai = candidates.find((c) => c.isSekai);
    jacketUrl = sekai ? sekai.url : candidates[0].url;
  }

  return { vocalTracks, vocalVersions, jacketUrl };
}

async function main() {
  console.log('=== プロセカWiki 楽曲データ一括スクレイピング開始 ===');

  const listUrl = 'https://pjsekai.com/?aad6ee23b0';
  console.log(`一覧ページ取得中: ${listUrl}`);
  const listHtml = await getCachedHtml(listUrl);
  const $ = cheerio.load(listHtml);

  const songTable = $('table').eq(6);
  const rows = songTable.find('tbody tr').length ? songTable.find('tbody tr') : songTable.find('tr').slice(1);
  console.log(`全対象楽曲数: ${rows.length}件`);

  const songs = [];

  rows.each((_, tr) => {
    const tds = $(tr).find('td');
    if (tds.length < 5) return;

    const noStr = $(tds[0]).text().trim();
    const defaultSortStr = $(tds[1]).text().trim();
    const category = $(tds[2]).text().trim();
    const titleLinkEl = $(tds[3]).find('a').first();
    const title = (titleLinkEl.length ? titleLinkEl.text() : $(tds[3]).text()).trim();
    const href = titleLinkEl.attr('href') || '';
    const unitRaw = $(tds[4]).text().trim();
    const releaseDate = $(tds[18] || tds[tds.length - 1]).text().trim();

    if (!noStr || isNaN(parseInt(noStr, 10))) return;

    const unitInfo = UNIT_MAP[unitRaw] || { id: 'other', name: 'その他' };
    const detailUrl = href.startsWith('http')
      ? href
      : href.startsWith('./')
      ? `https://pjsekai.com/${href.slice(2)}`
      : href
      ? `https://pjsekai.com/${href}`
      : '';

    songs.push({
      no: parseInt(noStr, 10),
      defaultSort: parseInt(defaultSortStr, 10) || 0,
      category,
      title,
      unitRaw,
      unitId: unitInfo.id,
      unitName: unitInfo.name,
      releaseDate,
      detailUrl,
    });
  });

  console.log(`解析対象レコード数: ${songs.length}件`);

  // 詳細ページの並列取得（プールサイズ 8）
  const CONCURRENCY = 8;
  let completed = 0;

  async function processSong(song) {
    if (!song.detailUrl) {
      song.vocalTracks = [];
      song.vocalVersions = { sekai: false, virtualSinger: false, connectLive: false, anotherVocal: false };
      return;
    }

    try {
      const html = await getCachedHtml(song.detailUrl);
      const detail = parseSongDetail(html);
      song.vocalTracks = detail.vocalTracks;
      song.vocalVersions = detail.vocalVersions;
      song.jacketUrl = detail.jacketUrl;
    } catch (err) {
      console.error(`Error fetching song ${song.no} (${song.title}):`, err.message);
      song.vocalTracks = [];
      song.vocalVersions = { sekai: false, virtualSinger: false, connectLive: false, anotherVocal: false };
      song.jacketUrl = '';
    }

    completed++;
    if (completed % 50 === 0 || completed === songs.length) {
      console.log(`[進捗] ${completed}/${songs.length} (${Math.round((completed / songs.length) * 100)}%) 完了`);
    }
  }

  const queue = [...songs];
  const workers = Array.from({ length: CONCURRENCY }, async () => {
    while (queue.length > 0) {
      const song = queue.shift();
      if (song) await processSong(song);
    }
  });

  await Promise.all(workers);
  console.log('すべての楽曲詳細データの取得が完了しました！');

  // スプレッドシート用 CSV / TSV 出力
  console.log('スプレッドシート用ファイルを出力中...');

  const headers = [
    'No.(実装順)',
    'デフォ(並び替え用)',
    '楽曲名',
    'ジャケット画像URL(セカイver優先)',
    'ユニット(変換後)',
    'ユニット(元コード)',
    '配信日',
    'セカイver',
    'セカイ歌唱者',
    'バーチャルシンガーver',
    'VS歌唱者',
    'アナザーボーカルver(トラック数)',
    'アナザーボーカル詳細',
    '全収録トラック一覧',
    '詳細URL',
  ];

  const escapeCsv = (val) => {
    const s = String(val ?? '').replace(/"/g, '""');
    return `"${s}"`;
  };

  const csvRows = [headers.map(escapeCsv).join(',')];
  const tsvRows = [headers.join('\t')];

  for (const s of songs) {
    const sekaiTrack = s.vocalTracks.find((t) => t.type === 'sekai');
    const vsTrack = s.vocalTracks.find((t) => t.type === 'virtual_singer');
    const anotherTracks = s.vocalTracks.filter((t) => t.type === 'another_vocal');

    const sekaiExists = s.vocalVersions.sekai ? 'あり' : 'なし';
    const sekaiSingers = sekaiTrack ? sekaiTrack.rawSingers.join(', ') : '';

    const vsExists = s.vocalVersions.virtualSinger ? 'あり' : 'なし';
    const vsSingers = vsTrack ? vsTrack.rawSingers.join(', ') : '';

    const anotherCount = anotherTracks.length;
    const anotherDetails = anotherTracks
      .map((t, idx) => `[${idx + 1}] ${t.rawSingers.join(', ')}`)
      .join(' / ');

    const allTracksSummary = s.vocalTracks
      .map((t) => `${t.rawType}: ${t.rawSingers.join(', ')}`)
      .join(' | ');

    const row = [
      s.no,
      s.defaultSort,
      s.title,
      s.jacketUrl || '',
      s.unitName,
      s.unitRaw,
      s.releaseDate,
      sekaiExists,
      sekaiSingers,
      vsExists,
      vsSingers,
      anotherCount,
      anotherDetails,
      allTracksSummary,
      s.detailUrl,
    ];

    csvRows.push(row.map(escapeCsv).join(','));
    tsvRows.push(row.map((v) => String(v ?? '').replace(/\t/g, ' ')).join('\t'));
  }

  // BOM付きUTF-8でCSVを保存（Excel/スプレッドシート文字化け防止）
  // 先にJSONを保存
  const jsonPath = path.join(__dirname, '..', 'src', 'data', 'allImportedRecords.json');
  fs.writeFileSync(jsonPath, JSON.stringify(songs, null, 2), 'utf-8');
  console.log(`JSON保存完了: ${jsonPath}`);

  // BOM付きUTF-8でCSV / TSVを保存
  const BOM = '\uFEFF';
  const csvPath = path.join(__dirname, '..', 'records_spreadsheet.csv');
  const tsvPath = path.join(__dirname, '..', 'records_spreadsheet.tsv');

  try {
    fs.writeFileSync(csvPath, BOM + csvRows.join('\r\n'), 'utf-8');
    console.log(`CSV保存完了: ${csvPath}`);
  } catch (err) {
    if (err.code === 'EBUSY') {
      const fallbackCsvPath = path.join(__dirname, '..', 'records_spreadsheet_updated.csv');
      fs.writeFileSync(fallbackCsvPath, BOM + csvRows.join('\r\n'), 'utf-8');
      console.log(`※ records_spreadsheet.csv が開かれているため、最新版をこちらに出力しました: ${fallbackCsvPath}`);
    } else {
      throw err;
    }
  }

  try {
    fs.writeFileSync(tsvPath, tsvRows.join('\r\n'), 'utf-8');
    console.log(`TSV保存完了: ${tsvPath}`);
  } catch (err) {
    console.warn('TSV書き込みスキップ:', err.message);
  }

  console.log('すべての処理が正常に終了しました！');
}

main().catch(console.error);
