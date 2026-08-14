(function(){
  function apply(){
    var width=window.innerWidth||document.documentElement.clientWidth||0;
    var root=document.documentElement;
    root.dataset.layoutMode=width<=700?'mobile':'desktop';
    root.style.setProperty('--locked-viewport-width',width+'px');
    root.style.width=width+'px';
    root.style.minWidth=width+'px';
    root.style.maxWidth=width+'px';
    if(document.body){
      document.body.style.width=width+'px';
      document.body.style.minWidth=width+'px';
      document.body.style.maxWidth=width+'px';
    }
  }
  apply();
  window.addEventListener('load',apply,{once:true,passive:true});
  window.addEventListener('orientationchange',function(){ requestAnimationFrame(apply); },{passive:true});
  if(window.screen&&window.screen.orientation){window.screen.orientation.addEventListener('change',function(){requestAnimationFrame(apply);},{passive:true});}
})();
