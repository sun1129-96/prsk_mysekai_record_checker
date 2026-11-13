/**
 * ユニット定義
 */
export type UnitType =
  | 'virtual_singer'     // バーチャル・シンガー
  | 'leo_need'           // Leo/need
  | 'more_more_jump'     // MORE MORE JUMP!
  | 'vivid_bad_squad'    // Vivid BAD SQUAD
  | 'wonderlands_showtime'// ワンダーランズ×ショウタイム
  | 'nightcord_at_25'    // 25時、ナイトコードで。
  | 'other';             // その他 / タイアップ

/**
 * ユニット表示情報メタデータ
 */
export interface UnitMeta {
  id: UnitType;
  name: string;
  shortName: string;
  themeColor: string;
  bgColor: string;
  borderColor: string;
  textColor?: string;
  iconUrl?: string;
}

export const UNIT_METAS: Record<UnitType, UnitMeta> = {
  virtual_singer: {
    id: 'virtual_singer',
    name: 'VIRTUAL SINGER',
    shortName: 'バチャシン',
    themeColor: '#FFFFFF',
    bgColor: '#ffffff',
    borderColor: '#cbd5e1',
    textColor: '#334155',
    iconUrl: '/assets/units/virtual_singer.svg',
  },
  leo_need: {
    id: 'leo_need',
    name: 'Leo/need',
    shortName: 'レオニ',
    themeColor: '#4455DD',
    bgColor: '#eef2ff',
    borderColor: '#c7d2fe',
    textColor: '#4455DD',
    iconUrl: '/assets/units/leo_need.svg',
  },
  more_more_jump: {
    id: 'more_more_jump',
    name: 'MORE MORE JUMP!',
    shortName: 'モモジャン',
    themeColor: '#88DD44',
    bgColor: '#f7fee7',
    borderColor: '#bef264',
    textColor: '#4d7c0f',
    iconUrl: '/assets/units/more_more_jump.svg',
  },
  vivid_bad_squad: {
    id: 'vivid_bad_squad',
    name: 'Vivid BAD SQUAD',
    shortName: 'ビビバス',
    themeColor: '#EE1166',
    bgColor: '#fff1f2',
    borderColor: '#fecdd3',
    textColor: '#EE1166',
    iconUrl: '/assets/units/vivid_bad_squad.svg',
  },
  wonderlands_showtime: {
    id: 'wonderlands_showtime',
    name: 'ワンダーランズ×ショウタイム',
    shortName: 'ワンダショ',
    themeColor: '#FF9900',
    bgColor: '#fff7ed',
    borderColor: '#fed7aa',
    textColor: '#ea580c',
    iconUrl: '/assets/units/wonderlands_showtime.svg',
  },
  nightcord_at_25: {
    id: 'nightcord_at_25',
    name: '25時、ナイトコードで。',
    shortName: 'ニーゴ',
    themeColor: '#884499',
    bgColor: '#faf5ff',
    borderColor: '#e9d5ff',
    textColor: '#884499',
    iconUrl: '/assets/units/nightcord_at_25.svg',
  },
  other: {
    id: 'other',
    name: 'その他',
    shortName: 'その他',
    themeColor: '#64748b',
    bgColor: '#f8fafc',
    borderColor: '#cbd5e1',
    textColor: '#64748b',
  },
};

/**
 * キャラクター定義
 */
export interface CharacterMeta {
  id: string;
  name: string;
  unit: UnitType;
  color: string;
}

/** ゲーム内に登場するバーチャル・シンガーのID一覧 */
export const GAME_VIRTUAL_SINGER_IDS = [
  'miku',
  'rin',
  'len',
  'luka',
  'meiko',
  'kaito',
] as const;

