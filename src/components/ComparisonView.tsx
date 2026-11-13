import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
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
  ChevronLeft,
  ChevronRight,
  Check,
  AlertCircle,
  CheckCircle2,
  X,
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
import { checkRecordMatchesCustomCondition } from '../utils/recordUtils';

interface ComparisonViewProps {
  records: RecordItem[];
  ownedRecordIds: Record<string, boolean>;
  onNavigateToList: (filter: Partial<FilterOptions>) => void;
}

type CompareTab = 'unit' | 'vocal' | 'year' | 'character' | 'custom';
type SortMetric =
  | 'default'
  | 'created_desc'
  | 'created_asc'
  | 'percentage_desc'
  | 'percentage_asc'
  | 'count_desc'
  | 'count_asc';

interface CompareStatItem {
  key: string;
  name: string;
  shortName?: string;
  themeColor: string;
  iconUrl?: string;
  total: number;
  owned: number;
  percentage: number;
  isComplete: boolean;
  defaultOrderIndex: number;
  filterParams: Partial<FilterOptions>;
  isCustom?: boolean;
  cond?: SavedCompareCondition;
  createdAt?: number;
}

const CUSTOM_CONDITIONS_STORAGE_KEY = 'mysekai_custom_compare_conditions_v1';

/** ゲーム内メイン26キャラクターのID一覧（バーチャル・シンガー6人先頭、各ユニット4人順） */
const PROSEKA_MAIN_26_CHAR_ORDER: string[] = [
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
];

