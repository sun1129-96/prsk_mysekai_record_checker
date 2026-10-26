import React, { useState, useEffect } from 'react';
import { Header, type TabType } from './components/Header';
import { ListView } from './components/ListView';
import { ComparisonView } from './components/ComparisonView';
import { MenuView } from './components/MenuView';
import { MOCK_RECORDS } from './data/mockRecords';

const STORAGE_KEY = 'mysekai_owned_record_ids_v1';

export const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<TabType>('list');

  // 所持状態管理（localStorage + URL共有デコード）
  const [ownedRecordIds, setOwnedRecordIds] = useState<Record<string, boolean>>(() => {
    // 1. URL共有パラメータがあるか確認
    try {
      const params = new URLSearchParams(window.location.search);
      const shareData = params.get('share');
      if (shareData) {
        const decoded = decodeURIComponent(atob(shareData));
        const list: string[] = JSON.parse(decoded);
        const map: Record<string, boolean> = {};
        list.forEach((id) => {
          map[id] = true;
        });
        return map;
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

    // 3. 初期モック用プリセット（例として各ユニットの代表曲を所持状態に）
    return {
      rec_1: true, // Tell Your World
      rec_7: true, // ロキ
      rec_10: true, // ハッピーシンセサイザ
      rec_15: true, // フラジール
      rec_16: true, // ブリキノダンス
      rec_19: true, // シャルル
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
          />
        )}

        {currentTab === 'comparison' && (
          <ComparisonView
            records={MOCK_RECORDS}
            ownedRecordIds={ownedRecordIds}
          />
        )}

        {currentTab === 'menu' && (
          <MenuView
            records={MOCK_RECORDS}
            ownedRecordIds={ownedRecordIds}
            onBatchCheckAll={handleBatchCheckAll}
            onImportData={handleImportData}
          />
        )}
      </main>

      {/* 控えめなフッター */}
      <footer className="py-6 border-t border-slate-200/60 bg-white/50 text-center text-xs text-slate-400">
        <p>© 2026 プロセカ マイセカイ レコードチェッカー (Unofficial Mockup)</p>
      </footer>
    </div>
  );
};

export default App;
