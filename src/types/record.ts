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
}

export const UNIT_METAS: Record<UnitType, UnitMeta> = {
  virtual_singer: {
    id: 'virtual_singer',
    name: 'バーチャル・シンガー',
    shortName: 'バチャシン',
    themeColor: '#33ccbb',
    bgColor: '#ecfdf5',
    borderColor: '#a7f3d0',
  },
  leo_need: {
    id: 'leo_need',
    name: 'Leo/need',
    shortName: 'レオニ',
    themeColor: '#3b82f6',
    bgColor: '#eff6ff',
    borderColor: '#bfdbfe',
  },
  more_more_jump: {
    id: 'more_more_jump',
    name: 'MORE MORE JUMP!',
    shortName: 'モモジャン',
    themeColor: '#84cc16',
    bgColor: '#f7fee7',
    borderColor: '#d9f99d',
  },
  vivid_bad_squad: {
    id: 'vivid_bad_squad',
    name: 'Vivid BAD SQUAD',
    shortName: 'ビビバス',
    themeColor: '#f43f5e',
    bgColor: '#fff1f2',
    borderColor: '#fecdd3',
  },
  wonderlands_showtime: {
    id: 'wonderlands_showtime',
    name: 'ワンダーランズ×ショウタイム',
    shortName: 'ワンダショ',
    themeColor: '#f97316',
    bgColor: '#fff7ed',
    borderColor: '#fed7aa',
  },
  nightcord_at_25: {
    id: 'nightcord_at_25',
    name: '25時、ナイトコードで。',
    shortName: 'ニーゴ',
    themeColor: '#a855f7',
    bgColor: '#faf5ff',
    borderColor: '#e9d5ff',
  },
  other: {
    id: 'other',
    name: 'その他',
    shortName: 'その他',
    themeColor: '#64748b',
    bgColor: '#f8fafc',
    borderColor: '#cbd5e1',
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

export const CHARACTERS: CharacterMeta[] = [
  // バーチャル・シンガー
  { id: 'miku', name: '初音ミク', unit: 'virtual_singer', color: '#33ccbb' },
  { id: 'rin', name: '鏡音リン', unit: 'virtual_singer', color: '#ffcc11' },
  { id: 'len', name: '鏡音レン', unit: 'virtual_singer', color: '#ffee11' },
  { id: 'luka', name: '巡音ルカ', unit: 'virtual_singer', color: '#ffbbcc' },
  { id: 'meiko', name: 'MEIKO', unit: 'virtual_singer', color: '#dd4444' },
  { id: 'kaito', name: 'KAITO', unit: 'virtual_singer', color: '#3366cc' },

  // Leo/need
  { id: 'ichika', name: '星乃一歌', unit: 'leo_need', color: '#33aaee' },
  { id: 'saki', name: '天馬咲希', unit: 'leo_need', color: '#f5b026' },
  { id: 'honami', name: '望月穂波', unit: 'leo_need', color: '#ee6666' },
  { id: 'shiho', name: '日野森志歩', unit: 'leo_need', color: '#99cc66' },

  // MORE MORE JUMP!
  { id: 'minori', name: '花里みのり', unit: 'more_more_jump', color: '#ff9999' },
  { id: 'haruka', name: '桐谷遥', unit: 'more_more_jump', color: '#6699ee' },
  { id: 'airi', name: '桃井愛莉', unit: 'more_more_jump', color: '#ff77aa' },
  { id: 'shizuku', name: '日野森雫', unit: 'more_more_jump', color: '#99eedd' },

  // Vivid BAD SQUAD
  { id: 'kohane', name: '小豆沢こはね', unit: 'vivid_bad_squad', color: '#ff6699' },
  { id: 'an', name: '白石杏', unit: 'vivid_bad_squad', color: '#00bbdd' },
  { id: 'akito', name: '東雲彰人', unit: 'vivid_bad_squad', color: '#ff7722' },
  { id: 'toya', name: '青柳冬弥', unit: 'vivid_bad_squad', color: '#0077dd' },

  // ワンダーランズ×ショウタイム
  { id: 'tsukasa', name: '天馬司', unit: 'wonderlands_showtime', color: '#ffbb00' },
  { id: 'emu', name: '鳳えむ', unit: 'wonderlands_showtime', color: '#ff66bb' },
  { id: 'nene', name: '草薙寧々', unit: 'wonderlands_showtime', color: '#33dd99' },
  { id: 'rui', name: '神代類', unit: 'wonderlands_showtime', color: '#aa44bb' },

  // 25時、ナイトコードで。
  { id: 'kanade', name: '宵崎奏', unit: 'nightcord_at_25', color: '#bb6688' },
  { id: 'mafuyu', name: '朝比奈まふゆ', unit: 'nightcord_at_25', color: '#7777aa' },
  { id: 'ena', name: '東雲絵名', unit: 'nightcord_at_25', color: '#cc8844' },
  { id: 'mizuki', name: '暁山瑞希', unit: 'nightcord_at_25', color: '#dd88aa' },

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
