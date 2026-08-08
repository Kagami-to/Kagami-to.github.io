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
  return rows.filter(r => r.some(v => v.trim() !== '')).map(r => Object.fromEntries(headers.map((h, i) => [h, (r[i] ?? '').trim()])));
}

async function loadCSV(path) {
  const response = await fetch(path);
  if (!response.ok) throw new Error(`CSVを読み込めませんでした (${response.status})`);
  return parseCSV(await response.text());
}

function section(title, content) {
  if (!content) return '';
  return `<section class="character-section"><h2>${escapeHtml(title)}</h2>${content}</section>`;
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

function linkHtml(href, text) {
  return `<a href="${escapeHtml(href)}">${escapeHtml(text)}</a>`;
}

async function renderSong(id) {
  const songs = await loadCSV('../kagamito/pages/songs.csv');
  const song = songs.find(x => x['Music ID'] === id);
  if (!song) throw new Error('楽曲が見つかりません。');
  document.title = `${song['日本語曲名'] || id} - Kagamito Official`;
  document.getElementById('page-title').textContent = song['日本語曲名'] || id;
  if (song['English Title']) document.getElementById('subtitle').textContent = song['English Title'];
  const works = await loadCSV('../kagamito/pages/works.csv');
  const chars = await loadCSV('../kagamito/pages/characters.csv');
  const body = document.getElementById('page-content');
  let html = '';
  if (song['作品ID']) {
    const ids = song['作品ID'].split(/[、;\s]+/).filter(Boolean);
    html += section('作品', `<ul class="related-list">${ids.map(w => { const x = works.find(v => v['Work ID'] === w); return x ? `<li>${linkHtml(`../works/${encodeURIComponent(w)}.html`, x['日本語タイトル'])}</li>` : ''; }).join('')}</ul>`);
  }
  if (song['使用シーン']) html += section('使用シーン', `<p>${escapeHtml(song['使用シーン'])}</p>`);
  if (song['[EN]Scene']) html += section('Scene', `<p>${escapeHtml(song['[EN]Scene'])}</p>`);
  if (song['テーマキャラクターID']) {
    const ids = song['テーマキャラクターID'].split(/[、;\s]+/).filter(Boolean);
    html += section('テーマキャラクター', `<ul class="related-list">${ids.map(c => { const x = chars.find(v => v['Character ID'] === c); return x ? `<li>${linkHtml(`../characters/${encodeURIComponent(x['URL ID'])}.html`, x['日本語名'])}</li>` : ''; }).join('')}</ul>`);
  }
  if (song['最新版 YouTube URL']) html += section('YouTube', `<p><a href="${escapeHtml(song['最新版 YouTube URL'])}" target="_blank" rel="noopener">最新版を見る</a></p>`);
  if (song['古いバージョンのURL']) html += section('旧バージョン', `<p><a href="${escapeHtml(song['古いバージョンのURL'])}" target="_blank" rel="noopener">旧バージョンを見る</a></p>`);
  if (song['概要']) html += section('概要', `<p>${escapeHtml(song['概要']).replace(/\n/g, '<br>')}</p>`);
  body.innerHTML = html;
}

async function renderWork(id) {
  const works = await loadCSV('../kagamito/pages/works.csv');
  const work = works.find(x => x['Work ID'] === id);
  if (!work) throw new Error('作品が見つかりません。');
  document.title = `${work['日本語タイトル'] || id} - Kagamito Official`;
  document.getElementById('page-title').textContent = work['日本語タイトル'] || id;
  if (work['English Title']) document.getElementById('subtitle').textContent = work['English Title'];
  const songs = await loadCSV('../kagamito/pages/songs.csv');
  const chars = await loadCSV('../kagamito/pages/characters.csv');
  const body = document.getElementById('page-content');
  let html = '';
  if (work['作品画像パス']) html += section('作品画像', `<img class="character-image" src="../${escapeHtml(work['作品画像パス'])}" alt="${escapeHtml(work['日本語タイトル'])}">`);
  if (work['作品種別']) html += section('作品種別', `<p>${escapeHtml(work['作品種別'])}</p>`);
  if (work['ナンバリング']) html += section('ナンバリング', `<p>${escapeHtml(work['ナンバリング'])}</p>`);
  if (work['概要']) html += section('概要', `<p>${escapeHtml(work['概要']).replace(/\n/g, '<br>')}</p>`);
  const songRows = songs.filter(s => s['作品ID'] === id);
  if (songRows.length) html += section('楽曲', `<ul class="related-list">${songRows.map(s => `<li>${linkHtml(`../songs/${encodeURIComponent(s['Music ID'])}.html`, s['日本語曲名'] || s['Music ID'])}</li>`).join('')}</ul>`);
  const charRows = chars.filter(c => c['初登場作品ID'] === id || (c['登場作品ID'] || '').split(/[、;\s]+/).includes(id));
  if (charRows.length) html += section('登場キャラクター', `<ul class="related-list">${charRows.map(c => `<li>${linkHtml(`../characters/${encodeURIComponent(c['URL ID'])}.html`, c['日本語名'])}</li>`).join('')}</ul>`);
  body.innerHTML = html;
}

async function renderList(kind) {
  const config = kind === 'songs' ? { title:'Songs', csv:'../kagamito/pages/songs.csv', id:'Music ID', name:'日本語曲名', dir:'../songs/' } : { title:'Works', csv:'../kagamito/pages/works.csv', id:'Work ID', name:'日本語タイトル', dir:'../works/' };
  document.title = `${config.title} - Kagamito Official`;
  document.getElementById('page-title').textContent = config.title;
  const rows = await loadCSV(config.csv);
  const list = document.getElementById('entity-list');
  rows.forEach(row => {
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.href = `${encodeURIComponent(row[config.id])}.html`;
    a.textContent = row[config.name] || row[config.id];
    li.appendChild(a); list.appendChild(li);
  });
}
