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

// オリジナルキャラクター20人
const ORIGINAL_20_CHARACTERS = [
  'ichika', 'saki', 'honami', 'shiho',
  'minori', 'haruka', 'airi', 'shizuku',
  'kohane', 'an', 'akito', 'toya',
  'tsukasa', 'emu', 'nene', 'rui',
  'kanade', 'mafuyu', 'ena', 'mizuki',
];

// バーチャル・シンガー6人
const VIRTUAL_SINGERS = ['miku', 'rin', 'len', 'luka', 'meiko', 'kaito'];

// 26人全員（VIRTUAL SINGERを先頭に配置）
const ALL_26_CHARACTERS = [...VIRTUAL_SINGERS, ...ORIGINAL_20_CHARACTERS];

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
  'ALL ORIGINAL ユニット': ORIGINAL_20_CHARACTERS,
  'ALLユニット': ALL_26_CHARACTERS,
  '「All Music MIKUdemy」一同': ALL_26_CHARACTERS,
};

// ユニット名マッピング
const WIKI_UNIT_MAP = {
  'バーチャル・シンガー': 'virtual_singer',
  'VIRTUAL SINGER': 'virtual_singer',
  'VirtualSinger': 'virtual_singer',
  'Leo/need': 'leo_need',
  'Leo／need': 'leo_need',
  'MORE MORE JUMP！': 'more_more_jump',
  'MORE MORE JUMP!': 'more_more_jump',
  'Vivid BAD SQUAD': 'vivid_bad_squad',
  'ワンダーランズ×ショウタイム': 'wonderlands_showtime',
  '25時、ナイトコードで。': 'nightcord_at_25',
  'その他': 'other',
};

// Wiki詳細ページHTMLからユニット一覧を抽出
function extractUnitsFromHtml(html) {
  const $ = cheerio.load(html);
  let unitTd = null;
  $('th, td').each((_, el) => {
    if ($(el).text().trim() === 'ユニット') {
      unitTd = $(el).next('td');
    }
  });

  if (!unitTd || unitTd.length === 0) return [];

  unitTd.find('br').replaceWith('\n');
  const lines = unitTd.text().split('\n').map((l) => l.trim()).filter(Boolean);

  const matched = [];
  lines.forEach((line) => {
    for (const [name, id] of Object.entries(WIKI_UNIT_MAP)) {
      if (line.includes(name)) {
        if (!matched.includes(id)) {
          matched.push(id);
        }
      }
    }
  });
  return matched;
}

// 公式 musics.json から pronunciation (読み仮名) を取得
async function fetchOfficialPronunciations() {
  const localPath = path.join(__dirname, 'official_musics.json');
  let list = null;

  if (fs.existsSync(localPath)) {
    try {
      list = JSON.parse(fs.readFileSync(localPath, 'utf8'));
      console.log(`Loaded ${list.length} records from local official_musics.json.`);
    } catch {
      list = null;
    }
  }

  if (!list) {
    list = await new Promise((resolve) => {
      https
        .get(
          'https://raw.githubusercontent.com/Sekai-World/sekai-master-db-diff/master/musics.json',
          { headers: { 'User-Agent': 'Mozilla/5.0' } },
          (res) => {
            let b = '';
            res.on('data', (c) => (b += c));
            res.on('end', () => {
              try {
                resolve(JSON.parse(b));
              } catch {
                resolve([]);
              }
            });
          }
        )
        .on('error', () => resolve([]));
    });
  }

  const map = new Map();
  if (Array.isArray(list)) {
    list.forEach((m) => {
      if (m.title && m.pronunciation) {
        let pron = m.pronunciation.trim();
        // 既知の公式表記バグ・カタカナ補正
        if (m.title === '白い雪のプリンセスは') {
          pron = 'しろいゆきのぷりんせすは';
        }
        // カタカナ「ヴ」をひらがな「ゔ」に変換
        pron = pron.replace(/ヴ/g, 'ゔ');

        map.set(m.title.trim(), pron);
        map.set(m.title.trim().toLowerCase(), pron);
      }
    });
  }
  return map;
}

