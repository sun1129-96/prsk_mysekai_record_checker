import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const allRecordsPath = path.join(__dirname, '..', 'src', 'data', 'allRecords.ts');
const content = fs.readFileSync(allRecordsPath, 'utf8');
const jsonStr = content.replace(/^[\s\S]*?export const ALL_RECORDS: RecordItem\[\] =\s*/, '').replace(/;\s*$/, '');
const records = JSON.parse(jsonStr);

// song_tags_map.json を読み込み
const mapPath = path.join(__dirname, 'song_tags_map.json');
let tagsMap = {};
if (fs.existsSync(mapPath)) {
  tagsMap = JSON.parse(fs.readFileSync(mapPath, 'utf8'));
}

// 全楽曲に originalType と bannerCharacter を付与
records.forEach((r) => {
  if (tagsMap[r.title]) {
    const meta = tagsMap[r.title];
    r.originalType = meta.originalType || 'cover';
    if (meta.bannerCharacter) {
      r.bannerCharacter = meta.bannerCharacter;
    } else {
      delete r.bannerCharacter;
    }
  } else {
    // 辞書に未登録の新曲はデフォルト cover
    r.originalType = 'cover';
    delete r.bannerCharacter;
  }
});

const newContent = `// 自動生成ファイル (pjsekai.com より全${records.length}曲インポート・公式pronunciation読み仮名適用済み・シンガーID正規化済み・書き下ろし分類およびバナーキャラ付与済み)
import type { RecordItem } from '../types/record';

export const ALL_RECORDS: RecordItem[] = ${JSON.stringify(records, null, 2)};
`;

fs.writeFileSync(allRecordsPath, newContent, 'utf8');
console.log(`allRecords.ts updated successfully with originalType and bannerCharacter for all ${records.length} songs!`);
