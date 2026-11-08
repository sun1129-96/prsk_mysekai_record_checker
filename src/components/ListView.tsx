import React, { useState, useMemo, useRef, useCallback } from 'react';
import {
  Search,
  SlidersHorizontal,
  Eye,
  X,
  Disc3,
  Zap,
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
import { UNIT_METAS } from '../types/record';
import { FilterSortModal, DisplaySettingsModal } from './ToolbarModals';
import { RecordDetailModal } from './RecordDetailModal';
import { filterAndSortRecords } from '../utils/recordUtils';
import { RecordRow } from './RecordRow';

interface ListViewProps {
  records: RecordItem[];
  ownedRecordIds: Record<string, boolean>;
  onToggleOwned: (id: string) => void;
}

export const ListView: React.FC<ListViewProps> = ({
  records,
  ownedRecordIds,
  onToggleOwned,
}) => {
  const listRef = useRef<HTMLDivElement>(null);

  // 並び替え状態（初期値: 実装順 昇順）
  const [sortType, setSortType] = useState<SortType>('defaultOrder');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  // 絞り込み状態
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    ownership: 'all',
    units: Object.keys(UNIT_METAS) as any,
    characters: [],
    vocalVersions: {
      virtualSinger: false,
      sekai: false,
      connectLive: false,
      anotherVocal: false,
    },
    searchQuery: '',
  });

  // 表示設定
  const [displaySettings, setDisplaySettings] = useState<DisplaySettings>({
    showJacket: true,
    showReleaseDate: true,
    showVocalBadges: true,
    showCharacters: true,
    compactMode: false,
  });

  // タップ動作モード: 'detail' (詳細モーダル) vs 'quick_check' (行全体でチェック切り替え)
  const [tapMode, setTapMode] = useState<TapActionMode>('detail');

  // モーダル状態
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [isDisplayModalOpen, setIsDisplayModalOpen] = useState(false);
  const [selectedRecordForDetail, setSelectedRecordForDetail] = useState<RecordItem | null>(null);
  const [selectedTrackIdForDetail, setSelectedTrackIdForDetail] = useState<string | null>(null);

  // 歌唱バージョンバッジをクリックした際にそのトラックを指定して詳細を開く
  const handleBadgeClick = useCallback((record: RecordItem, trackId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedRecordForDetail(record);
    setSelectedTrackIdForDetail(trackId);
  }, []);

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
    setFilterOptions({
      ownership: 'all',
      units: Object.keys(UNIT_METAS) as any,
      characters: [],
      vocalVersions: {
        virtualSinger: false,
        sekai: false,
        connectLive: false,
        anotherVocal: false,
      },
      searchQuery: '',
    });
  };

  const isFilterActive =
    filterOptions.ownership !== 'all' ||
    filterOptions.units.length !== Object.keys(UNIT_METAS).length ||
    filterOptions.characters.length > 0 ||
    Object.values(filterOptions.vocalVersions).some(Boolean) ||
    filterOptions.searchQuery !== '';

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-6 py-2 space-y-4">
      {/* 1. 上部固定コントロールバー */}
      {/* ページ背景と完全にピクセル一致する不透明固定グラデーション（bg-pjsk-fixed）を敷き、背景と一体化しながら背後の文字を遮断 */}
      <div className="sticky top-[96px] z-30 -mx-3 sm:-mx-6 px-3 sm:px-6 pt-2 pb-2.5 bg-pjsk-fixed border-b border-slate-200/60 shadow-xs">
        <div className="max-w-4xl mx-auto space-y-2">
          {/* 3連操作ツールバー */}
          <div className="bg-white/95 backdrop-blur-md p-2 rounded-2xl shadow-xs border border-slate-200/90 flex flex-wrap items-center justify-between gap-2">
            {/* 左側: 並べ替え・絞り込み & 表示項目設定 */}
            <div className="flex items-center gap-1.5 flex-1 min-w-[240px]">
              {/* ① 並べ替え・絞り込みボタン */}
              <button
                onClick={() => setIsFilterModalOpen(true)}
                className={`px-3 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition-all border ${
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

              {/* ② 表示情報の設定ボタン（何をするボタンか明記） */}
              <button
                onClick={() => setIsDisplayModalOpen(true)}
                className="px-3 py-2 rounded-xl text-xs sm:text-sm font-bold bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100 flex items-center justify-center gap-1.5 transition-all"
              >
                <Eye className="w-3.5 h-3.5 text-slate-500" />
                <span>表示項目設定</span>
              </button>
            </div>

            {/* 右側: ③ 詳細表示とクイックチェックのトグルスイッチ */}
            <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200/80">
              <div className="flex items-center gap-1 text-xs">
                <Zap className={`w-3.5 h-3.5 ${tapMode === 'quick_check' ? 'text-[#33ccbb]' : 'text-slate-400'}`} />
                <span className={`font-bold ${tapMode === 'quick_check' ? 'text-slate-800' : 'text-slate-500'}`}>
                  クイックチェック
                </span>
              </div>

              {/* スイッチ型トグルUI */}
              <button
                type="button"
                role="switch"
                aria-checked={tapMode === 'quick_check'}
                onClick={() =>
                  setTapMode(tapMode === 'quick_check' ? 'detail' : 'quick_check')
                }
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                  tapMode === 'quick_check' ? 'bg-[#33ccbb]' : 'bg-slate-300'
                }`}
              >
                <span
                  aria-hidden="true"
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                    tapMode === 'quick_check' ? 'translate-x-5' : 'translate-x-0'
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
              placeholder="曲名・よみがなでインクリメンタル検索..."
              value={filterOptions.searchQuery}
              onChange={(e) =>
                setFilterOptions({ ...filterOptions, searchQuery: e.target.value })
              }
              className="w-full bg-white border border-slate-200/90 rounded-xl pl-9 pr-9 py-2 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-[#33ccbb] focus:ring-2 focus:ring-[#33ccbb]/20 transition-all shadow-2xs"
            />
            {filterOptions.searchQuery && (
              <button
                onClick={() => setFilterOptions({ ...filterOptions, searchQuery: '' })}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
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
            <span>絞り込み結果: {filteredCount}曲</span>
            <span>
              該当の所持数: <strong className="text-slate-700 font-bold">{filteredOwnedCount}</strong> / {filteredCount}曲
            </span>
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
                  onRowClick={handleRowClick}
                  onToggleOwned={onToggleOwned}
                  onBadgeClick={handleBadgeClick}
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
        onFilterChange={setFilterOptions}
        onResetFilter={handleResetFilter}
      />

      <DisplaySettingsModal
        isOpen={isDisplayModalOpen}
        onClose={() => setIsDisplayModalOpen(false)}
        settings={displaySettings}
        onSettingsChange={setDisplaySettings}
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
      />
    </div>
  );
};