// ジャケットURL抽出関数（バーチャル・シンガーverとセカイverを抽出、デフォルトはバーチャル・シンガーver優先）
function extractJacketUrls(html) {
  const $ = cheerio.load(html);
  const candidates = [];

  $('img').each((_, el) => {
    const width = $(el).attr('width');
    const alt = $(el).attr('alt') || '';
    const title = $(el).attr('title') || '';
    const dataSrc = $(el).attr('data-src') || '';
    const src = $(el).attr('src') || '';

    const isExcluded =
      alt.includes('Screenshot') ||
      alt.includes('スクリーンショット') ||
      alt.includes('衣装') ||
      alt.includes('デフォ') ||
      alt.includes('フリック') ||
      alt.includes('トリル') ||
      alt.includes('スライド') ||
      alt.includes('配置') ||
      alt.includes('ホールド') ||
      alt.includes('出張') ||
      alt.includes('info') ||
      alt.includes('Info') ||
      alt.includes('IMG_') ||
      dataSrc.includes('Screenshot') ||
      dataSrc.includes('spacer') ||
      dataSrc.includes('info') ||
      dataSrc.includes('Info') ||
      dataSrc.includes('IMG_') ||
      dataSrc.includes('pjsk_wim') ||
      dataSrc.includes('pjsk_wls');

    const isJacketCandidate =
      (width === '350' || width === '300' || width === '320' || alt.includes('ジャケット')) &&
      (dataSrc || src) &&
      !isExcluded;

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

      const decodedUrl = decodeURIComponent(fullUrl);
      const isSekai =
        alt.includes('セカイver') ||
        alt.includes('セカイ') ||
        title.includes('セカイver') ||
        title.includes('セカイ') ||
        alt.includes('コラボver') ||
        alt.includes('コラボ') ||
        decodedUrl.includes('セカイver') ||
        decodedUrl.includes('セカイ') ||
        decodedUrl.includes('コラボver') ||
        decodedUrl.includes('劇場版');

      const isVs =
        alt.includes('バーチャル') ||
        alt.includes('原曲') ||
        title.includes('バーチャル') ||
        title.includes('原曲') ||
        decodedUrl.includes('バーチャル') ||
        decodedUrl.includes('原曲');

      const isMikuAnother =
        decodedUrl.includes('初音ミクアナザーボーカル') ||
        alt.includes('初音ミクアナザーボーカル');

      candidates.push({
        url: fullUrl,
        alt,
        isSekai: Boolean(isSekai),
        isVs: Boolean(isVs),
        isMikuAnother: Boolean(isMikuAnother),
      });
    }
  });

  if (candidates.length === 0) return { vsUrl: '', sekaiUrl: '' };

  const sekaiCandidate = candidates.find((c) => c.isSekai);
  const vsCandidate = candidates.find((c) => c.isVs);
  const mikuAnotherCandidate = candidates.find((c) => c.isMikuAnother);

  let vsUrl = '';
  let sekaiUrl = '';
  let jackets = undefined;

  if (mikuAnotherCandidate && vsCandidate && sekaiCandidate) {
    vsUrl = vsCandidate.url;
    sekaiUrl = sekaiCandidate.url;
    jackets = [
      { url: vsCandidate.url, label: 'バチャシン' },
      { url: sekaiCandidate.url, label: 'セカイ' },
      { url: mikuAnotherCandidate.url, label: 'アナボ(ミク)' },
    ];
  } else if (sekaiCandidate && vsCandidate) {
    vsUrl = vsCandidate.url;
    sekaiUrl = sekaiCandidate.url;
  } else if (sekaiCandidate) {
    sekaiUrl = sekaiCandidate.url;
    const other = candidates.find((c) => c.url !== sekaiCandidate.url);
    vsUrl = other ? other.url : sekaiCandidate.url;
  } else if (vsCandidate) {
    vsUrl = vsCandidate.url;
    const other = candidates.find((c) => c.url !== vsCandidate.url);
    sekaiUrl = other ? other.url : vsCandidate.url;
  } else {
    vsUrl = candidates[0].url;
    sekaiUrl = candidates[0].url;
  }

  return { vsUrl, sekaiUrl, jackets };
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
      // 詳細表示での歌唱ver.表記はプロセカWiki（rawType）に完全準拠
      let name = t.rawType || 'セカイver';
      let type = t.type;

      if (name.includes('劇場版')) {
        type = 'movie';
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
        type,
        singers: Array.from(new Set(normalizedSingers)),
      };
    });

    // 歌唱トラックがない（歌唱ver.が存在しない）インスト楽曲は Inst. ver. を付与
    const isInstSong = tracks.length === 0;
    if (isInstSong) {
      tracks.push({
        id: `rec_${item.no}_t1`,
        name: 'Inst. ver.',
        type: 'inst',
        singers: [],
      });
    }

    // 歌唱キャラクター一覧の集約
    const allCharacters = new Set();
    tracks.forEach((t) => {
      t.singers.forEach((s) => allCharacters.add(s));
    });

    // ジャケットURL (VS ver と セカイver を抽出、デフォルトはバーチャル・シンガーver)
    let jacketUrlVs = '';
    let jacketUrlSekai = '';
    let songJackets = undefined;
    let songUnits = undefined;
    if (item.detailUrl) {
      const safeName = encodeURIComponent(item.detailUrl.replace('https://pjsekai.com/', '').replace('?', ''));
      const cachePath = path.join(__dirname, 'cache', `${safeName}.html`);
      if (fs.existsSync(cachePath)) {
        const html = fs.readFileSync(cachePath, 'utf8');
        const jacketInfo = extractJacketUrls(html);
        jacketUrlVs = jacketInfo.vsUrl;
        jacketUrlSekai = jacketInfo.sekaiUrl;
        songJackets = jacketInfo.jackets;

        const wikiUnits = extractUnitsFromHtml(html);
        if (wikiUnits.length > 1) {
          songUnits = wikiUnits;
        }
      }
    }

    if (!jacketUrlVs && item.jacketUrl) {
      jacketUrlVs = item.jacketUrl;
      jacketUrlSekai = item.jacketUrl;
    }

    // 正式読み仮名（公式DB優先、フォールバックは既存値またはタイトル）
    const officialReading =
      pronunciationMap.get(item.title.trim()) ||
      pronunciationMap.get(item.title.trim().toLowerCase()) ||
      item.title;

    const recordObj = {
      id: `rec_${item.no}`,
      title: item.title,
      reading: officialReading,
      unit: item.unitId,
      ...(songUnits ? { units: songUnits } : {}),
      releaseDate: formattedDate,
      defaultOrder: item.no,
      defaultSort: item.defaultSort,
      jacketUrl: jacketUrlVs, // デフォルトはバーチャル・シンガーver
      jacketUrlVs,
      jacketUrlSekai,
      ...(songJackets ? { jackets: songJackets } : {}),
      vocalVersions: {
        ...(item.vocalVersions || {
          virtualSinger: false,
          sekai: false,
          connectLive: false,
          anotherVocal: false,
        }),
        movie: tracks.some((t) => t.type === 'movie' || t.name.includes('劇場版')),
        inst: isInstSong,
      },
      characters: Array.from(allCharacters),
      vocalTracks: tracks,
    };

    return recordObj;
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
