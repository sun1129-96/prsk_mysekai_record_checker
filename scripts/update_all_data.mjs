import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { fork } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function runScript(scriptRelativePath, args = []) {
  return new Promise((resolve, reject) => {
    const fullPath = path.join(__dirname, scriptRelativePath);
    console.log(`\n▶ 実行中: node ${scriptRelativePath} ${args.join(' ')}...`);
    const proc = fork(fullPath, args, { stdio: 'inherit' });

    proc.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`スクリプト ${scriptRelativePath} が終了コード ${code} で失敗しました`));
      }
    });

    proc.on('error', (err) => reject(err));
  });
}

async function main() {
  console.log('====================================================');
  console.log('  プロセカ マイセカイ レコードチェッカー データ一括更新');
  console.log('====================================================');

  const isRefresh = process.argv.includes('--refresh');

  // 1. 一覧ページキャッシュのクリア（最新の楽曲一覧を確実に取得するため）
  const listCachePath = path.join(__dirname, 'cache', 'aad6ee23b0.html');
  if (fs.existsSync(listCachePath)) {
    fs.unlinkSync(listCachePath);
    console.log('✔ 一覧ページの古いキャッシュを削除しました。');
  }

  // 2. Wikiからの楽曲情報スクレイピング & CSV/TSV/JSON出力
  // --refresh フラグを渡す（全731曲の個別ページHTMLを最新化）
  await runScript('import_songs.mjs', isRefresh ? ['--refresh'] : []);

  // 3. 公式読み仮名取得 & シンガー正規化 & allRecords.ts 出力
  await runScript('generate_records_ts.mjs');

  console.log('\n====================================================');
  console.log('  ✔ 全データの更新処理が正常に完了しました！');
  console.log('  ・CSV: records_spreadsheet.csv');
  console.log('  ・TSV: records_spreadsheet.tsv');
  console.log('  ・TS:  src/data/allRecords.ts');
  console.log('====================================================\n');
}

main().catch((err) => {
  console.error('\n❌ エラーが発生しました:', err.message);
  process.exit(1);
});
