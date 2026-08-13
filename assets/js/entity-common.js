function escapeHtml(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function characterIds(v){return String(v||'').split(/[、,;\s]+/).filter(Boolean)}
function characterUrl(v){return String(v||'').trim().toLowerCase().replace(/\./g,'-')}
function characterValue(row,ja,en){return getLanguage()==='en'?(row[en]||''):(row[ja]||'')}
function characterCardData(c){const en=getLanguage()==='en';const epithet=en?(c.epithet_en||''):(c.epithet_ja||'');if(epithet)return {lines:en?[epithet,c.name_en||c.character_id,c.name_ja||'']:[epithet,c.name_ja||c.character_id]};return {lines:en?[c.name_en||c.character_id,c.name_ja||'']:[c.name_ja||c.character_id]}}
function workCardData(w){const en=getLanguage()==='en';return {lines:en?[w.title_en||w.work_id,w.subtitle_en||'']:[w.title_ja||w.work_id,w.title_en||'']}}
function songCardData(s){const en=getLanguage()==='en';return {lines:en?[s.title_en||s.song_id,s.title_ja||'']:[s.title_ja||s.song_id]}}
function characterRelatedCard(h,main,sub='',type='work',extraLines=[]){const path=String(h||'').toLowerCase();const resolvedType=path.includes('/songs/')?'song':path.includes('/characters/')?'character':path.includes('/works/')?'work':type;const cls=resolvedType==='song'?'entity-card entity-card-song':resolvedType==='character'?'entity-card entity-card-character':'entity-card entity-card-work';const lines=[main,...(sub?[sub]:[]),...extraLines].filter(Boolean);return `<a class="${cls}" href="${escapeHtml(h)}"><span class="entity-card-icon" aria-hidden="true">${resolvedType==='song'?'♪':''}</span><div class="entity-card-text">${lines.map((x,i)=>`<div class="entity-card-line entity-card-line-${i+1}">${escapeHtml(x)}</div>`).join('')}</div></a>`}
function characterSongCard(s){const d=songCardData(s);return characterRelatedCard(`../songs/${characterUrl(s.url_id)}.html`,d.lines[0],d.lines[1],'song')}
function characterWorkCard(w){const d=workCardData(w);return characterRelatedCard(`../works/${characterUrl(w.url_id)}.html`,d.lines[0],d.lines[1],'work')}
function entityCharacterCard(c,h){const d=characterCardData(c);return characterRelatedCard(h,d.lines[0],d.lines[1],'character',d.lines.slice(2))}
function entityWorkCard(w,h){const d=workCardData(w);return characterRelatedCard(h,d.lines[0],d.lines[1],'work')}
function entitySongCard(s,h){const d=songCardData(s);return characterRelatedCard(h,d.lines[0],d.lines[1],'song')}
function entityCard(h,main,japanese='',subtitle='',type='work'){return characterRelatedCard(h,main,japanese||subtitle,type)}
