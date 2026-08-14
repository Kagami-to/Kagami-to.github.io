const UI_TEXT={ja:{characters:'キャラクター',works:'作品',songs:'楽曲',alias:'二つ名',ability:'能力',abilityDetail:'能力詳細',position:'立場',themeSong:'テーマ曲',firstAppearance:'初登場作品',appearances:'登場作品',profile:'プロフィール',workImage:'作品画像',workType:'作品種別',numbering:'ナンバリング',overview:'概要',scene:'使用シーン',themeCharacter:'テーマキャラクター',youtube:'YouTube',oldVersion:'旧バージョン',englishName:'英語名',englishTitle:'英語タイトル',loading:'読み込み中...',notFound:'ページが見つかりません。',previousItem:'1つ前の項目',nextItem:'1つ後の項目'},en:{characters:'Characters',works:'Works',songs:'Songs',alias:'Alias',ability:'Ability',abilityDetail:'Ability Details',position:'Position',themeSong:'Theme Song',firstAppearance:'First Appearance',appearances:'Appearances',profile:'Profile',workImage:'Work Image',workType:'Work Type',numbering:'Numbering',overview:'Overview',scene:'Scene',themeCharacter:'Theme Character',youtube:'YouTube',oldVersion:'Older Version',englishName:'English Name',englishTitle:'English Title',loading:'Loading...',notFound:'Page not found.',previousItem:'Previous',nextItem:'Next'}};

function getLanguage(){return localStorage.getItem('kagamito-language')||((navigator.language||'').toLowerCase().startsWith('en')?'en':'ja')}
function setLanguage(lang){localStorage.setItem('kagamito-language',lang);document.documentElement.lang=lang;location.reload()}
function t(key){return(UI_TEXT[getLanguage()]||UI_TEXT.ja)[key]||key}

async function loadSiteText(){try{const rows=await loadCSV('/pages/site_text.csv');return Object.fromEntries(rows.map(r=>[r.key,getLanguage()==='en'?r.en:r.ja]))}catch(e){console.error('Failed to load site_text.csv',e);return{}}}

function applyDetailBackLinkLanguage(lang){document.querySelectorAll('.detail-back-link-ja').forEach(e=>{e.style.display=lang==='en'?'none':'inline'});document.querySelectorAll('.detail-back-link-en').forEach(e=>{e.style.display=lang==='en'?'inline':'none'})}

document.addEventListener('DOMContentLoaded',async()=>{const lang=getLanguage();document.documentElement.lang=lang;applyDetailBackLinkLanguage(lang);const siteText=await loadSiteText();document.querySelectorAll('[data-home-key]').forEach(e=>{const key=e.dataset.homeKey;if(siteText[key])e.textContent=siteText[key]})});
