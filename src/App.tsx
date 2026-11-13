import React, { useState, useEffect } from 'react';
import { Analytics } from '@vercel/analytics/react';
import { Header, type TabType } from './components/Header';
import { ListView } from './components/ListView';
import { ComparisonView } from './components/ComparisonView';
import { MenuView } from './components/MenuView';
import { MOCK_RECORDS } from './data/mockRecords';
import { decodeShareData } from './utils/recordUtils';
import type { DisplaySettings, FilterOptions, SortSettings } from './types/record';

const STORAGE_KEY = 'mysekai_owned_record_ids_v1';
const DISPLAY_SETTINGS_STORAGE_KEY = 'mysekai_display_settings_v1';
const SORT_SETTINGS_STORAGE_KEY = 'mysekai_sort_settings_v1';

const DEFAULT_SORT_SETTINGS: SortSettings = {
  sortType: 'defaultSort',
  sortDirection: 'asc',
};

const DEFAULT_DISPLAY_SETTINGS: DisplaySettings = {
  showJacket: true,
  showReleaseDate: true,
  showReleaseOrder: true,
  showVocalBadges: true,
  showCharacters: true,
  compactMode: false,
};

const DEFAULT_FILTER_OPTIONS: FilterOptions = {
  ownership: 'all',
  units: [
    'virtual_singer',
    'leo_need',
    'more_more_jump',
    'vivid_bad_squad',
    'wonderlands_showtime',
    'nightcord_at_25',
    'other',
  ],
  unitMatchType: 'or',
  characters: [],
  characterMatchType: 'or',
  vocalVersions: {
    virtualSinger: false,
    sekai: false,
    connectLive: false,
    anotherVocal: false,
    inst: false,
  },
  vocalMatchType: 'or',
  searchQuery: '',
  originalTypes: [],
  bannerCharacters: [],
  releaseYears: [],
};

