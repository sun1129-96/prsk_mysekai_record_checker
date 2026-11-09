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
    originalType: 'cover',
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
    originalType: 'event',
    bannerCharacter: 'saki',
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
    originalType: 'event',
    bannerCharacter: 'tsukasa',
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
    originalType: 'anniversary',
  },
];

const defaultFilter: FilterOptions = {
  ownership: 'all',
  units: [
    'virtual_singer',
    'leo_need',
    'more_more_jump',
    'vivid_bad_squad',
    'wonderlands_showtime',
    'nightcord_at_25',
    'other',
  ],
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

  it('書き下ろし種別で絞り込みができる', () => {
    const res = filterAndSortRecords(
      mockItems,
      {},
      'defaultOrder',
      'asc',
      { ...defaultFilter, originalTypes: ['event'] }
    );
    expect(res.length).toBe(2);
    expect(res.map((r) => r.title)).toEqual(['ステラ', 'トンデモワンダーズ']);

    const annivRes = filterAndSortRecords(
      mockItems,
      {},
      'defaultOrder',
      'asc',
      { ...defaultFilter, originalTypes: ['anniversary'] }
    );
    expect(annivRes.length).toBe(1);
    expect(annivRes[0].title).toBe('群青讃歌');
  });

  it('バナーキャラクターで絞り込みができる', () => {
    const sakiRes = filterAndSortRecords(
      mockItems,
      {},
      'defaultOrder',
      'asc',
      { ...defaultFilter, bannerCharacters: ['saki'] }
    );
    expect(sakiRes.length).toBe(1);
    expect(sakiRes[0].title).toBe('ステラ');

    const multiRes = filterAndSortRecords(
      mockItems,
      {},
      'defaultOrder',
      'asc',
      { ...defaultFilter, bannerCharacters: ['saki', 'tsukasa'] }
    );
    expect(multiRes.length).toBe(2);
  });

  it('実装年（1年目〜6年目等）で正しく絞り込める', () => {
    // mockItems: rec_1 (2020-09-30, 1年目), rec_2 (2020-10-09, 1年目), rec_3 (2021-06-19, 1年目), rec_4 (2021-09-30, 2年目)
    const year1Res = filterAndSortRecords(
      mockItems,
      {},
      'defaultOrder',
      'asc',
      { ...defaultFilter, releaseYears: [1] }
    );
    expect(year1Res.length).toBe(3);
    expect(year1Res.map((r) => r.id)).toEqual(['rec_1', 'rec_2', 'rec_3']);

    const year2Res = filterAndSortRecords(
      mockItems,
      {},
      'defaultOrder',
      'asc',
      { ...defaultFilter, releaseYears: [2] }
    );
    expect(year2Res.length).toBe(1);
    expect(year2Res[0].id).toBe('rec_4');
  });

  it('AND/OR 条件指定が正しく機能する', () => {
    // mockItems:
    // rec_1: virtual_singer, miku, cover, year 1
    // rec_2: leo_need, ichika/saki/miku, event, year 1
    // rec_3: wonderlands_showtime, tsukasa/emu, event, year 1
    // rec_4: other, ichika/miku, anniversary, year 2

    // AND条件 (デフォルト): ユニットが leo_need かつ イベント書き下ろし
    const andRes = filterAndSortRecords(
      mockItems,
      {},
      'defaultOrder',
      'asc',
      {
        ...defaultFilter,
        units: ['leo_need'],
        originalTypes: ['event'],
        matchType: 'and',
      }
    );
    expect(andRes.length).toBe(1);
    expect(andRes[0].id).toBe('rec_2');

    // OR条件: ユニットが leo_need または イベント書き下ろし (rec_2は両方、rec_3はeventのみでヒット)
    const orRes = filterAndSortRecords(
      mockItems,
      {},
      'defaultOrder',
      'asc',
      {
        ...defaultFilter,
        units: ['leo_need'],
        originalTypes: ['event'],
        matchType: 'or',
      }
    );
    expect(orRes.length).toBe(2);
    expect(orRes.map((r) => r.id)).toEqual(['rec_2', 'rec_3']);

    // OR条件: 歌唱verにコネクトライブverがある OR 実装年が2年目 (rec_3はconnectLive、rec_4はconnectLiveかつyear 2)
    const orRes2 = filterAndSortRecords(
      mockItems,
      {},
      'defaultOrder',
      'asc',
      {
        ...defaultFilter,
        vocalVersions: { virtualSinger: false, sekai: false, connectLive: true, anotherVocal: false },
        releaseYears: [2],
        matchType: 'or',
      }
    );
    expect(orRes2.length).toBe(2);
    expect(orRes2.map((r) => r.id)).toEqual(['rec_3', 'rec_4']);
  });
});

describe('encodeShareData / decodeShareData', () => {
  it('所持状態を可逆的にエンコード・デコードできる（BitSet b1_ 形式）', () => {
    const original = { rec_1: true, rec_3: true, rec_731: true };
    const encoded = encodeShareData(original, 731);
    expect(typeof encoded).toBe('string');
    expect(encoded.startsWith('b1_')).toBe(true);

    const decoded = decodeShareData(encoded);
    expect(decoded.rec_1).toBe(true);
    expect(decoded.rec_3).toBe(true);
    expect(decoded.rec_731).toBe(true);
    expect(decoded.rec_2).toBeUndefined();
  });

  it('旧形式（JSON Base64）の共有データも後方互換性でデコードできる', () => {
    const oldJson = JSON.stringify(['rec_2', 'rec_4']);
    const oldBase64 = btoa(encodeURIComponent(oldJson));

    const decoded = decodeShareData(oldBase64);
    expect(decoded.rec_2).toBe(true);
    expect(decoded.rec_4).toBe(true);
    expect(decoded.rec_1).toBeUndefined();
  });

  it('空の所持状態を安全にエンコード・デコードできる', () => {
    const encoded = encodeShareData({}, 10);
    const decoded = decodeShareData(encoded);
    expect(decoded).toEqual({});
  });

  it('不正な共有文字列が与えられた場合は空オブジェクトを安全に返す', () => {
    const decoded = decodeShareData('invalid_base64_string_%%%');
    expect(decoded).toEqual({});
    const decodedB1 = decodeShareData('b1_!!!not_valid_b64!!!');
    expect(decodedB1).toEqual({});
  });
});
