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
  Check,
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
import { filterAndSortRecords, getAnniversaryYear } from '../utils/recordUtils';

interface ComparisonViewProps {
  records: RecordItem[];
  ownedRecordIds: Record<string, boolean>;
  onNavigateToList: (filter: Partial<FilterOptions>) => void;
}

type CompareTab = 'unit' | 'vocal' | 'year' | 'character' | 'custom';
type SortMetric = 'default' | 'percentage_desc' | 'percentage_asc' | 'count_desc' | 'count_asc';

const CUSTOM_CONDITIONS_STORAGE_KEY = 'mysekai_custom_compare_conditions_v1';

/** プロセカ公式キャラクター順（全64キャラクター：バーチャル・シンガー最上部、メイン26人先頭） */
export const PROSEKA_DEFAULT_CHAR_ORDER: string[] = [
  // バーチャル・シンガー（登場済み6人）
  'miku',
  'rin',
  'len',
  'luka',
  'meiko',
  'kaito',
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
  // ゲーム未登場バーチャル・シンガー（30人）
  'gumi',
  'flower',
  'teto',
  'ia',
  'una',
  'kaf',
  'yuki',
  'gakupo',
  'yukari',
  'zundamon',
  'kiritan',
  'akane',
  'aoi',
  'chisei',
  'adachi_rei',
  'karin',
  'chifuyu',
  'rime',
  'sekai_cevio',
  'haru',
  'koko',
  'tsuina',
  'merrow',
  'gekiyaku',
  'kanon',
  'mikoto',
  'lily',
  'solaria',
  'vy1',
  'vy2',
  // コラボ・ゲストキャラクター（その他8人）
  'nenerobo',
  'mikudayo',
  'alkaloid',
  'crazy_b',
  'jun',
  'izumi',
  'chiaki',
  'natsume',
];

