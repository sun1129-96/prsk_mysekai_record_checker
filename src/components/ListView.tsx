import React, { useState, useMemo } from 'react';
import {
  Search,
  SlidersHorizontal,
  Eye,
  Music,
  Check,
  Calendar,
  X,
  Disc3,
  Zap,
} from 'lucide-react';
import type {
  RecordItem,
  SortType,
  SortDirection,
  FilterOptions,
  DisplaySettings,
  TapActionMode,
} from '../types/record';
import { UNIT_METAS, CHARACTERS } from '../types/record';
import { FilterSortModal, DisplaySettingsModal } from './ToolbarModals';
import { RecordDetailModal } from './RecordDetailModal';

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

  // フィルタリング & ソート処理
  const filteredAndSortedRecords = useMemo(() => {
    return records
      .filter((record) => {
        const isOwned = !!ownedRecordIds[record.id];

        // 1. 所持状態フィルタ
        if (filterOptions.ownership === 'owned' && !isOwned) return false;
        if (filterOptions.ownership === 'unowned' && isOwned) return false;

        // 2. ユニットフィルタ
        if (!filterOptions.units.includes(record.unit)) return false;

        // 3. キャラクターフィルタ（選択されている場合、その中のいずれかのキャラが歌唱しているか）
        if (filterOptions.characters.length > 0) {
          const hasSelectedChar = filterOptions.characters.some((charId) =>
            record.characters.includes(charId)
          );
          if (!hasSelectedChar) return false;
        }

        // 4. 歌唱verフィルタ
        if (filterOptions.vocalVersions.sekai && !record.vocalVersions.sekai) return false;
        if (filterOptions.vocalVersions.virtualSinger && !record.vocalVersions.virtualSinger) return false;
        if (filterOptions.vocalVersions.connectLive && !record.vocalVersions.connectLive) return false;
        if (filterOptions.vocalVersions.anotherVocal && !record.vocalVersions.anotherVocal) return false;

        // 5. 検索クエリ（曲名または読み仮名）
        if (filterOptions.searchQuery.trim() !== '') {
          const query = filterOptions.searchQuery.toLowerCase();
          const matchTitle = record.title.toLowerCase().includes(query);
          const matchReading = record.reading.toLowerCase().includes(query);
          if (!matchTitle && !matchReading) return false;
        }

        return true;
      })
      .sort((a, b) => {
        let compare = 0;
        if (sortType === 'releaseDate') {
          compare = a.releaseDate.localeCompare(b.releaseDate);
        } else if (sortType === 'defaultOrder') {
          compare = a.defaultOrder - b.defaultOrder;
        } else if (sortType === 'reading') {
          compare = a.reading.localeCompare(b.reading, 'ja');
        }
        return sortDirection === 'asc' ? compare : -compare;
      });
  }, [records, ownedRecordIds, sortType, sortDirection, filterOptions]);

  // 全体所持率
  const totalCount = records.length;
  const ownedTotalCount = Object.values(ownedRecordIds).filter(Boolean).length;
  const overallPercentage = totalCount > 0 ? ((ownedTotalCount / totalCount) * 100).toFixed(1) : '0';

  // 現在絞り込み中の所持率
  const filteredCount = filteredAndSortedRecords.length;
  const filteredOwnedCount = filteredAndSortedRecords.filter((r) => ownedRecordIds[r.id]).length;

  const handleRowClick = (record: RecordItem) => {
    if (tapMode === 'quick_check') {
      onToggleOwned(record.id);
    } else {
      setSelectedRecordForDetail(record);
    }
  };

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

      {/* 3. レコード一覧リスト */}
      <div className="space-y-2">
        {filteredAndSortedRecords.length === 0 ? (
          <div className="bg-white/80 rounded-3xl p-10 text-center border border-dashed border-slate-200 text-slate-400 text-xs sm:text-sm">
            条件に一致する楽曲レコードが見つかりません。
          </div>
        ) : (
          filteredAndSortedRecords.map((record) => {
            const isOwned = !!ownedRecordIds[record.id];
            const unitMeta = UNIT_METAS[record.unit];

            return (
              <div
                key={record.id}
                onClick={() => handleRowClick(record)}
                className={`group rounded-2xl border transition-all cursor-pointer select-none flex items-center gap-3 p-3 sm:p-3.5 ${
                  isOwned
                    ? 'bg-emerald-50/60 border-emerald-200/90 shadow-2xs'
                    : 'bg-white/90 border-slate-200/80 hover:border-slate-300 shadow-xs'
                } ${displaySettings.compactMode ? 'py-2' : ''}`}
              >
                {/* チェックボックスボタン */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleOwned(record.id);
                  }}
                  className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl shrink-0 flex items-center justify-center border-2 transition-all ${
                    isOwned
                      ? 'bg-emerald-500 border-emerald-500 text-white shadow-xs'
                      : 'bg-white border-slate-300 text-transparent hover:border-[#33ccbb]'
                  }`}
                  aria-label={isOwned ? '所持チェック解除' : '所持チェック'}
                >
                  <Check className={`w-4 h-4 sm:w-5 sm:h-5 ${isOwned ? 'block' : 'opacity-0'}`} />
                </button>

                {/* ジャケット画像（表示設定による） */}
                {displaySettings.showJacket && (
                  <div
                    className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl shrink-0 flex items-center justify-center shadow-2xs overflow-hidden relative bg-slate-100"
                    style={{
                      border: `1px solid ${unitMeta.borderColor}`,
                    }}
                  >
                    {record.jacketUrl ? (
                      <img
                        src={record.jacketUrl}
                        alt={record.title}
                        loading="lazy"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <Music className="w-5 h-5" style={{ color: unitMeta.themeColor }} />
                    )}
                  </div>
                )}

                {/* 曲情報 */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span
                      className="px-2 py-0.5 rounded-md text-[10px] font-bold shrink-0 truncate max-w-[120px]"
                      style={{
                        backgroundColor: unitMeta.bgColor,
                        color: unitMeta.themeColor,
                        border: `1px solid ${unitMeta.borderColor}`,
                      }}
                    >
                      {unitMeta.shortName}
                    </span>

                    {displaySettings.showReleaseDate && (
                      <span className="text-[11px] text-slate-400 flex items-center gap-1 shrink-0">
                        <Calendar className="w-3 h-3" />
                        {record.releaseDate}
                      </span>
                    )}

                    <span className="text-[10px] text-slate-300 font-mono">
                      #{record.defaultOrder}
                    </span>
                  </div>

                  {/* 曲名（取り消し線 line-through は一切使用しない規律を徹底） */}
                  <h4 className="text-xs sm:text-sm font-bold text-slate-800 truncate tracking-tight">
                    {record.title}
                  </h4>

                  {/* 歌唱verバッジ（表示設定による） */}
                  {displaySettings.showVocalBadges && (() => {
                    const vsMeta = UNIT_METAS.virtual_singer;

                    // 歌唱者の境界のみグラデーションする背景スタイル生成（元の色を分かりやすく保持）
                    const getAnotherVocalStyle = (singers: typeof CHARACTERS) => {
                      if (singers.length === 2) {
                        const c1 = singers[0];
                        const c2 = singers[1];
                        return {
                          background: `linear-gradient(105deg, ${c1.color}3d 0%, ${c1.color}3d 40%, ${c2.color}3d 60%, ${c2.color}3d 100%)`,
                          borderColor: `${c1.color}77`,
                          color: '#1e293b',
                        };
                      } else if (singers.length > 2) {
                        // 3人以上の場合は各キャラの領域を確保しつつ境界のみグラデーション
                        const n = singers.length;
                        const stops: string[] = [];
                        singers.forEach((c, i) => {
                          const startPct = Math.round((i / n) * 100);
                          const endPct = Math.round(((i + 1) / n) * 100);
                          const pad = Math.min(6, Math.floor(100 / n / 3));
                          stops.push(`${c.color}3d ${startPct + (i === 0 ? 0 : pad)}%`);
                          stops.push(`${c.color}3d ${endPct - (i === n - 1 ? 0 : pad)}%`);
                        });
                        return {
                          background: `linear-gradient(105deg, ${stops.join(', ')})`,
                          borderColor: `${singers[0].color}77`,
                          color: '#1e293b',
                        };
                      } else if (singers.length === 1) {
                        const c1 = singers[0];
                        return {
                          backgroundColor: `${c1.color}28`,
                          borderColor: `${c1.color}77`,
                          color: '#1e293b',
                        };
                      }
                      return {
                        backgroundColor: '#fffbeb',
                        borderColor: '#fde68a',
                        color: '#b45309',
                      };
                    };

                    const tracks = record.vocalTracks || [];

                    return (
                      <div className="flex flex-wrap gap-1 mt-1 text-[10px]">
                        {tracks.length > 0 ? (
                          // トラック情報が存在する場合はトラックごとに個別にバッジを表示（同一ver複数トラックにも対応）
                          tracks.map((track) => {
                            if (track.type === 'sekai') {
                              return (
                                <span
                                  key={track.id}
                                  className="px-1.5 py-0.5 rounded-md font-bold border transition-colors shadow-2xs"
                                  style={{
                                    backgroundColor: unitMeta.bgColor,
                                    borderColor: unitMeta.borderColor,
                                    color: unitMeta.themeColor,
                                  }}
                                >
                                  セカイ
                                </span>
                              );
                            }
                            if (track.type === 'virtual_singer') {
                              return (
                                <span
                                  key={track.id}
                                  className="px-1.5 py-0.5 rounded-md font-bold border transition-colors shadow-2xs"
                                  style={{
                                    backgroundColor: vsMeta.bgColor,
                                    borderColor: vsMeta.borderColor,
                                    color: vsMeta.themeColor,
                                  }}
                                >
                                  バチャシン
                                </span>
                              );
                            }
                            if (track.type === 'connect_live') {
                              return (
                                <span
                                  key={track.id}
                                  className="px-1.5 py-0.5 rounded-md bg-sky-50 text-sky-700 border border-sky-200/60 font-bold shadow-2xs"
                                >
                                  コネライ
                                </span>
                              );
                            }
                            if (track.type === 'another_vocal') {
                              const trackSingers = track.singers
                                .map((id) => CHARACTERS.find((c) => c.id === id))
                                .filter((c): c is typeof CHARACTERS[number] => Boolean(c));
                              const badgeStyle = getAnotherVocalStyle(trackSingers);

                              return (
                                <span
                                  key={track.id}
                                  className="px-1.5 py-0.5 rounded-md font-bold border transition-colors shadow-2xs"
                                  style={badgeStyle}
                                >
                                  アナボ
                                </span>
                              );
                            }
                            if (track.type === 'other') {
                              return (
                                <span
                                  key={track.id}
                                  className="px-1.5 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200/60 font-bold shadow-2xs"
                                >
                                  {track.name.includes('コラボ') ? 'コラボ' : 'その他'}
                                </span>
                              );
                            }
                            return null;
                          })
                        ) : (
                          // トラック情報がない場合のフォールバック（旧フラグベース）
                          <>
                            {record.vocalVersions.sekai && (
                              <span
                                className="px-1.5 py-0.5 rounded-md font-bold border transition-colors shadow-2xs"
                                style={{
                                  backgroundColor: unitMeta.bgColor,
                                  borderColor: unitMeta.borderColor,
                                  color: unitMeta.themeColor,
                                }}
                              >
                                セカイ
                              </span>
                            )}
                            {record.vocalVersions.virtualSinger && (
                              <span
                                className="px-1.5 py-0.5 rounded-md font-bold border transition-colors shadow-2xs"
                                style={{
                                  backgroundColor: vsMeta.bgColor,
                                  borderColor: vsMeta.borderColor,
                                  color: vsMeta.themeColor,
                                }}
                              >
                                バチャシン
                              </span>
                            )}
                            {record.vocalVersions.connectLive && (
                              <span className="px-1.5 py-0.5 rounded-md bg-sky-50 text-sky-700 border border-sky-200/60 font-bold shadow-2xs">
                                コネライ
                              </span>
                            )}
                            {record.vocalVersions.anotherVocal && (
                              <span className="px-1.5 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200/60 font-bold shadow-2xs">
                                アナボ
                              </span>
                            )}
                          </>
                        )}
                      </div>
                    );
                  })()}
                </div>

                {/* モード表示ガイド */}
                {tapMode === 'detail' && (
                  <span className="text-slate-300 group-hover:text-slate-500 text-xs hidden sm:inline">
                    詳細 →
                  </span>
                )}
              </div>
            );
          })
        )}
      </div>

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
        onClose={() => setSelectedRecordForDetail(null)}
        isOwned={selectedRecordForDetail ? !!ownedRecordIds[selectedRecordForDetail.id] : false}
        onToggleOwned={onToggleOwned}
      />
    </div>
  );
};
