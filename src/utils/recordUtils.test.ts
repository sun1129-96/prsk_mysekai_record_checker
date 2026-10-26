import { describe, it, expect } from 'vitest';
import {
  calculateProgress,
  getAnniversaryYear,
  filterAndSortRecords,
  encodeShareData,
  decodeShareData,
} from './recordUtils';
import type { RecordItem, FilterOptions } from '../types/record';

const mockItems: RecordItem[] = [
  {
    id: 'rec_1',
    title: 'メルト',
    reading: 'めると',
    unit: 'virtual_singer',
    releaseDate: '2020-09-30',
    defaultOrder: 1,
    vocalVersions: { virtualSinger: true, sekai: false, connectLive: false, anotherVocal: false },
    characters: ['miku'],
  },
  {
    id: 'rec_2',
    title: 'ステラ',
    reading: 'すてら',
    unit: 'leo_need',
    releaseDate: '2020-10-09',
    defaultOrder: 2,
    vocalVersions: { virtualSinger: true, sekai: true, connectLive: false, anotherVocal: true },
    characters: ['ichika', 'saki', 'miku'],
  },
  {
    id: 'rec_3',
    title: 'トンデモワンダーズ',
    reading: 'とんでもわんだーず',
    unit: 'wonderlands_showtime',
    releaseDate: '2021-06-19',
    defaultOrder: 3,
    vocalVersions: { virtualSinger: false, sekai: true, connectLive: true, anotherVocal: true },
    characters: ['tsukasa', 'emu'],
  },
  {
    id: 'rec_4',
    title: '群青讃歌',
    reading: 'ぐんじょうさんか',
    unit: 'other',
    releaseDate: '2021-09-30',
    defaultOrder: 4,
    vocalVersions: { virtualSinger: true, sekai: true, connectLive: true, anotherVocal: false },
    characters: ['ichika', 'miku'],
  },
];

const defaultFilter: FilterOptions = {
  ownership: 'all',
  units: ['virtual_singer', 'leo_need', 'wonderlands_showtime', 'other'],
  characters: [],
  vocalVersions: { virtualSinger: false, sekai: false, connectLive: false, anotherVocal: false },
  searchQuery: '',
};

describe('calculateProgress', () => {
  it('未所持のときは0%を返す', () => {
    const res = calculateProgress(mockItems, {});
    expect(res.total).toBe(4);
    expect(res.owned).toBe(0);
    expect(res.percentageString).toBe('0.0');
  });

  it('一部所持のときに正しい達成率を計算する', () => {
    const res = calculateProgress(mockItems, { rec_1: true, rec_2: true });
    expect(res.total).toBe(4);
    expect(res.owned).toBe(2);
    expect(res.percentageString).toBe('50.0');
  });

  it('全曲所持のときは100.0%を返す', () => {
    const res = calculateProgress(mockItems, {
      rec_1: true,
      rec_2: true,
      rec_3: true,
      rec_4: true,
    });
    expect(res.total).toBe(4);
    expect(res.owned).toBe(4);
    expect(res.percentageString).toBe('100.0');
  });
});

describe('getAnniversaryYear', () => {
  it('サービス開始日 (2020-09-30) は1年目', () => {
    expect(getAnniversaryYear('2020-09-30')).toBe(1);
  });

  it('1周年直前 (2021-09-29) は1年目', () => {
    expect(getAnniversaryYear('2021-09-29')).toBe(1);
  });

  it('1周年当日 (2021-09-30) は2年目', () => {
    expect(getAnniversaryYear('2021-09-30')).toBe(2);
  });

  it('3周年以降 (2023-10-01) は4年目', () => {
    expect(getAnniversaryYear('2023-10-01')).toBe(4);
  });
});

describe('filterAndSortRecords', () => {
  it('所持ステータスで絞り込める', () => {
    const ownedMap = { rec_1: true };
    const res = filterAndSortRecords(
      mockItems,
      ownedMap,
      'releaseDate',
      'desc',
      { ...defaultFilter, ownership: 'owned' }
    );
    expect(res.length).toBe(1);
    expect(res[0].id).toBe('rec_1');
  });

  it('歌唱キャラクターで絞り込める', () => {
    const res = filterAndSortRecords(
      mockItems,
      {},
      'releaseDate',
      'asc',
      { ...defaultFilter, characters: ['tsukasa'] }
    );
    expect(res.length).toBe(1);
    expect(res[0].id).toBe('rec_3');
  });

  it('五十音順で昇順・降順に正しくソートできる', () => {
    // 昇順: ぐんじょうさんか(rec_4) -> すてら(rec_2) -> とんでもわんだーず(rec_3) -> めると(rec_1)
    const ascRes = filterAndSortRecords(
      mockItems,
      {},
      'reading',
      'asc',
      defaultFilter
    );
    expect(ascRes[0].id).toBe('rec_4');
    expect(ascRes[ascRes.length - 1].id).toBe('rec_1');

    // 降順: めると(rec_1) -> とんでもわんだーず(rec_3) ... -> ぐんじょうさんか(rec_4)
    const descRes = filterAndSortRecords(
      mockItems,
      {},
      'reading',
      'desc',
      defaultFilter
    );
    expect(descRes[0].id).toBe('rec_1');
    expect(descRes[descRes.length - 1].id).toBe('rec_4');
  });

  it('曲名および読み仮名で部分一致検索できる', () => {
    const res = filterAndSortRecords(
      mockItems,
      {},
      'defaultOrder',
      'asc',
      { ...defaultFilter, searchQuery: 'ステラ' }
    );
    expect(res.length).toBe(1);
    expect(res[0].title).toBe('ステラ');

    const readingRes = filterAndSortRecords(
      mockItems,
      {},
      'defaultOrder',
      'asc',
      { ...defaultFilter, searchQuery: 'とんでも' }
    );
    expect(readingRes.length).toBe(1);
    expect(readingRes[0].title).toBe('トンデモワンダーズ');
  });

  it('defaultSort（デフォルト順コード）で昇順・降順ソートできる', () => {
    const itemsWithSortCode: RecordItem[] = [
      { ...mockItems[0], defaultSort: 10003 }, // メルト
      { ...mockItems[1], defaultSort: 11001 }, // ステラ
      { ...mockItems[2], defaultSort: 14001 }, // トンデモ
      { ...mockItems[3], defaultSort: 29001 }, // 群青讃歌
    ];

    const ascRes = filterAndSortRecords(
      itemsWithSortCode,
      {},
      'defaultSort',
      'asc',
      defaultFilter
    );
    expect(ascRes[0].title).toBe('メルト');
    expect(ascRes[3].title).toBe('群青讃歌');

    const descRes = filterAndSortRecords(
      itemsWithSortCode,
      {},
      'defaultSort',
      'desc',
      defaultFilter
    );
    expect(descRes[0].title).toBe('群青讃歌');
    expect(descRes[3].title).toBe('メルト');
  });
});

describe('encodeShareData / decodeShareData', () => {
  it('所持状態を可逆的にエンコード・デコードできる', () => {
    const original = { rec_1: true, rec_3: true };
    const encoded = encodeShareData(original);
    expect(typeof encoded).toBe('string');
    expect(encoded.length).toBeGreaterThan(0);

    const decoded = decodeShareData(encoded);
    expect(decoded.rec_1).toBe(true);
    expect(decoded.rec_3).toBe(true);
    expect(decoded.rec_2).toBeUndefined();
  });

  it('不正な共有文字列が与えられた場合は空オブジェクトを安全に返す', () => {
    const decoded = decodeShareData('invalid_base64_string_%%%');
    expect(decoded).toEqual({});
  });
});
