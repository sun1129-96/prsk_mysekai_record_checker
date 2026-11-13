import type {
  RecordItem,
  SortType,
  SortDirection,
  FilterOptions,
  SavedCompareCondition,
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
  const isAllUnitsSelected =
    filterOptions.units.length === ALL_UNIT_KEYS.length &&
    ALL_UNIT_KEYS.every((u) => filterOptions.units.includes(u));
  const unitMatchMode = filterOptions.unitMatchType || 'or';
  const charMatchMode = filterOptions.characterMatchType || 'or';
  const vocalMatchMode = filterOptions.vocalMatchType || 'or';

  // 選択されている歌唱バージョンキーの抽出
  const selectedVocals: ('sekai' | 'virtualSinger' | 'connectLive' | 'anotherVocal' | 'inst')[] = [];
  if (filterOptions.vocalVersions.sekai) selectedVocals.push('sekai');
  if (filterOptions.vocalVersions.virtualSinger) selectedVocals.push('virtualSinger');
  if (filterOptions.vocalVersions.connectLive) selectedVocals.push('connectLive');
  if (filterOptions.vocalVersions.anotherVocal) selectedVocals.push('anotherVocal');
  if (filterOptions.vocalVersions.inst) selectedVocals.push('inst');

  return records
    .filter((record) => {
      const isOwned = !!ownedRecordIds[record.id];

      // 1. 所持ステータス絞り込み
      if (filterOptions.ownership === 'owned' && !isOwned) return false;
      if (filterOptions.ownership === 'unowned' && isOwned) return false;

      // 2. 検索クエリ
      if (filterOptions.searchQuery.trim() !== '') {
        const q = filterOptions.searchQuery.toLowerCase();
        const matchTitle = record.title.toLowerCase().includes(q);
        const matchReading = record.reading.toLowerCase().includes(q);
        if (!matchTitle && !matchReading) return false;
      }

      // 3. 対象ユニット絞り込み
      if (filterOptions.units.length === 0) {
        return false;
      }
      const recordUnits =
        record.units && record.units.length > 0 ? record.units : [record.unit];
      if (unitMatchMode === 'and') {
        const hasAllUnits = filterOptions.units.every((u) => recordUnits.includes(u));
        if (!hasAllUnits) return false;
      } else {
        if (!isAllUnitsSelected) {
          const hasAnyUnit = recordUnits.some((u) => filterOptions.units.includes(u));
          if (!hasAnyUnit) return false;
        }
      }

      // 4. 歌唱キャラクター絞り込み
      if (filterOptions.characters.length > 0) {
        if (charMatchMode === 'and_same_track') {
          // 1つの歌唱バージョン（トラック）で選択キャラ全員が歌唱しているか
          const tracks = record.vocalTracks || [];
          const hasTrackWithAllChars = tracks.some((track) =>
            filterOptions.characters.every((cId) => track.singers && track.singers.includes(cId))
          );
          if (!hasTrackWithAllChars) return false;
        } else if (charMatchMode === 'and_all') {
          // 曲全体（いずれかのVer）で選択キャラ全員が存在するか
          const hasAllCharsInSong = filterOptions.characters.every((cId) =>
            record.characters.includes(cId)
          );
          if (!hasAllCharsInSong) return false;
        } else {
          // OR: 選択キャラのいずれかが歌唱しているか
          const hasAnyChar = filterOptions.characters.some((cId) =>
            record.characters.includes(cId)
          );
          if (!hasAnyChar) return false;
        }
      }

      // 5. 歌唱バージョン条件絞り込み
      if (selectedVocals.length > 0) {
        if (vocalMatchMode === 'and') {
          const hasAllVocals = selectedVocals.every((vKey) => Boolean(record.vocalVersions[vKey]));
          if (!hasAllVocals) return false;
        } else {
          const hasAnyVocal = selectedVocals.some((vKey) => Boolean(record.vocalVersions[vKey]));
          if (!hasAnyVocal) return false;
        }
      }

      // 6. 楽曲分類（書き下ろし種別）
      if (filterOptions.originalTypes && filterOptions.originalTypes.length > 0) {
        const type = record.originalType || 'cover';
        if (!filterOptions.originalTypes.includes(type)) return false;
      }

      // 7. バナーキャラクター
      if (filterOptions.bannerCharacters && filterOptions.bannerCharacters.length > 0) {
        if (!record.bannerCharacter || !filterOptions.bannerCharacters.includes(record.bannerCharacter)) {
          return false;
        }
      }

      // 8. 実装年
      if (filterOptions.releaseYears && filterOptions.releaseYears.length > 0) {
        const year = getAnniversaryYear(record.releaseDate);
        if (!filterOptions.releaseYears.includes(year)) return false;
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

/**
 * カスタム比較条件に合致するか判定（各条件枠ごとの AND / OR 条件評価、条件間はすべて AND）
 */
export const checkRecordMatchesCustomCondition = (
  record: RecordItem,
  cond: SavedCompareCondition
): boolean => {
  const units = cond.conditionUnits || [];
  const characters = cond.conditionCharacters || [];
  const originalTypes = cond.conditionOriginalTypes || [];
  const vocalTypes = cond.conditionVocalTypes || [];
  const bannerCharacters = cond.conditionBannerCharacters || [];
  const releaseYears = cond.conditionReleaseYears || [];

  const hasSpecificConditions =
    units.length > 0 ||
    characters.length > 0 ||
    originalTypes.length > 0 ||
    vocalTypes.length > 0 ||
    bannerCharacters.length > 0 ||
    releaseYears.length > 0;

  if (!hasSpecificConditions) {
    return true;
  }

  // 過去の保存データで全体ORが指定され、個別MatchTypeが未定義の場合の後方互換
  const isLegacyGlobalOr =
    cond.matchType === 'or' &&
    !cond.unitMatchType &&
    !cond.characterMatchType &&
    !cond.vocalMatchType;

  if (isLegacyGlobalOr) {
    const legacyResults: boolean[] = [];
    if (units.length > 0) {
      const recordUnits = record.units && record.units.length > 0 ? record.units : [record.unit];
      legacyResults.push(recordUnits.some((u) => units.includes(u)));
    }
    if (characters.length > 0) {
      legacyResults.push(characters.some((c) => record.characters.includes(c)));
    }
    if (originalTypes.length > 0) {
      const type = record.originalType || 'cover';
      legacyResults.push(originalTypes.includes(type));
    }
    if (vocalTypes.length > 0) {
      const hasAny = vocalTypes.some((vt) => Boolean(record.vocalVersions?.[vt]));
      legacyResults.push(hasAny);
    }
    if (bannerCharacters.length > 0) {
      legacyResults.push(Boolean(record.bannerCharacter && bannerCharacters.includes(record.bannerCharacter)));
    }
    if (releaseYears.length > 0) {
      const year = getAnniversaryYear(record.releaseDate);
      legacyResults.push(releaseYears.includes(year));
    }
    return legacyResults.some((r) => r === true);
  }

  // 1. ユニット判定
  if (units.length > 0) {
    const recordUnits = record.units && record.units.length > 0 ? record.units : [record.unit];
    if (cond.unitMatchType === 'and') {
      const hasAll = units.every((u) => recordUnits.includes(u));
      if (!hasAll) return false;
    } else {
      const hasAny = recordUnits.some((u) => units.includes(u));
      if (!hasAny) return false;
    }
  }

  // 2. キャラクター判定
  if (characters.length > 0) {
    if (cond.characterMatchType === 'and_same_track') {
      const tracks = record.vocalTracks || [];
      const hasSameTrack = tracks.some((track) =>
        characters.every((cId) => track.singers && track.singers.includes(cId))
      );
      if (!hasSameTrack) return false;
    } else if (cond.characterMatchType === 'and_all') {
      const hasAll = characters.every((cId) => record.characters.includes(cId));
      if (!hasAll) return false;
    } else {
      const hasAny = characters.some((cId) => record.characters.includes(cId));
      if (!hasAny) return false;
    }
  }

  // 3. 歌唱バージョン判定
  if (vocalTypes.length > 0) {
    if (cond.vocalMatchType === 'and') {
      const hasAll = vocalTypes.every((vt) => Boolean(record.vocalVersions?.[vt]));
      if (!hasAll) return false;
    } else {
      const hasAny = vocalTypes.some((vt) => Boolean(record.vocalVersions?.[vt]));
      if (!hasAny) return false;
    }
  }

  // 4. 楽曲分類判定
  if (originalTypes.length > 0) {
    const type = record.originalType || 'cover';
    if (!originalTypes.includes(type)) return false;
  }

  // 5. バナーキャラクター判定
  if (bannerCharacters.length > 0) {
    if (!record.bannerCharacter || !bannerCharacters.includes(record.bannerCharacter)) {
      return false;
    }
  }

  // 6. 実装年判定
  if (releaseYears.length > 0) {
    const year = getAnniversaryYear(record.releaseDate);
    if (!releaseYears.includes(year)) return false;
  }

  return true;
};
