import React from 'react';
import { Check, Calendar, Music } from 'lucide-react';
import type {
  RecordItem,
  UnitType,
  DisplaySettings,
  TapActionMode,
} from '../types/record';
import { UNIT_METAS, CHARACTERS } from '../types/record';

interface RecordRowProps {
  record: RecordItem;
  isOwned: boolean;
  displaySettings: DisplaySettings;
  tapMode: TapActionMode;
  onRowClick: (record: RecordItem) => void;
  onToggleOwned: (id: string) => void;
  onBadgeClick: (record: RecordItem, trackId: string, e: React.MouseEvent) => void;
}

export const RecordRow: React.FC<RecordRowProps> = React.memo(
  ({
    record,
    isOwned,
    displaySettings,
    tapMode,
    onRowClick,
    onToggleOwned,
    onBadgeClick,
  }) => {
    const unitMeta = UNIT_METAS[record.unit];
    const vsMeta = UNIT_METAS.virtual_singer;

    // 歌唱者の境界のみグラデーションする背景スタイル生成
    const getAnotherVocalStyle = (singers: typeof CHARACTERS, fallbackUnit?: UnitType) => {
      const getUnitBorderColor = () => {
        const unitKey = singers[0]?.unit || fallbackUnit;
        if (!unitKey) return '#cbd5e1';
        if (unitKey === 'virtual_singer') {
          return '#94a3b8';
        }
        return UNIT_METAS[unitKey]?.themeColor || '#cbd5e1';
      };

      const borderColor = getUnitBorderColor();

      if (singers.length === 2) {
        const c1 = singers[0];
        const c2 = singers[1];
        return {
          background: `linear-gradient(105deg, ${c1.color}3d 0%, ${c1.color}3d 40%, ${c2.color}3d 60%, ${c2.color}3d 100%)`,
          borderColor,
          color: '#1e293b',
        };
      } else if (singers.length > 2) {
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
          borderColor,
          color: '#1e293b',
        };
      } else if (singers.length === 1) {
        const c1 = singers[0];
        return {
          backgroundColor: `${c1.color}28`,
          borderColor,
          color: '#1e293b',
        };
      }
      return {
        backgroundColor: '#fffbeb',
        borderColor,
        color: '#b45309',
      };
    };

    const tracks = record.vocalTracks || [];

    return (
      <div
        onClick={() => onRowClick(record)}
        className={`group rounded-2xl border transition-all cursor-pointer select-none flex items-center gap-3 p-3 sm:p-3.5 relative ${
          isOwned
            ? 'bg-emerald-50/70 border-emerald-300/90 border-l-4 border-l-emerald-500 shadow-2xs'
            : 'bg-white/95 border-slate-200/90 hover:border-slate-300 border-l-4 border-l-transparent shadow-xs'
        } ${displaySettings.compactMode ? 'py-2' : ''}`}
      >
        {/* チェックボックスボタン（44x44pxのタッチターゲットを確保しa11yに準拠） */}
        <button
          type="button"
          role="checkbox"
          aria-checked={isOwned}
          aria-label={`${record.title}の所持チェック切り替え`}
          onClick={(e) => {
            e.stopPropagation();
            onToggleOwned(record.id);
          }}
          className="relative min-w-[44px] min-h-[44px] -m-2 flex items-center justify-center shrink-0 cursor-pointer"
        >
          <div
            className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center border-2 transition-all ${
              isOwned
                ? 'bg-emerald-500 border-emerald-500 text-white shadow-xs'
                : 'bg-white border-slate-400 text-transparent hover:border-[#33ccbb]'
            }`}
          >
            <Check className={`w-4 h-4 sm:w-5 sm:h-5 ${isOwned ? 'block' : 'opacity-0'}`} />
          </div>
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
              <Music className="w-5 h-5" style={{ color: unitMeta.textColor || unitMeta.themeColor }} />
            )}
          </div>
        )}

        {/* 曲情報 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-1 flex-wrap">
            <span className="text-[10px] font-bold text-slate-600 shrink-0">
              ユニット
            </span>
            <span
              className="px-2 py-0.5 rounded-md text-[10px] font-bold shrink-0 truncate max-w-[120px]"
              style={{
                backgroundColor: unitMeta.bgColor,
                color: unitMeta.textColor || unitMeta.themeColor,
                border: `1px solid ${unitMeta.borderColor}`,
              }}
            >
              {unitMeta.shortName}
            </span>

            {displaySettings.showReleaseDate && (
              <span className="text-[11px] text-slate-600 flex items-center gap-1 shrink-0 ml-1 font-medium">
                <Calendar className="w-3 h-3 text-slate-500" />
                {record.releaseDate}
              </span>
            )}

            <span className="text-[10px] text-slate-500 font-mono font-semibold">
              #{record.defaultOrder}
            </span>
          </div>

          {/* 曲名 */}
          <h4 className="text-xs sm:text-sm font-bold text-slate-800 truncate tracking-tight">
            {record.title}
          </h4>

          {/* 歌唱verバッジ（表示設定による） */}
          {displaySettings.showVocalBadges && (
            <div className="flex flex-wrap items-center gap-1 mt-1 text-[10px]">
              <span className="text-[10px] font-bold text-slate-600 shrink-0 mr-0.5">
                歌唱ver
              </span>
              {tracks.length > 0 ? (
                tracks.map((track) => {
                  if (track.type === 'sekai') {
                    return (
                      <button
                        type="button"
                        key={track.id}
                        onClick={(e) => onBadgeClick(record, track.id, e)}
                        className="px-1.5 py-0.5 rounded-md font-bold border transition-all shadow-2xs cursor-pointer hover:opacity-80 active:scale-95"
                        style={{
                          backgroundColor: unitMeta.bgColor,
                          borderColor: unitMeta.borderColor,
                          color: unitMeta.textColor || unitMeta.themeColor,
                        }}
                        title={`${track.name} を詳細表示`}
                      >
                        セカイ
                      </button>
                    );
                  }
                  if (track.type === 'virtual_singer') {
                    return (
                      <button
                        type="button"
                        key={track.id}
                        onClick={(e) => onBadgeClick(record, track.id, e)}
                        className="px-1.5 py-0.5 rounded-md font-bold border transition-all shadow-2xs cursor-pointer hover:opacity-80 active:scale-95"
                        style={{
                          backgroundColor: vsMeta.bgColor,
                          borderColor: vsMeta.borderColor,
                          color: vsMeta.textColor || vsMeta.themeColor,
                        }}
                        title={`${track.name} を詳細表示`}
                      >
                        バチャシン
                      </button>
                    );
                  }
                  if (track.type === 'connect_live') {
                    return (
                      <button
                        type="button"
                        key={track.id}
                        onClick={(e) => onBadgeClick(record, track.id, e)}
                        className="px-1.5 py-0.5 rounded-md bg-sky-50 text-sky-700 border border-sky-200/60 font-bold shadow-2xs cursor-pointer hover:opacity-80 active:scale-95"
                        title={`${track.name} を詳細表示`}
                      >
                        コネライ
                      </button>
                    );
                  }
                  if (track.type === 'another_vocal') {
                    const trackSingers = track.singers
                      .map((id) => CHARACTERS.find((c) => c.id === id))
                      .filter((c): c is typeof CHARACTERS[number] => Boolean(c));
                    const badgeStyle = getAnotherVocalStyle(trackSingers, record.unit);

                    const singerUnits = Array.from(
                      new Set(trackSingers.map((s) => s.unit).filter(Boolean))
                    );
                    if (singerUnits.length === 0 && record.unit) {
                      singerUnits.push(record.unit);
                    }

                    return (
                      <button
                        type="button"
                        key={track.id}
                        onClick={(e) => onBadgeClick(record, track.id, e)}
                        className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md font-bold border transition-all shadow-2xs text-[10px] cursor-pointer hover:opacity-80 active:scale-95"
                        style={badgeStyle}
                        title={`${track.name} を詳細表示`}
                      >
                        {singerUnits.map((uKey) => {
                          const uMeta = UNIT_METAS[uKey];
                          if (!uMeta) return null;
                          return uMeta.iconUrl ? (
                            <img
                              key={uKey}
                              src={uMeta.iconUrl}
                              alt={uMeta.name}
                              className="w-3.5 h-3.5 object-contain shrink-0 drop-shadow-2xs"
                              title={uMeta.name}
                            />
                          ) : (
                            <span
                              key={uKey}
                              className="w-2 h-2 rounded-full shrink-0 border border-black/20 shadow-2xs"
                              style={{ backgroundColor: uMeta.themeColor }}
                              title={uMeta.name}
                            />
                          );
                        })}
                        <span>アナボ</span>
                      </button>
                    );
                  }
                  if (track.type === 'other') {
                    return (
                      <button
                        type="button"
                        key={track.id}
                        onClick={(e) => onBadgeClick(record, track.id, e)}
                        className="px-1.5 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200/60 font-bold shadow-2xs cursor-pointer hover:opacity-80 active:scale-95"
                        title={`${track.name} を詳細表示`}
                      >
                        {track.name.includes('コラボ') ? 'コラボ' : 'その他'}
                      </button>
                    );
                  }
                  return null;
                })
              ) : (
                <>
                  {record.vocalVersions.sekai && (
                    <button
                      type="button"
                      onClick={(e) => onBadgeClick(record, 'sekai', e)}
                      className="px-1.5 py-0.5 rounded-md font-bold border transition-all shadow-2xs cursor-pointer hover:opacity-80 active:scale-95"
                      style={{
                        backgroundColor: unitMeta.bgColor,
                        borderColor: unitMeta.borderColor,
                        color: unitMeta.textColor || unitMeta.themeColor,
                      }}
                    >
                      セカイ
                    </button>
                  )}
                  {record.vocalVersions.virtualSinger && (
                    <button
                      type="button"
                      onClick={(e) => onBadgeClick(record, 'vs', e)}
                      className="px-1.5 py-0.5 rounded-md font-bold border transition-all shadow-2xs cursor-pointer hover:opacity-80 active:scale-95"
                      style={{
                        backgroundColor: vsMeta.bgColor,
                        borderColor: vsMeta.borderColor,
                        color: vsMeta.textColor || vsMeta.themeColor,
                      }}
                    >
                      バチャシン
                    </button>
                  )}
                  {record.vocalVersions.connectLive && (
                    <button
                      type="button"
                      onClick={(e) => onBadgeClick(record, 'cl', e)}
                      className="px-1.5 py-0.5 rounded-md bg-sky-50 text-sky-700 border border-sky-200/60 font-bold shadow-2xs cursor-pointer hover:opacity-80 active:scale-95"
                    >
                      コネライ
                    </button>
                  )}
                  {record.vocalVersions.anotherVocal && (
                    <button
                      type="button"
                      onClick={(e) => onBadgeClick(record, 'av', e)}
                      className="px-1.5 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200/60 font-bold shadow-2xs cursor-pointer hover:opacity-80 active:scale-95"
                    >
                      アナボ
                    </button>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {/* モード表示ガイド */}
        {tapMode === 'detail' && (
          <span className="text-slate-400 group-hover:text-slate-600 text-xs hidden sm:inline font-medium">
            詳細 →
          </span>
        )}
      </div>
    );
  }
);
