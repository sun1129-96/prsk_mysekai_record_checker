import React, { useState } from 'react';
import {
  X,
  ArrowUpDown,
  Filter,
  Eye,
  Check,
  Users,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import type {
  SortType,
  SortDirection,
  FilterOptions,
  DisplaySettings,
  UnitType,
  OriginalSongType,
} from '../types/record';
import {
  UNIT_METAS,
  CHARACTERS,
  GAME_VIRTUAL_SINGER_IDS,
  ORIGINAL_TYPE_METAS,
} from '../types/record';

interface FilterSortModalProps {
  isOpen: boolean;
  onClose: () => void;
  sortType: SortType;
  sortDirection: SortDirection;
  onSortChange: (type: SortType, direction: SortDirection) => void;
  filterOptions: FilterOptions;
  onFilterChange: (options: FilterOptions) => void;
  onResetFilter: () => void;
}

export const FilterSortModal: React.FC<FilterSortModalProps> = ({
  isOpen,
  onClose,
  sortType,
  sortDirection,
  onSortChange,
  filterOptions,
  onFilterChange,
  onResetFilter,
}) => {
  // ゲーム未登場のバーチャル・シンガー折りたたみ状態（デフォルトは折りたたみ）
  const [showNonGameSingers, setShowNonGameSingers] = useState(false);

  // 絞り込み条件グループごとの簡易アコーディオン開閉状態
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    units: true,
    characters: false,
    vocalVersions: false,
    originalTypes: false,
    bannerCharacters: false,
    releaseYears: false,
  });

  const toggleSection = (key: string) => {
    setOpenSections((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const setAllSections = (open: boolean) => {
    setOpenSections({
      units: open,
      characters: open,
      vocalVersions: open,
      originalTypes: open,
      bannerCharacters: open,
      releaseYears: open,
    });
  };

  if (!isOpen) return null;

  // ユニットトグル
  const handleUnitToggle = (unit: UnitType) => {
    const isSelected = filterOptions.units.includes(unit);
    const newUnits = isSelected
      ? filterOptions.units.filter((u) => u !== unit)
      : [...filterOptions.units, unit];
    onFilterChange({ ...filterOptions, units: newUnits });
  };

  const handleSelectAllUnits = (select: boolean) => {
    onFilterChange({
      ...filterOptions,
      units: select ? (Object.keys(UNIT_METAS) as UnitType[]) : [],
    });
  };

  // キャラクタートグル
  const handleCharacterToggle = (charId: string) => {
    const isSelected = filterOptions.characters.includes(charId);
    const newChars = isSelected
      ? filterOptions.characters.filter((id) => id !== charId)
      : [...filterOptions.characters, charId];
    onFilterChange({ ...filterOptions, characters: newChars });
  };

  const handleClearCharacters = () => {
    onFilterChange({ ...filterOptions, characters: [] });
  };

  const handleSelectAllCharacters = () => {
    onFilterChange({ ...filterOptions, characters: CHARACTERS.map((c) => c.id) });
  };

  // 指定キャラクター群の一括選択・クリア
  const handleBatchSelectChars = (charIds: string[], select: boolean) => {
    if (select) {
      const merged = Array.from(new Set([...filterOptions.characters, ...charIds]));
      onFilterChange({ ...filterOptions, characters: merged });
    } else {
      const remaining = filterOptions.characters.filter((id) => !charIds.includes(id));
      onFilterChange({ ...filterOptions, characters: remaining });
    }
  };

  // 歌唱バージョン一括選択・クリア
  const handleSelectAllVocalVersions = (select: boolean) => {
    onFilterChange({
      ...filterOptions,
      vocalVersions: {
        virtualSinger: select,
        sekai: select,
        connectLive: select,
        anotherVocal: select,
        inst: select,
      },
    });
  };

  // 楽曲分類一括選択・クリア
  const handleSelectAllOriginalTypes = (select: boolean) => {
    const allTypes = (Object.keys(ORIGINAL_TYPE_METAS) as OriginalSongType[]).filter(
      (t) => t !== 'cover'
    );
    onFilterChange({
      ...filterOptions,
      originalTypes: select ? allTypes : [],
    });
  };

  // 実装年一括選択・クリア
  const handleSelectAllReleaseYears = (select: boolean) => {
    onFilterChange({
      ...filterOptions,
      releaseYears: select ? [1, 2, 3, 4, 5, 6, 7] : [],
    });
  };

  // イベントバナーキャラクター一括選択・クリア
  const handleSelectAllBannerCharacters = (select: boolean) => {
    onFilterChange({
      ...filterOptions,
      bannerCharacters: select ? CHARACTERS.map((c) => c.id) : [],
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="bg-white/95 backdrop-blur-md rounded-3xl max-w-lg w-full max-h-[88vh] flex flex-col shadow-2xl overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
        {/* モーダルヘッダー */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-emerald-50/50 via-teal-50/30 to-sky-50/50">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-xl bg-[#33ccbb]/20 text-[#0d9488]">
              <Filter className="w-4 h-4" />
            </div>
            <h2 className="text-sm sm:text-base font-bold text-slate-800">
              並べ替え・絞り込み設定
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors cursor-pointer"
            aria-label="閉じる"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* モーダル本体（スクロール可） */}
        <div className="p-5 overflow-y-auto space-y-6 text-sm divide-y divide-slate-100">
          {/* 1. 並べ替え設定（基準と昇順・降順を明示的に選択） */}
          <div className="space-y-3">
            <div className="flex items-center gap-1.5 font-bold text-slate-700">
              <ArrowUpDown className="w-4 h-4 text-[#33ccbb]" />
              <span>並び替えの基準</span>
            </div>

            {/* ソート項目選択 */}
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => onSortChange('defaultSort', sortDirection)}
                className={`py-2.5 px-2 rounded-xl border font-bold text-xs sm:text-sm text-center transition-all ${sortType === 'defaultSort'
                  ? 'border-[#33ccbb] bg-[#33ccbb]/10 text-[#0d9488] shadow-2xs'
                  : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
              >
                デフォルト順
              </button>

              <button
                type="button"
                onClick={() => onSortChange('releaseDate', sortDirection)}
                className={`py-2.5 px-2 rounded-xl border font-bold text-xs sm:text-sm text-center transition-all ${sortType === 'releaseDate'
                  ? 'border-[#33ccbb] bg-[#33ccbb]/10 text-[#0d9488] shadow-2xs'
                  : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
              >
                実装日順
              </button>

              <button
                type="button"
                onClick={() => onSortChange('reading', sortDirection)}
                className={`py-2.5 px-2 rounded-xl border font-bold text-xs sm:text-sm text-center transition-all ${sortType === 'reading'
                  ? 'border-[#33ccbb] bg-[#33ccbb]/10 text-[#0d9488] shadow-2xs'
                  : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
              >
                五十音順
              </button>
            </div>

            {/* 昇順・降順の明示的選択（左: 昇順、右: 降順） */}
            <div className="bg-slate-50 p-2.5 rounded-2xl border border-slate-200/80">
              <div className="text-[11px] font-bold text-slate-500 mb-1.5">順序の指定</div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => onSortChange(sortType, 'asc')}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${sortDirection === 'asc'
                    ? 'border-[#33ccbb] bg-white text-[#0d9488] shadow-xs'
                    : 'border-transparent text-slate-500 hover:bg-slate-200/50'
                    }`}
                >
                  {sortType === 'defaultSort' && 'デフォルト順 (昇順)'}
                  {sortType === 'releaseDate' && '古い順 (昇順)'}
                  {sortType === 'reading' && 'あ → ん (昇順)'}
                </button>

                <button
                  type="button"
                  onClick={() => onSortChange(sortType, 'desc')}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${sortDirection === 'desc'
                    ? 'border-[#33ccbb] bg-white text-[#0d9488] shadow-xs'
                    : 'border-transparent text-slate-500 hover:bg-slate-200/50'
                    }`}
                >
                  {sortType === 'defaultSort' && '逆順 (降順)'}
                  {sortType === 'releaseDate' && '新しい順 (降順)'}
                  {sortType === 'reading' && 'ん → あ (降順)'}
                </button>
              </div>
            </div>
          </div>

          {/* 条件の判定方式 (AND / OR) */}
          <div className="pt-4 space-y-2">
            <div className="flex items-center justify-between">
              <div className="font-bold text-slate-700 flex items-center gap-1.5">
                <span>条件の判定方式</span>
              </div>
              <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => onFilterChange({ ...filterOptions, matchType: 'and' })}
                  className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${(filterOptions.matchType || 'and') === 'and'
                    ? 'bg-[#33ccbb] text-white shadow-2xs'
                    : 'text-slate-500 hover:text-slate-700'
                    }`}
                >
                  AND (すべて一致)
                </button>
                <button
                  type="button"
                  onClick={() => onFilterChange({ ...filterOptions, matchType: 'or' })}
                  className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${filterOptions.matchType === 'or'
                    ? 'bg-sky-500 text-white shadow-2xs'
                    : 'text-slate-500 hover:text-slate-700'
                    }`}
                >
                  OR (いずれか一致)
                </button>
              </div>
            </div>
            <div className="text-[11px] text-slate-500">
              {(filterOptions.matchType || 'and') === 'and'
                ? '※指定したすべての絞り込み条件（ユニット、キャラ、ver、分類、実装年等）を満たす楽曲を表示します'
                : '※指定したいずれかの絞り込み条件を満たす楽曲を表示します（所持ステータスと検索語は常に適用）'}
            </div>
          </div>

          {/* 2. 所持状態での絞り込み */}
          <div className="pt-4 space-y-2">
            <div className="font-bold text-slate-700">所持ステータス</div>
            <div className="grid grid-cols-3 gap-2">
              {(
                [
                  { id: 'all', label: 'すべて' },
                  { id: 'owned', label: '所持のみ' },
                  { id: 'unowned', label: '未所持のみ' },
                ] as const
              ).map((status) => (
                <button
                  key={status.id}
                  type="button"
                  onClick={() =>
                    onFilterChange({ ...filterOptions, ownership: status.id })
                  }
                  className={`py-2 px-3 rounded-xl border text-xs sm:text-sm font-medium transition-all ${filterOptions.ownership === status.id
                    ? 'border-[#33ccbb] bg-[#33ccbb]/10 text-[#0d9488] font-bold'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                >
                  {status.label}
                </button>
              ))}
            </div>
          </div>

          {/* 絞り込み条件グループの一括展開/折りたたみバー */}
          <div className="pt-2 flex items-center justify-between px-1 text-xs">
            <span className="text-[11px] font-bold text-slate-500">絞り込み条件グループ（クリックで開閉）</span>
            <div className="flex items-center gap-1.5 text-[11px]">
              <button
                type="button"
                onClick={() => setAllSections(true)}
                className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-[#33ccbb]/15 text-[#0d9488] font-bold transition-colors cursor-pointer"
              >
                すべて展開
              </button>
              <button
                type="button"
                onClick={() => setAllSections(false)}
                className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 font-bold transition-colors cursor-pointer"
              >
                すべて折りたたむ
              </button>
            </div>
          </div>

          {/* 3. ユニットでの絞り込み */}
          <div className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-2xs">
            <div
              onClick={() => toggleSection('units')}
              className="flex items-center justify-between p-3 cursor-pointer select-none bg-slate-50/60 hover:bg-slate-100/60 transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className="font-bold text-xs sm:text-sm text-slate-800">対象ユニット</span>
                <span className="text-[11px] bg-[#33ccbb]/15 text-[#0d9488] px-2 py-0.5 rounded-full font-bold">
                  {filterOptions.units.length === (Object.keys(UNIT_METAS) as UnitType[]).length
                    ? '全選択中'
                    : `${filterOptions.units.length}組選択中`}
                </span>
              </div>
              <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center gap-1.5 text-xs">
                  <button
                    type="button"
                    onClick={() => handleSelectAllUnits(true)}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-[#33ccbb]/15 text-[#0d9488] font-bold transition-colors cursor-pointer text-[11px]"
                  >
                    全選択
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectAllUnits(false)}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 font-medium transition-colors cursor-pointer text-[11px]"
                  >
                    クリア
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => toggleSection('units')}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                  aria-label="ユニット条件を展開・折りたたみ"
                >
                  {openSections.units ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {openSections.units && (
              <div className="p-3 sm:p-4 border-t border-slate-100">
                <div className="grid grid-cols-2 gap-2">
                  {(Object.keys(UNIT_METAS) as UnitType[]).map((unitKey) => {
                    const meta = UNIT_METAS[unitKey];
                    const isSelected = filterOptions.units.includes(unitKey);
                    return (
                      <button
                        key={unitKey}
                        type="button"
                        onClick={() => handleUnitToggle(unitKey)}
                        className={`flex items-center gap-2 px-2.5 py-2 rounded-xl border text-left min-h-[42px] transition-all cursor-pointer ${isSelected
                            ? 'border-slate-400/80 bg-white shadow-2xs text-slate-800'
                            : 'border-slate-200/70 bg-slate-50/60 text-slate-400 opacity-60 hover:opacity-80'
                          }`}
                      >
                        {meta.iconUrl ? (
                          <img
                            src={meta.iconUrl}
                            alt={meta.name}
                            className="w-4 h-4 object-contain shrink-0 drop-shadow-2xs"
                          />
                        ) : (
                          <div
                            className="w-3.5 h-3.5 rounded-full shrink-0 border border-slate-300/80 shadow-2xs"
                            style={{ backgroundColor: meta.themeColor }}
                          />
                        )}
                        <span className="flex-1 text-[11px] sm:text-xs font-bold leading-tight break-words">
                          {meta.name}
                        </span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-slate-600 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* 4. 歌唱キャラクターでの絞り込み */}
          <div className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-2xs">
            <div
              onClick={() => toggleSection('characters')}
              className="flex items-center justify-between p-3 cursor-pointer select-none bg-slate-50/60 hover:bg-slate-100/60 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-[#33ccbb]" />
                <span className="font-bold text-xs sm:text-sm text-slate-800">歌唱キャラクター</span>
                {filterOptions.characters.length > 0 && (
                  <span className="text-[11px] bg-[#33ccbb]/15 text-[#0d9488] px-2 py-0.5 rounded-full font-bold">
                    {filterOptions.characters.length}人選択中
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center gap-1.5 text-xs">
                  <button
                    type="button"
                    onClick={handleSelectAllCharacters}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-[#33ccbb]/15 text-[#0d9488] font-bold transition-colors cursor-pointer text-[11px]"
                  >
                    全選択
                  </button>
                  <button
                    type="button"
                    onClick={handleClearCharacters}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 font-medium transition-colors cursor-pointer text-[11px]"
                  >
                    クリア
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => toggleSection('characters')}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                  aria-label="キャラクター条件を展開・折りたたみ"
                >
                  {openSections.characters ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {openSections.characters && (
              <div className="p-3 sm:p-4 border-t border-slate-100">
                <div className="max-h-60 sm:max-h-72 overflow-y-auto p-1 space-y-3 bg-slate-50/60 rounded-2xl border border-slate-200/80">
                  {(Object.keys(UNIT_METAS) as UnitType[]).map((unitKey) => {
                    const unitMeta = UNIT_METAS[unitKey];
                    const unitChars = CHARACTERS.filter((c) => c.unit === unitKey);
                    if (unitChars.length === 0) return null;

                    const displayName =
                      unitKey === 'other' ? 'その他（コラボ・ゲスト）' : unitMeta.name;

                    // 単一キャラクターボタン描画ヘルパー
                    const renderCharButton = (char: (typeof CHARACTERS)[number]) => {
                      const isSelected = filterOptions.characters.includes(char.id);
                      return (
                        <button
                          key={char.id}
                          type="button"
                          onClick={() => handleCharacterToggle(char.id)}
                          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs text-left transition-all ${isSelected
                            ? 'bg-white border-[#33ccbb] text-[#0d9488] font-bold shadow-2xs'
                            : 'bg-white/80 border-slate-200/70 text-slate-600 hover:bg-white'
                            }`}
                        >
                          <div
                            className="w-2.5 h-2.5 rounded-full shrink-0 border border-slate-300/80 shadow-2xs"
                            style={{ backgroundColor: char.color }}
                          />
                          <span className="truncate flex-1">{char.name}</span>
                          {isSelected && (
                            <Check className="w-3 h-3 text-[#0d9488] shrink-0" />
                          )}
                        </button>
                      );
                    };

                    // バーチャル・シンガーの場合：ゲーム内登場（6人）とゲーム未登場（30人）を分離
                    if (unitKey === 'virtual_singer') {
                      const mainChars = unitChars.filter((c) =>
                        GAME_VIRTUAL_SINGER_IDS.includes(c.id as any)
                      );
                      const extraChars = unitChars.filter(
                        (c) => !GAME_VIRTUAL_SINGER_IDS.includes(c.id as any)
                      );
                      const selectedExtraCount = extraChars.filter((c) =>
                        filterOptions.characters.includes(c.id)
                      ).length;

                      return (
                        <div key={unitKey} className="space-y-1.5">
                          <div className="flex items-center justify-between px-1 pt-1">
                            <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-700">
                              {unitMeta.iconUrl ? (
                                <img
                                  src={unitMeta.iconUrl}
                                  alt={unitMeta.name}
                                  className="w-3.5 h-3.5 object-contain shrink-0 drop-shadow-2xs"
                                />
                              ) : (
                                <div
                                  className="w-2.5 h-2.5 rounded-full shrink-0 border border-slate-300"
                                  style={{ backgroundColor: unitMeta.themeColor }}
                                />
                              )}
                              <span>{displayName}</span>
                            </div>
                            <div className="flex items-center gap-1 text-[10px]">
                              <button
                                type="button"
                                onClick={() => handleBatchSelectChars(mainChars.map((c) => c.id), true)}
                                className="px-2 py-0.5 rounded-md bg-white border border-slate-200/80 hover:bg-[#33ccbb]/10 text-[#0d9488] font-bold transition-colors cursor-pointer"
                              >
                                全選択
                              </button>
                              <button
                                type="button"
                                onClick={() => handleBatchSelectChars(mainChars.map((c) => c.id), false)}
                                className="px-2 py-0.5 rounded-md bg-white border border-slate-200/80 hover:bg-slate-100 text-slate-500 font-medium transition-colors cursor-pointer"
                              >
                                クリア
                              </button>
                            </div>
                          </div>

                          {/* ゲーム内登場の6人（初音ミク、鏡音リン、鏡音レン、巡音ルカ、MEIKO、KAITO） */}
                          <div className="grid grid-cols-2 gap-1.5">
                            {mainChars.map(renderCharButton)}
                          </div>

                          {/* ゲーム未登場シンガー（折りたたみ表示 & 全選択/クリア） */}
                          {extraChars.length > 0 && (
                            <div className="pt-1 space-y-1">
                              <div className="flex items-center justify-between px-1">
                                <span className="text-[11px] font-bold text-slate-600">
                                  ゲーム未登場シンガー ({extraChars.length}人)
                                </span>
                                <div className="flex items-center gap-1 text-[10px]">
                                  <button
                                    type="button"
                                    onClick={() => handleBatchSelectChars(extraChars.map((c) => c.id), true)}
                                    className="px-2 py-0.5 rounded-md bg-white border border-slate-200/80 hover:bg-[#33ccbb]/10 text-[#0d9488] font-bold transition-colors cursor-pointer"
                                  >
                                    全選択
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleBatchSelectChars(extraChars.map((c) => c.id), false)}
                                    className="px-2 py-0.5 rounded-md bg-white border border-slate-200/80 hover:bg-slate-100 text-slate-500 font-medium transition-colors cursor-pointer"
                                  >
                                    クリア
                                  </button>
                                </div>
                              </div>

                              <button
                                type="button"
                                onClick={() => setShowNonGameSingers(!showNonGameSingers)}
                                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-left text-xs font-bold transition-all border cursor-pointer ${showNonGameSingers
                                  ? 'bg-slate-200/80 border-slate-300 text-slate-800'
                                  : 'bg-slate-100/90 hover:bg-slate-200/60 border-slate-200 text-slate-600'
                                  }`}
                              >
                                <span className="flex items-center gap-1.5 text-[11px]">
                                  <span>シンガー一覧</span>
                                  {selectedExtraCount > 0 && (
                                    <span className="bg-[#33ccbb] text-white px-1.5 py-0.5 rounded-full text-[10px] font-bold leading-none shadow-2xs">
                                      {selectedExtraCount}人選択中
                                    </span>
                                  )}
                                </span>
                                <span className="flex items-center gap-1 text-[11px] text-slate-500">
                                  <span>{showNonGameSingers ? '閉じる' : '表示する'}</span>
                                  {showNonGameSingers ? (
                                    <ChevronUp className="w-3.5 h-3.5 text-slate-500" />
                                  ) : (
                                    <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                                  )}
                                </span>
                              </button>

                              {showNonGameSingers && (
                                <div className="grid grid-cols-2 gap-1.5 mt-1.5 pt-1.5 pl-2 border-l-2 border-slate-200 animate-in fade-in duration-150">
                                  {extraChars.map(renderCharButton)}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    }

                    // その他のユニット（レオニ、モモジャン、ビビバス、ワンダショ、ニーゴ、その他）
                    return (
                      <div key={unitKey} className="space-y-1.5">
                        <div className="flex items-center justify-between px-1 pt-1">
                          <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-700">
                            {unitMeta.iconUrl ? (
                              <img
                                src={unitMeta.iconUrl}
                                alt={unitMeta.name}
                                className="w-3.5 h-3.5 object-contain shrink-0 drop-shadow-2xs"
                              />
                            ) : (
                              <div
                                className="w-2.5 h-2.5 rounded-full shrink-0 border border-slate-300"
                                style={{ backgroundColor: unitMeta.themeColor }}
                              />
                            )}
                            <span>{displayName}</span>
                          </div>
                          <div className="flex items-center gap-1 text-[10px]">
                            <button
                              type="button"
                              onClick={() => handleBatchSelectChars(unitChars.map((c) => c.id), true)}
                              className="px-2 py-0.5 rounded-md bg-white border border-slate-200/80 hover:bg-[#33ccbb]/10 text-[#0d9488] font-bold transition-colors cursor-pointer"
                            >
                              全選択
                            </button>
                            <button
                              type="button"
                              onClick={() => handleBatchSelectChars(unitChars.map((c) => c.id), false)}
                              className="px-2 py-0.5 rounded-md bg-white border border-slate-200/80 hover:bg-slate-100 text-slate-500 font-medium transition-colors cursor-pointer"
                            >
                              クリア
                            </button>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-1.5">
                          {unitChars.map(renderCharButton)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* 5. 歌唱バージョンでの絞り込み */}
          {(() => {
            const vocalCount = [
              filterOptions.vocalVersions.sekai,
              filterOptions.vocalVersions.virtualSinger,
              filterOptions.vocalVersions.connectLive,
              filterOptions.vocalVersions.anotherVocal,
              filterOptions.vocalVersions.inst,
            ].filter(Boolean).length;

            return (
              <div className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-2xs">
                <div
                  onClick={() => toggleSection('vocalVersions')}
                  className="flex items-center justify-between p-3 cursor-pointer select-none bg-slate-50/60 hover:bg-slate-100/60 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs sm:text-sm text-slate-800">歌唱バージョン条件</span>
                    {vocalCount > 0 && (
                      <span className="text-[11px] bg-[#33ccbb]/15 text-[#0d9488] px-2 py-0.5 rounded-full font-bold">
                        {vocalCount}件選択中
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-1.5 text-xs">
                      <button
                        type="button"
                        onClick={() => handleSelectAllVocalVersions(true)}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-[#33ccbb]/15 text-[#0d9488] font-bold transition-colors cursor-pointer text-[11px]"
                      >
                        全選択
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSelectAllVocalVersions(false)}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 font-medium transition-colors cursor-pointer text-[11px]"
                      >
                        クリア
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleSection('vocalVersions')}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                      aria-label="歌唱バージョン条件を展開・折りたたみ"
                    >
                      {openSections.vocalVersions ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {openSections.vocalVersions && (
                  <div className="p-3 sm:p-4 border-t border-slate-100">
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {[
                        { key: 'sekai', label: 'セカイver あり' },
                        { key: 'virtualSinger', label: 'バーチャル・シンガーver あり' },
                        { key: 'connectLive', label: 'コネクトライブver あり' },
                        { key: 'anotherVocal', label: 'アナザーボーカル あり' },
                        { key: 'inst', label: 'Inst. ver. あり' },
                      ].map((v) => {
                        const active = filterOptions.vocalVersions[v.key as keyof typeof filterOptions.vocalVersions];
                        return (
                          <button
                            key={v.key}
                            type="button"
                            onClick={() =>
                              onFilterChange({
                                ...filterOptions,
                                vocalVersions: {
                                  ...filterOptions.vocalVersions,
                                  [v.key]: !active,
                                },
                              })
                            }
                            className={`px-3 py-2 rounded-xl border text-left font-medium transition-all cursor-pointer ${active
                                ? 'border-[#33ccbb] bg-[#33ccbb]/10 text-[#0d9488] font-bold shadow-2xs'
                                : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                              }`}
                          >
                            {v.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })()}

          {/* 6. 楽曲分類での絞り込み */}
          <div className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-2xs">
            <div
              onClick={() => toggleSection('originalTypes')}
              className="flex items-center justify-between p-3 cursor-pointer select-none bg-slate-50/60 hover:bg-slate-100/60 transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className="font-bold text-xs sm:text-sm text-slate-800">楽曲分類（書き下ろし楽曲等）</span>
                {filterOptions.originalTypes && filterOptions.originalTypes.length > 0 && (
                  <span className="text-[11px] bg-[#33ccbb]/15 text-[#0d9488] px-2 py-0.5 rounded-full font-bold">
                    {filterOptions.originalTypes.length}種選択中
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center gap-1.5 text-xs">
                  <button
                    type="button"
                    onClick={() => handleSelectAllOriginalTypes(true)}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-[#33ccbb]/15 text-[#0d9488] font-bold transition-colors cursor-pointer text-[11px]"
                  >
                    全選択
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectAllOriginalTypes(false)}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 font-medium transition-colors cursor-pointer text-[11px]"
                  >
                    クリア
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => toggleSection('originalTypes')}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                  aria-label="楽曲分類条件を展開・折りたたみ"
                >
                  {openSections.originalTypes ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {openSections.originalTypes && (
              <div className="p-3 sm:p-4 border-t border-slate-100">
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {(Object.keys(ORIGINAL_TYPE_METAS) as OriginalSongType[])
                    .filter((typeKey) => typeKey !== 'cover')
                    .map((typeKey) => {
                      const meta = ORIGINAL_TYPE_METAS[typeKey];
                      const isSelected = filterOptions.originalTypes?.includes(typeKey) ?? false;
                      return (
                        <button
                          key={typeKey}
                          type="button"
                          onClick={() => {
                            const current = filterOptions.originalTypes ?? [];
                            const updated = isSelected
                              ? current.filter((t) => t !== typeKey)
                              : [...current, typeKey];
                            onFilterChange({ ...filterOptions, originalTypes: updated });
                          }}
                          className={`px-3 py-2 rounded-xl border text-left font-medium transition-all cursor-pointer ${isSelected
                              ? 'border-[#33ccbb] bg-[#33ccbb]/10 text-[#0d9488] font-bold shadow-2xs'
                              : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                            }`}
                        >
                          {meta.label}
                        </button>
                      );
                    })}
                </div>
              </div>
            )}
          </div>

          {/* 7. イベントバナーキャラクターでの絞り込み */}
          <div className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-2xs">
            <div
              onClick={() => toggleSection('bannerCharacters')}
              className="flex items-center justify-between p-3 cursor-pointer select-none bg-slate-50/60 hover:bg-slate-100/60 transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className="font-bold text-xs sm:text-sm text-slate-800">イベントバナーキャラクター</span>
                {filterOptions.bannerCharacters && filterOptions.bannerCharacters.length > 0 && (
                  <span className="text-[11px] bg-[#33ccbb]/15 text-[#0d9488] px-2 py-0.5 rounded-full font-bold">
                    {filterOptions.bannerCharacters.length}人選択中
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center gap-1.5 text-xs">
                  <button
                    type="button"
                    onClick={() => handleSelectAllBannerCharacters(true)}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-[#33ccbb]/15 text-[#0d9488] font-bold transition-colors cursor-pointer text-[11px]"
                  >
                    全選択
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectAllBannerCharacters(false)}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 font-medium transition-colors cursor-pointer text-[11px]"
                  >
                    クリア
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => toggleSection('bannerCharacters')}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                  aria-label="イベントバナーキャラクター条件を展開・折りたたみ"
                >
                  {openSections.bannerCharacters ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {openSections.bannerCharacters && (
              <div className="p-3 sm:p-4 border-t border-slate-100 space-y-2">
                <p className="text-[11px] text-slate-400 leading-tight">
                  ※ 各イベント書き下ろし楽曲のバナー対象キャラクターで絞り込みます。
                </p>

                {(
                  [
                    'leo_need',
                    'more_more_jump',
                    'vivid_bad_squad',
                    'wonderlands_showtime',
                    'nightcord_at_25',
                  ] as UnitType[]
                ).map((uKey) => {
                  const uMeta = UNIT_METAS[uKey];
                  const members = CHARACTERS.filter((c) => c.unit === uKey);

                  return (
                    <div key={uKey} className="space-y-1">
                      <div className="flex items-center justify-between px-0.5">
                        <div className="flex items-center gap-1 text-[11px] font-bold text-slate-600">
                          {uMeta.iconUrl && (
                            <img src={uMeta.iconUrl} alt={uMeta.name} className="w-3 h-3 object-contain" />
                          )}
                          <span>{uMeta.name}</span>
                        </div>
                        <div className="flex gap-1.5 text-[10px]">
                          <button
                            type="button"
                            onClick={() => {
                              const memberIds = members.map((c) => c.id);
                              const merged = Array.from(
                                new Set([...(filterOptions.bannerCharacters || []), ...memberIds])
                              );
                              onFilterChange({ ...filterOptions, bannerCharacters: merged });
                            }}
                            className="text-[#0d9488] font-semibold hover:underline cursor-pointer"
                          >
                            全選択
                          </button>
                          <span className="text-slate-300">|</span>
                          <button
                            type="button"
                            onClick={() => {
                              const memberIds = members.map((c) => c.id);
                              const remaining = (filterOptions.bannerCharacters || []).filter(
                                (id) => !memberIds.includes(id)
                              );
                              onFilterChange({ ...filterOptions, bannerCharacters: remaining });
                            }}
                            className="text-slate-400 hover:underline cursor-pointer"
                          >
                            クリア
                          </button>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                        {members.map((char) => {
                          const isSelected =
                            filterOptions.bannerCharacters?.includes(char.id) ?? false;
                          return (
                            <button
                              key={char.id}
                              type="button"
                              onClick={() => {
                                const current = filterOptions.bannerCharacters ?? [];
                                const updated = isSelected
                                  ? current.filter((id) => id !== char.id)
                                  : [...current, char.id];
                                onFilterChange({ ...filterOptions, bannerCharacters: updated });
                              }}
                              className={`flex items-center gap-1.5 px-2 py-1.5 rounded-xl border text-left text-xs transition-all cursor-pointer ${isSelected
                                  ? 'border-slate-800 bg-slate-800 text-white font-bold shadow-2xs'
                                  : 'border-slate-200/80 bg-white text-slate-700 hover:bg-slate-50'
                                }`}
                            >
                              <span
                                className="w-2.5 h-2.5 rounded-full shrink-0 border border-black/10"
                                style={{ backgroundColor: char.color }}
                              />
                              <span className="truncate">{char.name}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* 8. 実装年での絞り込み */}
          <div className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-2xs">
            <div
              onClick={() => toggleSection('releaseYears')}
              className="flex items-center justify-between p-3 cursor-pointer select-none bg-slate-50/60 hover:bg-slate-100/60 transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className="font-bold text-xs sm:text-sm text-slate-800">実装年</span>
                {filterOptions.releaseYears && filterOptions.releaseYears.length > 0 && (
                  <span className="text-[11px] bg-[#33ccbb]/15 text-[#0d9488] px-2 py-0.5 rounded-full font-bold">
                    {filterOptions.releaseYears.length}件選択中
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center gap-1.5 text-xs">
                  <button
                    type="button"
                    onClick={() => handleSelectAllReleaseYears(true)}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-[#33ccbb]/15 text-[#0d9488] font-bold transition-colors cursor-pointer text-[11px]"
                  >
                    全選択
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectAllReleaseYears(false)}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 font-medium transition-colors cursor-pointer text-[11px]"
                  >
                    クリア
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => toggleSection('releaseYears')}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                  aria-label="実装年条件を展開・折りたたみ"
                >
                  {openSections.releaseYears ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {openSections.releaseYears && (
              <div className="p-3 sm:p-4 border-t border-slate-100">
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {[
                    { year: 1, label: '1年目 (2020.9.30〜)' },
                    { year: 2, label: '2年目 (2021.9.30〜)' },
                    { year: 3, label: '3年目 (2022.9.30〜)' },
                    { year: 4, label: '4年目 (2023.9.30〜)' },
                    { year: 5, label: '5年目 (2024.9.30〜)' },
                    { year: 6, label: '6年目 (2025.9.30〜)' },
                    { year: 7, label: '7年目 (2026.9.30〜)' },
                  ].map((item) => {
                    const isSelected = filterOptions.releaseYears?.includes(item.year) ?? false;
                    return (
                      <button
                        key={item.year}
                        type="button"
                        onClick={() => {
                          const current = filterOptions.releaseYears ?? [];
                          const updated = isSelected
                            ? current.filter((y) => y !== item.year)
                            : [...current, item.year];
                          onFilterChange({ ...filterOptions, releaseYears: updated });
                        }}
                        className={`px-3 py-2 rounded-xl border text-left font-medium transition-all cursor-pointer ${isSelected
                            ? 'border-[#33ccbb] bg-[#33ccbb]/10 text-[#0d9488] font-bold shadow-2xs'
                            : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                          }`}
                      >
                        {item.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* フッター操作ボタン */}
        <div className="px-5 py-3.5 border-t border-slate-100 bg-slate-50/70 flex items-center justify-between">
          <button
            type="button"
            onClick={onResetFilter}
            className="text-xs text-slate-500 hover:text-slate-800 font-medium underline"
          >
            初期条件にリセット
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-[#33ccbb] hover:bg-[#2cb3a5] text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs transition-colors"
          >
            完了
          </button>
        </div>
      </div>
    </div>
  );
};

interface DisplaySettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: DisplaySettings;
  onSettingsChange: (settings: DisplaySettings) => void;
}

export const DisplaySettingsModal: React.FC<DisplaySettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSettingsChange,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="bg-white/95 backdrop-blur-md rounded-3xl max-w-sm w-full p-5 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-xl bg-[#33ccbb]/20 text-[#0d9488]">
              <Eye className="w-4 h-4" />
            </div>
            <h2 className="text-base font-bold text-slate-800">表示情報の設定</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="閉じる"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="py-4 space-y-3.5 text-sm">
          <label className="flex items-center justify-between cursor-pointer p-2 rounded-xl hover:bg-slate-50 transition-colors">
            <div>
              <span className="block text-slate-800 font-medium">ジャケット画像</span>
              <span className="text-[11px] text-slate-400">一覧にジャケットを表示する</span>
            </div>
            <input
              type="checkbox"
              checked={settings.showJacket}
              onChange={(e) =>
                onSettingsChange({ ...settings, showJacket: e.target.checked })
              }
              className="w-5 h-5 accent-[#33ccbb] rounded"
            />
          </label>

          <label className="flex items-center justify-between cursor-pointer p-2 rounded-xl hover:bg-slate-50 transition-colors">
            <div>
              <span className="block text-slate-800 font-medium">実装日</span>
              <span className="text-[11px] text-slate-400">楽曲の実装年月日を表示する</span>
            </div>
            <input
              type="checkbox"
              checked={settings.showReleaseDate}
              onChange={(e) =>
                onSettingsChange({ ...settings, showReleaseDate: e.target.checked })
              }
              className="w-5 h-5 accent-[#33ccbb] rounded"
            />
          </label>

          <label className="flex items-center justify-between cursor-pointer p-2 rounded-xl hover:bg-slate-50 transition-colors">
            <div>
              <span className="block text-slate-800 font-medium">実装順</span>
              <span className="text-[11px] text-slate-400">楽曲の通し番号（No.）を表示する</span>
            </div>
            <input
              type="checkbox"
              checked={settings.showReleaseOrder}
              onChange={(e) =>
                onSettingsChange({ ...settings, showReleaseOrder: e.target.checked })
              }
              className="w-5 h-5 accent-[#33ccbb] rounded"
            />
          </label>

          <label className="flex items-center justify-between cursor-pointer p-2 rounded-xl hover:bg-slate-50 transition-colors">
            <div>
              <span className="block text-slate-800 font-medium">歌唱verバッジ</span>
              <span className="text-[11px] text-slate-400">セカイ/VS等のバッジを表示する</span>
            </div>
            <input
              type="checkbox"
              checked={settings.showVocalBadges}
              onChange={(e) =>
                onSettingsChange({ ...settings, showVocalBadges: e.target.checked })
              }
              className="w-5 h-5 accent-[#33ccbb] rounded"
            />
          </label>

          <label className="flex items-center justify-between cursor-pointer p-2 rounded-xl hover:bg-slate-50 transition-colors">
            <div>
              <span className="block text-slate-800 font-medium">コンパクト表示</span>
              <span className="text-[11px] text-slate-400">リスト行の上下余白を縮小する</span>
            </div>
            <input
              type="checkbox"
              checked={settings.compactMode}
              onChange={(e) =>
                onSettingsChange({ ...settings, compactMode: e.target.checked })
              }
              className="w-5 h-5 accent-[#33ccbb] rounded"
            />
          </label>
        </div>

        <div className="pt-3 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#33ccbb] hover:bg-[#2cb3a5] text-white font-bold text-xs rounded-xl shadow-xs"
          >
            完了
          </button>
        </div>
      </div>
    </div>
  );
};
