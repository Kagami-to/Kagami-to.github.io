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
  const root=document.documentElement;
  const initialWidth=window.innerWidth||root.clientWidth||0;
  const initialHeight=window.innerHeight||root.clientHeight||0;
  const vmin=Math.min(initialWidth,initialHeight);
  const vmax=Math.max(initialWidth,initialHeight);
  root.dataset.layoutMode=initialWidth<=700?'mobile':'desktop';
  root.style.setProperty('--locked-viewport-width',initialWidth+'px');
  root.style.setProperty('--locked-viewport-height',initialHeight+'px');
  root.style.setProperty('--locked-viewport-vmin',vmin+'px');
  root.style.setProperty('--locked-viewport-vmax',vmax+'px');
  root.style.width=initialWidth+'px';
  root.style.minWidth=initialWidth+'px';
  root.style.maxWidth=initialWidth+'px';
  if(document.body){document.body.style.width=initialWidth+'px';document.body.style.minWidth=initialWidth+'px';document.body.style.maxWidth=initialWidth+'px'}

  function lockedUnitCss(text){
    return text
      .replace(/(-?(?:\d+\.?\d*|\.\d+))vmin\b/gi,(m,n)=>`calc(var(--locked-viewport-vmin) * ${Number(n)/100})`)
      .replace(/(-?(?:\d+\.?\d*|\.\d+))vmax\b/gi,(m,n)=>`calc(var(--locked-viewport-vmax) * ${Number(n)/100})`)
      .replace(/(-?(?:\d+\.?\d*|\.\d+))vw\b/gi,(m,n)=>`calc(var(--locked-viewport-width) * ${Number(n)/100})`)
      .replace(/(-?(?:\d+\.?\d*|\.\d+))vh\b/gi,(m,n)=>`calc(var(--locked-viewport-height) * ${Number(n)/100})`)
      .replace(/(-?(?:\d+\.?\d*|\.\d+))dvh\b/gi,(m,n)=>`calc(var(--locked-viewport-height) * ${Number(n)/100})`);
  }

  function processRules(rules){
    for(const rule of rules){
      try{
        if(rule.type===CSSRule.STYLE_RULE){
          const before=rule.style.cssText;
          const after=lockedUnitCss(before);
          if(before!==after)rule.style.cssText=after;
        }else if(rule.cssRules){
          processRules(rule.cssRules);
        }
      }catch(e){/* Ignore cross-origin or non-modifiable rules. */}
    }
  }

  function processSheets(){
    for(const sheet of Array.from(document.styleSheets)){
      try{if(sheet.cssRules)processRules(sheet.cssRules)}catch(e){/* Cross-origin stylesheets are intentionally skipped. */}
    }
  }

  processSheets();
  const observer=new MutationObserver(()=>processSheets());
  observer.observe(document.documentElement,{childList:true,subtree:true});
  const reloadOnRotate=()=>location.reload();
  window.addEventListener('orientationchange',reloadOnRotate,{passive:true});
  if(window.screen&&window.screen.orientation)window.screen.orientation.addEventListener('change',reloadOnRotate,{passive:true});
})();