export const CHARACTERS: CharacterMeta[] = [
  // バーチャル・シンガー
  { id: 'miku', name: '初音ミク', unit: 'virtual_singer', color: '#33CCBB' },
  { id: 'rin', name: '鏡音リン', unit: 'virtual_singer', color: '#FFCC11' },
  { id: 'len', name: '鏡音レン', unit: 'virtual_singer', color: '#FFEE11' },
  { id: 'luka', name: '巡音ルカ', unit: 'virtual_singer', color: '#FFBBCC' },
  { id: 'meiko', name: 'MEIKO', unit: 'virtual_singer', color: '#DD4444' },
  { id: 'kaito', name: 'KAITO', unit: 'virtual_singer', color: '#3366CC' },

  // Leo/need
  { id: 'ichika', name: '星乃一歌', unit: 'leo_need', color: '#33AAEE' },
  { id: 'saki', name: '天馬咲希', unit: 'leo_need', color: '#FFDD44' },
  { id: 'honami', name: '望月穂波', unit: 'leo_need', color: '#FF6666' },
  { id: 'shiho', name: '日野森志歩', unit: 'leo_need', color: '#BBDD22' },

  // MORE MORE JUMP!
  { id: 'minori', name: '花里みのり', unit: 'more_more_jump', color: '#FFCCAA' },
  { id: 'haruka', name: '桐谷遥', unit: 'more_more_jump', color: '#99CCFF' },
  { id: 'airi', name: '桃井愛莉', unit: 'more_more_jump', color: '#FFAACC' },
  { id: 'shizuku', name: '日野森雫', unit: 'more_more_jump', color: '#99EEDD' },

  // Vivid BAD SQUAD
  { id: 'kohane', name: '小豆沢こはね', unit: 'vivid_bad_squad', color: '#FF6699' },
  { id: 'an', name: '白石杏', unit: 'vivid_bad_squad', color: '#00BBDD' },
  { id: 'akito', name: '東雲彰人', unit: 'vivid_bad_squad', color: '#FF7722' },
  { id: 'toya', name: '青柳冬弥', unit: 'vivid_bad_squad', color: '#0077DD' },

  // ワンダーランズ×ショウタイム
  { id: 'tsukasa', name: '天馬司', unit: 'wonderlands_showtime', color: '#FFBB00' },
  { id: 'emu', name: '鳳えむ', unit: 'wonderlands_showtime', color: '#FF66BB' },
  { id: 'nene', name: '草薙寧々', unit: 'wonderlands_showtime', color: '#33DD99' },
  { id: 'rui', name: '神代類', unit: 'wonderlands_showtime', color: '#BB88EE' },

  // 25時、ナイトコードで。
  { id: 'kanade', name: '宵崎奏', unit: 'nightcord_at_25', color: '#BB6688' },
  { id: 'mafuyu', name: '朝比奈まふゆ', unit: 'nightcord_at_25', color: '#8888CC' },
  { id: 'ena', name: '東雲絵名', unit: 'nightcord_at_25', color: '#CCAA88' },
  { id: 'mizuki', name: '暁山瑞希', unit: 'nightcord_at_25', color: '#DDAACC' },

  // その他バーチャル・シンガー / VOCALOID・音声合成
  { id: 'gumi', name: 'GUMI', unit: 'virtual_singer', color: '#74d32e' },
  { id: 'flower', name: 'flower', unit: 'virtual_singer', color: '#9c88ff' },
  { id: 'teto', name: '重音テト', unit: 'virtual_singer', color: '#e83955' },
  { id: 'ia', name: 'IA', unit: 'virtual_singer', color: '#ffbfd3' },
  { id: 'una', name: '音街ウナ', unit: 'virtual_singer', color: '#2277ee' },
  { id: 'kaf', name: '可不', unit: 'virtual_singer', color: '#44ddbb' },
  { id: 'yuki', name: '歌愛ユキ', unit: 'virtual_singer', color: '#ff6666' },
  { id: 'gakupo', name: '神威がくぽ', unit: 'virtual_singer', color: '#7733bb' },
  { id: 'yukari', name: '結月ゆかり', unit: 'virtual_singer', color: '#9955bb' },
  { id: 'zundamon', name: 'ずんだもん', unit: 'virtual_singer', color: '#55cc55' },
  { id: 'kiritan', name: '東北きりたん', unit: 'virtual_singer', color: '#886655' },
  { id: 'akane', name: '琴葉茜', unit: 'virtual_singer', color: '#ee6677' },
  { id: 'aoi', name: '琴葉葵', unit: 'virtual_singer', color: '#5599ee' },
  { id: 'chisei', name: '知声', unit: 'virtual_singer', color: '#bb88cc' },
  { id: 'adachi_rei', name: '足立レイ', unit: 'virtual_singer', color: '#eeaa44' },
  { id: 'karin', name: '夏色花梨', unit: 'virtual_singer', color: '#ff7799' },
  { id: 'chifuyu', name: '花隈千冬', unit: 'virtual_singer', color: '#55bbee' },
  { id: 'rime', name: '裏命', unit: 'virtual_singer', color: '#ee5588' },
  { id: 'sekai_cevio', name: '星界', unit: 'virtual_singer', color: '#7788ee' },
  { id: 'haru', name: '羽累', unit: 'virtual_singer', color: '#ee99aa' },
  { id: 'koko', name: '狐子', unit: 'virtual_singer', color: '#ee9933' },
  { id: 'tsuina', name: 'ついなちゃん', unit: 'virtual_singer', color: '#ee7755' },
  { id: 'merrow', name: 'めろう', unit: 'virtual_singer', color: '#55aaaa' },
  { id: 'gekiyaku', name: 'ゲキヤク', unit: 'virtual_singer', color: '#bb4444' },
  { id: 'kanon', name: '花奏かのんβ', unit: 'virtual_singer', color: '#aa88ee' },
  { id: 'mikoto', name: '鳴花ミコト', unit: 'virtual_singer', color: '#dd5588' },
  { id: 'lily', name: 'Lily', unit: 'virtual_singer', color: '#eecc22' },
  { id: 'solaria', name: 'SOLARIA', unit: 'virtual_singer', color: '#eedd66' },
  { id: 'vy1', name: 'VY1', unit: 'virtual_singer', color: '#ee66aa' },
  { id: 'vy2', name: 'VY2V3', unit: 'virtual_singer', color: '#ff8833' },

  // コラボ・ゲストキャラクター（その他）
  { id: 'nenerobo', name: 'ネネロボ', unit: 'other', color: '#33dd99' },
  { id: 'mikudayo', name: 'ミクダヨー', unit: 'other', color: '#33ccbb' },
  { id: 'alkaloid', name: 'ALKALOID', unit: 'other', color: '#00b06b' },
  { id: 'crazy_b', name: 'Crazy:B', unit: 'other', color: '#ffd700' },
  { id: 'jun', name: '漣 ジュン', unit: 'other', color: '#4169e1' },
  { id: 'izumi', name: '瀬名 泉', unit: 'other', color: '#87ceeb' },
  { id: 'chiaki', name: '守沢 千秋', unit: 'other', color: '#ff4500' },
  { id: 'natsume', name: '逆先 夏目', unit: 'other', color: '#ba55d3' },
];