export const ComparisonView: React.FC<ComparisonViewProps> = ({
  records,
  ownedRecordIds,
  onNavigateToList,
}) => {
  // 5大タブ（ユニット別 / 歌唱ver別 / 実装年別 / 歌唱キャラ別 / カスタム比較）
  const [activeTab, setActiveTab] = useState<CompareTab>('unit');

  // タブバーの横スクロール管理用
  const tabsRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // タブバーのスクロール可否判定
  const checkTabsScrollable = useCallback(() => {
    const el = tabsRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanScrollLeft(scrollLeft > 2);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 2);
  }, []);

  // スクロール・リサイズイベント監視
  useEffect(() => {
    const el = tabsRef.current;
    if (!el) return;

    checkTabsScrollable();

    const handleScroll = () => checkTabsScrollable();
    el.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll);

    // リサイズ監視（フォントロードや動的リサイズに対応）
    const resizeObserver = new ResizeObserver(() => checkTabsScrollable());
    resizeObserver.observe(el);

    return () => {
      el.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
      resizeObserver.disconnect();
    };
  }, [checkTabsScrollable]);

  // アクティブタブ切り替え時にスクロール位置を調整
  useEffect(() => {
    if (!tabsRef.current) return;
    const activeBtn = tabsRef.current.querySelector<HTMLElement>('[data-active="true"]');
    if (activeBtn) {
      activeBtn.scrollIntoView({ behavior: 'smooth', inline: 'nearest', block: 'nearest' });
    }
    checkTabsScrollable();
  }, [activeTab, checkTabsScrollable]);

  // ホイールスクロール対応（狭小幅時に縦ホイールで横スクロール）
  const handleTabsWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (e.deltaY !== 0 && tabsRef.current) {
      const { scrollWidth, clientWidth } = tabsRef.current;
      if (scrollWidth > clientWidth) {
        tabsRef.current.scrollLeft += e.deltaY;
      }
    }
  };

  // ソート基準（デフォルト順 / 所持率降順 / 所持率昇順 / 曲数降順）
  const [sortMetric, setSortMetric] = useState<SortMetric>('default');

  // カスタム比較用: ゲーム未登場シンガーの開閉状態
  const [showNonGameSingersInCustom, setShowNonGameSingersInCustom] = useState(false);

  // カスタム比較用: 条件作成パネルの開閉状態（デフォルトは折りたたみ）
  const [isCustomFormOpen, setIsCustomFormOpen] = useState(false);

  // カスタム比較フォーム用: 条件グループごとの簡易アコーディオン開閉状態
  const [customOpenSections, setCustomOpenSections] = useState<Record<string, boolean>>({
    units: true,
    originalTypes: false,
    vocalTypes: false,
    characters: false,
    bannerCharacters: false,
    releaseYears: false,
  });

  const toggleCustomSection = (key: string) => {
    setCustomOpenSections((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const setAllCustomSections = (open: boolean) => {
    setCustomOpenSections({
      units: open,
      originalTypes: open,
      vocalTypes: open,
      characters: open,
      bannerCharacters: open,
      releaseYears: open,
    });
  };

  // カスタム比較条件一覧（LocalStorage 永続化）
  const [savedConditions, setSavedConditions] = useState<SavedCompareCondition[]>(() => {
    try {
      const saved = localStorage.getItem(CUSTOM_CONDITIONS_STORAGE_KEY);
      if (saved) {
        const parsed: SavedCompareCondition[] = JSON.parse(saved);
        // 過去のデフォルトプリセット（cond_preset_1, cond_preset_2, cond_preset_3）を除外
        return parsed.filter(
          (c) => !['cond_preset_1', 'cond_preset_2', 'cond_preset_3'].includes(c.id)
        );
      }
    } catch {
      // ignore
    }
    return [];
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
    ('sekai' | 'virtualSinger' | 'anotherVocal' | 'connectLive' | 'inst')[]
  >([]);
  const [newSelectedBannerCharacters, setNewSelectedBannerCharacters] = useState<string[]>([]);
  const [newSelectedReleaseYears, setNewSelectedReleaseYears] = useState<number[]>([]);

  // カスタム比較パネル内メッセージ（エラー・成功通知）
  const [customMessage, setCustomMessage] = useState<{
    type: 'error' | 'success';
    text: string;
  } | null>(null);

  // パネル内メッセージの自動消去（4秒後）
  useEffect(() => {
    if (!customMessage) return;
    const timer = setTimeout(() => {
      setCustomMessage(null);
    }, 4000);
    return () => clearTimeout(timer);
  }, [customMessage]);

  // 1. ユニット別集計
  const unitStats = useMemo(() => {
    const list = (Object.keys(UNIT_METAS) as UnitType[]).map((unitKey, index) => {
      const meta = UNIT_METAS[unitKey];
      const unitRecords = records.filter((r) =>
        r.units && r.units.length > 0 ? r.units.includes(unitKey) : r.unit === unitKey
      );
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
      { key: 'sekai', label: 'セカイver', color: '#10b981', filter: { vocalVersions: { sekai: true, virtualSinger: false, connectLive: false, anotherVocal: false, inst: false } } },
      { key: 'virtualSinger', label: 'バーチャル・シンガーver', color: '#14b8a6', filter: { vocalVersions: { sekai: false, virtualSinger: true, connectLive: false, anotherVocal: false, inst: false } } },
      { key: 'anotherVocal', label: 'アナザーボーカルver', color: '#f59e0b', filter: { vocalVersions: { sekai: false, virtualSinger: false, connectLive: false, anotherVocal: true, inst: false } } },
      { key: 'connectLive', label: 'コネクトライブver', color: '#0ea5e9', filter: { vocalVersions: { sekai: false, virtualSinger: false, connectLive: true, anotherVocal: false, inst: false } } },
      { key: 'inst', label: 'Inst. ver.', color: '#64748b', filter: { vocalVersions: { sekai: false, virtualSinger: false, connectLive: false, anotherVocal: false, inst: true } } },
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

  // 4. 歌唱キャラ別集計（プロセカのメイン26人、キャラクター選択画面順）
  const characterStats = useMemo(() => {
    return PROSEKA_MAIN_26_CHAR_ORDER.map((charId, index) => {
      const char = CHARACTERS.find((c) => c.id === charId);
      const matched = records.filter((r) => r.characters.includes(charId));
      const total = matched.length;
      const owned = matched.filter((r) => ownedRecordIds[r.id]).length;
      const percentage = total > 0 ? (owned / total) * 100 : 0;

      const orderInGame = PROSEKA_MAIN_26_CHAR_ORDER.indexOf(charId);
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
  }, [records, ownedRecordIds]);

  // 5. カスタム比較集計（複数条件・AND/OR条件対応）
  const customStats = useMemo(() => {
    return savedConditions.map((cond, index) => {
      const matched = records.filter((r) => checkRecordMatchesCustomCondition(r, cond));
      const total = matched.length;
      const owned = matched.filter((r) => ownedRecordIds[r.id]).length;
      const percentage = total > 0 ? (owned / total) * 100 : 0;

      // 作成日時の取得（古い保存データの場合はIDのタイムスタンプまたは登録順インデックスから算出）
      let createdAt = cond.createdAt;
      if (!createdAt) {
        const match = cond.id.match(/^cond_(\d+)$/);
        createdAt = match ? parseInt(match[1], 10) : Date.now() - index * 1000;
      }

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
        createdAt,
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

  // タブに応じた実効ソート方式の算出（カスタム比較時はデフォルト順を廃止し、追加が新しい順・古い順に対応）
  const effectiveSortMetric = useMemo<SortMetric>(() => {
    if (activeTab === 'custom') {
      if (sortMetric === 'default') return 'created_desc';
      return sortMetric;
    } else {
      if (sortMetric === 'created_desc' || sortMetric === 'created_asc') return 'default';
      return sortMetric;
    }
  }, [activeTab, sortMetric]);

  // ソート適用（追加順 / デフォルト順 / 所持率高い順 / 所持率低い順 / 曲数多い順）
  const sortedList = useMemo(() => {
    const list = [...rawList] as CompareStatItem[];
    if (effectiveSortMetric === 'created_desc') {
      return list.sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));
    }
    if (effectiveSortMetric === 'created_asc') {
      return list.sort((a, b) => (a.createdAt ?? 0) - (b.createdAt ?? 0));
    }
    if (effectiveSortMetric === 'default') {
      return list.sort((a, b) => a.defaultOrderIndex - b.defaultOrderIndex);
    }
    if (effectiveSortMetric === 'percentage_desc') {
      return list.sort((a, b) => b.percentage - a.percentage || b.total - a.total);
    }
    if (effectiveSortMetric === 'percentage_asc') {
      return list.sort((a, b) => a.percentage - b.percentage || b.total - a.total);
    }
    if (effectiveSortMetric === 'count_desc') {
      return list.sort((a, b) => b.total - a.total || b.percentage - a.percentage);
    }
    if (effectiveSortMetric === 'count_asc') {
      return list.sort((a, b) => a.total - b.total || a.percentage - b.percentage);
    }
    return list;
  }, [rawList, effectiveSortMetric]);

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
                : vt === 'inst'
                ? 'Inst'
                : 'アナザー'
            )
            .join('/')
        );
      }
      if (newSelectedBannerCharacters.length > 0) {
        parts.push(
          newSelectedBannerCharacters
            .map((c) => CHARACTERS.find((ch) => ch.id === c)?.name || c)
            .map((n) => `バナー:${n}`)
            .join('/')
        );
      }
      if (newSelectedReleaseYears.length > 0) {
        parts.push(newSelectedReleaseYears.map((y) => `${y}年目`).join('/'));
      }
      if (parts.length === 0) {
        setCustomMessage({
          type: 'error',
          text: '少なくとも1つの条件（ユニット、楽曲分類、キャラ、歌唱ver、バナーキャラ、実装年）を選択してください',
        });
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
        inst: newSelectedVocalTypes.includes('inst'),
      },
      searchQuery: '',
      originalTypes: newSelectedOriginalTypes.length > 0 ? newSelectedOriginalTypes : undefined,
      bannerCharacters: newSelectedBannerCharacters.length > 0 ? newSelectedBannerCharacters : undefined,
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
      conditionBannerCharacters: newSelectedBannerCharacters,
      conditionReleaseYears: newSelectedReleaseYears,
    };

    setSavedConditions((prev) => [newCond, ...prev]);
    setNewTitle('');
    setNewSelectedUnits([]);
    setNewSelectedChars([]);
    setNewSelectedOriginalTypes([]);
    setNewSelectedVocalTypes([]);
    setNewSelectedBannerCharacters([]);
    setNewSelectedReleaseYears([]);
    setIsCustomFormOpen(false);
    setCustomMessage({
      type: 'success',
      text: `比較条件「${title}」を追加しました！`,
    });
  };

  // カスタム条件の削除
  const handleDeleteCustomCondition = (id: string, title: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`比較条件「${title}」を削除しますか？`)) {
      setSavedConditions((prev) => prev.filter((c) => c.id !== id));
      setCustomMessage({
        type: 'success',
        text: `比較条件「${title}」を削除しました`,
      });
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
          <p className="text-xs text-slate-500 flex flex-wrap items-center gap-1">
            <span>各条件の所持率を棒グラフで比較できます。各条件右側の</span>
            <span className="inline-flex items-center justify-center p-1 rounded-md border border-slate-200 bg-slate-50 text-slate-600 shadow-2xs">
              <ExternalLink className="w-3 h-3" />
            </span>
            <span>ボタンをクリックすると、その条件の楽曲リストが表示されます。</span>
          </p>
        </div>
      </div>

      {/* 固定表示されるタブ切り替え & 並び替えツールバー (スクロール追従) */}
      <div className="sticky top-[97px] z-30 bg-white/95 backdrop-blur-md rounded-2xl p-2.5 sm:p-3 border border-slate-200/90 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
        {/* 5大タブ切り替え（横スクロール対応＋左右インジケーター） */}
        <div className="relative min-w-0 max-w-full overflow-hidden rounded-xl">
          {/* 左スクロール可能インジケーター */}
          {canScrollLeft && (
            <div
              className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-slate-200 via-slate-100/90 to-transparent pointer-events-none flex items-center justify-start pl-1 text-slate-500 z-10 animate-in fade-in duration-150"
              aria-hidden="true"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </div>
          )}

          <div
            ref={tabsRef}
            onWheel={handleTabsWheel}
            className="flex items-center gap-1 overflow-x-auto no-scrollbar scroll-smooth p-1 bg-slate-100/90 rounded-xl border border-slate-200/60 text-xs"
          >
            <button
              type="button"
              onClick={() => setActiveTab('unit')}
              data-active={activeTab === 'unit'}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all shrink-0 whitespace-nowrap cursor-pointer ${
                activeTab === 'unit'
                  ? 'bg-white text-slate-800 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              ユニット別
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('vocal')}
              data-active={activeTab === 'vocal'}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all shrink-0 whitespace-nowrap cursor-pointer ${
                activeTab === 'vocal'
                  ? 'bg-white text-slate-800 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              歌唱ver別
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('year')}
              data-active={activeTab === 'year'}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all shrink-0 whitespace-nowrap cursor-pointer ${
                activeTab === 'year'
                  ? 'bg-white text-slate-800 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              実装年別
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('character')}
              data-active={activeTab === 'character'}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all shrink-0 whitespace-nowrap cursor-pointer ${
                activeTab === 'character'
                  ? 'bg-white text-slate-800 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              歌唱キャラ別
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('custom')}
              data-active={activeTab === 'custom'}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all shrink-0 whitespace-nowrap flex items-center gap-1 cursor-pointer ${
                activeTab === 'custom'
                  ? 'bg-[#33ccbb] text-white shadow-2xs'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>カスタム比較</span>
            </button>
          </div>

          {/* 右スクロール可能インジケーター */}
          {canScrollRight && (
            <div
              className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-slate-200 via-slate-100/90 to-transparent pointer-events-none flex items-center justify-end pr-1 text-slate-500 z-10 animate-in fade-in duration-150"
              aria-hidden="true"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </div>
          )}
        </div>

        {/* ソートセレクター（固定表示） */}
        <div className="flex items-center gap-1.5 self-end sm:self-auto bg-slate-100/90 px-2.5 py-1.5 rounded-xl border border-slate-200/70 text-xs font-bold text-slate-700 shrink-0">
          <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-[11px] text-slate-500 font-normal hidden sm:inline">並び替え:</span>
          <select
            value={effectiveSortMetric}
            onChange={(e) => setSortMetric(e.target.value as SortMetric)}
            className="bg-transparent border-none text-xs font-bold text-slate-700 focus:outline-hidden cursor-pointer"
          >
            {activeTab === 'custom' ? (
              <>
                <option value="created_desc">追加が新しい順</option>
                <option value="created_asc">追加が古い順</option>
                <option value="percentage_desc">所持率が高い順</option>
                <option value="percentage_asc">所持率が低い順</option>
                <option value="count_desc">楽曲数が多い順</option>
                <option value="count_asc">楽曲数が少ない順</option>
              </>
            ) : (
              <>
                <option value="default">デフォルト順</option>
                <option value="percentage_desc">所持率が高い順</option>
                <option value="percentage_asc">所持率が低い順</option>
                <option value="count_desc">楽曲数が多い順</option>
                <option value="count_asc">楽曲数が少ない順</option>
              </>
            )}
          </select>
        </div>
      </div>

      {/* メインコンテンツカード */}
      <div className="bg-white/90 backdrop-blur-md rounded-3xl p-4 sm:p-5 border border-slate-200/80 shadow-xs space-y-4">
        {/* カスタム比較タブ時のメッセージ通知（追加成功・エラー・削除） */}
        {activeTab === 'custom' && customMessage && (
          <div
            className={`p-3 sm:p-3.5 rounded-2xl flex items-center justify-between gap-2 text-xs sm:text-sm font-bold border transition-all animate-in fade-in slide-in-from-top-1 duration-200 ${
              customMessage.type === 'error'
                ? 'bg-rose-50 border-rose-200 text-rose-700'
                : 'bg-emerald-50 border-emerald-200 text-emerald-700'
            }`}
          >
            <div className="flex items-center gap-2">
              {customMessage.type === 'error' ? (
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              ) : (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              )}
              <span>{customMessage.text}</span>
            </div>
            <button
              type="button"
              onClick={() => setCustomMessage(null)}
              className="p-1 rounded-lg hover:bg-black/5 transition-colors cursor-pointer"
              aria-label="閉じる"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
        {/* カスタム比較タブ時の条件作成・追加パネル（折りたたみ可能） */}
        {activeTab === 'custom' && (
          <div
            className={`p-3.5 sm:p-5 bg-slate-50/80 rounded-2xl sm:rounded-3xl border border-slate-200/90 shadow-2xs transition-all ${
              isCustomFormOpen ? 'space-y-4' : ''
            }`}
          >
            <div
              className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 ${
                isCustomFormOpen ? 'pb-2 border-b border-slate-200/80' : ''
              }`}
            >
              <button
                type="button"
                onClick={() => setIsCustomFormOpen((prev) => !prev)}
                className="flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-800 hover:text-[#0d9488] cursor-pointer transition-colors text-left"
              >
                <Sparkles className="w-4 h-4 text-[#33ccbb] shrink-0" />
                <span>カスタム比較条件を作成</span>
                <span className="text-[11px] font-normal text-slate-400">
                  {isCustomFormOpen ? '(タップして折りたたむ)' : '(タップして開く)'}
                </span>
                {isCustomFormOpen ? (
                  <ChevronUp className="w-4 h-4 text-slate-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                )}
              </button>

              {isCustomFormOpen && (
                /* AND / OR 条件の切り替えトグル */
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
              )}
            </div>

            {isCustomFormOpen && (
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

              {/* 条件グループの一括展開/折りたたみバー */}
              <div className="flex items-center justify-between px-1 pt-1 text-xs">
                <span className="text-[11px] font-bold text-slate-500">条件グループ（クリックで開閉）</span>
                <div className="flex items-center gap-1.5 text-[11px]">
                  <button
                    type="button"
                    onClick={() => setAllCustomSections(true)}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-[#33ccbb]/15 text-[#0d9488] font-bold transition-colors cursor-pointer"
                  >
                    すべて展開
                  </button>
                  <button
                    type="button"
                    onClick={() => setAllCustomSections(false)}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 font-bold transition-colors cursor-pointer"
                  >
                    すべて折りたたむ
                  </button>
                </div>
              </div>

              {/* 1. ユニットでの絞り込み */}
              <div className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-2xs">
                <div
                  onClick={() => toggleCustomSection('units')}
                  className="flex items-center justify-between p-3 cursor-pointer select-none bg-slate-50/60 hover:bg-slate-100/60 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs sm:text-sm text-slate-800">1. 対象ユニット</span>
                    {newSelectedUnits.length > 0 && (
                      <span className="text-[11px] bg-[#33ccbb]/15 text-[#0d9488] px-2 py-0.5 rounded-full font-bold">
                        {newSelectedUnits.length}組選択中
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-1.5 text-xs">
                      <button
                        type="button"
                        onClick={() => setNewSelectedUnits(Object.keys(UNIT_METAS) as UnitType[])}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-[#33ccbb]/15 text-[#0d9488] font-bold transition-colors cursor-pointer text-[11px]"
                      >
                        全選択
                      </button>
                      <button
                        type="button"
                        onClick={() => setNewSelectedUnits([])}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 font-medium transition-colors cursor-pointer text-[11px]"
                      >
                        クリア
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleCustomSection('units')}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                      aria-label="ユニット条件を展開・折りたたみ"
                    >
                      {customOpenSections.units ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {customOpenSections.units && (
                  <div className="p-3 sm:p-4 border-t border-slate-100">
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
                )}
              </div>

              {/* 2. 歌唱キャラクターでの絞り込み（リスト絞り込みUIと統一） */}
              <div className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-2xs">
                <div
                  onClick={() => toggleCustomSection('characters')}
                  className="flex items-center justify-between p-3 cursor-pointer select-none bg-slate-50/60 hover:bg-slate-100/60 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-[#33ccbb]" />
                    <span className="font-bold text-xs sm:text-sm text-slate-800">2. 歌唱キャラクター</span>
                    {newSelectedChars.length > 0 && (
                      <span className="text-[11px] bg-[#33ccbb]/15 text-[#0d9488] px-2 py-0.5 rounded-full font-bold">
                        {newSelectedChars.length}人選択中
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-1.5 text-xs">
                      <button
                        type="button"
                        onClick={() => setNewSelectedChars(CHARACTERS.map((c) => c.id))}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-[#33ccbb]/15 text-[#0d9488] font-bold transition-colors cursor-pointer text-[11px]"
                      >
                        全選択
                      </button>
                      <button
                        type="button"
                        onClick={() => setNewSelectedChars([])}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 font-medium transition-colors cursor-pointer text-[11px]"
                      >
                        クリア
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleCustomSection('characters')}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                      aria-label="キャラクター条件を展開・折りたたみ"
                    >
                      {customOpenSections.characters ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {customOpenSections.characters && (
                  <div className="p-3 sm:p-4 border-t border-slate-100">
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
                            <div className="flex items-center gap-1 text-[10px]">
                              <button
                                type="button"
                                onClick={() => {
                                  const mainIds = mainChars.map((c) => c.id);
                                  setNewSelectedChars((prev) =>
                                    Array.from(new Set([...prev, ...mainIds]))
                                  );
                                }}
                                className="px-2 py-0.5 rounded-md bg-white border border-slate-200/80 hover:bg-[#33ccbb]/10 text-[#0d9488] font-bold transition-colors cursor-pointer"
                              >
                                全選択
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  const mainIds = mainChars.map((c) => c.id);
                                  setNewSelectedChars((prev) =>
                                    prev.filter((id) => !mainIds.includes(id))
                                  );
                                }}
                                className="px-2 py-0.5 rounded-md bg-white border border-slate-200/80 hover:bg-slate-100 text-slate-500 font-medium transition-colors cursor-pointer"
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
                                <div className="flex items-center gap-1 text-[10px]">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const extraIds = extraChars.map((c) => c.id);
                                      setNewSelectedChars((prev) =>
                                        Array.from(new Set([...prev, ...extraIds]))
                                      );
                                    }}
                                    className="px-2 py-0.5 rounded-md bg-white border border-slate-200/80 hover:bg-[#33ccbb]/10 text-[#0d9488] font-bold transition-colors cursor-pointer"
                                  >
                                    全選択
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const extraIds = extraChars.map((c) => c.id);
                                      setNewSelectedChars((prev) =>
                                        prev.filter((id) => !extraIds.includes(id))
                                      );
                                    }}
                                    className="px-2 py-0.5 rounded-md bg-white border border-slate-200/80 hover:bg-slate-100 text-slate-500 font-medium transition-colors cursor-pointer"
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
                          <div className="flex items-center gap-1 text-[10px]">
                            <button
                              type="button"
                              onClick={() => {
                                const ids = unitChars.map((c) => c.id);
                                setNewSelectedChars((prev) =>
                                  Array.from(new Set([...prev, ...ids]))
                                );
                              }}
                              className="px-2 py-0.5 rounded-md bg-white border border-slate-200/80 hover:bg-[#33ccbb]/10 text-[#0d9488] font-bold transition-colors cursor-pointer"
                            >
                              全選択
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                const ids = unitChars.map((c) => c.id);
                                setNewSelectedChars((prev) =>
                                  prev.filter((id) => !ids.includes(id))
                                );
                              }}
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

              {/* 3. 歌唱バージョンでの絞り込み（リスト絞り込みUIと統一） */}
              <div className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-2xs">
                <div
                  onClick={() => toggleCustomSection('vocalTypes')}
                  className="flex items-center justify-between p-3 cursor-pointer select-none bg-slate-50/60 hover:bg-slate-100/60 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs sm:text-sm text-slate-800">3. 歌唱バージョン条件</span>
                    {newSelectedVocalTypes.length > 0 && (
                      <span className="text-[11px] bg-[#33ccbb]/15 text-[#0d9488] px-2 py-0.5 rounded-full font-bold">
                        {newSelectedVocalTypes.length}件選択中
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-1.5 text-xs">
                      <button
                        type="button"
                        onClick={() =>
                          setNewSelectedVocalTypes(['sekai', 'virtualSinger', 'connectLive', 'anotherVocal', 'inst'])
                        }
                        className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-[#33ccbb]/15 text-[#0d9488] font-bold transition-colors cursor-pointer text-[11px]"
                      >
                        全選択
                      </button>
                      <button
                        type="button"
                        onClick={() => setNewSelectedVocalTypes([])}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 font-medium transition-colors cursor-pointer text-[11px]"
                      >
                        クリア
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleCustomSection('vocalTypes')}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                      aria-label="歌唱バージョン条件を展開・折りたたみ"
                    >
                      {customOpenSections.vocalTypes ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {customOpenSections.vocalTypes && (
                  <div className="p-3 sm:p-4 border-t border-slate-100">
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {[
                        { id: 'sekai', label: 'セカイver あり' },
                        { id: 'virtualSinger', label: 'バーチャル・シンガーver あり' },
                        { id: 'connectLive', label: 'コネクトライブver あり' },
                        { id: 'anotherVocal', label: 'アナザーボーカル あり' },
                        { id: 'inst', label: 'Inst. ver. あり' },
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
                )}
              </div>

              {/* 4. 楽曲分類での絞り込み（書き下ろし楽曲のみ・カバー除外） */}
              <div className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-2xs">
                <div
                  onClick={() => toggleCustomSection('originalTypes')}
                  className="flex items-center justify-between p-3 cursor-pointer select-none bg-slate-50/60 hover:bg-slate-100/60 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs sm:text-sm text-slate-800">4. 楽曲分類（書き下ろし等）</span>
                    {newSelectedOriginalTypes.length > 0 && (
                      <span className="text-[11px] bg-[#33ccbb]/15 text-[#0d9488] px-2 py-0.5 rounded-full font-bold">
                        {newSelectedOriginalTypes.length}種選択中
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-1.5 text-xs">
                      <button
                        type="button"
                        onClick={() =>
                          setNewSelectedOriginalTypes(
                            (Object.keys(ORIGINAL_TYPE_METAS) as OriginalSongType[]).filter(
                              (t) => t !== 'cover'
                            )
                          )
                        }
                        className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-[#33ccbb]/15 text-[#0d9488] font-bold transition-colors cursor-pointer text-[11px]"
                      >
                        全選択
                      </button>
                      <button
                        type="button"
                        onClick={() => setNewSelectedOriginalTypes([])}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 font-medium transition-colors cursor-pointer text-[11px]"
                      >
                        クリア
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleCustomSection('originalTypes')}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                      aria-label="楽曲分類条件を展開・折りたたみ"
                    >
                      {customOpenSections.originalTypes ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {customOpenSections.originalTypes && (
                  <div className="p-3 sm:p-4 border-t border-slate-100">
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
                )}
              </div>

              {/* 5. イベントバナーキャラクターでの絞り込み */}
              <div className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-2xs">
                <div
                  onClick={() => toggleCustomSection('bannerCharacters')}
                  className="flex items-center justify-between p-3 cursor-pointer select-none bg-slate-50/60 hover:bg-slate-100/60 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs sm:text-sm text-slate-800">5. イベントバナーキャラクター</span>
                    {newSelectedBannerCharacters.length > 0 && (
                      <span className="text-[11px] bg-[#33ccbb]/15 text-[#0d9488] px-2 py-0.5 rounded-full font-bold">
                        {newSelectedBannerCharacters.length}人選択中
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-1.5 text-xs">
                      <button
                        type="button"
                        onClick={() => {
                          const original20 = CHARACTERS.filter((c) =>
                            [
                              'leo_need',
                              'more_more_jump',
                              'vivid_bad_squad',
                              'wonderlands_showtime',
                              'nightcord_at_25',
                            ].includes(c.unit)
                          ).map((c) => c.id);
                          setNewSelectedBannerCharacters(original20);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-[#33ccbb]/15 text-[#0d9488] font-bold transition-colors cursor-pointer text-[11px]"
                      >
                        全選択
                      </button>
                      <button
                        type="button"
                        onClick={() => setNewSelectedBannerCharacters([])}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 font-medium transition-colors cursor-pointer text-[11px]"
                      >
                        クリア
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleCustomSection('bannerCharacters')}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                      aria-label="イベントバナーキャラクター条件を展開・折りたたみ"
                    >
                      {customOpenSections.bannerCharacters ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {customOpenSections.bannerCharacters && (
                  <div className="p-3 sm:p-4 border-t border-slate-100 space-y-2">
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
                            <div className="flex items-center gap-1 text-[10px]">
                              <button
                                type="button"
                                onClick={() => {
                                  const memberIds = members.map((c) => c.id);
                                  setNewSelectedBannerCharacters((prev) =>
                                    Array.from(new Set([...prev, ...memberIds]))
                                  );
                                }}
                                className="px-2 py-0.5 rounded-md bg-white border border-slate-200/80 hover:bg-[#33ccbb]/10 text-[#0d9488] font-bold transition-colors cursor-pointer"
                              >
                                全選択
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  const memberIds = members.map((c) => c.id);
                                  setNewSelectedBannerCharacters((prev) =>
                                    prev.filter((id) => !memberIds.includes(id))
                                  );
                                }}
                                className="px-2 py-0.5 rounded-md bg-white border border-slate-200/80 hover:bg-slate-100 text-slate-500 font-medium transition-colors cursor-pointer"
                              >
                                クリア
                              </button>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                            {members.map((char) => {
                              const isSelected = newSelectedBannerCharacters.includes(char.id);
                              return (
                                <button
                                  key={char.id}
                                  type="button"
                                  onClick={() => {
                                    setNewSelectedBannerCharacters((prev) =>
                                      isSelected
                                        ? prev.filter((id) => id !== char.id)
                                        : [...prev, char.id]
                                    );
                                  }}
                                  className={`flex items-center gap-1.5 px-2 py-1.5 rounded-xl border text-left text-xs transition-all cursor-pointer ${
                                    isSelected
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

              {/* 6. 実装年での絞り込み */}
              <div className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-2xs">
                <div
                  onClick={() => toggleCustomSection('releaseYears')}
                  className="flex items-center justify-between p-3 cursor-pointer select-none bg-slate-50/60 hover:bg-slate-100/60 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs sm:text-sm text-slate-800">6. 実装年</span>
                    {newSelectedReleaseYears.length > 0 && (
                      <span className="text-[11px] bg-[#33ccbb]/15 text-[#0d9488] px-2 py-0.5 rounded-full font-bold">
                        {newSelectedReleaseYears.length}件選択中
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-1.5 text-xs">
                      <button
                        type="button"
                        onClick={() => setNewSelectedReleaseYears([1, 2, 3, 4, 5, 6, 7])}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-[#33ccbb]/15 text-[#0d9488] font-bold transition-colors cursor-pointer text-[11px]"
                      >
                        全選択
                      </button>
                      <button
                        type="button"
                        onClick={() => setNewSelectedReleaseYears([])}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 font-medium transition-colors cursor-pointer text-[11px]"
                      >
                        クリア
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleCustomSection('releaseYears')}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                      aria-label="実装年条件を展開・折りたたみ"
                    >
                      {customOpenSections.releaseYears ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {customOpenSections.releaseYears && (
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
                )}
              </div>

              {/* 条件未選択時のエラーメッセージバナー（フォーム内） */}
              {customMessage?.type === 'error' && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                    <span>{customMessage.text}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCustomMessage(null)}
                    className="p-0.5 rounded-md hover:bg-black/5 text-rose-500 cursor-pointer"
                    aria-label="閉じる"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

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
            )}
          </div>
        )}

        {/* 比較バー一覧 */}
        <div className="space-y-3">
          {sortedList.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              {activeTab === 'custom'
                ? 'カスタム比較条件が登録されていません。上の「カスタム比較条件を作成」から新しい条件を追加してください。'
                : '比較条件に該当する項目がありません。'}
            </div>
          ) : (
            sortedList.map((item) => (
              <div
                key={item.key}
                className={`p-4 rounded-2xl border transition-all ${
                  item.isComplete
                    ? 'bg-emerald-50/50 border-emerald-300 shadow-2xs'
                    : 'bg-white/80 border-slate-200/80 shadow-2xs'
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
                      <span className="font-bold text-xs sm:text-sm text-slate-800">
                        {item.name}
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
                            {vt === 'sekai'
                              ? 'セカイver'
                              : vt === 'virtualSinger'
                              ? 'バチャシンver'
                              : vt === 'connectLive'
                              ? 'コネライ'
                              : vt === 'inst'
                              ? 'Inst. ver.'
                              : 'アナザー'}
                          </span>
                        ))}
                        {(item as any).cond.conditionBannerCharacters?.map((cId: string) => {
                          const c = CHARACTERS.find((ch) => ch.id === cId);
                          return (
                            <span key={cId} className="px-1.5 py-0.2 rounded bg-slate-800 text-white font-medium">
                              バナー:{c?.name || cId}
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="flex items-baseline gap-1.5 font-bold">
                      <span className="text-base sm:text-lg text-slate-800">
                        {item.percentage.toFixed(1)}%
                      </span>
                      <span className="text-xs text-slate-500 font-medium">
                        ({item.owned} / {item.total}曲)
                      </span>
                    </div>

                    {/* リスト画面へジャンプするボタン */}
                    <button
                      type="button"
                      onClick={() => onNavigateToList(item.filterParams as any)}
                      className="p-2 min-w-[36px] min-h-[36px] flex items-center justify-center text-slate-500 hover:text-[#0d9488] hover:bg-[#33ccbb]/15 rounded-xl transition-colors cursor-pointer border border-slate-200 hover:border-[#33ccbb]/40 shadow-2xs"
                      title="この条件で楽曲リストを表示"
                      aria-label="この条件で楽曲リストを表示"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </button>

                    {Boolean((item as any).isCustom) && (
                      <button
                        type="button"
                        onClick={(e) => handleDeleteCustomCondition(item.key, item.name, e)}
                        className="p-2 min-w-[36px] min-h-[36px] flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer border border-slate-200/60 hover:border-rose-200"
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
