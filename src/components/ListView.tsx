import React, { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import {
  Search,
  SlidersHorizontal,
  X,
  Disc3,
  Zap,
  Filter,
  RotateCcw,
  Info,
} from 'lucide-react';
import { useWindowVirtualizer } from '@tanstack/react-virtual';
import type {
  RecordItem,
  SortType,
  SortDirection,
  FilterOptions,
  DisplaySettings,
  TapActionMode,
} from '../types/record';
import { UNIT_METAS, getJacketIndexForTrack } from '../types/record';
import { FilterSortModal } from './ToolbarModals';
import { RecordDetailModal } from './RecordDetailModal';
import { filterAndSortRecords } from '../utils/recordUtils';
import { RecordRow } from './RecordRow';

interface ListViewProps {
  records: RecordItem[];
  ownedRecordIds: Record<string, boolean>;
  onToggleOwned: (id: string) => void;
  displaySettings: DisplaySettings;
  onDisplaySettingsChange?: React.Dispatch<React.SetStateAction<DisplaySettings>>;
  filterOptions: FilterOptions;
  onFilterOptionsChange: React.Dispatch<React.SetStateAction<FilterOptions>>;
}

export const ListView: React.FC<ListViewProps> = ({
  records,
  ownedRecordIds,
  onToggleOwned,
  displaySettings,
  filterOptions,
  onFilterOptionsChange,
}) => {
  const listRef = useRef<HTMLDivElement>(null);

  // 並び替え状態（初期値: デフォルト順昇順）
  const [sortType, setSortType] = useState<SortType>('defaultSort');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  // タップ動作モード: 'detail' (詳細モーダル) vs 'quick_check' (行全体でチェック切り替え)
  const [tapMode, setTapMode] = useState<TapActionMode>('detail');

  // モーダル状態
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [showQuickCheckHelp, setShowQuickCheckHelp] = useState(false);
  const [selectedRecordForDetail, setSelectedRecordForDetail] = useState<RecordItem | null>(null);
  const [selectedTrackIdForDetail, setSelectedTrackIdForDetail] = useState<string | null>(null);

  // Escキーでクイックチェック説明ダイアログを閉じる
  useEffect(() => {
    if (!showQuickCheckHelp) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowQuickCheckHelp(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showQuickCheckHelp]);

  // 個別ジャケット切り替え状態（recordId -> jacketIndex: 3枚以上のジャケットにも完全対応）
  const [jacketIndexMap, setJacketIndexMap] = useState<Record<string, number>>({});

  const handleRotateJacket = useCallback((recordId: string, totalCount: number) => {
    setJacketIndexMap((prev) => {
      const current = typeof prev[recordId] === 'number' ? prev[recordId] : 0;
      return {
        ...prev,
        [recordId]: (current + 1) % totalCount,
      };
    });
  }, []);

  const handleSetJacketIndex = useCallback((recordId: string, index: number) => {
    setJacketIndexMap((prev) => ({
      ...prev,
      [recordId]: index,
    }));
  }, []);

  // 歌唱バージョンバッジをクリックした際の処理
  const handleBadgeClick = useCallback((record: RecordItem, trackId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (tapMode === 'quick_check') {
      // クイックチェックモード時は詳細モーダルを開かず、所持チェックを切り替える
      onToggleOwned(record.id);
      return;
    }

    // 歌唱バージョンに対応するジャケットインデックスを算出して設定
    const targetJacketIndex = getJacketIndexForTrack(record, trackId);
    setJacketIndexMap((prev) => ({
      ...prev,
      [record.id]: targetJacketIndex,
    }));

    setSelectedRecordForDetail(record);
    setSelectedTrackIdForDetail(trackId);
  }, [tapMode, onToggleOwned]);

  const handleRowClick = useCallback((record: RecordItem) => {
    if (tapMode === 'quick_check') {
      onToggleOwned(record.id);
    } else {
      setSelectedTrackIdForDetail(null);
      setSelectedRecordForDetail(record);
    }
  }, [tapMode, onToggleOwned]);

  // フィルタリング & ソート処理（recordUtilsにロジックを集約）
  const filteredAndSortedRecords = useMemo(() => {
    return filterAndSortRecords(
      records,
      ownedRecordIds,
      sortType,
      sortDirection,
      filterOptions
    );
  }, [records, ownedRecordIds, sortType, sortDirection, filterOptions]);

  // 全体所持率
  const totalCount = records.length;
  const ownedTotalCount = Object.values(ownedRecordIds).filter(Boolean).length;
  const overallPercentage = totalCount > 0 ? ((ownedTotalCount / totalCount) * 100).toFixed(1) : '0';

  // 現在絞り込み中の所持率
  const filteredCount = filteredAndSortedRecords.length;
  const filteredOwnedCount = filteredAndSortedRecords.filter((r) => ownedRecordIds[r.id]).length;

  // 仮想スクロール設定（画面内に見える要素のみを描画してパフォーマンス最大化）
  const virtualizer = useWindowVirtualizer({
    count: filteredAndSortedRecords.length,
    estimateSize: () => (displaySettings.compactMode ? 74 : 96),
    overscan: 6,
    scrollMargin: listRef.current?.offsetTop ?? 0,
  });

  const handleResetFilter = () => {
    onFilterOptionsChange({
      ownership: 'all',
      units: Object.keys(UNIT_METAS) as any,
      characters: [],
      vocalVersions: {
        virtualSinger: false,
        sekai: false,
        connectLive: false,
        anotherVocal: false,
        inst: false,
      },
      searchQuery: '',
      originalTypes: [],
      bannerCharacters: [],
      releaseYears: [],
    });
  };

  const isFilterActive =
    filterOptions.ownership !== 'all' ||
    filterOptions.units.length !== Object.keys(UNIT_METAS).length ||
    filterOptions.characters.length > 0 ||
    Object.values(filterOptions.vocalVersions).some(Boolean) ||
    filterOptions.searchQuery !== '' ||
    Boolean(filterOptions.originalTypes && filterOptions.originalTypes.length > 0) ||
    Boolean(filterOptions.bannerCharacters && filterOptions.bannerCharacters.length > 0) ||
    Boolean(filterOptions.releaseYears && filterOptions.releaseYears.length > 0);

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-6 py-2 space-y-4">
      {/* 1. 上部固定コントロールバー */}
      {/* ページ背景と完全にピクセル一致する不透明固定グラデーション（bg-pjsk-fixed）を敷き、背景と一体化しながら背後の文字を遮断 */}
      <div className="sticky top-[96px] z-30 -mx-3 sm:-mx-6 px-3 sm:px-6 pt-2 pb-2.5 bg-pjsk-fixed border-b border-slate-200/60 shadow-xs">
        <div className="max-w-4xl mx-auto space-y-2">
          {/* 2連操作ツールバー */}
          <div className="bg-white/95 backdrop-blur-md p-2 rounded-2xl shadow-xs border border-slate-200/90 flex items-center justify-between gap-2">
            {/* 左側: 並べ替え・絞り込みボタン & 絞込中インジケーター */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                onClick={() => setIsFilterModalOpen(true)}
                className={`px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition-all border cursor-pointer ${
                  isFilterActive
                    ? 'bg-[#33ccbb]/15 border-[#33ccbb] text-[#0d9488]'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-[#33ccbb]" />
                <span>並替・絞込</span>
                {isFilterActive && (
                  <span className="w-2 h-2 rounded-full bg-[#33ccbb]" />
                )}
              </button>

              {isFilterActive && (
                <div className="flex items-center gap-1">
                  <span className="px-2 py-1 rounded-lg bg-teal-50 border border-teal-200/80 text-teal-700 text-xs font-bold flex items-center gap-1">
                    <Filter className="w-3 h-3 text-teal-600" />
                    <span>絞込中</span>
                  </span>
                  <button
                    type="button"
                    onClick={handleResetFilter}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 text-slate-600 hover:text-rose-600 text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                    title="絞り込みをすべて解除"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>クリア</span>
                  </button>
                </div>
              )}
            </div>

            {/* 右側: 詳細表示とクイックチェックのトグルスイッチ */}
            <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200/80">
              <div className="flex items-center gap-1 text-xs">
                <Zap className={`w-3.5 h-3.5 ${tapMode === 'quick_check' ? 'text-[#33ccbb]' : 'text-slate-400'}`} />
                <span className={`font-bold ${tapMode === 'quick_check' ? 'text-slate-800' : 'text-slate-500'}`}>
                  クイックチェック
                </span>
                <button
                  type="button"
                  onClick={() => setShowQuickCheckHelp(true)}
                  className="p-1.5 rounded-full text-slate-400 hover:text-[#0d9488] hover:bg-slate-200/80 transition-colors cursor-pointer"
                  title="クイックチェックの操作説明を表示"
                  aria-label="クイックチェックの操作説明を表示"
                >
                  <Info className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* スイッチ型トグルUI */}
              <button
                type="button"
                role="switch"
                aria-checked={tapMode === 'quick_check'}
                onClick={() =>
                  setTapMode(tapMode === 'quick_check' ? 'detail' : 'quick_check')
                }
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${tapMode === 'quick_check' ? 'bg-[#33ccbb]' : 'bg-slate-300'
                  }`}
              >
                <span
                  aria-hidden="true"
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${tapMode === 'quick_check' ? 'translate-x-5' : 'translate-x-0'
                    }`}
                />
              </button>
            </div>
          </div>

          {/* 固定検索バー */}
          <div className="relative shadow-xs">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="曲名・よみがなで検索..."
              value={filterOptions.searchQuery}
              onChange={(e) =>
                onFilterOptionsChange((prev) => ({ ...prev, searchQuery: e.target.value }))
              }
              className="w-full bg-white border border-slate-200/90 rounded-xl pl-9 pr-10 py-2 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-[#33ccbb] focus:ring-2 focus:ring-[#33ccbb]/20 transition-all shadow-2xs"
            />
            {filterOptions.searchQuery && (
              <button
                type="button"
                onClick={() => onFilterOptionsChange((prev) => ({ ...prev, searchQuery: '' }))}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-2 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
                title="検索文字をクリア"
                aria-label="検索文字をクリア"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 2. 達成率（所持率）表示カード */}
      <div className="bg-white/90 backdrop-blur-xs rounded-3xl p-4 sm:p-5 border border-slate-200/80 shadow-xs">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-xl bg-[#33ccbb]/15 text-[#0d9488]">
              <Disc3 className="w-4 h-4" />
            </div>
            <span className="text-xs sm:text-sm font-bold text-slate-700">全体レコード所持率</span>
          </div>
          <div className="flex items-baseline gap-1 text-slate-800 font-bold">
            <span className="text-lg sm:text-2xl text-[#0d9488]">{overallPercentage}%</span>
            <span className="text-xs text-slate-400">
              ({ownedTotalCount} / {totalCount}曲)
            </span>
          </div>
        </div>

        {/* プログレスバー */}
        <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200/50">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#33ccbb] via-[#38bdf8] to-[#818cf8] transition-all duration-300"
            style={{ width: `${overallPercentage}%` }}
          />
        </div>

        {/* 絞り込み中の情報表示 */}
        {isFilterActive && (
          <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <div className="flex items-center gap-1.5">
              <span className="px-1.5 py-0.5 rounded bg-teal-100/80 text-teal-800 font-bold text-[10px]">
                絞込中
              </span>
              <span>絞り込み結果: {filteredCount}曲</span>
            </div>
            <div className="flex items-center gap-3">
              <span>
                該当の所持数: <strong className="text-slate-700 font-bold">{filteredOwnedCount}</strong> / {filteredCount}曲
              </span>
              <button
                type="button"
                onClick={handleResetFilter}
                className="text-[11px] text-slate-400 hover:text-rose-600 flex items-center gap-0.5 transition-colors cursor-pointer"
                title="絞り込みをすべて解除"
              >
                <RotateCcw className="w-3 h-3" />
                <span>クリア</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 3. レコード一覧リスト（仮想スクロール Windowing） */}
      {filteredAndSortedRecords.length === 0 ? (
        <div className="bg-white/80 rounded-3xl p-10 text-center border border-dashed border-slate-200 text-slate-400 text-xs sm:text-sm">
          条件に一致する楽曲レコードが見つかりません。
        </div>
      ) : (
        <div
          ref={listRef}
          className="relative w-full"
          style={{ height: `${virtualizer.getTotalSize()}px` }}
        >
          {virtualizer.getVirtualItems().map((virtualItem) => {
            const record = filteredAndSortedRecords[virtualItem.index];
            if (!record) return null;
            return (
              <div
                key={record.id}
                data-index={virtualItem.index}
                ref={virtualizer.measureElement}
                className="absolute top-0 left-0 w-full pb-2"
                style={{
                  transform: `translateY(${virtualItem.start - virtualizer.options.scrollMargin}px)`,
                }}
              >
                <RecordRow
                  record={record}
                  isOwned={!!ownedRecordIds[record.id]}
                  displaySettings={displaySettings}
                  tapMode={tapMode}
                  jacketIndex={jacketIndexMap[record.id] || 0}
                  onRowClick={handleRowClick}
                  onToggleOwned={onToggleOwned}
                  onBadgeClick={handleBadgeClick}
                  onRotateJacket={handleRotateJacket}
                />
              </div>
            );
          })}
        </div>
      )}

      {/* モーダル群 */}
      <FilterSortModal
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        sortType={sortType}
        sortDirection={sortDirection}
        onSortChange={(type, dir) => {
          setSortType(type);
          setSortDirection(dir);
        }}
        filterOptions={filterOptions}
        onFilterChange={onFilterOptionsChange}
        onResetFilter={handleResetFilter}
      />

      <RecordDetailModal
        record={selectedRecordForDetail}
        isOpen={!!selectedRecordForDetail}
        onClose={() => {
          setSelectedRecordForDetail(null);
          setSelectedTrackIdForDetail(null);
        }}
        isOwned={selectedRecordForDetail ? !!ownedRecordIds[selectedRecordForDetail.id] : false}
        onToggleOwned={onToggleOwned}
        initialTrackId={selectedTrackIdForDetail}
        currentJacketIndex={selectedRecordForDetail ? (jacketIndexMap[selectedRecordForDetail.id] || 0) : 0}
        onSelectJacketIndex={handleSetJacketIndex}
      />

      {/* クイックチェック操作説明モーダル */}
      {showQuickCheckHelp && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => setShowQuickCheckHelp(false)}
        >
          <div
            className="bg-white rounded-3xl max-w-sm w-full p-5 sm:p-6 shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-150 flex flex-col gap-4 text-slate-800"
            onClick={(e) => e.stopPropagation()}
          >
            {/* モーダルヘッダー */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-[#33ccbb]/10 text-[#0d9488]">
                  <Zap className="w-5 h-5 text-[#33ccbb]" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-800">クイックチェックとは？</h3>
                  <p className="text-[11px] text-slate-500">所持登録の操作切り替え機能</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowQuickCheckHelp(false)}
                className="p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                aria-label="閉じる"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* モーダル本文 */}
            <div className="space-y-3 text-xs sm:text-sm text-slate-600 leading-relaxed">
              <div className="bg-slate-50 rounded-2xl p-3 border border-slate-200/80 space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-slate-800">
                  <span className="w-2 h-2 rounded-full bg-slate-400"></span>
                  <span>OFF（通常モード）</span>
                </div>
                <p className="text-slate-600 pl-3.5 text-xs">
                  楽曲カードをタップすると<span className="font-semibold text-slate-800">詳細画面</span>（歌唱バージョンやジャケットなど）が開きます。<br />
                  所持チェックはカード右端の<span className="font-semibold text-slate-800">チェックボタン</span>をタップして切り替えます。
                </p>
              </div>

              <div className="bg-[#33ccbb]/5 rounded-2xl p-3 border border-[#33ccbb]/30 space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-[#0d9488]">
                  <span className="w-2 h-2 rounded-full bg-[#33ccbb]"></span>
                  <span>ON（クイックチェックモード）</span>
                </div>
                <p className="text-slate-600 pl-3.5 text-xs">
                  楽曲カードの<span className="font-semibold text-slate-800">どこをタップしても即座に所持チェックを切り替え</span>できます。<br />
                  手持ちのレコードを一覧から連続で素早く登録したいときに便利です。
                </p>
              </div>

              <p className="text-[11px] text-slate-400 pl-1 leading-normal">
                ※クイックチェックON中は楽曲詳細画面が開きません。詳細画面を確認・編集したい場合はスイッチをOFFにしてください。
              </p>
            </div>

            {/* モーダルフッター */}
            <button
              type="button"
              onClick={() => setShowQuickCheckHelp(false)}
              className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs sm:text-sm transition-colors text-center cursor-pointer"
            >
              閉じる
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
