import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  ListFilter,
  BarChart3,
  Menu as MenuIcon,
  Disc,
  Info,
  X,
  Disc3,
  BarChart2,
  Sliders,
} from 'lucide-react';
import { useBodyScrollLock } from '../utils/useBodyScrollLock';

export type TabType = 'list' | 'comparison' | 'menu';

interface HeaderProps {
  currentTab: TabType;
  onTabChange: (tab: TabType) => void;
  ownedCount: number;
  totalCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onTabChange,
  ownedCount,
  totalCount,
}) => {
  const percentage = totalCount > 0 ? ((ownedCount / totalCount) * 100).toFixed(1) : '0.0';

  // 使い方ダイアログの状態 ('list' | 'comparison' | 'menu' | null)
  const [activeHelpModal, setActiveHelpModal] = useState<TabType | null>(null);

  // モーダル表示時に背後のスクロールを防止
  useBodyScrollLock(Boolean(activeHelpModal));

  // Escキーでダイアログを閉じる
  useEffect(() => {
    if (!activeHelpModal) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActiveHelpModal(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeHelpModal]);

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
        <div className="max-w-4xl mx-auto px-2 sm:px-6">
          {/* 最上部タイトルエリア */}
          <div className="flex items-center justify-between h-14 gap-2">
            <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-tr from-[#33ccbb] to-[#38bdf8] flex items-center justify-center text-white shadow-xs shrink-0">
                <Disc className="w-4 h-4 sm:w-5 sm:h-5 animate-[spin_12s_linear_infinite]" />
              </div>
              <div>
                <h1 className="text-sm sm:text-base md:text-lg font-bold text-slate-800 tracking-tight flex items-center gap-1 whitespace-nowrap">
                  <span className="hidden min-[380px]:inline">マイセカイ </span>レコードチェッカー
                </h1>
              </div>
            </div>

            {/* クイック進捗バッジ */}
            <div className="flex items-center gap-1 sm:gap-2 bg-slate-50 border border-slate-200/80 px-2 sm:px-2.5 py-1 rounded-full text-xs font-semibold text-slate-700 shrink-0 whitespace-nowrap">
              <span className="text-slate-400">所持</span>
              <span className="text-[#0d9488] font-bold text-xs sm:text-sm">
                {ownedCount}
              </span>
              <span className="text-slate-400 text-[11px] sm:text-xs">/ {totalCount}</span>
              <span className="bg-[#33ccbb]/15 text-[#0d9488] px-1.5 py-0.5 rounded-md font-bold text-[10px] sm:text-[11px]">
                {percentage}%
              </span>
            </div>
          </div>

          {/* 画面切り替えタブUI (各タブの横に使い方ⓘボタンを配置) */}
          <nav className="flex border-t border-slate-100">
            {/* リスト表示タブ */}
            <div
              className={`flex-1 flex items-center justify-center border-b-2 transition-all min-w-0 ${
                currentTab === 'list'
                  ? 'border-[#33ccbb] text-[#0d9488] bg-[#33ccbb]/5 font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
              }`}
            >
              <button
                type="button"
                onClick={() => onTabChange('list')}
                className="py-2.5 pl-1.5 pr-0.5 sm:px-2 text-[11px] min-[360px]:text-xs sm:text-sm font-semibold flex items-center justify-center gap-1 sm:gap-1.5 cursor-pointer flex-1 min-w-0"
              >
                <ListFilter className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                <span className="whitespace-nowrap">リスト表示</span>
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveHelpModal('list');
                }}
                className="relative p-1.5 sm:p-2 mr-0.5 sm:mr-1 rounded-full text-slate-400 hover:text-[#0d9488] hover:bg-slate-200/60 active:bg-slate-200 active:scale-90 transition-all cursor-pointer shrink-0 after:absolute after:-inset-1.5 after:content-['']"
                title="リスト表示の使い方を表示"
                aria-label="リスト表示の使い方を表示"
              >
                <Info className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>
            </div>

            {/* 所持率比較タブ */}
            <div
              className={`flex-1 flex items-center justify-center border-b-2 transition-all min-w-0 ${
                currentTab === 'comparison'
                  ? 'border-[#33ccbb] text-[#0d9488] bg-[#33ccbb]/5 font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
              }`}
            >
              <button
                type="button"
                onClick={() => onTabChange('comparison')}
                className="py-2.5 pl-1.5 pr-0.5 sm:px-2 text-[11px] min-[360px]:text-xs sm:text-sm font-semibold flex items-center justify-center gap-1 sm:gap-1.5 cursor-pointer flex-1 min-w-0"
              >
                <BarChart3 className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                <span className="whitespace-nowrap">所持率比較</span>
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveHelpModal('comparison');
                }}
                className="relative p-1.5 sm:p-2 mr-0.5 sm:mr-1 rounded-full text-slate-400 hover:text-[#0d9488] hover:bg-slate-200/60 active:bg-slate-200 active:scale-90 transition-all cursor-pointer shrink-0 after:absolute after:-inset-1.5 after:content-['']"
                title="所持率比較の使い方を表示"
                aria-label="所持率比較の使い方を表示"
              >
                <Info className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>
            </div>

            {/* メニュータブ */}
            <div
              className={`flex-1 flex items-center justify-center border-b-2 transition-all min-w-0 ${
                currentTab === 'menu'
                  ? 'border-[#33ccbb] text-[#0d9488] bg-[#33ccbb]/5 font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
              }`}
            >
              <button
                type="button"
                onClick={() => onTabChange('menu')}
                className="py-2.5 pl-1.5 pr-0.5 sm:px-2 text-[11px] min-[360px]:text-xs sm:text-sm font-semibold flex items-center justify-center gap-1 sm:gap-1.5 cursor-pointer flex-1 min-w-0"
              >
                <MenuIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                <span className="whitespace-nowrap">メニュー</span>
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveHelpModal('menu');
                }}
                className="relative p-1.5 sm:p-2 mr-0.5 sm:mr-1 rounded-full text-slate-400 hover:text-[#0d9488] hover:bg-slate-200/60 active:bg-slate-200 active:scale-90 transition-all cursor-pointer shrink-0 after:absolute after:-inset-1.5 after:content-['']"
                title="メニューの使い方を表示"
                aria-label="メニューの使い方を表示"
              >
                <Info className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>
            </div>
          </nav>
        </div>
      </header>

      {/* 各画面の使い方モーダル (画面中央に確実に表示するため createPortal で document.body に描画) */}
      {activeHelpModal &&
        createPortal(
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/40 backdrop-blur-xs overscroll-contain animate-in fade-in duration-150"
            onClick={() => setActiveHelpModal(null)}
          >
            {/* 1. リスト表示の使い方モーダル */}
            {activeHelpModal === 'list' && (
              <div
                className="bg-white rounded-3xl max-w-lg md:max-w-xl w-full p-4 sm:p-6 shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-150 flex flex-col gap-3.5 sm:gap-4 text-slate-800 max-h-[85vh] overflow-y-auto overscroll-contain"
                onClick={(e) => e.stopPropagation()}
              >
                {/* モーダルヘッダー */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
                  <div className="flex items-center gap-2 sm:gap-2.5">
                    <div className="p-2 rounded-xl bg-[#33ccbb]/10 text-[#0d9488]">
                      <Disc3 className="w-5 h-5 text-[#33ccbb]" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm sm:text-base text-slate-800">リスト表示の使い方</h3>
                      <p className="text-[11px] text-slate-500">レコードの確認・所持登録・検索</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveHelpModal(null)}
                    className="p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                    aria-label="閉じる"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* モーダル本文 */}
                <div className="space-y-3 sm:space-y-3.5 text-xs sm:text-sm text-slate-600 leading-relaxed">
                  {/* 所持チェック */}
                  <div className="bg-slate-50 rounded-2xl p-3 sm:p-3.5 border border-slate-200/80 space-y-1 sm:space-y-1.5">
                    <div className="flex items-center gap-1.5 font-bold text-slate-800">
                      <span className="w-2 h-2 rounded-full bg-[#33ccbb]"></span>
                      <span>所持チェックの切り替え</span>
                    </div>
                    <div className="text-slate-600 text-xs pl-2.5 sm:pl-3.5 space-y-1 leading-relaxed">
                      <p>・<strong className="text-slate-700">通常モード</strong>: 曲カードの右端にあるチェックボタンをタップして、所持・未所持を切り替えます。カードをタップすると、歌唱バージョンやジャケットなどの詳しい情報が開きます。</p>
                      <p>・<strong className="text-slate-700">クイックチェック</strong>: 操作バーのスイッチをONにすると、カードのどこをタップしても素早く所持チェックを切り替えられます。手持ちのレコードをまとめて登録したいときに便利です。</p>
                    </div>
                  </div>

                  {/* 並べ替え・絞り込み */}
                  <div className="bg-slate-50 rounded-2xl p-3 sm:p-3.5 border border-slate-200/80 space-y-1 sm:space-y-1.5">
                    <div className="flex items-center gap-1.5 font-bold text-slate-800">
                      <span className="w-2 h-2 rounded-full bg-sky-500"></span>
                      <span>並べ替えと絞り込み（フィルター）</span>
                    </div>
                    <p className="text-slate-600 text-xs pl-2.5 sm:pl-3.5 leading-relaxed">
                      「並替・絞込」ボタンから、五十音順や実装日順への並べ替えや、ユニット、キャラクター、歌唱バージョンなどで絞り込んで表示できます。絞り込み中は「クリア」ボタンを押すと、すべての条件を一度に解除できます。
                    </p>
                  </div>

                  {/* ジャケット切り替え */}
                  <div className="bg-slate-50 rounded-2xl p-3 sm:p-3.5 border border-slate-200/80 space-y-1 sm:space-y-1.5">
                    <div className="flex items-center gap-1.5 font-bold text-slate-800">
                      <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                      <span>ジャケット画像の切り替え</span>
                    </div>
                    <p className="text-slate-600 text-xs pl-2.5 sm:pl-3.5 leading-relaxed">
                      カード左端のジャケット画像をタップすると、セカイver.やバーチャル・シンガーver.などの別ジャケット画像に切り替えて見ることができます。
                    </p>
                  </div>
                </div>

                {/* モーダルフッター */}
                <button
                  type="button"
                  onClick={() => setActiveHelpModal(null)}
                  className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer mt-1"
                >
                  閉じる
                </button>
              </div>
            )}

            {/* 2. 所持率比較の使い方モーダル */}
            {activeHelpModal === 'comparison' && (
              <div
                className="bg-white rounded-3xl max-w-lg md:max-w-xl w-full p-4 sm:p-6 shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-150 flex flex-col gap-3.5 sm:gap-4 text-slate-800 max-h-[85vh] overflow-y-auto overscroll-contain"
                onClick={(e) => e.stopPropagation()}
              >
                {/* モーダルヘッダー */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
                  <div className="flex items-center gap-2 sm:gap-2.5">
                    <div className="p-2 rounded-xl bg-[#33ccbb]/10 text-[#0d9488]">
                      <BarChart2 className="w-5 h-5 text-[#33ccbb]" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm sm:text-base text-slate-800">所持率比較の使い方</h3>
                      <p className="text-[11px] text-slate-500">グループ別の所持率の確認と条件付き移動</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveHelpModal(null)}
                    className="p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                    aria-label="閉じる"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* モーダル本文 */}
                <div className="space-y-3 sm:space-y-3.5 text-xs sm:text-sm text-slate-600 leading-relaxed">
                  {/* 5大グループ別所持率 */}
                  <div className="bg-slate-50 rounded-2xl p-3 sm:p-3.5 border border-slate-200/80 space-y-1 sm:space-y-1.5">
                    <div className="flex items-center gap-1.5 font-bold text-slate-800">
                      <span className="w-2 h-2 rounded-full bg-[#33ccbb]"></span>
                      <span>5つのグループ別所持率</span>
                    </div>
                    <div className="text-slate-600 text-xs pl-2.5 sm:pl-3.5 space-y-1 leading-relaxed">
                      <p>・<strong className="text-slate-700">ユニット別</strong>: 各ユニットごとの所持数と所持率を棒グラフで一覧確認できます。</p>
                      <p>・<strong className="text-slate-700">歌唱ver別</strong>: セカイver.、バーチャル・シンガーver.、アナザーボーカルver.ごとの所持率を確認できます。</p>
                      <p>・<strong className="text-slate-700">実装年別</strong>: ゲームに楽曲が追加された年（周年）ごとの所持率を確認できます。</p>
                      <p>・<strong className="text-slate-700">歌唱キャラ別</strong>: 各キャラクターが歌唱に参加している楽曲ごとの所持率を確認できます。</p>
                      <p>・<strong className="text-slate-700">カスタム比較</strong>: ユニット、キャラクター、歌唱バージョンなどを自由に組み合わせた自分だけのグループを作って所持率を確認できます。</p>
                    </div>
                  </div>

                  {/* リスト画面への移動 */}
                  <div className="bg-slate-50 rounded-2xl p-3 sm:p-3.5 border border-slate-200/80 space-y-1 sm:space-y-1.5">
                    <div className="flex items-center gap-1.5 font-bold text-slate-800">
                      <span className="w-2 h-2 rounded-full bg-sky-500"></span>
                      <span>リスト画面への移動機能</span>
                    </div>
                    <p className="text-slate-600 text-xs pl-2.5 sm:pl-3.5 leading-relaxed">
                      各項目の右側にある矢印ボタン（↗）をタップすると、そのグループの楽曲（例:「MORE MORE JUMP!の未所持曲」など）だけを絞り込んだ状態でリスト表示画面へ移動できます。
                    </p>
                  </div>

                  {/* 並べ替えとタブの横スクロール */}
                  <div className="bg-slate-50 rounded-2xl p-3 sm:p-3.5 border border-slate-200/80 space-y-1 sm:space-y-1.5">
                    <div className="flex items-center gap-1.5 font-bold text-slate-800">
                      <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                      <span>並べ替えとタブの横スクロール</span>
                    </div>
                    <p className="text-slate-600 text-xs pl-2.5 sm:pl-3.5 leading-relaxed">
                      右上の並べ替えメニューから「所持率が高い順」「曲数が多い順」などに並び替えることができます。また、画面幅が狭いときは、タブの両端にある「&lt;」や「&gt;」をタップすると、隠れているタブへスムーズに移動できます。
                    </p>
                  </div>
                </div>

                {/* モーダルフッター */}
                <button
                  type="button"
                  onClick={() => setActiveHelpModal(null)}
                  className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer mt-1"
                >
                  閉じる
                </button>
              </div>
            )}

            {/* 3. メニューの使い方モーダル */}
            {activeHelpModal === 'menu' && (
              <div
                className="bg-white rounded-3xl max-w-lg md:max-w-xl w-full p-4 sm:p-6 shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-150 flex flex-col gap-3.5 sm:gap-4 text-slate-800 max-h-[85vh] overflow-y-auto overscroll-contain"
                onClick={(e) => e.stopPropagation()}
              >
                {/* モーダルヘッダー */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
                  <div className="flex items-center gap-2 sm:gap-2.5">
                    <div className="p-2 rounded-xl bg-[#33ccbb]/10 text-[#0d9488]">
                      <Sliders className="w-5 h-5 text-[#33ccbb]" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm sm:text-base text-slate-800">メニューの使い方</h3>
                      <p className="text-[11px] text-slate-500">進捗の保存・引き継ぎや画面のカスタマイズ</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveHelpModal(null)}
                    className="p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                    aria-label="閉じる"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* モーダル本文 */}
                <div className="space-y-3 sm:space-y-3.5 text-xs sm:text-sm text-slate-600 leading-relaxed">
                  {/* 進捗の共有・引き継ぎ */}
                  <div className="bg-slate-50 rounded-2xl p-3 sm:p-3.5 border border-slate-200/80 space-y-1 sm:space-y-1.5">
                    <div className="flex items-center gap-1.5 font-bold text-slate-800">
                      <span className="w-2 h-2 rounded-full bg-[#33ccbb]"></span>
                      <span>進捗の保存・引き継ぎ</span>
                    </div>
                    <div className="text-slate-600 text-xs pl-2.5 sm:pl-3.5 space-y-1 leading-relaxed">
                      <p>・<strong className="text-slate-700">共有URLコピー</strong>: 現在の所持チェック状態を含んだ専用のURLをコピーします。スマートフォンのブックマークに保存したり、別の端末に送って開くことでデータを引き継げます。</p>
                      <p>・<strong className="text-slate-700">進捗コードコピー</strong>: 短い文字のコードを発行します。</p>
                      <p>・<strong className="text-slate-700">コードやURLから復元</strong>: 発行された進捗コードまたはURLを貼り付けることで、いつでもチェック状態を復元できます。</p>
                    </div>
                  </div>

                  {/* リストの表示設定 */}
                  <div className="bg-slate-50 rounded-2xl p-3 sm:p-3.5 border border-slate-200/80 space-y-1 sm:space-y-1.5">
                    <div className="flex items-center gap-1.5 font-bold text-slate-800">
                      <span className="w-2 h-2 rounded-full bg-sky-500"></span>
                      <span>リストの表示設定</span>
                    </div>
                    <p className="text-slate-600 text-xs pl-2.5 sm:pl-3.5 leading-relaxed">
                      楽曲リスト上でジャケット画像、曲の追加日、追加順、歌唱バージョン、キャラクター名の表示・非表示を個別に切り替えられます。「コンパクト表示」にすると、画面に一度に多くの曲を表示できます。
                    </p>
                  </div>

                  {/* まとめてチェック・解除 */}
                  <div className="bg-slate-50 rounded-2xl p-3 sm:p-3.5 border border-slate-200/80 space-y-1 sm:space-y-1.5">
                    <div className="flex items-center gap-1.5 font-bold text-slate-800">
                      <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                      <span>まとめてチェック・解除</span>
                    </div>
                    <p className="text-slate-600 text-xs pl-2.5 sm:pl-3.5 leading-relaxed">
                      すべての楽曲を一括で「所持」または「未所持（解除）」にできます。間違えて押してしまっても、操作後10秒以内なら「元に戻す」ボタンで元の状態に戻せます。
                    </p>
                  </div>

                  {/* 更新履歴 */}
                  <div className="bg-slate-50 rounded-2xl p-3 sm:p-3.5 border border-slate-200/80 space-y-1 sm:space-y-1.5">
                    <div className="flex items-center gap-1.5 font-bold text-slate-800">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                      <span>更新履歴</span>
                    </div>
                    <p className="text-slate-600 text-xs pl-2.5 sm:pl-3.5 leading-relaxed">
                      アプリの新しい機能や追加された楽曲データなどの更新内容を確認できます。
                    </p>
                  </div>
                </div>

                {/* モーダルフッター */}
                <button
                  type="button"
                  onClick={() => setActiveHelpModal(null)}
                  className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer mt-1"
                >
                  閉じる
                </button>
              </div>
            )}
          </div>,
          document.body
        )}
    </>
  );
};
