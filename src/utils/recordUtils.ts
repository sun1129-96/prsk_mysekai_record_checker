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
      if (sortType === 'releaseDate') {
        compare = a.releaseDate.localeCompare(b.releaseDate);
      } else if (sortType === 'defaultOrder') {
        compare = a.defaultOrder - b.defaultOrder;
      } else if (sortType === 'reading') {
        compare = a.reading.localeCompare(b.reading, 'ja');
      }
      return sortDirection === 'asc' ? compare : -compare;
    });
};

/**
 * 所持リストをURL共有用文字列（Base64）にエンコードする
 */
export const encodeShareData = (ownedRecordIds: Record<string, boolean>): string => {
  const ownedList = Object.keys(ownedRecordIds).filter((id) => ownedRecordIds[id]);
  const json = JSON.stringify(ownedList);
  return btoa(encodeURIComponent(json));
};

/**
 * URL共有用文字列（Base64）から所持マップを復元する
 */
export const decodeShareData = (shareString: string): Record<string, boolean> => {
  try {
    const decoded = decodeURIComponent(atob(shareString));
    const list: string[] = JSON.parse(decoded);
    const map: Record<string, boolean> = {};
    if (Array.isArray(list)) {
      list.forEach((id) => {
        map[id] = true;
      });
    }
    return map;
  } catch {
    return {};
  }
};
