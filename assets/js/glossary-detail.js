const GLOSSARY_DETAIL_CATEGORIES={place:{ja:'地名・施設・場所',en:'Places'},organization:{ja:'組織',en:'Organizations'},item:{ja:'道具・物品',en:'Items'},concept:{ja:'概念',en:'Concepts'},other:{ja:'その他'}};

// Glossary YAML parser. This intentionally supports the small, explicit YAML subset used by glossary/*.yaml.
// It parses sections, optional titles, and either scalar content blocks or aligned text-block arrays.
function parseGlossaryYaml(text){
  const lines=String(text||'').replace(/\r/g,'').split('\n');
  const result={id:'',sections:[]};
  let i=0;
  const indentOf=line=>{const m=line.match(/^ */);return m?m[0].length:0};
  const nonEmpty=line=>line.trim()!=='';
  const readBlockScalar=(start,minIndent)=>{
    const out=[];let j=start;
    while(j<lines.length){
      const line=lines[j];
      if(nonEmpty(line)&&indentOf(line)<minIndent)break;
      out.push(line===''?'':line.slice(Math.min(minIndent,line.length)));
      j++;
    }
    while(out.length&&out[out.length-1]==='')out.pop();
    return {text:out.join('\n'),next:j};
  };
  while(i<lines.length){
    const line=lines[i],trim=line.trim();
    if(!trim||trim.startsWith('#')){i++;continue}
    let m=line.match(/^id:\s*(.*)$/);
    if(m){result.id=m[1].trim();i++;continue}
    m=line.match(/^  -\s*(.*)$/);
    if(!m){i++;continue}
    const section={title_ja:'',title_en:'',content_ja:[],content_en:[]};
    result.sections.push(section);
    i++;
    while(i<lines.length){
      const current=lines[i],t=current.trim();
      if(!t||t.startsWith('#')){i++;continue}
      if(/^  -\s*/.test(current))break;
      let km=current.match(/^    (title_ja|title_en):\s*(.*)$/);
      if(km){section[km[1]]=km[2].trim();i++;continue}
      km=current.match(/^    content_(ja|en):\s*(.*)$/);
      if(km){
        const lang=km[1],value=km[2].trim();i++;
        if(value==='|'){
          const b=readBlockScalar(i,6);
          section[`content_${lang}`].push({align:'left',text:b.text});
          i=b.next;continue;
        }
        if(value!==''){section[`content_${lang}`].push({align:'left',text:value});continue}
        // Array form:
        // content_ja:
        //   - align: left
        //     text: |
        //       ...
        while(i<lines.length){
          const item=lines[i];
          if(!item.trim()){i++;continue}
          if(/^  -\s*/.test(item)||/^    (title_ja|title_en|content_(ja|en)):\s*/.test(item))break;
          const am=item.match(/^      -\s+align:\s*(left|right)\s*$/);
          if(!am){i++;continue}
          const block={align:am[1],text:''};i++;
          while(i<lines.length&&!/^      -\s+align:\s*(left|right)\s*$/.test(lines[i])&&!/^  -\s*/.test(lines[i])){
            const textLine=lines[i];
            const tm=textLine.match(/^        text:\s*\|\s*$/);
            if(tm){
              i++;
              const b=readBlockScalar(i,10);
              block.text=b.text;i=b.next;continue;
            }
            i++;
          }
          section[`content_${lang}`].push(block);
        }
        continue;
      }
      i++;
    }
  }
  return result;
}

