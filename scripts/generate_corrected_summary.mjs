import fs from 'node:fs';

const songs = JSON.parse(fs.readFileSync('C:\\Users\\taui9\\Desktop\\My project\\レコードチェッカー\\record-checker\\scripts\\kakioroshi_verified.json', 'utf8'));

// WL書き下ろしの5曲
const TRUE_WL_SONGS = new Set([
  '世界の歩き方',
  'ドリーマーズビート',
  '旅に帰る',
  'レム',
  'アンチサイノウ'
]);

// ユーザー様からの指示による修正マッピング
const OVERRIDES = {
  'magic number': { type: 'collab', banner: undefined },
  '去り人達のワルツ': { type: 'collab', banner: undefined },
  'アイムマイン': { type: 'unit', banner: undefined },
  'サイバーパンクデッドボーイ': { type: 'event', banner: 'rui' },
  '25時の情熱': { type: 'event', banner: 'kanade' },
  'フュージョン': { type: 'collab', banner: undefined },
  'フレー': { type: 'collab', banner: undefined },
  'ペンタトニック': { type: 'anniversary', banner: undefined },
  'エメラルド': { type: 'anniversary', banner: undefined },
  '青色絵具': { type: 'collab', banner: undefined },
  '我らステインバスターズ！': { type: 'collab', banner: undefined },
  'スターダストレイン': { type: 'event', banner: 'haruka' },
  '世界を照らすテトラッド': { type: 'unit', banner: undefined },
  'トワイライトライト': { type: 'unit', banner: undefined },
  '携帯恋話': { type: 'unit', banner: undefined },
};

const CHAR_NAME_MAP = {
  'ichika': '星乃一歌', 'saki': '天馬咲希', 'honami': '望月穂波', 'shiho': '日野森志歩',
  'minori': '花里みのり', 'haruka': '桐谷遥', 'airi': '桃井愛莉', 'shizuku': '日野森雫',
  'kohane': '小豆沢こはね', 'an': '白石杏', 'akito': '東雲彰人', 'toya': '青柳冬弥',
  'tsukasa': '天馬司', 'emu': '鳳えむ', 'nene': '草薙寧々', 'rui': '神代類',
  'kanade': '宵崎奏', 'mafuyu': '朝比奈まふゆ', 'ena': '東雲絵名', 'mizuki': '暁山瑞希'
};

const UNIT_ORDER = [
  { unitName: 'Leo/need', members: ['ichika', 'saki', 'honami', 'shiho'] },
  { unitName: 'MORE MORE JUMP!', members: ['minori', 'haruka', 'airi', 'shizuku'] },
  { unitName: 'Vivid BAD SQUAD', members: ['kohane', 'an', 'akito', 'toya'] },
  { unitName: 'ワンダーランズ×ショウタイム', members: ['tsukasa', 'emu', 'nene', 'rui'] },
  { unitName: '25時、ナイトコードで。', members: ['kanade', 'mafuyu', 'ena', 'mizuki'] },
];

const summary = {
  anniversary: [],
  unit: [],
  anniv_hard: [],
  collab: [],
  sekai_no_oto: [],
  movie: [],
  world_link: [],
  event: {}
};

UNIT_ORDER.forEach(u => {
  u.members.forEach(m => summary.event[m] = []);
});

