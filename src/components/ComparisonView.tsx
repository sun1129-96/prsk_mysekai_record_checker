import { useState, useMemo } from 'react';
import { BarChart2, Award, Settings2, Sparkles } from 'lucide-react';
import type { RecordItem, UnitType } from '../types/record';
import { UNIT_METAS, CHARACTERS } from '../types/record';

interface ComparisonViewProps {
  records: RecordItem[];
  ownedRecordIds: Record<string, boolean>;
}

type CompareTab = 'unit' | 'year' | 'custom';
type CustomAxisType = 'vocal' | 'character' | 'selected_units';

export const ComparisonView: React.FC<ComparisonViewProps> = ({
  records,
  ownedRecordIds,
}) => {
  // 標準タブ（ユニット別・配信年別） + カスタム条件タブ
  const [activeTab, setActiveTab] = useState<CompareTab>('unit');

  // カスタム条件の設定状態
  const [customAxis, setCustomAxis] = useState<CustomAxisType>('vocal');
  const [selectedCharIds, setSelectedCharIds] = useState<string[]>([
    'miku',
    'ichika',
    'minori',
    'kohane',
    'tsukasa',
    'kanade',
  ]);
  const [selectedUnitKeys, setSelectedUnitKeys] = useState<UnitType[]>([
    'leo_need',
    'more_more_jump',
    'vivid_bad_squad',
  ]);

  // 1. ユニット別集計（標準）
  const unitStats = useMemo(() => {
    return (Object.keys(UNIT_METAS) as UnitType[]).map((unitKey) => {
      const meta = UNIT_METAS[unitKey];
      const unitRecords = records.filter((r) => r.unit === unitKey);
      const total = unitRecords.length;
      const owned = unitRecords.filter((r) => ownedRecordIds[r.id]).length;
      const percentage = total > 0 ? (owned / total) * 100 : 0;
      const isComplete = total > 0 && owned === total;

      return {
        key: unitKey,
        name: meta.name,
        shortName: meta.shortName,
        themeColor: meta.themeColor,
        bgColor: meta.bgColor,
        borderColor: meta.borderColor,
        iconUrl: meta.iconUrl,
        total,
        owned,
        percentage,
        isComplete,
      };
    });
  }, [records, ownedRecordIds]);

  // 2. 周年基準（○年目別）集計（標準）
  const anniversaryYearStats = useMemo(() => {
    // 配信日から周年（○年目）を計算
    const getAnniversaryYear = (dateStr: string): number => {
      const [yearStr, monthStr, dayStr] = dateStr.split('-');
      const y = parseInt(yearStr, 10);
      const m = parseInt(monthStr, 10);
      const d = parseInt(dayStr, 10);
      const isAfterSep30 = m > 9 || (m === 9 && d >= 30);
      return isAfterSep30 ? y - 2020 + 1 : y - 2020;
    };

    // 存在する周年一覧を取得
    const yearList = Array.from(
      new Set(records.map((r) => getAnniversaryYear(r.releaseDate)))
    ).sort((a, b) => a - b);

    const colors = ['#6366f1', '#3b82f6', '#06b6d4', '#10b981', '#f59e0b', '#ec4899', '#a855f7'];

    return yearList.map((annivYear) => {
      const yearRecords = records.filter(
        (r) => getAnniversaryYear(r.releaseDate) === annivYear
      );
      const total = yearRecords.length;
      const owned = yearRecords.filter((r) => ownedRecordIds[r.id]).length;
      const percentage = total > 0 ? (owned / total) * 100 : 0;
      const isComplete = total > 0 && owned === total;

      const startYear = 2020 + annivYear - 1;
      const endYear = startYear + 1;

      return {
        key: `anniv_${annivYear}`,
        name: `${annivYear}年目 (${startYear}.9.30〜${endYear}.9.29)`,
        themeColor: colors[(annivYear - 1) % colors.length],
        total,
        owned,
        percentage,
        isComplete,
      };
    });
  }, [records, ownedRecordIds]);

  // 3. カスタム条件集計（利用者が指定）
  const customStats = useMemo(() => {
    if (customAxis === 'vocal') {
      const list = [
        { key: 'sekai', label: 'セカイver', color: '#10b981' },
        { key: 'virtualSinger', label: 'バーチャル・シンガーver', color: '#14b8a6' },
        { key: 'connectLive', label: 'コネクトライブver', color: '#0ea5e9' },
        { key: 'anotherVocal', label: 'アナザーボーカルver', color: '#f59e0b' },
      ];
      return list.map((item) => {
        const matched = records.filter(
          (r) => r.vocalVersions[item.key as keyof typeof r.vocalVersions]
        );
        const total = matched.length;
        const owned = matched.filter((r) => ownedRecordIds[r.id]).length;
        const percentage = total > 0 ? (owned / total) * 100 : 0;
        return {
          key: item.key,
          name: item.label,
          themeColor: item.color,
          total,
          owned,
          percentage,
          isComplete: total > 0 && owned === total,
        };
      });
    }

    if (customAxis === 'character') {
      return selectedCharIds.map((charId) => {
        const char = CHARACTERS.find((c) => c.id === charId);
        const matched = records.filter((r) => r.characters.includes(charId));
        const total = matched.length;
        const owned = matched.filter((r) => ownedRecordIds[r.id]).length;
        const percentage = total > 0 ? (owned / total) * 100 : 0;
        return {
          key: charId,
          name: `${char ? char.name : charId} 歌唱曲`,
          themeColor: char ? char.color : '#33ccbb',
          total,
          owned,
          percentage,
          isComplete: total > 0 && owned === total,
        };
      });
    }

    // selected_units
    return selectedUnitKeys.map((unitKey) => {
      const meta = UNIT_METAS[unitKey];
      const matched = records.filter((r) => r.unit === unitKey);
      const total = matched.length;
      const owned = matched.filter((r) => ownedRecordIds[r.id]).length;
      const percentage = total > 0 ? (owned / total) * 100 : 0;
      return {
        key: unitKey,
        name: meta.name,
        themeColor: meta.themeColor,
        iconUrl: meta.iconUrl,
        total,
        owned,
        percentage,
        isComplete: total > 0 && owned === total,
      };
    });
  }, [records, ownedRecordIds, customAxis, selectedCharIds, selectedUnitKeys]);

  const displayedList =
    activeTab === 'unit'
      ? unitStats
      : activeTab === 'year'
      ? anniversaryYearStats
      : customStats;

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-6 py-4 space-y-5">
      {/* 画面上部カード */}
      <div className="bg-white/90 backdrop-blur-md rounded-3xl p-5 border border-slate-200/80 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-[#33ccbb]/15 text-[#0d9488]">
              <BarChart2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-800">
                所持率の比較・進捗分析
              </h2>
              <p className="text-xs text-slate-400">
                標準のユニット別・周年別のほか、カスタム条件で自由に比較できます
              </p>
            </div>
          </div>

          {/* タブ切り替え（ユニット別 / 周年別 / カスタム条件比較） */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl border border-slate-200/60 text-xs">
            <button
              onClick={() => setActiveTab('unit')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                activeTab === 'unit'
                  ? 'bg-white text-slate-800 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              ユニット別
            </button>
            <button
              onClick={() => setActiveTab('year')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                activeTab === 'year'
                  ? 'bg-white text-slate-800 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              周年別 (年目)
            </button>
            <button
              onClick={() => setActiveTab('custom')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1 ${
                activeTab === 'custom'
                  ? 'bg-[#33ccbb] text-white shadow-2xs'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Settings2 className="w-3.5 h-3.5" />
              <span>カスタム比較</span>
            </button>
          </div>
        </div>

        {/* カスタム条件比較タブがアクティブな場合の設定パネル */}
        {activeTab === 'custom' && (
          <div className="mb-5 p-4 bg-gradient-to-r from-emerald-50/60 via-teal-50/40 to-sky-50/60 rounded-2xl border border-[#33ccbb]/30 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-[#33ccbb]" />
                <span>比較の軸を選択:</span>
              </span>
              <div className="flex gap-1">
                {[
                  { id: 'vocal', label: '歌唱ver別' },
                  { id: 'character', label: '指定キャラ別' },
                  { id: 'selected_units', label: 'ピックアップユニット' },
                ].map((axis) => (
                  <button
                    key={axis.id}
                    onClick={() => setCustomAxis(axis.id as CustomAxisType)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                      customAxis === axis.id
                        ? 'bg-[#33ccbb] text-white shadow-xs'
                        : 'bg-white text-slate-600 border border-slate-200/80 hover:bg-slate-50'
                    }`}
                  >
                    {axis.label}
                  </button>
                ))}
              </div>
            </div>

            {/* キャラクター指定の場合の選択チップ */}
            {customAxis === 'character' && (
              <div className="space-y-1.5 pt-1">
                <span className="text-[11px] font-bold text-slate-500 block">
                  比較対象のキャラクター（タップして追加/除外）:
                </span>
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-1 bg-white/80 rounded-xl border border-slate-200/70">
                  {CHARACTERS.map((char) => {
                    const isSelected = selectedCharIds.includes(char.id);
                    return (
                      <button
                        key={char.id}
                        onClick={() => {
                          if (isSelected) {
                            if (selectedCharIds.length > 1) {
                              setSelectedCharIds(selectedCharIds.filter((id) => id !== char.id));
                            }
                          } else {
                            setSelectedCharIds([...selectedCharIds, char.id]);
                          }
                        }}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs transition-all ${
                          isSelected
                            ? 'bg-slate-800 text-white font-bold shadow-2xs'
                            : 'bg-slate-100 text-slate-400 opacity-60 hover:opacity-100'
                        }`}
                      >
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: char.color }}
                        />
                        <span>{char.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ピックアップユニットの場合の選択チップ */}
            {customAxis === 'selected_units' && (
              <div className="space-y-1.5 pt-1">
                <span className="text-[11px] font-bold text-slate-500 block">
                  比較したいユニットを選択:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {(Object.keys(UNIT_METAS) as UnitType[]).map((uKey) => {
                    const meta = UNIT_METAS[uKey];
                    const isSelected = selectedUnitKeys.includes(uKey);
                    return (
                      <button
                        key={uKey}
                        onClick={() => {
                          if (isSelected) {
                            if (selectedUnitKeys.length > 1) {
                              setSelectedUnitKeys(selectedUnitKeys.filter((k) => k !== uKey));
                            }
                          } else {
                            setSelectedUnitKeys([...selectedUnitKeys, uKey]);
                          }
                        }}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold border transition-all ${
                          isSelected
                            ? 'bg-white shadow-xs border-slate-400 text-slate-800'
                            : 'bg-white/50 border-slate-200/60 text-slate-400 opacity-60'
                        }`}
                      >
                        {meta.iconUrl ? (
                          <img
                            src={meta.iconUrl}
                            alt={meta.shortName}
                            className="w-3.5 h-3.5 object-contain shrink-0 drop-shadow-2xs"
                          />
                        ) : (
                          <div
                            className="w-2.5 h-2.5 rounded-full border border-slate-300/80 shadow-2xs"
                            style={{ backgroundColor: meta.themeColor }}
                          />
                        )}
                        <span>{meta.shortName}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 比較バー一覧 */}
        <div className="space-y-3">
          {displayedList.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              比較条件に該当する項目がありません。
            </div>
          ) : (
            displayedList.map((item) => (
              <div
                key={item.key}
                className={`p-4 rounded-2xl border transition-all ${
                  item.isComplete
                    ? 'bg-emerald-50/50 border-emerald-300 shadow-2xs'
                    : 'bg-white/80 border-slate-200/80 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {'iconUrl' in item && item.iconUrl ? (
                      <img
                        src={item.iconUrl as string}
                        alt={item.name}
                        className="w-4 h-4 object-contain shrink-0 drop-shadow-2xs"
                      />
                    ) : (
                      <div
                        className="w-3.5 h-3.5 rounded-full border border-slate-300/80 shadow-2xs"
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

                  <div className="flex items-baseline gap-1.5 font-bold">
                    <span
                      className="text-base sm:text-lg"
                      style={{
                        color:
                          item.themeColor === '#FFFFFF' ? '#475569' : item.themeColor,
                      }}
                    >
                      {item.percentage.toFixed(1)}%
                    </span>
                    <span className="text-xs text-slate-400">
                      ({item.owned} / {item.total}曲)
                    </span>
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
