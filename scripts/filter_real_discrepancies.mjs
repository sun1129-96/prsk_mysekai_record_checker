import fs from 'fs';
import path from 'path';
import * as cheerio from 'cheerio';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// キャラクターID -> 表示名
const CHAR_MAP = {
  'ichika': '星乃一歌',
  'saki': '天馬咲希',
  'honami': '望月穂波',
  'shiho': '日野森志歩',
  'minori': '花里みのり',
  'haruka': '桐谷遥',
  'airi': '桃井愛莉',
  'shizuku': '日野森雫',
  'kohane': '小豆沢こはね',
  'an': '白石杏',
  'akito': '東雲彰人',
  'toya': '青柳冬弥',
  'tsukasa': '天馬司',
  'emu': '鳳えむ',
  'nene': '草薙寧々',
  'rui': '神代類',
  'kanade': '宵崎奏',
  'mafuyu': '朝比奈まふゆ',
  'ena': '東雲絵名',
  'mizuki': '暁山瑞希',
  'miku': '初音ミク',
  'rin': '鏡音リン',
  'len': '鏡音レン',
  'luka': '巡音ルカ',
  'meiko': 'MEIKO',
  'kaito': 'KAITO',
  'gumi': 'GUMI',
  'flower': 'v flower',
  'nenerobo': 'ネネロボ',
  'mikudayo': 'ミクダヨー',
  'alkaloid': 'ALKALOID',
  'crazy_b': 'Crazy:B',
  'jun': '漣 ジュン',
  'izumi': '瀬名 泉',
  'chiaki': '守沢 千秋',
  'natsume': '逆先 夏目',
};

// ユニットメンバー展開
const UNIT_MEMBERS = {
  'Leo/need': ['ichika', 'saki', 'honami', 'shiho'],
  'MORE MORE JUMP！': ['minori', 'haruka', 'airi', 'shizuku'],
  'MORE MORE JUMP!': ['minori', 'haruka', 'airi', 'shizuku'],
  'Vivid BAD SQUAD': ['kohane', 'an', 'akito', 'toya'],
  'ワンダーランズ×ショウタイム': ['tsukasa', 'emu', 'nene', 'rui'],
  '25時、ナイトコードで。': ['kanade', 'mafuyu', 'ena', 'mizuki'],
};

// allRecords.ts を読み込み
const allRecordsPath = path.join(__dirname, '..', 'src', 'data', 'allRecords.ts');
const allRecordsContent = fs.readFileSync(allRecordsPath, 'utf8');
const jsonStr = allRecordsContent.replace(/^[\s\S]*?export const ALL_RECORDS: RecordItem\[\] =\s*/, '').replace(/;\s*$/, '');
const appRecords = JSON.parse(jsonStr);

// allImportedRecords.json から detailUrl を取得
const importedPath = path.join(__dirname, '..', 'src', 'data', 'allImportedRecords.json');
const importedRecords = JSON.parse(fs.readFileSync(importedPath, 'utf8'));
const detailUrlMap = new Map();
importedRecords.forEach(r => detailUrlMap.set(r.title, r.detailUrl));

function cleanText(text) {
  return text.replace(/\*\d+/g, '').replace(/\s+/g, ' ').trim();
}

// Wiki HTML から有効な音源トラック情報のみを抽出（'-' や 'なし' は除外）
function parseWikiTracks(html) {
  const $ = cheerio.load(html);
  const tracks = [];
  let inOngen = false;

  $('tr').each((_, tr) => {
    const cells = $(tr).find('td, th');
    if (cells.length === 0) return;

    const firstCellText = cleanText($(cells[0]).text());

    if (firstCellText === '音源') {
      inOngen = true;
      if (cells.length >= 3) {
        const verName = cleanText($(cells[1]).text());
        const singersRaw = cleanText($(cells[2]).text());
        if (singersRaw && singersRaw !== '-' && singersRaw !== 'なし' && singersRaw !== '―') {
          tracks.push({ verName, singersRaw });
        }
      }
      return;
    }

    if (inOngen) {
      if (['ユニット', 'MV', '2DMV', '3DMV', '原曲', '再生時間', 'BPM', '追加日', '解放条件', '作詞', '作曲', '編曲', '難易度'].includes(firstCellText)) {
        inOngen = false;
        return;
      }

      if (cells.length >= 2) {
        const verName = cleanText($(cells[0]).text());
        const singersRaw = cleanText($(cells[1]).text());
        if (verName && singersRaw && singersRaw !== '-' && singersRaw !== 'なし' && singersRaw !== '―') {
          tracks.push({ verName, singersRaw });
        }
      }
    }
  });

  return tracks;
}

