function parseYamlDetail(text){
  const lines=text.replace(/\r/g,'').split('\n');
  const result={id:'',sections:[]};
  let section=null, block=null;
  for(let i=0;i<lines.length;i++){
    const raw=lines[i], trimmed=raw.trim();
    if(!trimmed||trimmed.startsWith('#')) continue;
    if(/^id:\s*/.test(trimmed)&&!section){result.id=trimmed.replace(/^id:\s*/, '').trim();continue}
    if(/^  - title_ja:\s*/.test(raw)){
      section={title_ja:trimmed.replace(/^\- title_ja:\s*/, '').trim(),title_en:'',content_ja:'',content_en:'',works:[]};
      result.sections.push(section); block=null; continue;
    }
    if(!section) continue;
    let m=trimmed.match(/^title_en:\s*(.*)$/); if(m){section.title_en=m[1].trim();continue}
    m=trimmed.match(/^content_(ja|en):\s*\|\s*$/); if(m){block=m[1];section['content_'+block]='';continue}
    if(/^works:\s*$/.test(trimmed)){block='works';continue}
    m=trimmed.match(/^\-\s+(C\d+|W\d+|S\d+|P\d+)\s*$/); if(m&&block==='works'){section.works.push(m[1]);continue}
    if(block==='ja'||block==='en'){
      const value=raw.replace(/^\s{6}/,'');
      section['content_'+block]+=(section['content_'+block]?'\n':'')+value;
    }
  }
  return result;
}

function yamlEsc(v){return escapeHtml(v||'').replace(/\n/g,'<br>')}
function previewWorkCard(work){
  const en=getLanguage()==='en';
  const main=en?(work.title_en||work.work_id):(work.title_ja||work.work_id);
  const sub=en?(work.subtitle_en||''):(work.title_en||'');
  const href=`../../../works/${characterUrl(work.url_id)}.html`;
  return `<a class="entity-card entity-card-work" href="${escapeHtml(href)}"><span class="entity-card-icon" aria-hidden="true"></span><div class="entity-card-text"><div class="entity-card-line entity-card-line-1">${escapeHtml(main)}</div>${sub?`<div class="entity-card-line entity-card-line-2">${escapeHtml(sub)}</div>`:''}</div></a>`;
}

async function renderYamlDetails(){
  const [characters,works,yamlText]=await Promise.all([
    loadCSV('../../../data/characters.csv'),
    loadCSV('../../../data/works.csv'),
    fetch('../data/C001.yaml',{cache:'no-store'}).then(r=>{if(!r.ok)throw new Error('YAMLを読み込めませんでした');return r.text()})
  ]);
  const character=characters.find(c=>c.character_id==='C001');
  if(!character)throw new Error(t('notFound'));
  const detail=parseYamlDetail(yamlText);
  const en=getLanguage()==='en';
  const root=document.getElementById('yaml-detail');
  root.innerHTML='';
  for(const section of detail.sections){
    const content=section[`content_${en?'en':'ja'}`]||section[`content_${en?'ja':'en'}`]||'';
    const workIds=section.works||[];
    if(!content&&!workIds.length)continue;
    const sectionEl=document.createElement('section');
    sectionEl.className='character-092-section';
    const heading=document.createElement('h2');
    heading.className='character-092-heading';
    heading.textContent=en?(section.title_en||section.title_ja):(section.title_ja||section.title_en);
    sectionEl.appendChild(heading);
    if(content){const body=document.createElement('div');body.className='character-092-profile';body.innerHTML=yamlEsc(content);sectionEl.appendChild(body)}
    if(workIds.length){
      const list=document.createElement('div');list.className='character-092-related-list';
      for(const id of workIds){const work=works.find(w=>w.work_id===id);if(work){const wrap=document.createElement('div');wrap.innerHTML=previewWorkCard(work);list.appendChild(wrap)}}
      sectionEl.appendChild(list);
    }
    root.appendChild(sectionEl);
    const divider=document.createElement('div');divider.className='character-092-divider';divider.setAttribute('aria-hidden','true');divider.innerHTML='<span></span><span class="character-092-diamond">◆</span><span></span>';root.appendChild(divider);
  }
  const last=root.lastElementChild;if(last?.classList.contains('character-092-divider'))last.remove();
}

async function renderPreviewCharacter(){
  const [characters,songs]=await Promise.all([loadCSV('../../../data/characters.csv'),loadCSV('../../../data/songs.csv')]);
  const c=characters.find(x=>x.character_id==='C001');
  const en=getLanguage()==='en';
  document.documentElement.lang=en?'en':'ja';
  document.getElementById('character-epithet').textContent=en?(c.epithet_en||''):(c.epithet_ja||'');
  document.getElementById('character-name').textContent=en?(c.name_en||''):(c.name_ja||'');
  document.getElementById('character-secondary').textContent=en?(c.name_ja||''):(c.reading_ja||'');
  document.getElementById('character-reading-wrap').style.display=en?'none':(c.reading_ja?'':'none');
  if(!en)document.getElementById('character-secondary').textContent=c.name_en||'';
  document.getElementById('character-ability').textContent=en?(c.ability_en||''):(c.ability_ja||'');
  document.getElementById('character-ability-wrap').style.display=(c.ability_ja||c.ability_en)?'':'none';
  const ids=characterIds(c.theme_song_ids);const list=document.getElementById('character-songs');
  list.innerHTML=ids.map(id=>songs.find(s=>s.song_id===id)).filter(Boolean).map(s=>`<div>${characterRelatedCard(`../../../songs/${characterUrl(s.url_id)}.html`,en?(s.title_en||s.song_id):(s.title_ja||s.song_id),en?(s.title_ja||''):'','song')}</div>`).join('');
  document.getElementById('character-song-section').style.display=list.children.length?'':'none';
  const imagePath=String(c.appearance_image||'').trim();
  const portrait=document.getElementById('character-portrait');
  document.getElementById('character-portrait-label').textContent=en?'IMAGE COMING SOON':'画像準備中';
  if(imagePath){const img=document.createElement('img');img.src=`../../../${imagePath}`;img.alt=c.name_ja;portrait.insertBefore(img,portrait.firstChild);portrait.classList.add('has-image')}
  await renderYamlDetails();
  characterFitAll();
}

document.addEventListener('DOMContentLoaded',()=>renderPreviewCharacter().catch(e=>{const t=document.getElementById('yaml-detail');if(t)t.textContent=e.message}));