function glossaryDetailEsc(v){return escapeHtml(v||'').replace(/\n/g,'<br>')}
function glossaryCsvIds(value){return String(value||'').split(',').map(v=>v.trim()).filter(Boolean)}
function glossaryRelatedCard(kind,row){const href=`../${kind}/${row.url_id}.html`;if(kind==='works')return entityWorkCard(row,href);if(kind==='characters')return entityCharacterCard(row,href);if(kind==='songs')return entitySongCard(row,href);return entityGlossaryCard(row,href)}
function renderGlossaryRelatedTabs(g,works,characters,songs,glossary,en){const root=document.getElementById('glossary-related-tabs');if(!root)return;root.innerHTML='';const defs=[['works',works,glossaryCsvIds(g.related_work_ids),{ja:'関連作品',en:'Related Works'}],['characters',characters,glossaryCsvIds(g.related_character_ids),{ja:'関連キャラクター',en:'Related Characters'}],['songs',songs,glossaryCsvIds(g.related_song_ids),{ja:'関連楽曲',en:'Related Songs'}],['glossary',glossary,glossaryCsvIds(g.related_glossary_ids),{ja:'関連用語',en:'Related Terms'}]];const available=defs.map(([kind,data,ids,label])=>[kind,data.filter(r=>ids.includes(String(r.work_id||r.character_id||r.song_id||r.term_id))),label]).filter(([,data])=>data.length);if(!available.length)return;const nav=document.createElement('div');nav.className='glossary-related-tab-list';const panels=document.createElement('div');panels.className='glossary-related-tab-panels';available.forEach(([kind,data,label],i)=>{const button=document.createElement('button');button.type='button';button.className='glossary-related-tab'+(i===0?' is-active':'');button.dataset.target=`glossary-tab-${kind}`;button.innerHTML=`<span>${en?label.en:label.ja}</span><small>${data.length}</small>`;nav.appendChild(button);const panel=document.createElement('div');panel.id=`glossary-tab-${kind}`;panel.className='glossary-related-tab-panel'+(i===0?' is-active':'');panel.innerHTML=`<div class="glossary-detail-related">${data.map(row=>glossaryRelatedCard(kind,row)).join('')}</div>`;panels.appendChild(panel)});nav.addEventListener('click',e=>{const button=e.target.closest('.glossary-related-tab');if(!button)return;nav.querySelectorAll('.glossary-related-tab').forEach(x=>x.classList.remove('is-active'));panels.querySelectorAll('.glossary-related-tab-panel').forEach(x=>x.classList.remove('is-active'));button.classList.add('is-active');document.getElementById(button.dataset.target)?.classList.add('is-active')});root.append(nav,panels)}
async function renderGlossaryDetail(){const id=document.body.dataset.glossaryId;const [glossary,works,characters,songs,yamlText]=await Promise.all([loadCSV('../data/glossary.csv'),loadCSV('../data/works.csv'),loadCSV('../data/characters.csv'),loadCSV('../data/songs.csv'),fetch(`../data/glossary/${id}.yaml`,{cache:'no-store'}).then(r=>{if(!r.ok)throw new Error('YAMLを読み込めませんでした');return r.text()})]);const g=glossary.find(x=>x.term_id===id);if(!g)throw new Error('Glossary entry not found');const en=getLanguage()==='en';document.documentElement.lang=en?'en':'ja';document.title=`${en?(g.term_en||g.term_ja):(g.term_ja||g.term_en)} - Kagamito Official`;document.getElementById('glossary-name').textContent=en?(g.term_en||g.term_ja):(g.term_ja||g.term_en);document.getElementById('glossary-secondary').textContent=en?(g.term_ja||''):(g.reading_ja||'');renderGlossaryRelatedTabs(g,works,characters,songs,glossary,en);const detail=parseGlossaryYaml(yamlText),root=document.getElementById('glossary-yaml-detail');root.innerHTML='';for(const section of detail.sections){const blocks=section[`content_${en?'en':'ja'}`]||[];if(!blocks.some(b=>String(b.text||'').trim()))continue;const el=document.createElement('section');el.className='glossary-detail-section';if(section.title_ja||section.title_en){const h=document.createElement('h2');h.className='glossary-detail-heading';h.textContent=en?(section.title_en||section.title_ja):(section.title_ja||section.title_en);el.appendChild(h)}for(const b of blocks){if(!String(b.text||'').trim())continue;const p=document.createElement('div');p.className='glossary-detail-text';p.style.textAlign=b.align==='right'?'right':'left';p.innerHTML=glossaryDetailEsc(b.text);el.appendChild(p)}root.appendChild(el)}
const sections=root.querySelectorAll('.glossary-detail-section');sections.forEach((section,index)=>{if(index<sections.length-1){const divider=document.createElement('div');divider.className='glossary-detail-section-divider';divider.setAttribute('aria-hidden','true');section.after(divider)}})}
document.addEventListener('DOMContentLoaded',()=>renderGlossaryDetail().catch(e=>{const root=document.getElementById('glossary-yaml-detail');if(root)root.innerHTML=`<p class="glossary-detail-empty">${escapeHtml(e.message)}</p>`}));
