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
const ALL_UNIT_KEYS: RecordItem['unit'][] = [
  'virtual_singer',
  'leo_need',
  'more_more_jump',
  'vivid_bad_squad',
  'wonderlands_showtime',
  'nightcord_at_25',
  'other',
];

export const filterAndSortRecords = (
  records: RecordItem[],
  ownedRecordIds: Record<string, boolean>,
  sortType: SortType,
  sortDirection: SortDirection,
  filterOptions: FilterOptions
): RecordItem[] => {
  const matchType = filterOptions.matchType || 'and';
  const isUnitFiltered =
    filterOptions.units.length === 0 ||
    !ALL_UNIT_KEYS.every((u) => filterOptions.units.includes(u));
  const isCharFiltered = filterOptions.characters.length > 0;
  const isVocalFiltered = Boolean(
    filterOptions.vocalVersions.sekai ||
    filterOptions.vocalVersions.virtualSinger ||
    filterOptions.vocalVersions.connectLive ||
    filterOptions.vocalVersions.anotherVocal
  );
  const isOriginalTypeFiltered = Boolean(filterOptions.originalTypes && filterOptions.originalTypes.length > 0);
  const isBannerFiltered = Boolean(filterOptions.bannerCharacters && filterOptions.bannerCharacters.length > 0);
  const isYearFiltered = Boolean(filterOptions.releaseYears && filterOptions.releaseYears.length > 0);

  return records
    .filter((record) => {
      const isOwned = !!ownedRecordIds[record.id];

      // 所持ステータス絞り込み（基本フィルター）
      if (filterOptions.ownership === 'owned' && !isOwned) return false;
      if (filterOptions.ownership === 'unowned' && isOwned) return false;

      // 検索クエリ（基本フィルター）
      if (filterOptions.searchQuery.trim() !== '') {
        const q = filterOptions.searchQuery.toLowerCase();
        const matchTitle = record.title.toLowerCase().includes(q);
        const matchReading = record.reading.toLowerCase().includes(q);
        if (!matchTitle && !matchReading) return false;
      }

      // AND / OR 対象の個別条件を評価
      const criteriaResults: boolean[] = [];

      // 1. ユニット
      if (isUnitFiltered) {
        criteriaResults.push(filterOptions.units.includes(record.unit));
      }

      // 2. キャラクター
      if (isCharFiltered) {
        const hasChar = filterOptions.characters.some((cId) =>
          record.characters.includes(cId)
        );
        criteriaResults.push(hasChar);
      }

      // 3. 歌唱ver
      if (isVocalFiltered) {
        const vocalMatch =
          (filterOptions.vocalVersions.sekai && record.vocalVersions.sekai) ||
          (filterOptions.vocalVersions.virtualSinger && record.vocalVersions.virtualSinger) ||
          (filterOptions.vocalVersions.connectLive && record.vocalVersions.connectLive) ||
          (filterOptions.vocalVersions.anotherVocal && record.vocalVersions.anotherVocal);
        criteriaResults.push(Boolean(vocalMatch));
      }

      // 4. 書き下ろし種別
      if (isOriginalTypeFiltered && filterOptions.originalTypes) {
        const type = record.originalType || 'cover';
        criteriaResults.push(filterOptions.originalTypes.includes(type));
      }

      // 5. バナーキャラクター
      if (isBannerFiltered && filterOptions.bannerCharacters) {
        criteriaResults.push(
          Boolean(record.bannerCharacter && filterOptions.bannerCharacters.includes(record.bannerCharacter))
        );
      }

      // 6. 実装年
      if (isYearFiltered && filterOptions.releaseYears) {
        const year = getAnniversaryYear(record.releaseDate);
        criteriaResults.push(filterOptions.releaseYears.includes(year));
      }

      // どの条件も指定されていない場合は全件通過
      if (criteriaResults.length === 0) return true;

      return matchType === 'and'
        ? criteriaResults.every(Boolean)
        : criteriaResults.some(Boolean);
    })
    .sort((a, b) => {
      let compare = 0;
      if (sortType === 'defaultSort') {
        compare = (a.defaultSort ?? a.defaultOrder) - (b.defaultSort ?? b.defaultOrder);
      } else if (sortType === 'defaultOrder') {
        compare = a.defaultOrder - b.defaultOrder;
      } else if (sortType === 'releaseDate') {
        compare = a.releaseDate.localeCompare(b.releaseDate) || (a.defaultOrder - b.defaultOrder);
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
