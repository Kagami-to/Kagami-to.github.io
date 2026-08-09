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

function pick(row, jaKey, enKey) {
  const value = getLanguage() === 'en' ? row[enKey] : row[jaKey];
  return value || '';
}

function linkItem(text, href) {
  return href ? `<a href="${href}">${text}</a>` : text;
}

function workId(work) {
  return work['Work ID'] || work['作品ID'] || work['ID'] || '';
}

function workUrl(work) {
  return work['URL ID'] || workId(work);
}

function workNumber(work) {
  return work['作品番号'] || work['Numbering'] || '';
}

function workTitle(work, en) {
  if (en) return work['English Title'] || '';
  return work['メインタイトル'] || work['日本語タイトル'] || '';
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

  const en = getLanguage() === 'en';
  const displayName = en ? (character['English Name'] || '') : (character['日本語名'] || '');
  document.title = `${displayName} - Kagamito Official`;

  const root = document.getElementById('character');
  let html = '';

  html += '<header class="character-header">';

  const alias = pick(character, '二つ名', '二つ名英語');
  if (alias) html += `<p>${alias}</p>`;

  if (displayName) html += `<h1>${displayName}</h1>`;

  // 読み仮名は日本語版だけに表示する。
  if (!en && character['読み']) html += `<p class="character-reading">${character['読み']}</p>`;

  html += '</header>';

  if (character['容姿画像パス']) {
    html += `<img class="character-image" src="${character['容姿画像パス']}" alt="${displayName}">`;
  }

  const ability = pick(character, '能力', '能力英語');
  if (ability) html += section(t('ability'), `<p>${ability}</p>`);

  const abilityDetail = pick(character, '能力詳細', '能力詳細英語');
  if (abilityDetail) html += section(t('abilityDetail'), `<p>${abilityDetail}</p>`);

  const position = pick(character, '立場', '立場英語');
  if (position) html += section(t('position'), `<p>${position}</p>`);

  if (character['初登場作品ID']) {
    const work = works.find(w => workId(w) === character['初登場作品ID']);
    if (work) {
      const title = workTitle(work, en);
      if (title) {
        const number = workNumber(work);
        const label = number ? `${number} — ${title}` : title;
        html += section(t('firstAppearance'), `<p>${linkItem(label, `../works/${encodeURIComponent(workUrl(work))}.html`)}</p>`);
      }
    }
  }

  if (character['テーマ曲ID']) {
    const song = songs.find(s => (s['Music ID'] || s['ID'] || s['楽曲ID']) === character['テーマ曲ID']);
    if (song) {
      const songName = en ? (song['English Title'] || song['英語曲名'] || '') : (song['日本語曲名'] || song['メインタイトル'] || '');
      if (songName) {
        html += section(t('themeSong'), `<p>${linkItem(songName, `../songs/${encodeURIComponent(song['URL ID'] || song['Music ID'] || song['ID'] || character['テーマ曲ID'])}.html`)}</p>`);
      }
    }
  }

  if (character['登場作品ID']) {
    const ids = character['登場作品ID'].split(/\s*,\s*/).filter(Boolean);
    const items = ids.map(id => {
      const work = works.find(w => workId(w) === id);
      if (!work) return '';
      const title = workTitle(work, en);
      if (!title) return '';
      const number = workNumber(work);
      const label = number ? `${number} — ${title}` : title;
      return `<li>${linkItem(label, `../works/${encodeURIComponent(workUrl(work))}.html`)}</li>`;
    }).filter(Boolean).join('');
    if (items) html += section(t('appearances'), `<ul class="related-list">${items}</ul>`);
  }

  const profile = pick(character, 'プロフィール', 'プロフィール英語');
  if (profile) html += section(t('profile'), `<p>${profile}</p>`);

  root.innerHTML = `<div id="language-switch">${langButton()}</div>` + html;
  document.documentElement.lang = getLanguage();
}

main().catch(error => {
  document.getElementById('character').innerHTML = `<p>${error.message}</p>`;
});
