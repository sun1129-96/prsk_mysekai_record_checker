import fs from 'node:fs';

const allRecordsPath = 'C:\\Users\\taui9\\Desktop\\My project\\レコードチェッカー\\record-checker\\src\\data\\allRecords.ts';
const content = fs.readFileSync(allRecordsPath, 'utf8');
const jsonStr = content.replace(/^[\s\S]*?export const ALL_RECORDS: RecordItem\[\] =\s*/, '').replace(/;\s*$/, '');
const records = JSON.parse(jsonStr);

// kakioroshi_verified.json をベースに確定したマッピング
const songs = JSON.parse(fs.readFileSync('C:\\Users\\taui9\\Desktop\\My project\\レコードチェッカー\\record-checker\\scripts\\kakioroshi_verified.json', 'utf8'));

const TRUE_WL_SONGS = new Set([
  '世界の歩き方',
  'ドリーマーズビート',
  '旅に帰る',
  'レム',
  'アンチサイノウ'
]);

const OVERRIDES = {
  'magic number': { type: 'collab', banner: undefined },
  '去り人達のワルツ': { type: 'collab', banner: undefined },
  'アイムマイン': { type: 'unit', banner: undefined },
  'サイバーパンクデッドボーイ': { type: 'event', banner: 'rui' },
  '25時の情熱': { type: 'event', banner: 'kanade' },
  'フュージョン': { type: 'collab', banner: undefined },
  'フレー': { type: 'collab', banner: undefined },
  'ペンタトニック': { type: 'anniversary', banner: undefined },
  'エメラルド': { type: 'anniversary', banner: undefined },
  '青色絵具': { type: 'collab', banner: undefined },
  '我らステインバスターズ！': { type: 'collab', banner: undefined },
  'スターダストレイン': { type: 'event', banner: 'haruka' },
  '世界を照らすテトラッド': { type: 'unit', banner: undefined },
  'トワイライトライト': { type: 'unit', banner: undefined },
  '携帯恋話': { type: 'unit', banner: undefined },
};

const map = new Map();
songs.forEach(s => {
  let type = s.originalType;
  let banner = s.bannerCharacter;

  if (OVERRIDES[s.title]) {
    type = OVERRIDES[s.title].type;
    banner = OVERRIDES[s.title].banner;
  } else {
    if (s.title === 'Be The MUSIC!' || s.title === 'Twilight Melody') {
      type = 'anniversary';
      banner = undefined;
    } else if (['マシンガンポエムドール', 'ÅMARA(大未来電脳)', '嬢王', '生命性シンドロウム', 'ネクラチューンサーカス', '怪獣になりたい', 'at', 'ULTIM@TE☆BE∀M!!'].includes(s.title)) {
      type = 'anniv_hard';
      banner = undefined;
    }
  }

  if (TRUE_WL_SONGS.has(s.title)) {
    type = 'world_link';
    banner = undefined;
  } else if (type === 'world_link') {
    type = 'event';
    banner = s.bannerCharacter;
  }

  if (type !== 'event') {
    banner = undefined;
  }

  map.set(s.title, { originalType: type, bannerCharacter: banner });
});

// 全731曲に付与
records.forEach(r => {
  if (map.has(r.title)) {
    const meta = map.get(r.title);
    r.originalType = meta.originalType;
    if (meta.bannerCharacter) {
      r.bannerCharacter = meta.bannerCharacter;
    } else {
      delete r.bannerCharacter;
    }
  } else {
    r.originalType = 'cover';
    delete r.bannerCharacter;
  }
});

const newContent = `// 自動生成ファイル (pjsekai.com より全731曲インポート・公式pronunciation読み仮名適用済み・シンガーID正規化済み・書き下ろし分類およびバナーキャラ付与済み)
import type { RecordItem } from '../types/record';

export const ALL_RECORDS: RecordItem[] = ${JSON.stringify(records, null, 2)};
`;

fs.writeFileSync(allRecordsPath, newContent, 'utf8');
console.log('allRecords.ts updated successfully with originalType and bannerCharacter!');

