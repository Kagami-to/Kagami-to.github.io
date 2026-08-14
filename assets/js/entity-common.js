function escapeHtml(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function characterIds(v){return String(v||'').split(/[、,;\s]+/).filter(Boolean)}
function characterUrl(v){return String(v||'').trim().toLowerCase().replace(/\./g,'-')}
function characterValue(row,ja,en){return getLanguage()==='en'?(row[en]||''):(row[ja]||'')}
function characterCardData(c){const en=getLanguage()==='en';const epithet=en?(c.epithet_en||''):(c.epithet_ja||'');return {noEpithet:!epithet,epithet,main:en?(c.name_en||c.character_id):(c.name_ja||c.character_id),secondary:en?(c.name_ja||''):''}}
function workCardData(w){const en=getLanguage()==='en';return {lines:en?[w.title_en||w.work_id,w.subtitle_en||'']:[w.title_ja||w.work_id,w.title_en||'']}}
function songCardData(s){const en=getLanguage()==='en';return {lines:en?[s.title_en||s.song_id,s.title_ja||'']:[s.title_ja||s.song_id]}}
function glossaryCardData(g){const en=getLanguage()==='en';return {main:en?(g.term_en||g.term_ja||g.term_id):(g.term_ja||g.term_en||g.term_id),secondary:en?(g.term_ja||''):(g.reading_ja||'')}}
function characterRelatedCard(h,main,sub='',type='work',extraLines=[],options={}){const path=String(h||'').toLowerCase();const resolvedType=path.includes('/songs/')?'song':path.includes('/characters/')?'character':path.includes('/glossary/')?'glossary':path.includes('/works/')?'work':type;const cls=resolvedType==='song'?'entity-card entity-card-song':resolvedType==='character'?'entity-card entity-card-character':resolvedType==='glossary'?'entity-card entity-card-glossary':'entity-card entity-card-work';const lines=[main,...(sub?[sub]:[]),...extraLines].filter(Boolean);if(resolvedType==='character'&&options.characterStructured){return `<a class="${cls}" href="${escapeHtml(h)}"><span class="entity-card-icon" aria-hidden="true"></span><div class="entity-card-text">${options.epithet?`<div class="entity-card-character-epithet">${escapeHtml(options.epithet)}</div>`:''}<div class="entity-card-character-main">${escapeHtml(options.main)}</div>${options.secondary?`<div class="entity-card-character-secondary">${escapeHtml(options.secondary)}</div>`:''}</div></a>`}return `<a class="${cls}" href="${escapeHtml(h)}"><span class="entity-card-icon" aria-hidden="true">${resolvedType==='song'?'♪':''}</span><div class="entity-card-text">${lines.map((x,i)=>`<div class="entity-card-line entity-card-line-${i+1}">${escapeHtml(x)}</div>`).join('')}</div></a>`}
function characterSongCard(s){const d=songCardData(s);return characterRelatedCard(`../songs/${characterUrl(s.url_id)}.html`,d.lines[0],d.lines[1],'song')}
function characterWorkCard(w){const d=workCardData(w);return characterRelatedCard(`../works/${characterUrl(w.url_id)}.html`,d.lines[0],d.lines[1],'work')}
function entityCharacterCard(c,h){const d=characterCardData(c);return characterRelatedCard(h,d.main,d.secondary,'character',[],{characterStructured:true,epithet:d.epithet,main:d.main,secondary:d.secondary})}
function entityWorkCard(w,h){const d=workCardData(w);return characterRelatedCard(h,d.lines[0],d.lines[1],'work')}
function entitySongCard(s,h){const d=songCardData(s);return characterRelatedCard(h,d.lines[0],d.lines[1],'song')}
function entityGlossaryCard(g,h){const d=glossaryCardData(g);return characterRelatedCard(h,d.main,d.secondary,'glossary')}
function entityCard(h,main,japanese='',subtitle='',type='work'){return characterRelatedCard(h,main,japanese||subtitle,type)}

(function(){
  function lock(){
    const width=window.innerWidth||document.documentElement.clientWidth||0;
    const root=document.documentElement;
    root.dataset.layoutMode=width<=700?'mobile':'desktop';
    root.style.setProperty('--locked-viewport-width',width+'px');
    root.style.width=width+'px';
    root.style.minWidth=width+'px';
    root.style.maxWidth=width+'px';
    if(document.body){
      document.body.style.width=width+'px';
      document.body.style.minWidth=width+'px';
      document.body.style.maxWidth=width+'px';
    }
  }
  lock();
  window.addEventListener('load',lock,{once:true,passive:true});
  window.addEventListener('orientationchange',()=>requestAnimationFrame(lock),{passive:true});
  if(window.screen&&window.screen.orientation)window.screen.orientation.addEventListener('change',()=>requestAnimationFrame(lock),{passive:true});
})();
