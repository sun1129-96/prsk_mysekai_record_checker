import fs from 'node:fs';
import path from 'node:path';
import * as cheerio from 'cheerio';

const cacheDir = 'C:\\Users\\taui9\\Desktop\\My project\\レコードチェッカー\\record-checker\\scripts\\cache';
const listPath = path.join(cacheDir, 'aad6ee23b0.html');

const $list = cheerio.load(fs.readFileSync(listPath, 'utf8'));

const CHAR_MAP = {
  '初音ミク': 'miku', '鏡音リン': 'rin', '鏡音レン': 'len', '巡音ルカ': 'luka', 'MEIKO': 'meiko', 'KAITO': 'kaito',
  '星乃一歌': 'ichika', '天馬咲希': 'saki', '望月穂波': 'honami', '日野森志歩': 'shiho',
  '花里みのり': 'minori', '桐谷遥': 'haruka', '桃井愛莉': 'airi', '日野森雫': 'shizuku',
  '小豆沢こはね': 'kohane', '白石杏': 'an', '東雲彰人': 'akito', '青柳冬弥': 'toya',
  '天馬司': 'tsukasa', '鳳えむ': 'emu', '草薙寧々': 'nene', '神代類': 'rui',
  '宵崎奏': 'kanade', '朝比奈まふゆ': 'mafuyu', '東雲絵名': 'ena', '暁山瑞希': 'mizuki'
};

const CHAR_NAME_MAP = {
  'ichika': '星乃一歌', 'saki': '天馬咲希', 'honami': '望月穂波', 'shiho': '日野森志歩',
  'minori': '花里みのり', 'haruka': '桐谷遥', 'airi': '桃井愛莉', 'shizuku': '日野森雫',
  'kohane': '小豆沢こはね', 'an': '白石杏', 'akito': '東雲彰人', 'toya': '青柳冬弥',
  'tsukasa': '天馬司', 'emu': '鳳えむ', 'nene': '草薙寧々', 'rui': '神代類',
  'kanade': '宵崎奏', 'mafuyu': '朝比奈まふゆ', 'ena': '東雲絵名', 'mizuki': '暁山瑞希'
};

// 第1回ワールドリンク曲（ユニットソング扱い）
const WL_UNIT_SONGS = new Set([
  'インテグラル',
  'MOTTO!!!',
  'Beyond the way',
  'サイバーパンクデッドボーイ',
  '25時の情熱'
]);

// ユニットテーマソング
const THEME_SONGS = new Set([
  'needLe', 'Ready Steady', 'アイドル新鋭隊', 'セカイはまだ始まってすらいない', '悔やむと書いてミライ'
]);

// 周年曲・その他
const ANNIV_SONGS = new Set([
  'セカイ', 'ワーワーワールド', 'magic number', '群青讃歌', '去り人達のワルツ', 'Journey',
  'Be The MUSIC!', 'NEO', 'アイムマイン', '熱風', 'Twilight Melody'
]);

// 高難易度書き下ろし
const HARD_SONGS = new Set([
  'ヤミナベ!!!!', "What's up? Pop!", '人生', 'ダイジョブですか', 'アポロ',
  'マシンガンポエムドール', 'ÅMARA(大未来電脳)', '嬢王', '生命性シンドロウム',
  'ネクラチューンサーカス', '怪獣になりたい', 'スターダストレイン', 'at', 'ULTIM@TE☆BE∀M!!'
]);

// コラボ楽曲
const COLLAB_SONGS = new Set([
  '青く駆けろ！', '徳川カップヌードル禁止令', 'サラマンダー', 'アイデンティティ', 'コスモスパイス'
]);

const kakioroshiList = [];

