import fs from 'fs';
import path from 'path';
import https from 'https';
import * as cheerio from 'cheerio';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ユニット全メンバーID展開マップ
const UNIT_MEMBERS = {
  'leo_need': ['ichika', 'saki', 'honami', 'shiho'],
  'Leo/need': ['ichika', 'saki', 'honami', 'shiho'],
  'more_more_jump': ['minori', 'haruka', 'airi', 'shizuku'],
  'MORE MORE JUMP！': ['minori', 'haruka', 'airi', 'shizuku'],
  'MORE MORE JUMP!': ['minori', 'haruka', 'airi', 'shizuku'],
  'vivid_bad_squad': ['kohane', 'an', 'akito', 'toya'],
  'Vivid BAD SQUAD': ['kohane', 'an', 'akito', 'toya'],
  'wonderlands_showtime': ['tsukasa', 'emu', 'nene', 'rui'],
  'ワンダーランズ×ショウタイム': ['tsukasa', 'emu', 'nene', 'rui'],
  'nightcord_at_25': ['kanade', 'mafuyu', 'ena', 'mizuki'],
  '25時、ナイトコードで。': ['kanade', 'mafuyu', 'ena', 'mizuki'],
};

// コラボ・特殊シンガーの正規化マップ
const SINGER_REPLACEMENTS = {
  'ネネロボ': ['nenerobo'],
  'ミクダヨー': ['mikudayo'],
  'ALKALOID': ['alkaloid'],
  'Crazy:B': ['crazy_b'],
  'DI:Verse (東雲 彰人': ['akito'],
  '漣 ジュン': ['jun'],
  '瀬名 泉': ['izumi'],
  '守沢 千秋': ['chiaki'],
  '逆先 夏目)': ['natsume'],
  '逆先 夏目': ['natsume'],
  'ALL ORIGINAL ユニット': ['ichika', 'minori', 'kohane', 'tsukasa', 'kanade'],
  'ALLユニット': ['ichika', 'minori', 'kohane', 'tsukasa', 'kanade'],
  '「All Music MIKUdemy」一同': ['ichika', 'minori', 'kohane', 'tsukasa', 'kanade', 'miku'],
};

// 公式 musics.json から pronunciation (読み仮名) を取得
async function fetchOfficialPronunciations() {
  return new Promise((resolve) => {
    https.get('https://raw.githubusercontent.com/Sekai-World/sekai-master-db-diff/master/musics.json', { headers: { 'User-Agent': 'Mozilla/5.0' } }, res => {
      let b = '';
      res.on('data', c => b += c);
      res.on('end', () => {
        try {
          const list = JSON.parse(b);
          const map = new Map();
          list.forEach(m => {
            if (m.title && m.pronunciation) {
              map.set(m.title.trim(), m.pronunciation.trim());
              map.set(m.title.trim().toLowerCase(), m.pronunciation.trim());
            }
          });
          resolve(map);
        } catch {
          resolve(new Map());
        }
      });
    }).on('error', () => resolve(new Map()));
  });
}

// ジャケットURL抽出関数（複数ある場合はセカイverを優先採用）
function extractJacketUrl(html) {
  const $ = cheerio.load(html);
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

  if (candidates.length === 0) return '';
  const sekaiCandidate = candidates.find((c) => c.isSekai);
  if (sekaiCandidate) return sekaiCandidate.url;
  return candidates[0].url;
}

async function main() {
  const jsonPath = path.join(__dirname, '..', 'src', 'data', 'allImportedRecords.json');
  const rawData = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
  console.log(`Loaded ${rawData.length} imported records.`);

  console.log('Fetching official pronunciations from Sekai-World/sekai-master-db-diff...');
  const pronunciationMap = await fetchOfficialPronunciations();
  console.log(`Fetched ${pronunciationMap.size} official pronunciations.`);

  const records = rawData.map((item) => {
    // 配信日のフォーマット正規化 (YYYY/MM/DD -> YYYY-MM-DD)
    const formattedDate = item.releaseDate ? item.releaseDate.replace(/\//g, '-') : '';

    // トラックデータの整形 & シンガー正規化
    const tracks = (item.vocalTracks || []).map((t, idx) => {
      let name = t.rawType;
      if (t.type === 'sekai') {
        name = 'セカイver';
      } else if (t.type === 'virtual_singer') {
        name = 'バーチャル・シンガーver';
      } else if (t.type === 'another_vocal') {
        name = 'アナザーボーカルver';
      } else if (t.type === 'connect_live') {
        name = 'コネクトライブver';
      }

      // シンガーIDの正規化
      const rawSingers = [];
      const origSingers = t.singers || [];
      for (let i = 0; i < origSingers.length; i++) {
        if (origSingers[i] === '25時' && origSingers[i + 1] === 'ナイトコードで。') {
          rawSingers.push('25時、ナイトコードで。');
          i++;
        } else {
          rawSingers.push(origSingers[i]);
        }
      }

      const normalizedSingers = [];
      rawSingers.forEach((s) => {
        if (UNIT_MEMBERS[s]) {
          normalizedSingers.push(...UNIT_MEMBERS[s]);
        } else if (SINGER_REPLACEMENTS[s]) {
          normalizedSingers.push(...SINGER_REPLACEMENTS[s]);
        } else {
          normalizedSingers.push(s);
        }
      });

      return {
        id: `rec_${item.no}_t${idx + 1}`,
        name,
        type: t.type,
        singers: Array.from(new Set(normalizedSingers)),
      };
    });

    // 歌唱キャラクター一覧の集約
    const allCharacters = new Set();
    tracks.forEach((t) => {
      t.singers.forEach((s) => allCharacters.add(s));
    });

    // ジャケットURL
    let jacketUrl = item.jacketUrl || '';
    if (!jacketUrl && item.detailUrl) {
      const safeName = encodeURIComponent(item.detailUrl.replace('https://pjsekai.com/', '').replace('?', ''));
      const cachePath = path.join(__dirname, 'cache', `${safeName}.html`);
      if (fs.existsSync(cachePath)) {
        const html = fs.readFileSync(cachePath, 'utf8');
        jacketUrl = extractJacketUrl(html);
      }
    }

    // 正式読み仮名（公式DB優先、フォールバックは既存値またはタイトル）
    const officialReading =
      pronunciationMap.get(item.title.trim()) ||
      pronunciationMap.get(item.title.trim().toLowerCase()) ||
      item.title;

    return {
      id: `rec_${item.no}`,
      title: item.title,
      reading: officialReading,
      unit: item.unitId,
      releaseDate: formattedDate,
      defaultOrder: item.no,
      defaultSort: item.defaultSort,
      jacketUrl,
      vocalVersions: item.vocalVersions || {
        virtualSinger: false,
        sekai: false,
        connectLive: false,
        anotherVocal: false,
      },
      characters: Array.from(allCharacters),
      vocalTracks: tracks,
    };
  });

  const withJackets = records.filter((r) => r.jacketUrl).length;
  console.log(`Jacket extracted: ${withJackets} / ${records.length} records.`);

  const tsContent = `// 自動生成ファイル (pjsekai.com より全${records.length}曲インポート・公式pronunciation読み仮名適用済み・シンガーID正規化済み)
import type { RecordItem } from '../types/record';

export const ALL_RECORDS: RecordItem[] = ${JSON.stringify(records, null, 2)};
`;

  const outputPath = path.join(__dirname, '..', 'src', 'data', 'allRecords.ts');
  fs.writeFileSync(outputPath, tsContent, 'utf-8');
  console.log(`Saved ${records.length} records to ${outputPath}`);
}

main().catch(console.error);
