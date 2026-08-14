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
  const reloadOnRotate=()=>location.reload();
  window.addEventListener('orientationchange',reloadOnRotate,{passive:true});
  if(window.screen&&window.screen.orientation)window.screen.orientation.addEventListener('change',reloadOnRotate,{passive:true});
})();
