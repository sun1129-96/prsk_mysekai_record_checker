import React, { useEffect, useRef } from 'react';
import { X, Calendar, Hash, Music, Check } from 'lucide-react';
import type { RecordItem } from '../types/record';
import { UNIT_METAS, CHARACTERS } from '../types/record';

interface RecordDetailModalProps {
  record: RecordItem | null;
  isOpen: boolean;
  onClose: () => void;
  isOwned: boolean;
  onToggleOwned: (id: string) => void;
  initialTrackId?: string | null;
}

export const RecordDetailModal: React.FC<RecordDetailModalProps> = ({
  record,
  isOpen,
  onClose,
  isOwned,
  onToggleOwned,
  initialTrackId,
}) => {
  const tracksListRef = useRef<HTMLDivElement>(null);

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
          ...(record.vocalVersions.anotherVocal
            ? [{ id: 'av', name: 'アナザーボーカルver', type: 'another_vocal' as const, singers: [record.characters[0] || 'ichika'] }]
            : []),
        ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="bg-white rounded-3xl max-w-sm w-full shadow-2xl overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
        {/* 上部ヘッダー */}
        <div className="relative p-6 pb-4 bg-gradient-to-b from-slate-50 to-white flex flex-col items-center border-b border-slate-100 shrink-0">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-200/50"
          >
            <X className="w-5 h-5" />
          </button>

          {/* ジャケットプレビュー */}
          <div
            className="w-24 h-24 rounded-2xl flex items-center justify-center shadow-md mb-3 overflow-hidden relative bg-slate-100"
            style={{
              border: `2px solid ${unitMeta.borderColor}`,
            }}
          >
            {record.jacketUrl ? (
              <img
                src={record.jacketUrl}
                alt={record.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            ) : (
              <Music className="w-10 h-10" style={{ color: unitMeta.textColor || (unitMeta.themeColor === '#FFFFFF' ? '#94a3b8' : unitMeta.themeColor) }} />
            )}
          </div>

          {/* ユニットバッジ */}
          <span
            className="px-2.5 py-0.5 rounded-full text-[11px] font-bold mb-1.5"
            style={{
              backgroundColor: unitMeta.bgColor,
              color: unitMeta.textColor || unitMeta.themeColor,
              border: `1px solid ${unitMeta.borderColor}`,
            }}
          >
            {unitMeta.name}
          </span>

          <h3 className="text-base font-bold text-slate-800 text-center tracking-tight">
            {record.title}
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">{record.reading}</p>
        </div>

        {/* 詳細データ（スクロール領域） */}
        <div className="p-5 space-y-4 text-xs overflow-y-auto flex-1">
          {/* 配信日 & 実装順 */}
          <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-2xl border border-slate-100">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-slate-400" />
              <div>
                <span className="block text-slate-400 text-[10px]">配信日</span>
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
                        <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
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