/** ゲーム内メイン26キャラクターのID一覧 */
export const PROSEKA_MAIN_26_CHAR_ORDER: string[] = PROSEKA_DEFAULT_CHAR_ORDER.slice(0, 26);

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
  const releaseYears = cond.conditionReleaseYears || [];

  const hasSpecificConditions =
    units.length > 0 ||
    characters.length > 0 ||
    originalTypes.length > 0 ||
    vocalTypes.length > 0 ||
    releaseYears.length > 0;

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
      if (vt === 'connectLive') return Boolean(record.vocalVersions?.connectLive);
      if (vt === 'anotherVocal') return Boolean(record.vocalVersions?.anotherVocal);
      return false;
    });
    results.push(hasAnyTrack);
  }

  if (releaseYears.length > 0) {
    const year = getAnniversaryYear(record.releaseDate);
    results.push(releaseYears.includes(year));
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

  // 歌唱キャラ別タブ用: 選択されたキャラクターID（初期値: メイン26人選択）
  const [selectedCharIds, setSelectedCharIds] = useState<string[]>(() => [
    ...PROSEKA_MAIN_26_CHAR_ORDER,
  ]);

  // 歌唱キャラ別タブ用: キャラクター選択パネルの開閉状態
  const [isCharSelectorOpen, setIsCharSelectorOpen] = useState(true);

  // 歌唱キャラ別タブ用: ゲーム未登場シンガーの開閉状態
  const [showNonGameSingersInCompare, setShowNonGameSingersInCompare] = useState(false);

  // カスタム比較用: ゲーム未登場シンガーの開閉状態
  const [showNonGameSingersInCustom, setShowNonGameSingersInCustom] = useState(false);

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
    ('sekai' | 'virtualSinger' | 'anotherVocal' | 'connectLive')[]
  >([]);
  const [newSelectedReleaseYears, setNewSelectedReleaseYears] = useState<number[]>([]);

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
        filterParams: { releaseYears: [annivYear] },
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
    if (sortMetric === 'count_asc') {
      return list.sort((a, b) => a.total - b.total || a.percentage - b.percentage);
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
            .map((vt) =>
              vt === 'sekai'
                ? 'セカイ'
                : vt === 'virtualSinger'
                ? 'バチャシン'
                : vt === 'connectLive'
                ? 'コネライ'
                : 'アナザー'
            )
            .join('/')
        );
      }
      if (newSelectedReleaseYears.length > 0) {
        parts.push(newSelectedReleaseYears.map((y) => `${y}年目`).join('/'));
      }
      if (parts.length === 0) {
        alert('少なくとも1つの条件（ユニット、楽曲分類、キャラ、歌唱ver、実装年）を選択してください');
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
        connectLive: newSelectedVocalTypes.includes('connectLive'),
        anotherVocal: newSelectedVocalTypes.includes('anotherVocal'),
      },
      searchQuery: '',
      originalTypes: newSelectedOriginalTypes.length > 0 ? newSelectedOriginalTypes : undefined,
      releaseYears: newSelectedReleaseYears.length > 0 ? newSelectedReleaseYears : undefined,
      matchType: newMatchType,
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
      conditionReleaseYears: newSelectedReleaseYears,
    };

    setSavedConditions((prev) => [newCond, ...prev]);
    setNewTitle('');
    setNewSelectedReleaseYears([]);
    alert(`比較条件「${title}」を追加しました！`);
  };

  // カスタム条件の削除
  const handleDeleteCustomCondition = (id: string, title: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`比較条件「${title}」を削除しますか？`)) {
      setSavedConditions((prev) => prev.filter((c) => c.id !== id));
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
            各条件の所持率を棒グラフで比較できます。バーをクリックすると、その条件の楽曲リストが表示されます。
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
            <option value="percentage_desc">所持率が高い順</option>
            <option value="percentage_asc">所持率が低い順</option>
            <option value="count_desc">楽曲数が多い順</option>
            <option value="count_asc">楽曲数が少ない順</option>
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
                  onClick={() => setSelectedCharIds([...PROSEKA_MAIN_26_CHAR_ORDER])}
                  className="text-[#0d9488] font-bold hover:underline cursor-pointer"
                >
                  メイン26人
                </button>
                <span className="text-slate-300">|</span>
                <button
                  type="button"
                  onClick={() => setSelectedCharIds([])}
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
                    'virtual_singer',
                    'leo_need',
                    'more_more_jump',
                    'vivid_bad_squad',
                    'wonderlands_showtime',
                    'nightcord_at_25',
                    'other',
                  ] as UnitType[]
                ).map((uKey) => {
                  const uMeta = UNIT_METAS[uKey];
                  const unitChars = CHARACTERS.filter((c) => c.unit === uKey);
                  if (unitChars.length === 0) return null;

                  const displayName =
                    uKey === 'other' ? 'その他（コラボ・ゲスト）' : uMeta.name;

                  // 単一キャラクターボタン描画ヘルパー
                  const renderCharButton = (char: (typeof CHARACTERS)[number]) => {
                    const isSelected = selectedCharIds.includes(char.id);
                    return (
                      <button
                        key={char.id}
                        type="button"
                        onClick={() => {
                          if (isSelected) {
                            setSelectedCharIds(selectedCharIds.filter((id) => id !== char.id));
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
                  };

                  // バーチャル・シンガーの場合：ゲーム内登場（6人）とゲーム未登場（30人）を分離
                  if (uKey === 'virtual_singer') {
                    const mainChars = unitChars.filter((c) =>
                      GAME_VIRTUAL_SINGER_IDS.includes(c.id as any)
                    );
                    const extraChars = unitChars.filter(
                      (c) => !GAME_VIRTUAL_SINGER_IDS.includes(c.id as any)
                    );
                    const selectedExtraCount = extraChars.filter((c) =>
                      selectedCharIds.includes(c.id)
                    ).length;

                    return (
                      <div key={uKey} className="space-y-1.5">
                        <div className="flex items-center justify-between px-1">
                          <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-600">
                            {uMeta.iconUrl && (
                              <img src={uMeta.iconUrl} alt={uMeta.name} className="w-3.5 h-3.5 object-contain" />
                            )}
                            <span>{displayName}</span>
                          </div>
                          <div className="flex gap-1.5 text-[10px]">
                            <button
                              type="button"
                              onClick={() => {
                                const mainIds = mainChars.map((c) => c.id);
                                setSelectedCharIds((prev) =>
                                  Array.from(new Set([...prev, ...mainIds]))
                                );
                              }}
                              className="text-[#0d9488] font-semibold hover:underline cursor-pointer"
                            >
                              全選択
                            </button>
                            <span className="text-slate-300">|</span>
                            <button
                              type="button"
                              onClick={() => {
                                const mainIds = mainChars.map((c) => c.id);
                                setSelectedCharIds((prev) =>
                                  prev.filter((id) => !mainIds.includes(id))
                                );
                              }}
                              className="text-slate-400 hover:underline cursor-pointer"
                            >
                              クリア
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                          {mainChars.map(renderCharButton)}
                        </div>

                        {/* ゲーム未登場シンガー（折りたたみ表示） */}
                        {extraChars.length > 0 && (
                          <div className="pt-1 space-y-1">
                            <div className="flex items-center justify-between px-1">
                              <span className="text-[11px] font-bold text-slate-600">
                                ゲーム未登場シンガー ({extraChars.length}人)
                              </span>
                              <div className="flex gap-1.5 text-[10px]">
                                <button
                                  type="button"
                                  onClick={() => {
                                    const extraIds = extraChars.map((c) => c.id);
                                    setSelectedCharIds((prev) =>
                                      Array.from(new Set([...prev, ...extraIds]))
                                    );
                                  }}
                                  className="text-[#0d9488] font-semibold hover:underline cursor-pointer"
                                >
                                  全選択
                                </button>
                                <span className="text-slate-300">|</span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const extraIds = extraChars.map((c) => c.id);
                                    setSelectedCharIds((prev) =>
                                      prev.filter((id) => !extraIds.includes(id))
                                    );
                                  }}
                                  className="text-slate-400 hover:underline cursor-pointer"
                                >
                                  クリア
                                </button>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => setShowNonGameSingersInCompare(!showNonGameSingersInCompare)}
                              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-left text-xs font-bold transition-all border cursor-pointer ${
                                showNonGameSingersInCompare
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
                                <span>{showNonGameSingersInCompare ? '閉じる' : '表示する'}</span>
                                {showNonGameSingersInCompare ? (
                                  <ChevronUp className="w-3.5 h-3.5 text-slate-500" />
                                ) : (
                                  <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                                )}
                              </span>
                            </button>

                            {showNonGameSingersInCompare && (
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 mt-1.5 pt-1.5 pl-2 border-l-2 border-slate-200 animate-in fade-in duration-150">
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
                    <div key={uKey} className="space-y-1">
                      <div className="flex items-center justify-between px-1">
                        <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-600">
                          {uMeta.iconUrl && (
                            <img src={uMeta.iconUrl} alt={uMeta.name} className="w-3.5 h-3.5 object-contain" />
                          )}
                          <span>{displayName}</span>
                        </div>
                        <div className="flex gap-1.5 text-[10px]">
                          <button
                            type="button"
                            onClick={() => {
                              const ids = unitChars.map((c) => c.id);
                              setSelectedCharIds((prev) =>
                                Array.from(new Set([...prev, ...ids]))
                              );
                            }}
                            className="text-[#0d9488] font-semibold hover:underline cursor-pointer"
                          >
                            全選択
                          </button>
                          <span className="text-slate-300">|</span>
                          <button
                            type="button"
                            onClick={() => {
                              const ids = unitChars.map((c) => c.id);
                              setSelectedCharIds((prev) =>
                                prev.filter((id) => !ids.includes(id))
                              );
                            }}
                            className="text-slate-400 hover:underline cursor-pointer"
                          >
                            クリア
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                        {unitChars.map(renderCharButton)}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* カスタム比較タブ時の条件作成・追加パネル（リスト表示の絞り込みUIと統一） */}
        {activeTab === 'custom' && (
          <div className="p-4 sm:p-5 bg-slate-50/80 rounded-3xl border border-slate-200/90 space-y-4 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2 border-b border-slate-200/80">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#33ccbb]" />
                <h3 className="font-bold text-xs sm:text-sm text-slate-800">
                  カスタム比較条件を作成
                </h3>
              </div>

              {/* AND / OR 条件の切り替えトグル */}
              <div className="flex items-center self-start sm:self-auto bg-white p-0.5 rounded-xl border border-slate-200/90 text-xs font-bold shadow-2xs">
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

            <form onSubmit={handleAddCustomCondition} className="space-y-4">
              {/* 条件タイトル入力 */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  条件のタイトル（空欄の場合は選択条件から自動命名）
                </label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="例: GUMI歌唱曲、進級前実装曲等"
                  className="w-full text-xs sm:text-sm p-2.5 bg-white border border-slate-200 rounded-xl focus:border-[#33ccbb] focus:ring-2 focus:ring-[#33ccbb]/20 focus:outline-hidden"
                />
              </div>

              {/* 1. ユニットでの絞り込み（リスト絞り込みUIと統一） */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold">
                  <div className="flex items-center gap-1.5 text-slate-700">
                    <span>対象ユニット</span>
                    {newSelectedUnits.length > 0 && (
                      <span className="text-[11px] bg-[#33ccbb]/15 text-[#0d9488] px-2 py-0.5 rounded-full font-bold">
                        {newSelectedUnits.length}組選択中
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => setNewSelectedUnits(Object.keys(UNIT_METAS) as UnitType[])}
                      className="text-[#0d9488] font-semibold hover:underline cursor-pointer"
                    >
                      全選択
                    </button>
                    <span className="text-slate-300">|</span>
                    <button
                      type="button"
                      onClick={() => setNewSelectedUnits([])}
                      className="text-slate-400 hover:underline cursor-pointer"
                    >
                      クリア
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {(Object.keys(UNIT_METAS) as UnitType[]).map((unitKey) => {
                    const meta = UNIT_METAS[unitKey];
                    const isSelected = newSelectedUnits.includes(unitKey);
                    return (
                      <button
                        key={unitKey}
                        type="button"
                        onClick={() => {
                          setNewSelectedUnits((prev) =>
                            isSelected ? prev.filter((u) => u !== unitKey) : [...prev, unitKey]
                          );
                        }}
                        className={`flex items-center gap-2 px-2.5 py-2 rounded-xl border text-left min-h-[42px] transition-all cursor-pointer ${
                          isSelected
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

              {/* 2. 歌唱キャラクターでの絞り込み（リスト絞り込みUIと統一） */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold">
                  <div className="flex items-center gap-1.5 text-slate-700">
                    <Users className="w-4 h-4 text-[#33ccbb]" />
                    <span>歌唱キャラクター</span>
                    {newSelectedChars.length > 0 && (
                      <span className="text-[11px] bg-[#33ccbb]/15 text-[#0d9488] px-2 py-0.5 rounded-full font-bold">
                        {newSelectedChars.length}人選択中
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => setNewSelectedChars(CHARACTERS.map((c) => c.id))}
                      className="text-[#0d9488] font-semibold hover:underline cursor-pointer"
                    >
                      全選択
                    </button>
                    <span className="text-slate-300">|</span>
                    <button
                      type="button"
                      onClick={() => setNewSelectedChars([])}
                      className="text-slate-400 hover:underline cursor-pointer"
                    >
                      クリア
                    </button>
                  </div>
                </div>

                <div className="max-h-60 sm:max-h-72 overflow-y-auto p-2 space-y-3 bg-white/70 rounded-2xl border border-slate-200/80">
                  {(
                    [
                      'virtual_singer',
                      'leo_need',
                      'more_more_jump',
                      'vivid_bad_squad',
                      'wonderlands_showtime',
                      'nightcord_at_25',
                      'other',
                    ] as UnitType[]
                  ).map((unitKey) => {
                    const unitMeta = UNIT_METAS[unitKey];
                    const unitChars = CHARACTERS.filter((c) => c.unit === unitKey);
                    if (unitChars.length === 0) return null;

                    const displayName =
                      unitKey === 'other' ? 'その他（コラボ・ゲスト）' : unitMeta.name;

                    const renderCharButton = (char: (typeof CHARACTERS)[number]) => {
                      const isSelected = newSelectedChars.includes(char.id);
                      return (
                        <button
                          key={char.id}
                          type="button"
                          onClick={() => {
                            setNewSelectedChars((prev) =>
                              isSelected ? prev.filter((id) => id !== char.id) : [...prev, char.id]
                            );
                          }}
                          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs text-left transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-white border-[#33ccbb] text-[#0d9488] font-bold shadow-2xs'
                              : 'bg-white/80 border-slate-200/70 text-slate-600 hover:bg-white'
                          }`}
                        >
                          <div
                            className="w-2.5 h-2.5 rounded-full shrink-0 border border-slate-300/80 shadow-2xs"
                            style={{ backgroundColor: char.color }}
                          />
                          <span className="truncate flex-1">{char.name}</span>
                          {isSelected && <Check className="w-3 h-3 text-[#0d9488] shrink-0" />}
                        </button>
                      );
                    };

                    if (unitKey === 'virtual_singer') {
                      const mainChars = unitChars.filter((c) =>
                        GAME_VIRTUAL_SINGER_IDS.includes(c.id as any)
                      );
                      const extraChars = unitChars.filter(
                        (c) => !GAME_VIRTUAL_SINGER_IDS.includes(c.id as any)
                      );
                      const selectedExtraCount = extraChars.filter((c) =>
                        newSelectedChars.includes(c.id)
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
                            <div className="flex gap-1.5 text-[10px]">
                              <button
                                type="button"
                                onClick={() => {
                                  const mainIds = mainChars.map((c) => c.id);
                                  setNewSelectedChars((prev) =>
                                    Array.from(new Set([...prev, ...mainIds]))
                                  );
                                }}
                                className="text-[#0d9488] font-semibold hover:underline cursor-pointer"
                              >
                                全選択
                              </button>
                              <span className="text-slate-300">|</span>
                              <button
                                type="button"
                                onClick={() => {
                                  const mainIds = mainChars.map((c) => c.id);
                                  setNewSelectedChars((prev) =>
                                    prev.filter((id) => !mainIds.includes(id))
                                  );
                                }}
                                className="text-slate-400 hover:underline cursor-pointer"
                              >
                                クリア
                              </button>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-1.5">
                            {mainChars.map(renderCharButton)}
                          </div>

                          {extraChars.length > 0 && (
                            <div className="pt-1 space-y-1">
                              <div className="flex items-center justify-between px-1">
                                <span className="text-[11px] font-bold text-slate-600">
                                  ゲーム未登場シンガー ({extraChars.length}人)
                                </span>
                                <div className="flex gap-1.5 text-[10px]">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const extraIds = extraChars.map((c) => c.id);
                                      setNewSelectedChars((prev) =>
                                        Array.from(new Set([...prev, ...extraIds]))
                                      );
                                    }}
                                    className="text-[#0d9488] font-semibold hover:underline cursor-pointer"
                                  >
                                    全選択
                                  </button>
                                  <span className="text-slate-300">|</span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const extraIds = extraChars.map((c) => c.id);
                                      setNewSelectedChars((prev) =>
                                        prev.filter((id) => !extraIds.includes(id))
                                      );
                                    }}
                                    className="text-slate-400 hover:underline cursor-pointer"
                                  >
                                    クリア
                                  </button>
                                </div>
                              </div>

                              <button
                                type="button"
                                onClick={() => setShowNonGameSingersInCustom(!showNonGameSingersInCustom)}
                                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-left text-xs font-bold transition-all border cursor-pointer ${
                                  showNonGameSingersInCustom
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
                                  <span>{showNonGameSingersInCustom ? '閉じる' : '表示する'}</span>
                                  {showNonGameSingersInCustom ? (
                                    <ChevronUp className="w-3.5 h-3.5 text-slate-500" />
                                  ) : (
                                    <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                                  )}
                                </span>
                              </button>

                              {showNonGameSingersInCustom && (
                                <div className="grid grid-cols-2 gap-1.5 mt-1.5 pt-1.5 pl-2 border-l-2 border-slate-200 animate-in fade-in duration-150">
                                  {extraChars.map(renderCharButton)}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    }

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
                          <div className="flex gap-1.5 text-[10px]">
                            <button
                              type="button"
                              onClick={() => {
                                const ids = unitChars.map((c) => c.id);
                                setNewSelectedChars((prev) =>
                                  Array.from(new Set([...prev, ...ids]))
                                );
                              }}
                              className="text-[#0d9488] font-semibold hover:underline cursor-pointer"
                            >
                              全選択
                            </button>
                            <span className="text-slate-300">|</span>
                            <button
                              type="button"
                              onClick={() => {
                                const ids = unitChars.map((c) => c.id);
                                setNewSelectedChars((prev) =>
                                  prev.filter((id) => !ids.includes(id))
                                );
                              }}
                              className="text-slate-400 hover:underline cursor-pointer"
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

              {/* 3. 歌唱バージョンでの絞り込み（リスト絞り込みUIと統一） */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold">
                  <div className="flex items-center gap-1.5 text-slate-700">
                    <span>歌唱バージョン条件</span>
                    {newSelectedVocalTypes.length > 0 && (
                      <span className="text-[11px] bg-[#33ccbb]/15 text-[#0d9488] px-2 py-0.5 rounded-full font-bold">
                        {newSelectedVocalTypes.length}件選択中
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() =>
                        setNewSelectedVocalTypes(['sekai', 'virtualSinger', 'connectLive', 'anotherVocal'])
                      }
                      className="text-[#0d9488] font-semibold hover:underline cursor-pointer"
                    >
                      全選択
                    </button>
                    <span className="text-slate-300">|</span>
                    <button
                      type="button"
                      onClick={() => setNewSelectedVocalTypes([])}
                      className="text-slate-400 hover:underline cursor-pointer"
                    >
                      クリア
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  {[
                    { id: 'sekai', label: 'セカイver あり' },
                    { id: 'virtualSinger', label: 'バーチャル・シンガーver あり' },
                    { id: 'connectLive', label: 'コネクトライブver あり' },
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
                        className={`px-3 py-2 rounded-xl border text-left font-medium transition-all cursor-pointer ${
                          isSelected
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

              {/* 4. 楽曲分類での絞り込み（書き下ろし楽曲のみ・カバー除外） */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold">
                  <div className="flex items-center gap-1.5 text-slate-700">
                    <span>楽曲分類（書き下ろし楽曲）</span>
                    {newSelectedOriginalTypes.length > 0 && (
                      <span className="text-[11px] bg-[#33ccbb]/15 text-[#0d9488] px-2 py-0.5 rounded-full font-bold">
                        {newSelectedOriginalTypes.length}種選択中
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() =>
                        setNewSelectedOriginalTypes(
                          (Object.keys(ORIGINAL_TYPE_METAS) as OriginalSongType[]).filter(
                            (t) => t !== 'cover'
                          )
                        )
                      }
                      className="text-[#0d9488] font-semibold hover:underline cursor-pointer"
                    >
                      全選択
                    </button>
                    <span className="text-slate-300">|</span>
                    <button
                      type="button"
                      onClick={() => setNewSelectedOriginalTypes([])}
                      className="text-slate-400 hover:underline cursor-pointer"
                    >
                      クリア
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  {(Object.keys(ORIGINAL_TYPE_METAS) as OriginalSongType[])
                    .filter((typeKey) => typeKey !== 'cover')
                    .map((typeKey) => {
                      const meta = ORIGINAL_TYPE_METAS[typeKey];
                      const isSelected = newSelectedOriginalTypes.includes(typeKey);
                      return (
                        <button
                          key={typeKey}
                          type="button"
                          onClick={() => {
                            setNewSelectedOriginalTypes((prev) =>
                              isSelected ? prev.filter((t) => t !== typeKey) : [...prev, typeKey]
                            );
                          }}
                          className={`px-3 py-2 rounded-xl border text-left font-medium transition-all cursor-pointer ${
                            isSelected
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

              {/* 5. 実装年での絞り込み */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold">
                  <div className="flex items-center gap-1.5 text-slate-700">
                    <span>実装年</span>
                    {newSelectedReleaseYears.length > 0 && (
                      <span className="text-[11px] bg-[#33ccbb]/15 text-[#0d9488] px-2 py-0.5 rounded-full font-bold">
                        {newSelectedReleaseYears.length}件選択中
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => setNewSelectedReleaseYears([1, 2, 3, 4, 5, 6, 7])}
                      className="text-[#0d9488] font-semibold hover:underline cursor-pointer"
                    >
                      全選択
                    </button>
                    <span className="text-slate-300">|</span>
                    <button
                      type="button"
                      onClick={() => setNewSelectedReleaseYears([])}
                      className="text-slate-400 hover:underline cursor-pointer"
                    >
                      クリア
                    </button>
                  </div>
                </div>

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
                    const isSelected = newSelectedReleaseYears.includes(item.year);
                    return (
                      <button
                        key={item.year}
                        type="button"
                        onClick={() => {
                          setNewSelectedReleaseYears((prev) =>
                            isSelected ? prev.filter((y) => y !== item.year) : [...prev, item.year]
                          );
                        }}
                        className={`px-3 py-2 rounded-xl border text-left font-medium transition-all cursor-pointer ${
                          isSelected
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

              {/* 追加ボタン & マッチタイプ補足説明 */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-200/80">
                <div className="text-[11px] text-slate-500">
                  {newMatchType === 'and' ? (
                    <span className="text-[#0d9488] font-bold">
                      ※指定したすべての条件を満たす楽曲を対象にします (AND)
                    </span>
                  ) : (
                    <span className="text-sky-600 font-bold">
                      ※指定したいずれかの条件を満たす楽曲を対象にします (OR)
                    </span>
                  )}
                </div>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#33ccbb] hover:bg-[#2cb3a5] text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95"
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
              {activeTab === 'character'
                ? 'キャラクターが選択されていません。上の「比較キャラクター選択」から選択してください。'
                : '比較条件に該当する項目がありません。'}
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