songs.forEach(s => {
  let type = s.originalType;
  let banner = s.bannerCharacter;

  // 手動補正適用
  if (OVERRIDES[s.title]) {
    type = OVERRIDES[s.title].type;
    banner = OVERRIDES[s.title].banner;
  } else {
    // 既存修正の維持
    if (s.title === 'Be The MUSIC!' || s.title === 'Twilight Melody') {
      type = 'anniversary';
      banner = undefined;
    } else if (['マシンガンポエムドール', 'ÅMARA(大未来電脳)', '嬢王', '生命性シンドロウム', 'ネクラチューンサーカス', '怪獣になりたい', 'at', 'ULTIM@TE☆BE∀M!!'].includes(s.title)) {
      type = 'anniv_hard';
      banner = undefined;
    }
  }

  // ワールドリンクの厳密判定（真のWL書き下ろし5曲以外は通常のイベント書き下ろし）
  if (TRUE_WL_SONGS.has(s.title)) {
    type = 'world_link';
    banner = undefined;
  } else if (type === 'world_link') {
    type = 'event';
    banner = s.bannerCharacter;
  }

  // イベント書き下ろし以外にはバナーキャラを付与しない
  if (type !== 'event') {
    banner = undefined;
  }

  if (type === 'anniversary') summary.anniversary.push(s.title);
  else if (type === 'unit') summary.unit.push(s.title);
  else if (type === 'anniv_hard') summary.anniv_hard.push(s.title);
  else if (type === 'collab') summary.collab.push(s.title);
  else if (type === 'sekai_no_oto') summary.sekai_no_oto.push(s.title);
  else if (type === 'movie') summary.movie.push(s.title);
  else if (type === 'world_link') summary.world_link.push(s.title);
  else if (type === 'event') {
    if (summary.event[banner]) {
      summary.event[banner].push(s.title);
    } else {
      console.log('Unknown banner event song:', s.title, banner);
    }
  }
});

let md = '# 【訂正反映版】全書き下ろし楽曲（196曲）分類・バナーキャラクター付与一覧\n\n';

md += '## 1. 周年曲・その他 (' + summary.anniversary.length + '曲)\n';
summary.anniversary.forEach(t => md += `- ${t}\n`);

md += '\n## 2. ユニットソング (' + summary.unit.length + '曲)\n';
summary.unit.forEach(t => md += `- ${t}\n`);

md += '\n## 3. 高難易度書き下ろし (' + summary.anniv_hard.length + '曲)\n';
summary.anniv_hard.forEach(t => md += `- ${t}\n`);

md += '\n## 4. コラボ楽曲 (' + summary.collab.length + '曲)\n';
summary.collab.forEach(t => md += `- ${t}\n`);

md += '\n## 5. セカイノオト (' + summary.sekai_no_oto.length + '曲)\n';
summary.sekai_no_oto.forEach(t => md += `- ${t}\n`);

md += '\n## 6. 劇場版楽曲 (' + summary.movie.length + '曲)\n';
summary.movie.forEach(t => md += `- ${t}\n`);

md += '\n## 7. WL書き下ろし楽曲 (' + summary.world_link.length + '曲)\n';
md += '> ※ イベント書き下ろし楽曲以外のため、バナーキャラクター情報は付与していません。\n';
summary.world_link.forEach(t => md += `- ${t}\n`);

const eventCount = Object.values(summary.event).reduce((sum, arr) => sum + arr.length, 0);
md += '\n## 8. イベント書き下ろし楽曲（ユニット・バナーキャラクター別 / 全' + eventCount + '曲）\n';

UNIT_ORDER.forEach(u => {
  md += `\n### ■ ${u.unitName}\n`;
  u.members.forEach(mId => {
    const list = summary.event[mId] || [];
    md += `\n#### ${CHAR_NAME_MAP[mId]} バナー (${list.length}曲)\n`;
    list.forEach(t => md += `- ${t}\n`);
  });
});

fs.writeFileSync('C:\\Users\\taui9\\Desktop\\My project\\レコードチェッカー\\record-checker\\scripts\\corrected_classified_summary.md', md, 'utf8');
console.log('Corrected report written successfully!');
console.log({
  anniversary: summary.anniversary.length,
  unit: summary.unit.length,
  anniv_hard: summary.anniv_hard.length,
  collab: summary.collab.length,
  sekai_no_oto: summary.sekai_no_oto.length,
  movie: summary.movie.length,
  world_link: summary.world_link.length,
  eventTotal: eventCount,
  total: summary.anniversary.length + summary.unit.length + summary.anniv_hard.length + summary.collab.length + summary.sekai_no_oto.length + summary.movie.length + summary.world_link.length + eventCount
});