const realDiscrepancies = [];

for (const appRec of appRecords) {
  const detailUrl = detailUrlMap.get(appRec.title);
  if (!detailUrl) continue;

  const safeName = encodeURIComponent(detailUrl.replace('https://pjsekai.com/', '').replace('?', ''));
  const cachePath = path.join(__dirname, 'cache', `${safeName}.html`);
  if (!fs.existsSync(cachePath)) continue;

  const html = fs.readFileSync(cachePath, 'utf8');
  const wikiTracks = parseWikiTracks(html);
  if (wikiTracks.length === 0) continue;

  const appTracks = appRec.vocalTracks || [];

  const songDiff = {
    title: appRec.title,
    wikiCount: wikiTracks.length,
    appCount: appTracks.length,
    issues: [],
  };

  // 1. トラック数不一致
  if (wikiTracks.length !== appTracks.length) {
    songDiff.issues.push({
      category: 'track_count',
      desc: `トラック数不一致: Wiki(${wikiTracks.length}曲) vs アプリ(${appTracks.length}曲)`,
      wikiTracks: wikiTracks.map(t => `${t.verName}: ${t.singersRaw}`),
      appTracks: appTracks.map(t => `${t.name}: [${t.singers.join(', ')}]`),
    });
  }

  // 2. 各トラックごとの比較
  const minLen = Math.min(wikiTracks.length, appTracks.length);
  for (let i = 0; i < minLen; i++) {
    const w = wikiTracks[i];
    const a = appTracks[i];

    // バージョン名の比較（末尾の . 等の表記ゆれを除いて比較）
    const normW = w.verName.replace(/[\.．]$/, '').trim();
    const normA = a.name.replace(/[\.．]$/, '').trim();

    // 完全なバージョン名の違い（例: 「劇場版プロジェクトセカイ」ver. vs セカイver）
    if (normW !== normA) {
      songDiff.issues.push({
        category: 'version_name',
        trackIndex: i + 1,
        desc: `歌唱ver.名の不一致: Wiki「${w.verName}」 vs アプリ「${a.name}」`,
        wikiVer: w.verName,
        appVer: a.name,
      });
    }

    const wikiRaw = w.singersRaw;
    const appSingers = a.singers || [];

    // 歌唱キャラクターの比較
    // A: ALL ORIGINAL ユニット
    if (wikiRaw.includes('ALL ORIGINAL ユニット') && appSingers.length !== 20) {
      songDiff.issues.push({
        category: 'singer_all_original',
        trackIndex: i + 1,
        desc: `ALL ORIGINAL ユニット未展開: Wikiは20人対象だがアプリ側は${appSingers.length}人のみ [${appSingers.join(', ')}]`,
        wikiSingers: wikiRaw,
        appSingers: appSingers,
      });
    }

    // B: 「25時」「ナイトコードで。」のカンマ分割ミス
    if (appSingers.includes('25時') || appSingers.includes('ナイトコードで。')) {
      songDiff.issues.push({
        category: 'singer_unit_split_bug',
        trackIndex: i + 1,
        desc: `ユニット名分割バグ: 「25時、ナイトコードで。」がキャラクターIDとして誤登録されている [${appSingers.join(', ')}]`,
        wikiSingers: wikiRaw,
        appSingers: appSingers,
      });
    }

    // C: その他ユニット名展開漏れや特殊ユニット
    if (wikiRaw.includes('ALLユニット') || wikiRaw.includes('「All Music MIKUdemy」一同')) {
      songDiff.issues.push({
        category: 'singer_special_unit',
        trackIndex: i + 1,
        desc: `特殊ユニット歌唱表記: Wiki「${wikiRaw}」 vs アプリ [${appSingers.join(', ')}]`,
        wikiSingers: wikiRaw,
        appSingers: appSingers,
      });
    }
  }

  if (songDiff.issues.length > 0) {
    realDiscrepancies.push(songDiff);
  }
}

console.log(`=== 実際の差異が存在する楽曲: ${realDiscrepancies.length}曲 ===\n`);
realDiscrepancies.forEach((d, i) => {
  console.log(`【${i + 1}. ${d.title}】 (Wiki: ${d.wikiCount}曲 / アプリ: ${d.appCount}曲)`);
  d.issues.forEach(iss => {
    console.log(`   * [${iss.category}] ${iss.desc}`);
  });
  console.log('');
});

fs.writeFileSync('record-checker/scripts/real_discrepancies.json', JSON.stringify(realDiscrepancies, null, 2), 'utf8');

