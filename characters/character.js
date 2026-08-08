const csvUrl = '../kagamito/pages/characters.csv';
const songsUrl = '../kagamito/pages/songs.csv';
const worksUrl = '../kagamito/pages/works.csv';

function parseCSV(text) {
  const rows = [];
  let row = [], field = '', quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; } else quoted = false;
      } else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
    else if (c !== '\r') field += c;
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  const headers = rows.shift().map(v => v.trim());
  return rows.filter(r => r.some(v => v.trim() !== '')).map(r => Object.fromEntries(headers.map((h, i) => [h, (r[i] ?? '').trim()])));
}

function addSection(main, title, content) {
  if (!content) return;
  const section = document.createElement('section');
  section.className = 'character-section';
  const h2 = document.createElement('h2'); h2.textContent = title;
  section.append(h2, content);
  main.appendChild(section);
}

function textBlock(text) { const p = document.createElement('p'); p.textContent = text; return p; }
function linkList(items, hrefs) {
  const ul = document.createElement('ul'); ul.className = 'related-list';
  items.forEach((item, i) => { const li = document.createElement('li'); const a = document.createElement('a'); a.href = hrefs[i]; a.textContent = item; li.appendChild(a); ul.appendChild(li); });
  return ul;
}

async function initCharacter() {
  const root = document.querySelector('[data-url-id]');
  const slug = root.dataset.urlId;
  const main = document.getElementById('character');
  try {
    const [charsRes, songsRes, worksRes] = await Promise.all([fetch(csvUrl), fetch(songsUrl), fetch(worksUrl)]);
    if (!charsRes.ok) throw new Error(`characters.csv を読み込めませんでした (${charsRes.status})`);
    const characters = parseCSV(await charsRes.text());
    const songs = songsRes.ok ? parseCSV(await songsRes.text()) : [];
    const works = worksRes.ok ? parseCSV(await worksRes.text()) : [];
    const c = characters.find(x => x['URL ID'] === slug);
    if (!c) throw new Error(`URL ID「${slug}」のキャラクターが見つかりません。`);

    document.title = `${c['日本語名']} - Kagamito Official`;
    const header = document.createElement('header'); header.className = 'character-header';
    if (c['二つ名']) { const epithet = document.createElement('p'); epithet.textContent = c['二つ名']; header.appendChild(epithet); }
    const h1 = document.createElement('h1'); h1.textContent = c['日本語名']; header.appendChild(h1);
    if (c['読み']) { const p = textBlock(c['読み']); p.className = 'character-reading'; header.appendChild(p); }
    if (c['English Name']) { const p = textBlock(c['English Name']); p.className = 'character-english'; header.appendChild(p); }
    main.appendChild(header);

    if (c['容姿画像パス']) { const img = document.createElement('img'); img.className = 'character-image'; img.src = `../${c['容姿画像パス']}`; img.alt = c['日本語名']; main.appendChild(img); }
    addSection(main, '能力', c['能力'] ? textBlock(c['能力']) : null);
    addSection(main, '能力詳細', c['能力詳細'] ? textBlock(c['能力詳細']) : null);
    addSection(main, '立場', c['立場'] ? textBlock(c['立場']) : null);
    addSection(main, 'プロフィール', c['プロフィール'] ? textBlock(c['プロフィール']) : null);

    const songIds = (c['テーマ曲ID'] || '').split(/\s*,\s*/).filter(Boolean);
    const songNames = songIds.map(id => songs.find(s => s['Music ID'] === id)).filter(Boolean);
    if (songNames.length) addSection(main, 'テーマ曲', linkList(songNames.map(s => s['日本語曲名'] || s['English Title'] || s['Music ID']), songNames.map(s => `../songs/${encodeURIComponent(s['Music ID'])}.html`)));

    const workIds = (c['登場作品ID'] || '').split(/\s*,\s*/).filter(Boolean);
    const workRows = workIds.map(id => works.find(w => w['作品ID'] === id || w['Work ID'] === id)).filter(Boolean);
    if (workRows.length) addSection(main, '登場作品', linkList(workRows.map(w => w['日本語タイトル'] || w['作品名'] || w['作品ID'] || w['Work ID']), workRows.map(w => `../works/${encodeURIComponent(w['作品ID'] || w['Work ID'])}.html`)));
  } catch (e) {
    main.textContent = e.message;
  }
}
initCharacter();
