import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { fork } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ALL_RECORDS_PATH = path.join(__dirname, '..', 'src', 'data', 'allRecords.ts');
const CHANGELOG_PATH = path.join(__dirname, '..', 'src', 'data', 'dataChangelog.json');
const SUMMARY_MD_PATH = path.join(__dirname, '.update_summary.md');
const DISCORD_PAYLOAD_PATH = path.join(__dirname, '.discord_summary.json');
const GITHUB_OUTPUT_PATH = process.env.GITHUB_OUTPUT;

/**
 * src/types/record.ts からキャラクターIDと表示名のマップを読み込む
 */
function loadCharacterNameMap() {
  const map = new Map();
  const recordTsPath = path.join(__dirname, '..', 'src', 'types', 'record.ts');
  if (!fs.existsSync(recordTsPath)) return map;
  const content = fs.readFileSync(recordTsPath, 'utf8');
  const matches = content.matchAll(/\{\s*id:\s*'([^']+)',\s*name:\s*'([^']+)'/g);
  for (const m of matches) {
    map.set(m[1], m[2]);
  }
  return map;
}

/**
 * allRecords.ts ファイルからレコード配列をパースして取得する
 */
function parseAllRecords(filePath) {
  if (!fs.existsSync(filePath)) return [];
  const content = fs.readFileSync(filePath, 'utf8');
  const jsonStr = content
    .replace(/^[\s\S]*?export const ALL_RECORDS: RecordItem\[\] =\s*/, '')
    .replace(/;\s*$/, '');
  return JSON.parse(jsonStr);
}

/**
 * 日本時間 (JST) の日付文字列を取得する (例: 2026.11.14)
 */
function getJstDateString(separator = '.') {
  const now = new Date();
  const jst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  const y = jst.getUTCFullYear();
  const m = String(jst.getUTCMonth() + 1).padStart(2, '0');
  const d = String(jst.getUTCDate()).padStart(2, '0');
  return `${y}${separator}${m}${separator}${d}`;
}

/**
 * 別プロセスでスクリプトを実行する
 */
function runScript(scriptRelativePath, args = []) {
  return new Promise((resolve, reject) => {
    const fullPath = path.join(__dirname, scriptRelativePath);
    const proc = fork(fullPath, args, { stdio: 'inherit' });
    proc.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${scriptRelativePath} が終了コード ${code} で失敗しました`));
    });
    proc.on('error', reject);
  });
}

/**
 * GitHub Actions の output に値を書き込む
 */
function setGithubOutput(key, value) {
  if (!GITHUB_OUTPUT_PATH) return;
  fs.appendFileSync(GITHUB_OUTPUT_PATH, `${key}=${value}\n`, 'utf8');
}

/**
 * 更新後データの厳格バリデーション
 */
function validateRecords(oldRecords, newRecords) {
  if (!Array.isArray(newRecords) || newRecords.length === 0) {
    throw new Error('更新後の楽曲データが空です。スクレイピングが失敗した可能性があります。');
  }
  if (oldRecords.length > 0 && newRecords.length < oldRecords.length * 0.95) {
    throw new Error(
      `楽曲数が大幅に減少しました（更新前: ${oldRecords.length}件 → 更新後: ${newRecords.length}件）。誤データ防止のため中断します。`
    );
  }
  for (const r of newRecords) {
    if (!r.id || !r.title || !r.unit || !r.releaseDate) {
      throw new Error(`必須項目が欠落している楽曲データがあります: ${JSON.stringify(r)}`);
    }
    if (!Array.isArray(r.vocalTracks)) {
      throw new Error(`vocalTracks が配列ではありません: ${r.title}`);
    }
  }
}

async function main() {
  console.log('=== 自動データ更新パイプライン開始 ===');

  // 1. 更新前スナップショット取得
  const oldContent = fs.existsSync(ALL_RECORDS_PATH) ? fs.readFileSync(ALL_RECORDS_PATH, 'utf8') : '';
  const oldRecords = parseAllRecords(ALL_RECORDS_PATH);
  const oldMap = new Map(oldRecords.map((r) => [r.title, r]));
  console.log(`更新前の楽曲数: ${oldRecords.length}件`);

  // 2. データ一括更新の実行
  try {
    await runScript('update_all_data.mjs');
  } catch (err) {
    // 失敗時は allRecords.ts を元に戻す
    if (oldContent) fs.writeFileSync(ALL_RECORDS_PATH, oldContent, 'utf8');
    throw err;
  }

  // 3. 更新後データの厳格バリデーション
  const newRecords = parseAllRecords(ALL_RECORDS_PATH);
  console.log(`更新後の楽曲数: ${newRecords.length}件`);
  try {
    validateRecords(oldRecords, newRecords);
  } catch (err) {
    // バリデーション失敗時は元のファイルに戻して終了
    if (oldContent) fs.writeFileSync(ALL_RECORDS_PATH, oldContent, 'utf8');
    throw err;
  }

  // 4. 差分の抽出
  const newMap = new Map(newRecords.map((r) => [r.title, r]));
  const addedSongs = [];
  const removedSongs = [];
  const addedVocals = [];
  const otherUpdates = [];

  for (const newRec of newRecords) {
    const oldRec = oldMap.get(newRec.title);
    if (!oldRec) {
      addedSongs.push(newRec);
      continue;
    }

    // 既存曲の歌唱ver追加チェック
    const oldTrackKeys = new Set(
      (oldRec.vocalTracks || []).map((t) => `${t.name}::${(t.singers || []).join(',')}`)
    );
    const newlyAddedTracks = (newRec.vocalTracks || []).filter(
      (t) => !oldTrackKeys.has(`${t.name}::${(t.singers || []).join(',')}`)
    );

    if (newlyAddedTracks.length > 0) {
      addedVocals.push({
        title: newRec.title,
        tracks: newlyAddedTracks,
      });
    } else if (JSON.stringify(oldRec) !== JSON.stringify(newRec)) {
      otherUpdates.push(newRec.title);
    }
  }

  for (const oldRec of oldRecords) {
    if (!newMap.has(oldRec.title)) {
      removedSongs.push(oldRec);
    }
  }

  const hasAnyDiff =
    addedSongs.length > 0 ||
    removedSongs.length > 0 ||
    addedVocals.length > 0 ||
    otherUpdates.length > 0;

  if (!hasAnyDiff) {
    console.log('✔ データの変更はありませんでした。');
    setGithubOutput('has_changes', 'false');
    return;
  }

  console.log(
    `変更を検知しました: 新規楽曲 ${addedSongs.length}件, 歌唱ver追加 ${addedVocals.length}件, 削除 ${removedSongs.length}件, その他修正 ${otherUpdates.length}件`
  );

  // 5. 更新履歴 (src/data/dataChangelog.json) への自動追記
  const charNameMap = loadCharacterNameMap();
  const formatSingers = (singers = []) =>
    singers.map((id) => charNameMap.get(id) || id).join('・');

  const jstDateDot = getJstDateString('.');
  const jstDateDash = getJstDateString('-');
  const changelogItems = [];

  // 5-1. 新曲追加フォーマット
  if (addedSongs.length > 0) {
    const titles = addedSongs.map((s) => `「${s.title}」`).join('');
    changelogItems.push({
      category: 'new_song',
      label: '新曲追加',
      text: `${titles} を追加しました`,
    });
  }

  // 5-2. 歌唱ver.追加の分類（アナザーボーカル / コネクトライブ / その他）
  const anotherVocalParts = [];
  const connectLiveTitles = [];
  const otherVocalParts = [];

  for (const v of addedVocals) {
    const avTracks = v.tracks.filter((t) => t.type === 'another_vocal');
    const clTracks = v.tracks.filter((t) => t.type === 'connect_live');
    const otherTracks = v.tracks.filter(
      (t) => t.type !== 'another_vocal' && t.type !== 'connect_live'
    );

    if (avTracks.length > 0) {
      const singerLabels = Array.from(
        new Set(avTracks.map((t) => formatSingers(t.singers)).filter(Boolean))
      ).join(' / ');
      anotherVocalParts.push(
        singerLabels ? `「${v.title}」（${singerLabels}）` : `「${v.title}」`
      );
    }

    if (clTracks.length > 0) {
      connectLiveTitles.push(`「${v.title}」`);
    }

    if (otherTracks.length > 0) {
      const trackNames = Array.from(new Set(otherTracks.map((t) => t.name))).join(' / ');
      otherVocalParts.push(`「${v.title}」（${trackNames}）`);
    }
  }

  if (anotherVocalParts.length > 0) {
    changelogItems.push({
      category: 'another_vocal',
      label: 'アナザーボーカル追加',
      text: `${anotherVocalParts.join('、')} を追加しました`,
    });
  }

  if (connectLiveTitles.length > 0) {
    changelogItems.push({
      category: 'connect_live',
      label: 'コネクトライブver.追加',
      text: `${connectLiveTitles.join('')} を追加しました`,
    });
  }

  if (otherVocalParts.length > 0) {
    changelogItems.push({
      category: 'other_vocal',
      label: '歌唱ver.追加',
      text: `${otherVocalParts.join('、')} を追加しました`,
    });
  }

  if (changelogItems.length > 0) {
    let changelog = [];
    if (fs.existsSync(CHANGELOG_PATH)) {
      changelog = JSON.parse(fs.readFileSync(CHANGELOG_PATH, 'utf8'));
    }
    const existingEntry = changelog.find((e) => e.date === jstDateDot);
    if (existingEntry) {
      for (const item of changelogItems) {
        const isDuplicate = existingEntry.items.some((existing) =>
          typeof existing === 'string'
            ? existing === item.text
            : existing.category === item.category && existing.text === item.text
        );
        if (!isDuplicate) {
          existingEntry.items.push(item);
        }
      }
    } else {
      changelog.unshift({
        date: jstDateDot,
        items: changelogItems,
      });
    }
    fs.writeFileSync(CHANGELOG_PATH, JSON.stringify(changelog, null, 2) + '\n', 'utf8');
    console.log(`✔ 更新履歴 (${CHANGELOG_PATH}) に ${jstDateDot} の項目を追記しました。`);
  }

  // 6. 開発者通知用サマリー（GitHub Issue / Discord Webhook）の生成
  const mdLines = [
    `## 🎵 データ自動更新レポート (${jstDateDash} JST)`,
    '',
    `プロセカWikiの最新データを取り込み、本番用データ（\`allRecords.ts\`）を更新しました。（現在総数: **${newRecords.length}曲**）`,
    '',
  ];

  if (addedSongs.length > 0) {
    mdLines.push(`### ✨ 新規追加された楽曲 (${addedSongs.length}曲)`);
    for (const s of addedSongs) {
      mdLines.push(`- **${s.title}** (配信日: ${s.releaseDate})`);
    }
    mdLines.push('');
    mdLines.push(
      '> ⚠️ **開発者確認事項**: 新規追加された楽曲は初期状態では「カバー楽曲」として登録されています。書き下ろし楽曲（箱イベ・バナーキャラ等）の場合は、`scripts/song_tags_map.json` にタグ情報を追記してください。'
    );
    mdLines.push('');
  }

  if (addedVocals.length > 0) {
    mdLines.push(`### 🎤 歌唱ver.が追加された楽曲 (${addedVocals.length}曲)`);
    for (const v of addedVocals) {
      const trackDesc = v.tracks
        .map((t) => {
          const s = formatSingers(t.singers);
          return s ? `${t.name}(${s})` : t.name;
        })
        .join(', ');
      mdLines.push(`- **${v.title}**: ${trackDesc}`);
    }
    mdLines.push('');
  }

  if (removedSongs.length > 0) {
    mdLines.push(`### 🗑 Wiki一覧から削除・除外された楽曲 (${removedSongs.length}曲)`);
    for (const s of removedSongs) {
      mdLines.push(`- ${s.title}`);
    }
    mdLines.push('');
  }

  if (otherUpdates.length > 0) {
    mdLines.push(`### 📝 その他情報の更新 (${otherUpdates.length}曲)`);
    mdLines.push(
      otherUpdates.slice(0, 15).map((t) => `- ${t}`).join('\n') +
        (otherUpdates.length > 15 ? `\n- 他 ${otherUpdates.length - 15}曲` : '')
    );
    mdLines.push('');
  }

  const summaryMd = mdLines.join('\n');
  fs.writeFileSync(SUMMARY_MD_PATH, summaryMd, 'utf8');

  // Discord Webhook 用 JSON（2000文字制限に収まるよう調整）
  const discordText = summaryMd.length > 1900 ? summaryMd.slice(0, 1900) + '\n...(省略)' : summaryMd;
  fs.writeFileSync(
    DISCORD_PAYLOAD_PATH,
    JSON.stringify({ content: discordText }),
    'utf8'
  );

  setGithubOutput('has_changes', 'true');
  setGithubOutput('jst_date', jstDateDash);
  setGithubOutput('added_count', String(addedSongs.length));
  setGithubOutput('vocal_count', String(addedVocals.length));
  console.log('=== 自動データ更新パイプライン完了 ===');
}

main().catch((err) => {
  console.error('❌ 自動更新パイプラインでエラーが発生しました:', err.message);
  process.exit(1);
});

