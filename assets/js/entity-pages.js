function urlId(v){return String(v||'').trim().toLowerCase().replace(/\./g,'-')}
function workListCard(w){return entityWorkCard(w,`/works/${urlId(w.url_id)}.html`)}
function songListCard(s){return entitySongCard(s,`/songs/${urlId(s.url_id)}.html`)}
function characterListCard(c){return entityCharacterCard(c,`/characters/${urlId(c.url_id)}.html`)}

async function renderList(kind){const cfg=kind==='characters'?{title:'Characters',csv:'/data/characters.csv'}:kind==='songs'?{title:'Songs',csv:'/data/songs.csv'}:{title:'Works',csv:'/data/works.csv'};document.title=`${cfg.title} - Kagamito Official`;document.getElementById('page-title').textContent=cfg.title;let rows=await loadCSV(cfg.csv);if(kind==='songs')rows=rows.filter(r=>(r.title_ja||'').trim()!=='');const list=document.getElementById(kind==='characters'?'character-list':'entity-list');list.innerHTML='';rows.forEach(r=>{const card=kind==='characters'?characterListCard(r):kind==='works'?workListCard(r):songListCard(r);const li=document.createElement('li');li.innerHTML=card;list.appendChild(li)})}