$list('table').eq(6).find('tr').each((i, tr) => {
  if (i === 0) return;
  const tds = $list(tr).find('td');
  if (tds.length >= 4) {
    const no = $list(tds[0]).text().trim();
    const type = $list(tds[2]).text().trim();
    const a = $list(tds[3]).find('a');
    const title = a.text().trim() || $list(tds[3]).text().trim();
    const href = a.attr('href') || '';
    const unit = $list(tds[4]).text().trim();

    if (type !== '書') return;

    let targetFile = '';
    if (href.startsWith('./?')) {
      const pageParam = href.replace('./?', '');
      const testP1 = path.join(cacheDir, `${pageParam}.html`);
      const testP2 = path.join(cacheDir, `${encodeURIComponent(pageParam)}.html`);
      if (fs.existsSync(testP1)) targetFile = testP1;
      else if (fs.existsSync(testP2)) targetFile = testP2;
    }
    if (!targetFile) {
      const testP3 = path.join(cacheDir, `${encodeURIComponent(title)}.html`);
      if (fs.existsSync(testP3)) targetFile = testP3;
    }

    let songHtml = '';
    if (targetFile && fs.existsSync(targetFile)) {
      songHtml = fs.readFileSync(targetFile, 'utf8');
    }

    const $song = cheerio.load(songHtml || '');

    // セカイverの歌唱者一覧を取得
    let sekaiSingers = [];
    $song('table').each((_, table) => {
      const text = $song(table).text();
      if (text.includes('セカイver.')) {
        $song(table).find('tr').each((_, row) => {
          const rowText = $song(row).text();
          if (rowText.includes('セカイver.')) {
            $song(row).find('a').each((_, link) => {
              const name = $song(link).text().trim();
              if (name && !name.includes('ver')) {
                sekaiSingers.push(name);
              }
            });
          }
        });
      }
    });

    // セカイverの一番左のキャラクター（バチャシンを除くユニットキャラ）
    let bannerCharacter = undefined;
    for (const name of sekaiSingers) {
      const id = CHAR_MAP[name];
      if (id && !['miku', 'rin', 'len', 'luka', 'meiko', 'kaito'].includes(id)) {
        bannerCharacter = id;
        break;
      }
    }
    // バチャシンのみ等の場合は最左
    if (!bannerCharacter) {
      for (const name of sekaiSingers) {
        if (CHAR_MAP[name]) {
          bannerCharacter = CHAR_MAP[name];
          break;
        }
      }
    }

    const bodyText = $song('body').text();
    let originalType = 'event';

    if (ANNIV_SONGS.has(title)) {
      originalType = 'anniversary';
      bannerCharacter = undefined;
    } else if (WL_UNIT_SONGS.has(title)) {
      originalType = 'unit';
      bannerCharacter = undefined;
    } else if (THEME_SONGS.has(title)) {
      originalType = 'unit';
      bannerCharacter = undefined;
    } else if (HARD_SONGS.has(title) || bodyText.includes('プロセカULTIMATE')) {
      originalType = 'anniv_hard';
      bannerCharacter = undefined;
    } else if (COLLAB_SONGS.has(title)) {
      originalType = 'collab';
      bannerCharacter = undefined;
    } else if (bodyText.includes('セカイノオト')) {
      originalType = 'sekai_no_oto';
      bannerCharacter = undefined;
    } else if (bodyText.includes('劇場版')) {
      originalType = 'movie';
      bannerCharacter = undefined;
    } else if (bodyText.includes('ワールドリンクイベント') && bodyText.includes('書き下ろし楽曲') && !bodyText.includes('アナザーカットとして')) {
      // 本物のWL新曲書き下ろし
      originalType = 'world_link';
    } else {
      // 通常のイベント書き下ろし楽曲
      originalType = 'event';
    }

    kakioroshiList.push({
      no,
      title,
      unit,
      originalType,
      bannerCharacter,
      sekaiFirst: sekaiSingers[0] || ''
    });
  }
});

// 集約処理
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

const CHAR_ORDER = [
  'ichika', 'saki', 'honami', 'shiho',
  'minori', 'haruka', 'airi', 'shizuku',
  'kohane', 'an', 'akito', 'toya',
  'tsukasa', 'emu', 'nene', 'rui',
  'kanade', 'mafuyu', 'ena', 'mizuki'
];

CHAR_ORDER.forEach(id => summary.event[id] = []);

kakioroshiList.forEach(k => {
  if (k.originalType === 'anniversary') summary.anniversary.push(k.title);
  else if (k.originalType === 'unit') summary.unit.push(k.title);
  else if (k.originalType === 'anniv_hard') summary.anniv_hard.push(k.title);
  else if (k.originalType === 'collab') summary.collab.push(k.title);
  else if (k.originalType === 'sekai_no_oto') summary.sekai_no_oto.push(k.title);
  else if (k.originalType === 'movie') summary.movie.push(k.title);
  else if (k.originalType === 'world_link') summary.world_link.push(`${k.title} (${CHAR_NAME_MAP[k.bannerCharacter] || '未定'})`);
  else if (k.originalType === 'event') {
    if (summary.event[k.bannerCharacter]) {
      summary.event[k.bannerCharacter].push(k.title);
    } else {
      summary.event[k.bannerCharacter || 'その他'] = summary.event[k.bannerCharacter || 'その他'] || [];
      summary.event[k.bannerCharacter || 'その他'].push(k.title);
    }
  }
});

fs.writeFileSync('C:\\Users\\taui9\\Desktop\\My project\\レコードチェッカー\\record-checker\\scripts\\summary_final.json', JSON.stringify(summary, null, 2), 'utf8');

console.log('Final summary generated!');
console.log({
  anniversary: summary.anniversary.length,
  unit: summary.unit.length,
  anniv_hard: summary.anniv_hard.length,
  collab: summary.collab.length,
  sekai_no_oto: summary.sekai_no_oto.length,
  movie: summary.movie.length,
  world_link: summary.world_link.length,
  eventTotal: Object.values(summary.event).reduce((sum, arr) => sum + arr.length, 0)
});

