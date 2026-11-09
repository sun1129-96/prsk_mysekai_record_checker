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
}

/**
 * 歌唱トラックの詳細情報
 */
export interface VocalTrackDetail {
  id: string;
  name: string; // 例: "セカイver", "バチャシンver", "コネクトライブver", "アナザーボーカル (一歌ver)"
  type: 'sekai' | 'virtual_singer' | 'connect_live' | 'another_vocal' | 'other';
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
 * 楽曲レコードマスターデータ型
 */
export interface RecordItem {
  id: string;
  title: string;
  reading: string;          // 五十音ソート用よみがな
  unit: UnitType;
  releaseDate: string;      // YYYY-MM-DD
  defaultOrder: number;     // 実装順 (ゲーム内配置順 No.)
  defaultSort?: number;     // デフォルト順コード (並び替え用)
  vocalVersions: VocalVersions;
  characters: string[];     // 全歌唱キャラクターID一覧
  vocalTracks?: VocalTrackDetail[]; // 各バージョンの詳細トラック情報
  jacketUrl?: string;       // ジャケット画像URL
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
  };
  searchQuery: string;
  originalTypes?: OriginalSongType[];  // 書き下ろし種別絞り込み
  bannerCharacters?: string[];         // バナーキャラクター絞り込み
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
  conditionVocalTypes?: ('sekai' | 'virtualSinger' | 'anotherVocal')[];
}

/**
 * 表示設定
 */
export interface DisplaySettings {
  showJacket: boolean;
  showReleaseDate: boolean;
  showVocalBadges: boolean;
  showCharacters: boolean;
  compactMode: boolean;
}
