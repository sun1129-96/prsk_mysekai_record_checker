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
};

// ユニットメンバー
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

// Wiki HTML から音源トラック情報を抽出
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
        tracks.push({ verName, singersRaw });
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
        if (verName && singersRaw) {
          tracks.push({ verName, singersRaw });
        }
      }
    }
  });

  return tracks;
}

const discrepancies = [];

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

  if (wikiTracks.length !== appTracks.length) {
    songDiff.issues.push({
      type: 'トラック数不一致',
      detail: `Wiki: ${wikiTracks.length}件 / アプリ: ${appTracks.length}件`,
      wikiList: wikiTracks.map(t => `${t.verName} (${t.singersRaw})`),
      appList: appTracks.map(t => `${t.name} (${t.singers.join(', ')})`),
    });
  }

  const minLen = Math.min(wikiTracks.length, appTracks.length);
  for (let i = 0; i < minLen; i++) {
    const w = wikiTracks[i];
    const a = appTracks[i];

    // バージョン名の比較（末尾の . や空白を正規化）
    const normW = w.verName.replace(/[\.．]$/, '').trim();
    const normA = a.name.replace(/[\.．]$/, '').trim();

    if (normW !== normA) {
      songDiff.issues.push({
        type: 'バージョン名不一致',
        trackIndex: i + 1,
        wikiVerName: w.verName,
        appVerName: a.name,
      });
    }

    // 歌唱キャラクターの比較
    const wikiRaw = w.singersRaw;
    const appSingers = a.singers || [];

    // 1. ALL ORIGINAL ユニット
    if (wikiRaw.includes('ALL ORIGINAL ユニット') && appSingers.length !== 20) {
      songDiff.issues.push({
        type: 'ALL ORIGINAL ユニット未展開（20人中5人のみ）',
        trackIndex: i + 1,
        verName: w.verName,
        wikiSingers: wikiRaw,
        appSingersCount: appSingers.length,
        appSingers: appSingers,
      });
    }

    // 2. 「25時」「ナイトコードで。」の文字列分割バグ
    if (appSingers.includes('25時') || appSingers.includes('ナイトコードで。')) {
      songDiff.issues.push({
        type: 'ユニット名パースエラー（25時、ナイトコードで。）',
        trackIndex: i + 1,
        verName: w.verName,
        wikiSingers: wikiRaw,
        appSingers: appSingers,
      });
    }

    // 3. その他、特殊な未展開表記（ALLユニットなど）
    if ((wikiRaw.includes('ALL') || wikiRaw.includes('一同')) && !wikiRaw.includes('ALL ORIGINAL ユニット')) {
      songDiff.issues.push({
        type: '特殊ユニット歌唱表記',
        trackIndex: i + 1,
        verName: w.verName,
        wikiSingers: wikiRaw,
        appSingers: appSingers,
      });
    }
  }

  if (songDiff.issues.length > 0) {
    discrepancies.push(songDiff);
  }
}

console.log(`=== Total Discrepancies: ${discrepancies.length} songs ===`);
discrepancies.forEach((d, idx) => {
  console.log(`\n[${idx + 1}] 【${d.title}】 (Wiki: ${d.wikiCount} / App: ${d.appCount})`);
  d.issues.forEach(iss => {
    console.log(`   - [${iss.type}]`, JSON.stringify(iss));
  });
});

fs.writeFileSync('record-checker/scripts/discrepancies_result.json', JSON.stringify(discrepancies, null, 2), 'utf8');
