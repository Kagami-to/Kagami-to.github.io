function parseCSV(text){const rows=[];let row=[],field='',quoted=false;for(let i=0;i<text.length;i++){const c=text[i];if(quoted){if(c==='"'){if(text[i+1]==='"'){field+='"';i++}else quoted=false}else field+=c}else if(c==='"')quoted=true;else if(c===','){row.push(field);field=''}else if(c==='\n'){row.push(field);rows.push(row);row=[];field=''}else if(c!=='\r')field+=c}if(field.length||row.length){row.push(field);rows.push(row)}const headers=(rows.shift()||[]).map(v=>v.trim());return rows.filter(r=>r.some(v=>v.trim()!=='')).map(r=>Object.fromEntries(headers.map((h,i)=>[h,(r[i]??'').trim()])))}
async function loadCharacterCSV(path){const r=await fetch(path,{cache:'no-store'});if(!r.ok)throw new Error(`CSVを読み込めませんでした (${r.status})`);return parseCSV(await r.text())}
function escapeHtml(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function characterIds(v){return String(v||'').split(/[、,;\s]+/).filter(Boolean)}
function characterUrl(v){return String(v||'').trim().toLowerCase().replace(/\./g,'-')}
function characterValue(row,ja,en){return getLanguage()==='en'?(row[en]||''):(row[ja]||'')}
function characterRelatedCard(h,main,sub='',type='work'){const cls=type==='song'?'character-092-song-card':'character-092-work-card';return `<a class="${cls}" href="${escapeHtml(h)}"><div class="character-092-card-title">${escapeHtml(main)}</div>${sub?`<div class="character-092-card-subtitle">${escapeHtml(sub)}</div>`:''}</a>`}
function characterSongCard(s){const main=characterValue(s,'title_ja','title_en')||s.song_id;const sub=getLanguage()==='en'?(s.title_ja||''):(s.title_en||'');return characterRelatedCard(`../songs/${characterUrl(s.url_id)}.html`,main,sub,'song')}
function characterWorkCard(w){const main=characterValue(w,'title_ja','title_en')||w.work_id;const sub=getLanguage()==='en'?(w.title_ja||''):(w.title_en||'');return characterRelatedCard(`../works/${characterUrl(w.url_id)}.html`,main,sub,'work')}
function characterFit(el){const box=el.parentElement;if(!box)return;el.style.transform='none';el.style.width='auto';el.style.whiteSpace='nowrap';const probe=el.cloneNode(true);probe.style.cssText='position:absolute;left:-100000px;visibility:hidden;white-space:nowrap;width:max-content;transform:none';document.body.appendChild(probe);const natural=probe.getBoundingClientRect().width;probe.remove();const available=box.clientWidth;if(!available||natural<=available)return;const scale=available/natural;if(scale>=0.5)el.style.transform=`scaleX(${scale})`;else{el.style.width='100%';el.style.whiteSpace='normal'}}
function characterFitAll(){document.querySelectorAll('.character-092-fit-text').forEach(characterFit)}
function characterSetSection(id,headingKey,value){const section=document.getElementById(id+'-section');if(!section)return;section.style.display=value?'':'none';if(value){document.getElementById(id+'-heading').textContent=t(headingKey);document.getElementById(id).innerHTML=escapeHtml(value).replace(/\n/g,'<br>')}}
function characterSetRelated(targetId,sectionId,items,renderer){const section=document.getElementById(sectionId);const target=document.getElementById(targetId);if(!section||!target)return;target.innerHTML=items.map(x=>`<div>${renderer(x)}</div>`).join('');section.style.display=items.length?'':'none'}
async function renderCharacter(id){
  const [characters,songs,works]=await Promise.all([loadCharacterCSV('../data/characters.csv'),loadCharacterCSV('../data/songs.csv'),loadCharacterCSV('../data/works.csv')]);
  const c=characters.find(x=>characterUrl(x.url_id)===characterUrl(id));
  if(!c)throw new Error(t('notFound'));
  const en=getLanguage()==='en';
  const name=en?(c.name_en||''):(c.name_ja||'');
  document.documentElement.lang=en?'en':'ja';
  document.title=`${name} - Kagamito Official`;
  const epithet=en?(c.epithet_en||''):(c.epithet_ja||'');
  const secondary=en?(c.name_ja||''):'';
  const reading=en?'':(c.reading_ja||'');
  const ability=en?(c.ability_en||''):(c.ability_ja||'');
  const abilityDetail=en?(c.ability_detail_en||''):(c.ability_detail_ja||'');
  const position=en?(c.position_en||''):(c.position_ja||'');
  const profile=en?(c.profile_en||''):(c.profile_ja||'');
  const themeIds=characterIds(c.theme_song_ids);
  const themes=themeIds.map(songId=>songs.find(s=>s.song_id===songId)).filter(Boolean);
  const workIds=characterIds(c.appearance_work_ids);
  if(c.debut_work_id&&!workIds.includes(c.debut_work_id))workIds.unshift(c.debut_work_id);
  const appearances=workIds.map(workId=>works.find(w=>w.work_id===workId)).filter(Boolean);

  document.getElementById('character-epithet').textContent=epithet;
  document.getElementById('character-name').textContent=name;
  document.getElementById('character-secondary').textContent=secondary;
  document.getElementById('character-reading').textContent=reading;
  document.getElementById('character-secondary-wrap').style.display=secondary?'':'none';
  document.getElementById('character-reading-wrap').style.display=reading?'':'none';
  document.getElementById('character-ability').textContent=ability;
  document.getElementById('character-ability-wrap').style.display=ability||abilityDetail?'':'none';
  const detailEl=document.getElementById('character-ability-detail');
  if(detailEl){detailEl.textContent=abilityDetail;detailEl.style.display=abilityDetail?'':'none'}
  characterSetRelated('character-songs','character-song-section',themes,characterSongCard);

  const portrait=document.getElementById('character-portrait');
  portrait.querySelector('img')?.remove();
  const imagePath=String(c.appearance_image||'').trim();
  portrait.classList.toggle('has-image',Boolean(imagePath));
  const portraitLabel=document.getElementById('character-portrait-label');
  portraitLabel.textContent=imagePath?(en?'IMAGE':'画像'):(en?'IMAGE COMING SOON':'画像準備中');
  if(imagePath){
    const img=document.createElement('img');
    img.src=/^(\/|https?:)/i.test(imagePath)?imagePath:`../${imagePath}`;
    img.alt=name;
    portrait.insertBefore(img,portrait.firstChild);
    img.addEventListener('error',()=>{
      portrait.classList.remove('has-image');
      portraitLabel.textContent=en?'IMAGE COMING SOON':'画像準備中';
      img.remove();
    });
  }

  characterSetSection('character-position','position',position);
  characterSetSection('character-profile','profile',profile);
  document.getElementById('character-works-heading').textContent=t('appearances');
  characterSetRelated('character-works','character-works-section',appearances,characterWorkCard);
  characterFitAll();
}
