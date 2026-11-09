import type {
  RecordItem,
  SortType,
  SortDirection,
  FilterOptions,
} from '../types/record';

/**
 * 達成率・所持率の計算結果
 */
export interface ProgressResult {
  total: number;
  owned: number;
  percentage: number;
  percentageString: string;
}

/**
 * 全体または指定リストの所持率を計算する
 */
export const calculateProgress = (
  records: RecordItem[],
  ownedRecordIds: Record<string, boolean>
): ProgressResult => {
  const total = records.length;
  if (total === 0) {
    return { total: 0, owned: 0, percentage: 0, percentageString: '0.0' };
  }
  const owned = records.filter((r) => !!ownedRecordIds[r.id]).length;
  const percentage = (owned / total) * 100;
  return {
    total,
    owned,
    percentage,
    percentageString: percentage.toFixed(1),
  };
};

/**
 * プロセカの周年（9月30日）を基準とした「○年目」を計算する
 * 1年目: 2020-09-30 〜 2021-09-29
 * 2年目: 2021-09-30 〜 2022-09-29 ...
 */
export const getAnniversaryYear = (dateStr: string): number => {
  const parts = dateStr.split('-');
  if (parts.length < 3) return 1;
  const y = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);
  const d = parseInt(parts[2], 10);

  const isAfterSep30 = m > 9 || (m === 9 && d >= 30);
  const annivYear = isAfterSep30 ? y - 2020 + 1 : y - 2020;
  return Math.max(1, annivYear);
};

/**
 * レコードのフィルタリングとソート処理
 */
export const filterAndSortRecords = (
  records: RecordItem[],
  ownedRecordIds: Record<string, boolean>,
  sortType: SortType,
  sortDirection: SortDirection,
  filterOptions: FilterOptions
): RecordItem[] => {
  return records
    .filter((record) => {
      const isOwned = !!ownedRecordIds[record.id];

      // 所持ステータス絞り込み
      if (filterOptions.ownership === 'owned' && !isOwned) return false;
      if (filterOptions.ownership === 'unowned' && isOwned) return false;

      // ユニット絞り込み
      if (!filterOptions.units.includes(record.unit)) return false;

      // キャラクター絞り込み
      if (filterOptions.characters.length > 0) {
        const hasChar = filterOptions.characters.some((cId) =>
          record.characters.includes(cId)
        );
        if (!hasChar) return false;
      }

      // 歌唱ver絞り込み
      if (filterOptions.vocalVersions.sekai && !record.vocalVersions.sekai) return false;
      if (filterOptions.vocalVersions.virtualSinger && !record.vocalVersions.virtualSinger)
        return false;
      if (filterOptions.vocalVersions.connectLive && !record.vocalVersions.connectLive)
        return false;
      if (filterOptions.vocalVersions.anotherVocal && !record.vocalVersions.anotherVocal)
        return false;

      // 書き下ろし種別絞り込み
      if (filterOptions.originalTypes && filterOptions.originalTypes.length > 0) {
        const type = record.originalType || 'cover';
        if (!filterOptions.originalTypes.includes(type)) return false;
      }

      // バナーキャラクター絞り込み
      if (filterOptions.bannerCharacters && filterOptions.bannerCharacters.length > 0) {
        if (!record.bannerCharacter || !filterOptions.bannerCharacters.includes(record.bannerCharacter)) {
          return false;
        }
      }

      // 検索クエリ（曲名・よみがな）
      if (filterOptions.searchQuery.trim() !== '') {
        const q = filterOptions.searchQuery.toLowerCase();
        const matchTitle = record.title.toLowerCase().includes(q);
        const matchReading = record.reading.toLowerCase().includes(q);
        if (!matchTitle && !matchReading) return false;
      }

      return true;
    })
    .sort((a, b) => {
      let compare = 0;
      if (sortType === 'defaultSort') {
        compare = (a.defaultSort ?? a.defaultOrder) - (b.defaultSort ?? b.defaultOrder);
      } else if (sortType === 'defaultOrder') {
        compare = a.defaultOrder - b.defaultOrder;
      } else if (sortType === 'releaseDate') {
        compare = a.releaseDate.localeCompare(b.releaseDate);
      } else if (sortType === 'reading') {
        compare = a.reading.localeCompare(b.reading, 'ja');
      }
      return sortDirection === 'asc' ? compare : -compare;
    });
};

/**
 * 所持リストをURL共有・共有コード用文字列（BitSet Base64URL、約122文字）に圧縮エンコードする
 */
export const encodeShareData = (
  ownedRecordIds: Record<string, boolean>,
  totalCount: number = 727
): string => {
  // レコードIDから最大番号を特定（デフォルト727以上ならそれに合わせる）
  let maxOrder = totalCount;
  for (const id of Object.keys(ownedRecordIds)) {
    if (ownedRecordIds[id] && id.startsWith('rec_')) {
      const order = parseInt(id.replace('rec_', ''), 10);
      if (!isNaN(order) && order > maxOrder) {
        maxOrder = order;
      }
    }
  }

  const byteLength = Math.ceil(maxOrder / 8);
  const bytes = new Uint8Array(byteLength);

  for (let order = 1; order <= maxOrder; order++) {
    if (ownedRecordIds[`rec_${order}`]) {
      const byteIdx = Math.floor((order - 1) / 8);
      const bitIdx = (order - 1) % 8;
      bytes[byteIdx] |= 1 << bitIdx;
    }
  }

  // Uint8Array を Base64URL 文字列に変換
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const base64 = btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  return `b1_${base64}`;
};

/**
 * 共有文字列（BitSet または 旧形式JSON Base64）から所持マップを復元する
 */
export const decodeShareData = (shareString: string): Record<string, boolean> => {
  if (!shareString) return {};
  const trimmed = shareString.trim();

  // 新形式: BitSet (プレフィックス b1_)
  if (trimmed.startsWith('b1_')) {
    try {
      const b64 = trimmed
        .slice(3)
        .replace(/-/g, '+')
        .replace(/_/g, '/');
      // パディング復元
      const padLen = (4 - (b64.length % 4)) % 4;
      const paddedB64 = b64 + '='.repeat(padLen);
      const binary = atob(paddedB64);
      const map: Record<string, boolean> = {};

      for (let byteIdx = 0; byteIdx < binary.length; byteIdx++) {
        const byteVal = binary.charCodeAt(byteIdx);
        for (let bitIdx = 0; bitIdx < 8; bitIdx++) {
          if ((byteVal & (1 << bitIdx)) !== 0) {
            const order = byteIdx * 8 + bitIdx + 1;
            map[`rec_${order}`] = true;
          }
        }
      }
      return map;
    } catch {
      return {};
    }
  }

  // 旧形式: JSON配列のBase64エンコード（後方互換性）
  try {
    const decoded = decodeURIComponent(atob(trimmed));
    const list: string[] = JSON.parse(decoded);
    const map: Record<string, boolean> = {};
    if (Array.isArray(list)) {
      list.forEach((id) => {
        if (typeof id === 'string') {
          map[id] = true;
        }
      });
    }
    return map;
  } catch {
    return {};
  }
};