/**
 * 歌唱verの有無
 */
export interface VocalVersions {
  virtualSinger: boolean; // バーチャル・シンガーver
  sekai: boolean;         // セカイver
  connectLive: boolean;   // コネクトライブver
  anotherVocal: boolean;  // アナザーボーカル
  movie?: boolean;        // 劇場版ver
  inst?: boolean;         // Inst ver.
}

/**
 * 歌唱トラックの詳細情報
 */
export interface VocalTrackDetail {
  id: string;
  name: string; // 例: "セカイver", "バチャシンver", "コネクトライブver", "「劇場版プロジェクトセカイ」ver.", "アナザーボーカル (一歌ver)", "Inst. ver."
  type: 'sekai' | 'virtual_singer' | 'connect_live' | 'another_vocal' | 'movie' | 'inst' | 'other';
  singers: string[]; // 歌唱キャラクターID一覧
}

/**
 * 書き下ろし楽曲の分類種別
 */
export type OriginalSongType =
  | 'event'        // イベント書き下ろし楽曲
  | 'unit'         // ユニットソング
  | 'collab'       // コラボ楽曲
  | 'sekai_no_oto' // セカイノオト
  | 'movie'        // 劇場版楽曲
  | 'anniv_hard'   // 高難易度書き下ろし
  | 'world_link'   // WL書き下ろし楽曲
  | 'anniversary'  // 周年曲・その他
  | 'cover';       // カバー楽曲

export interface OriginalTypeMeta {
  id: OriginalSongType;
  label: string;
  shortLabel: string;
}

export const ORIGINAL_TYPE_METAS: Record<OriginalSongType, OriginalTypeMeta> = {
  event: { id: 'event', label: 'イベント書き下ろし楽曲', shortLabel: 'イベント' },
  unit: { id: 'unit', label: 'ユニットソング', shortLabel: 'ユニット曲' },
  collab: { id: 'collab', label: 'コラボ楽曲', shortLabel: 'コラボ' },
  sekai_no_oto: { id: 'sekai_no_oto', label: 'セカイノオト', shortLabel: 'セカイノオト' },
  movie: { id: 'movie', label: '劇場版楽曲', shortLabel: '劇場版' },
  anniv_hard: { id: 'anniv_hard', label: '高難易度書き下ろし', shortLabel: '高難易度' },
  world_link: { id: 'world_link', label: 'WL書き下ろし楽曲', shortLabel: 'WL' },
  anniversary: { id: 'anniversary', label: '周年曲・その他', shortLabel: '周年・他' },
  cover: { id: 'cover', label: 'カバー楽曲', shortLabel: 'カバー' },
};

