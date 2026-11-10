import React from 'react';
import { Check, Calendar, Music, RotateCw } from 'lucide-react';
import type {
  RecordItem,
  UnitType,
  DisplaySettings,
  TapActionMode,
} from '../types/record';
import { UNIT_METAS, CHARACTERS, getRecordJackets } from '../types/record';

interface RecordRowProps {
  record: RecordItem;
  isOwned: boolean;
  displaySettings: DisplaySettings;
  tapMode: TapActionMode;
  jacketIndex?: number;
  onRowClick: (record: RecordItem) => void;
  onToggleOwned: (id: string) => void;
  onBadgeClick: (record: RecordItem, trackId: string, e: React.MouseEvent) => void;
  onRotateJacket?: (recordId: string, totalCount: number) => void;
}

export const RecordRow: React.FC<RecordRowProps> = React.memo(
  ({
    record,
    isOwned,
    displaySettings,
    tapMode,
    jacketIndex = 0,
    onRowClick,
    onToggleOwned,
    onBadgeClick,
    onRotateJacket,
  }) => {
    const unitMeta = UNIT_METAS[record.unit];
    const vsMeta = UNIT_METAS.virtual_singer;

    // バッジ共通のテキスト縁取りスタイル（視認性向上）
    const badgeTextShadow = '0 0 2px #ffffff, 0 0 4px #ffffff, 0.5px 0.5px 0 #ffffff, -0.5px -0.5px 0 #ffffff, 0.5px -0.5px 0 #ffffff, -0.5px 0.5px 0 #ffffff';

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
          background: `linear-gradient(105deg, ${c1.color}66 0%, ${c1.color}66 40%, ${c2.color}66 60%, ${c2.color}66 100%)`,
          borderColor,
          color: '#0f172a',
          textShadow: badgeTextShadow,
        };
      } else if (singers.length > 2) {
        const n = singers.length;
        const stops: string[] = [];
        singers.forEach((c, i) => {
          const startPct = Math.round((i / n) * 100);
          const endPct = Math.round(((i + 1) / n) * 100);
          const pad = Math.min(6, Math.floor(100 / n / 3));
          stops.push(`${c.color}66 ${startPct + (i === 0 ? 0 : pad)}%`);
          stops.push(`${c.color}66 ${endPct - (i === n - 1 ? 0 : pad)}%`);
        });
        return {
          background: `linear-gradient(105deg, ${stops.join(', ')})`,
          borderColor,
          color: '#0f172a',
          textShadow: badgeTextShadow,
        };
      } else if (singers.length === 1) {
        const c1 = singers[0];
        return {
          backgroundColor: `${c1.color}55`,
          borderColor,
          color: '#0f172a',
          textShadow: badgeTextShadow,
        };
      }
      return {
        backgroundColor: '#fffbeb',
        borderColor,
        color: '#b45309',
        textShadow: badgeTextShadow,
      };
    };

    const tracks = record.vocalTracks || [];

    // 楽曲のジャケット一覧を取得（2枚以上あれば切り替え可能）
    const jackets = getRecordJackets(record);
    const hasMultipleJackets = jackets.length > 1;
    const activeIndex = jackets.length > 0 ? (jacketIndex % jackets.length + jackets.length) % jackets.length : 0;
    const currentJacket = jackets[activeIndex] || { url: record.jacketUrl || '', label: '通常' };

    const handleJacketClick = (e: React.MouseEvent) => {
      if (hasMultipleJackets && onRotateJacket) {
        e.stopPropagation();
        onRotateJacket(record.id, jackets.length);
      }
    };

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
            onClick={hasMultipleJackets ? handleJacketClick : undefined}
            className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl shrink-0 flex items-center justify-center shadow-2xs overflow-hidden relative bg-slate-100 ${
              hasMultipleJackets ? 'cursor-pointer hover:ring-2 hover:ring-[#33ccbb]/60 active:scale-95 transition-all' : ''
            }`}
            style={{
              border: `1px solid ${unitMeta.borderColor}`,
            }}
            title={
              hasMultipleJackets
                ? `クリックでジャケットを切り替え（現在: ${currentJacket.label}）`
                : undefined
            }
          >
            {currentJacket.url ? (
              <img
                key={currentJacket.url}
                src={currentJacket.url}
                alt={record.title}
                loading="lazy"
                className="w-full h-full object-cover transition-opacity duration-150"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
                onLoad={(e) => {
                  (e.target as HTMLImageElement).style.display = '';
                }}
              />
            ) : (
              <Music className="w-5 h-5" style={{ color: unitMeta.textColor || unitMeta.themeColor }} />
            )}

            {/* 複数ジャケットが存在する場合の切り替え可能装飾（↻） */}
            {hasMultipleJackets && (
              <div
                className="absolute bottom-0.5 right-0.5 w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-slate-900/75 text-white flex items-center justify-center shadow-xs backdrop-blur-xs pointer-events-none"
                aria-hidden="true"
              >
                <RotateCw className="w-2 sm:w-2.5 h-2 sm:h-2.5" />
              </div>
            )}
          </div>
        )}

        {/* 曲情報 */}
        <div className="flex-1 min-w-0">
          {/* 上部ヘッダー（ユニット情報 ＆ 日付・No.） */}
          <div className="flex flex-wrap items-start justify-between gap-x-2 gap-y-1 mb-1 min-w-0">
            {/* ユニットバッジ表示エリア（表示領域が足りない場合は自然に折り返し） */}
            <div className="flex flex-wrap items-center gap-1 min-w-0 flex-1">
              <span className="text-[10px] font-bold text-slate-500 shrink-0 mr-0.5">
                ユニット
              </span>
              {(record.units && record.units.length > 0 ? record.units : [record.unit]).map((u) => {
                const uMeta = UNIT_METAS[u];
                if (!uMeta) return null;
                return (
                  <span
                    key={u}
                    className="px-1.5 py-0.5 rounded-md text-[10px] font-bold shrink-0"
                    style={{
                      backgroundColor: uMeta.bgColor,
                      color: uMeta.textColor || uMeta.themeColor,
                      border: `1px solid ${uMeta.borderColor}`,
                      textShadow: badgeTextShadow,
                    }}
                  >
                    {uMeta.shortName}
                  </span>
                );
              })}
            </div>

            {/* 右側: リリース日 & No. (右端配置・重なり防止) */}
            <div className="flex items-center gap-1.5 shrink-0 text-slate-500 ml-auto pt-0.5">
              {displaySettings.showReleaseDate && (
                <span className="text-[10px] sm:text-[11px] text-slate-600 flex items-center gap-1 shrink-0 font-medium whitespace-nowrap">
                  <Calendar className="w-3 h-3 text-slate-400" />
                  {record.releaseDate}
                </span>
              )}

              <span className="text-[10px] text-slate-400 font-mono font-semibold shrink-0 whitespace-nowrap">
                No. {record.defaultOrder}
              </span>
            </div>
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
                          textShadow: badgeTextShadow,
                        }}
                        title={tapMode === 'detail' ? `${track.name} を詳細表示` : undefined}
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
                          textShadow: badgeTextShadow,
                        }}
                        title={tapMode === 'detail' ? `${track.name} を詳細表示` : undefined}
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
                        style={{ textShadow: badgeTextShadow }}
                        title={tapMode === 'detail' ? `${track.name} を詳細表示` : undefined}
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
                        title={tapMode === 'detail' ? `${track.name} を詳細表示` : undefined}
                      >
                        {singerUnits.map((uKey) => {
                          const uMeta = UNIT_METAS[uKey];
                          if (!uMeta) return null;
                          return uMeta.iconUrl ? (
                            <img
                              key={uKey}
                              src={uMeta.iconUrl}
                              alt={uMeta.name}
                              className="w-3.5 h-3.5 object-contain shrink-0"
                              style={{
                                filter:
                                  'drop-shadow(1px 0 0 #ffffff) drop-shadow(-1px 0 0 #ffffff) drop-shadow(0 1px 0 #ffffff) drop-shadow(0 -1px 0 #ffffff) drop-shadow(0 0 2px #ffffff)',
                              }}
                              title={uMeta.name}
                            />
                          ) : (
                            <span
                              key={uKey}
                              className="w-2 h-2 rounded-full shrink-0 border-2 border-white ring-1 ring-slate-400/80 shadow-2xs"
                              style={{ backgroundColor: uMeta.themeColor }}
                              title={uMeta.name}
                            />
                          );
                        })}
                        <span style={{ textShadow: badgeTextShadow }}>アナボ</span>
                      </button>
                    );
                  }
                  if (track.type === 'movie' || track.name.includes('劇場版')) {
                    return (
                      <button
                        type="button"
                        key={track.id}
                        onClick={(e) => onBadgeClick(record, track.id, e)}
                        className="px-1.5 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-300/80 font-bold shadow-2xs cursor-pointer hover:opacity-80 active:scale-95"
                        style={{ textShadow: badgeTextShadow }}
                        title={tapMode === 'detail' ? `${track.name} を詳細表示` : undefined}
                      >
                        劇場版
                      </button>
                    );
                  }
                  if (track.type === 'inst') {
                    return (
                      <button
                        type="button"
                        key={track.id}
                        onClick={(e) => onBadgeClick(record, track.id, e)}
                        className="px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-300 font-bold shadow-2xs cursor-pointer hover:opacity-80 active:scale-95"
                        style={{ textShadow: badgeTextShadow }}
                        title={tapMode === 'detail' ? `${track.name} を詳細表示` : undefined}
                      >
                        Inst
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
                        style={{ textShadow: badgeTextShadow }}
                        title={tapMode === 'detail' ? `${track.name} を詳細表示` : undefined}
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
                        textShadow: badgeTextShadow,
                      }}
                      title={tapMode === 'detail' ? 'セカイver を詳細表示' : undefined}
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
                        textShadow: badgeTextShadow,
                      }}
                      title={tapMode === 'detail' ? 'バーチャル・シンガーver を詳細表示' : undefined}
                    >
                      バチャシン
                    </button>
                  )}
                  {record.vocalVersions.connectLive && (
                    <button
                      type="button"
                      onClick={(e) => onBadgeClick(record, 'cl', e)}
                      className="px-1.5 py-0.5 rounded-md bg-sky-50 text-sky-700 border border-sky-200/60 font-bold shadow-2xs cursor-pointer hover:opacity-80 active:scale-95"
                      style={{ textShadow: badgeTextShadow }}
                      title={tapMode === 'detail' ? 'コネクトライブver を詳細表示' : undefined}
                    >
                      コネライ
                    </button>
                  )}
                  {record.vocalVersions.movie && (
                    <button
                      type="button"
                      onClick={(e) => onBadgeClick(record, 'movie', e)}
                      className="px-1.5 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-300/80 font-bold shadow-2xs cursor-pointer hover:opacity-80 active:scale-95"
                      style={{ textShadow: badgeTextShadow }}
                      title={tapMode === 'detail' ? '劇場版ver を詳細表示' : undefined}
                    >
                      劇場版
                    </button>
                  )}
                  {record.vocalVersions.anotherVocal && (
                    <button
                      type="button"
                      onClick={(e) => onBadgeClick(record, 'av', e)}
                      className="px-1.5 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200/60 font-bold shadow-2xs cursor-pointer hover:opacity-80 active:scale-95"
                      style={{ textShadow: badgeTextShadow }}
                      title={tapMode === 'detail' ? 'アナザーボーカルver を詳細表示' : undefined}
                    >
                      アナボ
                    </button>
                  )}
                  {record.vocalVersions.inst && (
                    <button
                      type="button"
                      onClick={(e) => onBadgeClick(record, 'inst', e)}
                      className="px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-300 font-bold shadow-2xs cursor-pointer hover:opacity-80 active:scale-95"
                      style={{ textShadow: badgeTextShadow }}
                      title={tapMode === 'detail' ? 'Inst. ver. を詳細表示' : undefined}
                    >
                      Inst
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
