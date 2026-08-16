function escapeHtml(v){return String(v??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]))}
function characterIds(v){return String(v||'').split(/[、,;\s]+/).filter(Boolean)}
function urlId(v){return String(v||'').trim().toLowerCase().replace(/\./g,'-')}
function characterValue(row,ja,en){return getLanguage()==='en'?(row[en]||''):(row[ja]||'')}

(function loadDetailTitleFitAssets(){
  const path=location.pathname;
  if(!/\/(works|characters|songs|glossary)\/[^/]+\.html$/i.test(path))return;
  const source=document.currentScript;
  if(!source)return;
  const base=new URL('.',source.src);
  const css=document.createElement('link');
  css.rel='stylesheet';
  css.href=new URL('../css/detail-title-fit.css',base).href;
  document.head.appendChild(css);
  const script=document.createElement('script');
  script.src=new URL('detail-title-fit.js',base).href;
  script.defer=true;
  document.head.appendChild(script);
})();