/**
 * 複数ジャケットのバッジ表示名称メタ
 */
export interface JacketVariantLabels {
  defaultLabel: string; // 通常（VS）側バッジ名
  altLabel: string;     // 別バージョン（セカイ/コラボ/劇場版）側バッジ名
}

export const SONG_JACKET_LABELS: Record<string, JacketVariantLabels> = {
  'フラジール': { defaultLabel: 'セカイ・バチャシン', altLabel: 'コラボ' },
  'KING': { defaultLabel: 'セカイ・バチャシン', altLabel: 'コラボ' },
  '群青讃歌': { defaultLabel: 'セカイ・バチャシン', altLabel: '劇場版' },
};

export const getJacketLabels = (songTitle: string): JacketVariantLabels => {
  return SONG_JACKET_LABELS[songTitle] || { defaultLabel: 'バチャシン', altLabel: 'セカイ' };
};

/**
 * ジャケットバリアント定義（3つ以上のジャケットにも対応）
 */
export interface JacketVariant {
  url: string;
  label: string;
}

/**
 * 楽曲レコードからジャケットバリアント配列を取得するヘルパー関数
 */
export const getRecordJackets = (record: RecordItem): JacketVariant[] => {
  if (record.jackets && record.jackets.length > 0) {
    return record.jackets;
  }
  if (record.jacketUrlVs && record.jacketUrlSekai && record.jacketUrlVs !== record.jacketUrlSekai) {
    const labels = getJacketLabels(record.title);
    return [
      { url: record.jacketUrlVs, label: labels.defaultLabel },
      { url: record.jacketUrlSekai, label: labels.altLabel },
    ];
  }
  const defaultUrl = record.jacketUrl || record.jacketUrlVs || record.jacketUrlSekai || '';
  return defaultUrl ? [{ url: defaultUrl, label: '通常' }] : [];
};

/**
 * 歌唱トラックIDに対応するジャケットのインデックスを取得するヘルパー関数
 * - 「セカイ・バチャシン」を持つ楽曲（フラジール、KING、群青讃歌等）:
 *   セカイverもバチャシンverも（通常アナボも）「セカイ・バチャシン」（インデックス 0）に対応
 *   コラボverや劇場版verのみ、別verジャケット（インデックス 1）に対応
 * - 『ノマド』: 初音ミクアナボは「アナボ(ミク)」（インデックス 2）、VSは「バチャシン」（0）、セカイverや他アナボは「セカイ」（1）
 * - その他一般の複数ジャケット曲: VSは「バチャシン」（0）、セカイverやアナボverは「セカイ」（1）
 */
export const getJacketIndexForTrack = (record: RecordItem, trackId: string): number => {
  const jackets = getRecordJackets(record);
  if (jackets.length <= 1) return 0;

  const track = record.vocalTracks?.find((t) => t.id === trackId);
  if (!track) return 0;

  // 1. 「セカイ・バチャシン」ジャケットを持つ楽曲（フラジール、KING、群青讃歌など）
  const hasSekaiVsJacket = jackets.some((j) => j.label === 'セカイ・バチャシン');
  if (hasSekaiVsJacket) {
    // トラック名またはシンガーがコラボ / 劇場版 の場合は別ver（コラボ / 劇場版 = インデックス 1）
    const isCollabOrMovieTrack =
      track.name.includes('コラボ') ||
      track.name.includes('あんさんぶるスターズ') ||
      track.name.includes('劇場版') ||
      track.singers?.some((s) => ['alkaloid', 'crazy_b', 'jun', 'izumi', 'chiaki', 'natsume'].includes(s));

    if (isCollabOrMovieTrack) {
      const altIndex = jackets.findIndex((j) => j.label === 'コラボ' || j.label === '劇場版');
      return altIndex !== -1 ? altIndex : 1;
    }

    // セカイverもバチャシンverも（通常アナザーボーカルも）、すべて「セカイ・バチャシン」（インデックス 0）に対応
    const sekaiVsIndex = jackets.findIndex((j) => j.label === 'セカイ・バチャシン');
    return sekaiVsIndex !== -1 ? sekaiVsIndex : 0;
  }

  // 2. ノマドの初音ミクアナザーボーカルver
  if (record.title === 'ノマド' && track.type === 'another_vocal') {
    if (track.singers?.includes('miku') || track.name.includes('ミク')) {
      const mikuIndex = jackets.findIndex(
        (j) => j.label.includes('ミク') || j.label.includes('アナボ') || j.url.includes('初音ミク')
      );
      if (mikuIndex !== -1) return mikuIndex;
      return 2;
    }
  }

  // 3. バーチャル・シンガーver
  if (track.type === 'virtual_singer') {
    const vsIndex = jackets.findIndex(
      (j) => j.label === 'バチャシン' || j.url === record.jacketUrlVs
    );
    return vsIndex !== -1 ? vsIndex : 0;
  }

  // 4. セカイver または 通常のアナザーボーカルver
  const sekaiIndex = jackets.findIndex(
    (j) => j.label === 'セカイ' || j.url === record.jacketUrlSekai
  );
  if (sekaiIndex !== -1) return sekaiIndex;

  return 1;
};

