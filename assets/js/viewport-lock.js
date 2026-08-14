(function(){
  const root=document.documentElement;
  const initialWidth=window.innerWidth||root.clientWidth||0;
  const initialHeight=window.innerHeight||root.clientHeight||0;
  const vmin=Math.min(initialWidth,initialHeight);
  const vmax=Math.max(initialWidth,initialHeight);

  function setLockedValues(){
    root.dataset.layoutMode=initialWidth<=700?'mobile':'desktop';
    root.style.setProperty('--locked-viewport-width',initialWidth+'px');
    root.style.setProperty('--locked-viewport-height',initialHeight+'px');
    root.style.setProperty('--locked-viewport-vmin',vmin+'px');
    root.style.setProperty('--locked-viewport-vmax',vmax+'px');
    root.style.width=initialWidth+'px';
    root.style.minWidth=initialWidth+'px';
    root.style.maxWidth=initialWidth+'px';
    if(document.body){
      document.body.style.width=initialWidth+'px';
      document.body.style.minWidth=initialWidth+'px';
      document.body.style.maxWidth=initialWidth+'px';
    }
  }

  function transformUnits(css){
    css=css.replace(/(-?(?:\d+\.?\d*|\.\d+))vmin\b/gi,(m,n)=>`calc(var(--locked-viewport-vmin) * ${Number(n)/100})`);
    css=css.replace(/(-?(?:\d+\.?\d*|\.\d+))vmax\b/gi,(m,n)=>`calc(var(--locked-viewport-vmax) * ${Number(n)/100})`);
    css=css.replace(/(-?(?:\d+\.?\d*|\.\d+))vw\b/gi,(m,n)=>`calc(var(--locked-viewport-width) * ${Number(n)/100})`);
    css=css.replace(/(-?(?:\d+\.?\d*|\.\d+))vh\b/gi,(m,n)=>`calc(var(--locked-viewport-height) * ${Number(n)/100})`);
    return css;
  }

  function transformMedia(css){
    return css
      .replace(/@media\s*\(\s*max-width\s*:\s*([0-9.]+)px\s*\)/gi,(m,n)=>Number(n)>=initialWidth?'@media all':'@media not all')
      .replace(/@media\s*\(\s*min-width\s*:\s*([0-9.]+)px\s*\)/gi,(m,n)=>Number(n)<=initialWidth?'@media all':'@media not all');
  }

  async function freezeStyles(){
    const links=[...document.querySelectorAll('link[rel="stylesheet"][href]')];
    for(const link of links){
      try{
        const url=new URL(link.href,location.href);
        if(url.origin!==location.origin)continue;
        const response=await fetch(url.href,{cache:'force-cache'});
        if(!response.ok)continue;
        const text=await response.text();
        const style=document.createElement('style');
        style.dataset.viewportLocked='true';
        style.textContent=transformMedia(transformUnits(text));
        link.disabled=true;
        link.insertAdjacentElement('afterend',style);
      }catch(e){console.warn('Viewport lock skipped stylesheet:',e)}
    }
  }

  setLockedValues();
  freezeStyles();

  const reloadOnRotate=()=>location.reload();
  window.addEventListener('orientationchange',reloadOnRotate,{passive:true});
  if(window.screen&&window.screen.orientation){window.screen.orientation.addEventListener('change',reloadOnRotate,{passive:true});}
})();
