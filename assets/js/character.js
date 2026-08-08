const BASE = '../kagamito/pages/';

function parseCSV(text) {
  const rows = [];
  let row = [], field = '', quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else quoted = false;
      } else field += c;
    } else {
      if (c === '"') quoted = true;
      else if (c === ',') { row.push(field); field = ''; }
      else if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
      else if (c !== '\r') field += c;
    }
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  const headers = rows.shift().map(v => v.trim());
  return rows.filter(r => r.some(v => v.trim() !== '')).map(r =>
    Object.fromEntries(headers.map((h, i) => [h, (r[i] ?? '').trim()]))
  );
}

async function loadCSV(file) {
  const response = await fetch(BASE + file);
  if (!response.ok) throw new Error(`${file} の読み込みに失敗しました (${response.status})`);
  return parseCSV(await response.text());
}

function section(title, content) {
  return content ? `<section class="character-section"><h2>${title}</h2>${content}</section>` : '';
}

function findColumn(row, ...names) {
  for (const name of names) if (row[name]) return row[name];
  return '';
}

function linkItem(text, href) {
  return href ? `<a href="${href}">${text}</a>` : text;
}

async function main() {
  const urlId = decodeURIComponent(location.pathname.split('/').pop().replace(/\.html$/i, ''));
  const [characters, songs, works] = await Promise.all([
    loadCSV('characters.csv'),
    loadCSV('songs.csv'),
    loadCSV('works.csv')
  ]);

  const character = characters.find(c => c['URL ID'] === urlId);
  if (!character) throw new Error('キャラクターが見つかりません。');

  const name = character['日本語名'] || character['Character ID'];
  document.title = `${name} - Kagamito Official`;

  const root = document.getElementById('character');
  let html = '';

  html += '<header class="character-header">';
  if (character['二つ名']) html += `<p>${character['二つ名']}</p>`;
  html += `<h1>${name}</h1>`;
  if (character['読み']) html += `<p class="character-reading">${character['読み']}</p>`;
  if (character['English Name']) html += `<p class="character-english">${character['English Name']}</p>`;
  html += '</header>';

  if (character['容姿画像パス']) {
    html += `<img class="character-image" src="${character['容姿画像パス']}" alt="${name}">`;
  }

  if (character['能力']) {
    html += section('能力', `<p>${character['能力']}</p>${character['能力詳細'] ? `<p>${character['能力詳細']}</p>` : ''}`);
  }

  if (character['立場']) html += section('立場', `<p>${character['立場']}</p>`);

  if (character['初登場作品ID']) {
    const work = works.find(w => (w['Work ID'] || w['作品ID']) === character['初登場作品ID']);
    if (work) {
      const workName = findColumn(work, '日本語タイトル', '日本語名') || character['初登場作品ID'];
      html += section('初登場作品', `<p>${linkItem(workName, `../works/${encodeURIComponent(work['URL ID'] || work['Work ID'] || character['初登場作品ID'])}.html`)}</p>`);
    }
  }

  if (character['テーマ曲ID']) {
    const song = songs.find(s => s['Music ID'] === character['テーマ曲ID']);
    if (song) {
      const songName = findColumn(song, '日本語曲名', '日本語タイトル') || character['テーマ曲ID'];
      html += section('テーマ曲', `<p>${linkItem(songName, `../songs/${encodeURIComponent(song['URL ID'] || song['Music ID'] || character['テーマ曲ID'])}.html`)}</p>`);
    }
  }

  if (character['登場作品ID']) {
    const ids = character['登場作品ID'].split(/\s*,\s*/).filter(Boolean);
    const items = ids.map(id => {
      const work = works.find(w => (w['Work ID'] || w['作品ID']) === id);
      if (!work) return `<li>${id}</li>`;
      const workName = findColumn(work, '日本語タイトル', '日本語名') || id;
      return `<li>${linkItem(workName, `../works/${encodeURIComponent(work['URL ID'] || work['Work ID'] || id)}.html`)}</li>`;
    }).join('');
    html += section('登場作品', `<ul class="related-list">${items}</ul>`);
  }

  if (character['プロフィール']) html += section('プロフィール', `<p>${character['プロフィール']}</p>`);

  root.innerHTML = html;
}

main().catch(error => {
  document.getElementById('character').innerHTML = `<p>${error.message}</p>`;
});
