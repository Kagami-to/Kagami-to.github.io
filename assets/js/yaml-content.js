function yamlContentEntities(characters, glossary, works, songs, currentId, lang) {
  const entities = new Map();
  const add = (id, name, url, kind, row) => {
    const cleanId = String(id || '').trim();
    const cleanName = String(name || '').trim();
    const cleanUrl = String(url || '').trim();
    if (!cleanId || !cleanName || !cleanUrl) return;
    if (cleanId === String(currentId || '').trim()) return;
    if (!entities.has(cleanId)) entities.set(cleanId, { id: cleanId, name: cleanName, url: cleanUrl, kind, row });
  };
  characters.forEach(row => {
    const id = String(row.character_id || '').trim();
    const name = lang === 'en' ? (row.name_en || '') : (row.name_ja || '');
    if (name) add(id, name, `/characters/${urlId(row.url_id)}/`, 'character', row);
  });
  glossary.forEach(row => {
    const id = String(row.term_id || '').trim();
    const name = lang === 'en' ? (row.term_en || '') : (row.term_ja || '');
    if (name) add(id, name, `/glossary/${urlId(row.url_id)}/`, 'glossary', row);
  });
  works.forEach(row => {
    const id = String(row.work_id || '').trim();
    const name = lang === 'en' ? (row.title_en || '') : (row.title_ja || '');
    if (name) add(id, name, `/works/${urlId(row.url_id)}/`, 'work', row);
  });
  songs.forEach(row => {
    const id = String(row.song_id || '').trim();
    const name = lang === 'en' ? (row.title_en || '') : (row.title_ja || '');
    if (name) add(id, name, `/songs/${urlId(row.url_id)}/`, 'song', row);
  });
  return entities;
}

