import { X, Calendar, Hash, Music, Check, ShoppingBag } from 'lucide-react';
import type { RecordItem } from '../types/record';
import { UNIT_METAS } from '../types/record';

interface RecordDetailModalProps {
  record: RecordItem | null;
  isOpen: boolean;
  onClose: () => void;
  isOwned: boolean;
  onToggleOwned: (id: string) => void;
}

export const RecordDetailModal: React.FC<RecordDetailModalProps> = ({
  record,
  isOpen,
  onClose,
  isOwned,
  onToggleOwned,
}) => {
  if (!isOpen || !record) return null;

  const unitMeta = UNIT_METAS[record.unit];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="bg-white rounded-3xl max-w-sm w-full shadow-2xl overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
        {/* 上部ヘッダー */}
        <div className="relative p-6 pb-4 bg-gradient-to-b from-slate-50 to-white flex flex-col items-center border-b border-slate-100">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-200/50"
          >
            <X className="w-5 h-5" />
          </button>

          {/* ジャケットプレビュー */}
          <div
            className="w-24 h-24 rounded-2xl flex items-center justify-center shadow-md mb-3"
            style={{
              background: `linear-gradient(135deg, ${unitMeta.themeColor}33, ${unitMeta.themeColor}11)`,
              border: `2px solid ${unitMeta.borderColor}`,
            }}
          >
            <Music className="w-10 h-10" style={{ color: unitMeta.themeColor }} />
          </div>

          {/* ユニットバッジ */}
          <span
            className="px-2.5 py-0.5 rounded-full text-[11px] font-bold mb-1.5"
            style={{
              backgroundColor: unitMeta.bgColor,
              color: unitMeta.themeColor,
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

        {/* 詳細データ */}
        <div className="p-5 space-y-4 text-xs">
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
                <span className="block text-slate-400 text-[10px]">マイセカイ順</span>
                <span className="font-semibold text-slate-700">No. {record.defaultOrder}</span>
              </div>
            </div>
          </div>

          {/* 歌唱バージョン情報 */}
          <div>
            <span className="block font-bold text-slate-700 mb-2">収録歌唱バージョン</span>
            <div className="grid grid-cols-2 gap-2">
              <div
                className={`p-2 rounded-xl border flex items-center justify-between ${
                  record.vocalVersions.sekai
                    ? 'bg-emerald-50/60 border-emerald-200 text-emerald-800'
                    : 'bg-slate-50/50 border-slate-200/50 text-slate-400'
                }`}
              >
                <span>セカイver</span>
                {record.vocalVersions.sekai && <Check className="w-3.5 h-3.5" />}
              </div>

              <div
                className={`p-2 rounded-xl border flex items-center justify-between ${
                  record.vocalVersions.virtualSinger
                    ? 'bg-emerald-50/60 border-emerald-200 text-emerald-800'
                    : 'bg-slate-50/50 border-slate-200/50 text-slate-400'
                }`}
              >
                <span>バーチャルシンガー</span>
                {record.vocalVersions.virtualSinger && <Check className="w-3.5 h-3.5" />}
              </div>

              <div
                className={`p-2 rounded-xl border flex items-center justify-between ${
                  record.vocalVersions.connectLive
                    ? 'bg-sky-50/60 border-sky-200 text-sky-800'
                    : 'bg-slate-50/50 border-slate-200/50 text-slate-400'
                }`}
              >
                <span>コネクトライブver</span>
                {record.vocalVersions.connectLive && <Check className="w-3.5 h-3.5" />}
              </div>

              <div
                className={`p-2 rounded-xl border flex items-center justify-between ${
                  record.vocalVersions.anotherVocal
                    ? 'bg-amber-50/60 border-amber-200 text-amber-800'
                    : 'bg-slate-50/50 border-slate-200/50 text-slate-400'
                }`}
              >
                <span>アナザーボーカル</span>
                {record.vocalVersions.anotherVocal && <Check className="w-3.5 h-3.5" />}
              </div>
            </div>
          </div>

          {/* 入手方法 */}
          {record.source && (
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 text-slate-600 border border-slate-100">
              <ShoppingBag className="w-4 h-4 text-slate-400" />
              <span>入手方法: {record.source}</span>
            </div>
          )}
        </div>

        {/* 所持状態トグルボタン */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex gap-2">
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
