import React from 'react';
import { ListFilter, BarChart3, Menu as MenuIcon, Disc } from 'lucide-react';

export type TabType = 'list' | 'comparison' | 'menu';

interface HeaderProps {
  currentTab: TabType;
  onTabChange: (tab: TabType) => void;
  ownedCount: number;
  totalCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onTabChange,
  ownedCount,
  totalCount,
}) => {
  const percentage = totalCount > 0 ? ((ownedCount / totalCount) * 100).toFixed(1) : '0.0';

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        {/* 最上部タイトルエリア */}
        <div className="flex items-center justify-between h-14">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#33ccbb] to-[#38bdf8] flex items-center justify-center text-white shadow-xs">
              <Disc className="w-5 h-5 animate-[spin_12s_linear_infinite]" />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-bold text-slate-800 tracking-tight flex items-center gap-1.5">
                <span>マイセカイ レコードチェッカー</span>
              </h1>
            </div>
          </div>

          {/* クイック進捗バッジ */}
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200/80 px-2.5 py-1 rounded-full text-xs font-semibold text-slate-700">
            <span className="text-slate-400">所持</span>
            <span className="text-[#0d9488] font-bold text-sm">
              {ownedCount}
            </span>
            <span className="text-slate-400">/ {totalCount}</span>
            <span className="bg-[#33ccbb]/15 text-[#0d9488] px-1.5 py-0.5 rounded-md font-bold text-[11px]">
              {percentage}%
            </span>
          </div>
        </div>

        {/* 画面切り替えタブUI (pjsk-rate スタイル) */}
        <nav className="flex border-t border-slate-100">
          <button
            onClick={() => onTabChange('list')}
            className={`flex-1 py-2.5 text-xs sm:text-sm font-semibold flex items-center justify-center gap-1.5 border-b-2 transition-all ${
              currentTab === 'list'
                ? 'border-[#33ccbb] text-[#0d9488] bg-[#33ccbb]/5 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
            }`}
          >
            <ListFilter className="w-4 h-4" />
            <span>リスト表示</span>
          </button>

          <button
            onClick={() => onTabChange('comparison')}
            className={`flex-1 py-2.5 text-xs sm:text-sm font-semibold flex items-center justify-center gap-1.5 border-b-2 transition-all ${
              currentTab === 'comparison'
                ? 'border-[#33ccbb] text-[#0d9488] bg-[#33ccbb]/5 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>所持率比較</span>
          </button>

          <button
            onClick={() => onTabChange('menu')}
            className={`flex-1 py-2.5 text-xs sm:text-sm font-semibold flex items-center justify-center gap-1.5 border-b-2 transition-all ${
              currentTab === 'menu'
                ? 'border-[#33ccbb] text-[#0d9488] bg-[#33ccbb]/5 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
            }`}
          >
            <MenuIcon className="w-4 h-4" />
            <span>メニュー</span>
          </button>
        </nav>
      </div>
    </header>
  );
};
