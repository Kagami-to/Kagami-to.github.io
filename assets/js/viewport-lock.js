(function(){
  function apply(){
    var width=window.innerWidth||document.documentElement.clientWidth||0;
    document.documentElement.dataset.layoutMode=width<=700?'mobile':'desktop';
    document.documentElement.style.setProperty('--locked-viewport-width',width+'px');
  }
  apply();
  window.addEventListener('orientationchange',function(){ requestAnimationFrame(apply); },{passive:true});
  if(window.screen&&window.screen.orientation){window.screen.orientation.addEventListener('change',function(){requestAnimationFrame(apply);},{passive:true});}
})();
