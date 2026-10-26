import fs from 'fs';

const rawData = JSON.parse(fs.readFileSync('src/data/allImportedRecords.json', 'utf8'));

const vsSingersSet = new Set();
const allSingersSet = new Set();

for (const song of rawData) {
  for (const track of song.vocalTracks || []) {
    if (track.type === 'virtual_singer') {
      for (const s of track.rawSingers || []) {
        vsSingersSet.add(s);
      }
    }
    for (const s of track.rawSingers || []) {
      allSingersSet.add(s);
    }
  }
}

console.log('--- バーチャルシンガーverの歌唱者一覧 ---');
console.log(Array.from(vsSingersSet).sort());

console.log('\n--- 全トラックの歌唱者一覧 ---');
console.log(Array.from(allSingersSet).sort());