function yamlContentLinkify(text, entities) {
  const source = escapeHtml(String(text || ''));
  if (!entities.size) return source;
  const byName = new Map([...entities.values()].map(entity => [escapeHtml(entity.name), entity]));
  const pattern = [...byName.keys()]
    .sort((a, b) => b.length - a.length)
    .map(name => name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    .join('|');
  if (!pattern) return source;
  const regex = new RegExp(pattern, 'g');
  let output = '';
  let last = 0;
  let match;
  while ((match = regex.exec(source))) {
    output += source.slice(last, match.index);
    const entity = byName.get(match[0]);
    output += `<a class="yaml-content-inline-link yaml-content-inline-link-${entity.kind}" href="${escapeHtml(entity.url)}">${match[0]}</a>`;
    last = match.index + match[0].length;
  }
  return output + source.slice(last);
}

function yamlContentBlocks(value) {
  const normalizeItem = item => {
    if (item && typeof item === 'object') {
      if (item.type === 'entity') return { type: 'entity', id: String(item.id || '').trim() };
      if (item.type === 'text') return { type: 'text', align: item.align === 'right' ? 'right' : 'left', text: String(item.text ?? '') };
      if ('text' in item) return { type: 'text', align: item.align === 'right' ? 'right' : 'left', text: String(item.text ?? '') };
      return null;
    }
    const text = String(item ?? '');
    return /^[PCMT]\d+$/.test(text.trim())
      ? { type: 'entity', id: text.trim() }
      : { type: 'text', align: 'left', text };
  };
  if (Array.isArray(value)) return value.map(normalizeItem).filter(Boolean);
  if (typeof value === 'string' && value.length) {
    const text = value.trim();
    if (/^[PCMT]\d+$/.test(text)) return [{ type: 'entity', id: text }];
    return [{ type: 'text', align: 'left', text: value }];
  }
  return [];
}

function yamlContentToggleLabel(section, lang, open) {
  const key = lang === 'en' ? 'toggle_en' : 'toggle_ja';
  const fallback = lang === 'en' ? (open ? 'Show content' : 'Hide content') : (open ? '内容を表示' : '内容を隠す');
  return String(section?.[key]?.[open ? 'open' : 'close'] || fallback);
}

function yamlContentCard(entity) {
  if (!entity) return '';
  const row = entity.row || {};
  if (entity.kind === 'work' && typeof entityWorkCard === 'function') return entityWorkCard(row, entity.url);
  if (entity.kind === 'character' && typeof entityCharacterCard === 'function') return entityCharacterCard(row, entity.url);
  if (entity.kind === 'song' && typeof entitySongCard === 'function') return entitySongCard(row, entity.url);
  if (entity.kind === 'glossary' && typeof entityGlossaryCard === 'function') return entityGlossaryCard(row, entity.url);
  return `<a class="yaml-content-related-card" href="${escapeHtml(entity.url)}"><span class="yaml-content-related-card-title">${escapeHtml(entity.name)}</span></a>`;
}

function renderYamlContent(data, root, context) {
  if (!root) return;
  root.innerHTML = '';
  if (!data || typeof data !== 'object') return;

  const lang = getLanguage() === 'en' ? 'en' : 'ja';
  const currentId = String(context?.currentId || data.id || '').trim();
  const entities = yamlContentEntities(
    context?.characters || [],
    context?.glossary || [],
    context?.works || [],
    context?.songs || [],
    currentId,
    lang,
  );
  const sections = Array.isArray(data.sections) ? data.sections : [];

  sections.forEach(section => {
    if (!section || typeof section !== 'object') return;

    const rawContent = lang === 'en' ? section.content_en : section.content_ja;
    const blocks = yamlContentBlocks(rawContent);
    if (!blocks.length) return;

    const heading = lang === 'en' ? (section.title_en || '') : (section.title_ja || '');
    const sectionEl = document.createElement('section');
    sectionEl.className = 'yaml-content-section';

    if (heading) {
      const h = document.createElement('h2');
      h.className = 'yaml-content-heading';
      h.textContent = heading;
      sectionEl.appendChild(h);
    }

    const body = document.createElement('div');
    body.className = 'yaml-content-body';
    const cards = [];

    blocks.forEach(block => {
      if (block.type === 'entity') {
        const entity = entities.get(block.id);
        if (entity) cards.push(yamlContentCard(entity));
        return;
      }

      if (!block.text.trim()) return;
      const element = document.createElement('div');
      element.className = 'yaml-content-block';
      element.style.textAlign = block.align;
      element.innerHTML = yamlContentLinkify(block.text, entities).replace(/\n/g, '<br>');
      body.appendChild(element);
    });

    if (body.children.length) {
      if (section.display === 'collapsible') {
        const details = document.createElement('details');
        details.className = 'yaml-content-collapsible';
        const summary = document.createElement('summary');
        summary.className = 'yaml-content-toggle';
        const label = document.createElement('span');
        label.className = 'yaml-content-toggle-label';
        label.textContent = yamlContentToggleLabel(section, lang, true);
        summary.appendChild(label);
        details.appendChild(summary);
        details.appendChild(body);
        details.addEventListener('toggle', () => {
          label.textContent = yamlContentToggleLabel(section, lang, !details.open);
        });
        sectionEl.appendChild(details);
      } else {
        sectionEl.appendChild(body);
      }
    }

    if (cards.length) {
      const related = document.createElement('div');
      related.className = 'yaml-content-related-list';
      related.innerHTML = cards.join('');
      sectionEl.appendChild(related);
    }

    if (sectionEl.children.length) root.appendChild(sectionEl);
  });

  const rendered = [...root.children].filter(el => el.classList.contains('yaml-content-section'));
  rendered.forEach((section, index) => {
    if (index >= rendered.length - 1) return;
    const divider = document.createElement('div');
    divider.className = 'yaml-content-divider';
    divider.setAttribute('aria-hidden', 'true');
    section.after(divider);
  });
}

async function loadYamlContent(jsonUrl, root, currentId) {
  const [characters, glossary, works, songs] = await Promise.all([
    loadCSV('../data/characters.csv'),
    loadCSV('../data/glossary.csv').catch(() => []),
    loadCSV('../data/works.csv'),
    loadCSV('../data/songs.csv'),
  ]);
  const response = await fetch(siteDataUrl(jsonUrl), { cache: 'no-store' });
  if (!response.ok) throw new Error('YAML content could not be loaded.');
  const data = await response.json();
  renderYamlContent(data, root, { currentId, characters, glossary, works, songs });
  return data;
}
