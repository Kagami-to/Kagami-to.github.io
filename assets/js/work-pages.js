const WORK_DETAIL_FIELDS=[];
function workEsc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function workVal(r,j,e){return getLanguage()==='en'?(r[e]||r[j]||''):(r[j]||r[e]||'')}
function workFitText(el){const box=el.parentElement;if(!box)return;el.style.transform='none';el.style.width='auto';el.style.whiteSpace='normal';el.style.display='block';el.style.transformOrigin='left center';const probe=el.cloneNode(true);probe.style.cssText='position:absolute;left:-100000px;top:0;visibility:hidden;transform:none;display:block;margin:0;width:auto;max-width:none;white-space:normal;overflow-wrap:break-word;word-break:normal';document.body.appendChild(probe);const computed=getComputedStyle(el);const lineHeight=parseFloat(computed.lineHeight)||parseFloat(computed.fontSize)||16;const fits=(scale,lines)=>{const targetWidth=box.clientWidth/scale;if(!targetWidth)return false;probe.style.width=`${targetWidth}px`;probe.style.maxWidth='none';const height=probe.getBoundingClientRect().height;const actualLines=Math.max(1,Math.round(height/lineHeight));return actualLines<=lines};let chosen=null;for(let lines=1;lines<=8&&!chosen;lines++){if(fits(1,lines)){chosen={scale:1};break}if(!fits(.5,lines))continue;let lo=.5,hi=1;for(let i=0;i<12;i++){const mid=(lo+hi)/2;if(fits(mid,lines))lo=mid;else hi=mid}chosen={scale:lo}}if(chosen){el.style.width=`${box.clientWidth/chosen.scale}px`;el.style.whiteSpace='normal';if(chosen.scale<.999)el.style.transform=`scaleX(${chosen.scale})`}else{el.style.width=`${box.clientWidth}px`;el.style.whiteSpace='normal'}probe.remove()}
function workFitAll(){document.querySelectorAll('.work-fit-text').forEach(workFitText)}
function workDetailHtml(row){const en=getLanguage()==='en';return WORK_DETAIL_FIELDS.map(f=>{const value=workVal(row,f.ja,f.en);if(!value)return '';const heading=en?(f.label_en||f.label_ja):(f.label_ja||f.label_en);return `<section class="work-info-section"><h2 class="work-info-label">${workEsc(heading)}</h2><div class="work-detail-content">${workEsc(value).replace(/\n/g,'<br>')}</div></section>`}).join('')}
function workCollapsible(title,items,kind){if(!items.length)return '';return `<section class="work-collapsible-section"><details class="work-collapsible"><summary><span>${workEsc(title)}</span><small>${items.length}</small></summary><div class="work-collapsible-content work-collapsible-${kind}">${items.join('')}</div></details></section>`}
function charactersForWork(workId,chars){const target=String(workId||'').trim().toUpperCase();return chars.filter(c=>String(c.appearance_work_ids||'').split(',').map(id=>id.trim().toUpperCase()).filter(Boolean).includes(target)).sort((a,b)=>String(a.character_id).localeCompare(String(b.character_id)))}
function workStoryText(value){return workEsc(value||'').replace(/\n/g,'<br>')}
function workStoryHtml(data, selectedRouteId){
  const lang=getLanguage()==='en'?'en':'ja';
  const routes=Array.isArray(data?.routes)?data.routes:[];
  const usableRoutes=routes.filter(route=>{
    const title=lang==='en'?route.title_en:route.title_ja;
    const stages=Array.isArray(route.stages)?route.stages:[];
    return title && stages.some(stage=>{
      const scenes=Array.isArray(stage.scenes)?stage.scenes:[];
      return scenes.some(scene=>(Array.isArray(scene.content)?scene.content:[]).some(item=>item && (lang==='en'?item.text_en:item.text_ja)));
    });
  });
  if(!usableRoutes.length)return '';
  const selected=usableRoutes.find(route=>String(route.id)===String(selectedRouteId))||usableRoutes[0];
  const routeButtons=usableRoutes.map(route=>{
    const title=lang==='en'?route.title_en:route.title_ja;
    return `<button type="button" class="work-story-route${route.id===selected.id?' is-active active':''}" data-story-route="${workEsc(route.id)}" aria-pressed="${route.id===selected.id?'true':'false'}">${workEsc(title)}</button>`;
  }).join('');
  const renderStage=stage=>{
    const title=lang==='en'?stage.title_en:stage.title_ja;
    const scenes=(stage.scenes||[]).map(scene=>(scene.content||[]).map(item=>{
      const text=lang==='en'?item.text_en:item.text_ja;
      if(!text)return '';
      if(item.type==='dialogue'){
        const speaker=item.speaker? `<span class="work-story-speaker">${workEsc(item.speaker)}</span>`:'';
        return `<div class="work-story-line work-story-dialogue">${speaker}<p>${workStoryText(text)}</p></div>`;
      }
      if(item.type==='flavor')return `<p class="work-story-flavor">${workStoryText(text)}</p>`;
      return '';
    }).join('')).join('');
    const heading=title?`<h3>${workEsc(title)}</h3>`:'';
    return `<section class="work-story-stage" id="work-story-stage-${workEsc(stage.id)}">${heading}${scenes}</section>`;
  };
  const prologue=(selected.stages||[]).find(stage=>Number(stage.id)===0);
  const mainStages=(selected.stages||[]).filter(stage=>Number(stage.id)!==0);
  const prologueMarkup=prologue?renderStage(prologue):'';
  const stageList=mainStages.map(stage=>{
    const title=lang==='en'?stage.title_en:stage.title_ja;
    return title?`<li><a href="#work-story-stage-${workEsc(stage.id)}">${workEsc(title)}</a></li>`:'';
  }).join('');
  const stages=mainStages.map(renderStage).join('');
  const archive=mainStages.length?`<details class="work-story-archive"><summary><span>${lang==='en'?'Contents and story':'目次・本文を開く'}</span></summary><div class="work-story-archive-content"><nav class="work-story-toc" aria-label="${lang==='en'?'Story contents':'ストーリー目次'}"><ul>${stageList}</ul></nav><div class="work-story-stages">${stages}</div></div></details>`:'';
  return `<section class="work-story-section" id="work-story"><h2 class="work-story-heading">${lang==='en'?'Story':'本編ストーリー'}</h2><div class="work-story-routes lang-buttons" role="group" aria-label="${lang==='en'?'Story route':'ストーリーのルート'}">${routeButtons}</div><div class="work-story-prologue">${prologueMarkup}</div>${archive}</section>`;
}
async function loadWorkStory(workId){
  try{
    const response=await fetch(siteDataUrl(`../data/works/${encodeURIComponent(workId)}.json`),{cache:'no-store'});
    if(!response.ok)return null;
    return await response.json();
  }catch(_){return null}
}
async function renderWork(workId){
  const [works,chars,songs]=await Promise.all([loadCSV('../data/works.csv'),loadCSV('../data/characters.csv'),loadCSV('../data/songs.csv')]);
  const w=works.find(r=>(r.work_id||'').trim()===workId),t=document.getElementById('work-page');
  if(!w){t.innerHTML='<p>Work data not found.</p>';return}
  const en=getLanguage()==='en',title=workVal(w,'title_ja','title_en'),sub=en?(w.subtitle_en||''):(w.title_en||''),synopsis=en?(w.synopsis_en||''):(w.synopsis_ja||'');
  const [cs,story]=await Promise.all([charactersForWork(workId,chars),loadWorkStory(workId)]);
  const wc=songs.filter(s=>(s.work_id||'').trim()===(w.work_id||'').trim()&&(s.title_ja||'').trim());
  const characterCards=cs.map(c=>entityCharacterCard(c,`/characters/${urlId(c.url_id)}/`));
  const songCards=wc.map(s=>entitySongCard(s,`/songs/${urlId(s.url_id)}/`));
  const img=siteAssetPath(w.image_path||w.jacket_image||''),fields=workDetailHtml(w),storyMarkup=workStoryHtml(story);
  t.innerHTML=`<div class="work-title-group"><p class="work-number">${workEsc(w.numbering||w.work_id)}</p><div class="work-fit-box"><h1 class="work-title work-fit-text">${workEsc(title)}</h1></div>${sub?`<div class="work-fit-box"><p class="work-title-sub work-fit-text">${workEsc(sub)}</p></div>`:''}</div><div class="work-jacket">${img?`<img src="${workEsc(img)}" alt="${workEsc(w.title_ja||w.title_en||'')}">`:`<div class="work-jacket-placeholder">${en?'Image coming soon':'画像準備中'}</div>`}</div>${synopsis?`<div class="work-synopsis">${workEsc(synopsis)}</div>`:''}${workCollapsible(en?'Characters':'登場キャラクター',characterCards,'characters')}${workCollapsible(en?'Songs':'使用楽曲',songCards,'songs')}<section class="work-detail-placeholder">${fields||`<p>${en?'Additional work details will be placed here.':'今後、作品に関する詳細情報をここに追加します。'}</p>`}</section><div class="work-divider"><span>◆</span></div>${storyMarkup}`;
  if(storyMarkup){
    t.addEventListener('click',event=>{
      const button=event.target.closest('[data-story-route]');
      if(!button)return;
      const routeId=button.getAttribute('data-story-route');
      const routeData=story?.routes?.find(route=>String(route.id)===routeId);
      if(!routeData)return;
      const routeTitle=en?routeData.title_en:routeData.title_ja;
      if(!routeTitle)return;
      const current=t.querySelector('#work-story');
      if(!current)return;
      const wrapper=document.createElement('div');
      wrapper.innerHTML=workStoryHtml(story,routeId);
      const next=wrapper.querySelector('#work-story');
      if(next)current.replaceWith(next);
    });
  }
  workFitAll();window.__workFitReady=true;
}

window.addEventListener('orientationchange',()=>setTimeout(workFitAll,150));
