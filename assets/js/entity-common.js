function escapeHtml(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function characterIds(v){return String(v||'').split(/[、,;\s]+/).filter(Boolean)}
function characterUrl(v){return String(v||'').trim().toLowerCase().replace(/\./g,'-')}
function characterValue(row,ja,en){return getLanguage()==='en'?(row[en]||''):(row[ja]||'')}
function characterRelatedCard(h,main,sub='',type='work'){const cls=type==='song'?'character-092-song-card':'character-092-work-card';return `<a class="${cls}" href="${escapeHtml(h)}"><div class="character-092-card-title">${escapeHtml(main)}</div>${sub?`<div class="character-092-card-subtitle">${escapeHtml(sub)}</div>`:''}</a>`}
function characterSongCard(s){const main=characterValue(s,'title_ja','title_en')||s.song_id;const sub=getLanguage()==='en'?(s.title_ja||''):(s.title_en||'');return characterRelatedCard(`../songs/${characterUrl(s.url_id)}.html`,main,sub,'song')}
function characterWorkCard(w){const main=characterValue(w,'title_ja','title_en')||w.work_id;const sub=getLanguage()==='en'?(w.title_ja||''):(w.title_en||'');return characterRelatedCard(`../works/${characterUrl(w.url_id)}.html`,main,sub,'work')}
