async function loadCharacterCSV(path){const r=await fetch(path,{cache:'no-store'});if(!r.ok)throw new Error(`CSVを読み込めませんでした (${r.status})`);return parseCSV(await r.text())}
function characterIds(v){return String(v||'').split(/[、,;\s]+/).filter(Boolean)}
function characterUrl(v){return String(v||'').trim().toLowerCase().replace(/\./g,'-')}
function characterValue(row,ja,en){return getLanguage()==='en'?(row[en]||''):(row[ja]||'')}
function characterRelatedCard(h,main,sub='',className='character-work-card'){return `<a class="${className}" href="${escapeHtml(h)}"><div class="character-card-title">${escapeHtml(main)}</div>${sub?`<div class="character-card-subtitle">${escapeHtml(sub)}</div>`:''}</a>`}
function characterSongCard(s){const main=characterValue(s,'title_ja','title_en')||s.song_id;const sub=getLanguage()==='en'?(s.title_ja||''):(s.title_en||'');return characterRelatedCard(`/songs/${characterUrl(s.url_id)}.html`,main,sub,'character-song-card')}
function characterWorkCard(w){const main=characterValue(w,'title_ja','title_en')||w.work_id;const sub=getLanguage()==='en'?(w.title_ja||''):(w.title_en||'');return characterRelatedCard(`/works/${characterUrl(w.url_id)}.html`,main,sub)}

async function renderCharacter(id){
  const [characters,songs,works]=await Promise.all([loadCharacterCSV('/kagamito/pages/characters.csv'),loadCharacterCSV('/kagamito/pages/songs.csv'),loadCharacterCSV('/kagamito/pages/works.csv')]);
  const c=characters.find(x=>characterUrl(x.url_id)===characterUrl(id));
  if(!c)throw new Error(t('notFound'));
  const en=getLanguage()==='en';
  const name=en?(c.name_en||''):(c.name_ja||'');
  document.title=`${name} - Kagamito Official`;
  let h='<div class="character-toolbar"><a class="character-back" href="/characters/">← Back to Character List</a></div><article class="character-card">';
  h+='<section class="character-hero"><div class="character-info"><div class="character-identity">';
  h+=`<p class="character-epithet-detail">${escapeHtml(en?(c.epithet_en||''):(c.epithet_ja||''))}</p>`;
  h+=`<h1 class="character-name-detail">${escapeHtml(name)}</h1>`;
  h+=en?`<p class="character-name-secondary">${escapeHtml(c.name_ja||'')}</p>`:`<p class="character-reading-detail">${escapeHtml(c.reading_ja||'')}</p>`;
  h+='</div>';
  const ability=en?(c.ability_en||''):(c.ability_ja||'');
  if(ability)h+=`<p class="character-ability">${escapeHtml(ability)}</p>`;
  const themes=songs.filter(s=>characterIds(s.theme_character_ids).includes(c.character_id)&&(s.title_ja||s.title_en||'').trim());
  if(themes.length)h+=`<div class="character-song-area"><div class="character-related-list">${themes.map(s=>`<div>${characterSongCard(s)}</div>`).join('')}</div></div>`;
  h+='</div>';
  if(c.appearance_image)h+=`<div class="character-portrait"><img src="/${escapeHtml(c.appearance_image)}" alt="${escapeHtml(name)}"></div>`;else h+='<div class="character-portrait">IMAGE</div>';
  h+='</section><div class="character-divider" aria-hidden="true"><span></span><span class="character-diamond">◆</span><span></span></div>';
  const position=en?(c.position_en||''):(c.position_ja||'');
  if(position)h+=`<section class="character-section"><h2>${escapeHtml(t('position'))}</h2><div class="character-profile">${escapeHtml(position).replace(/\n/g,'<br>')}</div></section>`;
  const profile=en?(c.profile_en||''):(c.profile_ja||'');
  if(profile)h+=`<section class="character-section"><h2>${escapeHtml(t('profile'))}</h2><div class="character-profile">${escapeHtml(profile).replace(/\n/g,'<br>')}</div></section>`;
  const workIds=characterIds(c.appearance_work_ids);if(c.debut_work_id&&!workIds.includes(c.debut_work_id))workIds.unshift(c.debut_work_id);
  const appearances=workIds.map(id=>works.find(w=>w.work_id===id)).filter(Boolean);
  if(appearances.length)h+=`<section class="character-section"><h2>${escapeHtml(t('appearances'))}</h2><div class="character-related-list">${appearances.map(w=>`<div>${characterWorkCard(w)}</div>`).join('')}</div></section>`;
  h+='</article>';document.getElementById('character-page').innerHTML=h;
}
