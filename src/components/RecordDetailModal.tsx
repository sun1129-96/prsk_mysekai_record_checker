import React, { useState, useEffect, useRef } from 'react';
import { X, Calendar, Hash, Music, Check } from 'lucide-react';
import type { RecordItem } from '../types/record';
import { UNIT_METAS, CHARACTERS, ORIGINAL_TYPE_METAS, getRecordJackets } from '../types/record';

interface RecordDetailModalProps {
  record: RecordItem | null;
  isOpen: boolean;
  onClose: () => void;
  isOwned: boolean;
  onToggleOwned: (id: string) => void;
  initialTrackId?: string | null;
  currentJacketIndex?: number;
  onSelectJacketIndex?: (recordId: string, index: number) => void;
}

export const RecordDetailModal: React.FC<RecordDetailModalProps> = ({
  record,
  isOpen,
  onClose,
  isOwned,
  onToggleOwned,
  initialTrackId,
  currentJacketIndex = 0,
  onSelectJacketIndex,
}) => {
  const tracksListRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState<number>(0);

  useEffect(() => {
    setActiveIndex(currentJacketIndex || 0);
  }, [record?.id, currentJacketIndex]);

  const handleSelectIndex = (idx: number) => {
    setActiveIndex(idx);
    if (record && onSelectJacketIndex) {
      onSelectJacketIndex(record.id, idx);
    }
  };

  // 指定された歌唱verが見えるように自動スクロール
  useEffect(() => {
    if (isOpen && initialTrackId) {
      const timer = setTimeout(() => {
        const targetEl = document.getElementById(`modal-track-${initialTrackId}`);
        if (targetEl) {
          targetEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen, initialTrackId, record?.id]);

  if (!isOpen || !record) return null;

  const unitMeta = UNIT_METAS[record.unit];

  // 歌唱トラック情報の整理（vocalTracks が未定義の場合は vocalVersions からフォールバック生成）
  const tracks =
    record.vocalTracks && record.vocalTracks.length > 0
      ? record.vocalTracks
      : [
          ...(record.vocalVersions.sekai
            ? [{ id: 'sekai', name: 'セカイver', type: 'sekai' as const, singers: record.characters }]
            : []),
          ...(record.vocalVersions.virtualSinger
            ? [{ id: 'vs', name: 'バーチャル・シンガーver', type: 'virtual_singer' as const, singers: ['miku'] }]
            : []),
          ...(record.vocalVersions.connectLive
            ? [{ id: 'cl', name: 'コネクトライブver', type: 'connect_live' as const, singers: record.characters.slice(0, 2) }]
            : []),
          ...(record.vocalVersions.movie
            ? [{ id: 'movie', name: '「劇場版プロジェクトセカイ」ver.', type: 'movie' as const, singers: record.characters }]
            : []),
          ...(record.vocalVersions.anotherVocal
            ? [{ id: 'av', name: 'アナザーボーカルver', type: 'another_vocal' as const, singers: [record.characters[0] || 'ichika'] }]
            : []),
          ...(record.vocalVersions.inst
            ? [{ id: 'inst', name: 'Inst. ver.', type: 'inst' as const, singers: [] }]
            : []),
        ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="bg-white rounded-3xl max-w-sm w-full shadow-2xl overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
        {/* 上部ヘッダー */}
        <div className="relative p-6 pb-4 bg-gradient-to-b from-slate-50 to-white flex flex-col items-center border-b border-slate-100 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors cursor-pointer"
            aria-label="閉じる"
          >
            <X className="w-5 h-5" />
          </button>

          {/* ジャケットプレビュー */}
          {(() => {
            const jackets = getRecordJackets(record);
            const hasMultiple = jackets.length > 1;
            const safeIndex = jackets.length > 0 ? (activeIndex % jackets.length + jackets.length) % jackets.length : 0;
            const currentJacket = jackets[safeIndex] || { url: record.jacketUrl || '', label: '通常' };

            return (
              <div className="flex flex-col items-center mb-3">
                <div
                  onClick={() => {
                    if (hasMultiple) {
                      handleSelectIndex((safeIndex + 1) % jackets.length);
                    }
                  }}
                  className={`w-24 h-24 rounded-2xl flex items-center justify-center shadow-md overflow-hidden relative bg-slate-100 ${
                    hasMultiple ? 'cursor-pointer hover:ring-2 hover:ring-[#33ccbb]/60 active:scale-95 transition-all' : ''
                  }`}
                  style={{
                    border: `2px solid ${unitMeta.borderColor}`,
                  }}
                  title={hasMultiple ? `クリックでジャケットを切り替え（現在: ${currentJacket.label}）` : undefined}
                >
                  {currentJacket.url ? (
                    <img
                      key={currentJacket.url}
                      src={currentJacket.url}
                      alt={record.title}
                      className="w-full h-full object-cover transition-opacity duration-150"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                      onLoad={(e) => {
                        (e.target as HTMLImageElement).style.display = '';
                      }}
                    />
                  ) : (
                    <Music className="w-10 h-10" style={{ color: unitMeta.textColor || (unitMeta.themeColor === '#FFFFFF' ? '#94a3b8' : unitMeta.themeColor) }} />
                  )}
                </div>

                {/* 複数ジャケットが存在する場合の切り替えタブ（3枚以上にも動的対応） */}
                {hasMultiple && (
                  <div className="flex items-center gap-1 mt-2 bg-slate-100 p-1 rounded-xl text-[10px] font-bold flex-wrap justify-center max-w-[280px]">
                    {jackets.map((j, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSelectIndex(idx)}
                        className={`px-2 py-0.5 rounded-lg transition-all ${
                          safeIndex === idx
                            ? 'bg-white text-[#0d9488] shadow-2xs font-extrabold'
                            : 'text-slate-500 hover:text-slate-700'
                        }`}
                      >
                        {j.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })()}

          {/* ユニットバッジ（複数ユニット対応・正式名称表示） */}
          <div className="flex flex-wrap items-center justify-center gap-1.5 mb-1.5 max-w-sm mx-auto">
            {(record.units && record.units.length > 0 ? record.units : [record.unit]).map((u) => {
              const uMeta = UNIT_METAS[u];
              if (!uMeta) return null;
              return (
                <span
                  key={u}
                  className="px-2.5 py-0.5 rounded-full text-[11px] font-bold"
                  style={{
                    backgroundColor: uMeta.bgColor,
                    color: uMeta.textColor || uMeta.themeColor,
                    border: `1px solid ${uMeta.borderColor}`,
                    textShadow: '0 0 2px #ffffff, 0 0 4px #ffffff',
                  }}
                >
                  {uMeta.name}
                </span>
              );
            })}
          </div>

          {/* 書き下ろし楽曲のみ表示する楽曲分類・バナーキャラ情報 */}
          {record.originalType && record.originalType !== 'cover' && (
            <div className="flex flex-wrap items-center justify-center gap-1.5 mb-1.5">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#33ccbb]/15 text-[#0d9488] border border-[#33ccbb]/30">
                {ORIGINAL_TYPE_METAS[record.originalType]?.label || record.originalType}
              </span>
              {record.bannerCharacter && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                  {(() => {
                    const bChar = CHARACTERS.find((c) => c.id === record.bannerCharacter);
                    return (
                      <>
                        {bChar && (
                          <span
                            className="w-2 h-2 rounded-full shrink-0 border border-black/10"
                            style={{ backgroundColor: bChar.color }}
                          />
                        )}
                        <span>{bChar ? bChar.name : record.bannerCharacter} バナー</span>
                      </>
                    );
                  })()}
                </span>
              )}
            </div>
          )}

          <h3 className="text-base font-bold text-slate-800 text-center tracking-tight">
            {record.title}
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">{record.reading}</p>
        </div>

        {/* 詳細データ（スクロール領域） */}
        <div className="p-5 space-y-4 text-xs overflow-y-auto flex-1">
          {/* 実装日 & 実装順 */}
          <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-2xl border border-slate-100">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-slate-400" />
              <div>
                <span className="block text-slate-400 text-[10px]">実装日</span>
                <span className="font-semibold text-slate-700">{record.releaseDate}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Hash className="w-4 h-4 text-slate-400" />
              <div>
                <span className="block text-slate-400 text-[10px]">実装順</span>
                <span className="font-semibold text-slate-700">No. {record.defaultOrder}</span>
              </div>
            </div>
          </div>

          {/* 収録歌唱バージョン（横1列・縦並び・スクロールバー対応） */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-slate-700">収録歌唱バージョン</span>
              <span className="text-[10px] text-slate-400 font-medium">
                {tracks.length}トラック
              </span>
            </div>

            <div ref={tracksListRef} className="space-y-2 max-h-52 overflow-y-auto pr-1">
              {tracks.length === 0 ? (
                <div className="p-3 text-center text-slate-400 bg-slate-50 rounded-xl">
                  歌唱トラック情報がありません
                </div>
              ) : (
                tracks.map((track) => {
                  const singerObjs = track.singers.map((s) => {
                    const found = CHARACTERS.find((c) => c.id === s || c.name === s);
                    if (found) return found;
                    return {
                      id: s,
                      name: s,
                      unit: 'virtual_singer' as const,
                      color: '#10b981',
                    };
                  });

                  // アナザーボーカルverの場合はタイトルに(キャラ名)を表示しない
                  const displayTrackName =
                    track.type === 'another_vocal'
                      ? track.name.replace(/\s*\([^)]*\)/g, '').trim() || 'アナザーボーカルver'
                      : track.name;

                  const isTargetTrack = track.id === initialTrackId;

                  return (
                    <div
                      key={track.id}
                      id={`modal-track-${track.id}`}
                      className={`p-2.5 rounded-xl border transition-all space-y-1.5 ${
                        isTargetTrack
                          ? 'border-[#33ccbb] bg-teal-50/70 shadow-xs ring-2 ring-[#33ccbb]/30'
                          : 'border-slate-200/80 bg-slate-50/60 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`font-bold text-xs ${isTargetTrack ? 'text-[#0d9488]' : 'text-slate-800'}`}>
                          {displayTrackName}
                        </span>
                      </div>

                      {/* 歌唱者チップ一覧 */}
                      {singerObjs.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1">
                          {singerObjs.map((char) => (
                            <span
                              key={char!.id}
                              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-white border border-slate-200/60 text-[10px] font-medium text-slate-700 shadow-2xs"
                            >
                              <span
                                className="w-1.5 h-1.5 rounded-full"
                                style={{ backgroundColor: char!.color }}
                              />
                              <span>{char!.name}</span>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* 所持状態トグルボタン */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex gap-2 shrink-0">
          <button
            onClick={() => onToggleOwned(record.id)}
            className={`w-full py-3 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-xs ${
              isOwned
                ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
                : 'bg-white hover:bg-slate-50 border-2 border-slate-300 text-slate-700'
            }`}
          >
            <Check className={`w-4 h-4 ${isOwned ? 'text-white' : 'text-slate-400'}`} />
            <span>{isOwned ? '所持中（チェック解除する）' : '所持済みにする'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
