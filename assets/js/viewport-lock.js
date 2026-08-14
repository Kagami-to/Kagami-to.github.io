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

  function lockUnits(text){
    return text
      .replace(/(-?(?:\d+\.?\d*|\.\d+))vmin\b/gi,(m,n)=>`calc(var(--locked-viewport-vmin) * ${Number(n)/100})`)
      .replace(/(-?(?:\d+\.?\d*|\.\d+))vmax\b/gi,(m,n)=>`calc(var(--locked-viewport-vmax) * ${Number(n)/100})`)
      .replace(/(-?(?:\d+\.?\d*|\.\d+))vw\b/gi,(m,n)=>`calc(var(--locked-viewport-width) * ${Number(n)/100})`)
      .replace(/(-?(?:\d+\.?\d*|\.\d+))vh\b/gi,(m,n)=>`calc(var(--locked-viewport-height) * ${Number(n)/100})`)
      .replace(/(-?(?:\d+\.?\d*|\.\d+))dvh\b/gi,(m,n)=>`calc(var(--locked-viewport-height) * ${Number(n)/100})`);
  }

  function transformRules(rules){
    let out='';
    for(const rule of Array.from(rules)){
      try{
        if(rule.type===CSSRule.STYLE_RULE){
          const css=lockUnits(rule.cssText);
          out+=css+'\n';
        }else if(rule.type===CSSRule.MEDIA_RULE){
          // Evaluate media queries exactly once, against the initial viewport.
          // The resulting CSS no longer contains a live width-dependent media query.
          if(window.matchMedia(rule.conditionText).matches){
            out+=transformRules(rule.cssRules);
          }
        }else if(rule.cssRules){
          const inner=transformRules(rule.cssRules);
          if(rule.type===CSSRule.SUPPORTS_RULE){
            out+=`@supports ${rule.conditionText}{${inner}}\n`;
          }else if(rule.type===CSSRule.KEYFRAMES_RULE || rule.type===CSSRule.FONT_FACE_RULE){
            out+=rule.cssText+'\n';
          }else{
            out+=rule.cssText+'\n';
          }
        }else{
          out+=lockUnits(rule.cssText)+'\n';
        }
      }catch(e){
        // Leave an unprocessable rule alone rather than breaking the stylesheet.
        try{out+=rule.cssText+'\n'}catch(_e){}
      }
    }
    return out;
  }

  function processSheet(sheet){
    if(!sheet || sheet.__zoomLocked) return;
    const owner=sheet.ownerNode;
    if(!owner || owner.tagName==='STYLE' && owner.dataset.zoomLockGenerated==='true') return;
    // Do not rewrite the lock stylesheet itself.
    if(owner.tagName==='LINK' && /viewport-lock\.css(?:\?|$)/.test(owner.href||'')) return;
    let rules;
    try{rules=sheet.cssRules}catch(e){return}
    if(!rules || !rules.length) return;
    const transformed=transformRules(rules);
    const style=document.createElement('style');
    style.dataset.zoomLockGenerated='true';
    style.textContent=transformed;
    owner.parentNode.insertBefore(style,owner);
    owner.disabled=true;
    sheet.__zoomLocked=true;
  }

  function processAllSheets(){
    for(const sheet of Array.from(document.styleSheets)) processSheet(sheet);
  }

  // style.css and viewport-lock.css are already in <head> before this script.
  processAllSheets();

  // Protect dynamically inserted styles (e.g. cards/YAML-rendered components).
  const observer=new MutationObserver(()=>processAllSheets());
  observer.observe(document.head,{childList:true,subtree:true});

  // Zoom must not trigger layout recomputation. Rotation deliberately reloads,
  // taking a fresh initial viewport measurement.
  const reloadOnRotate=()=>location.reload();
  window.addEventListener('orientationchange',reloadOnRotate,{passive:true});
  if(window.screen&&window.screen.orientation){
    window.screen.orientation.addEventListener('change',reloadOnRotate,{passive:true});
  }
})();
