import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 既存の読み仮名マップ（mockRecords等から抽出）
const EXISTING_READINGS = {
  'Tell Your World': 'てるゆあわーるど',
  'ネクストネスト': 'ねくすとねすと',
  'メルト': 'めると',
  '初音ミクの消失': 'はつねみくのしょうしつ',
  'Blessing': 'ぶれっしんぐ',
  'alive': 'あらいぶ',
  'ロキ': 'ろき',
  'テオ': 'てお',
  'ヒバナ -Reloaded-': 'ひばな',
  'ハッピーシンセサイザ': 'はっぴーしんせさいざ',
  'Nostalogic': 'のすたろじっく',
  'ツギハギスタッカート': 'つぎはぎすたっかーと',
  '劣等上等': 'れっとうじょうとう',
  'ドクター＝ファンクビート': 'どくたーふぁんくびーと',
  'フラジール': 'ふらじーる',
  'ブリキノダンス': 'ぶりきのだんす',
  'スイートマジック': 'すいーとまじっく',
  'ぼうけんのしょがきえました！': 'ぼうけんのしょがきえました',
  'シャルル': 'しゃるる',
  'ハロ／ハワユ': 'はろはわゆ',
  '自傷無色': 'じしょうむしょく',
  'needLe': 'にーどる',
  'アイドル新鋭隊': 'あいどるしんえいたい',
  'Ready Steady': 'れでぃすてでぃ',
  'セカイはまだ始まってすらいない': 'せかいはまだはじまってすらいない',
  '悔やむと書いてミライ': 'くやむとかいてみらい',
  'セカイ': 'せかい',
  'ワーワーワールド': 'わーわーわーるど',
  'ステラ': 'すてら',
  '流星のパルス': 'りゅうせいのぱるす',
  'モア!ジャンプ!モア!': 'もあじゃんぷもあ',
  'モア！ジャンプ！モア！': 'もあじゃんぷもあ',
  'シネマ': 'しねま',
  'チュルリラ・チュルリラ・ダッダッダ！': 'ちゅるりらちゅるりらだっだっだ',
  'トンデモワンダーズ': 'とんでもわんだーず',
  'ロウワー': 'ろうわー',
  '群青讃歌': 'ぐんじょうさんか',
  'NEO': 'ねお',
};

const jsonPath = path.join(__dirname, '..', 'src', 'data', 'allImportedRecords.json');
const rawData = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));

console.log(`Loaded ${rawData.length} imported records.`);

const records = rawData.map((item) => {
  // 配信日のフォーマット正規化 (YYYY/MM/DD -> YYYY-MM-DD)
  const formattedDate = item.releaseDate ? item.releaseDate.replace(/\//g, '-') : '';

  // 歌唱キャラクター一覧の集約
  const allCharacters = new Set();
  (item.vocalTracks || []).forEach((t) => {
    (t.singers || []).forEach((s) => allCharacters.add(s));
  });

  // トラックデータの整形（アナザーボーカルverはシンプルに統一）
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

    return {
      id: `rec_${item.no}_t${idx + 1}`,
      name,
      type: t.type,
      singers: t.singers || [],
    };
  });

  return {
    id: `rec_${item.no}`,
    title: item.title,
    reading: EXISTING_READINGS[item.title] || item.title,
    unit: item.unitId,
    releaseDate: formattedDate,
    defaultOrder: item.no, // 実装順
    defaultSort: item.defaultSort, // デフォルト順コード (並び替え用)
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

const tsContent = `// 自動生成ファイル (pjsekai.com より全727曲インポート)
import type { RecordItem } from '../types/record';

export const ALL_RECORDS: RecordItem[] = ${JSON.stringify(records, null, 2)};
`;

const outputPath = path.join(__dirname, '..', 'src', 'data', 'allRecords.ts');
fs.writeFileSync(outputPath, tsContent, 'utf-8');
console.log(`Saved ${records.length} records to ${outputPath}`);