/**
 * 楽曲レコードマスターデータ型
 */
export interface RecordItem {
  id: string;
  title: string;
  reading: string;          // 五十音ソート用よみがな
  unit: UnitType;           // メインユニット
  units?: UnitType[];       // 所属ユニット一覧（複数ユニットを持つ楽曲用）
  releaseDate: string;      // YYYY-MM-DD
  defaultOrder: number;     // 実装順 (ゲーム内配置順 No.)
  defaultSort?: number;     // デフォルト順コード (並び替え用)
  vocalVersions: VocalVersions;
  characters: string[];     // 全歌唱キャラクターID一覧
  vocalTracks?: VocalTrackDetail[]; // 各バージョンの詳細トラック情報
  jacketUrl?: string;       // デフォルトジャケット画像URL（バーチャル・シンガーver優先）
  jacketUrlVs?: string;     // バーチャル・シンガーverジャケット画像URL
  jacketUrlSekai?: string;  // セカイverジャケット画像URL（存在しない場合はjacketUrlVsと同一）
  jackets?: JacketVariant[]; // 複数ジャケットバリアント一覧（3つ以上に対応）
  source?: string;          // 入手方法
  originalType?: OriginalSongType;  // 書き下ろし分類種別
  bannerCharacter?: string;         // イベント書き下ろしバナーキャラクターID
}

/**
 * 並び替え種別
 */
export type SortType = 'defaultSort' | 'defaultOrder' | 'releaseDate' | 'reading';
export type SortDirection = 'asc' | 'desc';

/**
 * 並び替え設定
 */
export interface SortSettings {
  sortType: SortType;
  sortDirection: SortDirection;
}

/**
 * タップ動作モード
 */
export type TapActionMode = 'detail' | 'quick_check';

/**
 * 絞り込み条件
 */
export interface FilterOptions {
  ownership: 'all' | 'owned' | 'unowned';
  units: UnitType[];
  characters: string[]; // 選択されたキャラクターID
  vocalVersions: {
    virtualSinger: boolean;
    sekai: boolean;
    connectLive: boolean;
    anotherVocal: boolean;
    inst?: boolean;
  };
  searchQuery: string;
  originalTypes?: OriginalSongType[];  // 書き下ろし種別絞り込み
  bannerCharacters?: string[];         // バナーキャラクター絞り込み
  releaseYears?: number[];             // 実装年（1年目〜6年目等）絞り込み
  matchType?: 'and' | 'or';            // 条件結合方式 (AND: すべて一致, OR: いずれか一致)
}

/**
 * 保存されたカスタム比較条件
 */
export interface SavedCompareCondition {
  id: string;
  title: string;
  filter: FilterOptions;
  createdAt: number;
  matchType?: 'and' | 'or';
  conditionUnits?: UnitType[];
  conditionCharacters?: string[];
  conditionOriginalTypes?: OriginalSongType[];
  conditionVocalTypes?: ('sekai' | 'virtualSinger' | 'anotherVocal' | 'connectLive' | 'inst')[];
  conditionBannerCharacters?: string[];
  conditionReleaseYears?: number[];
}

/**
 * 表示設定
 */
export interface DisplaySettings {
  showJacket: boolean;
  showReleaseDate: boolean;
  showReleaseOrder: boolean;
  showVocalBadges: boolean;
  showCharacters: boolean;
  compactMode: boolean;
}
