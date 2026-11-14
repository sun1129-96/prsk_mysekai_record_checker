import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
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
  MessageSquarePlus,
  Bug,
  Send,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import type { RecordItem, DisplaySettings } from '../types/record';
import { encodeShareData, decodeShareData } from '../utils/recordUtils';
import { useBodyScrollLock } from '../utils/useBodyScrollLock';
import dataChangelog from '../data/dataChangelog.json';

interface DataChangelogItem {
  category: 'new_song' | 'another_vocal' | 'connect_live' | 'other_vocal';
  label: string;
  text: string;
}

interface DataChangelogEntry {
  date: string;
  items: (string | DataChangelogItem)[];
}

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

  // モーダル表示時に背後のスクロールを防止
  useBodyScrollLock(showCodeRestoreDialog || Boolean(batchModalTarget));

  // Undo (元に戻す) 用のバックアップState
  const [undoBackup, setUndoBackup] = useState<Record<string, boolean> | null>(null);
  const undoTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ご意見・ご要望 / 不具合・バグ報告フォーム用State
  const [feedbackType, setFeedbackType] = useState<'feedback' | 'bug'>('feedback');
  const [feedbackCategory, setFeedbackCategory] = useState<string>('機能追加・改善');
  const [feedbackMessage, setFeedbackMessage] = useState<string>('');
  const [includeEnvironment, setIncludeEnvironment] = useState<boolean>(true);
  const [honeypot, setHoneypot] = useState<string>('');
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState<boolean>(false);
  const [feedbackStatus, setFeedbackStatus] = useState<{
    kind: 'success' | 'error';
    text: string;
  } | null>(null);

  const feedbackCategories = [
    '機能追加・改善',
    'UI・デザイン',
    'データ・表記',
    'その他',
  ];
  const bugCategories = [
    '表示崩れ・UI',
    'データ不備・誤り',
    '共有・保存の不具合',
    'その他',
  ];

  // フォーム種別切り替え時にカテゴリとステータスをリセット
  const handleChangeFeedbackType = (nextType: 'feedback' | 'bug') => {
    setFeedbackType(nextType);
    setFeedbackCategory(nextType === 'feedback' ? feedbackCategories[0] : bugCategories[0]);
    setFeedbackStatus(null);
  };

  // ご意見・不具合報告の送信ハンドラ
  const handleSubmitFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = feedbackMessage.trim();
    if (trimmed.length < 5) {
      setFeedbackStatus({
        kind: 'error',
        text: '内容は5文字以上で入力してください。',
      });
      return;
    }

    setIsSubmittingFeedback(true);
    setFeedbackStatus(null);

    try {
      const environment =
        feedbackType === 'bug' && includeEnvironment
          ? [
              `画面サイズ: ${window.innerWidth}x${window.innerHeight}`,
              `UserAgent: ${navigator.userAgent}`,
            ].join('\n')
          : '';

      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: feedbackType,
          category: feedbackCategory,
          message: trimmed,
          environment,
          website: honeypot,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(
          typeof data?.error === 'string'
            ? data.error
            : '送信に失敗しました。時間をおいて再度お試しください。'
        );
      }

      setFeedbackMessage('');
      setFeedbackStatus({
        kind: 'success',
        text:
          feedbackType === 'bug'
            ? '不具合・バグ報告を送信しました。ご協力ありがとうございます！'
            : 'ご意見・ご要望を送信しました。ありがとうございます！',
      });
    } catch (err) {
      setFeedbackStatus({
        kind: 'error',
        text:
          err instanceof Error
            ? err.message
            : '通信エラーが発生しました。時間をおいて再度お試しください。',
      });
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

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
    <div className="max-w-4xl mx-auto px-3 sm:px-6 py-4 space-y-4 sm:space-y-6">
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

      {/* 4. 更新履歴カード */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-sky-50 text-sky-600">
            <History className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm sm:text-base text-slate-800">
              更新履歴
            </h3>
            <p className="text-xs text-slate-400">
              アプリの新機能追加・楽曲データの更新履歴
            </p>
          </div>
        </div>

        <div className="pt-1 text-xs text-slate-600 border-l-2 border-slate-200 ml-3 pl-4 space-y-6">
          {/* 2026.11.14 */}
          <div className="relative">
            <span className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-[#33ccbb] ring-4 ring-white" />
            <div className="flex items-center gap-2 mb-2">
              <span className="font-bold font-mono text-slate-800 text-sm">2026.11.14</span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#33ccbb]/15 text-[#22998c]">
                <Sparkles className="w-2.5 h-2.5" />
                <span>新機能</span>
              </span>
            </div>
            <ul className="space-y-1.5 text-[11px] sm:text-xs text-slate-600 leading-relaxed pl-1">
              <li className="flex items-start gap-1.5">
                <span className="text-slate-400 select-none">-</span>
                <span>
                  <strong className="text-slate-700 font-semibold">[メニュー] お問い合わせフォームを追加</strong>（ご意見・ご要望フォームおよび不具合・バグ報告フォームから直接開発者へ送信できるようになりました）
                </span>
              </li>
            </ul>
          </div>

          {/* 自動更新されたデータ更新履歴 */}
          {(dataChangelog as DataChangelogEntry[]).map((entry) => (
            <div key={entry.date} className="relative">
              <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-sky-400 border-2 border-white ring-2 ring-sky-400/20" />
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-[12px] font-mono font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                  {entry.date}
                </span>
              </div>
              <div className="font-bold text-slate-800 text-xs sm:text-sm mb-2 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-sky-500 inline-block"></span>
                <span>データ更新</span>
              </div>
              <ul className="space-y-2 text-[11px] sm:text-xs text-slate-600 leading-relaxed pl-2">
                {entry.items.map((item, idx) => {
                  if (typeof item === 'string') {
                    return (
                      <li key={idx} className="flex items-start gap-1.5">
                        <span className="text-slate-400 select-none">-</span>
                        <span>{item}</span>
                      </li>
                    );
                  }
                  const badgeStyle =
                    item.category === 'new_song'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : item.category === 'another_vocal'
                      ? 'bg-purple-50 text-purple-700 border-purple-200'
                      : item.category === 'connect_live'
                      ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                      : 'bg-sky-50 text-sky-700 border-sky-200';
                  return (
                    <li key={idx} className="flex items-start gap-1.5">
                      <span className="text-slate-400 select-none mt-0.5">-</span>
                      <div className="space-x-1.5">
                        <span
                          className={`inline-block px-1.5 py-0.5 rounded border text-[10px] font-bold leading-none ${badgeStyle}`}
                        >
                          {item.label}
                        </span>
                        <span className="text-slate-700">{item.text}</span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}

          {/* 2026.11.13 */}
          <div className="relative">
            <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-[#33ccbb] border-2 border-white ring-2 ring-[#33ccbb]/20" />
            
            {/* 日付ヘッダー */}
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[12px] font-mono font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">2026.11.13</span>
            </div>

            {/* 新機能見出し */}
            <div className="font-bold text-slate-800 text-xs sm:text-sm mb-2 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block"></span>
              <span>新機能</span>
            </div>

            {/* 箇条書きリスト */}
            <div className="space-y-3 text-[11px] sm:text-xs text-slate-600 leading-relaxed">
              <div className="flex items-center gap-1.5">
                <span className="text-slate-400 select-none">-</span>
                <span className="font-semibold text-slate-800">初期リリース</span>
              </div>

              {/* リスト表示 */}
              <div className="space-y-1.5 pt-0.5">
                <div className="font-bold text-slate-700 flex items-center gap-1.5 text-[11px]">
                  <span className="w-1 h-3 bg-[#33ccbb] rounded-full inline-block" />
                  <span>リスト表示</span>
                </div>
                <ul className="space-y-1.5 pl-2">
                  <li className="flex items-start gap-1.5">
                    <span className="text-slate-400 select-none">-</span>
                    <span>
                      <strong className="text-slate-700 font-semibold">[チェック] 所持・未所持チェック</strong>（ワンタップでレコードの所持状況を記録し達成率を表示。クイックチェックモードでチェックに特化）
                    </span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="text-slate-400 select-none">-</span>
                    <span>
                      <strong className="text-slate-700 font-semibold">[並替・絞込] 多彩な検索・フィルター</strong>（ユニット、キャラクター、音源ver、書き下ろし種別、バナーキャラ等の詳細な絞り込みや五十音・実装日等の並べ替え）
                    </span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="text-slate-400 select-none">-</span>
                    <span>
                      <strong className="text-slate-700 font-semibold">[楽曲詳細] 楽曲の詳細情報</strong>（ジャケット画像、収録verの詳細等）の確認
                    </span>
                  </li>
                </ul>
              </div>

              {/* 所持率比較 */}
              <div className="space-y-1.5 pt-0.5">
                <div className="font-bold text-slate-700 flex items-center gap-1.5 text-[11px]">
                  <span className="w-1 h-3 bg-indigo-400 rounded-full inline-block" />
                  <span>所持率比較</span>
                </div>
                <ul className="space-y-1.5 pl-2">
                  <li className="flex items-start gap-1.5">
                    <span className="text-slate-400 select-none">-</span>
                    <span>
                      <strong className="text-slate-700 font-semibold">[比較・集計] 達成率の比較機能</strong>（ユニット別、音源ver別、周年・年度別、キャラクター別の収集率グラフ表示や、自由な条件で集計できるカスタム比較）
                    </span>
                  </li>
                </ul>
              </div>

              {/* メニュー */}
              <div className="space-y-1.5 pt-0.5">
                <div className="font-bold text-slate-700 flex items-center gap-1.5 text-[11px]">
                  <span className="w-1 h-3 bg-amber-400 rounded-full inline-block" />
                  <span>メニュー</span>
                </div>
                <ul className="space-y-1.5 pl-2">
                  <li className="flex items-start gap-1.5">
                    <span className="text-slate-400 select-none">-</span>
                    <span>
                      <strong className="text-slate-700 font-semibold">[データ管理] 進捗保存・共有機能</strong>（URL共有および進捗コードによる端末間のデータ引き継ぎや、楽曲の全選択・全解除機能）
                    </span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="text-slate-400 select-none">-</span>
                    <span>
                      <strong className="text-slate-700 font-semibold">[表示設定] リスト表示のカスタマイズ</strong>（ジャケット、実装日、実装順、歌唱バッジ等の表示・非表示切り替えやコンパクト表示対応）
                    </span>
                  </li>
                </ul>
              </div>
            </div>

            {/* データ見出し */}
            <div className="font-bold text-slate-800 text-xs sm:text-sm mt-3.5 mb-2 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-500 inline-block"></span>
              <span>データ</span>
            </div>

            {/* データリスト */}
            <ul className="space-y-1.5 text-[11px] sm:text-xs text-slate-600 leading-relaxed">
              <li className="flex items-start gap-1.5">
                <span className="text-slate-400 select-none">-</span>
                <span>2026.11.11までに追加された楽曲、楽曲バージョンの情報を反映</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* ご意見・ご要望 / 不具合・バグ報告フォーム */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-5 space-y-4">
        <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
          <div
            className={`p-2 rounded-xl transition-colors ${
              feedbackType === 'bug'
                ? 'bg-rose-50 text-rose-500'
                : 'bg-[#33ccbb]/10 text-[#22998c]'
            }`}
          >
            {feedbackType === 'bug' ? (
              <Bug className="w-5 h-5" />
            ) : (
              <MessageSquarePlus className="w-5 h-5" />
            )}
          </div>
          <div>
            <h3 className="font-bold text-slate-800 text-base">お問い合わせ</h3>
            <p className="text-xs text-slate-400">
              機能のリクエストやバグのご報告を匿名で送信できます
            </p>
          </div>
        </div>

        {/* フォーム種別切り替えタブ */}
        <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100/80 rounded-xl">
          <button
            type="button"
            onClick={() => handleChangeFeedbackType('feedback')}
            className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              feedbackType === 'feedback'
                ? 'bg-white text-[#22998c] shadow-xs'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <MessageSquarePlus className="w-3.5 h-3.5" />
            <span>ご意見・ご要望</span>
          </button>
          <button
            type="button"
            onClick={() => handleChangeFeedbackType('bug')}
            className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              feedbackType === 'bug'
                ? 'bg-white text-rose-600 shadow-xs'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Bug className="w-3.5 h-3.5" />
            <span>不具合・バグ報告</span>
          </button>
        </div>

        <form onSubmit={handleSubmitFeedback} className="space-y-3.5">
          {/* スパム対策用ハニーポット */}
          <input
            type="text"
            name="website"
            value={honeypot}
            onChange={(e) => setHoneypot(e.target.value)}
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
            className="hidden"
          />

          {/* カテゴリ選択 */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-600">
              カテゴリ
            </label>
            <div className="flex flex-wrap gap-1.5">
              {(feedbackType === 'feedback' ? feedbackCategories : bugCategories).map(
                (cat) => {
                  const isSelected = feedbackCategory === cat;
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setFeedbackCategory(cat)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer border ${
                        isSelected
                          ? feedbackType === 'bug'
                            ? 'bg-rose-50 border-rose-200 text-rose-600 font-bold'
                            : 'bg-[#33ccbb]/10 border-[#33ccbb]/40 text-[#22998c] font-bold'
                          : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                      }`}
                    >
                      {cat}
                    </button>
                  );
                }
              )}
            </div>
          </div>

          {/* 本文入力 */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label
                htmlFor="feedback-message-input"
                className="block text-xs font-semibold text-slate-600"
              >
                {feedbackType === 'bug' ? '不具合の詳細・発生手順' : 'ご意見・ご要望の内容'}
              </label>
              <span className="text-[11px] font-mono text-slate-400">
                {feedbackMessage.length} / 2000
              </span>
            </div>
            <textarea
              id="feedback-message-input"
              rows={4}
              maxLength={2000}
              value={feedbackMessage}
              onChange={(e) => {
                setFeedbackMessage(e.target.value);
                if (feedbackStatus) setFeedbackStatus(null);
              }}
              placeholder={
                feedbackType === 'bug'
                  ? '例：〇〇の画面で△△の操作をしたときに表示が崩れる、楽曲「□□」のデータが誤っている 等'
                  : '例：〇〇のような絞り込み機能がほしい、△△の表示を見やすくしてほしい 等'
              }
              className="w-full text-xs leading-relaxed p-3 bg-slate-50/70 border border-slate-200 rounded-xl focus:bg-white focus:border-[#33ccbb] focus:ring-2 focus:ring-[#33ccbb]/20 focus:outline-hidden resize-y transition-colors"
            />
          </div>

          {/* バグ報告時の環境情報添付オプション */}
          {feedbackType === 'bug' && (
            <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={includeEnvironment}
                onChange={(e) => setIncludeEnvironment(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-rose-500 focus:ring-rose-400"
              />
              <span>利用環境（画面サイズ・ブラウザ情報）を自動で添付する</span>
            </label>
          )}

          {/* 送信結果メッセージ */}
          {feedbackStatus && (
            <div
              className={`flex items-start gap-2 p-3 rounded-xl text-xs border ${
                feedbackStatus.kind === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                  : 'bg-rose-50 border-rose-200 text-rose-700'
              }`}
            >
              {feedbackStatus.kind === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              )}
              <span>{feedbackStatus.text}</span>
            </div>
          )}

          {/* 送信ボタン */}
          <div className="flex items-center justify-between pt-1">
            <span className="text-[11px] text-slate-400">
              ※ 個人情報は入力しないでください
            </span>
            <button
              type="submit"
              disabled={isSubmittingFeedback || feedbackMessage.trim().length < 5}
              className={`inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-white shadow-xs transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 ${
                feedbackType === 'bug'
                  ? 'bg-rose-500 hover:bg-rose-600'
                  : 'bg-[#33ccbb] hover:bg-[#2cb3a5]'
              }`}
            >
              <Send className="w-3.5 h-3.5" />
              <span>
                {isSubmittingFeedback
                  ? '送信中...'
                  : feedbackType === 'bug'
                  ? '不具合を報告する'
                  : 'ご意見を送信する'}
              </span>
            </button>
          </div>
        </form>
      </div>

      {/* 共有コード / URL 復元モーダル */}
      {showCodeRestoreDialog &&
        createPortal(
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs overscroll-contain animate-in fade-in duration-150"
            onClick={() => {
              setShowCodeRestoreDialog(false);
              setShareCodeInput('');
            }}
          >
            <div
              className="bg-white rounded-2xl max-w-md w-full p-5 shadow-xl border border-slate-100 animate-in zoom-in-95 duration-150"
              onClick={(e) => e.stopPropagation()}
            >
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
          </div>,
          document.body
        )}

      {/* 一括操作のカスタム確認モーダル（新設） */}
      {batchModalTarget &&
        createPortal(
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs overscroll-contain animate-in fade-in duration-150"
            onClick={() => setBatchModalTarget(null)}
          >
            <div
              className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-150 space-y-4"
              onClick={(e) => e.stopPropagation()}
            >
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
          </div>,
          document.body
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