export const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<TabType>('list');

  // リスト画面の絞り込み状態（比較画面からのダイレクト遷移連携用）
  const [filterOptions, setFilterOptions] = useState<FilterOptions>(DEFAULT_FILTER_OPTIONS);

  // 比較画面等から特定の絞り込み条件でリスト画面へ遷移する（直前の検索や絞り込みをリセットして指定条件のみ適用）
  const handleNavigateToListWithFilter = (newFilter: Partial<FilterOptions>) => {
    setFilterOptions({
      ...DEFAULT_FILTER_OPTIONS,
      ...newFilter,
      vocalVersions: {
        ...DEFAULT_FILTER_OPTIONS.vocalVersions,
        ...(newFilter.vocalVersions || {}),
      },
    });
    setCurrentTab('list');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // 表示設定（localStorageに保存・永続化）
  const [displaySettings, setDisplaySettings] = useState<DisplaySettings>(() => {
    try {
      const saved = localStorage.getItem(DISPLAY_SETTINGS_STORAGE_KEY);
      if (saved) {
        return { ...DEFAULT_DISPLAY_SETTINGS, ...JSON.parse(saved) };
      }
    } catch {
      // ignore
    }
    return DEFAULT_DISPLAY_SETTINGS;
  });

  useEffect(() => {
    try {
      localStorage.setItem(DISPLAY_SETTINGS_STORAGE_KEY, JSON.stringify(displaySettings));
    } catch {
      // ignore
    }
  }, [displaySettings]);

  // 並び替え設定（localStorageに保存・永続化してリロードやタブ遷移時も維持）
  const [sortSettings, setSortSettings] = useState<SortSettings>(() => {
    try {
      const saved = localStorage.getItem(SORT_SETTINGS_STORAGE_KEY);
      if (saved) {
        return { ...DEFAULT_SORT_SETTINGS, ...JSON.parse(saved) };
      }
    } catch {
      // ignore
    }
    return DEFAULT_SORT_SETTINGS;
  });

  useEffect(() => {
    try {
      localStorage.setItem(SORT_SETTINGS_STORAGE_KEY, JSON.stringify(sortSettings));
    } catch {
      // ignore
    }
  }, [sortSettings]);

  // 所持状態管理（localStorage + URL共有デコード）
  const [ownedRecordIds, setOwnedRecordIds] = useState<Record<string, boolean>>(() => {
    // 1. URL共有パラメータがあるか確認（BitSetおよび旧形式両対応）
    try {
      const params = new URLSearchParams(window.location.search);
      const shareData = params.get('share');
      if (shareData) {
        const decoded = decodeShareData(shareData);
        if (Object.keys(decoded).length > 0) {
          return decoded;
        }
      }
    } catch {
      // ignore
    }

    // 2. localStorage から復元
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // ignore
    }

    // 3. 初期プリセット（Ready Steady のみ所持状態に）
    return {
      rec_24: true, // Ready Steady
    };
  });

  // localStorage への自動永続化
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(ownedRecordIds));
    } catch {
      // ignore
    }
  }, [ownedRecordIds]);

  // 単一レコードの所持チェック切り替え
  const handleToggleOwned = (id: string) => {
    setOwnedRecordIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // 一括所持 / 一括解除
  const handleBatchCheckAll = (owned: boolean) => {
    const updated: Record<string, boolean> = {};
    MOCK_RECORDS.forEach((r) => {
      updated[r.id] = owned;
    });
    setOwnedRecordIds(updated);
  };

  // インポート適用
  const handleImportData = (data: Record<string, boolean>) => {
    setOwnedRecordIds(data);
  };

  const ownedTotalCount = Object.values(ownedRecordIds).filter(Boolean).length;

  return (
    <div className="min-h-screen bg-transparent text-slate-800 flex flex-col font-sans antialiased selection:bg-[#33ccbb]/20 selection:text-[#0d9488]">
      {/* 固定ヘッダー & ナビゲーションタブ */}
      <Header
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        ownedCount={ownedTotalCount}
        totalCount={MOCK_RECORDS.length}
      />

      {/* メインコンテンツエリア */}
      <main className="flex-1 pb-16">
        {currentTab === 'list' && (
          <ListView
            records={MOCK_RECORDS}
            ownedRecordIds={ownedRecordIds}
            onToggleOwned={handleToggleOwned}
            displaySettings={displaySettings}
            onDisplaySettingsChange={setDisplaySettings}
            filterOptions={filterOptions}
            onFilterOptionsChange={setFilterOptions}
            sortSettings={sortSettings}
            onSortSettingsChange={setSortSettings}
          />
        )}

        {currentTab === 'comparison' && (
          <ComparisonView
            records={MOCK_RECORDS}
            ownedRecordIds={ownedRecordIds}
            onNavigateToList={handleNavigateToListWithFilter}
          />
        )}

        {currentTab === 'menu' && (
          <MenuView
            records={MOCK_RECORDS}
            ownedRecordIds={ownedRecordIds}
            onBatchCheckAll={handleBatchCheckAll}
            onImportData={handleImportData}
            displaySettings={displaySettings}
            onDisplaySettingsChange={setDisplaySettings}
          />
        )}
      </main>

      {/* フッター（免責事項・非公式ファンサイト明記） */}
      <footer className="py-8 px-4 border-t border-slate-200/60 bg-white/60 text-center text-xs text-slate-400">
        <div className="max-w-xl mx-auto space-y-2 leading-relaxed text-slate-400 text-xs">
          <p className="font-medium text-slate-400">このサイトは非公式のファンサイトです。</p>
          <p className="text-slate-400">予告なくサイト内容の追加・変更・削除等を行う場合があります。</p>
          <p className="text-slate-400">
            当サイトの利用によって生じた何らかのトラブルや不利益に対し、作成者は一切の責任を負いかねます。自己責任にてご利用いただきますよう、あらかじめご了承ください。
          </p>
        </div>
      </footer>
      {/* Vercel Web Analytics 計測コンポーネント */}
      <Analytics />
    </div>
  );
};

export default App;
