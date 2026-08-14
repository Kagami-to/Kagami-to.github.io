const GLOSSARY_DETAIL_CATEGORIES={place:{ja:'地名・施設・場所',en:'Places'},organization:{ja:'組織',en:'Organizations'},item:{ja:'道具・物品',en:'Items'},concept:{ja:'概念',en:'Concepts'},other:{ja:'その他'}};

/* Glossary YAML uses one deliberately small schema.  Parse that schema directly
   instead of trying to parse arbitrary YAML. */
function parseGlossaryYaml(text){
  const lines=String(text||'').replace(/\r/g,'').split('\n');
  const doc={id:'',sections:[]};
  const leading=line=>(line.match(/^ */)||[''])[0].length;
  const blank=line=>line.trim()==='';
  const stripScalar=s=>String(s??'').trim().replace(/^['"]|['"]$/g,'');
  const readBlock=(start,indent)=>{
    const out=[];let i=start;
    while(i<lines.length){
      const line=lines[i];
      if(!blank(line)&&leading(line)<indent)break;
      out.push(blank(line)?'':line.slice(indent));i++;
    }
    while(out.length&&!out[out.length-1])out.pop();
    return {text:out.join('\n'),next:i};
  };
  const readTextList=(start,contentIndent)=>{
    const blocks=[];let i=start;
    while(i<lines.length){
      while(i<lines.length&&blank(lines[i]))i++;
      if(i>=lines.length)break;
      if(leading(lines[i])<contentIndent)break;
      const m=lines[i].match(/^\s{6}-\s+align:\s*(left|right)\s*$/);
      if(!m)break;
      const block={align:m[1],text:''};i++;
      while(i<lines.length){
        if(lines[i].match(/^\s{6}-\s+align:\s*(left|right)\s*$/))break;
        const tm=lines[i].match(/^\s{8}text:\s*\|\s*$/);
        if(tm){const r=readBlock(i+1,10);block.text=r.text;i=r.next;continue;}
        if(!blank(lines[i])&&leading(lines[i])<contentIndent)break;
        i++;
      }
      blocks.push(block);
    }
    return {blocks,next:i};
  };

  let i=0;
  while(i<lines.length){
    const line=lines[i];
    if(blank(line)||line.trim().startsWith('#')){i++;continue;}
    const id=line.match(/^id:\s*(.+)$/);
    if(id){doc.id=stripScalar(id[1]);i++;continue;}
    if(!/^\s{2}-\s*$|^\s{2}-\s+/.test(line)){i++;continue;}

    const section={title_ja:'',title_en:'',content_ja:[],content_en:[]};
    const first=line.match(/^\s{2}-\s*(.*)$/)?.[1]||'';
    if(first){
      const kv=first.match(/^(title_ja|title_en):\s*(.*)$/);if(kv)section[kv[1]]=stripScalar(kv[2]);
    }
    doc.sections.push(section);i++;

    while(i<lines.length){
      const current=lines[i];
      if(/^\s{2}-\s+/.test(current)||/^\s{2}-$/.test(current))break;
      if(blank(current)){i++;continue;}

      let m=current.match(/^\s{4}(title_ja|title_en):\s*(.*)$/);
      if(m){section[m[1]]=stripScalar(m[2]);i++;continue;}

      m=current.match(/^\s{4}content_(ja|en):\s*(.*)$/);
      if(!m){i++;continue;}
      const lang=m[1],tail=m[2].trim();i++;

      if(tail==='|'){
        const r=readBlock(i,6);section[`content_${lang}`]=[{align:'left',text:r.text}];i=r.next;continue;
      }
      if(tail){section[`content_${lang}`]=[{align:'left',text:stripScalar(tail)}];continue;}

      const r=readTextList(i,6);
      section[`content_${lang}`]=r.blocks;i=r.next;
    }
  }
  return doc;
}

function glossaryDetailEsc(v){return escapeHtml(v||'').replace(/\n/g,'<br>')}
function glossaryCsvIds(value){return String(value||'').split(',').map(v=>v.trim()).filter(Boolean)}
function glossaryRelatedCard(kind,row){const href=`../${kind}/${row.url_id}.html`;if(kind==='works')return entityWorkCard(row,href);if(kind==='characters')return entityCharacterCard(row,href);if(kind==='songs')return entitySongCard(row,href);return entityGlossaryCard(row,href)}
function renderGlossaryRelatedTabs(g,works,characters,songs,glossary,lang){const root=document.getElementById('glossary-related-tabs');if(!root)return;root.innerHTML='';const defs=[['works',works,glossaryCsvIds(g.related_work_ids),{ja:'関連作品',en:'Related Works'}],['characters',characters,glossaryCsvIds(g.related_character_ids),{ja:'関連キャラクター',en:'Related Characters'}],['songs',songs,glossaryCsvIds(g.related_song_ids),{ja:'関連楽曲',en:'Related Songs'}],['glossary',glossary,glossaryCsvIds(g.related_glossary_ids),{ja:'関連用語',en:'Related Terms'}]];const available=defs.map(([kind,data,ids,label])=>[kind,data.filter(r=>ids.includes(String(r.work_id||r.character_id||r.song_id||r.term_id))),label]).filter(([,data])=>data.length);if(!available.length)return;const nav=document.createElement('div');nav.className='glossary-related-tab-list';const panels=document.createElement('div');panels.className='glossary-related-tab-panels';available.forEach(([kind,data,label],i)=>{const button=document.createElement('button');button.type='button';button.className='glossary-related-tab'+(i===0?' is-active':'');button.dataset.target=`glossary-tab-${kind}`;button.innerHTML=`<span>${lang==='en'?label.en:label.ja}</span><small>${data.length}</small>`;nav.appendChild(button);const panel=document.createElement('div');panel.id=`glossary-tab-${kind}`;panel.className='glossary-related-tab-panel'+(i===0?' is-active':'');panel.innerHTML=`<div class="glossary-detail-related">${data.map(row=>glossaryRelatedCard(kind,row)).join('')}</div>`;panels.appendChild(panel)});nav.addEventListener('click',e=>{const button=e.target.closest('.glossary-related-tab');if(!button)return;nav.querySelectorAll('.glossary-related-tab').forEach(x=>x.classList.remove('is-active'));panels.querySelectorAll('.glossary-related-tab-panel').forEach(x=>x.classList.remove('is-active'));button.classList.add('is-active');document.getElementById(button.dataset.target)?.classList.add('is-active')});root.append(nav,panels)}

function glossaryCurrentLanguage(){
  if(typeof getLanguage==='function')return getLanguage()==='en'?'en':'ja';
  return String(localStorage.getItem('kagamito-language')||'ja').toLowerCase().startsWith('en')?'en':'ja';
}

async function renderGlossaryDetail(){
  const id=document.body.dataset.glossaryId;
  const [glossary,works,characters,songs,yamlText]=await Promise.all([loadCSV('../data/glossary.csv'),loadCSV('../data/works.csv'),loadCSV('../data/characters.csv'),loadCSV('../data/songs.csv'),fetch(`../data/glossary/${id}.yaml`,{cache:'no-store'}).then(r=>{if(!r.ok)throw new Error('YAMLを読み込めませんでした');return r.text()})]);
  const g=glossary.find(x=>x.term_id===id);if(!g)throw new Error('Glossary entry not found');
  const lang=glossaryCurrentLanguage(),en=lang==='en';
  document.documentElement.lang=lang;
  const title=en?(g.term_en||g.term_ja):(g.term_ja||g.term_en);
  document.title=`${title} - Kagamito Official`;
  document.getElementById('glossary-name').textContent=title;
  document.getElementById('glossary-secondary').textContent=en?(g.term_ja||''):(g.reading_ja||'');
  renderGlossaryRelatedTabs(g,works,characters,songs,glossary,lang);

  const detail=parseGlossaryYaml(yamlText),root=document.getElementById('glossary-yaml-detail');root.innerHTML='';
  for(const section of detail.sections){
    const heading=lang==='en'?section.title_en:section.title_ja;
    const blocks=lang==='en'?section.content_en:section.content_ja;
    if(!heading&&!blocks.some(b=>String(b.text||'').trim()))continue;
    const el=document.createElement('section');el.className='glossary-detail-section';
    if(heading){const h=document.createElement('h2');h.className='glossary-detail-heading';h.textContent=heading;el.appendChild(h)}
    for(const b of blocks){if(!String(b.text||'').trim())continue;const p=document.createElement('div');p.className='glossary-detail-text';p.style.textAlign=b.align==='right'?'right':'left';p.innerHTML=glossaryDetailEsc(b.text);el.appendChild(p)}
    root.appendChild(el);
  }
  const sections=root.querySelectorAll('.glossary-detail-section');sections.forEach((section,index)=>{if(index<sections.length-1){const divider=document.createElement('div');divider.className='glossary-detail-section-divider';divider.setAttribute('aria-hidden','true');section.after(divider)}})
}

document.addEventListener('DOMContentLoaded',()=>renderGlossaryDetail().catch(e=>{console.error(e);const root=document.getElementById('glossary-yaml-detail');if(root)root.innerHTML=`<p class="glossary-detail-empty">${escapeHtml(e.message)}</p>`}));
