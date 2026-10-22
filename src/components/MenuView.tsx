import { useState } from 'react';
import {
  Share2,
  Download,
  Upload,
  RotateCcw,
  CheckCheck,
  Info,
  Copy,
  Check,
} from 'lucide-react';
import type { RecordItem } from '../types/record';

interface MenuViewProps {
  records: RecordItem[];
  ownedRecordIds: Record<string, boolean>;
  onBatchCheckAll: (owned: boolean) => void;
  onImportData: (data: Record<string, boolean>) => void;
}

export const MenuView: React.FC<MenuViewProps> = ({
  records,
  ownedRecordIds,
  onBatchCheckAll,
  onImportData,
}) => {
  const [copiedShareUrl, setCopiedShareUrl] = useState(false);
  const [importText, setImportText] = useState('');
  const [showImportDialog, setShowImportDialog] = useState(false);

  // サーバーレス・ゼロコスト共有URL生成（Base64圧縮）
  const handleGenerateShareUrl = () => {
    try {
      const ownedList = Object.keys(ownedRecordIds).filter((id) => ownedRecordIds[id]);
      const json = JSON.stringify(ownedList);
      const encoded = btoa(encodeURIComponent(json));
      const url = `${window.location.origin}${window.location.pathname}?share=${encoded}`;
      navigator.clipboard.writeText(url);
      setCopiedShareUrl(true);
      setTimeout(() => setCopiedShareUrl(false), 2500);
    } catch {
      alert('共有URLの生成に失敗しました');
    }
  };

  // JSONファイルとしてバックアップダウンロード
  const handleExportJson = () => {
    const dataStr =
      'data:text/json;charset=utf-8,' +
      encodeURIComponent(JSON.stringify(ownedRecordIds, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute(
      'download',
      `mysekai_records_${new Date().toISOString().slice(0, 10)}.json`
    );
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleApplyImport = () => {
    try {
      const parsed = JSON.parse(importText);
      if (typeof parsed === 'object' && parsed !== null) {
        onImportData(parsed);
        setShowImportDialog(false);
        setImportText('');
        alert('データを正常に復元・インポートしました！');
      } else {
        alert('形式が無効です');
      }
    } catch {
      alert('JSONデータの解析に失敗しました。内容をご確認ください。');
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-6 py-6 space-y-6">
      {/* 1. データ共有・引継ぎカード */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-2 mb-3">
          <div className="p-2 rounded-xl bg-[#33ccbb]/10 text-[#0d9488]">
            <Share2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm sm:text-base text-slate-800">
              進捗の共有・引継ぎ（完全無料・サーバーレス）
            </h3>
            <p className="text-xs text-slate-400">
              チェック状況をURLに圧縮してコピー。サーバーを経由せず完全安全・高速にSNSシェアや端末引継ぎが可能です。
            </p>
          </div>
        </div>

        <button
          onClick={handleGenerateShareUrl}
          className="w-full sm:w-auto px-5 py-2.5 bg-[#33ccbb] hover:bg-[#2cb3a5] text-white rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-xs"
        >
          {copiedShareUrl ? (
            <>
              <Check className="w-4 h-4" />
              <span>URLをクリップボードにコピーしました！</span>
            </>
          ) : (
            <>
              <Copy className="w-4 h-4" />
              <span>共有URLを発行してコピー</span>
            </>
          )}
        </button>
      </div>

      {/* 2. バックアップ・データ管理 */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs space-y-4">
        <h3 className="font-bold text-sm sm:text-base text-slate-800 flex items-center gap-2">
          <span>データ管理・バックアップ</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* JSONエクスポート */}
          <button
            onClick={handleExportJson}
            className="p-3.5 rounded-2xl border border-slate-200 hover:border-slate-300 bg-slate-50/50 hover:bg-slate-50 flex items-center gap-3 text-left transition-all"
          >
            <div className="p-2 rounded-xl bg-sky-50 text-sky-600">
              <Download className="w-4 h-4" />
            </div>
            <div>
              <span className="block font-bold text-xs sm:text-sm text-slate-800">
                JSONファイル保存
              </span>
              <span className="block text-[11px] text-slate-400">
                チェックデータを端末に保存
              </span>
            </div>
          </button>

          {/* JSONインポート */}
          <button
            onClick={() => setShowImportDialog(true)}
            className="p-3.5 rounded-2xl border border-slate-200 hover:border-slate-300 bg-slate-50/50 hover:bg-slate-50 flex items-center gap-3 text-left transition-all"
          >
            <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
              <Upload className="w-4 h-4" />
            </div>
            <div>
              <span className="block font-bold text-xs sm:text-sm text-slate-800">
                JSONから復元
              </span>
              <span className="block text-[11px] text-slate-400">
                保存したファイルを読み込み
              </span>
            </div>
          </button>
        </div>

        <hr className="border-slate-100" />

        {/* 一括操作 */}
        <div>
          <span className="block text-xs font-bold text-slate-700 mb-2">一括操作</span>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => {
                if (window.confirm('すべての楽曲レコードを「所持済み」にしますか？')) {
                  onBatchCheckAll(true);
                }
              }}
              className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-1.5"
            >
              <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>すべて所持にする</span>
            </button>

            <button
              onClick={() => {
                if (window.confirm('すべてのチェックを解除しますか？')) {
                  onBatchCheckAll(false);
                }
              }}
              className="px-3 py-2 rounded-xl border border-rose-200 text-xs font-semibold text-rose-600 hover:bg-rose-50 flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>すべてのチェックを解除</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. アプリ情報・免責事項 */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-slate-400" />
          <h3 className="font-bold text-sm text-slate-800">アプリについて</h3>
        </div>
        <p className="text-xs text-slate-500 leading-relaxed">
          本アプリは、「プロジェクトセカイ カラフルステージ！ feat. 初音ミク」の非公式ファンメイドツールです。
          マイセカイ内の楽曲レコード収集の進捗管理をサポートします。セガ様、Colorful Palette様、クリプトン様とは一切関係ありません。
        </p>
        <div className="pt-2 text-[11px] text-slate-400 flex items-center justify-between border-t border-slate-100">
          <span>バージョン: 1.0.0 (Mockup Preview)</span>
          <span>登録楽曲数: {records.length}件</span>
        </div>
      </div>

      {/* インポートモーダル */}
      {showImportDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-xl border border-slate-100">
            <h4 className="font-bold text-slate-800 mb-2">JSONデータのインポート</h4>
            <p className="text-xs text-slate-500 mb-3">
              保存したJSONテキストを貼り付けてください。現在のチェック状態が上書きされます。
            </p>
            <textarea
              rows={6}
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              placeholder='{"rec_vs_01": true, ...}'
              className="w-full text-xs font-mono p-3 border border-slate-200 rounded-xl focus:border-[#33ccbb] focus:outline-hidden"
            />
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setShowImportDialog(false)}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                キャンセル
              </button>
              <button
                onClick={handleApplyImport}
                className="px-4 py-2 text-xs font-bold bg-[#33ccbb] hover:bg-[#2cb3a5] text-white rounded-xl"
              >
                復元を実行
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
