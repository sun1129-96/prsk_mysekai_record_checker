import React, { useState, useRef } from 'react';
import {
  Share2,
  RotateCcw,
  CheckCheck,
  Copy,
  Check,
  KeyRound,
  Undo2,
  Sliders,
  History,
  AlertTriangle,
  Sparkles,
} from 'lucide-react';
import type { RecordItem, DisplaySettings } from '../types/record';
import { encodeShareData, decodeShareData } from '../utils/recordUtils';

interface MenuViewProps {
  records: RecordItem[];
  ownedRecordIds: Record<string, boolean>;
  onBatchCheckAll: (owned: boolean) => void;
  onImportData: (data: Record<string, boolean>) => void;
  displaySettings: DisplaySettings;
  onDisplaySettingsChange: React.Dispatch<React.SetStateAction<DisplaySettings>>;
}

export const MenuView: React.FC<MenuViewProps> = ({
  records,
  ownedRecordIds,
  onBatchCheckAll,
  onImportData,
  displaySettings,
  onDisplaySettingsChange,
}) => {
  const [copiedShareUrl, setCopiedShareUrl] = useState(false);
  const [copiedShareCode, setCopiedShareCode] = useState(false);
  const [showCodeRestoreDialog, setShowCodeRestoreDialog] = useState(false);
  const [shareCodeInput, setShareCodeInput] = useState('');

  // 一括操作モーダル用State
  const [batchModalTarget, setBatchModalTarget] = useState<'all_owned' | 'all_clear' | null>(null);

  // Undo (元に戻す) 用のバックアップState
  const [undoBackup, setUndoBackup] = useState<Record<string, boolean> | null>(null);
  const undoTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // サーバーレス・ゼロコスト共有URL生成（BitSet Base64URL 圧縮: 約122文字）
  const handleGenerateShareUrl = () => {
    try {
      const code = encodeShareData(ownedRecordIds, records.length);
      const url = `${window.location.origin}${window.location.pathname}?share=${code}`;
      navigator.clipboard.writeText(url);
      setCopiedShareUrl(true);
      setTimeout(() => setCopiedShareUrl(false), 2500);
    } catch {
      alert('共有URLの生成に失敗しました');
    }
  };

  // 進捗コード（英数字のみ）のコピー
  const handleCopyShareCode = () => {
    try {
      const code = encodeShareData(ownedRecordIds, records.length);
      navigator.clipboard.writeText(code);
      setCopiedShareCode(true);
      setTimeout(() => setCopiedShareCode(false), 2500);
    } catch {
      alert('共有コードの生成に失敗しました');
    }
  };

  // 共有コードまたは共有URLからの復元実行
  const handleApplyShareCode = () => {
    try {
      let rawCode = shareCodeInput.trim();
      if (rawCode.includes('share=')) {
        try {
          const urlObj = new URL(rawCode);
          rawCode = urlObj.searchParams.get('share') || rawCode;
        } catch {
          const match = rawCode.match(/share=([A-Za-z0-9_-]+)/);
          if (match) rawCode = match[1];
        }
      }

      const decoded = decodeShareData(rawCode);
      const keys = Object.keys(decoded);
      if (keys.length > 0) {
        onImportData(decoded);
        setShowCodeRestoreDialog(false);
        setShareCodeInput('');
        alert(`進捗データを復元しました！（所持曲数: ${keys.length}曲）`);
      } else {
        alert('コードの形式が無効またはデータが空です。正しいコードを入力してください。');
      }
    } catch {
      alert('進捗コードの解析に失敗しました。');
    }
  };

  // 一括操作実行（安全なカスタムモーダル承認後）
  const handleConfirmBatch = () => {
    if (!batchModalTarget) return;
    const isOwned = batchModalTarget === 'all_owned';

    // 直前の状態をUndo用に保存
    setUndoBackup({ ...ownedRecordIds });
    if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current);
    undoTimeoutRef.current = setTimeout(() => {
      setUndoBackup(null);
    }, 10000); // 10秒間Undo可能

    onBatchCheckAll(isOwned);
    setBatchModalTarget(null);
  };

  // 元に戻す (Undo)
  const handleUndo = () => {
    if (undoBackup) {
      onImportData(undoBackup);
      setUndoBackup(null);
      if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current);
    }
  };

  // 表示設定のトグルヘルパー
  const handleToggleDisplay = (key: keyof DisplaySettings) => {
    onDisplaySettingsChange((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const currentOwnedCount = Object.values(ownedRecordIds).filter(Boolean).length;

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-6 py-6 space-y-6">
      {/* 1. 進捗の共有・引継ぎカード */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-2.5 mb-3">
          <div className="p-2 rounded-xl bg-[#33ccbb]/10 text-[#0d9488]">
            <Share2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm sm:text-base text-slate-800">
              進捗の共有・引継ぎ
            </h3>
            <p className="text-xs text-slate-400">
              チェック状況を他端末に移すためのコードや共有URLを発行します。
              <br />
              いずれかを入力することでチェック状況の引継ぎを行えます。
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2.5">
          {/* 共有URLコピー */}
          <button
            onClick={handleGenerateShareUrl}
            className="px-4 py-2.5 bg-[#33ccbb] hover:bg-[#2cb3a5] text-white rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer active:scale-95"
          >
            {copiedShareUrl ? (
              <>
                <Check className="w-4 h-4" />
                <span>URLをコピーしました！</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>共有URLを発行してコピー</span>
              </>
            )}
          </button>

          {/* 進捗コードコピー */}
          <button
            onClick={handleCopyShareCode}
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200/80 text-slate-700 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-2xs border border-slate-200 cursor-pointer active:scale-95"
          >
            {copiedShareCode ? (
              <>
                <Check className="w-4 h-4 text-[#0d9488]" />
                <span>コードをコピーしました！</span>
              </>
            ) : (
              <>
                <KeyRound className="w-4 h-4 text-slate-500" />
                <span>進捗コードをコピー</span>
              </>
            )}
          </button>

          {/* コードから復元ボタン */}
          <button
            onClick={() => setShowCodeRestoreDialog(true)}
            className="px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-700 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-2xs border border-slate-200 cursor-pointer active:scale-95"
          >
            <Sparkles className="w-4 h-4 text-[#33ccbb]" />
            <span>コード / URLから復元</span>
          </button>
        </div>
      </div>

      {/* 2. 表示項目の設定カード（新設） */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm sm:text-base text-slate-800">
              表示項目の設定
            </h3>
            <p className="text-xs text-slate-400">
              楽曲リストでの表示項目を設定します。設定内容はブラウザに自動保存されます。
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
          {/* ジャケット画像表示 */}
          <label className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 hover:bg-slate-100/80 border border-slate-200/70 transition-colors cursor-pointer">
            <div>
              <span className="block font-bold text-xs sm:text-sm text-slate-800">ジャケット画像</span>
              <span className="block text-[11px] text-slate-400">OFFにすると通信量を節約できます</span>
            </div>
            <input
              type="checkbox"
              checked={displaySettings.showJacket}
              onChange={() => handleToggleDisplay('showJacket')}
              className="w-4 h-4 accent-[#33ccbb] rounded cursor-pointer"
            />
          </label>

          {/* 歌唱バージョンバッジ表示 */}
          <label className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 hover:bg-slate-100/80 border border-slate-200/70 transition-colors cursor-pointer">
            <div>
              <span className="block font-bold text-xs sm:text-sm text-slate-800">歌唱verバッジ</span>
              <span className="block text-[11px] text-slate-400">セカイ/VS/アナボ等のバッジ表示</span>
            </div>
            <input
              type="checkbox"
              checked={displaySettings.showVocalBadges}
              onChange={() => handleToggleDisplay('showVocalBadges')}
              className="w-4 h-4 accent-[#33ccbb] rounded cursor-pointer"
            />
          </label>

          {/* 実装日表示 */}
          <label className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 hover:bg-slate-100/80 border border-slate-200/70 transition-colors cursor-pointer">
            <div>
              <span className="block font-bold text-xs sm:text-sm text-slate-800">実装日</span>
              <span className="block text-[11px] text-slate-400">ゲーム内実装日付の表示</span>
            </div>
            <input
              type="checkbox"
              checked={displaySettings.showReleaseDate}
              onChange={() => handleToggleDisplay('showReleaseDate')}
              className="w-4 h-4 accent-[#33ccbb] rounded cursor-pointer"
            />
          </label>

          {/* 実装順表示 */}
          <label className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 hover:bg-slate-100/80 border border-slate-200/70 transition-colors cursor-pointer">
            <div>
              <span className="block font-bold text-xs sm:text-sm text-slate-800">実装順</span>
              <span className="block text-[11px] text-slate-400">楽曲の通し番号（No.）の表示</span>
            </div>
            <input
              type="checkbox"
              checked={displaySettings.showReleaseOrder}
              onChange={() => handleToggleDisplay('showReleaseOrder')}
              className="w-4 h-4 accent-[#33ccbb] rounded cursor-pointer"
            />
          </label>

          {/* コンパクトモード */}
          <label className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 hover:bg-slate-100/80 border border-slate-200/70 transition-colors cursor-pointer sm:col-span-2">
            <div>
              <span className="block font-bold text-xs sm:text-sm text-slate-800">コンパクト表示モード</span>
              <span className="block text-[11px] text-slate-400">行間を狭め、1画面にたくさんの楽曲を一覧表示</span>
            </div>
            <input
              type="checkbox"
              checked={displaySettings.compactMode}
              onChange={() => handleToggleDisplay('compactMode')}
              className="w-4 h-4 accent-[#33ccbb] rounded cursor-pointer"
            />
          </label>
        </div>
      </div>

      {/* 3. データ一括操作カード */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
            <RotateCcw className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm sm:text-base text-slate-800">
              データの一括操作
            </h3>
            <p className="text-xs text-slate-400">
              すべての楽曲の所持ステータスを一括で変更します。
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2.5 pt-1">
          <button
            onClick={() => setBatchModalTarget('all_owned')}
            className="px-4 py-2.5 rounded-xl border border-slate-200 hover:border-emerald-300 text-xs sm:text-sm font-bold text-slate-700 hover:text-emerald-700 hover:bg-emerald-50/50 flex items-center gap-2 transition-all cursor-pointer active:scale-95 shadow-2xs"
          >
            <CheckCheck className="w-4 h-4 text-emerald-600" />
            <span>すべて所持済みにする</span>
          </button>

          <button
            onClick={() => setBatchModalTarget('all_clear')}
            className="px-4 py-2.5 rounded-xl border border-rose-200 hover:border-rose-300 text-xs sm:text-sm font-bold text-rose-600 hover:bg-rose-50 flex items-center gap-2 transition-all cursor-pointer active:scale-95 shadow-2xs"
          >
            <RotateCcw className="w-4 h-4 text-rose-500" />
            <span>すべてのチェックを解除</span>
          </button>
        </div>
      </div>

      {/* 4. 更新履歴（Changelog）カード */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-sky-50 text-sky-600">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-slate-800">
                更新履歴（Changelog）
              </h3>
              <p className="text-xs text-slate-400">
                アプリの新機能追加・楽曲データの更新履歴
              </p>
            </div>
          </div>
          <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/60 font-mono">
            全{records.length}曲対応
          </span>
        </div>

        <div className="pt-1 text-xs text-slate-600 border-l-2 border-slate-200 ml-3 pl-4">
          <div className="relative">
            <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-[#33ccbb] border-2 border-white ring-2 ring-[#33ccbb]/20" />
            <div className="flex items-center gap-2 mb-1">
              <span className="font-bold text-slate-800">楽曲データ最終追加</span>
              <span className="text-[11px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">2026.11.08</span>
            </div>
            <p className="text-slate-500 text-[11px] leading-relaxed">
              最新の追加楽曲を含む全{records.length}曲のレコードマスターデータ（ジャケット・公式読み仮名・歌唱ver音源情報）を反映済みです。
            </p>
          </div>
        </div>
      </div>

      {/* 共有コード / URL 復元モーダル */}
      {showCodeRestoreDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <h4 className="font-bold text-slate-800 mb-2 flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-[#33ccbb]" />
              <span>進捗コード / URL から復元</span>
            </h4>
            <p className="text-xs text-slate-500 mb-3">
              コピーした進捗コード（例: <code className="text-[11px] font-mono bg-slate-100 px-1 py-0.5 rounded">b1_...</code>）または共有URLを貼り付けてください。現在のチェック状態が上書き復元されます。
            </p>
            <textarea
              rows={4}
              value={shareCodeInput}
              onChange={(e) => setShareCodeInput(e.target.value)}
              placeholder="b1_Ab9_xK3... または https://.../?share=b1_..."
              className="w-full text-xs font-mono p-3 border border-slate-200 rounded-xl focus:border-[#33ccbb] focus:ring-2 focus:ring-[#33ccbb]/20 focus:outline-hidden"
            />
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowCodeRestoreDialog(false);
                  setShareCodeInput('');
                }}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                キャンセル
              </button>
              <button
                onClick={handleApplyShareCode}
                className="px-4 py-2 text-xs font-bold bg-[#33ccbb] hover:bg-[#2cb3a5] text-white rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                復元を実行
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 一括操作のカスタム確認モーダル（新設） */}
      {batchModalTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150 space-y-4">
            <div className="flex items-center gap-3">
              <div
                className={`p-3 rounded-2xl ${
                  batchModalTarget === 'all_owned'
                    ? 'bg-emerald-50 text-emerald-600'
                    : 'bg-rose-50 text-rose-600'
                }`}
              >
                {batchModalTarget === 'all_owned' ? (
                  <CheckCheck className="w-6 h-6" />
                ) : (
                  <AlertTriangle className="w-6 h-6" />
                )}
              </div>
              <div>
                <h4 className="font-bold text-base text-slate-800">
                  {batchModalTarget === 'all_owned'
                    ? 'すべて所持済みにしますか？'
                    : 'すべてのチェックを解除しますか？'}
                </h4>
                <p className="text-xs text-slate-400">一括操作の確認</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70 text-xs text-slate-600 space-y-2">
              <div className="flex justify-between items-center">
                <span>現在の所持曲数:</span>
                <span className="font-bold font-mono text-slate-800">
                  {currentOwnedCount} / {records.length} 曲
                </span>
              </div>
              <div className="flex justify-between items-center pt-1 border-t border-slate-200/60">
                <span>変更後の所持曲数:</span>
                <span
                  className={`font-bold font-mono text-sm ${
                    batchModalTarget === 'all_owned' ? 'text-emerald-600' : 'text-rose-600'
                  }`}
                >
                  {batchModalTarget === 'all_owned' ? records.length : 0} / {records.length} 曲
                </span>
              </div>
              <p className="text-[11px] text-slate-400 pt-1">
                ※ 実行後も画面下の「元に戻す」ボタンから直前の状態に復元できます。
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-1">
              <button
                onClick={() => setBatchModalTarget(null)}
                className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                キャンセル
              </button>
              <button
                onClick={handleConfirmBatch}
                className={`px-5 py-2.5 text-xs font-bold text-white rounded-xl shadow-xs transition-all cursor-pointer active:scale-95 ${
                  batchModalTarget === 'all_owned'
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-rose-600 hover:bg-rose-700'
                }`}
              >
                {batchModalTarget === 'all_owned' ? 'すべて所持済みにする' : 'チェックを全解除'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Undo (元に戻す) スナックバー */}
      {undoBackup && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-5 duration-200">
          <div className="bg-slate-900/95 backdrop-blur-md text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 text-xs border border-slate-700/60 max-w-sm sm:max-w-md w-[92vw]">
            <span className="flex-1 truncate">
              一括操作を実行しました
            </span>
            <button
              onClick={handleUndo}
              className="px-3 py-1.5 bg-[#33ccbb] hover:bg-[#2cb3a5] text-slate-900 font-bold rounded-xl flex items-center gap-1.5 transition-colors shrink-0 shadow-xs cursor-pointer active:scale-95"
            >
              <Undo2 className="w-3.5 h-3.5" />
              <span>元に戻す</span>
            </button>
            <button
              onClick={() => setUndoBackup(null)}
              className="text-slate-400 hover:text-white p-1 text-[11px] cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
