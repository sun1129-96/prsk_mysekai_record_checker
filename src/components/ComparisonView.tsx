import React, { useState, useMemo, useEffect } from 'react';
import {
  BarChart2,
  Award,
  Sparkles,
  ArrowUpDown,
  ExternalLink,
  Plus,
  Trash2,
  Users,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import type {
  RecordItem,
  UnitType,
  FilterOptions,
  OriginalSongType,
  SavedCompareCondition,
} from '../types/record';
import {
  UNIT_METAS,
  CHARACTERS,
  GAME_VIRTUAL_SINGER_IDS,
  ORIGINAL_TYPE_METAS,
} from '../types/record';
import { filterAndSortRecords } from '../utils/recordUtils';

interface ComparisonViewProps {
  records: RecordItem[];
  ownedRecordIds: Record<string, boolean>;
  onNavigateToList: (filter: Partial<FilterOptions>) => void;
}

type CompareTab = 'unit' | 'vocal' | 'year' | 'character' | 'custom';
type SortMetric = 'default' | 'percentage_desc' | 'percentage_asc' | 'count_desc';

const CUSTOM_CONDITIONS_STORAGE_KEY = 'mysekai_custom_compare_conditions_v1';

/** プロセカ公式キャラクター順（キャラクター選択画面に登場する順序） */
export const PROSEKA_DEFAULT_CHAR_ORDER: string[] = [
  // Leo/need
  'ichika',
  'saki',
  'honami',
  'shiho',
  // MORE MORE JUMP!
  'minori',
  'haruka',
  'airi',
  'shizuku',
  // Vivid BAD SQUAD
  'kohane',
  'an',
  'akito',
  'toya',
  // ワンダーランズ×ショウタイム
  'tsukasa',
  'emu',
  'nene',
  'rui',
  // 25時、ナイトコードで。
  'kanade',
  'mafuyu',
  'ena',
  'mizuki',
  // バーチャル・シンガー
  'miku',
  'rin',
  'len',
  'luka',
  'meiko',
  'kaito',
];

/**
 * カスタム比較条件に合致するか判定（AND / OR 条件評価）
 */
export const checkRecordMatchesCustomCondition = (
  record: RecordItem,
  cond: SavedCompareCondition
): boolean => {
  const matchType = cond.matchType || 'and';
  const units = cond.conditionUnits || [];
  const characters = cond.conditionCharacters || [];
  const originalTypes = cond.conditionOriginalTypes || [];
  const vocalTypes = cond.conditionVocalTypes || [];

  const hasSpecificConditions =
    units.length > 0 ||
    characters.length > 0 ||
    originalTypes.length > 0 ||
    vocalTypes.length > 0;

  if (!hasSpecificConditions) {
    if (cond.filter) {
      const filtered = filterAndSortRecords([record], {}, 'defaultOrder', 'asc', cond.filter);
      return filtered.length > 0;
    }
    return true;
  }

  const results: boolean[] = [];

  if (units.length > 0) {
    results.push(units.includes(record.unit));
  }

  if (characters.length > 0) {
    results.push(record.characters.some((c) => characters.includes(c)));
  }

  if (originalTypes.length > 0) {
    const songType = record.originalType || 'cover';
    results.push(originalTypes.includes(songType));
  }

  if (vocalTypes.length > 0) {
    const hasAnyTrack = vocalTypes.some((vt) => {
      if (vt === 'sekai') return Boolean(record.vocalVersions?.sekai);
      if (vt === 'virtualSinger') return Boolean(record.vocalVersions?.virtualSinger);
      if (vt === 'anotherVocal') return Boolean(record.vocalVersions?.anotherVocal);
      return false;
    });
    results.push(hasAnyTrack);
  }

  if (results.length === 0) return true;

  return matchType === 'and' ? results.every(Boolean) : results.some(Boolean);
};

export const ComparisonView: React.FC<ComparisonViewProps> = ({
  records,
  ownedRecordIds,
  onNavigateToList,
}) => {
  // 5大タブ（ユニット別 / 歌唱ver別 / 実装年別 / 歌唱キャラ別 / カスタム比較）
  const [activeTab, setActiveTab] = useState<CompareTab>('unit');

  // ソート基準（デフォルト順 / 所持率降順 / 所持率昇順 / 曲数降順）
  const [sortMetric, setSortMetric] = useState<SortMetric>('default');

  // 歌唱キャラ別タブ用: 選択されたキャラクターID（初期値: メイン各ユニットのリーダー）
  const [selectedCharIds, setSelectedCharIds] = useState<string[]>([
    'ichika',
    'minori',
    'kohane',
    'tsukasa',
    'kanade',
    'miku',
  ]);

  // 歌唱キャラ別タブ用: キャラクター選択パネルの開閉状態
  const [isCharSelectorOpen, setIsCharSelectorOpen] = useState(true);

  // カスタム比較条件一覧（LocalStorage 永続化）
  const [savedConditions, setSavedConditions] = useState<SavedCompareCondition[]>(() => {
    try {
      const saved = localStorage.getItem(CUSTOM_CONDITIONS_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    // 初期プリセット
    return [
      {
        id: 'cond_preset_1',
        title: 'イベント書き下ろし楽曲（全ユニット）',
        filter: {
          ownership: 'all',
          units: Object.keys(UNIT_METAS) as UnitType[],
          characters: [],
          vocalVersions: { virtualSinger: false, sekai: false, connectLive: false, anotherVocal: false },
          searchQuery: '',
          originalTypes: ['event'],
        },
        createdAt: Date.now() - 2000,
      },
      {
        id: 'cond_preset_2',
        title: 'Leo/need イベント書き下ろし',
        filter: {
          ownership: 'all',
          units: ['leo_need'],
          characters: [],
          vocalVersions: { virtualSinger: false, sekai: false, connectLive: false, anotherVocal: false },
          searchQuery: '',
          originalTypes: ['event'],
        },
        createdAt: Date.now() - 1000,
      },
      {
        id: 'cond_preset_3',
        title: 'アナザーボーカルver 所持状況',
        filter: {
          ownership: 'all',
          units: Object.keys(UNIT_METAS) as UnitType[],
          characters: [],
          vocalVersions: { virtualSinger: false, sekai: false, connectLive: false, anotherVocal: true },
          searchQuery: '',
        },
        createdAt: Date.now(),
      },
    ];
  });

  useEffect(() => {
    try {
      localStorage.setItem(CUSTOM_CONDITIONS_STORAGE_KEY, JSON.stringify(savedConditions));
    } catch {
      // ignore
    }
  }, [savedConditions]);

  // 新規カスタム条件作成フォームのステート（複数選択・AND/OR対応）
  const [newTitle, setNewTitle] = useState('');
  const [newMatchType, setNewMatchType] = useState<'and' | 'or'>('and');
  const [newSelectedUnits, setNewSelectedUnits] = useState<UnitType[]>([]);
  const [newSelectedChars, setNewSelectedChars] = useState<string[]>([]);
  const [newSelectedOriginalTypes, setNewSelectedOriginalTypes] = useState<OriginalSongType[]>([]);
  const [newSelectedVocalTypes, setNewSelectedVocalTypes] = useState<
    ('sekai' | 'virtualSinger' | 'anotherVocal')[]
  >([]);

  // 1. ユニット別集計
  const unitStats = useMemo(() => {
    const list = (Object.keys(UNIT_METAS) as UnitType[]).map((unitKey, index) => {
      const meta = UNIT_METAS[unitKey];
      const unitRecords = records.filter((r) => r.unit === unitKey);
      const total = unitRecords.length;
      const owned = unitRecords.filter((r) => ownedRecordIds[r.id]).length;
      const percentage = total > 0 ? (owned / total) * 100 : 0;

      return {
        key: unitKey,
        name: meta.name,
        shortName: meta.shortName,
        themeColor: meta.themeColor,
        iconUrl: meta.iconUrl,
        total,
        owned,
        percentage,
        isComplete: total > 0 && owned === total,
        defaultOrderIndex: index,
        filterParams: { units: [unitKey] },
      };
    });
    return list;
  }, [records, ownedRecordIds]);

  // 2. 歌唱ver別集計（独立タブ化）
  const vocalStats = useMemo(() => {
    const vocalDefs = [
      { key: 'sekai', label: 'セカイver', color: '#10b981', filter: { vocalVersions: { sekai: true, virtualSinger: false, connectLive: false, anotherVocal: false } } },
      { key: 'virtualSinger', label: 'バーチャル・シンガーver', color: '#14b8a6', filter: { vocalVersions: { sekai: false, virtualSinger: true, connectLive: false, anotherVocal: false } } },
      { key: 'anotherVocal', label: 'アナザーボーカルver', color: '#f59e0b', filter: { vocalVersions: { sekai: false, virtualSinger: false, connectLive: false, anotherVocal: true } } },
      { key: 'connectLive', label: 'コネクトライブver', color: '#0ea5e9', filter: { vocalVersions: { sekai: false, virtualSinger: false, connectLive: true, anotherVocal: false } } },
    ];

    return vocalDefs.map((v, index) => {
      const matched = records.filter((r) => r.vocalVersions[v.key as keyof typeof r.vocalVersions]);
      const total = matched.length;
      const owned = matched.filter((r) => ownedRecordIds[r.id]).length;
      const percentage = total > 0 ? (owned / total) * 100 : 0;

      return {
        key: v.key,
        name: v.label,
        themeColor: v.color,
        total,
        owned,
        percentage,
        isComplete: total > 0 && owned === total,
        defaultOrderIndex: index,
        filterParams: v.filter,
      };
    });
  }, [records, ownedRecordIds]);

  // 3. 実装年別集計（○年目形式、最新年は終了日なし「2026.9.30～」）
  const releaseYearStats = useMemo(() => {
    const getAnnivYear = (dateStr: string): number => {
      const parts = dateStr.split('-');
      if (parts.length < 3) return 1;
      const y = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10);
      const d = parseInt(parts[2], 10);
      const isAfterSep30 = m > 9 || (m === 9 && d >= 30);
      return isAfterSep30 ? y - 2020 + 1 : y - 2020;
    };

    const yearList = Array.from(new Set(records.map((r) => getAnnivYear(r.releaseDate)))).sort((a, b) => a - b);
    const maxYear = yearList.length > 0 ? Math.max(...yearList) : 1;
    const colors = ['#6366f1', '#3b82f6', '#06b6d4', '#10b981', '#f59e0b', '#ec4899', '#a855f7'];

    return yearList.map((annivYear, index) => {
      const yearRecords = records.filter((r) => getAnnivYear(r.releaseDate) === annivYear);
      const total = yearRecords.length;
      const owned = yearRecords.filter((r) => ownedRecordIds[r.id]).length;
      const percentage = total > 0 ? (owned / total) * 100 : 0;
      const startYear = 2020 + annivYear - 1;
      const endYear = startYear + 1;

      // 最新の実装年は2026.9.30～の形にし、終了日の記載を行わない
      const isLatest = annivYear === maxYear;
      const periodLabel = isLatest
        ? `(${startYear}.9.30～)`
        : `(${startYear}.9.30 〜 ${endYear}.9.29)`;

      return {
        key: `year_${annivYear}`,
        name: `${annivYear}年目 実装曲 ${periodLabel}`,
        themeColor: colors[(annivYear - 1) % colors.length],
        total,
        owned,
        percentage,
        isComplete: total > 0 && owned === total,
        defaultOrderIndex: index,
        filterParams: { searchQuery: '' }, // 実装年別はリスト側では検索条件でフィルタ
      };
    });
  }, [records, ownedRecordIds]);

  // 4. 歌唱キャラ別集計（プロセカのキャラクター選択画面に登場する順序でデフォルトソート）
  const characterStats = useMemo(() => {
    return selectedCharIds.map((charId, index) => {
      const char = CHARACTERS.find((c) => c.id === charId);
      const matched = records.filter((r) => r.characters.includes(charId));
      const total = matched.length;
      const owned = matched.filter((r) => ownedRecordIds[r.id]).length;
      const percentage = total > 0 ? (owned / total) * 100 : 0;

      const orderInGame = PROSEKA_DEFAULT_CHAR_ORDER.indexOf(charId);
      const defaultOrderIndex = orderInGame !== -1 ? orderInGame : 100 + index;

      return {
        key: charId,
        name: `${char ? char.name : charId} 歌唱曲`,
        themeColor: char ? char.color : '#33ccbb',
        total,
        owned,
        percentage,
        isComplete: total > 0 && owned === total,
        defaultOrderIndex,
        filterParams: { characters: [charId] },
      };
    });
  }, [records, ownedRecordIds, selectedCharIds]);

  // 5. カスタム比較集計（複数条件・AND/OR条件対応）
  const customStats = useMemo(() => {
    return savedConditions.map((cond, index) => {
      const matched = records.filter((r) => checkRecordMatchesCustomCondition(r, cond));
      const total = matched.length;
      const owned = matched.filter((r) => ownedRecordIds[r.id]).length;
      const percentage = total > 0 ? (owned / total) * 100 : 0;

      return {
        key: cond.id,
        name: cond.title,
        themeColor: '#33ccbb',
        total,
        owned,
        percentage,
        isComplete: total > 0 && owned === total,
        defaultOrderIndex: index,
        filterParams: cond.filter,
        isCustom: true,
        cond,
      };
    });
  }, [records, ownedRecordIds, savedConditions]);

  // 現在のアクティブタブに基づくリスト取得
  const rawList = useMemo(() => {
    switch (activeTab) {
      case 'unit':
        return unitStats;
      case 'vocal':
        return vocalStats;
      case 'year':
        return releaseYearStats;
      case 'character':
        return characterStats;
      case 'custom':
        return customStats;
    }
  }, [activeTab, unitStats, vocalStats, releaseYearStats, characterStats, customStats]);

  // ソート適用（デフォルト順 / 所持率高い順 / 所持率低い順 / 曲数多い順）
  const sortedList = useMemo(() => {
    const list = [...rawList];
    if (sortMetric === 'default') {
      return list.sort((a, b) => a.defaultOrderIndex - b.defaultOrderIndex);
    }
    if (sortMetric === 'percentage_desc') {
      return list.sort((a, b) => b.percentage - a.percentage || b.total - a.total);
    }
    if (sortMetric === 'percentage_asc') {
      return list.sort((a, b) => a.percentage - b.percentage || b.total - a.total);
    }
    if (sortMetric === 'count_desc') {
      return list.sort((a, b) => b.total - a.total || b.percentage - a.percentage);
    }
    return list;
  }, [rawList, sortMetric]);

  // 新規カスタム条件の追加（複数選択・AND/OR対応）
  const handleAddCustomCondition = (e: React.FormEvent) => {
    e.preventDefault();
    let title = newTitle.trim();
    if (!title) {
      // 選択された条件から自動命名
      const parts: string[] = [];
      if (newSelectedUnits.length > 0) {
        parts.push(newSelectedUnits.map((u) => UNIT_METAS[u]?.shortName || u).join('/'));
      }
      if (newSelectedOriginalTypes.length > 0) {
        parts.push(newSelectedOriginalTypes.map((t) => ORIGINAL_TYPE_METAS[t]?.shortLabel || t).join('/'));
      }
      if (newSelectedChars.length > 0) {
        parts.push(newSelectedChars.map((c) => CHARACTERS.find((ch) => ch.id === c)?.name || c).join('/'));
      }
      if (newSelectedVocalTypes.length > 0) {
        parts.push(
          newSelectedVocalTypes
            .map((vt) => (vt === 'sekai' ? 'セカイ' : vt === 'virtualSinger' ? 'バチャシン' : 'アナザー'))
            .join('/')
        );
      }
      if (parts.length === 0) {
        alert('少なくとも1つの条件（ユニット、楽曲分類、キャラ、歌唱ver）を選択してください');
        return;
      }
      title = `${parts.join(' × ')} (${newMatchType.toUpperCase()})`;
    }

    const newFilter: FilterOptions = {
      ownership: 'all',
      units: newSelectedUnits.length > 0 ? newSelectedUnits : (Object.keys(UNIT_METAS) as UnitType[]),
      characters: newSelectedChars,
      vocalVersions: {
        virtualSinger: newSelectedVocalTypes.includes('virtualSinger'),
        sekai: newSelectedVocalTypes.includes('sekai'),
        connectLive: false,
        anotherVocal: newSelectedVocalTypes.includes('anotherVocal'),
      },
      searchQuery: '',
      originalTypes: newSelectedOriginalTypes.length > 0 ? newSelectedOriginalTypes : undefined,
    };

    const newCond: SavedCompareCondition = {
      id: `cond_${Date.now()}`,
      title,
      filter: newFilter,
      createdAt: Date.now(),
      matchType: newMatchType,
      conditionUnits: newSelectedUnits,
      conditionCharacters: newSelectedChars,
      conditionOriginalTypes: newSelectedOriginalTypes,
      conditionVocalTypes: newSelectedVocalTypes,
    };

    setSavedConditions((prev) => [newCond, ...prev]);
    setNewTitle('');
    alert(`比較条件「${title}」を追加しました！`);
  };

  // カスタム条件の削除
  const handleDeleteCustomCondition = (id: string, title: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`比較条件「${title}」を削除しますか？`)) {
      setSavedConditions((prev) => prev.filter((c) => c.id !== id));
    }
  };

  // ユニットごとのキャラクター一括選択
  const handleSelectUnitChars = (unitKey: UnitType) => {
    const unitCharIds = CHARACTERS.filter((c) => c.unit === unitKey).map((c) => c.id);
    const allSelected = unitCharIds.every((id) => selectedCharIds.includes(id));
    if (allSelected) {
      // ユニット分を解除（最低1人は保持）
      const remaining = selectedCharIds.filter((id) => !unitCharIds.includes(id));
      setSelectedCharIds(remaining.length > 0 ? remaining : [unitCharIds[0]]);
    } else {
      setSelectedCharIds(Array.from(new Set([...selectedCharIds, ...unitCharIds])));
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-6 py-4 space-y-4">
      {/* 画面上部カード（説明文） */}
      <div className="bg-white/90 backdrop-blur-md rounded-3xl p-4 sm:p-5 border border-slate-200/80 shadow-xs flex items-center gap-3">
        <div className="p-2.5 rounded-2xl bg-[#33ccbb]/15 text-[#0d9488] shrink-0">
          <BarChart2 className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-sm sm:text-base font-bold text-slate-800">
            所持率の比較・進捗分析
          </h2>
          <p className="text-xs text-slate-500">
            各条件の所持率を棒グラフで比較。バーをクリックすると該当楽曲一覧へ直接ジャンプできます。
          </p>
        </div>
      </div>

      {/* 固定表示されるタブ切り替え & 並び替えツールバー (スクロール追従) */}
      <div className="sticky top-[97px] z-30 bg-white/95 backdrop-blur-md rounded-2xl p-2.5 sm:p-3 border border-slate-200/90 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
        {/* 5大タブ切り替え */}
        <div className="flex flex-wrap items-center gap-1 bg-slate-100/90 p-1 rounded-xl border border-slate-200/60 text-xs">
          <button
            onClick={() => setActiveTab('unit')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
              activeTab === 'unit'
                ? 'bg-white text-slate-800 shadow-2xs'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            ユニット別
          </button>
          <button
            onClick={() => setActiveTab('vocal')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
              activeTab === 'vocal'
                ? 'bg-white text-slate-800 shadow-2xs'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            歌唱ver別
          </button>
          <button
            onClick={() => setActiveTab('year')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
              activeTab === 'year'
                ? 'bg-white text-slate-800 shadow-2xs'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            実装年別
          </button>
          <button
            onClick={() => setActiveTab('character')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
              activeTab === 'character'
                ? 'bg-white text-slate-800 shadow-2xs'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            歌唱キャラ別
          </button>
          <button
            onClick={() => setActiveTab('custom')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1 cursor-pointer ${
              activeTab === 'custom'
                ? 'bg-[#33ccbb] text-white shadow-2xs'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>カスタム比較</span>
          </button>
        </div>

        {/* ソートセレクター（固定表示） */}
        <div className="flex items-center gap-1.5 self-end sm:self-auto bg-slate-100/90 px-2.5 py-1.5 rounded-xl border border-slate-200/70 text-xs font-bold text-slate-700 shrink-0">
          <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-[11px] text-slate-500 font-normal hidden sm:inline">並び替え:</span>
          <select
            value={sortMetric}
            onChange={(e) => setSortMetric(e.target.value as SortMetric)}
            className="bg-transparent border-none text-xs font-bold text-slate-700 focus:outline-hidden cursor-pointer"
          >
            <option value="default">デフォルト順</option>
            <option value="percentage_desc">達成率が高い順</option>
            <option value="percentage_asc">達成率が低い順</option>
            <option value="count_desc">楽曲数が多い順</option>
          </select>
        </div>
      </div>

      {/* メインコンテンツカード */}
      <div className="bg-white/90 backdrop-blur-md rounded-3xl p-4 sm:p-5 border border-slate-200/80 shadow-xs space-y-4">
        {/* 歌唱キャラ別タブ時のキャラクター選択コントロール（折りたたみ可能） */}
        {activeTab === 'character' && (
          <div className="p-3 sm:p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setIsCharSelectorOpen((prev) => !prev)}
                className="flex items-center gap-2 text-xs font-bold text-slate-700 hover:text-slate-900 cursor-pointer transition-colors"
              >
                <Users className="w-4 h-4 text-[#33ccbb]" />
                <span>比較キャラクター選択 ({selectedCharIds.length}人選択中)</span>
                {isCharSelectorOpen ? (
                  <ChevronUp className="w-4 h-4 text-slate-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                )}
              </button>

              <div className="flex gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setSelectedCharIds(CHARACTERS.map((c) => c.id))}
                  className="text-[#0d9488] font-bold hover:underline cursor-pointer"
                >
                  全選択
                </button>
                <span className="text-slate-300">|</span>
                <button
                  type="button"
                  onClick={() => setSelectedCharIds(['ichika'])}
                  className="text-slate-400 hover:underline cursor-pointer"
                >
                  リセット
                </button>
              </div>
            </div>

            {/* 折りたたみ可能なキャラクター一覧 */}
            {isCharSelectorOpen && (
              <div className="space-y-2.5 pt-1 border-t border-slate-200/60">
                {(
                  [
                    'leo_need',
                    'more_more_jump',
                    'vivid_bad_squad',
                    'wonderlands_showtime',
                    'nightcord_at_25',
                    'virtual_singer',
                  ] as UnitType[]
                ).map((uKey) => {
                  const uMeta = UNIT_METAS[uKey];
                  const unitChars =
                    uKey === 'virtual_singer'
                      ? CHARACTERS.filter((c) => GAME_VIRTUAL_SINGER_IDS.includes(c.id as any))
                      : CHARACTERS.filter((c) => c.unit === uKey);

                  return (
                    <div key={uKey} className="space-y-1">
                      <div className="flex items-center justify-between px-1">
                        <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-600">
                          {uMeta.iconUrl && (
                            <img src={uMeta.iconUrl} alt={uMeta.name} className="w-3.5 h-3.5 object-contain" />
                          )}
                          <span>{uMeta.name}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleSelectUnitChars(uKey)}
                          className="text-[10px] text-slate-500 hover:text-slate-800 font-medium cursor-pointer"
                        >
                          ユニット全選択
                        </button>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                        {unitChars.map((char) => {
                          const isSelected = selectedCharIds.includes(char.id);
                          return (
                            <button
                              key={char.id}
                              type="button"
                              onClick={() => {
                                if (isSelected) {
                                  if (selectedCharIds.length > 1) {
                                    setSelectedCharIds(selectedCharIds.filter((id) => id !== char.id));
                                  }
                                } else {
                                  setSelectedCharIds([...selectedCharIds, char.id]);
                                }
                              }}
                              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs text-left transition-all cursor-pointer ${
                                isSelected
                                  ? 'bg-slate-800 text-white font-bold border-slate-800 shadow-2xs'
                                  : 'bg-white text-slate-600 border-slate-200/80 hover:bg-slate-100'
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
        )}

        {/* カスタム比較タブ時の条件作成・追加パネル（複数条件・AND/OR対応） */}
        {activeTab === 'custom' && (
          <div className="p-4 sm:p-5 bg-gradient-to-r from-emerald-50/70 via-teal-50/40 to-sky-50/70 rounded-3xl border border-[#33ccbb]/30 space-y-3.5 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#33ccbb]" />
                <h3 className="font-bold text-xs sm:text-sm text-slate-800">
                  カスタム比較条件を作成
                </h3>
              </div>

              {/* AND / OR 条件の切り替えトグル */}
              <div className="flex items-center self-start sm:self-auto bg-white/90 p-0.5 rounded-xl border border-slate-200/90 text-[11px] font-bold shadow-2xs">
                <button
                  type="button"
                  onClick={() => setNewMatchType('and')}
                  className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                    newMatchType === 'and'
                      ? 'bg-[#33ccbb] text-white shadow-2xs'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                  title="指定したすべての条件を満たす楽曲を対象にします"
                >
                  AND (すべて一致)
                </button>
                <button
                  type="button"
                  onClick={() => setNewMatchType('or')}
                  className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                    newMatchType === 'or'
                      ? 'bg-sky-500 text-white shadow-2xs'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                  title="指定したいずれかの条件を満たす楽曲を対象にします"
                >
                  OR (いずれか一致)
                </button>
              </div>
            </div>

            <form onSubmit={handleAddCustomCondition} className="space-y-3">
              {/* 条件タイトル入力 */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  条件のタイトル（空欄の場合は選択条件から自動命名）
                </label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="例: ワンダショ×イベント書き下ろし、ニーゴまたは奏歌唱曲等"
                  className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-xl focus:border-[#33ccbb] focus:ring-2 focus:ring-[#33ccbb]/20 focus:outline-hidden"
                />
              </div>

              {/* 1. 対象ユニット（複数選択チップ） */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold text-slate-600">
                    対象ユニット ({newSelectedUnits.length > 0 ? `${newSelectedUnits.length}件選択中` : '全ユニット'}):
                  </span>
                  {newSelectedUnits.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setNewSelectedUnits([])}
                      className="text-slate-400 hover:underline text-[10px]"
                    >
                      クリア
                    </button>
                  )}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {(Object.keys(UNIT_METAS) as UnitType[]).map((uKey) => {
                    const uMeta = UNIT_METAS[uKey];
                    const isSelected = newSelectedUnits.includes(uKey);
                    return (
                      <button
                        key={uKey}
                        type="button"
                        onClick={() => {
                          setNewSelectedUnits((prev) =>
                            isSelected ? prev.filter((u) => u !== uKey) : [...prev, uKey]
                          );
                        }}
                        className={`px-2.5 py-1 rounded-xl border text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                          isSelected
                            ? 'bg-slate-800 text-white border-slate-800 shadow-2xs'
                            : 'bg-white text-slate-600 border-slate-200/90 hover:bg-slate-50'
                        }`}
                      >
                        {uMeta.iconUrl && (
                          <img src={uMeta.iconUrl} alt={uMeta.name} className="w-3.5 h-3.5 object-contain" />
                        )}
                        <span>{uMeta.shortName}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. 楽曲分類（複数選択チップ） */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold text-slate-600">
                    楽曲分類 ({newSelectedOriginalTypes.length > 0 ? `${newSelectedOriginalTypes.length}件選択中` : '全楽曲'}):
                  </span>
                  {newSelectedOriginalTypes.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setNewSelectedOriginalTypes([])}
                      className="text-slate-400 hover:underline text-[10px]"
                    >
                      クリア
                    </button>
                  )}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {(Object.keys(ORIGINAL_TYPE_METAS) as OriginalSongType[]).map((tKey) => {
                    const tMeta = ORIGINAL_TYPE_METAS[tKey];
                    const isSelected = newSelectedOriginalTypes.includes(tKey);
                    return (
                      <button
                        key={tKey}
                        type="button"
                        onClick={() => {
                          setNewSelectedOriginalTypes((prev) =>
                            isSelected ? prev.filter((t) => t !== tKey) : [...prev, tKey]
                          );
                        }}
                        className={`px-2.5 py-1 rounded-xl border text-[11px] font-bold transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[#33ccbb] text-white border-[#33ccbb] shadow-2xs'
                            : 'bg-white text-slate-600 border-slate-200/90 hover:bg-slate-50'
                        }`}
                      >
                        {tMeta.shortLabel}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 3. 歌唱バージョン（複数選択チップ） */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold text-slate-600">
                    歌唱バージョン ({newSelectedVocalTypes.length > 0 ? `${newSelectedVocalTypes.length}件選択中` : '指定なし'}):
                  </span>
                  {newSelectedVocalTypes.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setNewSelectedVocalTypes([])}
                      className="text-slate-400 hover:underline text-[10px]"
                    >
                      クリア
                    </button>
                  )}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { id: 'sekai', label: 'セカイver あり' },
                    { id: 'virtualSinger', label: 'バチャシンver あり' },
                    { id: 'anotherVocal', label: 'アナザーボーカル あり' },
                  ].map((v) => {
                    const isSelected = newSelectedVocalTypes.includes(v.id as any);
                    return (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => {
                          setNewSelectedVocalTypes((prev) =>
                            isSelected ? prev.filter((id) => id !== v.id) : [...prev, v.id as any]
                          );
                        }}
                        className={`px-2.5 py-1 rounded-xl border text-[11px] font-bold transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                            : 'bg-white text-slate-600 border-slate-200/90 hover:bg-slate-50'
                        }`}
                      >
                        {v.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 4. 歌唱キャラクター（複数選択チップ） */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold text-slate-600">
                    歌唱キャラクター ({newSelectedChars.length > 0 ? `${newSelectedChars.length}人選択中` : '指定なし'}):
                  </span>
                  {newSelectedChars.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setNewSelectedChars([])}
                      className="text-slate-400 hover:underline text-[10px]"
                    >
                      クリア
                    </button>
                  )}
                </div>
                <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto p-1.5 bg-white/70 rounded-xl border border-slate-200/70">
                  {CHARACTERS.map((c) => {
                    const isSelected = newSelectedChars.includes(c.id);
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => {
                          setNewSelectedChars((prev) =>
                            isSelected ? prev.filter((id) => id !== c.id) : [...prev, c.id]
                          );
                        }}
                        className={`px-2 py-0.5 rounded-lg border text-[10px] font-medium transition-all cursor-pointer flex items-center gap-1 ${
                          isSelected
                            ? 'bg-slate-800 text-white border-slate-800 shadow-2xs'
                            : 'bg-white text-slate-600 border-slate-200/80 hover:bg-slate-100'
                        }`}
                      >
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: c.color }} />
                        <span>{c.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 追加ボタン */}
              <div className="flex items-center justify-between pt-1">
                <div className="text-[10px] text-slate-500">
                  {newMatchType === 'and' ? (
                    <span className="text-[#0d9488] font-bold">※すべての条件を満たす楽曲を対象 (AND)</span>
                  ) : (
                    <span className="text-sky-600 font-bold">※いずれかの条件を満たす楽曲を対象 (OR)</span>
                  )}
                </div>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#33ccbb] hover:bg-[#2cb3a5] text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
                >
                  <Plus className="w-4 h-4" />
                  <span>比較条件を追加</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* 比較バー一覧 */}
        <div className="space-y-3">
          {sortedList.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              比較条件に該当する項目がありません。
            </div>
          ) : (
            sortedList.map((item) => (
              <div
                key={item.key}
                onClick={() => onNavigateToList(item.filterParams as any)}
                className={`group p-4 rounded-2xl border transition-all cursor-pointer ${
                  item.isComplete
                    ? 'bg-emerald-50/50 border-emerald-300 hover:border-emerald-400 shadow-2xs'
                    : 'bg-white/80 border-slate-200/80 hover:border-[#33ccbb]/60 hover:shadow-xs'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      {'iconUrl' in item && item.iconUrl ? (
                        <img
                          src={item.iconUrl as string}
                          alt={item.name}
                          className="w-4 h-4 object-contain shrink-0 drop-shadow-2xs"
                        />
                      ) : (
                        <div
                          className="w-3.5 h-3.5 rounded-full border border-slate-300/80 shadow-2xs shrink-0"
                          style={{ backgroundColor: item.themeColor }}
                        />
                      )}
                      <span className="font-bold text-xs sm:text-sm text-slate-800 group-hover:text-[#0d9488] transition-colors flex items-center gap-1">
                        <span>{item.name}</span>
                        <ExternalLink className="w-3 h-3 text-slate-300 group-hover:text-[#33ccbb] transition-colors inline" />
                      </span>

                      {item.isComplete && (
                        <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500 text-white font-bold text-[10px] shadow-2xs">
                          <Award className="w-3 h-3" />
                          COMPLETE
                        </span>
                      )}
                    </div>

                    {/* カスタム条件の条件詳細バッジ */}
                    {'cond' in item && (item as any).cond && (
                      <div className="flex flex-wrap items-center gap-1 pl-5 text-[10px]">
                        <span
                          className={`px-1.5 py-0.2 rounded font-bold ${
                            (item as any).cond.matchType === 'or'
                              ? 'bg-sky-100 text-sky-700'
                              : 'bg-emerald-100 text-emerald-700'
                          }`}
                        >
                          {(item as any).cond.matchType === 'or' ? 'OR条件' : 'AND条件'}
                        </span>
                        {(item as any).cond.conditionUnits?.map((u: UnitType) => (
                          <span key={u} className="px-1.5 py-0.2 rounded bg-slate-100 text-slate-600">
                            {UNIT_METAS[u]?.shortName || u}
                          </span>
                        ))}
                        {(item as any).cond.conditionOriginalTypes?.map((t: OriginalSongType) => (
                          <span
                            key={t}
                            className="px-1.5 py-0.2 rounded bg-teal-50 text-teal-700 border border-teal-200"
                          >
                            {ORIGINAL_TYPE_METAS[t]?.shortLabel || t}
                          </span>
                        ))}
                        {(item as any).cond.conditionCharacters?.map((cId: string) => {
                          const c = CHARACTERS.find((ch) => ch.id === cId);
                          return (
                            <span key={cId} className="px-1.5 py-0.2 rounded bg-purple-50 text-purple-700">
                              {c?.name || cId}
                            </span>
                          );
                        })}
                        {(item as any).cond.conditionVocalTypes?.map((vt: string) => (
                          <span key={vt} className="px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-700">
                            {vt === 'sekai' ? 'セカイver' : vt === 'virtualSinger' ? 'バチャシンver' : 'アナザー'}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex items-baseline gap-1.5 font-bold">
                      <span className="text-base sm:text-lg text-slate-800">
                        {item.percentage.toFixed(1)}%
                      </span>
                      <span className="text-xs text-slate-500 font-medium">
                        ({item.owned} / {item.total}曲)
                      </span>
                    </div>

                    {Boolean((item as any).isCustom) && (
                      <button
                        type="button"
                        onClick={(e) => handleDeleteCustomCondition(item.key, item.name, e)}
                        className="p-1.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title="この比較条件を削除"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* プログレスバー */}
                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200/50">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${item.percentage}%`,
                      backgroundColor:
                        item.themeColor === '#FFFFFF' ? '#94a3b8' : item.themeColor,
                    }}
                  />
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
