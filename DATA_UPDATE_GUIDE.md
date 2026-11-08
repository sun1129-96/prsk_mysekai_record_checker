# 楽曲データ更新手順ガイド (DATA_UPDATE_GUIDE.md)

本ドキュメントは、「プロセカ マイセカイ レコードチェッカー」における**最新楽曲データ・ジャケット画像・音源（歌唱者）・読み仮名の更新手順**をまとめたガイドです。  
ゲーム内で新曲が追加された際や、音源（アナザーボーカル等）が追加された際に本手順を実行することで、アプリとスプレッドシート（CSV/TSV）を最新状態に更新できます。

---

## 🚀 最短手順（ワンコマンド実行）

プロジェクトのルートディレクトリ（`record-checker/`）のターミナルで以下のコマンドを実行するだけで、全工程（キャッシュクリア・スクレイピング・公式読み仮名適用・シンガー正規化・ファイル生成）が全自動で完了します。

```bash
# 通常更新（新曲の取得と一覧の最新化）
npm run update-data

# 全件強制リフレッシュ（既存楽曲に追加されたアナザーボーカルver等もすべて再取得）
node scripts/update_all_data.mjs --refresh
```

実行後、以下のファイルが自動的に最新化されます：
1. **`records_spreadsheet.csv`**（BOM付きUTF-8、Excel・スプレッドシート用）
2. **`records_spreadsheet.tsv`**（タブ区切りテキスト）
3. **`src/data/allRecords.ts`**（Webアプリ本体が読み込むTypeScriptマスターデータ）
4. **`src/data/allImportedRecords.json`**（生データJSONバックアップ）

---

## 🛠️ 各ステップの詳細手順（手動で実行する場合）

手動で個別にステップを確認しながら更新したい場合は、以下の手順に従ってください。

### Step 1. 一覧ページキャッシュのクリア
プロセカ攻略Wiki（`pjsekai.com`）の一覧ページキャッシュを削除し、最新の楽曲リストを取得できるようにします。

- **PowerShell (Windows)**:
  ```powershell
  Remove-Item -Force scripts/cache/aad6ee23b0.html
  ```
- **Bash (Mac / Linux)**:
  ```bash
  rm -f scripts/cache/aad6ee23b0.html
  ```

---

### Step 2. Wikiからの楽曲情報スクレイピング & CSV/TSV出力
プロセカ攻略Wiki（`https://pjsekai.com/?aad6ee23b0`）および各楽曲の詳細ページを取得・解析します。

```bash
node scripts/import_songs.mjs
```

- **処理内容**:
  - 楽曲一覧ページから全楽曲を抽出（実装順、デフォルト順、カテゴリ、配信日など）。
  - 新規楽曲の詳細ページを並列フェッチし、音源情報（セカイver、バーチャル・シンガーver、アナザーボーカル、コネクトライブ等）とセカイver優先のジャケット画像URLを抽出。
  - `records_spreadsheet.csv`、`records_spreadsheet.tsv`、`src/data/allImportedRecords.json` を出力。
- **所要時間**: 約5秒〜15秒（取得済みキャッシュは自動再利用され、新曲のみ高速通信されます）。

---

### Step 3. 公式読み仮名取得・シンガー正規化 & `allRecords.ts` 生成
Webアプリ本体で使用するTypeScriptマスターデータ（`src/data/allRecords.ts`）を生成します。

```bash
node scripts/generate_records_ts.mjs
```

- **処理内容**:
  - **公式マスターDB（`musics.json`）の自動取得**: プロセカ公式マスターデータの `pronunciation` フィールドから全曲の正式な「ひらがな読み仮名」を100%自動適用（五十音順ソートの完全一致）。
  - **シンガーIDの正規化**: 「25時、ナイトコードで。」や「Leo/need」などのユニット表記を所属メンバーの個別ID（`kanade`, `mafuyu`, `ichika` 等）に全自動展開し、コラボ・ゲストキャラクター（`ALKALOID`, `Crazy:B`, `ネネロボ`, `ミクダヨー` 等）も正規マッピング。
  - **ジャケット画像URLの統合**: 全曲のジャケット画像URLを検証・格納。

---

### Step 4. 動作確認とビルド検証

更新したデータにエラーがないか、テストとビルドを実行して確認します。

```bash
# 1. ユニットテストの実行
npm test

# 2. 本番用ビルド（TypeScript型チェック含む）
npm run build

# 3. ローカルプレビューで確認
npm run preview
```

ブラウザで `http://localhost:4173/` にアクセスし、以下を確認してください：
- 右上の「所持 X / Y 曲」の総曲数（Y）が最新件数になっていること
- 新曲がリストに正しく表示され、ジャケット画像が表示されていること
- ソート順で「五十音順」を選んだ際、正しく並ぶこと
- 「並替・絞込」モーダルでキャラクターやユニットの絞り込みが正常に動くこと

---

## 📂 生成・管理されるファイル一覧

| ファイルパス | 説明 |
| :--- | :--- |
| `records_spreadsheet.csv` | Excelで開いても文字化けしないBOM付きUTF-8のCSVファイル。 |
| `records_spreadsheet.tsv` | スプレッドシートやテキストエディタへの貼り付け用TSVファイル。 |
| `src/data/allRecords.ts` | Webアプリがインポートするマスターデータ（全楽曲の完全情報）。 |
| `src/data/allImportedRecords.json` | Wikiからスクレイピングした直後の生データ（中間バックアップ）。 |
| `scripts/cache/` | 取得したWikiのHTMLキャッシュディレクトリ（次回以降の高速化用）。 |

---

## ⚠️ 注意事項・トラブルシューティング

1. **`EBUSY: resource locked or busy` エラーが発生する場合**:
   - `records_spreadsheet.csv` を Excel や他のソフトウェアで開いたままスクリプトを実行すると、ファイルロックにより上書き保存に失敗します。
   - **対処法**: 一度 Excel 等のファイルを閉じてから再度実行してください。なお、スクリプト側でロックを検知した場合は自動的に `records_spreadsheet_updated.csv` として退避保存されます。

2. **新曲の読み仮名がタイトルそのままになっている場合**:
   - プロセカ公式マスターDBリポジトリ（`Sekai-World/sekai-master-db-diff`）への反映タイミングによっては、配信直後の新曲が数時間〜1日ほど未登録の場合があります。
   - その場合でもアプリは問題なく動作しますが、数日後に再度 `npm run update-data` を実行することで公式のひらがな読み仮名へ自動更新されます。

3. **新しいコラボ・ゲストキャラクターが追加された場合**:
   - 新しい作品とのコラボなどで未知のキャラクター名が登場した場合は、`src/types/record.ts` の `CHARACTERS` 配列にID・名前・カラーを追加してください。
