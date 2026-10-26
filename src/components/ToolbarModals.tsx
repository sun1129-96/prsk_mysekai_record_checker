import React from 'react';
import { X, ArrowUpDown, Filter, Eye, Check, Users } from 'lucide-react';
import type {
  SortType,
  SortDirection,
  FilterOptions,
  DisplaySettings,
  UnitType,
} from '../types/record';
import { UNIT_METAS, CHARACTERS } from '../types/record';

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
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors"
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
                onClick={() => onSortChange('releaseDate', sortDirection)}
                className={`py-2.5 px-3 rounded-xl border font-bold text-xs sm:text-sm text-center transition-all ${
                  sortType === 'releaseDate'
                    ? 'border-[#33ccbb] bg-[#33ccbb]/10 text-[#0d9488] shadow-2xs'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                配信日順
              </button>

              <button
                type="button"
                onClick={() => onSortChange('defaultOrder', sortDirection)}
                className={`py-2.5 px-3 rounded-xl border font-bold text-xs sm:text-sm text-center transition-all ${
                  sortType === 'defaultOrder'
                    ? 'border-[#33ccbb] bg-[#33ccbb]/10 text-[#0d9488] shadow-2xs'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                デフォルト順
              </button>

              <button
                type="button"
                onClick={() => onSortChange('reading', sortDirection)}
                className={`py-2.5 px-3 rounded-xl border font-bold text-xs sm:text-sm text-center transition-all ${
                  sortType === 'reading'
                    ? 'border-[#33ccbb] bg-[#33ccbb]/10 text-[#0d9488] shadow-2xs'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                五十音順
              </button>
            </div>

            {/* 昇順・降順の明示的選択 */}
            <div className="bg-slate-50 p-2.5 rounded-2xl border border-slate-200/80">
              <div className="text-[11px] font-bold text-slate-500 mb-1.5">順序の指定</div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => onSortChange(sortType, 'desc')}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                    sortDirection === 'desc'
                      ? 'border-[#33ccbb] bg-white text-[#0d9488] shadow-xs'
                      : 'border-transparent text-slate-500 hover:bg-slate-200/50'
                  }`}
                >
                  {sortType === 'releaseDate' && '新しい順 (降順)'}
                  {sortType === 'defaultOrder' && '番号が大きい順 (降順)'}
                  {sortType === 'reading' && 'ん → あ (降順)'}
                </button>

                <button
                  type="button"
                  onClick={() => onSortChange(sortType, 'asc')}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                    sortDirection === 'asc'
                      ? 'border-[#33ccbb] bg-white text-[#0d9488] shadow-xs'
                      : 'border-transparent text-slate-500 hover:bg-slate-200/50'
                  }`}
                >
                  {sortType === 'releaseDate' && '古い順 (昇順)'}
                  {sortType === 'defaultOrder' && '番号が小さい順 (昇順)'}
                  {sortType === 'reading' && 'あ → ん (昇順)'}
                </button>
              </div>
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
                  className={`py-2 px-3 rounded-xl border text-xs sm:text-sm font-medium transition-all ${
                    filterOptions.ownership === status.id
                      ? 'border-[#33ccbb] bg-[#33ccbb]/10 text-[#0d9488] font-bold'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {status.label}
                </button>
              ))}
            </div>
          </div>

          {/* 3. ユニットでの絞り込み */}
          <div className="pt-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="font-bold text-slate-700">ユニット</div>
              <div className="flex gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => handleSelectAllUnits(true)}
                  className="text-[#0d9488] font-semibold hover:underline"
                >
                  全選択
                </button>
                <span className="text-slate-300">|</span>
                <button
                  type="button"
                  onClick={() => handleSelectAllUnits(false)}
                  className="text-slate-400 hover:underline"
                >
                  クリア
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {(Object.keys(UNIT_METAS) as UnitType[]).map((unitKey) => {
                const meta = UNIT_METAS[unitKey];
                const isSelected = filterOptions.units.includes(unitKey);
                return (
                  <button
                    key={unitKey}
                    type="button"
                    onClick={() => handleUnitToggle(unitKey)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-left text-xs font-medium transition-all ${
                      isSelected
                        ? 'border-slate-400/80 bg-white shadow-2xs text-slate-800'
                        : 'border-slate-200/70 bg-slate-50/60 text-slate-400 opacity-60'
                    }`}
                  >
                    <div
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: meta.themeColor }}
                    />
                    <span className="truncate flex-1">{meta.name}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-slate-600 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4. 歌唱キャラクターでの絞り込み（新規追加） */}
          <div className="pt-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 font-bold text-slate-700">
                <Users className="w-4 h-4 text-[#33ccbb]" />
                <span>歌唱キャラクター</span>
                {filterOptions.characters.length > 0 && (
                  <span className="text-[11px] bg-[#33ccbb]/15 text-[#0d9488] px-2 py-0.5 rounded-full font-bold">
                    {filterOptions.characters.length}人選択中
                  </span>
                )}
              </div>
              {filterOptions.characters.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearCharacters}
                  className="text-xs text-slate-400 hover:text-slate-600 hover:underline"
                >
                  クリア
                </button>
              )}
            </div>

            <div className="max-h-48 overflow-y-auto p-1 space-y-3 bg-slate-50/60 rounded-2xl border border-slate-200/80">
              {(Object.keys(UNIT_METAS) as UnitType[])
                .filter((u) => u !== 'other')
                .map((unitKey) => {
                  const unitMeta = UNIT_METAS[unitKey];
                  const unitChars = CHARACTERS.filter((c) => c.unit === unitKey);
                  return (
                    <div key={unitKey} className="space-y-1">
                      <div className="text-[10px] font-bold text-slate-400 px-1">
                        {unitMeta.shortName}
                      </div>
                      <div className="grid grid-cols-2 gap-1.5">
                        {unitChars.map((char) => {
                          const isSelected = filterOptions.characters.includes(char.id);
                          return (
                            <button
                              key={char.id}
                              type="button"
                              onClick={() => handleCharacterToggle(char.id)}
                              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs text-left transition-all ${
                                isSelected
                                  ? 'bg-white border-[#33ccbb] text-[#0d9488] font-bold shadow-2xs'
                                  : 'bg-white/80 border-slate-200/70 text-slate-600 hover:bg-white'
                              }`}
                            >
                              <div
                                className="w-2.5 h-2.5 rounded-full shrink-0"
                                style={{ backgroundColor: char.color }}
                              />
                              <span className="truncate flex-1">{char.name}</span>
                              {isSelected && (
                                <Check className="w-3 h-3 text-[#0d9488] shrink-0" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

          {/* 5. 歌唱バージョンでの絞り込み */}
          <div className="pt-4 space-y-2">
            <div className="font-bold text-slate-700">歌唱バージョン条件</div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {[
                { key: 'sekai', label: 'セカイver あり' },
                { key: 'virtualSinger', label: 'バーチャル・シンガーver あり' },
                { key: 'connectLive', label: 'コネクトライブver あり' },
                { key: 'anotherVocal', label: 'アナザーボーカル あり' },
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
                    className={`px-3 py-2 rounded-xl border text-left font-medium transition-all ${
                      active
                        ? 'border-[#33ccbb] bg-[#33ccbb]/10 text-[#0d9488] font-bold'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {v.label}
                  </button>
                );
              })}
            </div>
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
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100"
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
              <span className="block text-slate-800 font-medium">配信日</span>
              <span className="text-[11px] text-slate-400">楽曲の配信年月日を表示する</span>
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
