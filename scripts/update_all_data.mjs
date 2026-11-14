import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { fork } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * プロセカWikiの RecentChanges を取得し、最近更新された個別ページのキャッシュを削除する
 * （アナザーボーカルver.やコネクトライブver.の後日追加・修正を高速かつ確実にキャッチするため）
 */
async function clearRecentlyUpdatedCaches() {
  try {
    console.log('▶ プロセカWikiの最近の更新履歴 (RecentChanges) を確認中...');
    const res = await fetch('https://pjsekai.com/?RecentChanges', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; PRSK-RecordChecker-Updater/1.0)',
      },
    });
    if (!res.ok) {
      console.warn(`⚠ RecentChanges の取得に失敗しました (Status: ${res.status})`);
      return;
    }
    const html = await res.text();
    const cacheDir = path.join(__dirname, 'cache');
    if (!fs.existsSync(cacheDir)) return;

    // <li>...<a href="./?xxxxxxxxxx">... のリンクIDを抽出
    const matches = html.matchAll(/href="\.\/\?([a-f0-9]{10})"/gi);
    const updatedIds = new Set();
    for (const m of matches) {
      updatedIds.add(m[1]);
    }

    let clearedCount = 0;
    for (const pageId of updatedIds) {
      const cacheFile = path.join(cacheDir, `${pageId}.html`);
      if (fs.existsSync(cacheFile)) {
        fs.unlinkSync(cacheFile);
        clearedCount++;
      }
    }
    console.log(`✔ 最近更新されたページのキャッシュを ${clearedCount} 件クリアしました。`);
  } catch (err) {
    console.warn('⚠ RecentChanges チェック中にエラーが発生しました（処理は続行します）:', err.message);
  }
}

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

  // 1.5. RecentChanges に載っている更新済み個別ページのキャッシュを削除
  if (!isRefresh) {
    await clearRecentlyUpdatedCaches();
  }

  // 2. Wikiからの楽曲情報スクレイピング & CSV/TSV/JSON出力
  // --refresh フラグを渡す（全731曲の個別ページHTMLを最新化）
  await runScript('import_songs.mjs', isRefresh ? ['--refresh'] : []);

  // 3. 公式読み仮名取得 & シンガー正規化 & allRecords.ts 出力
  await runScript('generate_records_ts.mjs');

  // 4. 書き下ろし分類 & イベントバナーキャラの付与
  await runScript('apply_tags_to_all_records.mjs');

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
