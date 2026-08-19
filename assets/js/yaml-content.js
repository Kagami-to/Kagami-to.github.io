function yamlContentEntities(characters, glossary, works, songs, currentId, lang) {
  const entities = [];
  const add = (name, url, kind) => {
    const clean = String(name || '').trim();
    if (!clean) return;
    entities.push({ name: clean, url, kind });
  };
  characters.forEach(row => {
    const rowId = String(row.character_id || '').trim();
    if (rowId === String(currentId || '').trim()) return;
    const name = lang === 'en' ? (row.name_en || '') : (row.name_ja || '');
    add(name, `/characters/${urlId(row.url_id)}/`, 'character');
  });
  glossary.forEach(row => {
    const rowId = String(row.term_id || '').trim();
    if (rowId === String(currentId || '').trim()) return;
    const name = lang === 'en' ? (row.term_en || '') : (row.term_ja || '');
    add(name, `/glossary/${urlId(row.url_id)}/`, 'glossary');
  });
  works.forEach(row => {
    const name = lang === 'en' ? (row.title_en || '') : (row.title_ja || '');
    add(name, `/works/${urlId(row.url_id)}/`, 'work');
  });
  songs.forEach(row => {
    const name = lang === 'en' ? (row.title_en || '') : (row.title_ja || '');
    add(name, `/songs/${urlId(row.url_id)}/`, 'song');
  });
  entities.sort((a, b) => b.name.length - a.name.length || a.kind.localeCompare(b.kind) || a.name.localeCompare(b.name));
  const unique = new Map();
  entities.forEach(entity => { if (!unique.has(entity.name)) unique.set(entity.name, entity); });
  return [...unique.values()];
}

function yamlContentLinkify(text, entities) {
  const source = escapeHtml(String(text || ''));
  if (!entities.length) return source;
  const byName = new Map(entities.map(entity => [escapeHtml(entity.name), entity]));
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
  if (Array.isArray(value)) {
    return value
      .filter(block => block && typeof block === 'object')
      .map(block => ({ align: block.align === 'right' ? 'right' : 'left', text: String(block.text ?? '') }));
  }
  if (typeof value === 'string' && value.length) return [{ align: 'left', text: value }];
  return [];
}

function yamlContentToggleLabel(section, lang, open) {
  const key = lang === 'en' ? 'toggle_en' : 'toggle_ja';
  const fallback = lang === 'en' ? (open ? 'Show content' : 'Hide content') : (open ? '内容を表示' : '内容を隠す');
  return String(section?.[key]?.[open ? 'open' : 'close'] || fallback);
}

function yamlContentWorkCard(work, lang) {
  const title = lang === 'en' ? (work.title_en || work.title_ja || '') : (work.title_ja || work.title_en || '');
  const subtitle = lang === 'en' ? (work.title_ja || '') : (work.title_en || '');
  const href = `/works/${urlId(work.url_id)}/`;
  return `<a class="yaml-content-related-card" href="${escapeHtml(href)}"><span class="yaml-content-related-card-title">${escapeHtml(title)}</span>${subtitle ? `<span class="yaml-content-related-card-subtitle">${escapeHtml(subtitle)}</span>` : ''}</a>`;
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

  sections.forEach((section, index) => {
    if (!section || typeof section !== 'object') return;

    const rawContent = lang === 'en' ? section.content_en : section.content_ja;
    const blocks = yamlContentBlocks(rawContent);
    if (!blocks.length) return;

    const heading = lang === 'en' ? (section.title_en || '') : (section.title_ja || '');
    const relatedWorks = Array.isArray(section.related_works) ? section.related_works : (Array.isArray(section.works) ? section.works : []);

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
    blocks.forEach(block => {
      const element = document.createElement('div');
      element.className = 'yaml-content-block';
      element.style.textAlign = block.align;
      element.innerHTML = yamlContentLinkify(block.text, entities).replace(/\n/g, '<br>');
      body.appendChild(element);
    });

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

    if (relatedWorks.length) {
      const related = document.createElement('div');
      related.className = 'yaml-content-related-list';
      relatedWorks.forEach(id => {
        const work = (context?.works || []).find(row => String(row.work_id || '').trim() === String(id).trim());
        if (work) related.insertAdjacentHTML('beforeend', yamlContentWorkCard(work, lang));
      });
      sectionEl.appendChild(related);
    }

    root.appendChild(sectionEl);

    if (index < sections.length - 1) {
      const remaining = sections.slice(index + 1).some(candidate => {
        if (!candidate || typeof candidate !== 'object') return false;
        return yamlContentBlocks(lang === 'en' ? candidate.content_en : candidate.content_ja).length > 0;
      });
      if (remaining) {
        const divider = document.createElement('div');
        divider.className = 'yaml-content-divider';
        divider.setAttribute('aria-hidden', 'true');
        root.appendChild(divider);
      }
    }
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
